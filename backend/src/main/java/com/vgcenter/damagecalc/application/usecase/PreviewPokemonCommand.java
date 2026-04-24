package com.vgcenter.damagecalc.application.usecase;

import java.util.List;
import java.util.Objects;

public record PreviewPokemonCommand(
        String pokemonId,
        String displayName,
        CombatantCommand combatant,
        List<MoveCommand> moves,
        boolean isMega,
        int statusMoveCount,
        List<String> supportTags) {

    public PreviewPokemonCommand {
        Objects.requireNonNull(pokemonId, "pokemonId must not be null");
        Objects.requireNonNull(displayName, "displayName must not be null");
        Objects.requireNonNull(combatant, "combatant must not be null");
        moves = List.copyOf(Objects.requireNonNull(moves, "moves must not be null"));
        if (statusMoveCount < 0) {
            throw new IllegalArgumentException("statusMoveCount must not be negative");
        }
        supportTags = List.copyOf(Objects.requireNonNull(supportTags, "supportTags must not be null"));
    }
}
