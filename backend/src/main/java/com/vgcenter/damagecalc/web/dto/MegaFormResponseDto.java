package com.vgcenter.damagecalc.web.dto;

import java.util.List;

public record MegaFormResponseDto(
        String id, String name, List<String> types, StatsResponseDto baseStats, String abilityId) {}
