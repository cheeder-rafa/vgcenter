package com.vgcenter.damagecalc.web.controller;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.vgcenter.damagecalc.application.usecase.DatasetCatalogUseCase;
import com.vgcenter.damagecalc.application.usecase.MegaFormView;
import com.vgcenter.damagecalc.application.usecase.NamedDatasetEntry;
import com.vgcenter.damagecalc.application.usecase.NatureDefinition;
import com.vgcenter.damagecalc.application.usecase.PokedexEntryView;
import com.vgcenter.damagecalc.application.usecase.StatsView;
import com.vgcenter.damagecalc.web.error.ApiExceptionHandler;
import com.vgcenter.damagecalc.web.mapper.DatasetWebMapper;
import java.util.List;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.validation.beanvalidation.LocalValidatorFactoryBean;

class DatasetControllerTest {

    private final StubDatasetCatalogUseCase datasetCatalogUseCase = new StubDatasetCatalogUseCase();

    private MockMvc mockMvc;

    @BeforeEach
    void setUp() {
        LocalValidatorFactoryBean validator = new LocalValidatorFactoryBean();
        validator.afterPropertiesSet();

        DatasetController controller = new DatasetController(datasetCatalogUseCase, new DatasetWebMapper());
        mockMvc = MockMvcBuilders.standaloneSetup(controller)
                .setControllerAdvice(new ApiExceptionHandler())
                .setValidator(validator)
                .build();
    }

    @Test
    void returnsRequestedDatasetCatalogs() throws Exception {
        datasetCatalogUseCase.pokedex = List.of(new PokedexEntryView(
                "charizard",
                "Charizard",
                List.of("FIRE", "FLYING"),
                new StatsView(78, 84, 78, 109, 85, 100),
                List.of("blaze"),
                List.of("heat-wave", "protect"),
                List.of(new MegaFormView(
                        "charizard-mega-y",
                        "Charizard-Mega-Y",
                        List.of("FIRE", "FLYING"),
                        new StatsView(78, 104, 78, 159, 115, 100),
                        "drought"))));
        datasetCatalogUseCase.moves = List.of(new NamedDatasetEntry("heat-wave", "Heat Wave"));
        datasetCatalogUseCase.abilities = List.of(new NamedDatasetEntry("blaze", "Blaze"));
        datasetCatalogUseCase.items = List.of(new NamedDatasetEntry("life-orb", "Life Orb"));
        datasetCatalogUseCase.natures = List.of(new NatureDefinition("modest", "Modest", "SPECIAL_ATTACK", "ATTACK"));

        mockMvc.perform(get("/api/v1/dataset/pokedex").queryParam("regulation", "M-A"))
                .andExpect(status().isOk())
                .andExpect(content().contentType("application/json"))
                .andExpect(jsonPath("$[0].id").value("charizard"))
                .andExpect(jsonPath("$[0].megaForms[0].id").value("charizard-mega-y"));
        mockMvc.perform(get("/api/v1/dataset/moves").queryParam("regulation", "M-A"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].name").value("Heat Wave"));
        mockMvc.perform(get("/api/v1/dataset/abilities").queryParam("regulation", "M-A"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value("blaze"));
        mockMvc.perform(get("/api/v1/dataset/items").queryParam("regulation", "M-A"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value("life-orb"));
        mockMvc.perform(get("/api/v1/dataset/natures").queryParam("regulation", "M-A"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].decreasedStat").value("ATTACK"));
    }

    @Test
    void returnsProblemDetailsWhenRegulationIsMissing() throws Exception {
        mockMvc.perform(get("/api/v1/dataset/pokedex"))
                .andExpect(status().isBadRequest())
                .andExpect(content().contentType("application/problem+json"))
                .andExpect(jsonPath("$.title").value("Constraint Violation"))
                .andExpect(jsonPath("$.violations.regulation").value("must not be blank"));
    }

    private static final class StubDatasetCatalogUseCase implements DatasetCatalogUseCase {

        private List<PokedexEntryView> pokedex = List.of();
        private List<NamedDatasetEntry> moves = List.of();
        private List<NamedDatasetEntry> abilities = List.of();
        private List<NamedDatasetEntry> items = List.of();
        private List<NatureDefinition> natures = List.of();

        @Override
        public List<PokedexEntryView> pokedex(String regulationId) {
            return pokedex;
        }

        @Override
        public List<NamedDatasetEntry> moves(String regulationId) {
            return moves;
        }

        @Override
        public List<NamedDatasetEntry> abilities(String regulationId) {
            return abilities;
        }

        @Override
        public List<NamedDatasetEntry> items(String regulationId) {
            return items;
        }

        @Override
        public List<NatureDefinition> natures(String regulationId) {
            return natures;
        }
    }
}
