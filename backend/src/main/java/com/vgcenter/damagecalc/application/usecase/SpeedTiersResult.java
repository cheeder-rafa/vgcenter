package com.vgcenter.damagecalc.application.usecase;

import java.util.List;

public record SpeedTiersResult(List<SpeedTierRow> rows) {
    public SpeedTiersResult {
        rows = List.copyOf(rows);
    }
}
