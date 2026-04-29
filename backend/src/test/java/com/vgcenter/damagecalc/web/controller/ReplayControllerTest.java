package com.vgcenter.damagecalc.web.controller;

import static org.springframework.http.MediaType.APPLICATION_JSON;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.vgcenter.damagecalc.application.usecase.EvaluateReplayDecisionsCommand;
import com.vgcenter.damagecalc.application.usecase.EvaluateReplayDecisionsResult;
import com.vgcenter.damagecalc.application.usecase.EvaluateReplayDecisionsUseCase;
import com.vgcenter.damagecalc.application.usecase.ParseReplayCommand;
import com.vgcenter.damagecalc.application.usecase.ParseReplayUseCase;
import com.vgcenter.damagecalc.domain.replay.ReplayTimeline;
import com.vgcenter.damagecalc.domain.replay.ReplayTurn;
import com.vgcenter.damagecalc.web.error.ApiExceptionHandler;
import com.vgcenter.damagecalc.web.mapper.ReplayWebMapper;
import java.util.List;
import java.util.Map;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.converter.json.MappingJackson2HttpMessageConverter;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

class ReplayControllerTest {

    private final StubParseReplayUseCase parseReplayUseCase = new StubParseReplayUseCase();
    private final StubEvaluateReplayDecisionsUseCase evaluateReplayDecisionsUseCase =
            new StubEvaluateReplayDecisionsUseCase();

    private MockMvc mockMvc;

    @BeforeEach
    void setUp() {
        ReplayController controller =
                new ReplayController(parseReplayUseCase, evaluateReplayDecisionsUseCase, new ReplayWebMapper());
        mockMvc = MockMvcBuilders.standaloneSetup(controller)
                .setControllerAdvice(new ApiExceptionHandler())
                .setMessageConverters(new MappingJackson2HttpMessageConverter(new ObjectMapper()))
                .build();
    }

    @Test
    void parsesReplayFromUrl() throws Exception {
        parseReplayUseCase.nextResult = timeline();

        mockMvc.perform(post("/api/v1/replay/parse")
                        .contentType(APPLICATION_JSON)
                        .content("""
                                {
                                  "url": "https://replay.pokemonshowdown.com/example"
                                }
                                """))
                .andExpect(status().isOk())
                .andExpect(content().contentType(APPLICATION_JSON))
                .andExpect(jsonPath("$.sideAName").value("Alice"))
                .andExpect(jsonPath("$.turns[0].number").value(1))
                .andExpect(jsonPath("$.turns[0].boardStateAtStart.sideA.activePokemon[0].speciesName")
                        .value("Venusaur"))
                .andExpect(jsonPath("$.turns[0].events[0].type").value("move"));
    }

    @Test
    void surfacesBadReplayRequests() throws Exception {
        mockMvc.perform(post("/api/v1/replay/parse")
                        .contentType(APPLICATION_JSON)
                        .content("""
                                {
                                  "url": " ",
                                  "log": " "
                                }
                                """))
                .andExpect(status().isBadRequest())
                .andExpect(content().contentTypeCompatibleWith("application/problem+json"));
    }

    private static ReplayTimeline timeline() {
        return new ReplayTimeline(
                "Alice",
                "Bob",
                "Alice",
                false,
                List.of(new ReplayTurn(
                        1,
                        com.vgcenter.damagecalc.application.usecase.ReplayTimelineFixtures.boardState(),
                        List.of(new com.vgcenter.damagecalc.domain.replay.ReplayEvent(
                                "move", List.of("p1a: Venusaur", "Giga Drain", "p2a: Dragonite"), "|move|...")))),
                Map.of());
    }

    private static final class StubParseReplayUseCase implements ParseReplayUseCase {

        private ReplayTimeline nextResult;

        @Override
        public ReplayTimeline parse(ParseReplayCommand command) {
            if ((command.url() == null || command.url().isBlank())
                    && (command.log() == null || command.log().isBlank())) {
                throw new IllegalArgumentException("Replay parse request must provide either url or log");
            }
            return nextResult;
        }
    }

    private static final class StubEvaluateReplayDecisionsUseCase implements EvaluateReplayDecisionsUseCase {

        @Override
        public EvaluateReplayDecisionsResult evaluate(EvaluateReplayDecisionsCommand command) {
            throw new UnsupportedOperationException("not used in parse tests");
        }
    }
}
