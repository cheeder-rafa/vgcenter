package com.vgcenter.damagecalc.domain.replay;

public record ReplayPokemonState(
        String slotId,
        String speciesName,
        int hpCurrent,
        int hpMax,
        String status,
        boolean fainted,
        ReplayBoostState boosts) {}
