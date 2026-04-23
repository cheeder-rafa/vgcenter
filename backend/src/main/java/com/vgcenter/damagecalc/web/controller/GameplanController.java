package com.vgcenter.damagecalc.web.controller;

import com.vgcenter.damagecalc.application.usecase.EvaluateMatchupUseCase;
import com.vgcenter.damagecalc.application.usecase.RecommendLineupUseCase;
import com.vgcenter.damagecalc.web.dto.EvaluateMatchupRequestDto;
import com.vgcenter.damagecalc.web.dto.EvaluateMatchupResponseDto;
import com.vgcenter.damagecalc.web.dto.RecommendLineupRequestDto;
import com.vgcenter.damagecalc.web.dto.RecommendLineupResponseDto;
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
    private final RecommendLineupUseCase recommendLineupUseCase;
    private final GameplanWebMapper mapper;

    public GameplanController(
            EvaluateMatchupUseCase evaluateMatchupUseCase,
            RecommendLineupUseCase recommendLineupUseCase,
            GameplanWebMapper mapper) {
        this.evaluateMatchupUseCase = evaluateMatchupUseCase;
        this.recommendLineupUseCase = recommendLineupUseCase;
        this.mapper = mapper;
    }

    @PostMapping("/evaluate")
    public EvaluateMatchupResponseDto evaluate(@Valid @RequestBody EvaluateMatchupRequestDto request) {
        return mapper.toResponse(evaluateMatchupUseCase.evaluate(mapper.toCommand(request)));
    }

    @PostMapping("/recommend")
    public RecommendLineupResponseDto recommend(@Valid @RequestBody RecommendLineupRequestDto request) {
        return mapper.toResponse(recommendLineupUseCase.recommend(mapper.toCommand(request)));
    }
}
