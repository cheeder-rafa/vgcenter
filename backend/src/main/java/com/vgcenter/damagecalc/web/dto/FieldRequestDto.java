package com.vgcenter.damagecalc.web.dto;

import jakarta.validation.constraints.NotBlank;

public record FieldRequestDto(
        @NotBlank String weather,
        @NotBlank String terrain,
        @NotBlank String room) {}
