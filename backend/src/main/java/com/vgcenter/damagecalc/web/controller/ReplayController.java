package com.vgcenter.damagecalc.web.controller;

import com.vgcenter.damagecalc.application.usecase.EvaluateReplayDecisionsUseCase;
import com.vgcenter.damagecalc.application.usecase.ParseReplayUseCase;
import com.vgcenter.damagecalc.web.dto.ReplayEvaluateRequestDto;
import com.vgcenter.damagecalc.web.dto.ReplayEvaluateResponseDto;
import com.vgcenter.damagecalc.web.dto.ReplayParseRequestDto;
import com.vgcenter.damagecalc.web.dto.ReplayTimelineDto;
import com.vgcenter.damagecalc.web.mapper.ReplayWebMapper;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/replay")
public class ReplayController {

    private final ParseReplayUseCase parseReplayUseCase;
    private final EvaluateReplayDecisionsUseCase evaluateReplayDecisionsUseCase;
    private final ReplayWebMapper mapper;

    public ReplayController(
            ParseReplayUseCase parseReplayUseCase,
            EvaluateReplayDecisionsUseCase evaluateReplayDecisionsUseCase,
            ReplayWebMapper mapper) {
        this.parseReplayUseCase = parseReplayUseCase;
        this.evaluateReplayDecisionsUseCase = evaluateReplayDecisionsUseCase;
        this.mapper = mapper;
    }

    @PostMapping("/parse")
    public ReplayTimelineDto parse(@RequestBody ReplayParseRequestDto request) {
        return mapper.toResponse(parseReplayUseCase.parse(mapper.toCommand(request)));
    }

    @PostMapping("/evaluate")
    public ReplayEvaluateResponseDto evaluate(@Valid @RequestBody ReplayEvaluateRequestDto request) {
        return mapper.toResponse(evaluateReplayDecisionsUseCase.evaluate(mapper.toCommand(request)));
    }
}
