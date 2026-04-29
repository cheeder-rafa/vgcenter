package com.vgcenter.damagecalc.web.dto;

import java.util.List;

public record OptimizeAgainstThreatsResponseDto(
        DefenseSpreadCandidateDto best,
        List<DefenseSpreadCandidateDto> candidates,
        List<OptimizeAgainstThreatResultDto> threats) {}
