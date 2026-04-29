package com.vgcenter.damagecalc.web.dto;

public record DefenseSpreadCandidateDto(
        int spHp,
        int spDef,
        int spSpd,
        int totalSp,
        int remainingSp,
        double minDamagePct,
        double maxDamagePct,
        double ohkoProbability,
        double nearKoMargin,
        @Deprecated double koChanceProbability,
        String koChanceDescription,
        String suggestedNatureId) {}
