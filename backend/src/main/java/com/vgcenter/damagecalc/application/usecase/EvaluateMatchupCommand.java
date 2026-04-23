package com.vgcenter.damagecalc.application.usecase;

import java.util.List;
import java.util.Objects;

public record EvaluateMatchupCommand(
        String regulation, EvaluateMineCommand mine, List<EvaluateMatchupPokemonCommand> opponent) {

    public EvaluateMatchupCommand {
        Objects.requireNonNull(regulation, "regulation must not be null");
        Objects.requireNonNull(mine, "mine must not be null");
        opponent = List.copyOf(Objects.requireNonNull(opponent, "opponent must not be null"));
        if (regulation.isBlank()) {
            throw new IllegalArgumentException("regulation must not be blank");
        }
        if (opponent.size() != 6) {
            throw new IllegalArgumentException("opponent must contain exactly 6 Pokémon");
        }
    }
}
