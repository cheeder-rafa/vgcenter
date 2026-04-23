package com.vgcenter.damagecalc.application.usecase;

import java.util.List;
import java.util.Objects;

public record EvaluateMineCommand(List<EvaluateMatchupPokemonCommand> lineup, Integer winConditionIndex) {

    public EvaluateMineCommand {
        lineup = List.copyOf(Objects.requireNonNull(lineup, "lineup must not be null"));
        if (lineup.size() != 4) {
            throw new IllegalArgumentException("lineup must contain exactly 4 Pokémon");
        }
        if (winConditionIndex != null && (winConditionIndex < 0 || winConditionIndex >= lineup.size())) {
            throw new IllegalArgumentException("winConditionIndex must refer to the lineup");
        }
    }
}
