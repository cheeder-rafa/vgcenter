package com.vgcenter.damagecalc.application.usecase;

import com.vgcenter.damagecalc.application.port.MoveRepository;
import com.vgcenter.damagecalc.domain.gameplan.MatchupScore;
import com.vgcenter.damagecalc.domain.gameplan.MatchupScorer;
import com.vgcenter.damagecalc.domain.gameplan.TurnOneFlags;
import com.vgcenter.damagecalc.domain.model.Stats;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;

public final class EvaluateMatchupService implements EvaluateMatchupUseCase {

    private static final FieldCommand CLEAR_FIELD = new FieldCommand("CLEAR", "NONE", "NONE");
    private static final SideConditionsCommand NO_SIDE_CONDITIONS =
            new SideConditionsCommand(false, false, false, false, false, false, false);

    private final CalculateDamageUseCase calculateDamageUseCase;
    private final MoveRepository moveRepository;
    private final MatchupScorer matchupScorer;

    public EvaluateMatchupService(
            CalculateDamageUseCase calculateDamageUseCase, MoveRepository moveRepository, MatchupScorer matchupScorer) {
        this.calculateDamageUseCase = calculateDamageUseCase;
        this.moveRepository = moveRepository;
        this.matchupScorer = matchupScorer;
    }

    @Override
    public EvaluateMatchupResult evaluate(EvaluateMatchupCommand command) {
        Objects.requireNonNull(command, "command must not be null");

        Map<String, MoveDefinition> moveDefinitions =
                Map.copyOf(moveRepository.findDefinitionsByRegulation(command.regulation()).stream()
                        .collect(java.util.stream.Collectors.toMap(
                                MoveDefinition::id,
                                definition -> definition,
                                (left, right) -> left,
                                LinkedHashMap::new)));

        List<EvaluateMatchupPokemonCommand> mineLeads = command.mine().lineup().subList(0, 2);
        TurnOneFlags mineFlags = TurnOneFlags.classify(toSidePokemon(mineLeads));
        List<MatchupCellResult> cells = new ArrayList<>();

        for (int firstOpponentIndex = 0; firstOpponentIndex < command.opponent().size(); firstOpponentIndex++) {
            for (int secondOpponentIndex = firstOpponentIndex + 1;
                    secondOpponentIndex < command.opponent().size();
                    secondOpponentIndex++) {
                List<EvaluateMatchupPokemonCommand> opponentLeads = List.of(
                        command.opponent().get(firstOpponentIndex),
                        command.opponent().get(secondOpponentIndex));
                List<DamageOptionResult> outgoing =
                        damageOptions(command.regulation(), mineLeads, opponentLeads, moveDefinitions);
                List<DamageOptionResult> incoming =
                        damageOptions(command.regulation(), opponentLeads, mineLeads, moveDefinitions);

                MatchupScore score = matchupScorer.score(new MatchupScorer.MatchupScoreContext(
                        bestOutgoingPressure(outgoing, command.mine().winConditionIndex()),
                        bestIncomingPressure(incoming, command.mine().winConditionIndex()),
                        fasterMatchups(mineLeads, opponentLeads),
                        slowerMatchups(mineLeads, opponentLeads),
                        immunityBlocks(incoming, moveDefinitions)));

                cells.add(new MatchupCellResult(
                        firstOpponentIndex,
                        secondOpponentIndex,
                        List.of(
                                opponentLeads.get(0).speciesId(),
                                opponentLeads.get(1).speciesId()),
                        score,
                        mineFlags,
                        TurnOneFlags.classify(toSidePokemon(opponentLeads)),
                        outgoing,
                        incoming));
            }
        }

        return new EvaluateMatchupResult(cells);
    }

    private List<DamageOptionResult> damageOptions(
            String regulation,
            List<EvaluateMatchupPokemonCommand> attackers,
            List<EvaluateMatchupPokemonCommand> defenders,
            Map<String, MoveDefinition> moveDefinitions) {
        List<DamageOptionResult> results = new ArrayList<>();
        for (int attackerIndex = 0; attackerIndex < attackers.size(); attackerIndex++) {
            EvaluateMatchupPokemonCommand attacker = attackers.get(attackerIndex);
            for (int defenderIndex = 0; defenderIndex < defenders.size(); defenderIndex++) {
                EvaluateMatchupPokemonCommand defender = defenders.get(defenderIndex);
                for (String moveId : attacker.moveIds()) {
                    MoveDefinition moveDefinition = moveDefinitions.get(moveId);
                    if (moveDefinition == null) {
                        throw new IllegalArgumentException("Unknown move: " + moveId);
                    }
                    CalculateDamageResult damage = moveDefinition.basePower() <= 0
                            ? zeroDamage(defender.combatant().stats().hp())
                            : calculateDamageUseCase.calculate(new CalculateDamageCommand(
                                    regulation,
                                    attacker.combatant(),
                                    defender.combatant(),
                                    toMoveCommand(moveDefinition),
                                    CLEAR_FIELD,
                                    NO_SIDE_CONDITIONS,
                                    NO_SIDE_CONDITIONS,
                                    false,
                                    moveDefinition.spread() ? 2 : 1));
                    results.add(new DamageOptionResult(attackerIndex, defenderIndex, moveId, damage));
                }
            }
        }
        return results;
    }

    private List<MatchupScorer.LeadPressure> bestOutgoingPressure(
            List<DamageOptionResult> outgoing, Integer winConditionIndex) {
        return leadPressures(outgoing, DamageOptionResult::attackerIndex, winConditionIndex);
    }

    private List<MatchupScorer.LeadPressure> bestIncomingPressure(
            List<DamageOptionResult> incoming, Integer winConditionIndex) {
        return leadPressures(incoming, DamageOptionResult::defenderIndex, winConditionIndex);
    }

    private List<MatchupScorer.LeadPressure> leadPressures(
            List<DamageOptionResult> options,
            java.util.function.ToIntFunction<DamageOptionResult> groupingKey,
            Integer winConditionIndex) {
        return options.stream()
                .collect(java.util.stream.Collectors.groupingBy(groupingKey::applyAsInt))
                .entrySet()
                .stream()
                .sorted(Map.Entry.comparingByKey())
                .map(entry -> bestOption(entry.getValue()))
                .map(option -> new MatchupScorer.LeadPressure(
                        option.damage().minPct(),
                        option.damage().maxPct(),
                        winConditionIndex != null && groupingKey.applyAsInt(option) == winConditionIndex))
                .toList();
    }

    private DamageOptionResult bestOption(List<DamageOptionResult> options) {
        return options.stream()
                .max(Comparator.comparingDouble(
                                (DamageOptionResult option) -> option.damage().maxPct())
                        .thenComparingDouble(option -> option.damage().minPct()))
                .orElseThrow();
    }

    private int immunityBlocks(List<DamageOptionResult> incoming, Map<String, MoveDefinition> moveDefinitions) {
        return (int)
                incoming.stream()
                        .collect(java.util.stream.Collectors.groupingBy(DamageOptionResult::defenderIndex))
                        .values()
                        .stream()
                        .map(options -> bestDamagingOption(options, moveDefinitions))
                        .filter(java.util.Optional::isPresent)
                        .map(java.util.Optional::orElseThrow)
                        .filter(option -> option.damage().max() == 0)
                        .count();
    }

    private java.util.Optional<DamageOptionResult> bestDamagingOption(
            List<DamageOptionResult> options, Map<String, MoveDefinition> moveDefinitions) {
        return options.stream()
                .filter(option -> moveDefinitions.get(option.moveId()).basePower() > 0)
                .max(Comparator.comparingDouble(
                                (DamageOptionResult option) -> option.damage().maxPct())
                        .thenComparingDouble(option -> option.damage().minPct()));
    }

    private int fasterMatchups(
            List<EvaluateMatchupPokemonCommand> mineLeads, List<EvaluateMatchupPokemonCommand> opponentLeads) {
        return speedComparisonCount(mineLeads, opponentLeads, (mineSpeed, opponentSpeed) -> mineSpeed > opponentSpeed);
    }

    private int slowerMatchups(
            List<EvaluateMatchupPokemonCommand> mineLeads, List<EvaluateMatchupPokemonCommand> opponentLeads) {
        return speedComparisonCount(mineLeads, opponentLeads, (mineSpeed, opponentSpeed) -> mineSpeed < opponentSpeed);
    }

    private int speedComparisonCount(
            List<EvaluateMatchupPokemonCommand> mineLeads,
            List<EvaluateMatchupPokemonCommand> opponentLeads,
            java.util.function.BiPredicate<Integer, Integer> predicate) {
        int count = 0;
        for (EvaluateMatchupPokemonCommand mineLead : mineLeads) {
            int mineSpeed = effectiveSpeed(mineLead.combatant());
            for (EvaluateMatchupPokemonCommand opponentLead : opponentLeads) {
                int opponentSpeed = effectiveSpeed(opponentLead.combatant());
                if (predicate.test(mineSpeed, opponentSpeed)) {
                    count++;
                }
            }
        }
        return count;
    }

    private int effectiveSpeed(CombatantCommand combatant) {
        int speed = combatant.stats().speed();
        if ("PARALYSIS".equalsIgnoreCase(combatant.status())) {
            speed /= 2;
        }
        return Stats.applyStage(speed, combatant.stages().getOrDefault("spe", 0));
    }

    private List<TurnOneFlags.SidePokemon> toSidePokemon(List<EvaluateMatchupPokemonCommand> leads) {
        return leads.stream()
                .map(lead -> new TurnOneFlags.SidePokemon(
                        lead.moveIds(),
                        lead.combatant().abilityId(),
                        lead.combatant().itemId()))
                .toList();
    }

    private MoveCommand toMoveCommand(MoveDefinition moveDefinition) {
        return new MoveCommand(
                moveDefinition.type(),
                moveDefinition.category(),
                moveDefinition.basePower(),
                moveDefinition.spread(),
                moveDefinition.contact(),
                moveDefinition.doublePowerWhenUserStatused(),
                moveDefinition.ignoreBurnPenaltyWhenUserStatused());
    }

    private CalculateDamageResult zeroDamage(int defenderHp) {
        return new CalculateDamageResult(new int[16], 0, 0, 0.0d, 0.0d, new KoChanceResult("no 5HKO", 0.0d, 5));
    }
}
