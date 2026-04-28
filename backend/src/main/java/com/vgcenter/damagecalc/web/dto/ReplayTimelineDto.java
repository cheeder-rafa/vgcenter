package com.vgcenter.damagecalc.web.dto;

import java.util.List;

public record ReplayTimelineDto(
        String sideAName, String sideBName, String winner, boolean tie, List<ReplayTurnDto> turns) {}
