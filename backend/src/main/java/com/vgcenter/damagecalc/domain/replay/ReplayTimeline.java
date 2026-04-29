package com.vgcenter.damagecalc.domain.replay;

import java.util.List;
import java.util.Map;

public record ReplayTimeline(
        String sideAName,
        String sideBName,
        String winner,
        boolean tie,
        List<ReplayTurn> turns,
        Map<String, List<String>> revealedMovesBySpecies) {}
