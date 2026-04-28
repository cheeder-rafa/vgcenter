package com.vgcenter.damagecalc.web.dto;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import java.util.List;

public record ReplayEvaluateRequestDto(
        @NotBlank String regulation,
        @Valid ReplayTimelineDto timeline,
        @Valid List<ReplayTimelineDto> timelines,
        @Valid ReplayScoringWeightsDto objective) {}
