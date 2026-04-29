package com.vgcenter.damagecalc.web.dto;

import jakarta.validation.constraints.NotBlank;

public record OptimizeAgainstThreatsDefenderDto(
        @NotBlank String speciesId,
        @NotBlank String natureId,
        String abilityId,
        String itemId,
        boolean megaActive,
        String megaFormId) {}
