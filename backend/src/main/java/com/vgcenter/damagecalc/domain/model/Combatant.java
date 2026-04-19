package com.vgcenter.damagecalc.domain.model;

import java.util.List;
import java.util.Objects;

public record Combatant(
        int level,
        Stats stats,
        List<Type> types,
        Ability ability,
        Item item,
        StatusCondition status,
        boolean grounded,
        boolean fullHp) {

    public Combatant {
        if (level <= 0) {
            throw new IllegalArgumentException("Level must be positive");
        }
        Objects.requireNonNull(stats, "stats must not be null");
        Objects.requireNonNull(ability, "ability must not be null");
        Objects.requireNonNull(item, "item must not be null");
        Objects.requireNonNull(status, "status must not be null");
        types = List.copyOf(types);
        if (types.isEmpty() || types.size() > 2) {
            throw new IllegalArgumentException("Combatants must have one or two types");
        }
    }

    public Combatant(int level, Stats stats, List<Type> types) {
        this(level, stats, types, Ability.NONE, Item.NONE, StatusCondition.NONE, defaultGrounded(types), true);
    }

    public static Combatant fromBaseStats(int level, List<Type> types, Stats baseStats, Sp sp, Nature nature) {
        Objects.requireNonNull(baseStats, "baseStats must not be null");
        Objects.requireNonNull(sp, "sp must not be null");
        Objects.requireNonNull(nature, "nature must not be null");
        return new Combatant(level, baseStats.toBattleStats(sp, nature, level), types);
    }

    public Combatant withTypes(List<Type> updatedTypes) {
        return new Combatant(level, stats, updatedTypes, ability, item, status, defaultGrounded(updatedTypes), fullHp);
    }

    public Combatant withAbility(Ability updatedAbility) {
        return new Combatant(level, stats, types, updatedAbility, item, status, grounded, fullHp);
    }

    public Combatant withItem(Item updatedItem) {
        return new Combatant(level, stats, types, ability, updatedItem, status, grounded, fullHp);
    }

    public Combatant withStatus(StatusCondition updatedStatus) {
        return new Combatant(level, stats, types, ability, item, updatedStatus, grounded, fullHp);
    }

    public Combatant withGrounded(boolean updatedGrounded) {
        return new Combatant(level, stats, types, ability, item, status, updatedGrounded, fullHp);
    }

    public Combatant withFullHp(boolean updatedFullHp) {
        return new Combatant(level, stats, types, ability, item, status, grounded, updatedFullHp);
    }

    public boolean hasType(Type type) {
        return types.contains(type);
    }

    private static boolean defaultGrounded(List<Type> types) {
        return !types.contains(Type.FLYING);
    }
}
