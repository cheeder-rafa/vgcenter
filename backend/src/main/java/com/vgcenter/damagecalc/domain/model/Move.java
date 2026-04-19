package com.vgcenter.damagecalc.domain.model;

import java.util.Objects;

public record Move(
        Type type,
        MoveCategory category,
        int basePower,
        boolean spread,
        boolean contact,
        boolean doublePowerWhenUserStatused,
        boolean ignoreBurnPenaltyWhenUserStatused) {

    public Move {
        Objects.requireNonNull(type, "type must not be null");
        Objects.requireNonNull(category, "category must not be null");
        if (basePower <= 0) {
            throw new IllegalArgumentException("Base power must be positive");
        }
    }

    public Move(Type type, MoveCategory category, int basePower, boolean spread) {
        this(type, category, basePower, spread, false, false, false);
    }

    public Move(Type type, MoveCategory category, int basePower, boolean spread, boolean contact) {
        this(type, category, basePower, spread, contact, false, false);
    }
}
