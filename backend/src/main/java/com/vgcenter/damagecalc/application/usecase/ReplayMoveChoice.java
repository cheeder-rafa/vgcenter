package com.vgcenter.damagecalc.application.usecase;

public record ReplayMoveChoice(
        String actorSlotId, String actorSpeciesName, String moveName, String targetSlotId, String targetSpeciesName) {}
