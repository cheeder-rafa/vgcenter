package com.vgcenter.damagecalc.infrastructure.dataset;

import java.util.List;

public record PokedexEntryDocument(
        String id,
        String name,
        List<String> types,
        BaseStatsDocument baseStats,
        List<String> abilities,
        List<String> moves) {}
