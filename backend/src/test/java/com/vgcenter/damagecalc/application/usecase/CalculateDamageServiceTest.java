package com.vgcenter.damagecalc.application.usecase;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.util.List;
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
                new SideConditionsCommand(false, false, false, false, false),
                new SideConditionsCommand(false, false, false, false, false),
                false,
                1));

        assertThat(result.rolls()).containsExactly(QUAD_EFFECTIVE);
        assertThat(result.min()).isEqualTo(328);
        assertThat(result.max()).isEqualTo(388);
        assertThat(result.minPct()).isEqualTo(205.0d);
        assertThat(result.maxPct()).isEqualTo(242.5d);
        assertThat(result.koChance()).isEqualTo(new KoChanceResult("Guaranteed OHKO", 1.0d, 1));
    }

    @Test
    void rejectsUnsupportedEnumValues() {
        CalculateDamageCommand invalidCommand = new CalculateDamageCommand(
                "M-A",
                attacker(),
                defender(),
                new MoveCommand("not-a-type", "SPECIAL", 90, false, false, false, false),
                new FieldCommand("CLEAR", "NONE", "NONE"),
                new SideConditionsCommand(false, false, false, false, false),
                new SideConditionsCommand(false, false, false, false, false),
                false,
                1);

        assertThatThrownBy(() -> service.calculate(invalidCommand))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Unsupported type");
    }

    private static CombatantCommand attacker() {
        return new CombatantCommand(
                50, new StatsCommand(140, 76, 70, 158, 95, 123), List.of("FIRE"), "none", "none", "NONE", true, true);
    }

    private static CombatantCommand defender() {
        return new CombatantCommand(
                50,
                new StatsCommand(160, 68, 111, 76, 99, 71),
                List.of("GRASS", "STEEL"),
                "none",
                "none",
                "NONE",
                true,
                true);
    }

    private static MoveCommand move() {
        return new MoveCommand("FIRE", "SPECIAL", 90, false, false, false, false);
    }
}
