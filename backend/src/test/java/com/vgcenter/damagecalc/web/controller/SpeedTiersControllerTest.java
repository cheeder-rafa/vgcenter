package com.vgcenter.damagecalc.web.controller;

import static org.springframework.http.MediaType.APPLICATION_JSON;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.vgcenter.damagecalc.application.usecase.BuildSpeedTiersUseCase;
import com.vgcenter.damagecalc.application.usecase.SpeedTierRow;
import com.vgcenter.damagecalc.application.usecase.SpeedTiersCommand;
import com.vgcenter.damagecalc.application.usecase.SpeedTiersResult;
import com.vgcenter.damagecalc.web.error.ApiExceptionHandler;
import com.vgcenter.damagecalc.web.mapper.PreviewWebMapper;
import java.util.List;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.converter.json.MappingJackson2HttpMessageConverter;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.validation.beanvalidation.LocalValidatorFactoryBean;

class SpeedTiersControllerTest {

    private final StubBuildSpeedTiersUseCase speedTiersUseCase = new StubBuildSpeedTiersUseCase();
    private MockMvc mockMvc;

    @BeforeEach
    void setUp() {
        LocalValidatorFactoryBean validator = new LocalValidatorFactoryBean();
        validator.afterPropertiesSet();

        mockMvc = MockMvcBuilders.standaloneSetup(
                        new PreviewController(null, null, speedTiersUseCase, new PreviewWebMapper()))
                .setControllerAdvice(new ApiExceptionHandler())
                .setValidator(validator)
                .setMessageConverters(new MappingJackson2HttpMessageConverter(new ObjectMapper()))
                .build();
    }

    @Test
    void returnsSpeedTiersForAValidRequest() throws Exception {
        speedTiersUseCase.nextResult = new SpeedTiersResult(List.of(
                new SpeedTierRow("garchomp", "Garchomp", 169, true),
                new SpeedTierRow("incineroar", "Incineroar", 80, false)));

        mockMvc.perform(post("/api/v1/preview/speed-tiers")
                        .contentType(APPLICATION_JSON)
                        .content("""
                                {
                                  "regulation": "M-A",
                                  "userTeam": [{"speciesId":"garchomp","speciesName":"Garchomp","spSpeed":32,"natureId":"JOLLY"}],
                                  "modifiers": {"tailwind":false,"trickRoom":false,"paralysis":false,"choiceScarf":false,"stages":0}
                                }
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.rows[0].speciesId").value("garchomp"))
                .andExpect(jsonPath("$.rows[0].finalSpeed").value(169))
                .andExpect(jsonPath("$.rows[0].userTeam").value(true))
                .andExpect(jsonPath("$.rows[1].speciesId").value("incineroar"));
    }

    @Test
    void returns400ForMissingRegulation() throws Exception {
        mockMvc.perform(post("/api/v1/preview/speed-tiers")
                        .contentType(APPLICATION_JSON)
                        .content("""
                                {
                                  "regulation": "",
                                  "userTeam": [],
                                  "modifiers": {"tailwind":false,"trickRoom":false,"paralysis":false,"choiceScarf":false,"stages":0}
                                }
                                """))
                .andExpect(status().isBadRequest());
    }

    static class StubBuildSpeedTiersUseCase implements BuildSpeedTiersUseCase {
        SpeedTiersResult nextResult = new SpeedTiersResult(List.of());

        @Override
        public SpeedTiersResult buildTiers(SpeedTiersCommand command) {
            return nextResult;
        }
    }
}
