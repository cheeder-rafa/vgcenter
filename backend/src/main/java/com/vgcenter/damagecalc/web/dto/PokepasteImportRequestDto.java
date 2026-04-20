package com.vgcenter.damagecalc.web.dto;

import jakarta.validation.constraints.NotBlank;

public record PokepasteImportRequestDto(@NotBlank String url) {}
