package com.vgcenter.damagecalc.domain.formula;

import static org.assertj.core.api.Assertions.assertThat;

import com.vgcenter.damagecalc.domain.model.Ability;
import com.vgcenter.damagecalc.domain.model.Combatant;
import com.vgcenter.damagecalc.domain.model.Item;
import com.vgcenter.damagecalc.domain.model.Move;
import com.vgcenter.damagecalc.domain.model.MoveCategory;
import com.vgcenter.damagecalc.domain.model.Stats;
import com.vgcenter.damagecalc.domain.model.StatusCondition;
import com.vgcenter.damagecalc.domain.model.Type;
import java.util.Arrays;
import java.util.List;
import java.util.stream.Stream;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.MethodSource;

class DamageFormulaGoldenSetTest {

    private static final DamageFormula DAMAGE_FORMULA = new DamageFormula();

    private static final int[] NEUTRAL_PHYSICAL = {39, 40, 40, 41, 41, 42, 42, 43, 43, 44, 44, 45, 45, 46, 46, 47};
    private static final int[] PHYSICAL_STAB = {58, 60, 60, 61, 61, 63, 63, 64, 64, 66, 66, 67, 67, 69, 69, 70};
    private static final int[] SPECIAL_STAB = {
        158, 162, 162, 164, 168, 168, 170, 170, 174, 176, 176, 180, 182, 182, 186, 188
    };
    private static final int[] QUAD_EFFECTIVE = {
        316, 324, 324, 328, 336, 336, 340, 340, 348, 352, 352, 360, 364, 364, 372, 376
    };
    private static final int[] DOUBLE_RESISTED = {19, 20, 20, 20, 21, 21, 21, 21, 21, 22, 22, 22, 22, 22, 23, 23};
    private static final int[] SPREAD_SINGLE_TARGET = {
        110, 110, 114, 114, 116, 116, 120, 120, 120, 122, 122, 126, 126, 128, 128, 132
    };
    private static final int[] SPREAD_MULTI_TARGET = {84, 84, 84, 86, 86, 86, 90, 90, 90, 92, 92, 92, 96, 96, 96, 98};
    private static final int[] SUN_BOOSTED_FIRE = {
        236, 240, 242, 246, 248, 252, 254, 258, 260, 264, 266, 270, 272, 276, 278, 282
    };
    private static final int[] WEATHER_WEAKENED = {78, 78, 78, 80, 80, 80, 84, 84, 84, 86, 86, 86, 90, 90, 90, 92};
    private static final int[] CRITICAL_PHYSICAL_STAB = {
        88, 90, 90, 91, 93, 94, 94, 96, 97, 97, 99, 100, 100, 102, 103, 105
    };
    private static final int[] SAND_SPDEF_BOOST = {72, 72, 74, 74, 74, 78, 78, 78, 78, 80, 80, 80, 84, 84, 84, 86};

    @ParameterizedTest(name = "{0}")
    @MethodSource("goldenSet")
    void calculatesExpectedRollsForTheFullModifierChain(
            String scenarioName, DamageContext context, int[] expectedRolls) {
        assertThat(DAMAGE_FORMULA.rolls(context)).containsExactly(expectedRolls);
        assertThat(DAMAGE_FORMULA.calculate(context)).isEqualTo(expectedRolls[expectedRolls.length - 1]);
    }

    private static Stream<Arguments> goldenSet() {
        // Final stats are hardcoded (rather than derived via toBattleStats) so that the
        // damage-formula golden arrays below remain pinned to the same numeric inputs
        // regardless of future stat-formula changes. These were the values produced for
        // each (baseStats, Sp, nature) tuple under the original stat formula; preserving
        // them keeps this golden set a check on the damage formula only.
        Combatant physicalAttacker = combatant(List.of(Type.NORMAL), new Stats(154, 149, 77, 93, 76, 91));
        Combatant specialAttacker = combatant(List.of(Type.FIRE), new Stats(141, 69, 73, 154, 99, 121));
        Combatant bulkyDefender = combatant(List.of(Type.WATER), new Stats(160, 69, 115, 76, 99, 68));
        Combatant grassDefender = combatant(List.of(Type.GRASS), new Stats(160, 69, 115, 76, 99, 68));
        Combatant grassSteelDefender = combatant(List.of(Type.GRASS, Type.STEEL), new Stats(160, 69, 115, 76, 99, 68));
        Combatant waterDragonDefender =
                combatant(List.of(Type.WATER, Type.DRAGON), new Stats(160, 69, 115, 76, 99, 68));
        Combatant ghostDefender = combatant(List.of(Type.GHOST), new Stats(160, 69, 115, 76, 99, 68));
        Combatant bugDefender = combatant(List.of(Type.BUG), new Stats(160, 69, 115, 76, 99, 68));
        Combatant groundDefender = combatant(List.of(Type.GROUND), new Stats(160, 69, 115, 76, 99, 68));
        Combatant electricDefender = combatant(List.of(Type.ELECTRIC), new Stats(160, 69, 115, 76, 99, 68));
        Combatant rockDefender = combatant(List.of(Type.ROCK), new Stats(160, 69, 118, 76, 145, 68));
        Combatant iceDefender = combatant(List.of(Type.ICE), new Stats(160, 77, 122, 68, 87, 68));
        Combatant fightingDefender = combatant(List.of(Type.FIGHTING), new Stats(160, 69, 115, 76, 99, 68));
        Combatant wonderRoomDefender = new Combatant(50, new Stats(100, 100, 200, 100, 100, 100), List.of(Type.NORMAL));

        Move physicalNeutral = move(Type.GROUND, MoveCategory.PHYSICAL, 80, false);
        Move physicalStab = move(Type.NORMAL, MoveCategory.PHYSICAL, 80, false);
        Move fairyPhysical = move(Type.FAIRY, MoveCategory.PHYSICAL, 80, false);
        Move physicalContact = move(Type.NORMAL, MoveCategory.PHYSICAL, 80, false, true);
        Move specialFire = move(Type.FIRE, MoveCategory.SPECIAL, 90, false);
        Move electricSpecial = move(Type.ELECTRIC, MoveCategory.SPECIAL, 90, false);
        Move grassySpecial = move(Type.GRASS, MoveCategory.SPECIAL, 90, false);
        Move psychicSpecial = move(Type.PSYCHIC, MoveCategory.SPECIAL, 90, false);

        return Stream.of(
                Arguments.of(
                        "neutral physical without stab",
                        context(physicalAttacker, bulkyDefender, physicalNeutral),
                        NEUTRAL_PHYSICAL),
                Arguments.of("physical stab", context(physicalAttacker, bulkyDefender, physicalStab), PHYSICAL_STAB),
                Arguments.of("special stab", context(specialAttacker, grassDefender, specialFire), SPECIAL_STAB),
                Arguments.of(
                        "no weather (NONE) has no modifier",
                        context(
                                specialAttacker,
                                grassDefender,
                                specialFire,
                                field(Weather.NONE, Terrain.NONE, Room.NONE)),
                        SPECIAL_STAB),
                Arguments.of(
                        "quad effectiveness",
                        context(specialAttacker, grassSteelDefender, specialFire),
                        QUAD_EFFECTIVE),
                Arguments.of(
                        "double resistance",
                        context(specialAttacker, waterDragonDefender, specialFire),
                        DOUBLE_RESISTED),
                Arguments.of("type immunity", context(physicalAttacker, ghostDefender, physicalStab), zeroes()),
                Arguments.of(
                        "spread move against one target",
                        context(
                                physicalAttacker.withTypes(List.of(Type.ROCK)),
                                bugDefender,
                                move(Type.ROCK, MoveCategory.PHYSICAL, 75, true)),
                        SPREAD_SINGLE_TARGET),
                Arguments.of(
                        "spread move against multiple targets",
                        context(
                                physicalAttacker.withTypes(List.of(Type.ROCK)),
                                bugDefender,
                                move(Type.ROCK, MoveCategory.PHYSICAL, 75, true),
                                Field.clear(),
                                SideConditions.none(),
                                SideConditions.none(),
                                false,
                                2),
                        SPREAD_MULTI_TARGET),
                Arguments.of(
                        "sun boosts fire",
                        context(
                                specialAttacker,
                                grassDefender,
                                specialFire,
                                field(Weather.SUN, Terrain.NONE, Room.NONE)),
                        SUN_BOOSTED_FIRE),
                Arguments.of(
                        "sun weakens water",
                        context(
                                specialAttacker.withTypes(List.of(Type.WATER)),
                                groundDefender,
                                move(Type.WATER, MoveCategory.SPECIAL, 90, false),
                                field(Weather.SUN, Terrain.NONE, Room.NONE)),
                        WEATHER_WEAKENED),
                Arguments.of(
                        "rain boosts water",
                        context(
                                specialAttacker.withTypes(List.of(Type.WATER)),
                                groundDefender,
                                move(Type.WATER, MoveCategory.SPECIAL, 90, false),
                                field(Weather.RAIN, Terrain.NONE, Room.NONE)),
                        SUN_BOOSTED_FIRE),
                Arguments.of(
                        "rain weakens fire",
                        context(
                                specialAttacker,
                                grassDefender,
                                specialFire,
                                field(Weather.RAIN, Terrain.NONE, Room.NONE)),
                        WEATHER_WEAKENED),
                Arguments.of(
                        "critical hit",
                        context(
                                physicalAttacker,
                                bulkyDefender,
                                physicalStab,
                                Field.clear(),
                                SideConditions.none(),
                                SideConditions.none(),
                                true,
                                1),
                        CRITICAL_PHYSICAL_STAB),
                Arguments.of(
                        "sand boosts rock special defense",
                        context(
                                specialAttacker.withTypes(List.of(Type.WATER)),
                                rockDefender,
                                move(Type.WATER, MoveCategory.SPECIAL, 90, false),
                                field(Weather.SAND, Terrain.NONE, Room.NONE)),
                        SAND_SPDEF_BOOST),
                Arguments.of(
                        "snow boosts ice physical defense",
                        context(
                                physicalAttacker.withTypes(List.of(Type.FIGHTING)),
                                iceDefender,
                                move(Type.FIGHTING, MoveCategory.PHYSICAL, 80, false),
                                field(Weather.SNOW, Terrain.NONE, Room.NONE)),
                        SAND_SPDEF_BOOST),
                Arguments.of(
                        "burn halves physical damage",
                        context(physicalAttacker.withStatus(StatusCondition.BURN), bulkyDefender, physicalStab),
                        scaled(PHYSICAL_STAB, 1, 2)),
                Arguments.of(
                        "burn does not affect special damage",
                        context(specialAttacker.withStatus(StatusCondition.BURN), grassDefender, specialFire),
                        SPECIAL_STAB),
                Arguments.of(
                        "guts overrides burn and boosts physical damage",
                        context(
                                physicalAttacker.withAbility(Ability.GUTS).withStatus(StatusCondition.BURN),
                                bulkyDefender,
                                physicalStab),
                        scaled(PHYSICAL_STAB, 3, 2)),
                Arguments.of(
                        "adaptability upgrades stab to two times",
                        context(physicalAttacker.withAbility(Ability.ADAPTABILITY), bulkyDefender, physicalStab),
                        scaled(NEUTRAL_PHYSICAL, 2, 1)),
                Arguments.of(
                        "fairy aura boosts fairy moves",
                        context(
                                physicalAttacker.withTypes(List.of(Type.FAIRY)).withAbility(Ability.FAIRY_AURA),
                                bulkyDefender,
                                fairyPhysical),
                        scaled(PHYSICAL_STAB, 4, 3)),
                Arguments.of(
                        "reflect reduces physical damage",
                        context(
                                physicalAttacker,
                                bulkyDefender,
                                physicalStab,
                                Field.clear(),
                                SideConditions.none(),
                                new SideConditions(true, false, false, false, false, false, false),
                                false,
                                1),
                        scaled(PHYSICAL_STAB, 2, 3)),
                Arguments.of(
                        "light screen reduces special damage",
                        context(
                                specialAttacker,
                                grassDefender,
                                specialFire,
                                Field.clear(),
                                SideConditions.none(),
                                new SideConditions(false, true, false, false, false, false, false),
                                false,
                                1),
                        scaled(SPECIAL_STAB, 2, 3)),
                Arguments.of(
                        "aurora veil reduces physical damage",
                        context(
                                physicalAttacker,
                                bulkyDefender,
                                physicalStab,
                                Field.clear(),
                                SideConditions.none(),
                                new SideConditions(false, false, true, false, false, false, false),
                                false,
                                1),
                        scaled(PHYSICAL_STAB, 2, 3)),
                Arguments.of(
                        "aurora veil reduces special damage",
                        context(
                                specialAttacker,
                                grassDefender,
                                specialFire,
                                Field.clear(),
                                SideConditions.none(),
                                new SideConditions(false, false, true, false, false, false, false),
                                false,
                                1),
                        scaled(SPECIAL_STAB, 2, 3)),
                Arguments.of(
                        "helping hand boosts allied damage",
                        context(
                                physicalAttacker,
                                bulkyDefender,
                                physicalStab,
                                Field.clear(),
                                new SideConditions(false, false, false, false, true, false, false),
                                SideConditions.none(),
                                false,
                                1),
                        scaled(PHYSICAL_STAB, 3, 2)),
                Arguments.of(
                        "friend guard protects the defender",
                        context(
                                physicalAttacker,
                                bulkyDefender,
                                physicalStab,
                                Field.clear(),
                                SideConditions.none(),
                                new SideConditions(false, false, false, true, false, false, false),
                                false,
                                1),
                        scaled(PHYSICAL_STAB, 3, 4)),
                Arguments.of(
                        "protect blocks regular attacks",
                        context(
                                physicalAttacker,
                                bulkyDefender,
                                physicalContact,
                                Field.clear(),
                                SideConditions.none(),
                                new SideConditions(false, false, false, false, false, false, true),
                                false,
                                1),
                        zeroes()),
                Arguments.of(
                        "unseen fist pierces protect for quarter damage",
                        context(
                                physicalAttacker.withAbility(Ability.UNSEEN_FIST),
                                bulkyDefender,
                                physicalContact,
                                Field.clear(),
                                SideConditions.none(),
                                new SideConditions(false, false, false, false, false, false, true),
                                false,
                                1),
                        scaled(PHYSICAL_STAB, 1, 4)),
                Arguments.of(
                        "piercing drill pierces protect for quarter damage",
                        context(
                                specialAttacker.withAbility(Ability.PIERCING_DRILL),
                                grassDefender,
                                specialFire,
                                Field.clear(),
                                SideConditions.none(),
                                new SideConditions(false, false, false, false, false, false, true),
                                false,
                                1),
                        scaled(SPECIAL_STAB, 1, 4)),
                Arguments.of(
                        "life orb boosts damage",
                        context(physicalAttacker.withItem(Item.LIFE_ORB), bulkyDefender, physicalStab),
                        scaled(PHYSICAL_STAB, 13, 10)),
                Arguments.of(
                        "mystic water boosts water damage",
                        context(
                                specialAttacker.withTypes(List.of(Type.WATER)).withItem(Item.MYSTIC_WATER),
                                groundDefender,
                                move(Type.WATER, MoveCategory.SPECIAL, 90, false)),
                        scaled(SPECIAL_STAB, 6, 5)),
                Arguments.of(
                        "expert belt boosts super effective hits",
                        context(specialAttacker.withItem(Item.EXPERT_BELT), grassDefender, specialFire),
                        scaled(SPECIAL_STAB, 6, 5)),
                Arguments.of(
                        "shuca berry halves the first super effective ground hit",
                        context(physicalAttacker, electricDefender.withItem(Item.SHUCA_BERRY), physicalNeutral),
                        NEUTRAL_PHYSICAL),
                Arguments.of(
                        "magic room suppresses life orb",
                        context(
                                physicalAttacker.withItem(Item.LIFE_ORB),
                                bulkyDefender,
                                physicalStab,
                                field(Weather.CLEAR, Terrain.NONE, Room.MAGIC)),
                        PHYSICAL_STAB),
                Arguments.of(
                        "magic room suppresses expert belt",
                        context(
                                specialAttacker.withItem(Item.EXPERT_BELT),
                                grassDefender,
                                specialFire,
                                field(Weather.CLEAR, Terrain.NONE, Room.MAGIC)),
                        SPECIAL_STAB),
                Arguments.of(
                        "tinted lens doubles resisted damage",
                        context(specialAttacker.withAbility(Ability.TINTED_LENS), waterDragonDefender, specialFire),
                        scaled(DOUBLE_RESISTED, 2, 1)),
                Arguments.of(
                        "filter softens super effective damage",
                        context(specialAttacker, grassDefender.withAbility(Ability.FILTER), specialFire),
                        scaled(SPECIAL_STAB, 3, 4)),
                Arguments.of(
                        "solid rock softens super effective damage",
                        context(specialAttacker, grassDefender.withAbility(Ability.SOLID_ROCK), specialFire),
                        scaled(SPECIAL_STAB, 3, 4)),
                Arguments.of(
                        "neuroforce boosts super effective damage",
                        context(specialAttacker.withAbility(Ability.NEUROFORCE), grassDefender, specialFire),
                        scaled(SPECIAL_STAB, 5, 4)),
                Arguments.of(
                        "multiscale halves damage at full health",
                        context(specialAttacker, grassDefender.withAbility(Ability.MULTISCALE), specialFire),
                        scaled(SPECIAL_STAB, 1, 2)),
                Arguments.of(
                        "multiscale does not apply below full health",
                        context(
                                specialAttacker,
                                grassDefender.withAbility(Ability.MULTISCALE).withCurrentHp(159),
                                specialFire),
                        SPECIAL_STAB),
                Arguments.of(
                        "levitate nullifies ground damage",
                        context(physicalAttacker, bulkyDefender.withAbility(Ability.LEVITATE), physicalNeutral),
                        zeroes()),
                Arguments.of(
                        "mold breaker bypasses levitate",
                        context(
                                physicalAttacker.withAbility(Ability.MOLD_BREAKER),
                                bulkyDefender.withAbility(Ability.LEVITATE),
                                physicalNeutral),
                        NEUTRAL_PHYSICAL),
                Arguments.of(
                        "water absorb nullifies water damage",
                        context(
                                specialAttacker.withTypes(List.of(Type.WATER)),
                                groundDefender.withAbility(Ability.WATER_ABSORB),
                                move(Type.WATER, MoveCategory.SPECIAL, 90, false)),
                        zeroes()),
                Arguments.of(
                        "thick fat halves fire damage",
                        context(specialAttacker, grassDefender.withAbility(Ability.THICK_FAT), specialFire),
                        scaled(SPECIAL_STAB, 1, 2)),
                Arguments.of(
                        "heatproof halves fire damage",
                        context(specialAttacker, grassDefender.withAbility(Ability.HEATPROOF), specialFire),
                        scaled(SPECIAL_STAB, 1, 2)),
                Arguments.of(
                        "dry skin amplifies fire damage",
                        context(specialAttacker, grassDefender.withAbility(Ability.DRY_SKIN), specialFire),
                        scaled(SPECIAL_STAB, 5, 4)),
                Arguments.of(
                        "fluffy halves contact damage",
                        context(physicalAttacker, bulkyDefender.withAbility(Ability.FLUFFY), physicalContact),
                        scaled(PHYSICAL_STAB, 1, 2)),
                Arguments.of(
                        "fluffy doubles fire damage",
                        context(specialAttacker, grassDefender.withAbility(Ability.FLUFFY), specialFire),
                        scaled(SPECIAL_STAB, 2, 1)),
                Arguments.of(
                        "sniper strengthens critical hits",
                        context(
                                physicalAttacker.withAbility(Ability.SNIPER),
                                bulkyDefender,
                                physicalStab,
                                Field.clear(),
                                SideConditions.none(),
                                SideConditions.none(),
                                true,
                                1),
                        scaled(CRITICAL_PHYSICAL_STAB, 3, 2)),
                Arguments.of(
                        "electric terrain boosts grounded electric moves",
                        context(
                                specialAttacker.withTypes(List.of(Type.ELECTRIC)),
                                bulkyDefender,
                                electricSpecial,
                                field(Weather.CLEAR, Terrain.ELECTRIC, Room.NONE)),
                        scaled(SPECIAL_STAB, 13, 10)),
                Arguments.of(
                        "grassy terrain boosts grounded grass moves",
                        context(
                                specialAttacker.withTypes(List.of(Type.GRASS)),
                                groundDefender,
                                grassySpecial,
                                field(Weather.CLEAR, Terrain.GRASSY, Room.NONE)),
                        scaled(SPECIAL_STAB, 13, 10)),
                Arguments.of(
                        "psychic terrain boosts grounded psychic moves",
                        context(
                                specialAttacker.withTypes(List.of(Type.PSYCHIC)),
                                fightingDefender,
                                psychicSpecial,
                                field(Weather.CLEAR, Terrain.PSYCHIC, Room.NONE)),
                        scaled(SPECIAL_STAB, 13, 10)),
                Arguments.of(
                        "electric terrain ignores ungrounded attackers",
                        context(
                                specialAttacker
                                        .withTypes(List.of(Type.ELECTRIC))
                                        .withGrounded(false),
                                bulkyDefender,
                                electricSpecial,
                                field(Weather.CLEAR, Terrain.ELECTRIC, Room.NONE)),
                        SPECIAL_STAB),
                Arguments.of(
                        "wonder room swaps the defensive stat used by physical attacks",
                        context(
                                new Combatant(50, new Stats(100, 100, 100, 100, 100, 100), List.of(Type.NORMAL)),
                                wonderRoomDefender,
                                move(Type.GROUND, MoveCategory.PHYSICAL, 50, false),
                                field(Weather.CLEAR, Terrain.NONE, Room.WONDER)),
                        new int[] {20, 20, 20, 21, 21, 21, 21, 22, 22, 22, 22, 23, 23, 23, 23, 24}),
                Arguments.of(
                        "critical hits ignore reflect",
                        context(
                                physicalAttacker,
                                bulkyDefender,
                                physicalStab,
                                Field.clear(),
                                SideConditions.none(),
                                new SideConditions(true, false, false, false, false, false, false),
                                true,
                                1),
                        CRITICAL_PHYSICAL_STAB));
    }

    private static Combatant combatant(List<Type> types, Stats finalStats) {
        return new Combatant(50, finalStats, types);
    }

    private static DamageContext context(Combatant attacker, Combatant defender, Move move) {
        return context(attacker, defender, move, Field.clear(), SideConditions.none(), SideConditions.none(), false, 1);
    }

    private static DamageContext context(Combatant attacker, Combatant defender, Move move, Field field) {
        return context(attacker, defender, move, field, SideConditions.none(), SideConditions.none(), false, 1);
    }

    private static DamageContext context(
            Combatant attacker,
            Combatant defender,
            Move move,
            Field field,
            SideConditions attackerSide,
            SideConditions defenderSide,
            boolean criticalHit,
            int targets) {
        return new DamageContext(attacker, defender, move, field, attackerSide, defenderSide, criticalHit, targets);
    }

    private static Field field(Weather weather, Terrain terrain, Room room) {
        return new Field(weather, terrain, room);
    }

    private static Move move(Type type, MoveCategory category, int basePower, boolean spread) {
        return new Move(type, category, basePower, spread);
    }

    private static Move move(Type type, MoveCategory category, int basePower, boolean spread, boolean contact) {
        return new Move(type, category, basePower, spread, contact, false, false);
    }

    private static int[] scaled(int[] rolls, int numerator, int denominator) {
        return Arrays.stream(rolls).map(roll -> roll * numerator / denominator).toArray();
    }

    private static int[] zeroes() {
        return new int[16];
    }
}
