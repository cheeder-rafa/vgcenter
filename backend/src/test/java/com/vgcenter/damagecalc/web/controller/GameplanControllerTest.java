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

    private MockMvc mockMvc;

    @BeforeEach
    void setUp() {
        LocalValidatorFactoryBean validator = new LocalValidatorFactoryBean();
        validator.afterPropertiesSet();

        GameplanController controller = new GameplanController(evaluateMatchupUseCase, new GameplanWebMapper());
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

    private static final class StubEvaluateMatchupUseCase implements EvaluateMatchupUseCase {

        private EvaluateMatchupResult nextResult;

        @Override
        public EvaluateMatchupResult evaluate(EvaluateMatchupCommand command) {
            return nextResult;
        }
    }
}
