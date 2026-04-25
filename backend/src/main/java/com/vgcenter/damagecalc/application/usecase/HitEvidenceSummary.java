package com.vgcenter.damagecalc.application.usecase;

public record HitEvidenceSummary(
        String attackerName,
        String defenderName,
        String moveName,
        String moveType,
        double minPct,
        double maxPct,
        String koLabel,
        double koProbability,
        boolean selectedAttacking) {}
