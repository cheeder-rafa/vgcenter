package com.vgcenter.damagecalc.application.usecase;

import java.util.Objects;

public record MoveCommand(
        String type,
        String category,
        int basePower,
        boolean spread,
        boolean contact,
        boolean doublePowerWhenUserStatused,
        boolean ignoreBurnPenaltyWhenUserStatused) {

    public MoveCommand {
        Objects.requireNonNull(type, "type must not be null");
        Objects.requireNonNull(category, "category must not be null");
    }
}
