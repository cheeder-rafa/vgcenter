package com.vgcenter.damagecalc.web.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;

public record SpDto(
        @Min(0) @Max(32) int hp,
        @Min(0) @Max(32) int attack,
        @Min(0) @Max(32) int defense,
        @Min(0) @Max(32) int specialAttack,
        @Min(0) @Max(32) int specialDefense,
        @Min(0) @Max(32) int speed) {}
