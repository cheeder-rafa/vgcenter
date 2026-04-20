package com.vgcenter.damagecalc.application.usecase;

public record CalculateDamageResult(
        int[] rolls, int min, int max, double minPct, double maxPct, KoChanceResult koChance) {}
