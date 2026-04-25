package com.vgcenter.damagecalc.application.usecase;

public record DefenseSpreadCandidate(
        int spHp,
        int spDef,
        int spSpd,
        int totalSp,
        int remainingSp,
        double minDamagePct,
        double maxDamagePct,
        double koChanceProbability,
        String koChanceDescription) {}
