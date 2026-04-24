package com.vgcenter.damagecalc.web.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.util.List;

public record EvaluateLeadsRequestDto(
        @NotBlank String regulation,
        @NotNull @Size(min = 2, max = 2) List<@Valid PreviewPokemonDto> selectedLeads,
        @NotNull @Size(min = 6, max = 6) List<@Valid PreviewPokemonDto> opponentTeam,
        @NotNull @Valid PreviewFieldDto field) {}
