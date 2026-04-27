package com.vgcenter.damagecalc.web.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;

public record OptimizeDefenseRequestDto(
        @NotBlank String regulation,
        @NotBlank String defenderSpeciesId,
        @NotBlank String defenderNatureId,
        String defenderAbilityId,
        String defenderItemId,
        @NotBlank String attackerSpeciesId,
        @NotBlank String attackerNatureId,
        @Valid SpDto attackerSp,
        String attackerAbilityId,
        String attackerItemId,
        @NotBlank String moveId,
        @NotBlank String goal,
        @Valid FieldRequestDto field,
        @Valid SideConditionsDto attackerSide,
        @Valid SideConditionsDto defenderSide,
        boolean criticalHit) {}
