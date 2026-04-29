package com.vgcenter.damagecalc.web.dto;

import java.util.List;

public record ThreatMatrixResponseDto(List<List<MatrixCellDto>> deal, List<List<MatrixCellDto>> take) {}
