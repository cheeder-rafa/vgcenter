package com.vgcenter.damagecalc.web.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import java.util.List;

public record SpeedTiersRequestDto(
        @NotBlank String regulation,
        @Valid List<SpeedTierEntryDto> userTeam,
        @Valid SpeedTierModifiersDto modifiers) {}
