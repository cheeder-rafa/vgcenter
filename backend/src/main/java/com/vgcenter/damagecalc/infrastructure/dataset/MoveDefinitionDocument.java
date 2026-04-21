package com.vgcenter.damagecalc.infrastructure.dataset;

public record MoveDefinitionDocument(
        String id,
        String name,
        String type,
        String category,
        int basePower,
        boolean spread,
        boolean contact,
        boolean doublePowerWhenUserStatused,
        boolean ignoreBurnPenaltyWhenUserStatused) {}
