package com.vgcenter.damagecalc.web.dto;

public record ReplayScoringWeightsDto(
        double damageDealtWeight, double damageTakenWeight, double koBonus, double faintPenalty) {}
