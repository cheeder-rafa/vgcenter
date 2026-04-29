package com.vgcenter.damagecalc.web.controller;

import static org.springframework.http.MediaType.APPLICATION_JSON;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.vgcenter.damagecalc.application.usecase.DamageMatrix;
import com.vgcenter.damagecalc.application.usecase.EvaluateLeadsCommand;
import com.vgcenter.damagecalc.application.usecase.EvaluateLeadsResult;
import com.vgcenter.damagecalc.application.usecase.EvaluateLeadsUseCase;
import com.vgcenter.damagecalc.application.usecase.HitEvidence;
import com.vgcenter.damagecalc.application.usecase.LeadMatchupResult;
import com.vgcenter.damagecalc.application.usecase.PlanRecommendation;
import com.vgcenter.damagecalc.application.usecase.PreviewFieldCommand;
import com.vgcenter.damagecalc.application.usecase.PreviewMetricResult;
import com.vgcenter.damagecalc.application.usecase.PreviewPokemonCommand;
import com.vgcenter.damagecalc.application.usecase.RecommendPlansCommand;
import com.vgcenter.damagecalc.application.usecase.RecommendPlansResult;
import com.vgcenter.damagecalc.application.usecase.RecommendPlansUseCase;
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
    private final StubRecommendPlansUseCase recommendPlansUseCase = new StubRecommendPlansUseCase();

    private MockMvc mockMvc;

    @BeforeEach
    void setUp() {
        LocalValidatorFactoryBean validator = new LocalValidatorFactoryBean();
        validator.afterPropertiesSet();

        ObjectMapper objectMapper = new ObjectMapper();
        PreviewController controller = new PreviewController(
                evaluateLeadsUseCase, recommendPlansUseCase, _cmd -> null, new PreviewWebMapper());
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
                List.of("Flutter Mane threatens Opponent 1"),
                List.of(),
                List.of())));

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

    @Test
    void recommendsPlansForAValidRequest() throws Exception {
        recommendPlansUseCase.nextResult = new RecommendPlansResult(List.of(new PlanRecommendation(
                List.of(0, 1, 2, 3),
                List.of(0, 1),
                "Lead Flutter Mane + Incineroar. Strong into most of the field.",
                new com.vgcenter.damagecalc.application.usecase.Verdict(
                        "Lead Flutter Mane + Incineroar", "Strong into Opponent 1 + Opponent 2.", null),
                List.of("Opponent 1 + Opponent 2"),
                List.of(),
                false,
                List.of("Palafin: left out — coverage handled by the core four."),
                "low",
                "none")));

        mockMvc.perform(post("/api/v1/preview/plans/recommend")
                        .contentType(APPLICATION_JSON)
                        .content(validRecommendRequestBody()))
                .andExpect(status().isOk())
                .andExpect(content().contentType(APPLICATION_JSON))
                .andExpect(jsonPath("$.plans[0].bringIndices[0]").value(0))
                .andExpect(jsonPath("$.plans[0].leadIndices[0]").value(0))
                .andExpect(jsonPath("$.plans[0].summary").isString())
                .andExpect(jsonPath("$.plans[0].predictionBurden").value("low"))
                .andExpect(jsonPath("$.plans[0].winConditionSupported").value(false));
    }

    @Test
    void returnsProblemDetailsForRecommendWhenMyTeamIsNotSix() throws Exception {
        mockMvc.perform(post("/api/v1/preview/plans/recommend")
                        .contentType(APPLICATION_JSON)
                        .content("""
                                {
                                  "regulation": "M-A",
                                  "myTeam": [],
                                  "opponentTeam": [%s,%s,%s,%s,%s,%s],
                                  "field": {
                                    "field": { "weather": "CLEAR", "terrain": "NONE", "room": "NONE" },
                                    "selectedSide": { "reflect": false, "lightScreen": false, "auroraVeil": false, "friendGuard": false, "helpingHand": false, "tailwind": false, "protect": false },
                                    "opponentSide": { "reflect": false, "lightScreen": false, "auroraVeil": false, "friendGuard": false, "helpingHand": false, "tailwind": false, "protect": false },
                                    "criticalHit": false,
                                    "targets": 1
                                  }
                                }
                                """.formatted(
                                        pokemon("o1", "Opponent 1"),
                                        pokemon("o2", "Opponent 2"),
                                        pokemon("o3", "Opponent 3"),
                                        pokemon("o4", "Opponent 4"),
                                        pokemon("o5", "Opponent 5"),
                                        pokemon("o6", "Opponent 6"))))
                .andExpect(status().isBadRequest())
                .andExpect(content().contentTypeCompatibleWith("application/problem+json"));
    }

    private static String validRecommendRequestBody() {
        return """
                {
                  "regulation": "M-A",
                  "myTeam": [%s,%s,%s,%s,%s,%s],
                  "opponentTeam": [%s,%s,%s,%s,%s,%s],
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
                        pokemon("urshifu", "Urshifu"),
                        pokemon("palafin", "Palafin"),
                        pokemon("amoonguss", "Amoonguss"),
                        pokemon("rillaboom", "Rillaboom"),
                        pokemon("opponent-1", "Opponent 1"),
                        pokemon("opponent-2", "Opponent 2"),
                        pokemon("opponent-3", "Opponent 3"),
                        pokemon("opponent-4", "Opponent 4"),
                        pokemon("opponent-5", "Opponent 5"),
                        pokemon("opponent-6", "Opponent 6"));
    }

    private static final class StubEvaluateLeadsUseCase implements EvaluateLeadsUseCase {

        private EvaluateLeadsResult nextResult;

        @Override
        public EvaluateLeadsResult evaluate(EvaluateLeadsCommand command) {
            return nextResult;
        }

        @Override
        public DamageMatrix buildMatrix(
                String regulation,
                List<PreviewPokemonCommand> myTeam,
                List<PreviewPokemonCommand> opponentTeam,
                PreviewFieldCommand field) {
            return new DamageMatrix(
                    new HitEvidence[myTeam.size()][opponentTeam.size()],
                    new HitEvidence[opponentTeam.size()][myTeam.size()]);
        }

        @Override
        public EvaluateLeadsResult evaluateFromMatrix(
                List<PreviewPokemonCommand> selectedLeads,
                int[] selectedLeadIndices,
                List<PreviewPokemonCommand> opponentTeam,
                DamageMatrix matrix) {
            return nextResult;
        }
    }

    private static final class StubRecommendPlansUseCase implements RecommendPlansUseCase {

        private RecommendPlansResult nextResult = new RecommendPlansResult(List.of());

        @Override
        public RecommendPlansResult recommend(RecommendPlansCommand command) {
            return nextResult;
        }
    }
}
