package com.vgcenter.damagecalc.application.usecase;

import java.util.List;

public record EvaluateLeadsResult(List<LeadMatchupResult> matchups) {
    public EvaluateLeadsResult {
        matchups = List.copyOf(matchups);
    }
}
