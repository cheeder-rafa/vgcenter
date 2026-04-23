package com.vgcenter.damagecalc.domain.model;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;

class AbilityTest {

    @Test
    void fromIdMapsKnownKebabCaseIdToEnum() {
        assertThat(Ability.fromId("adaptability")).isEqualTo(Ability.ADAPTABILITY);
        assertThat(Ability.fromId("fairy-aura")).isEqualTo(Ability.FAIRY_AURA);
        assertThat(Ability.fromId("levitate")).isEqualTo(Ability.LEVITATE);
        assertThat(Ability.fromId("mold-breaker")).isEqualTo(Ability.MOLD_BREAKER);
        assertThat(Ability.fromId("solid-rock")).isEqualTo(Ability.SOLID_ROCK);
        assertThat(Ability.fromId("tinted-lens")).isEqualTo(Ability.TINTED_LENS);
        assertThat(Ability.fromId("water-bubble")).isEqualTo(Ability.WATER_BUBBLE);
    }

    @Test
    void fromIdIsCaseInsensitive() {
        assertThat(Ability.fromId("ADAPTABILITY")).isEqualTo(Ability.ADAPTABILITY);
        assertThat(Ability.fromId("LeViTaTe")).isEqualTo(Ability.LEVITATE);
        assertThat(Ability.fromId("Solid-Rock")).isEqualTo(Ability.SOLID_ROCK);
    }

    @Test
    void fromIdReturnsNoneForUnknownAbility() {
        assertThat(Ability.fromId("parental-bond")).isEqualTo(Ability.NONE);
    }

    @Test
    void fromIdReturnsNoneForNullOrBlank() {
        assertThat(Ability.fromId(null)).isEqualTo(Ability.NONE);
        assertThat(Ability.fromId("")).isEqualTo(Ability.NONE);
        assertThat(Ability.fromId("   ")).isEqualTo(Ability.NONE);
    }
}
