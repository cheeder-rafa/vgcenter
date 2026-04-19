package com.vgcenter.damagecalc.domain.formula;

import static org.assertj.core.api.Assertions.assertThat;

import com.vgcenter.damagecalc.domain.model.Combatant;
import com.vgcenter.damagecalc.domain.model.Move;
import com.vgcenter.damagecalc.domain.model.MoveCategory;
import com.vgcenter.damagecalc.domain.model.Nature;
import com.vgcenter.damagecalc.domain.model.Sp;
import com.vgcenter.damagecalc.domain.model.Stats;
import com.vgcenter.damagecalc.domain.model.Type;
import java.util.List;
import java.util.stream.Stream;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.MethodSource;

class DamageFormulaGoldenSetTest {

    private static final DamageFormula DAMAGE_FORMULA = new DamageFormula();

    @ParameterizedTest(name = "{0}")
    @MethodSource("goldenSet")
    void calculatesExpectedRollsForTheMinimalModifierChain(
            String scenarioName, DamageContext context, int[] expectedRolls) {
        assertThat(DAMAGE_FORMULA.rolls(context)).containsExactly(expectedRolls);
        assertThat(DAMAGE_FORMULA.calculate(context)).isEqualTo(expectedRolls[expectedRolls.length - 1]);
    }

    private static Stream<Arguments> goldenSet() {
        Combatant physicalAttacker = combatant(
                List.of(Type.NORMAL),
                new Stats(91, 123, 70, 95, 70, 80),
                new Sp(7, 17, 5, 9, 3, 13),
                Nature.ADAMANT,
                50);
        Combatant specialAttacker = combatant(
                List.of(Type.FIRE), new Stats(80, 70, 65, 125, 90, 110), new Sp(3, 5, 7, 21, 9, 13), Nature.MODEST, 50);
        Combatant bulkyDefender = combatant(
                List.of(Type.WATER), new Stats(90, 70, 95, 70, 90, 60), new Sp(21, 5, 11, 3, 9, 7), Nature.BOLD, 50);
        Combatant grassDefender = combatant(
                List.of(Type.GRASS), new Stats(90, 70, 95, 70, 90, 60), new Sp(21, 5, 11, 3, 9, 7), Nature.BOLD, 50);
        Combatant grassSteelDefender = combatant(
                List.of(Type.GRASS, Type.STEEL),
                new Stats(90, 70, 95, 70, 90, 60),
                new Sp(21, 5, 11, 3, 9, 7),
                Nature.BOLD,
                50);
        Combatant waterDragonDefender = combatant(
                List.of(Type.WATER, Type.DRAGON),
                new Stats(90, 70, 95, 70, 90, 60),
                new Sp(21, 5, 11, 3, 9, 7),
                Nature.BOLD,
                50);
        Combatant ghostDefender = combatant(
                List.of(Type.GHOST), new Stats(90, 70, 95, 70, 90, 60), new Sp(21, 5, 11, 3, 9, 7), Nature.BOLD, 50);
        Combatant bugDefender = combatant(
                List.of(Type.BUG), new Stats(90, 70, 95, 70, 90, 60), new Sp(21, 5, 11, 3, 9, 7), Nature.BOLD, 50);
        Combatant groundDefender = combatant(
                List.of(Type.GROUND), new Stats(90, 70, 95, 70, 90, 60), new Sp(21, 5, 11, 3, 9, 7), Nature.BOLD, 50);
        Combatant rockDefender = combatant(
                List.of(Type.ROCK), new Stats(90, 70, 110, 70, 120, 60), new Sp(21, 5, 7, 3, 15, 7), Nature.CALM, 50);
        Combatant iceDefender = combatant(
                List.of(Type.ICE), new Stats(90, 70, 100, 70, 80, 60), new Sp(21, 5, 13, 3, 5, 7), Nature.IMPISH, 50);

        return Stream.of(
                Arguments.of(
                        "neutral physical without stab",
                        context(
                                physicalAttacker,
                                bulkyDefender,
                                move(Type.GROUND, MoveCategory.PHYSICAL, 80, false),
                                Weather.CLEAR,
                                false,
                                1),
                        new int[] {39, 40, 40, 41, 41, 42, 42, 43, 43, 44, 44, 45, 45, 46, 46, 47}),
                Arguments.of(
                        "physical stab",
                        context(
                                physicalAttacker,
                                bulkyDefender,
                                move(Type.NORMAL, MoveCategory.PHYSICAL, 80, false),
                                Weather.CLEAR,
                                false,
                                1),
                        new int[] {58, 60, 60, 61, 61, 63, 63, 64, 64, 66, 66, 67, 67, 69, 69, 70}),
                Arguments.of(
                        "special stab",
                        context(
                                specialAttacker,
                                grassDefender,
                                move(Type.FIRE, MoveCategory.SPECIAL, 90, false),
                                Weather.CLEAR,
                                false,
                                1),
                        new int[] {158, 162, 162, 164, 168, 168, 170, 170, 174, 176, 176, 180, 182, 182, 186, 188}),
                Arguments.of(
                        "quad effectiveness",
                        context(
                                specialAttacker,
                                grassSteelDefender,
                                move(Type.FIRE, MoveCategory.SPECIAL, 90, false),
                                Weather.CLEAR,
                                false,
                                1),
                        new int[] {316, 324, 324, 328, 336, 336, 340, 340, 348, 352, 352, 360, 364, 364, 372, 376}),
                Arguments.of(
                        "double resistance",
                        context(
                                specialAttacker,
                                waterDragonDefender,
                                move(Type.FIRE, MoveCategory.SPECIAL, 90, false),
                                Weather.CLEAR,
                                false,
                                1),
                        new int[] {19, 20, 20, 20, 21, 21, 21, 21, 21, 22, 22, 22, 22, 22, 23, 23}),
                Arguments.of(
                        "type immunity",
                        context(
                                physicalAttacker,
                                ghostDefender,
                                move(Type.NORMAL, MoveCategory.PHYSICAL, 80, false),
                                Weather.CLEAR,
                                false,
                                1),
                        new int[] {0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0}),
                Arguments.of(
                        "spread move against one target",
                        context(
                                physicalAttacker.withTypes(List.of(Type.ROCK)),
                                bugDefender,
                                move(Type.ROCK, MoveCategory.PHYSICAL, 75, true),
                                Weather.CLEAR,
                                false,
                                1),
                        new int[] {110, 110, 114, 114, 116, 116, 120, 120, 120, 122, 122, 126, 126, 128, 128, 132}),
                Arguments.of(
                        "spread move against multiple targets",
                        context(
                                physicalAttacker.withTypes(List.of(Type.ROCK)),
                                bugDefender,
                                move(Type.ROCK, MoveCategory.PHYSICAL, 75, true),
                                Weather.CLEAR,
                                false,
                                2),
                        new int[] {84, 84, 84, 86, 86, 86, 90, 90, 90, 92, 92, 92, 96, 96, 96, 98}),
                Arguments.of(
                        "sun boosts fire",
                        context(
                                specialAttacker,
                                grassDefender,
                                move(Type.FIRE, MoveCategory.SPECIAL, 90, false),
                                Weather.SUN,
                                false,
                                1),
                        new int[] {236, 240, 242, 246, 248, 252, 254, 258, 260, 264, 266, 270, 272, 276, 278, 282}),
                Arguments.of(
                        "sun weakens water",
                        context(
                                specialAttacker.withTypes(List.of(Type.WATER)),
                                groundDefender,
                                move(Type.WATER, MoveCategory.SPECIAL, 90, false),
                                Weather.SUN,
                                false,
                                1),
                        new int[] {78, 78, 78, 80, 80, 80, 84, 84, 84, 86, 86, 86, 90, 90, 90, 92}),
                Arguments.of(
                        "rain boosts water",
                        context(
                                specialAttacker.withTypes(List.of(Type.WATER)),
                                groundDefender,
                                move(Type.WATER, MoveCategory.SPECIAL, 90, false),
                                Weather.RAIN,
                                false,
                                1),
                        new int[] {236, 240, 242, 246, 248, 252, 254, 258, 260, 264, 266, 270, 272, 276, 278, 282}),
                Arguments.of(
                        "rain weakens fire",
                        context(
                                specialAttacker,
                                grassDefender,
                                move(Type.FIRE, MoveCategory.SPECIAL, 90, false),
                                Weather.RAIN,
                                false,
                                1),
                        new int[] {78, 78, 78, 80, 80, 80, 84, 84, 84, 86, 86, 86, 90, 90, 90, 92}),
                Arguments.of(
                        "critical hit",
                        context(
                                physicalAttacker,
                                bulkyDefender,
                                move(Type.NORMAL, MoveCategory.PHYSICAL, 80, false),
                                Weather.CLEAR,
                                true,
                                1),
                        new int[] {88, 90, 90, 91, 93, 94, 94, 96, 97, 97, 99, 100, 100, 102, 103, 105}),
                Arguments.of(
                        "sand boosts rock special defense",
                        context(
                                specialAttacker.withTypes(List.of(Type.WATER)),
                                rockDefender,
                                move(Type.WATER, MoveCategory.SPECIAL, 90, false),
                                Weather.SAND,
                                false,
                                1),
                        new int[] {72, 72, 74, 74, 74, 78, 78, 78, 78, 80, 80, 80, 84, 84, 84, 86}),
                Arguments.of(
                        "snow boosts ice physical defense",
                        context(
                                physicalAttacker.withTypes(List.of(Type.FIGHTING)),
                                iceDefender,
                                move(Type.FIGHTING, MoveCategory.PHYSICAL, 80, false),
                                Weather.SNOW,
                                false,
                                1),
                        new int[] {72, 72, 74, 74, 74, 78, 78, 78, 78, 80, 80, 80, 84, 84, 84, 86}));
    }

    private static Combatant combatant(List<Type> types, Stats baseStats, Sp sp, Nature nature, int level) {
        return Combatant.fromBaseStats(level, types, baseStats, sp, nature);
    }

    private static DamageContext context(
            Combatant attacker, Combatant defender, Move move, Weather weather, boolean criticalHit, int targets) {
        return new DamageContext(attacker, defender, move, weather, criticalHit, targets);
    }

    private static Move move(Type type, MoveCategory category, int basePower, boolean spread) {
        return new Move(type, category, basePower, spread);
    }
}
