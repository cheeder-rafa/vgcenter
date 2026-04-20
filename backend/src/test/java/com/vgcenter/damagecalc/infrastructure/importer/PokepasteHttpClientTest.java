package com.vgcenter.damagecalc.infrastructure.importer;

import static com.github.tomakehurst.wiremock.client.WireMock.aResponse;
import static com.github.tomakehurst.wiremock.client.WireMock.get;
import static com.github.tomakehurst.wiremock.client.WireMock.urlEqualTo;
import static org.assertj.core.api.Assertions.assertThat;

import com.github.tomakehurst.wiremock.WireMockServer;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

class PokepasteHttpClientTest {

    private WireMockServer wireMockServer;

    @BeforeEach
    void setUp() {
        wireMockServer = new WireMockServer(0);
        wireMockServer.start();
    }

    @AfterEach
    void tearDown() {
        wireMockServer.stop();
    }

    @Test
    void fetchesRawPokepasteTextFromTheRawEndpoint() {
        wireMockServer.stubFor(get(urlEqualTo("/abc123/raw"))
                .willReturn(aResponse()
                        .withStatus(200)
                        .withHeader("Content-Type", "text/plain")
                        .withBody("Charizard @ Charizardite Y\nAbility: Blaze\n- Protect\n")));

        PokepasteHttpClient client = new PokepasteHttpClient();

        assertThat(client.fetch(wireMockServer.baseUrl() + "/abc123"))
                .isEqualTo("Charizard @ Charizardite Y\nAbility: Blaze\n- Protect\n");
    }
}
