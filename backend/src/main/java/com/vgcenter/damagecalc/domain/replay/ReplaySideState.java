package com.vgcenter.damagecalc.domain.replay;

import java.util.List;

public record ReplaySideState(
        String playerName,
        boolean tailwind,
        boolean reflect,
        boolean lightScreen,
        boolean auroraVeil,
        List<ReplayPokemonState> activePokemon) {}
