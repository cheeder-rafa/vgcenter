package com.vgcenter.damagecalc.application.usecase;

import java.util.Objects;

public record OptimizeAgainstThreatCommand(
        String attackerSpeciesId,
        String attackerNatureId,
        SpCommand attackerSp,
        String attackerAbilityId,
        String attackerItemId,
        String moveId,
        boolean attackerMegaActive,
        String attackerMegaFormId) {

    public OptimizeAgainstThreatCommand(
            String attackerSpeciesId,
            String attackerNatureId,
            SpCommand attackerSp,
            String attackerAbilityId,
            String attackerItemId,
            String moveId) {
        this(attackerSpeciesId, attackerNatureId, attackerSp, attackerAbilityId, attackerItemId, moveId, false, null);
    }

    public OptimizeAgainstThreatCommand {
        Objects.requireNonNull(attackerSpeciesId, "attackerSpeciesId must not be null");
        Objects.requireNonNull(attackerNatureId, "attackerNatureId must not be null");
        Objects.requireNonNull(attackerSp, "attackerSp must not be null");
        Objects.requireNonNull(moveId, "moveId must not be null");
    }
}
