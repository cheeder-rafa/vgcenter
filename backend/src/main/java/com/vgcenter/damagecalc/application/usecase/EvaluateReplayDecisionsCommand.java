package com.vgcenter.damagecalc.application.usecase;

import com.vgcenter.damagecalc.domain.replay.ReplayTimeline;
import java.util.List;
import java.util.Objects;

public record EvaluateReplayDecisionsCommand(
        String regulation,
        List<ReplayTimeline> timelines,
        ReplayScoringWeights objective,
        /** "P1" or "P2" — which side the user played. Defaults to "P1". */
        String userPlayer) {

    public EvaluateReplayDecisionsCommand {
        Objects.requireNonNull(regulation, "regulation must not be null");
        timelines = List.copyOf(Objects.requireNonNull(timelines, "timelines must not be null"));
        if (timelines.isEmpty()) {
            throw new IllegalArgumentException("Replay evaluate request must provide timeline or timelines");
        }
        objective = Objects.requireNonNullElseGet(objective, ReplayScoringWeights::defaults);
        userPlayer = (userPlayer == null || userPlayer.isBlank()) ? "P1" : userPlayer.toUpperCase();
        if (!"P1".equals(userPlayer) && !"P2".equals(userPlayer)) {
            throw new IllegalArgumentException("userPlayer must be P1 or P2, got: " + userPlayer);
        }
    }
}
