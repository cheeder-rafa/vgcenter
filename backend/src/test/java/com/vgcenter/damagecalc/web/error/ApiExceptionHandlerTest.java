package com.vgcenter.damagecalc.web.error;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.http.converter.json.MappingJackson2HttpMessageConverter;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

class ApiExceptionHandlerTest {

    private MockMvc mockMvc;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(new ThrowingController())
                .setControllerAdvice(new ApiExceptionHandler())
                .setMessageConverters(new MappingJackson2HttpMessageConverter())
                .build();
    }

    @Test
    void unexpectedRuntimeExceptionProduces500WithRecommendationFailedTitle() throws Exception {
        mockMvc.perform(get("/test/runtime"))
                .andExpect(status().isInternalServerError())
                .andExpect(jsonPath("$.title").value("Recommendation failed"))
                .andExpect(jsonPath("$.detail").isString());
    }

    @Test
    void unexpectedRuntimeExceptionDetailContainsExceptionMessage() throws Exception {
        mockMvc.perform(get("/test/runtime"))
                .andExpect(jsonPath("$.detail").value(org.hamcrest.Matchers.containsString("something went wrong")));
    }

    @RestController
    static class ThrowingController {
        @GetMapping("/test/runtime")
        void throwRuntime() {
            throw new RuntimeException("something went wrong unexpectedly");
        }
    }
}
