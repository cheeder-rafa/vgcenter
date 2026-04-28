package com.vgcenter.damagecalc.web.dto;

import java.util.List;

public record ReplayDecisionLineDto(
        List<ReplayMoveChoiceDto> choices,
        double score,
        double expectedDamageDealt,
        double expectedDamageTaken,
        int expectedKos,
        int expectedFaints) {}
