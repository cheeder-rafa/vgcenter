package com.vgcenter.damagecalc.application.usecase;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.vgcenter.damagecalc.domain.model.Combatant;
import com.vgcenter.damagecalc.domain.model.Item;
import java.util.List;
import java.util.Map;
import org.junit.jupiter.api.Test;

class CalculateDamageServiceTest {

    private static final int[] QUAD_EFFECTIVE = {
        328, 328, 336, 340, 340, 348, 352, 352, 360, 364, 364, 372, 376, 376, 384, 388
    };

    private final CalculateDamageService service = new CalculateDamageService();

    @Test
    void calculatesDamageRollsAndKoChanceFromFullScenario() {
        CalculateDamageResult result = service.calculate(new CalculateDamageCommand(
                "M-A",
                attacker(),
                defender(),
                move(),
                new FieldCommand("CLEAR", "NONE", "NONE"),
                new SideConditionsCommand(false, false, false, false, false, false),
                new SideConditionsCommand(false, false, false, false, false, false),
                false,
                1));

        assertThat(result.rolls()).containsExactly(QUAD_EFFECTIVE);
        assertThat(result.min()).isEqualTo(328);
        assertThat(result.max()).isEqualTo(388);
        assertThat(result.minPct()).isEqualTo(205.0d);
        assertThat(result.maxPct()).isEqualTo(242.5d);
        assertThat(result.koChance()).isEqualTo(new KoChanceResult("guaranteed OHKO", 1.0d, 1));
    }

    @Test
    void rejectsUnsupportedEnumValues() {
        CalculateDamageCommand invalidCommand = new CalculateDamageCommand(
                "M-A",
                attacker(),
                defender(),
                new MoveCommand("not-a-type", "SPECIAL", 90, false, false, false, false),
                new FieldCommand("CLEAR", "NONE", "NONE"),
                new SideConditionsCommand(false, false, false, false, false, false),
                new SideConditionsCommand(false, false, false, false, false, false),
                false,
                1);

        assertThatThrownBy(() -> service.calculate(invalidCommand))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Unsupported type");
    }

    @Test
    void paralyzedAttackerFinalSpeedIsHalved() {
        Combatant combatant = invokeToCombatant(new CombatantCommand(
                50,
                new StatsCommand(140, 76, 70, 158, 95, 123),
                List.of("FIRE"),
                "none",
                "none",
                "PARALYSIS",
                Map.of(),
                true,
                true));

        assertThat(combatant.stats().speed()).isEqualTo(61);
    }

    @Test
    void appliesRequestedStatStagesBeforeCombatantCreation() {
        Combatant combatant = invokeToCombatant(new CombatantCommand(
                50,
                new StatsCommand(140, 76, 70, 158, 95, 123),
                List.of("FIRE"),
                "none",
                "none",
                "NONE",
                Map.of("atk", 2, "spe", -1),
                true,
                true));

        assertThat(combatant.stats().attack()).isEqualTo(152);
        assertThat(combatant.stats().speed()).isEqualTo(82);
    }

    @Test
    void returnsZeroDamageWhenProtectBlocksTheMove() {
        CalculateDamageResult result = service.calculate(new CalculateDamageCommand(
                "M-A",
                attacker(),
                defender(),
                new MoveCommand("NORMAL", "PHYSICAL", 80, false, true, false, false),
                new FieldCommand("CLEAR", "NONE", "NONE"),
                new SideConditionsCommand(false, false, false, false, false, false),
                new SideConditionsCommand(false, false, false, false, false, true),
                false,
                1));

        assertThat(result.rolls()).containsOnly(0);
        assertThat(result.koChance()).isEqualTo(new KoChanceResult("no 5HKO", 0.0d, 5));
    }

    @Test
    void unseenFistBypassesProtectForQuarterDamageOnContactMoves() {
        CalculateDamageResult unprotected = service.calculate(new CalculateDamageCommand(
                "M-A",
                attackerWithAbility("unseen-fist"),
                defender(),
                new MoveCommand("NORMAL", "PHYSICAL", 80, false, true, false, false),
                new FieldCommand("CLEAR", "NONE", "NONE"),
                new SideConditionsCommand(false, false, false, false, false, false),
                new SideConditionsCommand(false, false, false, false, false, false),
                false,
                1));
        CalculateDamageResult protectedResult = service.calculate(new CalculateDamageCommand(
                "M-A",
                attackerWithAbility("unseen-fist"),
                defender(),
                new MoveCommand("NORMAL", "PHYSICAL", 80, false, true, false, false),
                new FieldCommand("CLEAR", "NONE", "NONE"),
                new SideConditionsCommand(false, false, false, false, false, false),
                new SideConditionsCommand(false, false, false, false, false, true),
                false,
                1));

        assertThat(protectedResult.rolls()[0]).isEqualTo(unprotected.rolls()[0] / 4);
        assertThat(protectedResult.rolls()[15]).isEqualTo(unprotected.rolls()[15] / 4);
    }

    @Test
    void piercingDrillIgnoresProtectCompletely() {
        CalculateDamageResult unprotected = service.calculate(new CalculateDamageCommand(
                "M-A",
                attackerWithAbility("piercing-drill"),
                defender(),
                move(),
                new FieldCommand("CLEAR", "NONE", "NONE"),
                new SideConditionsCommand(false, false, false, false, false, false),
                new SideConditionsCommand(false, false, false, false, false, false),
                false,
                1));
        CalculateDamageResult protectedResult = service.calculate(new CalculateDamageCommand(
                "M-A",
                attackerWithAbility("piercing-drill"),
                defender(),
                move(),
                new FieldCommand("CLEAR", "NONE", "NONE"),
                new SideConditionsCommand(false, false, false, false, false, false),
                new SideConditionsCommand(false, false, false, false, false, true),
                false,
                1));

        assertThat(protectedResult.rolls()).containsExactly(unprotected.rolls());
    }

    @Test
    void guaranteed2HKOWhenMinRollKillsInTwo() {
        KoChanceResult result = invokeToKoChance(
                new int[] {40, 40, 40, 40, 40, 40, 40, 40, 40, 40, 40, 40, 40, 40, 40, 40}, 70, Item.NONE);

        assertThat(result).isEqualTo(new KoChanceResult("guaranteed 2HKO", 1.0d, 2));
    }

    @Test
    void reportsPercentChanceTo2HKOWhenProbabilityPartial() {
        KoChanceResult result = invokeToKoChance(
                new int[] {40, 40, 40, 40, 40, 40, 40, 40, 60, 60, 60, 60, 60, 60, 60, 60}, 100, Item.NONE);

        assertThat(result).isEqualTo(new KoChanceResult("75.00% chance to 2HKO", 0.75d, 2));
    }

    @Test
    void accountsForLeftoversRecoveryBetweenHits() {
        KoChanceResult result = invokeToKoChance(
                new int[] {50, 50, 50, 50, 50, 50, 50, 50, 50, 50, 50, 50, 50, 50, 50, 50}, 100, Item.LEFTOVERS);

        assertThat(result).isEqualTo(new KoChanceResult("guaranteed 3HKO after Leftovers recovery", 1.0d, 3));
    }

    @Test
    void accountsForSitrusBerryRecoveryOnce() {
        KoChanceResult result = invokeToKoChance(
                new int[] {55, 55, 55, 55, 55, 55, 55, 55, 55, 55, 55, 55, 55, 55, 55, 55}, 100, Item.SITRUS_BERRY);

        assertThat(result).isEqualTo(new KoChanceResult("guaranteed 3HKO after Sitrus Berry recovery", 1.0d, 3));
    }

    @Test
    void reportsGuaranteedOHKOWhenAllRollsKill() {
        KoChanceResult result = invokeToKoChance(
                new int[] {120, 120, 120, 120, 120, 120, 120, 120, 120, 120, 120, 120, 120, 120, 120, 120},
                100,
                Item.NONE);

        assertThat(result).isEqualTo(new KoChanceResult("guaranteed OHKO", 1.0d, 1));
    }

    private Combatant invokeToCombatant(CombatantCommand command) {
        try {
            java.lang.reflect.Method method =
                    CalculateDamageService.class.getDeclaredMethod("toCombatant", CombatantCommand.class);
            method.setAccessible(true);
            return (Combatant) method.invoke(service, command);
        } catch (ReflectiveOperationException exception) {
            throw new AssertionError(exception);
        }
    }

    private KoChanceResult invokeToKoChance(int[] rolls, int defenderHp, Item item) {
        try {
            java.lang.reflect.Method method =
                    CalculateDamageService.class.getDeclaredMethod("toKoChance", int[].class, int.class, Item.class);
            method.setAccessible(true);
            return (KoChanceResult) method.invoke(service, rolls, defenderHp, item);
        } catch (ReflectiveOperationException exception) {
            throw new AssertionError(exception);
        }
    }

    private static CombatantCommand attacker() {
        return new CombatantCommand(
                50,
                new StatsCommand(140, 76, 70, 158, 95, 123),
                List.of("FIRE"),
                "none",
                "none",
                "NONE",
                Map.of(),
                true,
                true);
    }

    private static CombatantCommand defender() {
        return new CombatantCommand(
                50,
                new StatsCommand(160, 68, 111, 76, 99, 71),
                List.of("GRASS", "STEEL"),
                "none",
                "none",
                "NONE",
                Map.of(),
                true,
                true);
    }

    private static CombatantCommand attackerWithAbility(String abilityId) {
        return new CombatantCommand(
                50,
                new StatsCommand(140, 76, 70, 158, 95, 123),
                List.of("FIRE"),
                abilityId,
                "none",
                "NONE",
                Map.of(),
                true,
                true);
    }

    private static MoveCommand move() {
        return new MoveCommand("FIRE", "SPECIAL", 90, false, false, false, false);
    }
}
