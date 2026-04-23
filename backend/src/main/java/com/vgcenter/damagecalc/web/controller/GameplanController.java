package com.vgcenter.damagecalc.web.controller;

import com.vgcenter.damagecalc.application.usecase.EvaluateMatchupUseCase;
import com.vgcenter.damagecalc.web.dto.EvaluateMatchupRequestDto;
import com.vgcenter.damagecalc.web.dto.EvaluateMatchupResponseDto;
import com.vgcenter.damagecalc.web.mapper.GameplanWebMapper;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/gameplan")
public class GameplanController {

    private final EvaluateMatchupUseCase evaluateMatchupUseCase;
    private final GameplanWebMapper mapper;

    public GameplanController(EvaluateMatchupUseCase evaluateMatchupUseCase, GameplanWebMapper mapper) {
        this.evaluateMatchupUseCase = evaluateMatchupUseCase;
        this.mapper = mapper;
    }

    @PostMapping("/evaluate")
    public EvaluateMatchupResponseDto evaluate(@Valid @RequestBody EvaluateMatchupRequestDto request) {
        return mapper.toResponse(evaluateMatchupUseCase.evaluate(mapper.toCommand(request)));
    }
}
