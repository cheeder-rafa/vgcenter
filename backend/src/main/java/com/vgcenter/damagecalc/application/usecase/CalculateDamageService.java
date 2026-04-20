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
import com.vgcenter.damagecalc.domain.model.Stats;
import com.vgcenter.damagecalc.domain.model.StatusCondition;
import com.vgcenter.damagecalc.domain.model.Type;
import java.util.List;
import java.util.Locale;

public final class CalculateDamageService implements CalculateDamageUseCase {

    private final DamageFormula damageFormula = new DamageFormula();

    @Override
    public CalculateDamageResult calculate(CalculateDamageCommand command) {
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
                rolls, min, max, min * 100.0d / defenderHp, max * 100.0d / defenderHp, toKoChance(rolls, defenderHp));
    }

    private Combatant toCombatant(CombatantCommand command) {
        return new Combatant(
                command.level(),
                new Stats(
                        command.stats().hp(),
                        command.stats().attack(),
                        command.stats().defense(),
                        command.stats().specialAttack(),
                        command.stats().specialDefense(),
                        command.stats().speed()),
                command.types().stream()
                        .map(type -> parseEnum(Type.class, type, "type"))
                        .toList(),
                Ability.fromId(command.abilityId()),
                Item.fromId(command.itemId()),
                parseEnum(StatusCondition.class, command.status(), "status"),
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
                command.helpingHand());
    }

    private KoChanceResult toKoChance(int[] rolls, int defenderHp) {
        long koRolls = java.util.Arrays.stream(rolls)
                .filter(roll -> roll >= defenderHp)
                .count();
        double probability = koRolls / 16.0d;
        if (probability == 1.0d) {
            return new KoChanceResult("Guaranteed OHKO", probability, 1);
        }
        if (probability == 0.0d) {
            return new KoChanceResult("No OHKO", probability, 1);
        }
        String description = String.format(Locale.ROOT, "%.1f%% chance to OHKO", probability * 100.0d);
        return new KoChanceResult(description, probability, 1);
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
}
