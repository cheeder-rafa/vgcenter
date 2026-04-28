package com.vgcenter.damagecalc.application.usecase;

import java.util.List;

public record ReplayGameReview(int gameNumber, String winner, List<TurnReview> turnReviews) {

    public ReplayGameReview {
        turnReviews = List.copyOf(turnReviews);
    }
}
