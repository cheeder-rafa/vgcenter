package com.vgcenter.damagecalc.application.usecase;

import java.util.List;
import java.util.Objects;

public record ThreatPokemonCommand(CombatantCommand combatant, List<ResolvedMoveCommand> moves) {

    public ThreatPokemonCommand {
        Objects.requireNonNull(combatant, "combatant must not be null");
        moves = List.copyOf(Objects.requireNonNullElse(moves, List.of()));
    }
}
