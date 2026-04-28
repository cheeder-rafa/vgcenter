package com.vgcenter.damagecalc.application.usecase;

import java.util.List;

public record OptimizeAgainstThreatsResult(DefenseSpreadCandidate best, List<OptimizeAgainstThreatResult> threats) {

    public OptimizeAgainstThreatsResult {
        threats = List.copyOf(threats);
    }
}
