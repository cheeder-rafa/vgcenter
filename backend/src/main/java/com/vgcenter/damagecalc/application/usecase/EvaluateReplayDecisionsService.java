package com.vgcenter.damagecalc.application.usecase;

import com.vgcenter.damagecalc.application.port.MoveRepository;
import com.vgcenter.damagecalc.application.port.PokedexRepository;
import com.vgcenter.damagecalc.domain.mega.MegaForm;
import com.vgcenter.damagecalc.domain.model.Nature;
import com.vgcenter.damagecalc.domain.model.PokemonSpecies;
import com.vgcenter.damagecalc.domain.model.Sp;
import com.vgcenter.damagecalc.domain.model.Type;
import com.vgcenter.damagecalc.domain.replay.ReplayBoardState;
import com.vgcenter.damagecalc.domain.replay.ReplayBoostState;
import com.vgcenter.damagecalc.domain.replay.ReplayEvent;
import com.vgcenter.damagecalc.domain.replay.ReplayPokemonState;
import com.vgcenter.damagecalc.domain.replay.ReplaySideState;
import com.vgcenter.damagecalc.domain.replay.ReplayTimeline;
import com.vgcenter.damagecalc.domain.replay.ReplayTurn;
import java.text.Normalizer;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Objects;

public final class EvaluateReplayDecisionsService implements EvaluateReplayDecisionsUseCase {

    private static final int VGC_LEVEL = 50;
    private static final int MAX_ALTERNATIVES = 5;
    private static final Sp ZERO_SP = new Sp(0, 0, 0, 0, 0, 0);

    private final PokedexRepository pokedexRepository;
    private final MoveRepository moveRepository;
    private final CalculateDamageUseCase calculateDamageUseCase;

    public EvaluateReplayDecisionsService(
            PokedexRepository pokedexRepository,
            MoveRepository moveRepository,
            CalculateDamageUseCase calculateDamageUseCase) {
        this.pokedexRepository = pokedexRepository;
        this.moveRepository = moveRepository;
        this.calculateDamageUseCase = calculateDamageUseCase;
    }

    @Override
    public EvaluateReplayDecisionsResult evaluate(EvaluateReplayDecisionsCommand command) {
        Map<String, ResolvedSpecies> speciesLookup = speciesLookup(command.regulation());
        Map<String, MoveDefinition> moveLookup = moveLookup(command.regulation());

        List<ReplayGameReview> games = new ArrayList<>();
        for (int index = 0; index < command.timelines().size(); index++) {
            ReplayTimeline timeline = command.timelines().get(index);
            Map<String, List<MoveDefinition>> observedMoves =
                    observedMovesForTimeline(timeline, speciesLookup, moveLookup);
            List<TurnReview> reviews = timeline.turns().stream()
                    .map(turn -> reviewTurn(
                            command.regulation(), turn, observedMoves, speciesLookup, moveLookup, command.objective()))
                    .toList();
            games.add(new ReplayGameReview(index + 1, timeline.winner(), reviews));
        }
        return new EvaluateReplayDecisionsResult(games, adaptationFlags(command.timelines()));
    }

    private TurnReview reviewTurn(
            String regulation,
            ReplayTurn turn,
            Map<String, List<MoveDefinition>> observedMoves,
            Map<String, ResolvedSpecies> speciesLookup,
            Map<String, MoveDefinition> moveLookup,
            ReplayScoringWeights weights) {
        ReplayBoardState board = turn.boardStateAtStart();
        List<ResolvedCombatant> myActives = board.sideA().activePokemon().stream()
                .map(pokemon -> resolveCombatant(pokemon, speciesLookup))
                .filter(Objects::nonNull)
                .toList();
        List<ResolvedCombatant> opponentActives = board.sideB().activePokemon().stream()
                .map(pokemon -> resolveCombatant(pokemon, speciesLookup))
                .filter(Objects::nonNull)
                .toList();

        SideConditionsCommand mySide = toSideConditions(board.sideA());
        SideConditionsCommand opponentSide = toSideConditions(board.sideB());
        FieldCommand field = new FieldCommand(board.weather(), board.terrain(), "none");

        List<ResolvedAction> actualOpponentActions = actualActions(
                turn.events(), board.sideB(), opponentActives, myActives, observedMoves, moveLookup, false);
        List<ResolvedAction> actualPlayedActions = actualActions(
                turn.events(), board.sideA(), myActives, opponentActives, observedMoves, moveLookup, true);

        ReplayDecisionLine played =
                scoreLine(regulation, actualPlayedActions, actualOpponentActions, field, mySide, opponentSide, weights);

        List<List<ResolvedAction>> choicesByActor = new ArrayList<>();
        for (ResolvedCombatant attacker : myActives) {
            choicesByActor.add(candidateActions(
                    attacker, opponentActives, observedMoves.getOrDefault(attacker.slotId(), List.of())));
        }

        List<ReplayDecisionLine> ranked =
                enumerateLines(regulation, choicesByActor, actualOpponentActions, field, mySide, opponentSide, weights)
                        .stream()
                        .filter(line -> !sameLine(line, played))
                        .sorted(Comparator.comparingDouble(ReplayDecisionLine::score)
                                .reversed())
                        .limit(MAX_ALTERNATIVES)
                        .toList();

        double bestScore = ranked.isEmpty()
                ? played.score()
                : Math.max(played.score(), ranked.getFirst().score());
        double delta = round(bestScore - played.score());
        String verdict = verdict(delta);
        String narrative = narrative(played, ranked, delta);
        return new TurnReview(turn.number(), played, ranked, delta, verdict, narrative);
    }

    private List<ReplayDecisionLine> enumerateLines(
            String regulation,
            List<List<ResolvedAction>> choicesByActor,
            List<ResolvedAction> opponentActions,
            FieldCommand field,
            SideConditionsCommand mySide,
            SideConditionsCommand opponentSide,
            ReplayScoringWeights weights) {
        List<ReplayDecisionLine> lines = new ArrayList<>();
        enumerateLinesRecursive(
                regulation,
                choicesByActor,
                0,
                new ArrayList<>(),
                lines,
                opponentActions,
                field,
                mySide,
                opponentSide,
                weights);
        return lines;
    }

    private void enumerateLinesRecursive(
            String regulation,
            List<List<ResolvedAction>> choicesByActor,
            int index,
            List<ResolvedAction> current,
            List<ReplayDecisionLine> lines,
            List<ResolvedAction> opponentActions,
            FieldCommand field,
            SideConditionsCommand mySide,
            SideConditionsCommand opponentSide,
            ReplayScoringWeights weights) {
        if (index == choicesByActor.size()) {
            lines.add(scoreLine(regulation, current, opponentActions, field, mySide, opponentSide, weights));
            return;
        }
        for (ResolvedAction action : choicesByActor.get(index)) {
            current.add(action);
            enumerateLinesRecursive(
                    regulation,
                    choicesByActor,
                    index + 1,
                    current,
                    lines,
                    opponentActions,
                    field,
                    mySide,
                    opponentSide,
                    weights);
            current.removeLast();
        }
    }

    private ReplayDecisionLine scoreLine(
            String regulation,
            List<ResolvedAction> myActions,
            List<ResolvedAction> opponentActions,
            FieldCommand field,
            SideConditionsCommand mySide,
            SideConditionsCommand opponentSide,
            ReplayScoringWeights weights) {
        double dealt = 0.0d;
        double taken = 0.0d;
        int kos = 0;
        int faints = 0;
        double koProbability = 0.0d;
        double faintProbability = 0.0d;

        for (ResolvedAction action : myActions) {
            if (!action.canCalculate()) {
                continue;
            }
            CalculateDamageResult result = calculateDamageUseCase.calculate(new CalculateDamageCommand(
                    regulation,
                    action.attacker().command(),
                    action.target().command(),
                    toMoveCommand(action.move()),
                    field,
                    mySide,
                    opponentSide,
                    false,
                    1));
            dealt += expectedDamage(result);
            if (isKo(result, action.target().command())) {
                kos++;
            }
            koProbability += result.koChance().probability();
        }

        for (ResolvedAction action : opponentActions) {
            if (!action.canCalculate()) {
                continue;
            }
            CalculateDamageResult result = calculateDamageUseCase.calculate(new CalculateDamageCommand(
                    regulation,
                    action.attacker().command(),
                    action.target().command(),
                    toMoveCommand(action.move()),
                    field,
                    opponentSide,
                    mySide,
                    false,
                    1));
            taken += expectedDamage(result);
            if (isKo(result, action.target().command())) {
                faints++;
            }
            faintProbability += result.koChance().probability();
        }

        double score = weights.damageDealtWeight() * dealt
                - weights.damageTakenWeight() * taken
                + weights.koBonus() * koProbability
                - weights.faintPenalty() * faintProbability;
        return new ReplayDecisionLine(
                myActions.stream().map(ResolvedAction::toChoice).toList(),
                round(score),
                round(dealt),
                round(taken),
                kos,
                faints);
    }

    private List<ResolvedAction> actualActions(
            List<ReplayEvent> events,
            ReplaySideState actingSide,
            List<ResolvedCombatant> attackers,
            List<ResolvedCombatant> defenders,
            Map<String, List<MoveDefinition>> observedMoves,
            Map<String, MoveDefinition> moveLookup,
            boolean userSide) {
        Map<String, ResolvedCombatant> attackersBySlot = attackers.stream()
                .collect(java.util.stream.Collectors.toMap(ResolvedCombatant::slotId, value -> value));
        Map<String, ResolvedCombatant> defendersBySlot = defenders.stream()
                .collect(java.util.stream.Collectors.toMap(ResolvedCombatant::slotId, value -> value));
        List<ResolvedAction> actions = new ArrayList<>();

        for (ReplayEvent event : events) {
            if (!"move".equals(event.type()) || event.arguments().size() < 2) {
                continue;
            }
            String actorSlot = slotId(event.arguments().getFirst());
            if (!actorSlot.startsWith(userSide ? "p1" : "p2")) {
                continue;
            }
            ResolvedCombatant attacker = attackersBySlot.get(actorSlot);
            if (attacker == null) {
                continue;
            }
            String moveName = event.arguments().get(1);
            MoveDefinition move = moveLookup.get(normalizeKey(moveName));
            if (move == null) {
                move = observedMoves.getOrDefault(actorSlot, List.of()).stream()
                        .filter(candidate -> candidate.name().equalsIgnoreCase(moveName))
                        .findFirst()
                        .orElse(null);
            }
            String targetSlot =
                    event.arguments().size() >= 3 ? slotId(event.arguments().get(2)) : null;
            ResolvedCombatant target = targetSlot == null ? null : defendersBySlot.get(targetSlot);
            actions.add(new ResolvedAction(attacker, move, target));
        }
        return actions;
    }

    private List<ResolvedAction> candidateActions(
            ResolvedCombatant attacker, List<ResolvedCombatant> defenders, List<MoveDefinition> moves) {
        List<ResolvedAction> actions = new ArrayList<>();
        for (MoveDefinition move : moves) {
            if (move.basePower() > 0) {
                for (ResolvedCombatant defender : defenders) {
                    actions.add(new ResolvedAction(attacker, move, defender));
                }
            } else {
                actions.add(new ResolvedAction(attacker, move, attacker));
            }
        }
        if (actions.isEmpty()) {
            actions.add(new ResolvedAction(attacker, null, null));
        }
        return actions;
    }

    private ResolvedCombatant resolveCombatant(ReplayPokemonState pokemon, Map<String, ResolvedSpecies> speciesLookup) {
        ResolvedSpecies resolvedSpecies = speciesLookup.get(normalizeKey(pokemon.speciesName()));
        if (resolvedSpecies == null) {
            return null;
        }
        com.vgcenter.damagecalc.domain.model.Combatant combatant = resolvedSpecies.toCombatant();
        int currentHp = Math.max(1, (int)
                Math.round(combatant.stats().hp() * pokemon.hpCurrent() / (double) Math.max(1, pokemon.hpMax())));
        return new ResolvedCombatant(
                pokemon.slotId(),
                pokemon.speciesName(),
                new CombatantCommand(
                        VGC_LEVEL,
                        new StatsCommand(
                                combatant.stats().hp(),
                                combatant.stats().attack(),
                                combatant.stats().defense(),
                                combatant.stats().specialAttack(),
                                combatant.stats().specialDefense(),
                                combatant.stats().speed()),
                        combatant.types().stream().map(Type::name).toList(),
                        resolvedSpecies.abilityId(),
                        "none",
                        mapShowdownStatus(pokemon.status()),
                        toStages(pokemon.boosts()),
                        combatant.grounded(),
                        currentHp));
    }

    private Map<String, Integer> toStages(ReplayBoostState boosts) {
        Map<String, Integer> stages = new LinkedHashMap<>();
        stages.put("atk", boosts.attack());
        stages.put("def", boosts.defense());
        stages.put("spa", boosts.specialAttack());
        stages.put("spd", boosts.specialDefense());
        stages.put("spe", boosts.speed());
        stages.put("accuracy", boosts.accuracy());
        stages.put("evasion", boosts.evasion());
        return stages;
    }

    private static String mapShowdownStatus(String rawStatus) {
        if (rawStatus == null) {
            return "none";
        }
        return switch (rawStatus.toLowerCase(java.util.Locale.ROOT)) {
            case "brn" -> "BURN";
            case "par" -> "PARALYSIS";
            // sleep, freeze, poison, and toxic are not modelled in the damage formula
            case "slp", "frz", "psn", "tox" -> "none";
            default -> "none";
        };
    }

    private SideConditionsCommand toSideConditions(ReplaySideState side) {
        return new SideConditionsCommand(
                side.reflect(), side.lightScreen(), side.auroraVeil(), false, false, side.tailwind(), false);
    }

    private MoveCommand toMoveCommand(MoveDefinition move) {
        return new MoveCommand(
                move.type(),
                move.category(),
                move.basePower(),
                move.spread(),
                move.contact(),
                move.doublePowerWhenUserStatused(),
                move.ignoreBurnPenaltyWhenUserStatused());
    }

    private Map<String, ResolvedSpecies> speciesLookup(String regulation) {
        Map<String, ResolvedSpecies> lookup = new LinkedHashMap<>();
        for (PokemonSpecies species : pokedexRepository.findAllByRegulation(regulation)) {
            lookup.putIfAbsent(
                    normalizeKey(species.id()),
                    new ResolvedSpecies(species, null, species.abilityIds().getFirst()));
            lookup.putIfAbsent(
                    normalizeKey(species.name()),
                    new ResolvedSpecies(species, null, species.abilityIds().getFirst()));
            for (MegaForm megaForm : species.megaForms()) {
                ResolvedSpecies resolved = new ResolvedSpecies(species, megaForm.id(), megaForm.abilityId());
                lookup.putIfAbsent(normalizeKey(megaForm.id()), resolved);
                lookup.putIfAbsent(normalizeKey(megaForm.name()), resolved);
            }
        }
        return lookup;
    }

    private Map<String, MoveDefinition> moveLookup(String regulation) {
        Map<String, MoveDefinition> lookup = new LinkedHashMap<>();
        for (MoveDefinition move : moveRepository.findDefinitionsByRegulation(regulation)) {
            lookup.putIfAbsent(normalizeKey(move.id()), move);
            lookup.putIfAbsent(normalizeKey(move.name()), move);
        }
        return lookup;
    }

    private Map<String, List<MoveDefinition>> observedMovesForTimeline(
            ReplayTimeline timeline,
            Map<String, ResolvedSpecies> speciesLookup,
            Map<String, MoveDefinition> moveLookup) {
        Map<String, LinkedHashSet<MoveDefinition>> movesBySlot = new LinkedHashMap<>();

        for (ReplayTurn turn : timeline.turns()) {
            for (ReplayPokemonState pokemon : turn.boardStateAtStart().sideA().activePokemon()) {
                registerSpeciesMoves(movesBySlot, pokemon.slotId(), pokemon.speciesName(), speciesLookup, moveLookup);
            }
            for (ReplayPokemonState pokemon : turn.boardStateAtStart().sideB().activePokemon()) {
                registerSpeciesMoves(movesBySlot, pokemon.slotId(), pokemon.speciesName(), speciesLookup, moveLookup);
            }
            for (ReplayEvent event : turn.events()) {
                if (!"move".equals(event.type()) || event.arguments().size() < 2) {
                    continue;
                }
                String slotId = slotId(event.arguments().getFirst());
                MoveDefinition move =
                        moveLookup.get(normalizeKey(event.arguments().get(1)));
                if (slotId != null && move != null) {
                    movesBySlot
                            .computeIfAbsent(slotId, ignored -> new LinkedHashSet<>())
                            .add(move);
                }
            }
        }

        Map<String, List<MoveDefinition>> result = new LinkedHashMap<>();
        for (Map.Entry<String, LinkedHashSet<MoveDefinition>> entry : movesBySlot.entrySet()) {
            result.put(entry.getKey(), List.copyOf(entry.getValue()));
        }
        return result;
    }

    private void registerSpeciesMoves(
            Map<String, LinkedHashSet<MoveDefinition>> movesBySlot,
            String slotId,
            String speciesName,
            Map<String, ResolvedSpecies> speciesLookup,
            Map<String, MoveDefinition> moveLookup) {
        ResolvedSpecies species = speciesLookup.get(normalizeKey(speciesName));
        if (species == null) {
            return;
        }
        LinkedHashSet<MoveDefinition> moves = movesBySlot.computeIfAbsent(slotId, ignored -> new LinkedHashSet<>());
        for (String moveId : species.species().moveIds()) {
            MoveDefinition move = moveLookup.get(normalizeKey(moveId));
            if (move != null && move.basePower() > 0) {
                moves.add(move);
            }
        }
    }

    private List<String> adaptationFlags(List<ReplayTimeline> timelines) {
        if (timelines.size() < 2) {
            return List.of();
        }

        List<String> flags = new ArrayList<>();
        for (int index = 1; index < timelines.size(); index++) {
            ReplayTimeline previous = timelines.get(index - 1);
            ReplayTimeline current = timelines.get(index);
            String previousOpponentLeads =
                    leadSummary(previous.turns().getFirst().boardStateAtStart().sideB());
            String currentOpponentLeads =
                    leadSummary(current.turns().getFirst().boardStateAtStart().sideB());
            if (previousOpponentLeads.equals(currentOpponentLeads)) {
                String previousResult =
                        previous.winner() != null && previous.winner().equals(previous.sideBName())
                                ? "winning"
                                : "losing";
                flags.add("opponent re-led %s after %s G%d".formatted(currentOpponentLeads, previousResult, index));
            }

            String previousUserLeads =
                    leadSummary(previous.turns().getFirst().boardStateAtStart().sideA());
            String currentUserLeads =
                    leadSummary(current.turns().getFirst().boardStateAtStart().sideA());
            if (!previousUserLeads.equals(currentUserLeads)) {
                flags.add("user changed win condition from %s to %s".formatted(previousUserLeads, currentUserLeads));
            }
        }
        return flags;
    }

    private String leadSummary(ReplaySideState side) {
        return side.activePokemon().stream()
                .map(ReplayPokemonState::speciesName)
                .limit(2)
                .collect(java.util.stream.Collectors.joining(" + "));
    }

    private boolean sameLine(ReplayDecisionLine left, ReplayDecisionLine right) {
        return fingerprint(left).equals(fingerprint(right));
    }

    private String fingerprint(ReplayDecisionLine line) {
        return line.choices().stream()
                .map(choice -> choice.actorSlotId() + "|" + choice.moveName() + "|" + choice.targetSlotId())
                .collect(java.util.stream.Collectors.joining("||"));
    }

    private String verdict(double delta) {
        if (delta <= 0.01d) {
            return "optimal";
        }
        if (delta <= 25.0d) {
            return "acceptable";
        }
        return "suboptimal";
    }

    private String narrative(ReplayDecisionLine played, List<ReplayDecisionLine> ranked, double delta) {
        if (ranked.isEmpty() || delta <= 0.01d) {
            return "Played line already best.";
        }
        ReplayDecisionLine best = ranked.getFirst();
        String moves = best.choices().stream()
                .map(ReplayMoveChoice::moveName)
                .collect(java.util.stream.Collectors.joining(" + "));
        return "Best alternative %s gains %.1f swing.".formatted(moves, delta);
    }

    private double expectedDamage(CalculateDamageResult result) {
        if (result.rolls().length == 0) {
            return (result.min() + result.max()) / 2.0d;
        }
        return java.util.Arrays.stream(result.rolls()).average().orElse(0.0d);
    }

    private boolean isKo(CalculateDamageResult result, CombatantCommand defender) {
        return result.koChance().hits() == 1 || result.max() >= defender.currentHp();
    }

    private double round(double value) {
        return Math.round(value * 10.0d) / 10.0d;
    }

    private String slotId(String actorToken) {
        if (actorToken == null || actorToken.isBlank()) {
            return null;
        }
        int separator = actorToken.indexOf(':');
        return separator < 0
                ? actorToken.trim()
                : actorToken.substring(0, separator).trim();
    }

    private String normalizeKey(String value) {
        String normalized = Normalizer.normalize(value == null ? "" : value.trim(), Normalizer.Form.NFD)
                .replaceAll("\\p{M}+", "");
        StringBuilder builder = new StringBuilder(normalized.length());
        for (int index = 0; index < normalized.length(); index++) {
            char current = normalized.charAt(index);
            if (Character.isLetterOrDigit(current)) {
                builder.append(Character.toLowerCase(current));
            }
        }
        return builder.toString();
    }

    private record ResolvedSpecies(PokemonSpecies species, String megaFormId, String abilityId) {

        private com.vgcenter.damagecalc.domain.model.Combatant toCombatant() {
            if (megaFormId == null) {
                return species.buildCombatant(VGC_LEVEL, ZERO_SP, Nature.HARDY, false)
                        .withAbility(com.vgcenter.damagecalc.domain.model.Ability.fromId(abilityId));
            }
            return species.buildCombatant(VGC_LEVEL, ZERO_SP, Nature.HARDY, megaFormId);
        }
    }

    private record ResolvedCombatant(String slotId, String speciesName, CombatantCommand command) {}

    private record ResolvedAction(ResolvedCombatant attacker, MoveDefinition move, ResolvedCombatant target) {

        private boolean canCalculate() {
            return move != null && target != null && move.basePower() > 0;
        }

        private ReplayMoveChoice toChoice() {
            return new ReplayMoveChoice(
                    attacker.slotId(),
                    attacker.speciesName(),
                    move == null ? "Unknown move" : move.name(),
                    target == null ? null : target.slotId(),
                    target == null ? null : target.speciesName());
        }
    }
}
