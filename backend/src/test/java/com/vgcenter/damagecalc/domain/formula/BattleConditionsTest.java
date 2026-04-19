package com.vgcenter.damagecalc.domain.formula;

import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.vgcenter.damagecalc.domain.model.Combatant;
import com.vgcenter.damagecalc.domain.model.Move;
import com.vgcenter.damagecalc.domain.model.MoveCategory;
import com.vgcenter.damagecalc.domain.model.Stats;
import com.vgcenter.damagecalc.domain.model.Type;
import java.util.List;
import org.junit.jupiter.api.Test;

class BattleConditionsTest {

    @Test
    void fieldRejectsNullMembers() {
        assertThatThrownBy(() -> new Field(null, Terrain.NONE, Room.NONE))
                .isInstanceOf(NullPointerException.class)
                .hasMessageContaining("weather");

        assertThatThrownBy(() -> new Field(Weather.CLEAR, null, Room.NONE))
                .isInstanceOf(NullPointerException.class)
                .hasMessageContaining("terrain");

        assertThatThrownBy(() -> new Field(Weather.CLEAR, Terrain.NONE, null))
                .isInstanceOf(NullPointerException.class)
                .hasMessageContaining("room");
    }

    @Test
    void damageContextRejectsNullFieldAndSideState() {
        Combatant combatant = new Combatant(50, new Stats(100, 100, 100, 100, 100, 100), List.of(Type.NORMAL));
        Move move = new Move(Type.NORMAL, MoveCategory.PHYSICAL, 80, false);

        assertThatThrownBy(() -> new DamageContext(
                        combatant, combatant, move, null, SideConditions.none(), SideConditions.none(), false, 1))
                .isInstanceOf(NullPointerException.class)
                .hasMessageContaining("field");

        assertThatThrownBy(() -> new DamageContext(
                        combatant, combatant, move, Field.clear(), null, SideConditions.none(), false, 1))
                .isInstanceOf(NullPointerException.class)
                .hasMessageContaining("attackerSide");

        assertThatThrownBy(() -> new DamageContext(
                        combatant, combatant, move, Field.clear(), SideConditions.none(), null, false, 1))
                .isInstanceOf(NullPointerException.class)
                .hasMessageContaining("defenderSide");
    }
}
