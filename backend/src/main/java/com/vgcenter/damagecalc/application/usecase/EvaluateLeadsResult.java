package com.vgcenter.damagecalc.application.usecase;

import java.util.List;

public record EvaluateLeadsResult(List<LeadMatchupResult> matchups, Verdict matrixSummary) {

    public EvaluateLeadsResult(List<LeadMatchupResult> matchups) {
        this(matchups, null);
    }

    public EvaluateLeadsResult {
        matchups = List.copyOf(matchups);
    }

    public EvaluateLeadsResult withMatrixSummary(Verdict newSummary) {
        return new EvaluateLeadsResult(matchups, newSummary);
    }
}
