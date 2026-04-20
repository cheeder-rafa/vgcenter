package com.vgcenter.damagecalc.infrastructure.dataset;

import java.util.List;

public record MegaEvolutionDocument(
        String speciesId, String id, String name, List<String> types, BaseStatsDocument baseStats, String ability) {}
