package com.vgcenter.damagecalc.domain.formula;

import static org.assertj.core.api.Assertions.assertThat;

import com.vgcenter.damagecalc.domain.model.Ability;
import com.vgcenter.damagecalc.domain.model.Combatant;
import com.vgcenter.damagecalc.domain.model.Move;
import com.vgcenter.damagecalc.domain.model.MoveCategory;
import com.vgcenter.damagecalc.domain.model.Stats;
import com.vgcenter.damagecalc.domain.model.Type;
import java.util.List;
import java.util.stream.Stream;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.MethodSource;

class DamageFormulaMegaGoldenSetTest {

    private static final DamageFormula DAMAGE_FORMULA = new DamageFormula();

    private static final int[] MEGA_CHARIZARD_X_DRAGON_CLAW = {
        67, 69, 69, 70, 72, 72, 73, 73, 75, 75, 76, 76, 78, 78, 79, 81
    };
    private static final int[] BASE_CHARIZARD_DRAGON_CLAW = {
        30, 30, 31, 31, 32, 32, 32, 33, 33, 33, 34, 34, 34, 35, 35, 36
    };
    private static final int[] MEGA_GENGAR_SHADOW_BALL_SUPER_EFFECTIVE = {
        174, 176, 180, 180, 182, 186, 186, 188, 192, 192, 194, 198, 198, 200, 204, 206
    };
    private static final int[] MEGA_LUCARIO_CLOSE_COMBAT_SUPER_EFFECTIVE = {
        300, 304, 308, 312, 316, 320, 320, 324, 328, 332, 336, 340, 344, 348, 352, 356
    };

    @ParameterizedTest(name = "{0}")
    @MethodSource("megaScenarios")
    void mega_activeToggleAffectsDamageRolls(String name, DamageContext context, int[] expectedRolls) {
        assertThat(DAMAGE_FORMULA.rolls(context)).containsExactly(expectedRolls);
    }

    private static Stream<Arguments> megaScenarios() {
        Combatant neutralDefender = new Combatant(50, new Stats(100, 100, 100, 100, 100, 100), List.of(Type.NORMAL));
        Combatant psychicDefender = new Combatant(50, new Stats(100, 100, 100, 100, 100, 100), List.of(Type.PSYCHIC));

        Move dragonClaw = new Move(Type.DRAGON, MoveCategory.PHYSICAL, 80, false, true, false, false);
        Move shadowBall = new Move(Type.GHOST, MoveCategory.SPECIAL, 80, false);
        Move closeCombat = new Move(Type.FIGHTING, MoveCategory.PHYSICAL, 120, false, true, false, false);

        // Final stats hardcoded (old-formula values for base/mega + Zero SP + nature) so the
        // damage golden arrays below continue to pin the damage formula regardless of
        // future stat-formula changes. See DamageFormulaGoldenSetTest for the same pattern.
        Combatant baseCharizard =
                new Combatant(50, new Stats(138, 97, 83, 102, 90, 105), List.of(Type.FIRE, Type.FLYING));
        Combatant megaCharizardX =
                new Combatant(50, new Stats(138, 148, 116, 121, 90, 105), List.of(Type.FIRE, Type.DRAGON));
        Combatant megaGengar =
                new Combatant(50, new Stats(120, 63, 85, 192, 100, 135), List.of(Type.GHOST, Type.POISON));
        Combatant megaLucario = new Combatant(
                        50, new Stats(130, 165, 93, 130, 75, 117), List.of(Type.FIGHTING, Type.STEEL))
                .withAbility(Ability.ADAPTABILITY);

        return Stream.of(
                Arguments.of(
                        "base Charizard Dragon Claw lacks STAB",
                        context(baseCharizard, neutralDefender, dragonClaw),
                        BASE_CHARIZARD_DRAGON_CLAW),
                Arguments.of(
                        "Mega Charizard X gains Dragon STAB from type swap",
                        context(megaCharizardX, neutralDefender, dragonClaw),
                        MEGA_CHARIZARD_X_DRAGON_CLAW),
                Arguments.of(
                        "Mega Gengar Shadow Ball against Psychic target",
                        context(megaGengar, psychicDefender, shadowBall),
                        MEGA_GENGAR_SHADOW_BALL_SUPER_EFFECTIVE),
                Arguments.of(
                        "Mega Lucario Close Combat applies Adaptability STAB",
                        context(megaLucario, neutralDefender, closeCombat),
                        MEGA_LUCARIO_CLOSE_COMBAT_SUPER_EFFECTIVE));
    }

    private static DamageContext context(Combatant attacker, Combatant defender, Move move) {
        return new DamageContext(
                attacker, defender, move, Field.clear(), SideConditions.none(), SideConditions.none(), false, 1);
    }
}
