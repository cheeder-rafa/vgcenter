package com.vgcenter.damagecalc.web.controller;

import com.vgcenter.damagecalc.application.usecase.BuildThreatMatrixUseCase;
import com.vgcenter.damagecalc.web.dto.ThreatMatrixRequestDto;
import com.vgcenter.damagecalc.web.dto.ThreatMatrixResponseDto;
import com.vgcenter.damagecalc.web.mapper.MatchupWebMapper;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/matchup")
public class MatchupController {

    private final BuildThreatMatrixUseCase buildThreatMatrixUseCase;
    private final MatchupWebMapper mapper;

    public MatchupController(BuildThreatMatrixUseCase buildThreatMatrixUseCase, MatchupWebMapper mapper) {
        this.buildThreatMatrixUseCase = buildThreatMatrixUseCase;
        this.mapper = mapper;
    }

    @PostMapping("/matrix")
    public ThreatMatrixResponseDto matrix(@Valid @RequestBody ThreatMatrixRequestDto request) {
        return mapper.toResponse(buildThreatMatrixUseCase.build(mapper.toCommand(request)));
    }
}
