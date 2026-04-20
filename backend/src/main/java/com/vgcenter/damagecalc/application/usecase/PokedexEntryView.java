package com.vgcenter.damagecalc.application.usecase;

import java.util.List;

public record PokedexEntryView(
        String id,
        String name,
        List<String> types,
        StatsView baseStats,
        List<String> abilityIds,
        List<String> moveIds,
        List<MegaFormView> megaForms) {}
