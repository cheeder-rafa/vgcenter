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

public final class OptimizeDefensiveSpreadService implements OptimizeDefensiveSpreadUseCase {

    private static final int VGC_LEVEL = 50;
    private static final int MAX_SP = 32;
    private static final int MAX_RESULTS = 5;

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
        List<String> attackerTypes =
                attacker.types().stream().map(t -> t.name()).toList();

        List<DefenseSpreadCandidate> passing = new ArrayList<>();

        for (int spHp = 0; spHp <= MAX_SP; spHp++) {
            for (int spDef = 0; spDef <= MAX_SP - spHp; spDef++) {
                for (int spSpd = 0; spSpd <= MAX_SP - spHp - spDef; spSpd++) {
                    Sp defenderSp = new Sp(spHp, 0, spDef, 0, spSpd, 0);
                    Stats defenderStats = defender.baseStats().toBattleStats(defenderSp, defenderNature, VGC_LEVEL);
                    StatsCommand defenderStatsCmd = toStatsCommand(defenderStats);
                    List<String> defenderTypes =
                            defender.types().stream().map(t -> t.name()).toList();

                    CombatantCommand attackerCmd = new CombatantCommand(
                            VGC_LEVEL,
                            attackerStatsCmd,
                            attackerTypes,
                            command.attackerAbilityId(),
                            command.attackerItemId(),
                            "NONE",
                            Map.of(),
                            false,
                            attackerStats.hp());
                    CombatantCommand defenderCmd = new CombatantCommand(
                            VGC_LEVEL,
                            defenderStatsCmd,
                            defenderTypes,
                            null,
                            null,
                            "NONE",
                            Map.of(),
                            false,
                            defenderStats.hp());

                    MoveCommand moveCmd = new MoveCommand(
                            move.type(),
                            move.category(),
                            move.basePower(),
                            move.spread(),
                            move.contact(),
                            move.doublePowerWhenUserStatused(),
                            move.ignoreBurnPenaltyWhenUserStatused());

                    CalculateDamageCommand damageCmd = new CalculateDamageCommand(
                            command.regulation(),
                            attackerCmd,
                            defenderCmd,
                            moveCmd,
                            command.field(),
                            command.attackerSide(),
                            command.defenderSide(),
                            command.criticalHit(),
                            1);

                    CalculateDamageResult result = calculateDamageUseCase.calculate(damageCmd);

                    if (meetsGoal(result, command.goal())) {
                        int totalSp = spHp + spDef + spSpd;
                        passing.add(new DefenseSpreadCandidate(
                                spHp,
                                spDef,
                                spSpd,
                                totalSp,
                                MAX_SP - totalSp,
                                result.minPct(),
                                result.maxPct(),
                                result.koChance().probability(),
                                result.koChance().description()));
                    }
                }
            }
        }

        if (passing.isEmpty()) {
            return new OptimizeDefenseResult(List.of());
        }

        int minTotalSp =
                passing.stream().mapToInt(DefenseSpreadCandidate::totalSp).min().orElseThrow();
        List<DefenseSpreadCandidate> optimal = passing.stream()
                .filter(c -> c.totalSp() == minTotalSp)
                .sorted(Comparator.comparingInt(DefenseSpreadCandidate::spHp).reversed())
                .limit(MAX_RESULTS)
                .toList();

        return new OptimizeDefenseResult(optimal);
    }

    private static boolean meetsGoal(CalculateDamageResult result, String goal) {
        return switch (goal) {
            case "ALWAYS_SURVIVE" -> result.minPct() < 100.0;
            case "SURVIVE_87_5" -> result.koChance().probability() <= 0.125;
            case "SURVIVE_FULL_HP" -> result.minPct() < 100.0;
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
