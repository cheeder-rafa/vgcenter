package com.vgcenter.damagecalc.web.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;

public record SpeedTierEntryDto(
        @NotBlank String speciesId,
        @NotBlank String speciesName,
        @Min(0) @Max(32) int spSpeed,
        @NotBlank String natureId) {}
