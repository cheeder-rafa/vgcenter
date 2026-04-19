package com.vgcenter.damagecalc.domain.formula;

import com.vgcenter.damagecalc.domain.model.Combatant;
import com.vgcenter.damagecalc.domain.model.Move;
import java.util.Objects;

public record DamageContext(
        Combatant attacker, Combatant defender, Move move, Weather weather, boolean criticalHit, int targets) {

    public DamageContext {
        Objects.requireNonNull(attacker, "attacker must not be null");
        Objects.requireNonNull(defender, "defender must not be null");
        Objects.requireNonNull(move, "move must not be null");
        Objects.requireNonNull(weather, "weather must not be null");
        if (targets <= 0) {
            throw new IllegalArgumentException("Targets must be positive");
        }
    }
}
