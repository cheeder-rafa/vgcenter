package com.vgcenter.damagecalc.application.usecase;

import java.util.List;
import java.util.Objects;

public record BuildThreatMatrixCommand(
        String regulation,
        List<ThreatPokemonCommand> teamA,
        List<ThreatPokemonCommand> teamB,
        FieldCommand field,
        SideConditionsCommand sideA,
        SideConditionsCommand sideB) {

    public BuildThreatMatrixCommand {
        Objects.requireNonNull(regulation, "regulation must not be null");
        Objects.requireNonNull(field, "field must not be null");
        Objects.requireNonNull(sideA, "sideA must not be null");
        Objects.requireNonNull(sideB, "sideB must not be null");
        teamA = List.copyOf(Objects.requireNonNull(teamA, "teamA must not be null"));
        teamB = List.copyOf(Objects.requireNonNull(teamB, "teamB must not be null"));
        if (teamA.size() > 6 || teamB.size() > 6) {
            throw new IllegalArgumentException("Teams may have at most 6 members");
        }
    }
}
