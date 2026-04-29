package com.vgcenter.damagecalc.web.dto;

import java.util.List;
import java.util.Map;

public record ReplayTimelineDto(
        String sideAName,
        String sideBName,
        String winner,
        boolean tie,
        List<ReplayTurnDto> turns,
        Map<String, List<String>> revealedMovesBySpecies) {}
