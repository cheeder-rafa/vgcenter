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
import java.util.Map;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.CopyOnWriteArrayList;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

public final class OptimizeDefensiveSpreadService implements OptimizeDefensiveSpreadUseCase {

    private static final int VGC_LEVEL = 50;
    private static final int MAX_SP = 32;
    private static final int MAX_TOTAL_SP = 66;
    private static final int MAX_RESULTS = 5;

    // Defensive nature fallbacks by move category — natures that drop neither
    // defensive stat come first so the tidiest suggestion wins.
    private static final List<Nature> PHYSICAL_FALLBACKS =
            List.of(Nature.BOLD, Nature.IMPISH, Nature.RELAXED, Nature.LAX);
    private static final List<Nature> SPECIAL_FALLBACKS =
            List.of(Nature.CALM, Nature.CAREFUL, Nature.SASSY, Nature.GENTLE);

    private final PokedexRepository pokedexRepository;
    private final NatureRepository natureRepository;
    private final MoveRepository moveRepository;
    private final CalculateDamageUseCase calculateDamageUseCase;

    public OptimizeDefensiveSpreadService(
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
    public OptimizeDefenseResult optimize(OptimizeDefenseCommand command) {
        PokemonSpecies defender = pokedexRepository
                .findById(command.regulation(), command.defenderSpeciesId())
                .orElseThrow(() -> new SpeciesNotFoundException(command.defenderSpeciesId()));
        PokemonSpecies attacker = pokedexRepository
                .findById(command.regulation(), command.attackerSpeciesId())
                .orElseThrow(() -> new SpeciesNotFoundException(command.attackerSpeciesId()));

        Nature defenderNature = natureRepository
                .findById(command.regulation(), command.defenderNatureId())
                .orElse(Nature.HARDY);
        Nature attackerNature = natureRepository
                .findById(command.regulation(), command.attackerNatureId())
                .orElse(Nature.HARDY);

        MoveDefinition move = moveRepository
                .findById(command.regulation(), command.moveId())
                .orElseThrow(() -> new IllegalArgumentException("Unknown move: " + command.moveId()));

        Sp attackerSp = toSp(command.attackerSp());
        Stats attackerStats = attacker.baseStats().toBattleStats(attackerSp, attackerNature, VGC_LEVEL);
        StatsCommand attackerStatsCmd = toStatsCommand(attackerStats);
        List<String> attackerTypes = attacker.types().stream().map(Enum::name).toList();
        List<String> defenderTypes = defender.types().stream().map(Enum::name).toList();

        MoveCommand moveCmd = new MoveCommand(
                move.type(),
                move.category(),
                move.basePower(),
                move.spread(),
                move.contact(),
                move.doublePowerWhenUserStatused(),
                move.ignoreBurnPenaltyWhenUserStatused());

        try (ExecutorService executor = Executors.newVirtualThreadPerTaskExecutor()) {
            // Try the requested nature first; no suggestion needed.
            List<DefenseSpreadCandidate> result = searchSpread(
                    defender,
                    attackerStatsCmd,
                    attackerTypes,
                    defenderTypes,
                    moveCmd,
                    defenderNature,
                    null,
                    command,
                    executor);
            if (!result.isEmpty()) return new OptimizeDefenseResult(result);

            // Try defensive fallback natures based on move category.
            for (Nature fallback : getFallbackNatures(move.category())) {
                if (fallback == defenderNature) continue;
                result = searchSpread(
                        defender,
                        attackerStatsCmd,
                        attackerTypes,
                        defenderTypes,
                        moveCmd,
                        fallback,
                        fallback.name(),
                        command,
                        executor);
                if (!result.isEmpty()) return new OptimizeDefenseResult(result);
            }
        }

        return new OptimizeDefenseResult(List.of());
    }

    private List<DefenseSpreadCandidate> searchSpread(
            PokemonSpecies defender,
            StatsCommand attackerStatsCmd,
            List<String> attackerTypes,
            List<String> defenderTypes,
            MoveCommand moveCmd,
            Nature defenderNature,
            String suggestedNatureId,
            OptimizeDefenseCommand command,
            ExecutorService executor) {

        // Iterate total-SP tier by tier (0 → MAX_TOTAL_SP), stopping at first tier
        // with passing candidates. Each per-stat value is capped at MAX_SP (32).
        for (int tier = 0; tier <= MAX_TOTAL_SP; tier++) {
            List<DefenseSpreadCandidate> tierPassing = new CopyOnWriteArrayList<>();
            List<CompletableFuture<Void>> futures = new ArrayList<>();

            for (int spHp = 0; spHp <= Math.min(tier, MAX_SP); spHp++) {
                for (int spDef = 0; spDef <= Math.min(tier - spHp, MAX_SP); spDef++) {
                    int spSpd = tier - spHp - spDef;
                    if (spSpd > MAX_SP) continue;
                    final int fHp = spHp, fDef = spDef, fSpd = spSpd, fTier = tier;

                    futures.add(CompletableFuture.runAsync(
                            () -> {
                                Sp defenderSp = new Sp(fHp, 0, fDef, 0, fSpd, 0);
                                Stats defenderStats =
                                        defender.baseStats().toBattleStats(defenderSp, defenderNature, VGC_LEVEL);

                                CombatantCommand attackerCmd = new CombatantCommand(
                                        VGC_LEVEL,
                                        attackerStatsCmd,
                                        attackerTypes,
                                        command.attackerAbilityId(),
                                        command.attackerItemId(),
                                        "NONE",
                                        Map.of(),
                                        false,
                                        attackerStatsCmd.hp());
                                CombatantCommand defenderCmd = new CombatantCommand(
                                        VGC_LEVEL,
                                        toStatsCommand(defenderStats),
                                        defenderTypes,
                                        command.defenderAbilityId(),
                                        command.defenderItemId(),
                                        "NONE",
                                        Map.of(),
                                        false,
                                        defenderStats.hp());

                                CalculateDamageResult result =
                                        calculateDamageUseCase.calculate(new CalculateDamageCommand(
                                                command.regulation(),
                                                attackerCmd,
                                                defenderCmd,
                                                moveCmd,
                                                command.field(),
                                                command.attackerSide(),
                                                command.defenderSide(),
                                                command.criticalHit(),
                                                1));

                                if (meetsGoal(result, command.goal())) {
                                    tierPassing.add(new DefenseSpreadCandidate(
                                            fHp,
                                            fDef,
                                            fSpd,
                                            fTier,
                                            MAX_TOTAL_SP - fTier,
                                            result.minPct(),
                                            result.maxPct(),
                                            result.koChance().probability(),
                                            result.koChance().description(),
                                            suggestedNatureId));
                                }
                            },
                            executor));
                }
            }

            CompletableFuture.allOf(futures.toArray(new CompletableFuture[0])).join();

            if (!tierPassing.isEmpty()) {
                return tierPassing.stream()
                        .sorted(Comparator.comparingDouble(DefenseSpreadCandidate::koChanceProbability)
                                .thenComparingInt(DefenseSpreadCandidate::totalSp)
                                .thenComparing((a, b) -> Integer.compare(b.spHp(), a.spHp())))
                        .limit(MAX_RESULTS)
                        .toList();
            }
        }

        return List.of();
    }

    private static List<Nature> getFallbackNatures(String moveCategory) {
        return "PHYSICAL".equals(moveCategory) ? PHYSICAL_FALLBACKS : SPECIAL_FALLBACKS;
    }

    private static boolean meetsGoal(CalculateDamageResult result, String goal) {
        return switch (goal) {
            case "ALWAYS_SURVIVE" -> result.koChance().probability() == 0.0;
            case "SURVIVE_87_5" -> result.koChance().probability() <= 0.125;
            case "SURVIVE_FULL_HP" -> result.koChance().probability() == 0.0;
            default -> throw new IllegalArgumentException("Unknown goal: " + goal);
        };
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
}
