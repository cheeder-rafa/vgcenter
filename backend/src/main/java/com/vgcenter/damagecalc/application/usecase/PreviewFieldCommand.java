package com.vgcenter.damagecalc.application.usecase;

import java.util.Objects;

public record PreviewFieldCommand(
        FieldCommand field,
        SideConditionsCommand selectedSide,
        SideConditionsCommand opponentSide,
        boolean criticalHit,
        int targets) {

    public PreviewFieldCommand {
        Objects.requireNonNull(field, "field must not be null");
        Objects.requireNonNull(selectedSide, "selectedSide must not be null");
        Objects.requireNonNull(opponentSide, "opponentSide must not be null");
    }
}
