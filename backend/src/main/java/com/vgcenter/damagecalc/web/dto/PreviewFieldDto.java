package com.vgcenter.damagecalc.web.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

public record PreviewFieldDto(
        @NotNull @Valid FieldRequestDto field,
        @NotNull @Valid SideConditionsDto selectedSide,
        @NotNull @Valid SideConditionsDto opponentSide,
        boolean criticalHit,
        @Min(1) @Max(4) int targets) {}
