package com.vgcenter.damagecalc.application.usecase;

import com.vgcenter.damagecalc.application.port.MoveRepository;
import com.vgcenter.damagecalc.application.port.NatureRepository;
import com.vgcenter.damagecalc.application.port.PokedexRepository;
import com.vgcenter.damagecalc.domain.model.Nature;
import com.vgcenter.damagecalc.domain.model.PokemonSpecies;
import com.vgcenter.damagecalc.domain.model.Sp;
import com.vgcenter.damagecalc.domain.model.Stats;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;
import java.util.Map;

public final class OptimizeAgainstThreatsService implements OptimizeAgainstThreatsUseCase {

    private static final int VGC_LEVEL = 50;
    private static final int MAX_SP = 32;
    private static final int MAX_TOTAL_SP = 66;
    private static final List<Nature> FALLBACK_NATURES =
            List.of(Nature.BOLD, Nature.IMPISH, Nature.RELAXED, Nature.LAX, Nature.CALM, Nature.CAREFUL, Nature.SASSY);

    private final PokedexRepository pokedexRepository;
    private final NatureRepository natureRepository;
    private final MoveRepository moveRepository;
    private final CalculateDamageUseCase calculateDamageUseCase;
    private final OptimizeDefensiveSpreadUseCase singleThreatOptimizer;

    public OptimizeAgainstThreatsService(
            PokedexRepository pokedexRepository,
            NatureRepository natureRepository,
            MoveRepository moveRepository,
            CalculateDamageUseCase calculateDamageUseCase,
            OptimizeDefensiveSpreadUseCase singleThreatOptimizer) {
        this.pokedexRepository = pokedexRepository;
        this.natureRepository = natureRepository;
        this.moveRepository = moveRepository;
        this.calculateDamageUseCase = calculateDamageUseCase;
        this.singleThreatOptimizer = singleThreatOptimizer;
    }

    @Override
    public OptimizeAgainstThreatsResult optimize(OptimizeAgainstThreatsCommand command) {
        PokemonSpecies defender = pokedexRepository
                .findById(command.regulation(), command.defenderSpeciesId())
                .orElseThrow(() -> new SpeciesNotFoundException(command.defenderSpeciesId()));
        List<PreparedThreat> threats = command.threats().stream()
                .map(threat -> prepareThreat(command.regulation(), threat))
                .toList();

        if (command.fixedSpread() != null) {
            ScoredSpread fixed =
                    scoreCandidate(defender, command.defenderNatureId(), command.fixedSpread(), command, threats);
            return new OptimizeAgainstThreatsResult(fixed.candidate(), fixed.threatResults());
        }

        List<DefenseSpreadCandidate> seedCandidates = command.threats().stream()
                .flatMap(threat ->
                        singleThreatOptimizer.optimize(toSingleThreatCommand(command, threat)).candidates().stream())
                .toList();

        ScoredSpread best = null;
        for (Nature nature : candidateNatures(command.regulation(), command.defenderNatureId())) {
            for (int tier = 0; tier <= MAX_TOTAL_SP; tier++) {
                for (int spHp = 0; spHp <= Math.min(tier, MAX_SP); spHp++) {
                    for (int spDef = 0; spDef <= Math.min(tier - spHp, MAX_SP); spDef++) {
                        int spSpd = tier - spHp - spDef;
                        if (spSpd > MAX_SP) continue;
                        ScoredSpread scored = scoreSpread(defender, nature, command, threats, spHp, spDef, spSpd);
                        best = better(best, scored, command.goal());
                    }
                }
            }
        }

        for (DefenseSpreadCandidate seed : seedCandidates) {
            ScoredSpread scored = scoreCandidate(defender, command.defenderNatureId(), seed, command, threats);
            best = better(best, scored, command.goal());
        }

        if (best == null || (command.goal() == OptimizeAgainstThreatsGoal.SURVIVE_ALL && best.worstKoChance() > 0.0)) {
            return new OptimizeAgainstThreatsResult(null, List.of());
        }
        return new OptimizeAgainstThreatsResult(best.candidate(), best.threatResults());
    }

    private PreparedThreat prepareThreat(String regulation, OptimizeAgainstThreatCommand threat) {
        PokemonSpecies attacker = pokedexRepository
                .findById(regulation, threat.attackerSpeciesId())
                .orElseThrow(() -> new SpeciesNotFoundException(threat.attackerSpeciesId()));
        Nature nature =
                natureRepository.findById(regulation, threat.attackerNatureId()).orElse(Nature.HARDY);
        MoveDefinition move = moveRepository
                .findById(regulation, threat.moveId())
                .orElseThrow(() -> new IllegalArgumentException("Unknown move: " + threat.moveId()));
        Stats stats = attacker.baseStats().toBattleStats(toSp(threat.attackerSp()), nature, VGC_LEVEL);
        MoveCommand moveCommand = new MoveCommand(
                move.type(),
                move.category(),
                move.basePower(),
                move.spread(),
                move.contact(),
                move.doublePowerWhenUserStatused(),
                move.ignoreBurnPenaltyWhenUserStatused());
        return new PreparedThreat(
                threat,
                toStatsCommand(stats),
                attacker.types().stream().map(Enum::name).toList(),
                moveCommand);
    }

    private ScoredSpread scoreSpread(
            PokemonSpecies defender,
            Nature defenderNature,
            OptimizeAgainstThreatsCommand command,
            List<PreparedThreat> threats,
            int spHp,
            int spDef,
            int spSpd) {
        Sp defenderSp = new Sp(spHp, 0, spDef, 0, spSpd, 0);
        Stats defenderStats = defender.baseStats().toBattleStats(defenderSp, defenderNature, VGC_LEVEL);
        List<OptimizeAgainstThreatResult> threatResults = scoreThreats(defender, defenderStats, command, threats);
        double worstKo = threatResults.stream()
                .mapToDouble(OptimizeAgainstThreatResult::koChanceProbability)
                .max()
                .orElse(1.0);
        double expectedSum = threatResults.stream()
                .mapToDouble(OptimizeAgainstThreatResult::expectedDamagePct)
                .sum();
        int total = spHp + spDef + spSpd;
        DefenseSpreadCandidate candidate = new DefenseSpreadCandidate(
                spHp,
                spDef,
                spSpd,
                total,
                MAX_TOTAL_SP - total,
                threatResults.stream()
                        .mapToDouble(OptimizeAgainstThreatResult::minDamagePct)
                        .min()
                        .orElse(0),
                threatResults.stream()
                        .mapToDouble(OptimizeAgainstThreatResult::maxDamagePct)
                        .max()
                        .orElse(0),
                worstKo,
                goalDescription(command.goal(), worstKo, expectedSum),
                defenderNature.name().equalsIgnoreCase(command.defenderNatureId()) ? null : defenderNature.name());
        return new ScoredSpread(candidate, threatResults, worstKo, expectedSum);
    }

    private ScoredSpread scoreCandidate(
            PokemonSpecies defender,
            String defenderNatureId,
            DefenseSpreadCandidate candidate,
            OptimizeAgainstThreatsCommand command,
            List<PreparedThreat> threats) {
        Nature nature = candidate.suggestedNatureId() == null
                ? natureRepository
                        .findById(command.regulation(), defenderNatureId)
                        .orElse(Nature.HARDY)
                : natureRepository
                        .findById(command.regulation(), candidate.suggestedNatureId())
                        .orElse(Nature.HARDY);
        return scoreSpread(defender, nature, command, threats, candidate.spHp(), candidate.spDef(), candidate.spSpd());
    }

    private List<OptimizeAgainstThreatResult> scoreThreats(
            PokemonSpecies defender,
            Stats defenderStats,
            OptimizeAgainstThreatsCommand command,
            List<PreparedThreat> threats) {
        List<String> defenderTypes = defender.types().stream().map(Enum::name).toList();
        CombatantCommand defenderCommand = new CombatantCommand(
                VGC_LEVEL,
                toStatsCommand(defenderStats),
                defenderTypes,
                command.defenderAbilityId(),
                command.defenderItemId(),
                "NONE",
                Map.of(),
                false,
                defenderStats.hp());
        List<OptimizeAgainstThreatResult> results = new ArrayList<>();
        for (PreparedThreat threat : threats) {
            CombatantCommand attackerCommand = new CombatantCommand(
                    VGC_LEVEL,
                    threat.attackerStats(),
                    threat.attackerTypes(),
                    threat.command().attackerAbilityId(),
                    threat.command().attackerItemId(),
                    "NONE",
                    Map.of(),
                    false,
                    threat.attackerStats().hp());
            CalculateDamageResult damage = calculateDamageUseCase.calculate(new CalculateDamageCommand(
                    command.regulation(),
                    attackerCommand,
                    defenderCommand,
                    threat.move(),
                    command.field(),
                    command.attackerSide(),
                    command.defenderSide(),
                    command.criticalHit(),
                    1));
            double expected = average(damage.rolls()) * 100.0 / defenderStats.hp();
            results.add(new OptimizeAgainstThreatResult(
                    threat.command().attackerSpeciesId(),
                    threat.command().moveId(),
                    damage.minPct(),
                    damage.maxPct(),
                    expected,
                    damage.koChance().probability(),
                    damage.koChance().description()));
        }
        return results;
    }

    private ScoredSpread better(ScoredSpread current, ScoredSpread candidate, OptimizeAgainstThreatsGoal goal) {
        if (current == null) return candidate;
        Comparator<ScoredSpread> comparator =
                switch (goal) {
                    case WORST_CASE_KO ->
                        Comparator.comparingDouble(ScoredSpread::worstKoChance)
                                .thenComparingDouble(ScoredSpread::expectedDamageSum)
                                .thenComparingInt(s -> s.candidate().totalSp());
                    case EXPECTED_DAMAGE_SUM ->
                        Comparator.comparingDouble(ScoredSpread::expectedDamageSum)
                                .thenComparingDouble(ScoredSpread::worstKoChance)
                                .thenComparingInt(s -> s.candidate().totalSp());
                    case SURVIVE_ALL ->
                        Comparator.comparingDouble(ScoredSpread::worstKoChance)
                                .thenComparingInt(s -> s.candidate().totalSp())
                                .thenComparingDouble(ScoredSpread::expectedDamageSum);
                };
        return comparator.compare(candidate, current) < 0 ? candidate : current;
    }

    private List<Nature> candidateNatures(String regulation, String requestedNatureId) {
        Nature requested =
                natureRepository.findById(regulation, requestedNatureId).orElse(Nature.HARDY);
        List<Nature> natures = new ArrayList<>();
        natures.add(requested);
        for (Nature fallback : FALLBACK_NATURES) {
            if (!natures.contains(fallback)) {
                natures.add(fallback);
            }
        }
        return natures;
    }

    private OptimizeDefenseCommand toSingleThreatCommand(
            OptimizeAgainstThreatsCommand command, OptimizeAgainstThreatCommand threat) {
        return new OptimizeDefenseCommand(
                command.regulation(),
                command.defenderSpeciesId(),
                command.defenderNatureId(),
                command.defenderAbilityId(),
                command.defenderItemId(),
                threat.attackerSpeciesId(),
                threat.attackerNatureId(),
                threat.attackerSp(),
                threat.attackerAbilityId(),
                threat.attackerItemId(),
                threat.moveId(),
                "ALWAYS_SURVIVE",
                command.field(),
                command.attackerSide(),
                command.defenderSide(),
                command.criticalHit());
    }

    private static String goalDescription(OptimizeAgainstThreatsGoal goal, double worstKo, double expectedSum) {
        return switch (goal) {
            case WORST_CASE_KO -> "Worst KO " + String.format(Locale.ROOT, "%.1f%%", worstKo * 100.0);
            case EXPECTED_DAMAGE_SUM -> "Expected damage sum " + String.format(Locale.ROOT, "%.1f%%", expectedSum);
            case SURVIVE_ALL -> worstKo == 0.0 ? "survives all pinned threats" : "no full survival spread";
        };
    }

    private static double average(int[] rolls) {
        int total = 0;
        for (int roll : rolls) {
            total += roll;
        }
        return total / (double) rolls.length;
    }

    private static Sp toSp(SpCommand cmd) {
        return new Sp(cmd.hp(), cmd.attack(), cmd.defense(), cmd.specialAttack(), cmd.specialDefense(), cmd.speed());
    }

    private static StatsCommand toStatsCommand(Stats stats) {
        return new StatsCommand(
                stats.hp(),
                stats.attack(),
                stats.defense(),
                stats.specialAttack(),
                stats.specialDefense(),
                stats.speed());
    }

    private record PreparedThreat(
            OptimizeAgainstThreatCommand command,
            StatsCommand attackerStats,
            List<String> attackerTypes,
            MoveCommand move) {}

    private record ScoredSpread(
            DefenseSpreadCandidate candidate,
            List<OptimizeAgainstThreatResult> threatResults,
            double worstKoChance,
            double expectedDamageSum) {}
}
