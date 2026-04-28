package com.vgcenter.damagecalc.web.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import java.util.List;

public record OptimizeAgainstThreatsRequestDto(
        @NotBlank String regulation,
        @Valid @NotNull OptimizeAgainstThreatsDefenderDto defender,
        @Valid @NotEmpty List<OptimizeAgainstThreatDto> threats,
        @NotBlank String goal,
        @Valid FieldRequestDto field,
        @Valid SideConditionsDto attackerSide,
        @Valid SideConditionsDto defenderSide,
        boolean criticalHit) {}
