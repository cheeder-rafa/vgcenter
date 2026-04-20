package com.vgcenter.damagecalc.web.dto;

import java.util.List;

public record ImportedPokemonDto(
        String speciesId,
        String speciesName,
        String nickname,
        int level,
        String gender,
        String abilityId,
        String itemId,
        String natureId,
        StatsResponseDto sp,
        StatsResponseDto stats,
        List<String> moveIds) {}
