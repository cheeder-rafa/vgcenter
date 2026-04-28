package com.vgcenter.damagecalc.web.dto;

import java.util.List;

public record ReplayGameReviewDto(int gameNumber, String winner, List<TurnReviewDto> turnReviews) {}
