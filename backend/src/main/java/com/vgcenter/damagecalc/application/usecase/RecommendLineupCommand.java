package com.vgcenter.damagecalc.application.usecase;

import java.util.List;
import java.util.Objects;

public record RecommendLineupCommand(
        String regulation,
        List<EvaluateMatchupPokemonCommand> mine,
        Integer winConditionIndex,
        List<EvaluateMatchupPokemonCommand> opponent) {

    public RecommendLineupCommand {
        Objects.requireNonNull(regulation, "regulation must not be null");
        mine = List.copyOf(Objects.requireNonNull(mine, "mine must not be null"));
        opponent = List.copyOf(Objects.requireNonNull(opponent, "opponent must not be null"));
        if (regulation.isBlank()) {
            throw new IllegalArgumentException("regulation must not be blank");
        }
        if (mine.size() != 6) {
            throw new IllegalArgumentException("mine must contain exactly 6 Pokémon");
        }
        if (opponent.size() != 6) {
            throw new IllegalArgumentException("opponent must contain exactly 6 Pokémon");
        }
        if (winConditionIndex != null && (winConditionIndex < 0 || winConditionIndex >= mine.size())) {
            throw new IllegalArgumentException("winConditionIndex must refer to mine");
        }
    }
}
