package com.vgcenter.damagecalc.application.usecase;

import java.util.List;
import java.util.Objects;

public record EvaluateLeadsCommand(
        String regulation,
        List<PreviewPokemonCommand> selectedLeads,
        List<PreviewPokemonCommand> opponentTeam,
        PreviewFieldCommand field) {

    public EvaluateLeadsCommand {
        Objects.requireNonNull(regulation, "regulation must not be null");
        selectedLeads = List.copyOf(Objects.requireNonNull(selectedLeads, "selectedLeads must not be null"));
        opponentTeam = List.copyOf(Objects.requireNonNull(opponentTeam, "opponentTeam must not be null"));
        Objects.requireNonNull(field, "field must not be null");
        if (selectedLeads.size() != 2) {
            throw new IllegalArgumentException("Exactly two selected leads are required");
        }
        if (opponentTeam.size() != 6) {
            throw new IllegalArgumentException("Exactly six opponent Pokemon are required");
        }
    }
}
