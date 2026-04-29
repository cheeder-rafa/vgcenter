package com.vgcenter.damagecalc.web.dto;

import java.util.List;

public record MatrixCellDto(
        String bestMoveId, double minPct, double maxPct, List<Integer> rolls, KoChanceDto koChance) {}
