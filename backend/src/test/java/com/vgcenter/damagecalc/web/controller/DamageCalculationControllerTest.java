package com.vgcenter.damagecalc.web.controller;

import static org.springframework.http.MediaType.APPLICATION_JSON;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.vgcenter.damagecalc.application.usecase.CalculateDamageCommand;
import com.vgcenter.damagecalc.application.usecase.CalculateDamageResult;
import com.vgcenter.damagecalc.application.usecase.CalculateDamageUseCase;
import com.vgcenter.damagecalc.application.usecase.KoChanceResult;
import com.vgcenter.damagecalc.web.error.ApiExceptionHandler;
import com.vgcenter.damagecalc.web.mapper.DamageCalculationWebMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.converter.json.MappingJackson2HttpMessageConverter;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.validation.beanvalidation.LocalValidatorFactoryBean;

class DamageCalculationControllerTest {

    private final StubCalculateDamageUseCase calculateDamageUseCase = new StubCalculateDamageUseCase();

    private MockMvc mockMvc;

    @BeforeEach
    void setUp() {
        LocalValidatorFactoryBean validator = new LocalValidatorFactoryBean();
        validator.afterPropertiesSet();

        ObjectMapper objectMapper = new ObjectMapper();
        DamageCalculationController controller =
                new DamageCalculationController(calculateDamageUseCase, new DamageCalculationWebMapper());
        mockMvc = MockMvcBuilders.standaloneSetup(controller)
                .setControllerAdvice(new ApiExceptionHandler())
                .setValidator(validator)
                .setMessageConverters(new MappingJackson2HttpMessageConverter(objectMapper))
                .build();
    }

    @Test
    void calculatesDamageForAValidRequest() throws Exception {
        calculateDamageUseCase.nextResult = new CalculateDamageResult(
                new int[] {328, 388}, 328, 388, 205.0d, 242.5d, new KoChanceResult("guaranteed OHKO", 1.0d, 1));

        mockMvc.perform(post("/api/v1/damage/calculate")
                        .contentType(APPLICATION_JSON)
                        .content(validRequestBody()))
                .andExpect(status().isOk())
                .andExpect(content().contentType(APPLICATION_JSON))
                .andExpect(jsonPath("$.rolls[0]").value(328))
                .andExpect(jsonPath("$.max").value(388))
                .andExpect(jsonPath("$.koChance.description").value("guaranteed OHKO"))
                .andExpect(jsonPath("$.koChance.probability").value(1.0d));
    }

    @Test
    void returnsProblemDetailsWhenValidationFails() throws Exception {
        mockMvc.perform(post("/api/v1/damage/calculate")
                        .contentType(APPLICATION_JSON)
                        .content("""
                                {
                                  "regulation": "M-A",
                                  "attacker": {
                                    "level": 50,
                                    "stats": { "hp": 0, "attack": 76, "defense": 70, "specialAttack": 158, "specialDefense": 95, "speed": 123 },
                                    "types": ["FIRE"],
                                    "abilityId": "none",
                                    "itemId": "none",
                                    "status": "NONE",
                                    "grounded": true,
                                    "currentHp": 140
                                  },
                                  "defender": {
                                    "level": 50,
                                    "stats": { "hp": 160, "attack": 68, "defense": 111, "specialAttack": 76, "specialDefense": 99, "speed": 71 },
                                    "types": ["GRASS", "STEEL"],
                                    "abilityId": "none",
                                    "itemId": "none",
                                    "status": "NONE",
                                    "grounded": true,
                                    "currentHp": 160
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
                                  "attackerSide": { "reflect": false, "lightScreen": false, "auroraVeil": false, "friendGuard": false, "helpingHand": false, "tailwind": false },
                                  "defenderSide": { "reflect": false, "lightScreen": false, "auroraVeil": false, "friendGuard": false, "helpingHand": false, "tailwind": false },
                                  "criticalHit": false,
                                  "targets": 1
                                }
                                """))
                .andExpect(status().isBadRequest())
                .andExpect(content().contentTypeCompatibleWith("application/problem+json"));
    }

    private static String validRequestBody() {
        return """
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
                    "currentHp": 140
                  },
                  "defender": {
                    "level": 50,
                    "stats": { "hp": 160, "attack": 68, "defense": 111, "specialAttack": 76, "specialDefense": 99, "speed": 71 },
                    "types": ["GRASS", "STEEL"],
                    "abilityId": "none",
                    "itemId": "none",
                    "status": "NONE",
                    "grounded": true,
                    "currentHp": 160
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
                  "attackerSide": { "reflect": false, "lightScreen": false, "auroraVeil": false, "friendGuard": false, "helpingHand": false, "tailwind": false },
                  "defenderSide": { "reflect": false, "lightScreen": false, "auroraVeil": false, "friendGuard": false, "helpingHand": false, "tailwind": false },
                  "criticalHit": false,
                  "targets": 1
                }
                """;
    }

    private static final class StubCalculateDamageUseCase implements CalculateDamageUseCase {

        private CalculateDamageResult nextResult;

        @Override
        public CalculateDamageResult calculate(CalculateDamageCommand command) {
            return nextResult;
        }
    }
}
