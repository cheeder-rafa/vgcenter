package com.vgcenter.damagecalc.infrastructure.replay;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;
import org.junit.jupiter.params.provider.NullAndEmptySource;

class ShowdownWeatherMapperTest {

    @ParameterizedTest
    @CsvSource({
        "Sandstorm, SAND",
        "RainDance, RAIN",
        "PrimordialSea, RAIN",
        "HeavyRain, RAIN",
        "SunnyDay, SUN",
        "DesolateLand, SUN",
        "HarshSunshine, SUN",
        "Snowscape, SNOW",
        "Snow, SNOW",
        "Hail, SNOW",
        "none, NONE",
        "None, NONE",
        "unknown, NONE"
    })
    void mapsShowdownWeatherTokensToEnumNames(String token, String expected) {
        assertThat(ShowdownWeatherMapper.toWeatherToken(token)).isEqualTo(expected);
    }

    @ParameterizedTest
    @NullAndEmptySource
    void returnsNoneForNullOrBlank(String token) {
        assertThat(ShowdownWeatherMapper.toWeatherToken(token)).isEqualTo("NONE");
    }
}
