package com.vgcenter.damagecalc.web.dto;

public record CalculateDamageResponseDto(
        int[] rolls,
        int min,
        int max,
        double minPct,
        double maxPct,
        double accuracy,
        double expectedDamageWithAccuracy,
        double koProbabilityWithCrit,
        KoChanceDto koChance) {}
