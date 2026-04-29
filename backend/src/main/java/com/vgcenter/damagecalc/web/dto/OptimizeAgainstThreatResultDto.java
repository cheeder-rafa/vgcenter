package com.vgcenter.damagecalc.web.dto;

public record OptimizeAgainstThreatResultDto(
        String attackerSpeciesId,
        String moveId,
        double minDamagePct,
        double maxDamagePct,
        double expectedDamagePct,
        double ohkoProbability,
        double nearKoMargin,
        String koChanceDescription) {}
