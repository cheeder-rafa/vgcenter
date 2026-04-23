package com.vgcenter.damagecalc.domain.formula;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.vgcenter.damagecalc.domain.model.Ability;
import com.vgcenter.damagecalc.domain.model.Combatant;
import com.vgcenter.damagecalc.domain.model.Item;
import com.vgcenter.damagecalc.domain.model.Move;
import com.vgcenter.damagecalc.domain.model.MoveCategory;
import com.vgcenter.damagecalc.domain.model.Stats;
import com.vgcenter.damagecalc.domain.model.StatusCondition;
import com.vgcenter.damagecalc.domain.model.Type;
import java.util.List;
import java.util.stream.Stream;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.MethodSource;

class DamageFormulaDirectModifierTest {

    private static final DamageFormula DAMAGE_FORMULA = new DamageFormula();

    @ParameterizedTest(name = "{0}")
    @MethodSource("oneThirdHpBoostAbilities")
    void oneThirdHpBoostAbilitiesMatchEquivalentBasePower(
            String name, Ability ability, Type moveType, MoveCategory category) {
        Combatant boostedAttacker = new Combatant(
                50,
                new Stats(120, 120, 100, 120, 100, 100),
                List.of(moveType),
                ability,
                Item.NONE,
                StatusCondition.NONE,
                true,
                40);
        Combatant baselineAttacker = boostedAttacker.withAbility(Ability.NONE);
        Combatant defender = new Combatant(50, new Stats(160, 100, 100, 100, 100, 100), List.of(Type.NORMAL));
        Move boostedMove = new Move(moveType, category, 90, false);
        Move equivalentMove = new Move(moveType, category, 135, false);

        assertThat(DAMAGE_FORMULA.rolls(context(boostedAttacker, defender, boostedMove)))
                .containsExactly(DAMAGE_FORMULA.rolls(context(baselineAttacker, defender, equivalentMove)));
    }

    @ParameterizedTest(name = "{0}")
    @MethodSource("doubledAttackAbilities")
    void doubledAttackAbilitiesMatchEquivalentPhysicalAttackStat(String name, Ability ability) {
        Combatant boostedAttacker = new Combatant(
                50,
                new Stats(120, 110, 100, 100, 100, 100),
                List.of(Type.NORMAL),
                ability,
                Item.NONE,
                StatusCondition.NONE,
                true,
                120);
        Combatant equivalentAttacker = new Combatant(
                50,
                new Stats(120, 220, 100, 100, 100, 100),
                List.of(Type.NORMAL),
                Ability.NONE,
                Item.NONE,
                StatusCondition.NONE,
                true,
                120);
        Combatant defender = new Combatant(50, new Stats(160, 100, 100, 100, 100, 100), List.of(Type.NORMAL));
        Move move = new Move(Type.NORMAL, MoveCategory.PHYSICAL, 80, false);

        assertThat(DAMAGE_FORMULA.rolls(context(boostedAttacker, defender, move)))
                .containsExactly(DAMAGE_FORMULA.rolls(context(equivalentAttacker, defender, move)));
    }

    @Test
    void technicianMatchesEquivalentBoostedBasePower() {
        Combatant attacker = new Combatant(
                50,
                new Stats(120, 110, 100, 100, 100, 100),
                List.of(Type.NORMAL),
                Ability.TECHNICIAN,
                Item.NONE,
                StatusCondition.NONE,
                true,
                120);
        Combatant defender = new Combatant(50, new Stats(160, 100, 100, 100, 100, 100), List.of(Type.NORMAL));

        assertThat(DAMAGE_FORMULA.rolls(
                        context(attacker, defender, new Move(Type.NORMAL, MoveCategory.PHYSICAL, 60, false))))
                .containsExactly(DAMAGE_FORMULA.rolls(context(
                        attacker.withAbility(Ability.NONE),
                        defender,
                        new Move(Type.NORMAL, MoveCategory.PHYSICAL, 90, false))));
    }

    @Test
    void solarPowerInSunMatchesEquivalentSpecialAttackStat() {
        Combatant attacker = new Combatant(
                50,
                new Stats(120, 100, 100, 120, 100, 100),
                List.of(Type.FIRE),
                Ability.SOLAR_POWER,
                Item.NONE,
                StatusCondition.NONE,
                true,
                120);
        Combatant equivalentAttacker = new Combatant(
                50,
                new Stats(120, 100, 100, 180, 100, 100),
                List.of(Type.FIRE),
                Ability.NONE,
                Item.NONE,
                StatusCondition.NONE,
                true,
                120);
        Combatant defender = new Combatant(50, new Stats(160, 100, 100, 100, 100, 100), List.of(Type.NORMAL));
        Move move = new Move(Type.FIRE, MoveCategory.SPECIAL, 90, false);
        Field sun = new Field(Weather.SUN, Terrain.NONE, Room.NONE);

        assertThat(DAMAGE_FORMULA.rolls(context(attacker, defender, move, sun)))
                .containsExactly(DAMAGE_FORMULA.rolls(context(equivalentAttacker, defender, move, sun)));
    }

    @Test
    void waterBubbleOffenseMatchesEquivalentBasePower() {
        Combatant attacker = new Combatant(
                50,
                new Stats(120, 100, 100, 120, 100, 100),
                List.of(Type.WATER),
                Ability.WATER_BUBBLE,
                Item.NONE,
                StatusCondition.NONE,
                true,
                120);
        Combatant defender = new Combatant(50, new Stats(160, 100, 100, 100, 100, 100), List.of(Type.NORMAL));

        assertThat(DAMAGE_FORMULA.rolls(
                        context(attacker, defender, new Move(Type.WATER, MoveCategory.SPECIAL, 80, false))))
                .containsExactly(DAMAGE_FORMULA.rolls(context(
                        attacker.withAbility(Ability.NONE),
                        defender,
                        new Move(Type.WATER, MoveCategory.SPECIAL, 160, false))));
    }

    @Test
    void furCoatMatchesEquivalentDoubledDefenseStat() {
        Combatant attacker = new Combatant(50, new Stats(120, 110, 100, 100, 100, 100), List.of(Type.NORMAL));
        Combatant defender = new Combatant(
                50,
                new Stats(160, 100, 100, 100, 100, 100),
                List.of(Type.NORMAL),
                Ability.FUR_COAT,
                Item.NONE,
                StatusCondition.NONE,
                true,
                160);
        Combatant equivalentDefender = new Combatant(
                50,
                new Stats(160, 100, 200, 100, 100, 100),
                List.of(Type.NORMAL),
                Ability.NONE,
                Item.NONE,
                StatusCondition.NONE,
                true,
                160);
        Move move = new Move(Type.NORMAL, MoveCategory.PHYSICAL, 80, false);

        assertThat(DAMAGE_FORMULA.rolls(context(attacker, defender, move)))
                .containsExactly(DAMAGE_FORMULA.rolls(context(attacker, equivalentDefender, move)));
    }

    @ParameterizedTest(name = "{0}")
    @MethodSource("typeBoostingItems")
    void typeBoostingItemsApplyTheExpectedDamageModifier(
            String name, Item item, Type moveType, MoveCategory category, List<Type> defenderTypes) {
        Combatant attacker = new Combatant(
                50,
                new Stats(120, 120, 100, 120, 100, 100),
                List.of(moveType),
                Ability.NONE,
                item,
                StatusCondition.NONE,
                true,
                120);
        Combatant baselineAttacker = attacker.withItem(Item.NONE);
        Combatant defender = new Combatant(50, new Stats(160, 100, 100, 100, 100, 100), defenderTypes);
        Move move = new Move(moveType, category, 90, false);

        assertThat(DAMAGE_FORMULA.rolls(context(attacker, defender, move)))
                .containsExactly(scaled(DAMAGE_FORMULA.rolls(context(baselineAttacker, defender, move)), 6, 5));
    }

    @ParameterizedTest(name = "{0}")
    @MethodSource("resistBerries")
    void resistBerriesApplyTheExpectedDamageReduction(
            String name, Item item, Type moveType, MoveCategory category, List<Type> defenderTypes) {
        Combatant attacker = new Combatant(
                50,
                new Stats(120, 120, 100, 120, 100, 100),
                List.of(moveType),
                Ability.NONE,
                Item.NONE,
                StatusCondition.NONE,
                true,
                120);
        Combatant defender = new Combatant(
                50,
                new Stats(160, 100, 100, 100, 100, 100),
                defenderTypes,
                Ability.NONE,
                item,
                StatusCondition.NONE,
                true,
                160);
        Combatant baselineDefender = defender.withItem(Item.NONE);
        Move move = new Move(moveType, category, 90, false);

        assertThat(DAMAGE_FORMULA.rolls(context(attacker, defender, move)))
                .containsExactly(scaled(DAMAGE_FORMULA.rolls(context(attacker, baselineDefender, move)), 1, 2));
    }

    @ParameterizedTest(name = "{0}")
    @MethodSource("immunityAbilities")
    void immunityAbilitiesZeroOutMatchingDamage(String name, Ability ability, Type moveType, MoveCategory category) {
        Combatant attacker = new Combatant(
                50,
                new Stats(120, 120, 100, 120, 100, 100),
                List.of(moveType),
                Ability.NONE,
                Item.NONE,
                StatusCondition.NONE,
                true,
                120);
        Combatant defender = new Combatant(
                50,
                new Stats(160, 100, 100, 100, 100, 100),
                List.of(Type.NORMAL),
                ability,
                Item.NONE,
                StatusCondition.NONE,
                true,
                160);
        Move move = new Move(moveType, category, 90, false);

        assertThat(DAMAGE_FORMULA.rolls(context(attacker, defender, move))).containsOnly(0);
    }

    @Test
    void moldBreakerBypassesLevitateGroundImmunity() {
        Combatant attacker = new Combatant(
                50,
                new Stats(120, 120, 100, 120, 100, 100),
                List.of(Type.GROUND),
                Ability.MOLD_BREAKER,
                Item.NONE,
                StatusCondition.NONE,
                true,
                120);
        Combatant defender = new Combatant(
                50,
                new Stats(160, 100, 100, 100, 100, 100),
                List.of(Type.NORMAL),
                Ability.LEVITATE,
                Item.NONE,
                StatusCondition.NONE,
                true,
                160);
        Move move = new Move(Type.GROUND, MoveCategory.PHYSICAL, 90, false);

        assertThat(DAMAGE_FORMULA.rolls(context(attacker, defender, move)))
                .containsExactly(DAMAGE_FORMULA.rolls(
                        context(attacker.withAbility(Ability.NONE), defender.withAbility(Ability.NONE), move)));
    }

    @Test
    void moldBreakerBypassesFurCoatDefenseBoost() {
        Combatant attacker = new Combatant(
                50,
                new Stats(120, 120, 100, 120, 100, 100),
                List.of(Type.NORMAL),
                Ability.MOLD_BREAKER,
                Item.NONE,
                StatusCondition.NONE,
                true,
                120);
        Combatant defender = new Combatant(
                50,
                new Stats(160, 100, 100, 100, 100, 100),
                List.of(Type.NORMAL),
                Ability.FUR_COAT,
                Item.NONE,
                StatusCondition.NONE,
                true,
                160);
        Move move = new Move(Type.NORMAL, MoveCategory.PHYSICAL, 80, false);

        assertThat(DAMAGE_FORMULA.rolls(context(attacker, defender, move)))
                .containsExactly(DAMAGE_FORMULA.rolls(
                        context(attacker.withAbility(Ability.NONE), defender.withAbility(Ability.NONE), move)));
    }

    @Test
    void hustleMatchesEquivalentPhysicalAttackStat() {
        Combatant attacker = new Combatant(
                50,
                new Stats(120, 100, 100, 100, 100, 100),
                List.of(Type.NORMAL),
                Ability.HUSTLE,
                Item.NONE,
                StatusCondition.NONE,
                true,
                120);
        Combatant equivalentAttacker = new Combatant(
                50,
                new Stats(120, 150, 100, 100, 100, 100),
                List.of(Type.NORMAL),
                Ability.NONE,
                Item.NONE,
                StatusCondition.NONE,
                true,
                120);
        Combatant defender = new Combatant(50, new Stats(160, 100, 100, 100, 100, 100), List.of(Type.NORMAL));
        Move move = new Move(Type.NORMAL, MoveCategory.PHYSICAL, 80, false);

        assertThat(DAMAGE_FORMULA.rolls(context(attacker, defender, move)))
                .containsExactly(DAMAGE_FORMULA.rolls(context(equivalentAttacker, defender, move)));
    }

    @Test
    void toughClawsMatchesExpectedContactDamageModifier() {
        Combatant attacker = new Combatant(
                50,
                new Stats(120, 120, 100, 100, 100, 100),
                List.of(Type.NORMAL),
                Ability.TOUGH_CLAWS,
                Item.NONE,
                StatusCondition.NONE,
                true,
                120);
        Combatant baselineAttacker = attacker.withAbility(Ability.NONE);
        Combatant defender = new Combatant(50, new Stats(160, 100, 100, 100, 100, 100), List.of(Type.NORMAL));
        Move move = new Move(Type.NORMAL, MoveCategory.PHYSICAL, 80, false, true);

        assertThat(DAMAGE_FORMULA.rolls(context(attacker, defender, move)))
                .containsExactly(scaled(DAMAGE_FORMULA.rolls(context(baselineAttacker, defender, move)), 13, 10));
    }

    @Test
    void waterBubbleDefenseHalvesFireDamage() {
        Combatant attacker = new Combatant(
                50,
                new Stats(120, 100, 100, 120, 100, 100),
                List.of(Type.FIRE),
                Ability.NONE,
                Item.NONE,
                StatusCondition.NONE,
                true,
                120);
        Combatant defender = new Combatant(
                50,
                new Stats(160, 100, 100, 100, 100, 100),
                List.of(Type.NORMAL),
                Ability.WATER_BUBBLE,
                Item.NONE,
                StatusCondition.NONE,
                true,
                160);
        Combatant baselineDefender = defender.withAbility(Ability.NONE);
        Move move = new Move(Type.FIRE, MoveCategory.SPECIAL, 90, false);

        assertThat(DAMAGE_FORMULA.rolls(context(attacker, defender, move)))
                .containsExactly(scaled(DAMAGE_FORMULA.rolls(context(attacker, baselineDefender, move)), 1, 2));
    }

    @Test
    void burnPenaltyIsIgnoredWhenMoveAllowsIt() {
        Combatant attacker = new Combatant(
                50,
                new Stats(120, 120, 100, 100, 100, 100),
                List.of(Type.NORMAL),
                Ability.NONE,
                Item.NONE,
                StatusCondition.BURN,
                true,
                120);
        Combatant defender = new Combatant(50, new Stats(160, 100, 100, 100, 100, 100), List.of(Type.NORMAL));
        Move move = new Move(Type.NORMAL, MoveCategory.PHYSICAL, 80, false, false, false, true);

        assertThat(DAMAGE_FORMULA.rolls(context(attacker, defender, move)))
                .containsExactly(
                        DAMAGE_FORMULA.rolls(context(attacker.withStatus(StatusCondition.NONE), defender, move)));
    }

    @Test
    void statusBoostedMovesDoubleBasePowerForStatusedAttacker() {
        Combatant attacker = new Combatant(
                50,
                new Stats(120, 120, 100, 100, 100, 100),
                List.of(Type.NORMAL),
                Ability.NONE,
                Item.NONE,
                StatusCondition.BURN,
                true,
                120);
        Combatant defender = new Combatant(50, new Stats(160, 100, 100, 100, 100, 100), List.of(Type.NORMAL));
        Move doubledMove = new Move(Type.NORMAL, MoveCategory.PHYSICAL, 70, false, false, true, false);
        Move equivalentMove = new Move(Type.NORMAL, MoveCategory.PHYSICAL, 140, false);

        assertThat(DAMAGE_FORMULA.rolls(context(attacker, defender, doubledMove)))
                .containsExactly(DAMAGE_FORMULA.rolls(context(attacker, defender, equivalentMove)));
    }

    @Test
    void randomFactorRejectsValuesOutsideTheDamageRange() {
        Combatant attacker = new Combatant(50, new Stats(120, 120, 100, 100, 100, 100), List.of(Type.NORMAL));
        Combatant defender = new Combatant(50, new Stats(160, 100, 100, 100, 100, 100), List.of(Type.NORMAL));
        Move move = new Move(Type.NORMAL, MoveCategory.PHYSICAL, 80, false);

        assertThatThrownBy(() -> DAMAGE_FORMULA.calculate(context(attacker, defender, move), 84))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Random percent");
        assertThatThrownBy(() -> DAMAGE_FORMULA.calculate(context(attacker, defender, move), 101))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Random percent");
    }

    private static Stream<Arguments> oneThirdHpBoostAbilities() {
        return Stream.of(
                Arguments.of("Blaze", Ability.BLAZE, Type.FIRE, MoveCategory.SPECIAL),
                Arguments.of("Torrent", Ability.TORRENT, Type.WATER, MoveCategory.SPECIAL),
                Arguments.of("Overgrow", Ability.OVERGROW, Type.GRASS, MoveCategory.SPECIAL),
                Arguments.of("Swarm", Ability.SWARM, Type.BUG, MoveCategory.PHYSICAL));
    }

    private static Stream<Arguments> doubledAttackAbilities() {
        return Stream.of(
                Arguments.of("Huge Power", Ability.HUGE_POWER), Arguments.of("Pure Power", Ability.PURE_POWER));
    }

    private static Stream<Arguments> typeBoostingItems() {
        return Stream.of(
                Arguments.of("Black Belt", Item.BLACK_BELT, Type.FIGHTING, MoveCategory.PHYSICAL, List.of(Type.NORMAL)),
                Arguments.of("Black Glasses", Item.BLACK_GLASSES, Type.DARK, MoveCategory.SPECIAL, List.of(Type.GHOST)),
                Arguments.of("Charcoal", Item.CHARCOAL, Type.FIRE, MoveCategory.SPECIAL, List.of(Type.GRASS)),
                Arguments.of("Dragon Fang", Item.DRAGON_FANG, Type.DRAGON, MoveCategory.SPECIAL, List.of(Type.DRAGON)),
                Arguments.of(
                        "Fairy Feather", Item.FAIRY_FEATHER, Type.FAIRY, MoveCategory.SPECIAL, List.of(Type.DRAGON)),
                Arguments.of("Hard Stone", Item.HARD_STONE, Type.ROCK, MoveCategory.SPECIAL, List.of(Type.FIRE)),
                Arguments.of("Magnet", Item.MAGNET, Type.ELECTRIC, MoveCategory.SPECIAL, List.of(Type.WATER)),
                Arguments.of("Metal Coat", Item.METAL_COAT, Type.STEEL, MoveCategory.SPECIAL, List.of(Type.FAIRY)),
                Arguments.of("Miracle Seed", Item.MIRACLE_SEED, Type.GRASS, MoveCategory.SPECIAL, List.of(Type.WATER)),
                Arguments.of("Mystic Water", Item.MYSTIC_WATER, Type.WATER, MoveCategory.SPECIAL, List.of(Type.FIRE)),
                Arguments.of(
                        "Never-Melt Ice", Item.NEVER_MELT_ICE, Type.ICE, MoveCategory.SPECIAL, List.of(Type.GRASS)),
                Arguments.of("Poison Barb", Item.POISON_BARB, Type.POISON, MoveCategory.SPECIAL, List.of(Type.GRASS)),
                Arguments.of("Sharp Beak", Item.SHARP_BEAK, Type.FLYING, MoveCategory.SPECIAL, List.of(Type.GRASS)),
                Arguments.of("Silk Scarf", Item.SILK_SCARF, Type.NORMAL, MoveCategory.PHYSICAL, List.of(Type.NORMAL)),
                Arguments.of("Silver Powder", Item.SILVER_POWDER, Type.BUG, MoveCategory.SPECIAL, List.of(Type.GRASS)),
                Arguments.of("Soft Sand", Item.SOFT_SAND, Type.GROUND, MoveCategory.SPECIAL, List.of(Type.FIRE)),
                Arguments.of("Spell Tag", Item.SPELL_TAG, Type.GHOST, MoveCategory.SPECIAL, List.of(Type.GHOST)),
                Arguments.of(
                        "Twisted Spoon",
                        Item.TWISTED_SPOON,
                        Type.PSYCHIC,
                        MoveCategory.SPECIAL,
                        List.of(Type.FIGHTING)));
    }

    private static Stream<Arguments> resistBerries() {
        return Stream.of(
                Arguments.of("Babiri Berry", Item.BABIRI_BERRY, Type.STEEL, MoveCategory.SPECIAL, List.of(Type.FAIRY)),
                Arguments.of("Charti Berry", Item.CHARTI_BERRY, Type.ROCK, MoveCategory.SPECIAL, List.of(Type.FIRE)),
                Arguments.of(
                        "Chilan Berry", Item.CHILAN_BERRY, Type.NORMAL, MoveCategory.PHYSICAL, List.of(Type.NORMAL)),
                Arguments.of(
                        "Chople Berry", Item.CHOPLE_BERRY, Type.FIGHTING, MoveCategory.PHYSICAL, List.of(Type.NORMAL)),
                Arguments.of("Coba Berry", Item.COBA_BERRY, Type.FLYING, MoveCategory.SPECIAL, List.of(Type.GRASS)),
                Arguments.of("Colbur Berry", Item.COLBUR_BERRY, Type.DARK, MoveCategory.SPECIAL, List.of(Type.GHOST)),
                Arguments.of("Haban Berry", Item.HABAN_BERRY, Type.DRAGON, MoveCategory.SPECIAL, List.of(Type.DRAGON)),
                Arguments.of("Kasib Berry", Item.KASIB_BERRY, Type.GHOST, MoveCategory.SPECIAL, List.of(Type.GHOST)),
                Arguments.of("Kebia Berry", Item.KEBIA_BERRY, Type.POISON, MoveCategory.SPECIAL, List.of(Type.GRASS)),
                Arguments.of("Occa Berry", Item.OCCA_BERRY, Type.FIRE, MoveCategory.SPECIAL, List.of(Type.GRASS)),
                Arguments.of("Passho Berry", Item.PASSHO_BERRY, Type.WATER, MoveCategory.SPECIAL, List.of(Type.FIRE)),
                Arguments.of(
                        "Payapa Berry", Item.PAYAPA_BERRY, Type.PSYCHIC, MoveCategory.SPECIAL, List.of(Type.FIGHTING)),
                Arguments.of("Rindo Berry", Item.RINDO_BERRY, Type.GRASS, MoveCategory.SPECIAL, List.of(Type.WATER)),
                Arguments.of("Roseli Berry", Item.ROSELI_BERRY, Type.FAIRY, MoveCategory.SPECIAL, List.of(Type.DRAGON)),
                Arguments.of("Shuca Berry", Item.SHUCA_BERRY, Type.GROUND, MoveCategory.PHYSICAL, List.of(Type.FIRE)),
                Arguments.of("Tanga Berry", Item.TANGA_BERRY, Type.BUG, MoveCategory.SPECIAL, List.of(Type.GRASS)),
                Arguments.of("Wacan Berry", Item.WACAN_BERRY, Type.ELECTRIC, MoveCategory.SPECIAL, List.of(Type.WATER)),
                Arguments.of("Yache Berry", Item.YACHE_BERRY, Type.ICE, MoveCategory.SPECIAL, List.of(Type.GRASS)));
    }

    private static Stream<Arguments> immunityAbilities() {
        return Stream.of(
                Arguments.of("Levitate", Ability.LEVITATE, Type.GROUND, MoveCategory.PHYSICAL),
                Arguments.of("Flash Fire", Ability.FLASH_FIRE, Type.FIRE, MoveCategory.SPECIAL),
                Arguments.of("Water Absorb", Ability.WATER_ABSORB, Type.WATER, MoveCategory.SPECIAL),
                Arguments.of("Volt Absorb", Ability.VOLT_ABSORB, Type.ELECTRIC, MoveCategory.SPECIAL),
                Arguments.of("Lightning Rod", Ability.LIGHTNING_ROD, Type.ELECTRIC, MoveCategory.SPECIAL),
                Arguments.of("Sap Sipper", Ability.SAP_SIPPER, Type.GRASS, MoveCategory.SPECIAL),
                Arguments.of("Earth Eater", Ability.EARTH_EATER, Type.GROUND, MoveCategory.PHYSICAL));
    }

    private static DamageContext context(Combatant attacker, Combatant defender, Move move) {
        return context(attacker, defender, move, Field.clear());
    }

    private static DamageContext context(Combatant attacker, Combatant defender, Move move, Field field) {
        return new DamageContext(
                attacker, defender, move, field, SideConditions.none(), SideConditions.none(), false, 1);
    }

    private static int[] scaled(int[] values, int numerator, int denominator) {
        return Stream.of(values)
                .flatMapToInt(java.util.Arrays::stream)
                .map(value -> value * numerator / denominator)
                .toArray();
    }
}
