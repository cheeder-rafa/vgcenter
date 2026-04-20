package com.vgcenter.damagecalc.web.dto;

import jakarta.validation.constraints.NotBlank;

public record ShowdownImportRequestDto(@NotBlank String text) {}
