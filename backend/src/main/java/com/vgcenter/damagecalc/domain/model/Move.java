package com.vgcenter.damagecalc.domain.model;

import java.util.Objects;

public record Move(Type type, MoveCategory category, int basePower, boolean spread) {

    public Move {
        Objects.requireNonNull(type, "type must not be null");
        Objects.requireNonNull(category, "category must not be null");
        if (basePower <= 0) {
            throw new IllegalArgumentException("Base power must be positive");
        }
    }
}
