package com.vgcenter.damagecalc.application.usecase;

import com.vgcenter.damagecalc.domain.formula.DamageContext;
import com.vgcenter.damagecalc.domain.formula.DamageFormula;
import com.vgcenter.damagecalc.domain.formula.Field;
import com.vgcenter.damagecalc.domain.formula.Room;
import com.vgcenter.damagecalc.domain.formula.SideConditions;
import com.vgcenter.damagecalc.domain.formula.Terrain;
import com.vgcenter.damagecalc.domain.formula.Weather;
import com.vgcenter.damagecalc.domain.model.Ability;
import com.vgcenter.damagecalc.domain.model.Combatant;
import com.vgcenter.damagecalc.domain.model.Item;
import com.vgcenter.damagecalc.domain.model.Move;
import com.vgcenter.damagecalc.domain.model.MoveCategory;
import com.vgcenter.damagecalc.domain.model.Stat;
import com.vgcenter.damagecalc.domain.model.Stats;
import com.vgcenter.damagecalc.domain.model.StatusCondition;
import com.vgcenter.damagecalc.domain.model.Type;
import java.util.List;
import java.util.Locale;
import java.util.Map;

public final class CalculateDamageService implements CalculateDamageUseCase {

    private final DamageFormula damageFormula = new DamageFormula();

    @Override
    public CalculateDamageResult calculate(CalculateDamageCommand command) {
        Item defenderItem = Item.fromId(command.defender().itemId());
        DamageContext context = new DamageContext(
                toCombatant(command.attacker()),
                toCombatant(command.defender()),
                toMove(command.move()),
                toField(command.field()),
                toSideConditions(command.attackerSide()),
                toSideConditions(command.defenderSide()),
                command.criticalHit(),
                command.targets());
        int[] rolls = damageFormula.rolls(context);
        int min = rolls[0];
        int max = rolls[rolls.length - 1];
        int defenderHp = context.defender().stats().hp();
        return new CalculateDamageResult(
                rolls,
                min,
                max,
                min * 100.0d / defenderHp,
                max * 100.0d / defenderHp,
                toKoChance(rolls, defenderHp, defenderItem));
    }

    private Combatant toCombatant(CombatantCommand command) {
        StatusCondition status = parseEnum(StatusCondition.class, command.status(), "status");
        Stats inputStats = new Stats(
                command.stats().hp(),
                command.stats().attack(),
                command.stats().defense(),
                command.stats().specialAttack(),
                command.stats().specialDefense(),
                command.stats().speed());
        Stats stagedStats = applyStages(inputStats, command.stages());
        return new Combatant(
                command.level(),
                adjustStatsForStatus(stagedStats, status),
                command.types().stream()
                        .map(type -> parseEnum(Type.class, type, "type"))
                        .toList(),
                Ability.fromId(command.abilityId()),
                Item.fromId(command.itemId()),
                status,
                command.grounded(),
                command.fullHp());
    }

    private Move toMove(MoveCommand command) {
        return new Move(
                parseEnum(Type.class, command.type(), "type"),
                parseEnum(MoveCategory.class, command.category(), "move category"),
                command.basePower(),
                command.spread(),
                command.contact(),
                command.doublePowerWhenUserStatused(),
                command.ignoreBurnPenaltyWhenUserStatused());
    }

    private Field toField(FieldCommand command) {
        return new Field(
                parseEnum(Weather.class, command.weather(), "weather"),
                parseEnum(Terrain.class, command.terrain(), "terrain"),
                parseEnum(Room.class, command.room(), "room"));
    }

    private SideConditions toSideConditions(SideConditionsCommand command) {
        return new SideConditions(
                command.reflect(),
                command.lightScreen(),
                command.auroraVeil(),
                command.friendGuard(),
                command.helpingHand(),
                command.tailwind(),
                command.protect());
    }

    private KoChanceResult toKoChance(int[] rolls, int defenderHp, Item defenderItem) {
        KoChanceResult baseline = evaluateKoChance(rolls, defenderHp, Item.NONE);
        KoChanceResult actual = evaluateKoChance(rolls, defenderHp, defenderItem);
        if (defenderItem == Item.LEFTOVERS && differsFromBaseline(actual, baseline)) {
            return new KoChanceResult(
                    actual.description() + " after Leftovers recovery", actual.probability(), actual.hits());
        }
        if (defenderItem == Item.SITRUS_BERRY && differsFromBaseline(actual, baseline)) {
            return new KoChanceResult(
                    actual.description() + " after Sitrus Berry recovery", actual.probability(), actual.hits());
        }
        return actual;
    }

    private KoChanceResult evaluateKoChance(int[] rolls, int defenderHp, Item defenderItem) {
        for (int hits = 1; hits <= 5; hits++) {
            double probability = knockoutProbability(rolls, defenderHp, defenderItem, hits);
            if (probability == 1.0d) {
                return new KoChanceResult(guaranteedDescription(hits), probability, hits);
            }
            if (probability > 0.0d) {
                return new KoChanceResult(chanceDescription(hits, probability), probability, hits);
            }
        }
        return new KoChanceResult("no 5HKO", 0.0d, 5);
    }

    private double knockoutProbability(int[] rolls, int defenderHp, Item defenderItem, int hits) {
        long koSequences = countKoSequences(rolls, defenderHp, defenderHp, defenderItem, hits, false);
        double totalSequences = Math.pow(rolls.length, hits);
        return koSequences / totalSequences;
    }

    private long countKoSequences(
            int[] rolls, int maxHp, int currentHp, Item defenderItem, int remainingHits, boolean sitrusConsumed) {
        long koSequences = 0L;
        for (int roll : rolls) {
            HitState nextState = applyHit(maxHp, currentHp, defenderItem, sitrusConsumed, roll, remainingHits > 1);
            if (nextState.knockedOut()) {
                koSequences += (long) Math.pow(rolls.length, remainingHits - 1);
                continue;
            }
            if (remainingHits > 1) {
                koSequences += countKoSequences(
                        rolls,
                        maxHp,
                        nextState.remainingHp(),
                        defenderItem,
                        remainingHits - 1,
                        nextState.sitrusConsumed());
            }
        }
        return koSequences;
    }

    private HitState applyHit(
            int maxHp, int currentHp, Item defenderItem, boolean sitrusConsumed, int damage, boolean canRecover) {
        int remainingHp = currentHp - damage;
        if (remainingHp <= 0) {
            return new HitState(0, sitrusConsumed, true);
        }
        if (!canRecover) {
            return new HitState(remainingHp, sitrusConsumed, false);
        }

        return switch (defenderItem) {
            case LEFTOVERS -> new HitState(Math.min(maxHp, remainingHp + maxHp / 16), sitrusConsumed, false);
            case SITRUS_BERRY -> applySitrus(maxHp, currentHp, remainingHp, sitrusConsumed);
            default -> new HitState(remainingHp, sitrusConsumed, false);
        };
    }

    private HitState applySitrus(int maxHp, int currentHp, int remainingHp, boolean sitrusConsumed) {
        if (sitrusConsumed || currentHp <= maxHp / 2 || remainingHp > maxHp / 2) {
            return new HitState(remainingHp, sitrusConsumed, false);
        }
        return new HitState(Math.min(maxHp, remainingHp + maxHp / 4), true, false);
    }

    private boolean differsFromBaseline(KoChanceResult actual, KoChanceResult baseline) {
        return actual.hits() != baseline.hits() || Double.compare(actual.probability(), baseline.probability()) != 0;
    }

    private String guaranteedDescription(int hits) {
        return hits == 1 ? "guaranteed OHKO" : "guaranteed " + hits + "HKO";
    }

    private String chanceDescription(int hits, double probability) {
        String koLabel = hits == 1 ? "OHKO" : hits + "HKO";
        return String.format(Locale.ROOT, "%.2f%% chance to %s", probability * 100.0d, koLabel);
    }

    private Stats adjustStatsForStatus(Stats stats, StatusCondition status) {
        if (status != StatusCondition.PARALYSIS) {
            return stats;
        }
        return new Stats(
                stats.hp(),
                stats.attack(),
                stats.defense(),
                stats.specialAttack(),
                stats.specialDefense(),
                stats.speed() / 2);
    }

    private Stats applyStages(Stats stats, Map<String, Integer> stages) {
        return new Stats(
                stats.hp(),
                applyStage(stats.attack(), stages, Stat.ATTACK),
                applyStage(stats.defense(), stages, Stat.DEFENSE),
                applyStage(stats.specialAttack(), stages, Stat.SPECIAL_ATTACK),
                applyStage(stats.specialDefense(), stages, Stat.SPECIAL_DEFENSE),
                applyStage(stats.speed(), stages, Stat.SPEED));
    }

    private int applyStage(int statValue, Map<String, Integer> stages, Stat stat) {
        return Stats.applyStage(statValue, stages.getOrDefault(statKey(stat), 0));
    }

    private String statKey(Stat stat) {
        return switch (stat) {
            case ATTACK -> "atk";
            case DEFENSE -> "def";
            case SPECIAL_ATTACK -> "spa";
            case SPECIAL_DEFENSE -> "spd";
            case SPEED -> "spe";
            case HP -> throw new IllegalArgumentException("HP stages are not supported");
        };
    }

    private static <E extends Enum<E>> E parseEnum(Class<E> enumType, String rawValue, String label) {
        try {
            return Enum.valueOf(enumType, normalize(rawValue));
        } catch (IllegalArgumentException exception) {
            throw new IllegalArgumentException("Unsupported " + label + ": " + rawValue + ". Expected one of "
                    + List.of(enumType.getEnumConstants()));
        }
    }

    private static String normalize(String rawValue) {
        if (rawValue == null || rawValue.isBlank()) {
            throw new IllegalArgumentException("Enum value must not be blank");
        }
        return rawValue.trim().toUpperCase(Locale.ROOT).replace('-', '_');
    }

    private record HitState(int remainingHp, boolean sitrusConsumed, boolean knockedOut) {}
}
