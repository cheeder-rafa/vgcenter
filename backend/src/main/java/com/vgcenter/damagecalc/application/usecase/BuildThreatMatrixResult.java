package com.vgcenter.damagecalc.application.usecase;

import java.util.List;

/**
 * deal[i][j] = best move A_i can use against B_j.
 * take[i][j] = best move B_j can use against A_i.
 */
public record BuildThreatMatrixResult(List<List<MatrixCellResult>> deal, List<List<MatrixCellResult>> take) {}
