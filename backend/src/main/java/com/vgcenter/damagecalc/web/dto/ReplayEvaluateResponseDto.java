package com.vgcenter.damagecalc.web.dto;

import java.util.List;

public record ReplayEvaluateResponseDto(List<ReplayGameReviewDto> games, List<String> adaptationFlags) {}
