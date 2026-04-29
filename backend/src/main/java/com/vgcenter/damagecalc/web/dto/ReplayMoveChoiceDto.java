package com.vgcenter.damagecalc.web.dto;

public record ReplayMoveChoiceDto(
        String actorSlotId,
        String actorSpeciesName,
        String moveName,
        String targetSlotId,
        String targetSpeciesName,
        String kind) {}
