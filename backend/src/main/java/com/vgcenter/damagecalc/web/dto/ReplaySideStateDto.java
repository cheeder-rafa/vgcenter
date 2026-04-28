package com.vgcenter.damagecalc.web.dto;

import java.util.List;

public record ReplaySideStateDto(
        String playerName,
        boolean tailwind,
        boolean reflect,
        boolean lightScreen,
        boolean auroraVeil,
        List<ReplayPokemonStateDto> activePokemon) {}
