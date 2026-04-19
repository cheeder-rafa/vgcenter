package com.vgcenter.damagecalc.domain.model;

import java.util.List;
import java.util.Objects;

public record Combatant(int level, Stats stats, List<Type> types) {

    public Combatant {
        if (level <= 0) {
            throw new IllegalArgumentException("Level must be positive");
        }
        Objects.requireNonNull(stats, "stats must not be null");
        types = List.copyOf(types);
        if (types.isEmpty() || types.size() > 2) {
            throw new IllegalArgumentException("Combatants must have one or two types");
        }
    }

    public static Combatant fromBaseStats(int level, List<Type> types, Stats baseStats, Sp sp, Nature nature) {
        Objects.requireNonNull(baseStats, "baseStats must not be null");
        Objects.requireNonNull(sp, "sp must not be null");
        Objects.requireNonNull(nature, "nature must not be null");
        return new Combatant(level, baseStats.toBattleStats(sp, nature, level), types);
    }

    public Combatant withTypes(List<Type> updatedTypes) {
        return new Combatant(level, stats, updatedTypes);
    }

    public boolean hasType(Type type) {
        return types.contains(type);
    }
}
