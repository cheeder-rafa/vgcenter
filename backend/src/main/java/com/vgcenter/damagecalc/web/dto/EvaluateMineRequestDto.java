package com.vgcenter.damagecalc.web.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.util.List;

public record EvaluateMineRequestDto(
        @NotNull @Size(min = 4, max = 4) List<@Valid EvaluateMatchupPokemonRequestDto> lineup,
        @Min(0) @Max(3) Integer winConditionIndex) {}
