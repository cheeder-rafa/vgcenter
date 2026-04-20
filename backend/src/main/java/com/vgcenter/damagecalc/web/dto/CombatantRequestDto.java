package com.vgcenter.damagecalc.web.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.util.List;

public record CombatantRequestDto(
        @Min(1) @Max(100) int level,
        @NotNull @Valid StatsDto stats,
        @NotEmpty @Size(max = 2) List<@NotBlank String> types,
        String abilityId,
        String itemId,
        @NotBlank String status,
        boolean grounded,
        boolean fullHp) {}
