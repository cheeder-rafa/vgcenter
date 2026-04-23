package com.vgcenter.damagecalc.web.dto;

import java.util.List;

public record RecommendationDto(
        List<Integer> lineupIndices,
        List<String> lineupSpeciesIds,
        Integer winConditionIndex,
        double averageScore,
        List<GameplanMatchupCellDto> cells) {}
