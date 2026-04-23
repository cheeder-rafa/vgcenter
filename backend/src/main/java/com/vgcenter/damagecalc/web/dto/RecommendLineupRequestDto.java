package com.vgcenter.damagecalc.web.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.util.List;

public record RecommendLineupRequestDto(
        @NotBlank String regulation,
        @NotNull @Size(min = 6, max = 6) List<@Valid EvaluateMatchupPokemonRequestDto> mine,
        @Min(0) @Max(5) Integer winConditionIndex,
        @NotNull @Size(min = 6, max = 6) List<@Valid EvaluateMatchupPokemonRequestDto> opponent) {}
