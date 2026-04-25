package com.vgcenter.damagecalc.web.controller;

import com.vgcenter.damagecalc.application.usecase.OptimizeDefensiveSpreadUseCase;
import com.vgcenter.damagecalc.web.dto.OptimizeDefenseRequestDto;
import com.vgcenter.damagecalc.web.dto.OptimizeDefenseResponseDto;
import com.vgcenter.damagecalc.web.mapper.CalcOptimizerWebMapper;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/calc")
public class CalcOptimizerController {

    private final OptimizeDefensiveSpreadUseCase optimizeDefensiveSpreadUseCase;
    private final CalcOptimizerWebMapper mapper;

    public CalcOptimizerController(
            OptimizeDefensiveSpreadUseCase optimizeDefensiveSpreadUseCase, CalcOptimizerWebMapper mapper) {
        this.optimizeDefensiveSpreadUseCase = optimizeDefensiveSpreadUseCase;
        this.mapper = mapper;
    }

    @PostMapping("/optimize-defense")
    public ResponseEntity<OptimizeDefenseResponseDto> optimizeDefense(
            @Valid @RequestBody OptimizeDefenseRequestDto request) {
        return ResponseEntity.ok(mapper.toResponse(optimizeDefensiveSpreadUseCase.optimize(mapper.toCommand(request))));
    }
}
