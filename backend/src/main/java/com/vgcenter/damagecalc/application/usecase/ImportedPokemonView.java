package com.vgcenter.damagecalc.application.usecase;

import java.util.List;

public record ImportedPokemonView(
        String speciesId,
        String speciesName,
        String nickname,
        int level,
        String gender,
        String abilityId,
        String itemId,
        String natureId,
        StatsView sp,
        StatsView stats,
        List<String> moveIds) {}
