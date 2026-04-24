package com.vgcenter.damagecalc.infrastructure.importer;

import static com.github.tomakehurst.wiremock.client.WireMock.aResponse;
import static com.github.tomakehurst.wiremock.client.WireMock.get;
import static com.github.tomakehurst.wiremock.client.WireMock.urlEqualTo;
import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.github.tomakehurst.wiremock.WireMockServer;
import java.net.InetAddress;
import java.net.http.HttpClient;
import java.time.Duration;
import java.util.Set;
import java.util.regex.Pattern;
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

    private PokepasteHttpClient permissiveClient() {
        UrlAllowlist permissive = new UrlAllowlist(
                Set.of("http", "https"),
                Set.of("localhost", "127.0.0.1"),
                Set.of(-1, wireMockServer.port(), 80, 443),
                Pattern.compile("^/[A-Za-z0-9_/-]+$"),
                true,
                host -> new InetAddress[] {InetAddress.getByName("127.0.0.1")});
        HttpClient http = HttpClient.newBuilder()
                .followRedirects(HttpClient.Redirect.NEVER)
                .connectTimeout(Duration.ofSeconds(5))
                .build();
        return new PokepasteHttpClient(http, permissive);
    }

    @Test
    void fetchesRawPokepasteTextFromTheRawEndpoint() {
        wireMockServer.stubFor(get(urlEqualTo("/abc123/raw"))
                .willReturn(aResponse()
                        .withStatus(200)
                        .withHeader("Content-Type", "text/plain")
                        .withBody("Charizard @ Charizardite Y\nAbility: Blaze\n- Protect\n")));

        PokepasteHttpClient client = permissiveClient();

        assertThat(client.fetch(wireMockServer.baseUrl() + "/abc123"))
                .isEqualTo("Charizard @ Charizardite Y\nAbility: Blaze\n- Protect\n");
    }

    @Test
    void rejectsNonTextContentType() {
        wireMockServer.stubFor(get(urlEqualTo("/abc123/raw"))
                .willReturn(aResponse()
                        .withStatus(200)
                        .withHeader("Content-Type", "application/octet-stream")
                        .withBody("binary-ish")));

        PokepasteHttpClient client = permissiveClient();

        assertThatThrownBy(() -> client.fetch(wireMockServer.baseUrl() + "/abc123"))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("non-text");
    }

    @Test
    void rejectsOversizedResponse() {
        String large = "A".repeat(300 * 1024);
        wireMockServer.stubFor(get(urlEqualTo("/abc123/raw"))
                .willReturn(aResponse()
                        .withStatus(200)
                        .withHeader("Content-Type", "text/plain")
                        .withBody(large)));

        PokepasteHttpClient client = permissiveClient();

        assertThatThrownBy(() -> client.fetch(wireMockServer.baseUrl() + "/abc123"))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("exceeds");
    }

    @Test
    void doesNotFollowRedirects() {
        wireMockServer.stubFor(get(urlEqualTo("/abc123/raw"))
                .willReturn(aResponse().withStatus(302).withHeader("Location", "http://evil.example.com/")));

        PokepasteHttpClient client = permissiveClient();

        assertThatThrownBy(() -> client.fetch(wireMockServer.baseUrl() + "/abc123"))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("302");
    }

    @Test
    void productionClientRejectsNonPokepastHost() {
        PokepasteHttpClient client = new PokepasteHttpClient();

        assertThatThrownBy(() -> client.fetch("https://attacker.example.com/abcd123"))
                .isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    void productionClientRejectsHttpScheme() {
        PokepasteHttpClient client = new PokepasteHttpClient();

        assertThatThrownBy(() -> client.fetch("http://pokepast.es/abcd123"))
                .isInstanceOf(IllegalArgumentException.class);
    }
}
