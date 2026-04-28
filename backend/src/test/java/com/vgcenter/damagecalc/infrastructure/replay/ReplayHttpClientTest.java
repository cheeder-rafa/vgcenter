package com.vgcenter.damagecalc.infrastructure.replay;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.vgcenter.damagecalc.infrastructure.importer.UrlAllowlist;
import java.io.ByteArrayInputStream;
import java.io.InputStream;
import java.net.InetAddress;
import java.net.http.HttpClient;
import java.net.http.HttpHeaders;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.regex.Pattern;
import org.junit.jupiter.api.Tag;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.condition.EnabledIfSystemProperty;

class ReplayHttpClientTest {

    @Test
    void fetchesProtocolLogFromJsonEndpoint() throws Exception {
        ReplayHttpClient client = permissiveClient(200, "application/json", "{\"log\":\"|turn|1\\n|win|alice\\n\"}");

        assertThat(client.fetch("https://localhost/battle-abc123")).isEqualTo("|turn|1\n|win|alice\n");
    }

    @Test
    void rejectsNonJsonContentType() throws Exception {
        ReplayHttpClient client = permissiveClient(200, "text/plain", "|turn|1");

        assertThatThrownBy(() -> client.fetch("https://localhost/battle-abc123"))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("non-json");
    }

    @Test
    void rejectsJsonWithoutLogField() throws Exception {
        ReplayHttpClient client = permissiveClient(200, "application/json", "{\"id\":\"battle-abc123\"}");

        assertThatThrownBy(() -> client.fetch("https://localhost/battle-abc123"))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("log");
    }

    @Test
    void productionClientRejectsNonShowdownHost() {
        ReplayHttpClient client = new ReplayHttpClient();

        assertThatThrownBy(() -> client.fetch("https://attacker.example.com/battle-abc123"))
                .isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    @Tag("net")
    @EnabledIfSystemProperty(named = "runNetTests", matches = "true")
    void fetchesRealReplayLogOverNetwork() {
        ReplayHttpClient client = new ReplayHttpClient();

        assertThat(
                        client.fetch(
                                "https://replay.pokemonshowdown.com/gen9championsvgc2026regma-2593988469-t3cctf2g51jrek1gjpfiul2337uyqylpw"))
                .contains("|turn|1")
                .contains("|win|slippybingus");
    }

    @SuppressWarnings("unchecked")
    private ReplayHttpClient permissiveClient(int status, String contentType, String body) throws Exception {
        HttpClient httpClient = mock(HttpClient.class);
        HttpResponse<InputStream> response = mock(HttpResponse.class);
        when(response.statusCode()).thenReturn(status);
        when(response.headers())
                .thenReturn(HttpHeaders.of(Map.of("Content-Type", List.of(contentType)), (left, right) -> true));
        when(response.body()).thenReturn(new ByteArrayInputStream(body.getBytes(StandardCharsets.UTF_8)));
        when(httpClient.send(any(), any(HttpResponse.BodyHandler.class))).thenReturn(response);

        UrlAllowlist allowlist = new UrlAllowlist(
                Set.of("http", "https"),
                Set.of("localhost"),
                Set.of(-1, 443),
                Pattern.compile("^/[A-Za-z0-9._/-]+(\\.json)?$"),
                true,
                host -> new InetAddress[] {InetAddress.getByName("127.0.0.1")});
        return new ReplayHttpClient(httpClient, allowlist, new ObjectMapper());
    }
}
