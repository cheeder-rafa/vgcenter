package com.vgcenter.damagecalc.web.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;

public record SpeedTierModifiersDto(
        boolean tailwind,
        boolean trickRoom,
        boolean paralysis,
        boolean choiceScarf,
        @Min(-6) @Max(6) int stages) {}
