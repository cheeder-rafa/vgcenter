package com.vgcenter.damagecalc.domain.model;

import com.vgcenter.damagecalc.domain.mega.MegaForm;
import java.util.List;
import java.util.Objects;
import java.util.Optional;

public record PokemonSpecies(
        String id,
        String name,
        List<Type> types,
        Stats baseStats,
        List<String> abilityIds,
        List<String> moveIds,
        List<String> itemIds,
        Optional<MegaForm> megaForm) {

    public PokemonSpecies {
        requireText(id, "Species id");
        requireText(name, "Species name");
        Objects.requireNonNull(baseStats, "Base stats must be provided");
        Objects.requireNonNull(megaForm, "Mega form optional must not be null");

        types = List.copyOf(Objects.requireNonNull(types, "Types must be provided"));
        abilityIds = immutableIds(abilityIds, "Ability ids");
        moveIds = immutableIds(moveIds, "Move ids");
        itemIds = immutableIds(itemIds, "Item ids");

        if (types.isEmpty() || types.size() > 2) {
            throw new IllegalArgumentException("Species must have one or two types");
        }
    }

    public PokemonSpecies(
            String id,
            String name,
            List<Type> types,
            Stats baseStats,
            List<String> abilityIds,
            List<String> moveIds,
            List<String> itemIds) {
        this(id, name, types, baseStats, abilityIds, moveIds, itemIds, Optional.empty());
    }

    public PokemonSpecies(
            String id,
            String name,
            List<Type> types,
            Stats baseStats,
            List<String> abilityIds,
            List<String> moveIds,
            List<String> itemIds,
            MegaForm megaForm) {
        this(id, name, types, baseStats, abilityIds, moveIds, itemIds, Optional.ofNullable(megaForm));
    }

    public Combatant buildCombatant(int level, Sp sp, Nature nature, boolean megaActive) {
        if (megaActive) {
            MegaForm form = megaForm.orElseThrow(
                    () -> new IllegalStateException("Species '" + id + "' has no Mega form registered"));
            return Combatant.fromBaseStats(level, form.types(), form.baseStats(), sp, nature)
                    .withAbility(form.ability());
        }
        return Combatant.fromBaseStats(level, types, baseStats, sp, nature);
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
