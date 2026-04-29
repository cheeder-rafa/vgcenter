package com.vgcenter.damagecalc.web.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.util.List;

public record ThreatPokemonRequestDto(
        @NotNull @Valid CombatantRequestDto combatant,
        @NotEmpty @Size(max = 4) List<@NotNull @Valid ResolvedMoveRequestDto> moves) {}
