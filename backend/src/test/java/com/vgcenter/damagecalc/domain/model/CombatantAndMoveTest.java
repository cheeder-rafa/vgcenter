package com.vgcenter.damagecalc.domain.model;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.util.List;
import org.junit.jupiter.api.Test;

class CombatantAndMoveTest {

    @Test
    void moveRejectsNonPositiveBasePower() {
        assertThatThrownBy(() -> new Move(Type.NORMAL, MoveCategory.PHYSICAL, 0, false))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Base power");
    }

    @Test
    void combatantRejectsInvalidLevelAndTypeCount() {
        Stats stats = new Stats(100, 100, 100, 100, 100, 100);

        assertThatThrownBy(() -> new Combatant(0, stats, List.of(Type.NORMAL)))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Level");

        assertThatThrownBy(() -> new Combatant(50, stats, List.of()))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("one or two types");

        assertThatThrownBy(() -> new Combatant(50, stats, List.of(Type.NORMAL, Type.FIRE, Type.WATER)))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("one or two types");
    }

    @Test
    void combatantRejectsCurrentHpOutsideTheStatHpRange() {
        Stats stats = new Stats(100, 100, 100, 100, 100, 100);

        assertThatThrownBy(() -> new Combatant(
                        50, stats, List.of(Type.NORMAL), Ability.NONE, Item.NONE, StatusCondition.NONE, true, 0))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Current HP");

        assertThatThrownBy(() -> new Combatant(
                        50, stats, List.of(Type.NORMAL), Ability.NONE, Item.NONE, StatusCondition.NONE, true, 101))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Current HP");
    }

    @Test
    void combatantExposesHpThresholdHelpersFromCurrentHp() {
        Combatant fullHp = new Combatant(
                50,
                new Stats(120, 100, 100, 100, 100, 100),
                List.of(Type.NORMAL),
                Ability.NONE,
                Item.NONE,
                StatusCondition.NONE,
                true,
                120);
        Combatant halfHp = fullHp.withCurrentHp(60);
        Combatant thirdHp = fullHp.withCurrentHp(40);

        assertThat(fullHp.fullHp()).isTrue();
        assertThat(fullHp.atOrBelowHalfHp()).isFalse();
        assertThat(fullHp.atOrBelowThirdHp()).isFalse();

        assertThat(halfHp.fullHp()).isFalse();
        assertThat(halfHp.atOrBelowHalfHp()).isTrue();
        assertThat(halfHp.atOrBelowThirdHp()).isFalse();

        assertThat(thirdHp.atOrBelowThirdHp()).isTrue();
    }
}
