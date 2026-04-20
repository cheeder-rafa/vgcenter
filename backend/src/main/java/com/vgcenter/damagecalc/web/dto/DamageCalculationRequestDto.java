package com.vgcenter.damagecalc.web.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record DamageCalculationRequestDto(
        @NotBlank String regulation,
        @NotNull @Valid CombatantRequestDto attacker,
        @NotNull @Valid CombatantRequestDto defender,
        @NotNull @Valid MoveRequestDto move,
        @NotNull @Valid FieldRequestDto field,
        @NotNull @Valid SideConditionsDto attackerSide,
        @NotNull @Valid SideConditionsDto defenderSide,
        boolean criticalHit,
        @Min(1) @Max(4) int targets) {}
