package com.vgcenter.damagecalc.infrastructure.replay;

final class ShowdownTerrainMapper {

    private ShowdownTerrainMapper() {}

    /** Maps a Showdown terrain token (after move: prefix is stripped) to the Terrain enum name. */
    static String toTerrainToken(String showdownToken) {
        if (showdownToken == null || showdownToken.isBlank()) {
            return "NONE";
        }
        return switch (showdownToken.trim()) {
            case "Electric Terrain" -> "ELECTRIC";
            case "Grassy Terrain" -> "GRASSY";
            case "Misty Terrain" -> "MISTY";
            case "Psychic Terrain" -> "PSYCHIC";
            case "none", "None" -> "NONE";
            default -> "NONE";
        };
    }
}
