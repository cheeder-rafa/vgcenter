package com.vgcenter.damagecalc.web.dto;

import java.util.List;

public record ReplayTurnDto(int number, ReplayBoardStateDto boardStateAtStart, List<ReplayEventDto> events) {}
