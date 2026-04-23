package com.vgcenter.damagecalc.application.usecase;

import java.util.List;
import java.util.Objects;

public record EvaluateMatchupPokemonCommand(
        String speciesId, CombatantCommand combatant, List<String> moveIds, List<String> assumedForms) {

    public EvaluateMatchupPokemonCommand {
        Objects.requireNonNull(speciesId, "speciesId must not be null");
        Objects.requireNonNull(combatant, "combatant must not be null");
        moveIds = List.copyOf(Objects.requireNonNull(moveIds, "moveIds must not be null"));
        assumedForms = List.copyOf(Objects.requireNonNullElse(assumedForms, List.of()));

        if (speciesId.isBlank()) {
            throw new IllegalArgumentException("speciesId must not be blank");
        }
        if (moveIds.size() != 4) {
            throw new IllegalArgumentException("moveIds must contain exactly 4 entries");
        }
    }
}
