package com.vgcenter.damagecalc.web.controller;

import static org.springframework.http.MediaType.APPLICATION_JSON;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.vgcenter.damagecalc.application.usecase.BuildThreatMatrixCommand;
import com.vgcenter.damagecalc.application.usecase.BuildThreatMatrixResult;
import com.vgcenter.damagecalc.application.usecase.BuildThreatMatrixUseCase;
import com.vgcenter.damagecalc.application.usecase.KoChanceResult;
import com.vgcenter.damagecalc.application.usecase.MatrixCellResult;
import com.vgcenter.damagecalc.web.error.ApiExceptionHandler;
import com.vgcenter.damagecalc.web.mapper.MatchupWebMapper;
import java.util.List;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.converter.json.MappingJackson2HttpMessageConverter;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.validation.beanvalidation.LocalValidatorFactoryBean;

class MatchupControllerTest {

    private final StubBuildThreatMatrixUseCase useCase = new StubBuildThreatMatrixUseCase();

    private MockMvc mockMvc;

    @BeforeEach
    void setUp() {
        LocalValidatorFactoryBean validator = new LocalValidatorFactoryBean();
        validator.afterPropertiesSet();

        ObjectMapper objectMapper = new ObjectMapper();
        MatchupController controller = new MatchupController(useCase, new MatchupWebMapper());
        mockMvc = MockMvcBuilders.standaloneSetup(controller)
                .setControllerAdvice(new ApiExceptionHandler())
                .setValidator(validator)
                .setMessageConverters(new MappingJackson2HttpMessageConverter(objectMapper))
                .build();
    }

    @Test
    void returnsOneByOneMatrixForSinglePokemonTeams() throws Exception {
        KoChanceResult ko = new KoChanceResult("guaranteed OHKO", 1.0d, 1);
        MatrixCellResult cell = new MatrixCellResult("earthquake", 85.0, 100.0, new int[16], ko);
        useCase.nextResult = new BuildThreatMatrixResult(List.of(List.of(cell)), List.of(List.of(cell)));

        mockMvc.perform(post("/api/v1/matchup/matrix")
                        .contentType(APPLICATION_JSON)
                        .content(singleVsSingleRequest()))
                .andExpect(status().isOk())
                .andExpect(content().contentType(APPLICATION_JSON))
                .andExpect(jsonPath("$.deal[0][0].bestMoveId").value("earthquake"))
                .andExpect(jsonPath("$.deal[0][0].minPct").value(85.0))
                .andExpect(jsonPath("$.deal[0][0].maxPct").value(100.0))
                .andExpect(jsonPath("$.deal[0][0].koChance.probability").value(1.0))
                .andExpect(jsonPath("$.take[0][0].bestMoveId").value("earthquake"));
    }

    @Test
    void returnsBadRequestWhenTeamIsEmpty() throws Exception {
        mockMvc.perform(post("/api/v1/matchup/matrix")
                        .contentType(APPLICATION_JSON)
                        .content("""
                                {
                                  "regulation": "M-A",
                                  "teamA": [],
                                  "teamB": [],
                                  "field": { "weather": "CLEAR", "terrain": "NONE", "room": "NONE" },
                                  "sideA": { "reflect": false, "lightScreen": false, "auroraVeil": false,
                                             "friendGuard": false, "helpingHand": false, "tailwind": false, "protect": false },
                                  "sideB": { "reflect": false, "lightScreen": false, "auroraVeil": false,
                                             "friendGuard": false, "helpingHand": false, "tailwind": false, "protect": false }
                                }
                                """))
                .andExpect(status().isBadRequest());
    }

    private static String singleVsSingleRequest() {
        return """
                {
                  "regulation": "M-A",
                  "teamA": [%s],
                  "teamB": [%s],
                  "field": { "weather": "CLEAR", "terrain": "NONE", "room": "NONE" },
                  "sideA": { "reflect": false, "lightScreen": false, "auroraVeil": false,
                             "friendGuard": false, "helpingHand": false, "tailwind": false, "protect": false },
                  "sideB": { "reflect": false, "lightScreen": false, "auroraVeil": false,
                             "friendGuard": false, "helpingHand": false, "tailwind": false, "protect": false }
                }
                """.formatted(pokemonJson(), pokemonJson());
    }

    private static String pokemonJson() {
        return """
                {
                  "combatant": {
                    "level": 50,
                    "stats": { "hp": 183, "attack": 161, "defense": 115, "specialAttack": 100,
                               "specialDefense": 106, "speed": 159 },
                    "types": ["DRAGON", "GROUND"],
                    "abilityId": "rough-skin",
                    "itemId": "choice-scarf",
                    "status": "NONE",
                    "stages": {},
                    "grounded": true,
                    "currentHp": 183
                  },
                  "moves": [
                    {
                      "moveId": "earthquake",
                      "move": { "type": "GROUND", "category": "PHYSICAL", "basePower": 100,
                                "spread": true, "contact": false,
                                "doublePowerWhenUserStatused": false,
                                "ignoreBurnPenaltyWhenUserStatused": false }
                    }
                  ]
                }
                """;
    }

    private static final class StubBuildThreatMatrixUseCase implements BuildThreatMatrixUseCase {
        BuildThreatMatrixResult nextResult;

        @Override
        public BuildThreatMatrixResult build(BuildThreatMatrixCommand command) {
            return nextResult;
        }
    }
}
