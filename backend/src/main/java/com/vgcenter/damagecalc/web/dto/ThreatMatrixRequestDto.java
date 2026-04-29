package com.vgcenter.damagecalc.web.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.util.List;

public record ThreatMatrixRequestDto(
        @NotBlank String regulation,
        @NotEmpty @Size(max = 6) List<@NotNull @Valid ThreatPokemonRequestDto> teamA,
        @NotEmpty @Size(max = 6) List<@NotNull @Valid ThreatPokemonRequestDto> teamB,
        @NotNull @Valid FieldRequestDto field,
        @NotNull @Valid SideConditionsDto sideA,
        @NotNull @Valid SideConditionsDto sideB) {}
