package com.vgcenter.damagecalc.web.controller;

import static org.springframework.http.MediaType.APPLICATION_JSON;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.vgcenter.damagecalc.application.usecase.CalculateDamageResult;
import com.vgcenter.damagecalc.application.usecase.DamageOptionResult;
import com.vgcenter.damagecalc.application.usecase.EvaluateMatchupCommand;
import com.vgcenter.damagecalc.application.usecase.EvaluateMatchupResult;
import com.vgcenter.damagecalc.application.usecase.EvaluateMatchupUseCase;
import com.vgcenter.damagecalc.application.usecase.KoChanceResult;
import com.vgcenter.damagecalc.application.usecase.MatchupCellResult;
import com.vgcenter.damagecalc.application.usecase.RecommendLineupCommand;
import com.vgcenter.damagecalc.application.usecase.RecommendLineupResult;
import com.vgcenter.damagecalc.application.usecase.RecommendLineupUseCase;
import com.vgcenter.damagecalc.application.usecase.RecommendationResult;
import com.vgcenter.damagecalc.domain.gameplan.MatchupScore;
import com.vgcenter.damagecalc.domain.gameplan.TurnOneFlags;
import com.vgcenter.damagecalc.web.error.ApiExceptionHandler;
import com.vgcenter.damagecalc.web.mapper.GameplanWebMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.validation.beanvalidation.LocalValidatorFactoryBean;

class GameplanControllerTest {

    private final StubEvaluateMatchupUseCase evaluateMatchupUseCase = new StubEvaluateMatchupUseCase();
    private final StubRecommendLineupUseCase recommendLineupUseCase = new StubRecommendLineupUseCase();

    private MockMvc mockMvc;

    @BeforeEach
    void setUp() {
        LocalValidatorFactoryBean validator = new LocalValidatorFactoryBean();
        validator.afterPropertiesSet();

        GameplanController controller =
                new GameplanController(evaluateMatchupUseCase, recommendLineupUseCase, new GameplanWebMapper());
        mockMvc = MockMvcBuilders.standaloneSetup(controller)
                .setControllerAdvice(new ApiExceptionHandler())
                .setValidator(validator)
                .build();
    }

    @Test
    void evaluatesMatchupsThroughTheGameplanEndpoint() throws Exception {
        MatchupCellResult cell = new MatchupCellResult(
                0,
                1,
                java.util.List.of("blastoise", "venusaur"),
                new MatchupScore(24, 32, -16, 4, 4),
                new TurnOneFlags(true, false, false, true, TurnOneFlags.SpeedControl.TAILWIND),
                new TurnOneFlags(true, false, true, true, TurnOneFlags.SpeedControl.NONE),
                java.util.List.of(new DamageOptionResult(
                        0,
                        0,
                        "heat-wave",
                        new CalculateDamageResult(
                                new int[] {44, 45, 46, 47, 48, 49, 50, 51, 52, 53, 54, 55, 56, 57, 58, 59},
                                44,
                                59,
                                28.5d,
                                38.3d,
                                new KoChanceResult("guaranteed 3HKO", 1.0d, 3)))),
                java.util.List.of());
        evaluateMatchupUseCase.nextResult = new EvaluateMatchupResult(java.util.List.of(cell));

        mockMvc.perform(post("/api/v1/gameplan/evaluate")
                        .contentType(APPLICATION_JSON)
                        .content(validRequestBody()))
                .andExpect(status().isOk())
                .andExpect(content().contentType(APPLICATION_JSON))
                .andExpect(jsonPath("$.cells[0].opponentLeadSpeciesIds[0]").value("blastoise"))
                .andExpect(jsonPath("$.cells[0].score.total").value(24))
                .andExpect(jsonPath("$.cells[0].mineFlags.protect").value(true))
                .andExpect(jsonPath("$.cells[0].outgoing[0].moveId").value("heat-wave"))
                .andExpect(jsonPath("$.cells[0].outgoing[0].damage.koChance.description")
                        .value("guaranteed 3HKO"));
    }

    @Test
    void recommendsLineupsThroughTheGameplanEndpoint() throws Exception {
        MatchupCellResult cell = new MatchupCellResult(
                0,
                1,
                java.util.List.of("blastoise", "venusaur"),
                new MatchupScore(18, 20, -8, 2, 4),
                new TurnOneFlags(false, true, false, false, TurnOneFlags.SpeedControl.NONE),
                new TurnOneFlags(true, false, true, true, TurnOneFlags.SpeedControl.TRICK_ROOM),
                java.util.List.of(),
                java.util.List.of());
        recommendLineupUseCase.nextResult = new RecommendLineupResult(
                45,
                java.util.List.of(new RecommendationResult(
                        java.util.List.of(2, 3, 4, 5),
                        java.util.List.of("tyranitar", "pikachu", "farigiraf", "pelipper"),
                        2,
                        18.0d,
                        java.util.List.of(cell))));

        mockMvc.perform(post("/api/v1/gameplan/recommend")
                        .contentType(APPLICATION_JSON)
                        .content(validRecommendRequestBody()))
                .andExpect(status().isOk())
                .andExpect(content().contentType(APPLICATION_JSON))
                .andExpect(jsonPath("$.evaluatedLineups").value(45))
                .andExpect(jsonPath("$.recommendations[0].lineupIndices[0]").value(2))
                .andExpect(jsonPath("$.recommendations[0].lineupSpeciesIds[2]").value("farigiraf"))
                .andExpect(jsonPath("$.recommendations[0].averageScore").value(18.0d))
                .andExpect(jsonPath("$.recommendations[0].cells[0].opponentFlags.speedControl")
                        .value("TRICK_ROOM"));
    }

    private static String validRequestBody() {
        return """
                {
                  "regulation": "M-A",
                  "mine": {
                    "lineup": [
                      {
                        "speciesId": "charizard",
                        "combatant": {
                          "level": 50,
                          "stats": {
                            "hp": 153,
                            "attack": 104,
                            "defense": 98,
                            "specialAttack": 161,
                            "specialDefense": 105,
                            "speed": 152
                          },
                          "types": ["FIRE", "FLYING"],
                          "abilityId": "blaze",
                          "itemId": "life-orb",
                          "status": "NONE",
                          "stages": {},
                          "grounded": true,
                          "currentHp": 153
                        },
                        "moveIds": ["heat-wave", "air-slash", "protect", "solar-beam"],
                        "assumedForms": []
                      },
                      {
                        "speciesId": "lucario",
                        "combatant": {
                          "level": 50,
                          "stats": {
                            "hp": 145,
                            "attack": 162,
                            "defense": 90,
                            "specialAttack": 135,
                            "specialDefense": 90,
                            "speed": 142
                          },
                          "types": ["FIGHTING", "STEEL"],
                          "abilityId": "adaptability",
                          "itemId": "life-orb",
                          "status": "NONE",
                          "stages": {},
                          "grounded": true,
                          "currentHp": 145
                        },
                        "moveIds": ["close-combat", "bullet-punch", "protect", "tailwind"],
                        "assumedForms": []
                      },
                      {
                        "speciesId": "gastrodon",
                        "combatant": {
                          "level": 50,
                          "stats": {
                            "hp": 186,
                            "attack": 92,
                            "defense": 113,
                            "specialAttack": 115,
                            "specialDefense": 132,
                            "speed": 59
                          },
                          "types": ["WATER", "GROUND"],
                          "abilityId": "storm-drain",
                          "itemId": "leftovers",
                          "status": "NONE",
                          "stages": {},
                          "grounded": true,
                          "currentHp": 186
                        },
                        "moveIds": ["earth-power", "ice-beam", "recover", "protect"],
                        "assumedForms": []
                      },
                      {
                        "speciesId": "amoonguss",
                        "combatant": {
                          "level": 50,
                          "stats": {
                            "hp": 188,
                            "attack": 94,
                            "defense": 108,
                            "specialAttack": 105,
                            "specialDefense": 124,
                            "speed": 50
                          },
                          "types": ["GRASS", "POISON"],
                          "abilityId": "regenerator",
                          "itemId": "sitrus-berry",
                          "status": "NONE",
                          "stages": {},
                          "grounded": true,
                          "currentHp": 188
                        },
                        "moveIds": ["rage-powder", "spore", "protect", "pollen-puff"],
                        "assumedForms": []
                      }
                    ],
                    "winConditionIndex": 1
                  },
                  "opponent": [
                    {
                      "speciesId": "blastoise",
                      "combatant": {
                        "level": 50,
                        "stats": {
                          "hp": 154,
                          "attack": 103,
                          "defense": 120,
                          "specialAttack": 137,
                          "specialDefense": 126,
                          "speed": 98
                        },
                        "types": ["WATER"],
                        "abilityId": "torrent",
                        "itemId": "mystic-water",
                        "status": "NONE",
                        "stages": {},
                        "grounded": true,
                        "currentHp": 154
                      },
                      "moveIds": ["water-pulse", "ice-beam", "aura-sphere", "protect"],
                      "assumedForms": []
                    },
                    {
                      "speciesId": "venusaur",
                      "combatant": {
                        "level": 50,
                        "stats": {
                          "hp": 155,
                          "attack": 102,
                          "defense": 103,
                          "specialAttack": 152,
                          "specialDefense": 120,
                          "speed": 132
                        },
                        "types": ["GRASS", "POISON"],
                        "abilityId": "overgrow",
                        "itemId": "black-sludge",
                        "status": "NONE",
                        "stages": {},
                        "grounded": true,
                        "currentHp": 155
                      },
                      "moveIds": ["leaf-storm", "sludge-bomb", "sleep-powder", "protect"],
                      "assumedForms": []
                    },
                    {
                      "speciesId": "tyranitar",
                      "combatant": {
                        "level": 50,
                        "stats": {
                          "hp": 175,
                          "attack": 166,
                          "defense": 130,
                          "specialAttack": 104,
                          "specialDefense": 121,
                          "speed": 81
                        },
                        "types": ["ROCK", "DARK"],
                        "abilityId": "sand-stream",
                        "itemId": "choice-band",
                        "status": "NONE",
                        "stages": {},
                        "grounded": true,
                        "currentHp": 175
                      },
                      "moveIds": ["rock-slide", "crunch", "low-kick", "protect"],
                      "assumedForms": []
                    },
                    {
                      "speciesId": "pikachu",
                      "combatant": {
                        "level": 50,
                        "stats": {
                          "hp": 110,
                          "attack": 117,
                          "defense": 60,
                          "specialAttack": 112,
                          "specialDefense": 70,
                          "speed": 156
                        },
                        "types": ["ELECTRIC"],
                        "abilityId": "lightning-rod",
                        "itemId": "light-ball",
                        "status": "NONE",
                        "stages": {},
                        "grounded": true,
                        "currentHp": 110
                      },
                      "moveIds": ["thunderbolt", "fake-out", "quick-attack", "protect"],
                      "assumedForms": []
                    },
                    {
                      "speciesId": "farigiraf",
                      "combatant": {
                        "level": 50,
                        "stats": {
                          "hp": 180,
                          "attack": 106,
                          "defense": 90,
                          "specialAttack": 142,
                          "specialDefense": 103,
                          "speed": 92
                        },
                        "types": ["NORMAL", "PSYCHIC"],
                        "abilityId": "armor-tail",
                        "itemId": "throat-spray",
                        "status": "NONE",
                        "stages": {},
                        "grounded": true,
                        "currentHp": 180
                      },
                      "moveIds": ["hyper-voice", "dazzling-gleam", "trick-room", "protect"],
                      "assumedForms": []
                    },
                    {
                      "speciesId": "pelipper",
                      "combatant": {
                        "level": 50,
                        "stats": {
                          "hp": 150,
                          "attack": 81,
                          "defense": 95,
                          "specialAttack": 115,
                          "specialDefense": 90,
                          "speed": 117
                        },
                        "types": ["WATER", "FLYING"],
                        "abilityId": "drizzle",
                        "itemId": "focus-sash",
                        "status": "NONE",
                        "stages": {},
                        "grounded": true,
                        "currentHp": 150
                      },
                      "moveIds": ["hurricane", "weather-ball", "tailwind", "protect"],
                      "assumedForms": []
                    }
                  ]
                }
                """;
    }

    private static String validRecommendRequestBody() {
        return """
                {
                  "regulation": "M-A",
                  "mine": [
                    %s,
                    %s,
                    %s,
                    %s,
                    %s,
                    %s
                  ],
                  "winConditionIndex": 4,
                  "opponent": [
                    %s,
                    %s,
                    %s,
                    %s,
                    %s,
                    %s
                  ]
                }
                """.formatted(
                        pokemonJson("charizard"),
                        pokemonJson("lucario"),
                        pokemonJson("tyranitar"),
                        pokemonJson("pikachu"),
                        pokemonJson("farigiraf"),
                        pokemonJson("pelipper"),
                        pokemonJson("blastoise"),
                        pokemonJson("venusaur"),
                        pokemonJson("tyranitar"),
                        pokemonJson("pikachu"),
                        pokemonJson("farigiraf"),
                        pokemonJson("pelipper"));
    }

    private static String pokemonJson(String speciesId) {
        return """
                {
                  "speciesId": "%s",
                  "combatant": {
                    "level": 50,
                    "stats": {
                      "hp": 150,
                      "attack": 100,
                      "defense": 100,
                      "specialAttack": 100,
                      "specialDefense": 100,
                      "speed": 100
                    },
                    "types": ["NORMAL"],
                    "abilityId": "ability",
                    "itemId": "item",
                    "status": "NONE",
                    "stages": {},
                    "grounded": true,
                    "currentHp": 150
                  },
                  "moveIds": ["move-a", "move-b", "move-c", "move-d"],
                  "assumedForms": []
                }
                """.formatted(speciesId);
    }

    private static final class StubEvaluateMatchupUseCase implements EvaluateMatchupUseCase {

        private EvaluateMatchupResult nextResult;

        @Override
        public EvaluateMatchupResult evaluate(EvaluateMatchupCommand command) {
            return nextResult;
        }
    }

    private static final class StubRecommendLineupUseCase implements RecommendLineupUseCase {

        private RecommendLineupResult nextResult;

        @Override
        public RecommendLineupResult recommend(RecommendLineupCommand command) {
            return nextResult;
        }
    }
}
