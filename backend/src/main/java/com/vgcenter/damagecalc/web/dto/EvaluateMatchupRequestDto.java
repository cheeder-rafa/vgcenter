package com.vgcenter.damagecalc.web.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.util.List;

public record EvaluateMatchupRequestDto(
        @NotBlank String regulation,
        @NotNull @Valid EvaluateMineRequestDto mine,
        @NotNull @Size(min = 6, max = 6) List<@Valid EvaluateMatchupPokemonRequestDto> opponent) {}
