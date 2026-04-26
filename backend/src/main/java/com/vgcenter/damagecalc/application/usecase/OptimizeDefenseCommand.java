package com.vgcenter.damagecalc.application.usecase;

import java.util.Objects;

public record OptimizeDefenseCommand(
        String regulation,
        String defenderSpeciesId,
        String defenderNatureId,
        String attackerSpeciesId,
        String attackerNatureId,
        SpCommand attackerSp,
        String attackerAbilityId,
        String attackerItemId,
        String moveId,
        String goal,
        FieldCommand field,
        SideConditionsCommand attackerSide,
        SideConditionsCommand defenderSide,
        boolean criticalHit) {

    public OptimizeDefenseCommand {
        Objects.requireNonNull(regulation, "regulation must not be null");
        Objects.requireNonNull(defenderSpeciesId, "defenderSpeciesId must not be null");
        Objects.requireNonNull(defenderNatureId, "defenderNatureId must not be null");
        Objects.requireNonNull(attackerSpeciesId, "attackerSpeciesId must not be null");
        Objects.requireNonNull(attackerNatureId, "attackerNatureId must not be null");
        Objects.requireNonNull(attackerSp, "attackerSp must not be null");
        Objects.requireNonNull(moveId, "moveId must not be null");
        Objects.requireNonNull(goal, "goal must not be null");
        Objects.requireNonNull(field, "field must not be null");
        Objects.requireNonNull(attackerSide, "attackerSide must not be null");
        Objects.requireNonNull(defenderSide, "defenderSide must not be null");
    }
}
