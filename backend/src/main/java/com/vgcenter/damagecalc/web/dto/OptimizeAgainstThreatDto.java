package com.vgcenter.damagecalc.web.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;

public record OptimizeAgainstThreatDto(
        @NotBlank String attackerSpeciesId,
        @NotBlank String attackerNatureId,
        @Valid SpDto attackerSp,
        String attackerAbilityId,
        String attackerItemId,
        @NotBlank String moveId,
        boolean attackerMegaActive,
        String attackerMegaFormId) {}
