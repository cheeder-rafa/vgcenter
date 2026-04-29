package com.vgcenter.damagecalc.application.usecase;

public record OptimizeAgainstThreatResult(
        String attackerSpeciesId,
        String moveId,
        double minDamagePct,
        double maxDamagePct,
        double expectedDamagePct,
        double ohkoProbability,
        double nearKoMargin,
        String koChanceDescription) {}
