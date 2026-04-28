package com.vgcenter.damagecalc.application.usecase;

import java.util.List;

public record EvaluateReplayDecisionsResult(List<ReplayGameReview> games, List<String> adaptationFlags) {

    public EvaluateReplayDecisionsResult {
        games = List.copyOf(games);
        adaptationFlags = List.copyOf(adaptationFlags);
    }
}
