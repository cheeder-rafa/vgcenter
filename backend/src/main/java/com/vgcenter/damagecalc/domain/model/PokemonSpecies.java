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
        List<MegaForm> megaForms) {

    public PokemonSpecies {
        requireText(id, "Species id");
        requireText(name, "Species name");
        Objects.requireNonNull(baseStats, "Base stats must be provided");

        types = List.copyOf(Objects.requireNonNull(types, "Types must be provided"));
        abilityIds = immutableIds(abilityIds, "Ability ids");
        moveIds = immutableIds(moveIds, "Move ids");
        megaForms = List.copyOf(Objects.requireNonNull(megaForms, "Mega forms must be provided"));

        if (types.isEmpty() || types.size() > 2) {
            throw new IllegalArgumentException("Species must have one or two types");
        }
    }

    public PokemonSpecies(
            String id, String name, List<Type> types, Stats baseStats, List<String> abilityIds, List<String> moveIds) {
        this(id, name, types, baseStats, abilityIds, moveIds, List.of());
    }

    public PokemonSpecies(
            String id,
            String name,
            List<Type> types,
            Stats baseStats,
            List<String> abilityIds,
            List<String> moveIds,
            MegaForm megaForm) {
        this(id, name, types, baseStats, abilityIds, moveIds, List.of(Objects.requireNonNull(megaForm)));
    }

    public Combatant buildCombatant(int level, Sp sp, Nature nature, boolean megaActive) {
        if (!megaActive) {
            return Combatant.fromBaseStats(level, types, baseStats, sp, nature);
        }
        MegaForm form = megaForm()
                .orElseThrow(() -> new IllegalStateException("Species '" + id + "' has no Mega form registered"));
        return toMegaCombatant(level, sp, nature, form);
    }

    public Combatant buildCombatant(int level, Sp sp, Nature nature, String megaFormId) {
        MegaForm form = megaForms.stream()
                .filter(candidate -> candidate.id().equals(megaFormId))
                .findFirst()
                .orElseThrow(() -> new IllegalStateException(
                        "Species '" + id + "' has no Mega form '" + megaFormId + "' registered"));
        return toMegaCombatant(level, sp, nature, form);
    }

    public Optional<MegaForm> megaForm() {
        return megaForms.stream().findFirst();
    }

    private Combatant toMegaCombatant(int level, Sp sp, Nature nature, MegaForm form) {
        return Combatant.fromBaseStats(level, form.types(), form.baseStats(), sp, nature)
                .withAbility(Ability.fromId(form.abilityId()));
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
