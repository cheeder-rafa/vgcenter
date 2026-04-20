package com.vgcenter.damagecalc.application.usecase;

import java.util.Objects;

public record BuildStatsCommand(String speciesId, SpCommand sp, String natureId, boolean megaActive) {

    public BuildStatsCommand {
        requireText(speciesId, "speciesId");
        Objects.requireNonNull(sp, "sp must not be null");
        requireText(natureId, "natureId");
    }

    private static void requireText(String value, String label) {
        if (value == null || value.isBlank()) {
            throw new IllegalArgumentException(label + " must not be blank");
        }
    }
}
