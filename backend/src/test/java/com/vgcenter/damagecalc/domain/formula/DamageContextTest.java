package com.vgcenter.damagecalc.domain.formula;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.vgcenter.damagecalc.domain.model.Ability;
import com.vgcenter.damagecalc.domain.model.Combatant;
import com.vgcenter.damagecalc.domain.model.Move;
import com.vgcenter.damagecalc.domain.model.MoveCategory;
import com.vgcenter.damagecalc.domain.model.Stats;
import com.vgcenter.damagecalc.domain.model.Type;
import java.util.List;
import java.util.stream.Stream;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.MethodSource;

class DamageContextTest {

    @Test
    void secondaryConstructorBuildsClearFieldAndEmptySideConditions() {
        DamageContext context = new DamageContext(
                attacker(Ability.NONE, List.of(Type.NORMAL)),
                defender(Ability.NONE, List.of(Type.NORMAL)),
                new Move(Type.NORMAL, MoveCategory.PHYSICAL, 80, false),
                Weather.RAIN,
                true,
                2);

        assertThat(context.weather()).isEqualTo(Weather.RAIN);
        assertThat(context.terrain()).isEqualTo(Terrain.NONE);
        assertThat(context.room()).isEqualTo(Room.NONE);
        assertThat(context.attackerSide()).isEqualTo(SideConditions.none());
        assertThat(context.defenderSide()).isEqualTo(SideConditions.none());
        assertThat(context.criticalHit()).isTrue();
        assertThat(context.targets()).isEqualTo(2);
    }

    @Test
    void rejectsNonPositiveTargets() {
        assertThatThrownBy(() -> new DamageContext(
                        attacker(Ability.NONE, List.of(Type.NORMAL)),
                        defender(Ability.NONE, List.of(Type.NORMAL)),
                        new Move(Type.NORMAL, MoveCategory.PHYSICAL, 80, false),
                        Field.clear(),
                        SideConditions.none(),
                        SideConditions.none(),
                        false,
                        0))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Targets");
    }

    @ParameterizedTest(name = "{0}")
    @MethodSource("immunityAbilities")
    void abilityImmunitiesZeroTypeEffectivenessScale(String name, Ability ability, Type moveType) {
        DamageContext context = new DamageContext(
                attacker(Ability.NONE, List.of(moveType)),
                defender(ability, List.of(Type.NORMAL)),
                new Move(moveType, MoveCategory.SPECIAL, 80, false),
                Field.clear(),
                SideConditions.none(),
                SideConditions.none(),
                false,
                1);

        assertThat(context.typeEffectivenessScale()).isZero();
        assertThat(context.resisted()).isFalse();
    }

    @Test
    void resistedTracksPartialEffectivenessButNotImmunity() {
        DamageContext resistedContext = new DamageContext(
                attacker(Ability.NONE, List.of(Type.FIRE)),
                defender(Ability.NONE, List.of(Type.WATER)),
                new Move(Type.FIRE, MoveCategory.SPECIAL, 80, false),
                Field.clear(),
                SideConditions.none(),
                SideConditions.none(),
                false,
                1);
        DamageContext immuneContext = new DamageContext(
                attacker(Ability.NONE, List.of(Type.NORMAL)),
                defender(Ability.LEVITATE, List.of(Type.NORMAL)),
                new Move(Type.GROUND, MoveCategory.PHYSICAL, 80, false),
                Field.clear(),
                SideConditions.none(),
                SideConditions.none(),
                false,
                1);

        assertThat(resistedContext.resisted()).isTrue();
        assertThat(immuneContext.resisted()).isFalse();
    }

    private static Stream<Arguments> immunityAbilities() {
        return Stream.of(
                Arguments.of("Levitate", Ability.LEVITATE, Type.GROUND),
                Arguments.of("Flash Fire", Ability.FLASH_FIRE, Type.FIRE),
                Arguments.of("Water Absorb", Ability.WATER_ABSORB, Type.WATER),
                Arguments.of("Volt Absorb", Ability.VOLT_ABSORB, Type.ELECTRIC),
                Arguments.of("Lightning Rod", Ability.LIGHTNING_ROD, Type.ELECTRIC),
                Arguments.of("Sap Sipper", Ability.SAP_SIPPER, Type.GRASS),
                Arguments.of("Earth Eater", Ability.EARTH_EATER, Type.GROUND));
    }

    private static Combatant attacker(Ability ability, List<Type> types) {
        return new Combatant(
                50,
                new Stats(120, 120, 100, 120, 100, 100),
                types,
                ability,
                com.vgcenter.damagecalc.domain.model.Item.NONE,
                com.vgcenter.damagecalc.domain.model.StatusCondition.NONE,
                true,
                120);
    }

    private static Combatant defender(Ability ability, List<Type> types) {
        return new Combatant(
                50,
                new Stats(160, 100, 100, 100, 100, 100),
                types,
                ability,
                com.vgcenter.damagecalc.domain.model.Item.NONE,
                com.vgcenter.damagecalc.domain.model.StatusCondition.NONE,
                true,
                160);
    }
}
