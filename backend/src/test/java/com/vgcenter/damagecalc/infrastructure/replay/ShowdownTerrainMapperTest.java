package com.vgcenter.damagecalc.infrastructure.replay;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;
import org.junit.jupiter.params.provider.NullAndEmptySource;

class ShowdownTerrainMapperTest {

    @ParameterizedTest
    @CsvSource({
        "Electric Terrain, ELECTRIC",
        "Grassy Terrain, GRASSY",
        "Misty Terrain, MISTY",
        "Psychic Terrain, PSYCHIC",
        "none, NONE",
        "None, NONE",
        "unknown, NONE"
    })
    void mapsShowdownTerrainTokensToEnumNames(String token, String expected) {
        assertThat(ShowdownTerrainMapper.toTerrainToken(token)).isEqualTo(expected);
    }

    @ParameterizedTest
    @NullAndEmptySource
    void returnsNoneForNullOrBlank(String token) {
        assertThat(ShowdownTerrainMapper.toTerrainToken(token)).isEqualTo("NONE");
    }
}
