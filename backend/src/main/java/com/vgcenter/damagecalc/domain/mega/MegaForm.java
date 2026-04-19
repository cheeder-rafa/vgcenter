package com.vgcenter.damagecalc.domain.mega;

import com.vgcenter.damagecalc.domain.model.Ability;
import com.vgcenter.damagecalc.domain.model.Stats;
import com.vgcenter.damagecalc.domain.model.Type;
import java.util.List;
import java.util.Objects;

public record MegaForm(String id, String name, List<Type> types, Stats baseStats, Ability ability) {

    public MegaForm {
        requireText(id, "Mega form id");
        requireText(name, "Mega form name");
        Objects.requireNonNull(baseStats, "Mega form base stats must not be null");
        Objects.requireNonNull(ability, "Mega form ability must not be null");
        types = List.copyOf(Objects.requireNonNull(types, "Mega form types must not be null"));
        if (types.isEmpty() || types.size() > 2) {
            throw new IllegalArgumentException("Mega form must have one or two types");
        }
    }

    private static void requireText(String value, String label) {
        if (value == null || value.isBlank()) {
            throw new IllegalArgumentException(label + " must not be blank");
        }
    }
}
