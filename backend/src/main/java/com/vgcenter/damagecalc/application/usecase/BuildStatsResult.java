package com.vgcenter.damagecalc.application.usecase;

import java.util.Objects;

public record BuildStatsResult(StatsView baseStats, StatsView finalStats) {

    public BuildStatsResult {
        Objects.requireNonNull(baseStats, "baseStats must not be null");
        Objects.requireNonNull(finalStats, "finalStats must not be null");
    }
}
