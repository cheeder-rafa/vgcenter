package com.vgcenter.damagecalc.web.controller;

import static org.hamcrest.Matchers.containsString;
import static org.springframework.http.MediaType.APPLICATION_JSON;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.web.servlet.MockMvc;

@SpringBootTest
@AutoConfigureMockMvc
class DamageApiEndToEndTest {

    @Autowired
    private MockMvc mockMvc;

    @Test
    void calculatesDamageAndLoadsDatasetThroughRealSpringContext() throws Exception {
        mockMvc.perform(post("/api/v1/damage/calculate")
                        .contentType(APPLICATION_JSON)
                        .content("""
                                {
                                  "regulation": "M-A",
                                  "attacker": {
                                    "level": 50,
                                    "stats": { "hp": 140, "attack": 76, "defense": 70, "specialAttack": 158, "specialDefense": 95, "speed": 123 },
                                    "types": ["FIRE"],
                                    "abilityId": "none",
                                    "itemId": "none",
                                    "status": "NONE",
                                    "grounded": true,
                                    "fullHp": true
                                  },
                                  "defender": {
                                    "level": 50,
                                    "stats": { "hp": 160, "attack": 68, "defense": 111, "specialAttack": 76, "specialDefense": 99, "speed": 71 },
                                    "types": ["GRASS", "STEEL"],
                                    "abilityId": "none",
                                    "itemId": "none",
                                    "status": "NONE",
                                    "grounded": true,
                                    "fullHp": true
                                  },
                                  "move": {
                                    "type": "FIRE",
                                    "category": "SPECIAL",
                                    "basePower": 90,
                                    "spread": false,
                                    "contact": false,
                                    "doublePowerWhenUserStatused": false,
                                    "ignoreBurnPenaltyWhenUserStatused": false
                                  },
                                  "field": { "weather": "CLEAR", "terrain": "NONE", "room": "NONE" },
                                  "attackerSide": { "reflect": false, "lightScreen": false, "auroraVeil": false, "friendGuard": false, "helpingHand": false },
                                  "defenderSide": { "reflect": false, "lightScreen": false, "auroraVeil": false, "friendGuard": false, "helpingHand": false },
                                  "criticalHit": false,
                                  "targets": 1
                                }
                                """))
                .andExpect(status().isOk())
                .andExpect(content().contentType(APPLICATION_JSON))
                .andExpect(jsonPath("$.rolls[0]").value(328))
                .andExpect(jsonPath("$.rolls[15]").value(388))
                .andExpect(jsonPath("$.minPct").value(205.0d))
                .andExpect(jsonPath("$.koChance.description").value("Guaranteed OHKO"));

        mockMvc.perform(get("/api/v1/dataset/pokedex").queryParam("regulation", "M-A"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].id").value("venusaur"))
                .andExpect(content().string(containsString("\"charizard-mega-x\"")));
    }

    @Test
    void importsShowdownTextThroughTheRealSpringContext() throws Exception {
        mockMvc.perform(post("/api/v1/import/showdown")
                        .contentType(APPLICATION_JSON)
                        .content("""
                                {
                                  "text": "Solaris (Charizard) (M) @ Charizardite Y\\nAbility: Blaze\\nLevel: 50\\nEVs: 4 HP / 252 SpA / 252 Spe\\nTimid Nature\\n- Heat Wave\\n- Air Slash\\n- Protect\\n- Solar Beam"
                                }
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.team[0].speciesId").value("charizard"))
                .andExpect(jsonPath("$.team[0].itemId").value("charizardite-y"))
                .andExpect(jsonPath("$.team[0].sp.speed").value(32))
                .andExpect(jsonPath("$.team[0].moveIds[3]").value("solar-beam"));
    }
}
