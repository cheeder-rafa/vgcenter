package com.vgcenter.damagecalc.web.controller;

import com.vgcenter.damagecalc.application.usecase.EvaluateLeadsUseCase;
import com.vgcenter.damagecalc.web.dto.EvaluateLeadsRequestDto;
import com.vgcenter.damagecalc.web.dto.EvaluateLeadsResponseDto;
import com.vgcenter.damagecalc.web.mapper.PreviewWebMapper;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/preview")
public class PreviewController {

    private final EvaluateLeadsUseCase evaluateLeadsUseCase;
    private final PreviewWebMapper mapper;

    public PreviewController(EvaluateLeadsUseCase evaluateLeadsUseCase, PreviewWebMapper mapper) {
        this.evaluateLeadsUseCase = evaluateLeadsUseCase;
        this.mapper = mapper;
    }

    @PostMapping("/leads/evaluate")
    public EvaluateLeadsResponseDto evaluateLeads(@Valid @RequestBody EvaluateLeadsRequestDto request) {
        return mapper.toResponse(evaluateLeadsUseCase.evaluate(mapper.toCommand(request)));
    }
}
