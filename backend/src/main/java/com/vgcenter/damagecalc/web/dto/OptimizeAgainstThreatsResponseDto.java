package com.vgcenter.damagecalc.web.dto;

import java.util.List;

public record OptimizeAgainstThreatsResponseDto(
        DefenseSpreadCandidateDto best, List<OptimizeAgainstThreatResultDto> threats) {}
