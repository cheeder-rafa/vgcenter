package com.vgcenter.damagecalc.application.usecase;

public record MatrixCellResult(String bestMoveId, double minPct, double maxPct, int[] rolls, KoChanceResult koChance) {}
