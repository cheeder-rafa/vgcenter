package com.vgcenter.damagecalc.web.dto;

public record CalculateDamageResponseDto(
        int[] rolls, int min, int max, double minPct, double maxPct, KoChanceDto koChance) {}
