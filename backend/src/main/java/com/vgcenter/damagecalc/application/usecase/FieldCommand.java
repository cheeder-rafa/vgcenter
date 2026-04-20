package com.vgcenter.damagecalc.application.usecase;

import java.util.Objects;

public record FieldCommand(String weather, String terrain, String room) {

    public FieldCommand {
        Objects.requireNonNull(weather, "weather must not be null");
        Objects.requireNonNull(terrain, "terrain must not be null");
        Objects.requireNonNull(room, "room must not be null");
    }
}
