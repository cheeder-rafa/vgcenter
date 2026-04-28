package com.vgcenter.damagecalc.domain.replay;

import java.util.List;

public record ReplayTimeline(String sideAName, String sideBName, String winner, boolean tie, List<ReplayTurn> turns) {}
