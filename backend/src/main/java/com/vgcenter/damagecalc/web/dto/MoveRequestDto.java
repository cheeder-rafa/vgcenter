package com.vgcenter.damagecalc.web.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;

public record MoveRequestDto(
        @NotBlank String type,
        @NotBlank String category,
        @Min(0) int basePower,
        boolean spread,
        boolean contact,
        boolean doublePowerWhenUserStatused,
        boolean ignoreBurnPenaltyWhenUserStatused,
        Double accuracy,
        Boolean alwaysCrit) {}
