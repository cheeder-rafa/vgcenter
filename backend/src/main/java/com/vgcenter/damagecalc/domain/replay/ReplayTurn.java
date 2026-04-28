package com.vgcenter.damagecalc.domain.replay;

import java.util.List;

public record ReplayTurn(int number, ReplayBoardState boardStateAtStart, List<ReplayEvent> events) {}
