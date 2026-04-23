package com.vgcenter.damagecalc.application.usecase;

import java.util.List;
import java.util.Objects;

public record EvaluateMatchupResult(List<MatchupCellResult> cells) {

    public EvaluateMatchupResult {
        cells = List.copyOf(Objects.requireNonNull(cells, "cells must not be null"));
    }
}
