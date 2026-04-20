package com.vgcenter.damagecalc.web.controller;

import com.vgcenter.damagecalc.application.usecase.DatasetCatalogUseCase;
import com.vgcenter.damagecalc.web.dto.NamedDatasetEntryDto;
import com.vgcenter.damagecalc.web.dto.NatureResponseDto;
import com.vgcenter.damagecalc.web.dto.PokedexEntryResponseDto;
import com.vgcenter.damagecalc.web.dto.RegulationQueryDto;
import com.vgcenter.damagecalc.web.mapper.DatasetWebMapper;
import jakarta.validation.Valid;
import java.util.List;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/dataset")
public class DatasetController {

    private final DatasetCatalogUseCase datasetCatalogUseCase;
    private final DatasetWebMapper mapper;

    public DatasetController(DatasetCatalogUseCase datasetCatalogUseCase, DatasetWebMapper mapper) {
        this.datasetCatalogUseCase = datasetCatalogUseCase;
        this.mapper = mapper;
    }

    @GetMapping("/pokedex")
    public List<PokedexEntryResponseDto> pokedex(@Valid @ModelAttribute RegulationQueryDto query) {
        return mapper.toPokedexResponse(datasetCatalogUseCase.pokedex(query.regulation()));
    }

    @GetMapping("/moves")
    public List<NamedDatasetEntryDto> moves(@Valid @ModelAttribute RegulationQueryDto query) {
        return mapper.toNamedEntries(datasetCatalogUseCase.moves(query.regulation()));
    }

    @GetMapping("/abilities")
    public List<NamedDatasetEntryDto> abilities(@Valid @ModelAttribute RegulationQueryDto query) {
        return mapper.toNamedEntries(datasetCatalogUseCase.abilities(query.regulation()));
    }

    @GetMapping("/items")
    public List<NamedDatasetEntryDto> items(@Valid @ModelAttribute RegulationQueryDto query) {
        return mapper.toNamedEntries(datasetCatalogUseCase.items(query.regulation()));
    }

    @GetMapping("/natures")
    public List<NatureResponseDto> natures(@Valid @ModelAttribute RegulationQueryDto query) {
        return mapper.toNatureResponse(datasetCatalogUseCase.natures(query.regulation()));
    }
}
