package com.vgcenter.damagecalc.web.controller;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.http.MediaType.APPLICATION_JSON;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.vgcenter.damagecalc.application.usecase.EvaluateReplayDecisionsCommand;
import com.vgcenter.damagecalc.application.usecase.EvaluateReplayDecisionsResult;
import com.vgcenter.damagecalc.application.usecase.EvaluateReplayDecisionsUseCase;
import com.vgcenter.damagecalc.application.usecase.ReplayDecisionLine;
import com.vgcenter.damagecalc.application.usecase.ReplayGameReview;
import com.vgcenter.damagecalc.application.usecase.ReplayMoveChoice;
import com.vgcenter.damagecalc.application.usecase.TurnReview;
import com.vgcenter.damagecalc.web.error.ApiExceptionHandler;
import com.vgcenter.damagecalc.web.mapper.ReplayWebMapper;
import java.util.List;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.converter.json.MappingJackson2HttpMessageConverter;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

class ReplayEvaluationControllerTest {

    private final StubEvaluateReplayDecisionsUseCase evaluateReplayDecisionsUseCase =
            new StubEvaluateReplayDecisionsUseCase();

    private MockMvc mockMvc;

    @BeforeEach
    void setUp() {
        ReplayController controller = new ReplayController(null, evaluateReplayDecisionsUseCase, new ReplayWebMapper());
        mockMvc = MockMvcBuilders.standaloneSetup(controller)
                .setControllerAdvice(new ApiExceptionHandler())
                .setMessageConverters(new MappingJackson2HttpMessageConverter(new ObjectMapper()))
                .build();
    }

    @Test
    void evaluatesSingleReplayTimeline() throws Exception {
        evaluateReplayDecisionsUseCase.nextResult = response();

        mockMvc.perform(post("/api/v1/replay/evaluate")
                        .contentType(APPLICATION_JSON)
                        .content("""
                                {
                                  "regulation": "M-A",
                                  "timeline": {
                                    "sideAName": "Alice",
                                    "sideBName": "Bob",
                                    "winner": "Alice",
                                    "tie": false,
                                    "turns": [
                                      {
                                        "number": 1,
                                        "boardStateAtStart": {
                                          "weather": "none",
                                          "terrain": "none",
                                          "sideA": {
                                            "playerName": "Alice",
                                            "tailwind": false,
                                            "reflect": false,
                                            "lightScreen": false,
                                            "auroraVeil": false,
                                            "activePokemon": []
                                          },
                                          "sideB": {
                                            "playerName": "Bob",
                                            "tailwind": false,
                                            "reflect": false,
                                            "lightScreen": false,
                                            "auroraVeil": false,
                                            "activePokemon": []
                                          }
                                        },
                                        "events": []
                                      }
                                    ]
                                  },
                                  "objective": {
                                    "damageDealtWeight": 1.0,
                                    "damageTakenWeight": 1.0,
                                    "koBonus": 30.0,
                                    "faintPenalty": 20.0
                                  }
                                }
                                """))
                .andExpect(status().isOk())
                .andExpect(content().contentType(APPLICATION_JSON))
                .andExpect(jsonPath("$.games[0].gameNumber").value(1))
                .andExpect(jsonPath("$.games[0].turnReviews[0].verdict").value("optimal"))
                .andExpect(jsonPath("$.games[0].turnReviews[0].played.choices[0].moveName")
                        .value("Giga Drain"))
                .andExpect(jsonPath("$.adaptationFlags[0]").value("opponent re-led Aerodactyl + Floette-Eternal"));

        assertThat(evaluateReplayDecisionsUseCase.lastCommand.regulation()).isEqualTo("M-A");
        assertThat(evaluateReplayDecisionsUseCase.lastCommand.timelines()).hasSize(1);
        assertThat(evaluateReplayDecisionsUseCase.lastCommand.objective().koBonus())
                .isEqualTo(30.0d);
    }

    @Test
    void rejectsEvaluateRequestWithoutTimelineInput() throws Exception {
        mockMvc.perform(post("/api/v1/replay/evaluate")
                        .contentType(APPLICATION_JSON)
                        .content("""
                                {
                                  "regulation": "M-A"
                                }
                                """))
                .andExpect(status().isBadRequest())
                .andExpect(content().contentTypeCompatibleWith("application/problem+json"));
    }

    private static EvaluateReplayDecisionsResult response() {
        return new EvaluateReplayDecisionsResult(
                List.of(new ReplayGameReview(
                        1,
                        "Alice",
                        List.of(new TurnReview(
                                1,
                                new ReplayDecisionLine(
                                        List.of(new ReplayMoveChoice(
                                                "p1a", "Venusaur", "Giga Drain", "p2a", "Dragonite", "ATTACK")),
                                        12.0d,
                                        20.0d,
                                        8.0d,
                                        1,
                                        0),
                                List.of(),
                                0.0d,
                                "optimal",
                                "Played line already matches the best decision score.",
                                null)))),
                List.of("opponent re-led Aerodactyl + Floette-Eternal"));
    }

    private static final class StubEvaluateReplayDecisionsUseCase implements EvaluateReplayDecisionsUseCase {

        private EvaluateReplayDecisionsResult nextResult;
        private EvaluateReplayDecisionsCommand lastCommand;

        @Override
        public EvaluateReplayDecisionsResult evaluate(EvaluateReplayDecisionsCommand command) {
            lastCommand = command;
            if (command.timelines().isEmpty()) {
                throw new IllegalArgumentException("Replay evaluate request must provide timeline or timelines");
            }
            return nextResult;
        }
    }
}
