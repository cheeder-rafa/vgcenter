package com.vgcenter.damagecalc.web.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

public record ResolvedMoveRequestDto(
        @NotBlank String moveId, @NotNull @Valid MoveRequestDto move) {}
