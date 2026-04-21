package com.vgcenter.damagecalc.application.usecase;

public record MoveDefinition(
        String id,
        String name,
        String type,
        String category,
        int basePower,
        boolean spread,
        boolean contact,
        boolean doublePowerWhenUserStatused,
        boolean ignoreBurnPenaltyWhenUserStatused) {}
