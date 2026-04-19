package com.vgcenter.damagecalc.domain.model;

import java.util.List;
import java.util.Objects;

public record PokemonSpecies(
        String id,
        String name,
        List<Type> types,
        Stats baseStats,
        List<String> abilityIds,
        List<String> moveIds,
        List<String> itemIds) {

    public PokemonSpecies {
        requireText(id, "Species id");
        requireText(name, "Species name");
        Objects.requireNonNull(baseStats, "Base stats must be provided");

        types = List.copyOf(Objects.requireNonNull(types, "Types must be provided"));
        abilityIds = immutableIds(abilityIds, "Ability ids");
        moveIds = immutableIds(moveIds, "Move ids");
        itemIds = immutableIds(itemIds, "Item ids");

        if (types.isEmpty() || types.size() > 2) {
            throw new IllegalArgumentException("Species must have one or two types");
        }
    }

    private static List<String> immutableIds(List<String> ids, String label) {
        List<String> immutableIds = List.copyOf(Objects.requireNonNull(ids, label + " must be provided"));
        if (immutableIds.isEmpty()) {
            throw new IllegalArgumentException(label + " must not be empty");
        }
        immutableIds.forEach(id -> requireText(id, label + " entry"));
        return immutableIds;
    }

    private static void requireText(String value, String label) {
        if (value == null || value.isBlank()) {
            throw new IllegalArgumentException(label + " must not be blank");
        }
    }
}
