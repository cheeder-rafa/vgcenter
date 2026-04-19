package com.vgcenter.damagecalc.domain.model;

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
}
