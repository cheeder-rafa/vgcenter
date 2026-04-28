package com.vgcenter.damagecalc.infrastructure.replay;

final class ShowdownStatusMapper {

    private ShowdownStatusMapper() {}

    /** Maps a Showdown status token to the StatusCondition name used by the damage formula. */
    static String toStatusConditionToken(String showdownToken) {
        if (showdownToken == null || showdownToken.isBlank()) {
            return null;
        }
        return switch (showdownToken.trim().toLowerCase()) {
            case "brn" -> "BURN";
            case "par" -> "PARALYSIS";
            // SLP, FRZ, PSN, TOX have no damage-formula modifier; treat as NONE for calc purposes.
            // The raw log line is preserved in ReplayEvent.raw() for UI display.
            case "slp", "frz", "psn", "tox", "fnt" -> "NONE";
            default -> "NONE";
        };
    }
}
