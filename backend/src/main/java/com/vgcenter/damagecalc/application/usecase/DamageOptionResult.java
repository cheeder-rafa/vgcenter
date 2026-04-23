package com.vgcenter.damagecalc.application.usecase;

import java.util.Objects;

public record DamageOptionResult(int attackerIndex, int defenderIndex, String moveId, CalculateDamageResult damage) {

    public DamageOptionResult {
        Objects.requireNonNull(moveId, "moveId must not be null");
        Objects.requireNonNull(damage, "damage must not be null");
    }
}
