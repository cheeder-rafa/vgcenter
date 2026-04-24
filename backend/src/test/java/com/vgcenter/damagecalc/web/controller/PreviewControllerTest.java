package com.vgcenter.damagecalc.web.controller;

import static org.springframework.http.MediaType.APPLICATION_JSON;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.vgcenter.damagecalc.application.usecase.EvaluateLeadsCommand;
import com.vgcenter.damagecalc.application.usecase.EvaluateLeadsResult;
import com.vgcenter.damagecalc.application.usecase.EvaluateLeadsUseCase;
import com.vgcenter.damagecalc.application.usecase.LeadMatchupResult;
import com.vgcenter.damagecalc.application.usecase.PreviewMetricResult;
import com.vgcenter.damagecalc.web.error.ApiExceptionHandler;
import com.vgcenter.damagecalc.web.mapper.PreviewWebMapper;
import java.util.List;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.converter.json.MappingJackson2HttpMessageConverter;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.validation.beanvalidation.LocalValidatorFactoryBean;

class PreviewControllerTest {

    private final StubEvaluateLeadsUseCase evaluateLeadsUseCase = new StubEvaluateLeadsUseCase();

    private MockMvc mockMvc;

    @BeforeEach
    void setUp() {
        LocalValidatorFactoryBean validator = new LocalValidatorFactoryBean();
        validator.afterPropertiesSet();

        ObjectMapper objectMapper = new ObjectMapper();
        PreviewController controller = new PreviewController(evaluateLeadsUseCase, new PreviewWebMapper());
        mockMvc = MockMvcBuilders.standaloneSetup(controller)
                .setControllerAdvice(new ApiExceptionHandler())
                .setValidator(validator)
                .setMessageConverters(new MappingJackson2HttpMessageConverter(objectMapper))
                .build();
    }

    @Test
    void evaluatesLeadsForAValidRequest() throws Exception {
        evaluateLeadsUseCase.nextResult = new EvaluateLeadsResult(List.of(new LeadMatchupResult(
                List.of("opponent-1", "opponent-2"),
                List.of("Opponent 1", "Opponent 2"),
                new PreviewMetricResult("KO pressure", 1, "medium"),
                new PreviewMetricResult("2HKO pressure", 2, "high"),
                new PreviewMetricResult("Double-up pressure", 1, "medium"),
                new PreviewMetricResult("Incoming danger", 0, "low"),
                new PreviewMetricResult("Speed control", 2, "high"),
                List.of("Press KO threat"),
                List.of("Flutter Mane threatens Opponent 1"))));

        mockMvc.perform(post("/api/v1/preview/leads/evaluate")
                        .contentType(APPLICATION_JSON)
                        .content(validRequestBody()))
                .andExpect(status().isOk())
                .andExpect(content().contentType(APPLICATION_JSON))
                .andExpect(jsonPath("$.matchups[0].opponentLeadIds[0]").value("opponent-1"))
                .andExpect(jsonPath("$.matchups[0].koPressure.label").value("KO pressure"))
                .andExpect(jsonPath("$.matchups[0].mustReactLabels[0]").value("Press KO threat"));
    }

    @Test
    void returnsProblemDetailsWhenOpponentTeamIsNotSixPokemon() throws Exception {
        mockMvc.perform(post("/api/v1/preview/leads/evaluate")
                        .contentType(APPLICATION_JSON)
                        .content("""
                                {
                                  "regulation": "M-A",
                                  "selectedLeads": [
                                    %s,
                                    %s
                                  ],
                                  "opponentTeam": [],
                                  "field": {
                                    "field": { "weather": "CLEAR", "terrain": "NONE", "room": "NONE" },
                                    "selectedSide": { "reflect": false, "lightScreen": false, "auroraVeil": false, "friendGuard": false, "helpingHand": false, "tailwind": false, "protect": false },
                                    "opponentSide": { "reflect": false, "lightScreen": false, "auroraVeil": false, "friendGuard": false, "helpingHand": false, "tailwind": false, "protect": false },
                                    "criticalHit": false,
                                    "targets": 1
                                  }
                                }
                                """.formatted(
                                        pokemon("flutter-mane", "Flutter Mane"), pokemon("incineroar", "Incineroar"))))
                .andExpect(status().isBadRequest())
                .andExpect(content().contentTypeCompatibleWith("application/problem+json"));
    }

    private static String validRequestBody() {
        return """
                {
                  "regulation": "M-A",
                  "selectedLeads": [
                    %s,
                    %s
                  ],
                  "opponentTeam": [
                    %s,
                    %s,
                    %s,
                    %s,
                    %s,
                    %s
                  ],
                  "field": {
                    "field": { "weather": "CLEAR", "terrain": "NONE", "room": "NONE" },
                    "selectedSide": { "reflect": false, "lightScreen": false, "auroraVeil": false, "friendGuard": false, "helpingHand": false, "tailwind": false, "protect": false },
                    "opponentSide": { "reflect": false, "lightScreen": false, "auroraVeil": false, "friendGuard": false, "helpingHand": false, "tailwind": false, "protect": false },
                    "criticalHit": false,
                    "targets": 1
                  }
                }
                """.formatted(
                        pokemon("flutter-mane", "Flutter Mane"),
                        pokemon("incineroar", "Incineroar"),
                        pokemon("opponent-1", "Opponent 1"),
                        pokemon("opponent-2", "Opponent 2"),
                        pokemon("opponent-3", "Opponent 3"),
                        pokemon("opponent-4", "Opponent 4"),
                        pokemon("opponent-5", "Opponent 5"),
                        pokemon("opponent-6", "Opponent 6"));
    }

    private static String pokemon(String id, String name) {
        return """
                {
                  "pokemonId": "%s",
                  "displayName": "%s",
                  "combatant": {
                    "level": 50,
                    "stats": { "hp": 100, "attack": 100, "defense": 100, "specialAttack": 100, "specialDefense": 100, "speed": 100 },
                    "types": ["FAIRY"],
                    "abilityId": "none",
                    "itemId": "none",
                    "status": "NONE",
                    "stages": { "atk": 0, "def": 0, "spa": 0, "spd": 0, "spe": 0 },
                    "grounded": true,
                    "currentHp": 100
                  },
                  "moves": [
                    {
                      "type": "FAIRY",
                      "category": "SPECIAL",
                      "basePower": 95,
                      "spread": false,
                      "contact": false,
                      "doublePowerWhenUserStatused": false,
                      "ignoreBurnPenaltyWhenUserStatused": false
                    }
                  ]
                }
                """.formatted(id, name);
    }

    private static final class StubEvaluateLeadsUseCase implements EvaluateLeadsUseCase {

        private EvaluateLeadsResult nextResult;

        @Override
        public EvaluateLeadsResult evaluate(EvaluateLeadsCommand command) {
            return nextResult;
        }
    }
}
