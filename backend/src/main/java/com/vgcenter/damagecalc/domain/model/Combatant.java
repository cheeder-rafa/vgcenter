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
        int currentHp) {

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
        if (currentHp <= 0 || currentHp > stats.hp()) {
            throw new IllegalArgumentException("Current HP must be between 1 and max HP");
        }
    }

    public Combatant(int level, Stats stats, List<Type> types) {
        this(level, stats, types, Ability.NONE, Item.NONE, StatusCondition.NONE, defaultGrounded(types), stats.hp());
    }

    public static Combatant fromBaseStats(int level, List<Type> types, Stats baseStats, Sp sp, Nature nature) {
        Objects.requireNonNull(baseStats, "baseStats must not be null");
        Objects.requireNonNull(sp, "sp must not be null");
        Objects.requireNonNull(nature, "nature must not be null");
        return new Combatant(level, baseStats.toBattleStats(sp, nature, level), types);
    }

    public Combatant withTypes(List<Type> updatedTypes) {
        return new Combatant(
                level, stats, updatedTypes, ability, item, status, defaultGrounded(updatedTypes), currentHp);
    }

    public Combatant withAbility(Ability updatedAbility) {
        return new Combatant(level, stats, types, updatedAbility, item, status, grounded, currentHp);
    }

    public Combatant withItem(Item updatedItem) {
        return new Combatant(level, stats, types, ability, updatedItem, status, grounded, currentHp);
    }

    public Combatant withStatus(StatusCondition updatedStatus) {
        return new Combatant(level, stats, types, ability, item, updatedStatus, grounded, currentHp);
    }

    public Combatant withGrounded(boolean updatedGrounded) {
        return new Combatant(level, stats, types, ability, item, status, updatedGrounded, currentHp);
    }

    public Combatant withCurrentHp(int updatedCurrentHp) {
        return new Combatant(level, stats, types, ability, item, status, grounded, updatedCurrentHp);
    }

    public boolean hasType(Type type) {
        return types.contains(type);
    }

    public boolean fullHp() {
        return currentHp == stats.hp();
    }

    public boolean atOrBelowHalfHp() {
        return currentHp * 2 <= stats.hp();
    }

    public boolean atOrBelowThirdHp() {
        return currentHp * 3 <= stats.hp();
    }

    private static boolean defaultGrounded(List<Type> types) {
        return !types.contains(Type.FLYING);
    }
}
