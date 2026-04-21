package com.vgcenter.damagecalc.web.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record BuildStatsRequestDto(
        @NotBlank String speciesId,
        @NotNull @Valid SpDto sp,
        @NotBlank String natureId,
        boolean megaActive,
        String megaFormId) {}
