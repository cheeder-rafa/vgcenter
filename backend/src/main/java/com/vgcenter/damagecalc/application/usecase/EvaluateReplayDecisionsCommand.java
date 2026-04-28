package com.vgcenter.damagecalc.application.usecase;

import com.vgcenter.damagecalc.domain.replay.ReplayTimeline;
import java.util.List;
import java.util.Objects;

public record EvaluateReplayDecisionsCommand(
        String regulation, List<ReplayTimeline> timelines, ReplayScoringWeights objective) {

    public EvaluateReplayDecisionsCommand {
        Objects.requireNonNull(regulation, "regulation must not be null");
        timelines = List.copyOf(Objects.requireNonNull(timelines, "timelines must not be null"));
        if (timelines.isEmpty()) {
            throw new IllegalArgumentException("Replay evaluate request must provide timeline or timelines");
        }
        objective = Objects.requireNonNullElseGet(objective, ReplayScoringWeights::defaults);
    }
}
