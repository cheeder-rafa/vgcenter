package com.vgcenter.damagecalc.web.controller;

import static org.springframework.http.MediaType.APPLICATION_JSON;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.vgcenter.damagecalc.application.usecase.ImportTeamUseCase;
import com.vgcenter.damagecalc.application.usecase.ImportedPokemonView;
import com.vgcenter.damagecalc.application.usecase.ImportedTeamResult;
import com.vgcenter.damagecalc.application.usecase.StatsView;
import com.vgcenter.damagecalc.web.error.ApiExceptionHandler;
import com.vgcenter.damagecalc.web.mapper.ImportWebMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.converter.json.MappingJackson2HttpMessageConverter;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.validation.beanvalidation.LocalValidatorFactoryBean;

class ImportControllerTest {

    private final StubImportTeamUseCase importTeamUseCase = new StubImportTeamUseCase();

    private MockMvc mockMvc;

    @BeforeEach
    void setUp() {
        LocalValidatorFactoryBean validator = new LocalValidatorFactoryBean();
        validator.afterPropertiesSet();

        ImportController controller = new ImportController(importTeamUseCase, new ImportWebMapper());
        mockMvc = MockMvcBuilders.standaloneSetup(controller)
                .setControllerAdvice(new ApiExceptionHandler())
                .setValidator(validator)
                .setMessageConverters(new MappingJackson2HttpMessageConverter(new ObjectMapper()))
                .build();
    }

    @Test
    void importsShowdownText() throws Exception {
        importTeamUseCase.nextResult = importedTeam();

        mockMvc.perform(post("/api/v1/import/showdown")
                        .contentType(APPLICATION_JSON)
                        .content("""
                                {
                                  "text": "Charizard @ Charizardite Y"
                                }
                                """))
                .andExpect(status().isOk())
                .andExpect(content().contentType(APPLICATION_JSON))
                .andExpect(jsonPath("$.team[0].speciesId").value("charizard"))
                .andExpect(jsonPath("$.team[0].nickname").value("Solaris"))
                .andExpect(jsonPath("$.team[0].sp.specialAttack").value(32))
                .andExpect(jsonPath("$.team[0].moveIds[1]").value("protect"));
    }

    @Test
    void importsPokepasteUrl() throws Exception {
        importTeamUseCase.nextResult = importedTeam();

        mockMvc.perform(post("/api/v1/import/pokepaste")
                        .contentType(APPLICATION_JSON)
                        .content("""
                                {
                                  "url": "https://pokepast.es/abc123"
                                }
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.team[0].itemId").value("charizardite-y"));
    }

    @Test
    void validatesBlankShowdownText() throws Exception {
        mockMvc.perform(post("/api/v1/import/showdown")
                        .contentType(APPLICATION_JSON)
                        .content("""
                                {
                                  "text": "   "
                                }
                                """))
                .andExpect(status().isBadRequest())
                .andExpect(content().contentTypeCompatibleWith("application/problem+json"));
    }

    private static ImportedTeamResult importedTeam() {
        return new ImportedTeamResult(java.util.List.of(new ImportedPokemonView(
                "charizard",
                "Charizard",
                "Solaris",
                50,
                "M",
                "blaze",
                "charizardite-y",
                "timid",
                new StatsView(1, 0, 0, 32, 0, 32),
                new StatsView(138, 80, 83, 157, 105, 132),
                java.util.List.of("heat-wave", "protect"))));
    }

    private static final class StubImportTeamUseCase implements ImportTeamUseCase {

        private ImportedTeamResult nextResult;

        @Override
        public ImportedTeamResult importShowdown(String text) {
            return nextResult;
        }

        @Override
        public ImportedTeamResult importPokepaste(String url) {
            return nextResult;
        }
    }
}
