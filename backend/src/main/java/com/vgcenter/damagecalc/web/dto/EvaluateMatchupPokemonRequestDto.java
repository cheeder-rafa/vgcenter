package com.vgcenter.damagecalc.web.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.util.List;
import java.util.Objects;

public record EvaluateMatchupPokemonRequestDto(
        @NotBlank String speciesId,
        @NotNull @Valid CombatantRequestDto combatant,
        @NotNull @Size(min = 4, max = 4) List<@NotBlank String> moveIds,
        List<@NotBlank String> assumedForms) {

    public EvaluateMatchupPokemonRequestDto {
        assumedForms = List.copyOf(Objects.requireNonNullElse(assumedForms, List.of()));
    }
}
