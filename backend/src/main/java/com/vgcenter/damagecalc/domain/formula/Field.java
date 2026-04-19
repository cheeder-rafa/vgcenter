package com.vgcenter.damagecalc.domain.formula;

import java.util.Objects;

public record Field(Weather weather, Terrain terrain, Room room) {

    public Field {
        Objects.requireNonNull(weather, "weather must not be null");
        Objects.requireNonNull(terrain, "terrain must not be null");
        Objects.requireNonNull(room, "room must not be null");
    }

    public static Field clear() {
        return new Field(Weather.CLEAR, Terrain.NONE, Room.NONE);
    }
}
