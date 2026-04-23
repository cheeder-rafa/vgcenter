package com.vgcenter.damagecalc.domain.model;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;

class ItemTest {

    @Test
    void fromIdMapsKnownKebabCaseIdToEnum() {
        assertThat(Item.fromId("mystic-water")).isEqualTo(Item.MYSTIC_WATER);
        assertThat(Item.fromId("shuca-berry")).isEqualTo(Item.SHUCA_BERRY);
        assertThat(Item.fromId("charcoal")).isEqualTo(Item.CHARCOAL);
    }

    @Test
    void fromIdIsCaseInsensitive() {
        assertThat(Item.fromId("MyStIc-WaTeR")).isEqualTo(Item.MYSTIC_WATER);
        assertThat(Item.fromId("Shuca-Berry")).isEqualTo(Item.SHUCA_BERRY);
    }

    @Test
    void fromIdReturnsNoneForUnknownItem() {
        assertThat(Item.fromId("choice-band")).isEqualTo(Item.NONE);
    }

    @Test
    void fromIdReturnsNoneForNullOrBlank() {
        assertThat(Item.fromId(null)).isEqualTo(Item.NONE);
        assertThat(Item.fromId("")).isEqualTo(Item.NONE);
        assertThat(Item.fromId("   ")).isEqualTo(Item.NONE);
    }
}
