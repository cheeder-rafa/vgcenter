package com.vgcenter.damagecalc.web.dto;

public record ReplayPokemonStateDto(
        String slotId,
        String speciesName,
        int hpCurrent,
        int hpMax,
        String status,
        boolean fainted,
        ReplayBoostStateDto boosts) {}
