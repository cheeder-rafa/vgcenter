package com.vgcenter.damagecalc.application.usecase;

import java.util.Objects;

public record CalculateDamageCommand(
        String regulation,
        CombatantCommand attacker,
        CombatantCommand defender,
        MoveCommand move,
        FieldCommand field,
        SideConditionsCommand attackerSide,
        SideConditionsCommand defenderSide,
        boolean criticalHit,
        int targets) {

    public CalculateDamageCommand {
        requireNonNull(regulation, "regulation");
        requireNonNull(attacker, "attacker");
        requireNonNull(defender, "defender");
        requireNonNull(move, "move");
        requireNonNull(field, "field");
        requireNonNull(attackerSide, "attackerSide");
        requireNonNull(defenderSide, "defenderSide");
    }

    private static void requireNonNull(Object value, String label) {
        Objects.requireNonNull(value, label + " must not be null");
    }
}
