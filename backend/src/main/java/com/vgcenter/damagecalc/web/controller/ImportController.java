package com.vgcenter.damagecalc.web.controller;

import com.vgcenter.damagecalc.application.usecase.ImportTeamUseCase;
import com.vgcenter.damagecalc.web.dto.ImportedTeamResponseDto;
import com.vgcenter.damagecalc.web.dto.PokepasteImportRequestDto;
import com.vgcenter.damagecalc.web.dto.ShowdownImportRequestDto;
import com.vgcenter.damagecalc.web.mapper.ImportWebMapper;
import jakarta.validation.Valid;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/import")
public class ImportController {

    private final ImportTeamUseCase importTeamUseCase;
    private final ImportWebMapper mapper;

    public ImportController(ImportTeamUseCase importTeamUseCase, ImportWebMapper mapper) {
        this.importTeamUseCase = importTeamUseCase;
        this.mapper = mapper;
    }

    @PostMapping("/showdown")
    public ImportedTeamResponseDto showdown(@Valid @RequestBody ShowdownImportRequestDto request) {
        return mapper.toResponse(importTeamUseCase.importShowdown(request.text()));
    }

    @PostMapping("/pokepaste")
    public ImportedTeamResponseDto pokepaste(@Valid @RequestBody PokepasteImportRequestDto request) {
        return mapper.toResponse(importTeamUseCase.importPokepaste(request.url()));
    }
}
