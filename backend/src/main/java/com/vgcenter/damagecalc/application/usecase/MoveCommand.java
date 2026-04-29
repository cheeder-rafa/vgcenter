package com.vgcenter.damagecalc.application.usecase;

import java.util.Objects;

public record MoveCommand(
        String type,
        String category,
        int basePower,
        boolean spread,
        boolean contact,
        boolean doublePowerWhenUserStatused,
        boolean ignoreBurnPenaltyWhenUserStatused,
        double accuracy,
        boolean alwaysCrit) {

    public MoveCommand {
        Objects.requireNonNull(type, "type must not be null");
        Objects.requireNonNull(category, "category must not be null");
        if (accuracy <= 0.0d || accuracy > 1.0d) {
            throw new IllegalArgumentException("accuracy must be in (0, 1]");
        }
    }

    public MoveCommand(
            String type,
            String category,
            int basePower,
            boolean spread,
            boolean contact,
            boolean doublePowerWhenUserStatused,
            boolean ignoreBurnPenaltyWhenUserStatused) {
        this(
                type,
                category,
                basePower,
                spread,
                contact,
                doublePowerWhenUserStatused,
                ignoreBurnPenaltyWhenUserStatused,
                1.0d,
                false);
    }
}
