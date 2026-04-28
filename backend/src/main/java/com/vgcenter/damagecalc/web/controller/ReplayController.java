package com.vgcenter.damagecalc.web.controller;

import com.vgcenter.damagecalc.application.usecase.ParseReplayUseCase;
import com.vgcenter.damagecalc.web.dto.ReplayParseRequestDto;
import com.vgcenter.damagecalc.web.dto.ReplayTimelineDto;
import com.vgcenter.damagecalc.web.mapper.ReplayWebMapper;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/replay")
public class ReplayController {

    private final ParseReplayUseCase parseReplayUseCase;
    private final ReplayWebMapper mapper;

    public ReplayController(ParseReplayUseCase parseReplayUseCase, ReplayWebMapper mapper) {
        this.parseReplayUseCase = parseReplayUseCase;
        this.mapper = mapper;
    }

    @PostMapping("/parse")
    public ReplayTimelineDto parse(@RequestBody ReplayParseRequestDto request) {
        return mapper.toResponse(parseReplayUseCase.parse(mapper.toCommand(request)));
    }
}
