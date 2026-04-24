package com.vgcenter.damagecalc.web.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.util.List;

public record RecommendPlansRequestDto(
        @NotBlank String regulation,
        @NotNull @Size(min = 6, max = 6) @Valid List<PreviewPokemonDto> myTeam,
        @NotNull @Size(min = 6, max = 6) @Valid List<PreviewPokemonDto> opponentTeam,
        Integer winConditionIndex,
        @NotNull @Valid PreviewFieldDto field) {}
