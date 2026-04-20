package com.vgcenter.damagecalc.web.dto;

import java.util.List;

public record PokedexEntryResponseDto(
        String id,
        String name,
        List<String> types,
        StatsResponseDto baseStats,
        List<String> abilityIds,
        List<String> moveIds,
        List<MegaFormResponseDto> megaForms) {}
