package com.vgcenter.damagecalc.infrastructure.replay;

final class ShowdownWeatherMapper {

    private ShowdownWeatherMapper() {}

    /** Maps a Showdown weather token to the Weather enum name used by the damage formula. */
    static String toWeatherToken(String showdownToken) {
        if (showdownToken == null || showdownToken.isBlank()) {
            return "NONE";
        }
        return switch (showdownToken.trim()) {
            case "Sandstorm" -> "SAND";
            case "RainDance", "PrimordialSea", "HeavyRain" -> "RAIN";
            case "SunnyDay", "DesolateLand", "HarshSunshine" -> "SUN";
            case "Snowscape", "Snow", "Hail" -> "SNOW";
            case "none", "None" -> "NONE";
            default -> "NONE";
        };
    }
}
