package com.vgcenter.damagecalc.application.usecase;

import java.util.List;
import java.util.Objects;

public record RecommendPlansCommand(
        String regulation,
        List<PreviewPokemonCommand> myTeam,
        List<PreviewPokemonCommand> opponentTeam,
        Integer winConditionIndex,
        PreviewFieldCommand field) {

    public RecommendPlansCommand {
        Objects.requireNonNull(regulation, "regulation must not be null");
        myTeam = List.copyOf(Objects.requireNonNull(myTeam, "myTeam must not be null"));
        opponentTeam = List.copyOf(Objects.requireNonNull(opponentTeam, "opponentTeam must not be null"));
        Objects.requireNonNull(field, "field must not be null");
        if (myTeam.size() != 6) {
            throw new IllegalArgumentException("Exactly six myTeam Pokémon are required");
        }
        if (opponentTeam.size() != 6) {
            throw new IllegalArgumentException("Exactly six opponent Pokémon are required");
        }
        if (winConditionIndex != null && (winConditionIndex < 0 || winConditionIndex > 5)) {
            throw new IllegalArgumentException("winConditionIndex must be 0–5");
        }
    }
}
