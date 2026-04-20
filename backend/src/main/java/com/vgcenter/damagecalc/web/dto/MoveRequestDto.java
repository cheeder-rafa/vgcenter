package com.vgcenter.damagecalc.web.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Positive;

public record MoveRequestDto(
        @NotBlank String type,
        @NotBlank String category,
        @Positive int basePower,
        boolean spread,
        boolean contact,
        boolean doublePowerWhenUserStatused,
        boolean ignoreBurnPenaltyWhenUserStatused) {}
