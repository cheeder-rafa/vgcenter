package com.vgcenter.damagecalc.domain.mega;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.vgcenter.damagecalc.domain.model.Ability;
import com.vgcenter.damagecalc.domain.model.Stats;
import com.vgcenter.damagecalc.domain.model.Type;
import java.util.List;
import org.junit.jupiter.api.Test;

class MegaFormTest {

    private static final Stats STATS = new Stats(78, 130, 111, 130, 85, 100);

    @Test
    void exposesAllProvidedAttributes() {
        MegaForm megaCharizardX = new MegaForm(
                "charizard-mega-x", "Charizard-Mega-X", List.of(Type.FIRE, Type.DRAGON), STATS, Ability.NONE);

        assertThat(megaCharizardX.id()).isEqualTo("charizard-mega-x");
        assertThat(megaCharizardX.name()).isEqualTo("Charizard-Mega-X");
        assertThat(megaCharizardX.types()).containsExactly(Type.FIRE, Type.DRAGON);
        assertThat(megaCharizardX.baseStats()).isEqualTo(STATS);
        assertThat(megaCharizardX.ability()).isEqualTo(Ability.NONE);
    }

    @Test
    void typesListIsImmutable() {
        List<Type> mutableTypes = new java.util.ArrayList<>(List.of(Type.FIRE, Type.DRAGON));
        MegaForm megaForm = new MegaForm("mega", "Mega", mutableTypes, STATS, Ability.NONE);

        mutableTypes.clear();

        assertThat(megaForm.types()).containsExactly(Type.FIRE, Type.DRAGON);
    }

    @Test
    void rejectsBlankId() {
        assertThatThrownBy(() -> new MegaForm(" ", "Mega", List.of(Type.FIRE), STATS, Ability.NONE))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("id");
    }

    @Test
    void rejectsBlankName() {
        assertThatThrownBy(() -> new MegaForm("mega", " ", List.of(Type.FIRE), STATS, Ability.NONE))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("name");
    }

    @Test
    void rejectsNullBaseStats() {
        assertThatThrownBy(() -> new MegaForm("mega", "Mega", List.of(Type.FIRE), null, Ability.NONE))
                .isInstanceOf(NullPointerException.class);
    }

    @Test
    void rejectsNullAbility() {
        assertThatThrownBy(() -> new MegaForm("mega", "Mega", List.of(Type.FIRE), STATS, null))
                .isInstanceOf(NullPointerException.class);
    }

    @Test
    void rejectsEmptyOrOverfullTypes() {
        assertThatThrownBy(() -> new MegaForm("mega", "Mega", List.of(), STATS, Ability.NONE))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("one or two types");
        assertThatThrownBy(() ->
                        new MegaForm("mega", "Mega", List.of(Type.FIRE, Type.DRAGON, Type.FLYING), STATS, Ability.NONE))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("one or two types");
    }
}
