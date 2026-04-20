package com.vgcenter.damagecalc.web.controller;

import com.vgcenter.damagecalc.application.usecase.CalculateDamageUseCase;
import com.vgcenter.damagecalc.web.dto.CalculateDamageResponseDto;
import com.vgcenter.damagecalc.web.dto.DamageCalculationRequestDto;
import com.vgcenter.damagecalc.web.mapper.DamageCalculationWebMapper;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/damage")
public class DamageCalculationController {

    private final CalculateDamageUseCase calculateDamageUseCase;
    private final DamageCalculationWebMapper mapper;

    public DamageCalculationController(
            CalculateDamageUseCase calculateDamageUseCase, DamageCalculationWebMapper mapper) {
        this.calculateDamageUseCase = calculateDamageUseCase;
        this.mapper = mapper;
    }

    @PostMapping("/calculate")
    public CalculateDamageResponseDto calculate(@Valid @RequestBody DamageCalculationRequestDto request) {
        return mapper.toResponse(calculateDamageUseCase.calculate(mapper.toCommand(request)));
    }
}
