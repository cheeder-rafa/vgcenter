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
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Collectors;

public final class EvaluateReplayDecisionsService implements EvaluateReplayDecisionsUseCase {

    private static final int VGC_LEVEL = 50;
    private static final int MAX_ALTERNATIVES = 5;
    private static final Sp ZERO_SP = new Sp(0, 0, 0, 0, 0, 0);

    // Normalized IDs (lowercase alphanum) for all Protect-family moves
    private static final Set<String> PROTECT_MOVE_IDS = Set.of(
            "protect",
            "detect",
            "spikyshield",
            "burningbulwark",
            "kingsshield",
            "obstruct",
            "silktrap",
            "banefilbunker",
            "banefulbunker",
            "wideguard",
            "quickguard");

    // Faint-probability threshold above which the advisory fires
    private static final double ADVISORY_FAINT_PROB_THRESHOLD = 0.8;
    // Best-score ceiling below which the advisory fires (user can't win the trade)
    private static final double ADVISORY_BEST_SCORE_CEILING = 0.0;

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

        boolean userIsP1 = !"P2".equals(command.userPlayer());
        Map<String, List<MoveDefinition>> knownMoves = knownMovesForCommand(command, moveLookup);
        List<ReplayGameReview> games = new ArrayList<>();
        for (int index = 0; index < command.timelines().size(); index++) {
            ReplayTimeline timeline = command.timelines().get(index);
            List<TurnReview> reviews = timeline.turns().parallelStream()
                    .map(turn -> reviewTurn(
                            command.regulation(),
                            turn,
                            knownMoves,
                            speciesLookup,
                            moveLookup,
                            command.objective(),
                            userIsP1))
                    .toList();
            games.add(new ReplayGameReview(index + 1, timeline.winner(), reviews));
        }
        return new EvaluateReplayDecisionsResult(games, adaptationFlags(command.timelines(), userIsP1));
    }

    private TurnReview reviewTurn(
            String regulation,
            ReplayTurn turn,
            Map<String, List<MoveDefinition>> knownMoves,
            Map<String, ResolvedSpecies> speciesLookup,
            Map<String, MoveDefinition> moveLookup,
            ReplayScoringWeights weights,
            boolean userIsP1) {
        ReplayBoardState board = turn.boardStateAtStart();
        ReplaySideState userSideState = userIsP1 ? board.sideA() : board.sideB();
        ReplaySideState opponentSideState = userIsP1 ? board.sideB() : board.sideA();

        List<ResolvedCombatant> myActives = userSideState.activePokemon().stream()
                .map(pokemon -> resolveCombatant(pokemon, speciesLookup))
                .filter(Objects::nonNull)
                .toList();
        List<ResolvedCombatant> opponentActives = opponentSideState.activePokemon().stream()
                .map(pokemon -> resolveCombatant(pokemon, speciesLookup))
                .filter(Objects::nonNull)
                .toList();

        SideConditionsCommand mySide = toSideConditions(userSideState);
        SideConditionsCommand opponentSide = toSideConditions(opponentSideState);
        FieldCommand field = new FieldCommand(board.weather(), board.terrain(), "none");

        // Per-turn cache: same (attacker, move, defender, field) combination appears across many
        // enumerated lines. ConcurrentHashMap is safe when parallelStream uses this turn's local cache.
        Map<CalculateDamageCommand, CalculateDamageResult> turnCache = new ConcurrentHashMap<>();

        List<ResolvedAction> actualOpponentActions = actualActions(
                turn.events(), opponentSideState, opponentActives, myActives, knownMoves, moveLookup, !userIsP1);
        List<ResolvedAction> actualPlayedActions = actualActions(
                turn.events(), userSideState, myActives, opponentActives, knownMoves, moveLookup, userIsP1);

        // Precompute opponent impact once — constant across all enumerated user lines.
        OpponentImpact opponentImpact =
                computeOpponentImpact(regulation, actualOpponentActions, field, opponentSide, mySide, turnCache);

        ReplayDecisionLine played = scoreLine(
                regulation, actualPlayedActions, opponentImpact, field, mySide, opponentSide, weights, turnCache);

        List<List<ResolvedAction>> choicesByActor = new ArrayList<>();
        for (ResolvedCombatant attacker : myActives) {
            choicesByActor.add(candidateActions(
                    attacker,
                    opponentActives,
                    knownMoves.getOrDefault(normalizeKey(attacker.speciesName()), List.of())));
        }

        List<ReplayDecisionLine> ranked =
                enumerateLines(
                                regulation,
                                choicesByActor,
                                opponentImpact,
                                field,
                                mySide,
                                opponentSide,
                                weights,
                                turnCache)
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
        String advisory = advisory(opponentImpact, bestScore, myActives);
        return new TurnReview(turn.number(), played, ranked, delta, verdict, narrative, advisory);
    }

    private List<ReplayDecisionLine> enumerateLines(
            String regulation,
            List<List<ResolvedAction>> choicesByActor,
            OpponentImpact opponentImpact,
            FieldCommand field,
            SideConditionsCommand mySide,
            SideConditionsCommand opponentSide,
            ReplayScoringWeights weights,
            Map<CalculateDamageCommand, CalculateDamageResult> turnCache) {
        List<ReplayDecisionLine> lines = new ArrayList<>();
        enumerateLinesRecursive(
                regulation,
                choicesByActor,
                0,
                new ArrayList<>(),
                lines,
                opponentImpact,
                field,
                mySide,
                opponentSide,
                weights,
                turnCache);
        return lines;
    }

    private void enumerateLinesRecursive(
            String regulation,
            List<List<ResolvedAction>> choicesByActor,
            int index,
            List<ResolvedAction> current,
            List<ReplayDecisionLine> lines,
            OpponentImpact opponentImpact,
            FieldCommand field,
            SideConditionsCommand mySide,
            SideConditionsCommand opponentSide,
            ReplayScoringWeights weights,
            Map<CalculateDamageCommand, CalculateDamageResult> turnCache) {
        if (index == choicesByActor.size()) {
            lines.add(scoreLine(regulation, current, opponentImpact, field, mySide, opponentSide, weights, turnCache));
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
                    opponentImpact,
                    field,
                    mySide,
                    opponentSide,
                    weights,
                    turnCache);
            current.removeLast();
        }
    }

    private OpponentImpact computeOpponentImpact(
            String regulation,
            List<ResolvedAction> opponentActions,
            FieldCommand field,
            SideConditionsCommand opponentSide,
            SideConditionsCommand mySide,
            Map<CalculateDamageCommand, CalculateDamageResult> turnCache) {
        double taken = 0.0d;
        int faints = 0;
        double faintProbability = 0.0d;
        Map<String, Double> takenBySlot = new HashMap<>();
        Map<String, Double> faintProbBySlot = new HashMap<>();
        Map<String, Integer> faintsBySlot = new HashMap<>();

        for (ResolvedAction action : opponentActions) {
            if (!action.canCalculate()) {
                continue;
            }
            CalculateDamageCommand cmd = new CalculateDamageCommand(
                    regulation,
                    action.attacker().command(),
                    action.target().command(),
                    toMoveCommand(action.move()),
                    field,
                    opponentSide,
                    mySide,
                    false,
                    1);
            CalculateDamageResult result = turnCache.computeIfAbsent(cmd, calculateDamageUseCase::calculate);
            double dmg = expectedDamage(result);
            String slot = action.target().slotId();
            taken += dmg;
            takenBySlot.merge(slot, dmg, Double::sum);
            double kp = result.koChance().probability();
            faintProbability += kp;
            faintProbBySlot.merge(slot, kp, Double::sum);
            if (isKo(result, action.target().command())) {
                faints++;
                faintsBySlot.merge(slot, 1, Integer::sum);
            }
        }
        return new OpponentImpact(
                taken,
                faints,
                faintProbability,
                Map.copyOf(takenBySlot),
                Map.copyOf(faintProbBySlot),
                Map.copyOf(faintsBySlot));
    }

    private ReplayDecisionLine scoreLine(
            String regulation,
            List<ResolvedAction> myActions,
            OpponentImpact opponentImpact,
            FieldCommand field,
            SideConditionsCommand mySide,
            SideConditionsCommand opponentSide,
            ReplayScoringWeights weights,
            Map<CalculateDamageCommand, CalculateDamageResult> turnCache) {
        double dealt = 0.0d;
        int kos = 0;
        double koProbability = 0.0d;

        for (ResolvedAction action : myActions) {
            if (!action.canCalculate()) {
                continue;
            }
            CalculateDamageCommand cmd = new CalculateDamageCommand(
                    regulation,
                    action.attacker().command(),
                    action.target().command(),
                    toMoveCommand(action.move()),
                    field,
                    mySide,
                    opponentSide,
                    false,
                    1);
            CalculateDamageResult result = turnCache.computeIfAbsent(cmd, calculateDamageUseCase::calculate);
            dealt += expectedDamage(result);
            if (isKo(result, action.target().command())) {
                kos++;
            }
            koProbability += result.koChance().probability();
        }

        // Adjust opponent impact for Protect actions: each protected slot blocks damage aimed at it.
        double effectiveTaken = opponentImpact.taken();
        double effectiveFaintProb = opponentImpact.faintProbability();
        int effectiveFaints = opponentImpact.faints();
        for (ResolvedAction action : myActions) {
            if ("PROTECT".equals(action.kind())) {
                String slot = action.attacker().slotId();
                effectiveTaken -= opponentImpact.takenBySlot().getOrDefault(slot, 0.0);
                effectiveFaintProb -= opponentImpact.faintProbBySlot().getOrDefault(slot, 0.0);
                effectiveFaints -= opponentImpact.faintsBySlot().getOrDefault(slot, 0);
            }
        }
        effectiveTaken = Math.max(0.0, effectiveTaken);
        effectiveFaintProb = Math.max(0.0, effectiveFaintProb);
        effectiveFaints = Math.max(0, effectiveFaints);

        double score = weights.damageDealtWeight() * dealt
                - weights.damageTakenWeight() * effectiveTaken
                + weights.koBonus() * koProbability
                - weights.faintPenalty() * effectiveFaintProb;
        return new ReplayDecisionLine(
                myActions.stream().map(ResolvedAction::toChoice).toList(),
                round(score),
                round(dealt),
                round(effectiveTaken),
                kos,
                effectiveFaints);
    }

    private record OpponentImpact(
            double taken,
            int faints,
            double faintProbability,
            Map<String, Double> takenBySlot,
            Map<String, Double> faintProbBySlot,
            Map<String, Integer> faintsBySlot) {}

    private List<ResolvedAction> actualActions(
            List<ReplayEvent> events,
            ReplaySideState actingSide,
            List<ResolvedCombatant> attackers,
            List<ResolvedCombatant> defenders,
            Map<String, List<MoveDefinition>> knownMoves,
            Map<String, MoveDefinition> moveLookup,
            boolean userSide) {
        Map<String, ResolvedCombatant> attackersBySlot =
                attackers.stream().collect(Collectors.toMap(ResolvedCombatant::slotId, value -> value));
        Map<String, ResolvedCombatant> defendersBySlot =
                defenders.stream().collect(Collectors.toMap(ResolvedCombatant::slotId, value -> value));
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
                move = knownMoves.getOrDefault(normalizeKey(attacker.speciesName()), List.of()).stream()
                        .filter(candidate -> candidate.name().equalsIgnoreCase(moveName))
                        .findFirst()
                        .orElse(null);
            }
            String targetSlot =
                    event.arguments().size() >= 3 ? slotId(event.arguments().get(2)) : null;
            ResolvedCombatant target = null;
            if (targetSlot != null) {
                target = defendersBySlot.get(targetSlot);
                if (target == null) {
                    // Self-targeting (e.g., Protect) or ally-targeting
                    target = attackersBySlot.get(targetSlot);
                }
            }
            String kind = resolveKind(move);
            actions.add(new ResolvedAction(attacker, move, target, kind));
        }
        return actions;
    }

    private List<ResolvedAction> candidateActions(
            ResolvedCombatant attacker, List<ResolvedCombatant> defenders, List<MoveDefinition> moves) {
        List<ResolvedAction> actions = new ArrayList<>();
        for (MoveDefinition move : moves) {
            if (isProtect(move)) {
                actions.add(new ResolvedAction(attacker, move, attacker, "PROTECT"));
            } else if (move.basePower() > 0) {
                for (ResolvedCombatant defender : defenders) {
                    actions.add(new ResolvedAction(attacker, move, defender, "ATTACK"));
                }
            } else {
                actions.add(new ResolvedAction(attacker, move, attacker, "STATUS"));
            }
        }
        if (actions.isEmpty()) {
            actions.add(new ResolvedAction(attacker, null, null, "ATTACK"));
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
                        pokemon.status() == null ? "none" : pokemon.status(),
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

    private Map<String, List<MoveDefinition>> knownMovesForCommand(
            EvaluateReplayDecisionsCommand command, Map<String, MoveDefinition> moveLookup) {
        Map<String, LinkedHashSet<MoveDefinition>> movesBySpecies = new LinkedHashMap<>();

        // Source 1: |showteam| revealed full movesets (BO3 only)
        for (ReplayTimeline timeline : command.timelines()) {
            for (Map.Entry<String, List<String>> entry :
                    timeline.revealedMovesBySpecies().entrySet()) {
                String speciesKey = normalizeKey(entry.getKey());
                LinkedHashSet<MoveDefinition> moves =
                        movesBySpecies.computeIfAbsent(speciesKey, ignored -> new LinkedHashSet<>());
                for (String moveName : entry.getValue()) {
                    MoveDefinition move = moveLookup.get(normalizeKey(moveName));
                    if (move != null) {
                        moves.add(move);
                    }
                }
            }
        }

        // Source 2: moves observed in |move| events (both BO1 and BO3)
        for (ReplayTimeline timeline : command.timelines()) {
            for (ReplayTurn turn : timeline.turns()) {
                Map<String, String> slotToSpecies = new LinkedHashMap<>();
                for (ReplayPokemonState pokemon :
                        turn.boardStateAtStart().sideA().activePokemon()) {
                    slotToSpecies.put(pokemon.slotId(), normalizeKey(pokemon.speciesName()));
                }
                for (ReplayPokemonState pokemon :
                        turn.boardStateAtStart().sideB().activePokemon()) {
                    slotToSpecies.put(pokemon.slotId(), normalizeKey(pokemon.speciesName()));
                }
                for (ReplayEvent event : turn.events()) {
                    if (!"move".equals(event.type()) || event.arguments().size() < 2) {
                        continue;
                    }
                    String slot = slotId(event.arguments().getFirst());
                    String speciesKey = slotToSpecies.get(slot);
                    if (speciesKey == null) {
                        continue;
                    }
                    MoveDefinition move =
                            moveLookup.get(normalizeKey(event.arguments().get(1)));
                    if (move != null) {
                        movesBySpecies
                                .computeIfAbsent(speciesKey, ignored -> new LinkedHashSet<>())
                                .add(move);
                    }
                }
            }
        }

        Map<String, List<MoveDefinition>> result = new LinkedHashMap<>();
        for (Map.Entry<String, LinkedHashSet<MoveDefinition>> entry : movesBySpecies.entrySet()) {
            result.put(entry.getKey(), List.copyOf(entry.getValue()));
        }
        return result;
    }

    private List<String> adaptationFlags(List<ReplayTimeline> timelines, boolean userIsP1) {
        if (timelines.size() < 2) {
            return List.of();
        }

        List<String> flags = new ArrayList<>();
        for (int index = 1; index < timelines.size(); index++) {
            ReplayTimeline previous = timelines.get(index - 1);
            ReplayTimeline current = timelines.get(index);
            ReplaySideState previousOpponent = userIsP1
                    ? previous.turns().getFirst().boardStateAtStart().sideB()
                    : previous.turns().getFirst().boardStateAtStart().sideA();
            ReplaySideState currentOpponent = userIsP1
                    ? current.turns().getFirst().boardStateAtStart().sideB()
                    : current.turns().getFirst().boardStateAtStart().sideA();
            String previousOpponentLeads = leadSummary(previousOpponent);
            String currentOpponentLeads = leadSummary(currentOpponent);
            if (previousOpponentLeads.equals(currentOpponentLeads)) {
                String opponentName = userIsP1 ? previous.sideBName() : previous.sideAName();
                String previousResult =
                        previous.winner() != null && previous.winner().equals(opponentName) ? "winning" : "losing";
                flags.add("opponent re-led %s after %s G%d".formatted(currentOpponentLeads, previousResult, index));
            }

            ReplaySideState previousUser = userIsP1
                    ? previous.turns().getFirst().boardStateAtStart().sideA()
                    : previous.turns().getFirst().boardStateAtStart().sideB();
            ReplaySideState currentUser = userIsP1
                    ? current.turns().getFirst().boardStateAtStart().sideA()
                    : current.turns().getFirst().boardStateAtStart().sideB();
            String previousUserLeads = leadSummary(previousUser);
            String currentUserLeads = leadSummary(currentUser);
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
                .collect(Collectors.joining(" + "));
    }

    private boolean sameLine(ReplayDecisionLine left, ReplayDecisionLine right) {
        return fingerprint(left).equals(fingerprint(right));
    }

    private String fingerprint(ReplayDecisionLine line) {
        return line.choices().stream()
                .map(choice -> choice.actorSlotId()
                        + "|"
                        + choice.moveName()
                        + "|"
                        + choice.targetSlotId()
                        + "|"
                        + choice.kind())
                .collect(Collectors.joining("||"));
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
            return "Played line already matches the best decision score.";
        }
        ReplayDecisionLine best = ranked.getFirst();
        boolean bestUsesProtect = best.choices().stream().anyMatch(c -> "PROTECT".equals(c.kind()));
        String moves = best.choices().stream()
                .map(c -> "PROTECT".equals(c.kind()) ? "Protect (" + c.actorSpeciesName() + ")" : c.moveName())
                .collect(Collectors.joining(" + "));
        if (bestUsesProtect) {
            double shielded = played.expectedDamageTaken() - best.expectedDamageTaken();
            if (shielded > 0.0) {
                return "Protect + %s shields %.0f expected damage and gains %.1f decision score."
                        .formatted(
                                best.choices().stream()
                                        .filter(c -> !"PROTECT".equals(c.kind()))
                                        .map(ReplayMoveChoice::moveName)
                                        .collect(Collectors.joining(" + ")),
                                shielded,
                                delta);
            }
        }
        return "Best alternative %s gains %.1f decision score.".formatted(moves, delta);
    }

    private String advisory(OpponentImpact opponentImpact, double bestScore, List<ResolvedCombatant> myActives) {
        // Fire when faint pressure is high and even the best response line is a losing trade
        if (opponentImpact.faintProbability() < ADVISORY_FAINT_PROB_THRESHOLD
                || bestScore > ADVISORY_BEST_SCORE_CEILING) {
            return null;
        }
        // Identify the threatened slot(s)
        List<String> threatenedNames = myActives.stream()
                .filter(c ->
                        opponentImpact.faintProbBySlot().getOrDefault(c.slotId(), 0.0) >= ADVISORY_FAINT_PROB_THRESHOLD)
                .map(ResolvedCombatant::speciesName)
                .toList();
        if (threatenedNames.isEmpty()) {
            return "High faint pressure — consider whether bench covers this position.";
        }
        String targets = String.join(" and ", threatenedNames);
        return "No winning response found for %s — consider whether bench covers this position.".formatted(targets);
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

    private boolean isProtect(MoveDefinition move) {
        return PROTECT_MOVE_IDS.contains(normalizeKey(move.id()))
                || PROTECT_MOVE_IDS.contains(normalizeKey(move.name()));
    }

    private String resolveKind(MoveDefinition move) {
        if (move == null) {
            return "ATTACK";
        }
        if (isProtect(move)) {
            return "PROTECT";
        }
        if (move.basePower() > 0) {
            return "ATTACK";
        }
        return "STATUS";
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

    private record ResolvedAction(
            ResolvedCombatant attacker, MoveDefinition move, ResolvedCombatant target, String kind) {

        private boolean canCalculate() {
            return "ATTACK".equals(kind) && move != null && target != null && move.basePower() > 0;
        }

        private ReplayMoveChoice toChoice() {
            return new ReplayMoveChoice(
                    attacker.slotId(),
                    attacker.speciesName(),
                    move == null ? "Unknown move" : move.name(),
                    target == null ? null : target.slotId(),
                    target == null ? null : target.speciesName(),
                    kind);
        }
    }
}
