package com.vgcenter.damagecalc.web.dto;

import java.util.List;

public record RecommendLineupResponseDto(int evaluatedLineups, List<RecommendationDto> recommendations) {}
