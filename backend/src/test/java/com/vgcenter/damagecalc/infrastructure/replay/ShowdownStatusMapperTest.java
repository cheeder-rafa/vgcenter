package com.vgcenter.damagecalc.infrastructure.replay;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;
import org.junit.jupiter.params.provider.NullAndEmptySource;
import org.junit.jupiter.params.provider.ValueSource;

class ShowdownStatusMapperTest {

    @ParameterizedTest
    @CsvSource({"brn, BURN", "BRN, BURN", "par, PARALYSIS", "PAR, PARALYSIS"})
    void mapsDamageRelevantStatusCodes(String token, String expected) {
        assertThat(ShowdownStatusMapper.toStatusConditionToken(token)).isEqualTo(expected);
    }

    @ParameterizedTest
    @ValueSource(strings = {"slp", "frz", "psn", "tox", "fnt", "SLP", "FRZ", "PSN", "TOX", "unknown"})
    void mapsNonDamageStatusesToNone(String token) {
        assertThat(ShowdownStatusMapper.toStatusConditionToken(token)).isEqualTo("NONE");
    }

    @ParameterizedTest
    @NullAndEmptySource
    void returnsNullForNullOrBlank(String token) {
        assertThat(ShowdownStatusMapper.toStatusConditionToken(token)).isNull();
    }
}
