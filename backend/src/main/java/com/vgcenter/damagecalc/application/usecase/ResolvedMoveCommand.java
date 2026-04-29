package com.vgcenter.damagecalc.application.usecase;

import java.util.Objects;

public record ResolvedMoveCommand(String moveId, MoveCommand move) {

    public ResolvedMoveCommand {
        Objects.requireNonNull(moveId, "moveId must not be null");
        Objects.requireNonNull(move, "move must not be null");
    }
}
