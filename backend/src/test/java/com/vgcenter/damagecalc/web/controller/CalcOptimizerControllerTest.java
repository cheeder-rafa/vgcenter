package com.vgcenter.damagecalc.web.controller;

import static org.springframework.http.MediaType.APPLICATION_JSON;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.vgcenter.damagecalc.application.usecase.DefenseSpreadCandidate;
import com.vgcenter.damagecalc.application.usecase.OptimizeDefenseCommand;
import com.vgcenter.damagecalc.application.usecase.OptimizeDefenseResult;
import com.vgcenter.damagecalc.application.usecase.OptimizeDefensiveSpreadUseCase;
import com.vgcenter.damagecalc.web.error.ApiExceptionHandler;
import com.vgcenter.damagecalc.web.mapper.CalcOptimizerWebMapper;
import java.util.List;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.converter.json.MappingJackson2HttpMessageConverter;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.validation.beanvalidation.LocalValidatorFactoryBean;

class CalcOptimizerControllerTest {

    private final StubOptimizeUseCase optimizeUseCase = new StubOptimizeUseCase();
    private MockMvc mockMvc;

    @BeforeEach
    void setUp() {
        LocalValidatorFactoryBean validator = new LocalValidatorFactoryBean();
        validator.afterPropertiesSet();

        mockMvc = MockMvcBuilders.standaloneSetup(
                        new CalcOptimizerController(optimizeUseCase, new CalcOptimizerWebMapper()))
                .setControllerAdvice(new ApiExceptionHandler())
                .setValidator(validator)
                .setMessageConverters(new MappingJackson2HttpMessageConverter(new ObjectMapper()))
                .build();
    }

    @Test
    void returnsOptimizedCandidatesForValidRequest() throws Exception {
        optimizeUseCase.nextResult = new OptimizeDefenseResult(
                List.of(new DefenseSpreadCandidate(4, 0, 0, 4, 28, 82.5, 95.0, 0.0, "guaranteed survival")));

        mockMvc.perform(post("/api/v1/calc/optimize-defense")
                        .contentType(APPLICATION_JSON)
                        .content(validRequest()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.candidates[0].spHp").value(4))
                .andExpect(jsonPath("$.candidates[0].totalSp").value(4))
                .andExpect(jsonPath("$.candidates[0].remainingSp").value(28))
                .andExpect(jsonPath("$.candidates[0].koChanceDescription").value("guaranteed survival"));
    }

    @Test
    void returnsEmptyCandidatesWhenNoneFound() throws Exception {
        optimizeUseCase.nextResult = new OptimizeDefenseResult(List.of());

        mockMvc.perform(post("/api/v1/calc/optimize-defense")
                        .contentType(APPLICATION_JSON)
                        .content(validRequest()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.candidates").isEmpty());
    }

    @Test
    void returns400ForMissingRegulation() throws Exception {
        mockMvc.perform(post("/api/v1/calc/optimize-defense")
                        .contentType(APPLICATION_JSON)
                        .content("""
                                {
                                  "regulation": "",
                                  "defenderSpeciesId": "snorlax",
                                  "defenderNatureId": "HARDY",
                                  "attackerSpeciesId": "garchomp",
                                  "attackerNatureId": "JOLLY",
                                  "moveId": "earthquake",
                                  "goal": "ALWAYS_SURVIVE"
                                }
                                """))
                .andExpect(status().isBadRequest());
    }

    private static String validRequest() {
        return """
                {
                  "regulation": "M-A",
                  "defenderSpeciesId": "snorlax",
                  "defenderNatureId": "HARDY",
                  "attackerSpeciesId": "garchomp",
                  "attackerNatureId": "JOLLY",
                  "attackerSp": {"hp":0,"attack":32,"defense":0,"specialAttack":0,"specialDefense":0,"speed":32},
                  "attackerAbilityId": "rough-skin",
                  "attackerItemId": null,
                  "moveId": "earthquake",
                  "goal": "ALWAYS_SURVIVE",
                  "field": {"weather":"CLEAR","terrain":"NONE","room":"NONE"},
                  "attackerSide": {"reflect":false,"lightScreen":false,"auroraVeil":false,"friendGuard":false,"helpingHand":false,"tailwind":false,"protect":false},
                  "defenderSide": {"reflect":false,"lightScreen":false,"auroraVeil":false,"friendGuard":false,"helpingHand":false,"tailwind":false,"protect":false},
                  "criticalHit": false
                }
                """;
    }

    private static final class StubOptimizeUseCase implements OptimizeDefensiveSpreadUseCase {
        OptimizeDefenseResult nextResult = new OptimizeDefenseResult(List.of());

        @Override
        public OptimizeDefenseResult optimize(OptimizeDefenseCommand command) {
            return nextResult;
        }
    }
}
