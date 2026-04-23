package com.vgcenter.damagecalc.application.usecase;

import java.util.List;
import java.util.Map;
import java.util.Objects;

public record CombatantCommand(
        int level,
        StatsCommand stats,
        List<String> types,
        String abilityId,
        String itemId,
        String status,
        Map<String, Integer> stages,
        boolean grounded,
        int currentHp) {

    public CombatantCommand {
        Objects.requireNonNull(stats, "stats must not be null");
        types = List.copyOf(Objects.requireNonNull(types, "types must not be null"));
        Objects.requireNonNull(status, "status must not be null");
        stages = Map.copyOf(Objects.requireNonNullElse(stages, Map.of()));
        if (currentHp <= 0 || currentHp > stats.hp()) {
            throw new IllegalArgumentException("Current HP must be between 1 and max HP");
        }
    }
}
