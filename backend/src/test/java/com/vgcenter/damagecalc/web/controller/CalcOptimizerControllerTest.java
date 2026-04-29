package com.vgcenter.damagecalc.web.controller;

import static org.springframework.http.MediaType.APPLICATION_JSON;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.vgcenter.damagecalc.application.usecase.DefenseSpreadCandidate;
import com.vgcenter.damagecalc.application.usecase.OptimizeAgainstThreatResult;
import com.vgcenter.damagecalc.application.usecase.OptimizeAgainstThreatsCommand;
import com.vgcenter.damagecalc.application.usecase.OptimizeAgainstThreatsResult;
import com.vgcenter.damagecalc.application.usecase.OptimizeAgainstThreatsUseCase;
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
    private final StubOptimizeAgainstThreatsUseCase optimizeAgainstThreatsUseCase =
            new StubOptimizeAgainstThreatsUseCase();
    private MockMvc mockMvc;

    @BeforeEach
    void setUp() {
        LocalValidatorFactoryBean validator = new LocalValidatorFactoryBean();
        validator.afterPropertiesSet();

        mockMvc = MockMvcBuilders.standaloneSetup(new CalcOptimizerController(
                        optimizeUseCase, optimizeAgainstThreatsUseCase, new CalcOptimizerWebMapper()))
                .setControllerAdvice(new ApiExceptionHandler())
                .setValidator(validator)
                .setMessageConverters(new MappingJackson2HttpMessageConverter(new ObjectMapper()))
                .build();
    }

    @Test
    void returnsOptimizedCandidatesForValidRequest() throws Exception {
        optimizeUseCase.nextResult = new OptimizeDefenseResult(
                List.of(new DefenseSpreadCandidate(4, 0, 0, 4, 28, 82.5, 95.0, 0.0, "guaranteed survival", null)));

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

    @Test
    void returnsMultiThreatBestCandidateAndThreatBreakdown() throws Exception {
        DefenseSpreadCandidate best =
                new DefenseSpreadCandidate(20, 18, 14, 52, 14, 42.0, 88.0, 0.0, "optimized", null);
        optimizeAgainstThreatsUseCase.nextResult = new OptimizeAgainstThreatsResult(
                best,
                List.of(best),
                List.of(
                        new OptimizeAgainstThreatResult("garchomp", "earthquake", 42.0, 62.0, 52.5, 0.0, "survival"),
                        new OptimizeAgainstThreatResult("gengar", "shadow-ball", 54.0, 88.0, 72.5, 0.0, "survival")));

        mockMvc.perform(post("/api/v1/calc/optimize-against-threats")
                        .contentType(APPLICATION_JSON)
                        .content(validMultiThreatRequest()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.best.spHp").value(20))
                .andExpect(jsonPath("$.candidates[0].spHp").value(20))
                .andExpect(jsonPath("$.best.totalSp").value(52))
                .andExpect(jsonPath("$.threats[0].attackerSpeciesId").value("garchomp"))
                .andExpect(jsonPath("$.threats[1].moveId").value("shadow-ball"))
                .andExpect(jsonPath("$.threats[1].expectedDamagePct").value(72.5));
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

    private static String validMultiThreatRequest() {
        return """
                {
                  "regulation": "M-A",
                  "defender": {
                    "speciesId": "snorlax",
                    "natureId": "HARDY",
                    "abilityId": "thick-fat",
                    "itemId": null,
                    "megaActive": false,
                    "megaFormId": null
                  },
                  "threats": [
                    {
                      "attackerSpeciesId": "garchomp",
                      "attackerNatureId": "JOLLY",
                      "attackerSp": {"hp":0,"attack":32,"defense":0,"specialAttack":0,"specialDefense":0,"speed":32},
                      "attackerAbilityId": "rough-skin",
                      "attackerItemId": null,
                      "moveId": "earthquake",
                      "attackerMegaActive": false,
                      "attackerMegaFormId": null
                    },
                    {
                      "attackerSpeciesId": "gengar",
                      "attackerNatureId": "MODEST",
                      "attackerSp": {"hp":0,"attack":0,"defense":0,"specialAttack":32,"specialDefense":0,"speed":32},
                      "attackerAbilityId": "cursed-body",
                      "attackerItemId": null,
                      "moveId": "shadow-ball",
                      "attackerMegaActive": false,
                      "attackerMegaFormId": null
                    }
                  ],
                  "goal": "EXPECTED_DAMAGE_SUM",
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

    private static final class StubOptimizeAgainstThreatsUseCase implements OptimizeAgainstThreatsUseCase {
        OptimizeAgainstThreatsResult nextResult = new OptimizeAgainstThreatsResult(null, List.of(), List.of());

        @Override
        public OptimizeAgainstThreatsResult optimize(OptimizeAgainstThreatsCommand command) {
            return nextResult;
        }
    }
}
