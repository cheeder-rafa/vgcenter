package com.vgcenter.damagecalc.web.dto;

public record MoveDefinitionDto(
        String id,
        String name,
        String type,
        String category,
        int basePower,
        boolean spread,
        boolean contact,
        boolean doublePowerWhenUserStatused,
        boolean ignoreBurnPenaltyWhenUserStatused,
        double accuracy,
        boolean alwaysCrit) {}
