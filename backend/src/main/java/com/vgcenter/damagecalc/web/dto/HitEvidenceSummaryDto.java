package com.vgcenter.damagecalc.web.dto;

public record HitEvidenceSummaryDto(
        String attackerName,
        String defenderName,
        String moveName,
        String moveType,
        double minPct,
        double maxPct,
        String koLabel,
        double koProbability,
        boolean selectedAttacking) {}
