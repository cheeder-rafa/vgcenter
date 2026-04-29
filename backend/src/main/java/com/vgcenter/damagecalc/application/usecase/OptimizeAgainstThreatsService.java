package com.vgcenter.damagecalc.application.usecase;

import com.vgcenter.damagecalc.application.port.MoveRepository;
import com.vgcenter.damagecalc.application.port.NatureRepository;
import com.vgcenter.damagecalc.application.port.PokedexRepository;
import com.vgcenter.damagecalc.domain.mega.MegaForm;
import com.vgcenter.damagecalc.domain.model.Nature;
import com.vgcenter.damagecalc.domain.model.PokemonSpecies;
import com.vgcenter.damagecalc.domain.model.Sp;
import com.vgcenter.damagecalc.domain.model.Stats;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;

public final class OptimizeAgainstThreatsService implements OptimizeAgainstThreatsUseCase {

    private static final int VGC_LEVEL = 50;
    private static final int MAX_SP = 32;
    private static final int MAX_TOTAL_SP = 66;
    private static final int MAX_RESULTS = 3;
    private static final List<Nature> FALLBACK_NATURES =
            List.of(Nature.BOLD, Nature.IMPISH, Nature.RELAXED, Nature.LAX, Nature.CALM, Nature.CAREFUL, Nature.SASSY);
    private static final List<SpreadTriple> LEGAL_SPREADS = legalSpreads();

    private final PokedexRepository pokedexRepository;
    private final NatureRepository natureRepository;
    private final MoveRepository moveRepository;
    private final CalculateDamageUseCase calculateDamageUseCase;

    public OptimizeAgainstThreatsService(
            PokedexRepository pokedexRepository,
            NatureRepository natureRepository,
            MoveRepository moveRepository,
            CalculateDamageUseCase calculateDamageUseCase) {
        this.pokedexRepository = pokedexRepository;
        this.natureRepository = natureRepository;
        this.moveRepository = moveRepository;
        this.calculateDamageUseCase = calculateDamageUseCase;
    }

    @Override
    public OptimizeAgainstThreatsResult optimize(OptimizeAgainstThreatsCommand command) {
        PokemonSpecies defenderSpecies = pokedexRepository
                .findById(command.regulation(), command.defenderSpeciesId())
                .orElseThrow(() -> new SpeciesNotFoundException(command.defenderSpeciesId()));
        Nature requestedDefenderNature = natureRepository
                .findById(command.regulation(), command.defenderNatureId())
                .orElse(Nature.HARDY);
        PreparedCombatant defenderProfile = prepareCombatant(
                defenderSpecies,
                requestedDefenderNature,
                new Sp(0, 0, 0, 0, 0, 0),
                command.defenderMegaActive(),
                command.defenderMegaFormId());
        List<PreparedThreat> threats = command.threats().stream()
                .map(threat -> prepareThreat(command.regulation(), threat))
                .toList();

        if (command.fixedSpread() != null) {
            ScoredSpread fixed =
                    scoreCandidate(defenderProfile, requestedDefenderNature, command.fixedSpread(), command, threats);
            return new OptimizeAgainstThreatsResult(
                    fixed.candidate(), List.of(fixed.candidate()), fixed.threatResults());
        }

        List<Nature> candidateNatures = candidateNatures(defenderSpecies, requestedDefenderNature, threats);
        List<ScoredSpread> allScored = new ArrayList<>(
                command.goal() == OptimizeAgainstThreatsGoal.SURVIVE_ALL
                        ? scoreForSurviveAll(defenderProfile, command, threats, candidateNatures)
                        : scoreAllSpreadsParallel(defenderProfile, command, threats, candidateNatures));

        List<ScoredSpread> eligible = allScored.stream()
                .filter(scored ->
                        command.goal() != OptimizeAgainstThreatsGoal.SURVIVE_ALL || scored.worstKoChance() == 0.0)
                .sorted(comparatorForGoal(command.goal()))
                .toList();
        if (eligible.isEmpty()) {
            return new OptimizeAgainstThreatsResult(null, List.of(), List.of());
        }

        Map<String, ScoredSpread> uniqueBySpread = new LinkedHashMap<>();
        for (ScoredSpread scored : eligible) {
            uniqueBySpread.putIfAbsent(candidateKey(scored.candidate()), scored);
            if (uniqueBySpread.size() >= MAX_RESULTS) {
                break;
            }
        }
        List<ScoredSpread> top = new ArrayList<>(uniqueBySpread.values());
        ScoredSpread best = top.getFirst();
        List<DefenseSpreadCandidate> candidates =
                top.stream().map(ScoredSpread::candidate).toList();
        return new OptimizeAgainstThreatsResult(best.candidate(), candidates, best.threatResults());
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
        PreparedCombatant attackerProfile = prepareCombatant(
                attacker, nature, toSp(threat.attackerSp()), threat.attackerMegaActive(), threat.attackerMegaFormId());
        MoveCommand moveCommand = new MoveCommand(
                move.type(),
                move.category(),
                move.basePower(),
                move.spread(),
                move.contact(),
                move.doublePowerWhenUserStatused(),
                move.ignoreBurnPenaltyWhenUserStatused(),
                move.accuracy() == null ? 1.0d : move.accuracy(),
                Boolean.TRUE.equals(move.alwaysCrit()));
        return new PreparedThreat(
                threat, toStatsCommand(attackerProfile.stats()), attackerProfile.types(), moveCommand);
    }

    private List<ScoredSpread> scoreForSurviveAll(
            PreparedCombatant defenderProfile,
            OptimizeAgainstThreatsCommand command,
            List<PreparedThreat> threats,
            List<Nature> natures) {
        List<ScoredSpread> scored = new ArrayList<>();
        for (int tier = 0; tier <= MAX_TOTAL_SP; tier++) {
            List<ScoredSpread> tierScores = scoreTier(defenderProfile, command, threats, natures, tier);
            scored.addAll(tierScores);
            boolean tierHasSurvivor = tierScores.stream().anyMatch(candidate -> candidate.worstKoChance() == 0.0);
            if (tierHasSurvivor) {
                break;
            }
        }
        return scored;
    }

    private List<ScoredSpread> scoreAllSpreadsParallel(
            PreparedCombatant defenderProfile,
            OptimizeAgainstThreatsCommand command,
            List<PreparedThreat> threats,
            List<Nature> natures) {
        return natures.parallelStream()
                .flatMap(nature -> LEGAL_SPREADS.stream()
                        .map(spread -> scoreSpread(
                                defenderProfile, nature, command, threats, spread.hp(), spread.def(), spread.spd())))
                .toList();
    }

    private List<ScoredSpread> scoreTier(
            PreparedCombatant defenderProfile,
            OptimizeAgainstThreatsCommand command,
            List<PreparedThreat> threats,
            List<Nature> natures,
            int tier) {
        List<ScoredSpread> scored = new ArrayList<>();
        for (Nature nature : natures) {
            for (SpreadTriple spread : LEGAL_SPREADS) {
                if (spread.total() != tier) {
                    continue;
                }
                scored.add(scoreSpread(
                        defenderProfile, nature, command, threats, spread.hp(), spread.def(), spread.spd()));
            }
        }
        return scored;
    }

    private ScoredSpread scoreSpread(
            PreparedCombatant defenderProfile,
            Nature defenderNature,
            OptimizeAgainstThreatsCommand command,
            List<PreparedThreat> threats,
            int spHp,
            int spDef,
            int spSpd) {
        Sp defenderSp = new Sp(spHp, 0, spDef, 0, spSpd, 0);
        Stats defenderStats = defenderProfile.baseStats().toBattleStats(defenderSp, defenderNature, VGC_LEVEL);
        List<OptimizeAgainstThreatResult> threatResults =
                scoreThreats(defenderProfile.types(), defenderStats, command, threats);
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
            PreparedCombatant defenderProfile,
            Nature requestedDefenderNature,
            DefenseSpreadCandidate candidate,
            OptimizeAgainstThreatsCommand command,
            List<PreparedThreat> threats) {
        Nature nature = candidate.suggestedNatureId() == null
                ? requestedDefenderNature
                : natureRepository
                        .findById(command.regulation(), candidate.suggestedNatureId())
                        .orElse(Nature.HARDY);
        return scoreSpread(
                defenderProfile, nature, command, threats, candidate.spHp(), candidate.spDef(), candidate.spSpd());
    }

    private List<OptimizeAgainstThreatResult> scoreThreats(
            List<String> defenderTypes,
            Stats defenderStats,
            OptimizeAgainstThreatsCommand command,
            List<PreparedThreat> threats) {
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
            double ohkoProbability = ohkoProbability(damage.rolls(), defenderStats.hp());
            results.add(new OptimizeAgainstThreatResult(
                    threat.command().attackerSpeciesId(),
                    threat.command().moveId(),
                    damage.minPct(),
                    damage.maxPct(),
                    expected,
                    ohkoProbability,
                    ohkoDescription(ohkoProbability)));
        }
        return results;
    }

    private Comparator<ScoredSpread> comparatorForGoal(OptimizeAgainstThreatsGoal goal) {
        return switch (goal) {
            case WORST_CASE_KO ->
                Comparator.comparingDouble(ScoredSpread::worstKoChance)
                        .thenComparingDouble(ScoredSpread::expectedDamageSum)
                        .thenComparingInt(s -> s.candidate().totalSp())
                        .thenComparingInt(s -> s.candidate().spHp()
                                + s.candidate().spDef()
                                + s.candidate().spSpd());
            case EXPECTED_DAMAGE_SUM ->
                Comparator.comparingDouble(ScoredSpread::expectedDamageSum)
                        .thenComparingDouble(ScoredSpread::worstKoChance)
                        .thenComparingInt(s -> s.candidate().totalSp())
                        .thenComparingInt(s -> s.candidate().spHp()
                                + s.candidate().spDef()
                                + s.candidate().spSpd());
            case SURVIVE_ALL ->
                Comparator.<ScoredSpread>comparingInt(s -> s.candidate().totalSp())
                        .thenComparingDouble(ScoredSpread::expectedDamageSum)
                        .thenComparingInt(s -> s.candidate().spHp()
                                + s.candidate().spDef()
                                + s.candidate().spSpd());
        };
    }

    private List<Nature> candidateNatures(
            PokemonSpecies defenderSpecies, Nature requested, List<PreparedThreat> threats) {
        boolean physicalPressure = threats.stream()
                .anyMatch(threat -> "PHYSICAL".equals(threat.move().category()));
        boolean specialPressure = threats.stream()
                .anyMatch(threat -> "SPECIAL".equals(threat.move().category()));
        return DefensiveNaturePolicy.candidates(
                defenderSpecies, requested, FALLBACK_NATURES, physicalPressure, specialPressure);
    }

    private static String goalDescription(OptimizeAgainstThreatsGoal goal, double worstKo, double expectedSum) {
        return switch (goal) {
            case WORST_CASE_KO -> "Worst KO " + String.format(Locale.ROOT, "%.1f%%", worstKo * 100.0);
            case EXPECTED_DAMAGE_SUM -> "Expected damage sum " + String.format(Locale.ROOT, "%.1f%%", expectedSum);
            case SURVIVE_ALL -> worstKo == 0.0 ? "survives all pinned threats" : "no full survival spread";
        };
    }

    private static double ohkoProbability(int[] rolls, int defenderHp) {
        int lethalRolls = 0;
        for (int roll : rolls) {
            if (roll >= defenderHp) {
                lethalRolls++;
            }
        }
        return lethalRolls / (double) rolls.length;
    }

    private static String ohkoDescription(double probability) {
        if (probability == 0.0) {
            return "guaranteed survival";
        }
        if (probability == 1.0) {
            return "guaranteed OHKO";
        }
        return String.format(Locale.ROOT, "%.2f%% chance to OHKO", probability * 100.0);
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

    private static String candidateKey(DefenseSpreadCandidate candidate) {
        return candidate.spHp() + ":" + candidate.spDef() + ":" + candidate.spSpd() + ":"
                + candidate.suggestedNatureId();
    }

    private static PreparedCombatant prepareCombatant(
            PokemonSpecies species, Nature nature, Sp sp, boolean megaActive, String megaFormId) {
        if (!megaActive) {
            Stats stats = species.baseStats().toBattleStats(sp, nature, VGC_LEVEL);
            return new PreparedCombatant(
                    species.baseStats(),
                    stats,
                    species.types().stream().map(Enum::name).toList());
        }
        MegaForm mega = resolveMegaForm(species, megaFormId);
        Stats stats = mega.baseStats().toBattleStats(sp, nature, VGC_LEVEL);
        return new PreparedCombatant(
                mega.baseStats(), stats, mega.types().stream().map(Enum::name).toList());
    }

    private static MegaForm resolveMegaForm(PokemonSpecies species, String megaFormId) {
        if (megaFormId != null && !megaFormId.isBlank()) {
            return species.megaForms().stream()
                    .filter(form -> form.id().equals(megaFormId))
                    .findFirst()
                    .orElseThrow(() -> new IllegalArgumentException(
                            "Species '%s' has no Mega form '%s' registered".formatted(species.id(), megaFormId)));
        }
        if (species.megaForms().size() > 1) {
            throw new IllegalArgumentException(
                    "Species '%s' requires megaFormId when Mega evolution is active".formatted(species.id()));
        }
        return species.megaForm()
                .orElseThrow(() -> new IllegalArgumentException(
                        "Species '%s' has no Mega form registered".formatted(species.id())));
    }

    private record PreparedThreat(
            OptimizeAgainstThreatCommand command,
            StatsCommand attackerStats,
            List<String> attackerTypes,
            MoveCommand move) {}

    private record PreparedCombatant(Stats baseStats, Stats stats, List<String> types) {}

    private record SpreadTriple(int hp, int def, int spd) {
        int total() {
            return hp + def + spd;
        }
    }

    private record ScoredSpread(
            DefenseSpreadCandidate candidate,
            List<OptimizeAgainstThreatResult> threatResults,
            double worstKoChance,
            double expectedDamageSum) {}

    private static List<SpreadTriple> legalSpreads() {
        List<SpreadTriple> spreads = new ArrayList<>();
        for (int spHp = 0; spHp <= MAX_SP; spHp++) {
            for (int spDef = 0; spDef <= MAX_SP; spDef++) {
                for (int spSpd = 0; spSpd <= MAX_SP; spSpd++) {
                    if (spHp + spDef + spSpd <= MAX_TOTAL_SP) {
                        spreads.add(new SpreadTriple(spHp, spDef, spSpd));
                    }
                }
            }
        }
        spreads.sort(Comparator.comparingInt(SpreadTriple::total)
                .thenComparingInt(SpreadTriple::hp)
                .thenComparingInt(SpreadTriple::def)
                .thenComparingInt(SpreadTriple::spd));
        return List.copyOf(spreads);
    }
}
