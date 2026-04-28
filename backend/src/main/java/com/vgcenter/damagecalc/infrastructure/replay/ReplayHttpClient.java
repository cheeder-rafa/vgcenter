package com.vgcenter.damagecalc.infrastructure.replay;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.vgcenter.damagecalc.application.port.ReplaySource;
import com.vgcenter.damagecalc.infrastructure.importer.UrlAllowlist;
import java.io.IOException;
import java.io.InputStream;
import java.net.URI;
import java.net.URISyntaxException;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.Locale;
import org.springframework.stereotype.Component;

@Component
public class ReplayHttpClient implements ReplaySource {

    private static final int MAX_RESPONSE_BYTES = 512 * 1024;

    private final HttpClient httpClient;
    private final UrlAllowlist allowlist;
    private final ObjectMapper objectMapper;

    public ReplayHttpClient() {
        this(
                HttpClient.newBuilder()
                        .followRedirects(HttpClient.Redirect.NEVER)
                        .connectTimeout(Duration.ofSeconds(10))
                        .build(),
                UrlAllowlist.defaultShowdownReplay(),
                new ObjectMapper());
    }

    ReplayHttpClient(HttpClient httpClient, UrlAllowlist allowlist, ObjectMapper objectMapper) {
        this.httpClient = httpClient;
        this.allowlist = allowlist;
        this.objectMapper = objectMapper;
    }

    @Override
    public String fetch(String url) {
        URI validatedUri = allowlist.validate(url);
        URI jsonUri = toJsonUri(validatedUri);
        try {
            HttpRequest request = HttpRequest.newBuilder(jsonUri)
                    .GET()
                    .header("Accept", "application/json")
                    .timeout(Duration.ofSeconds(10))
                    .build();
            HttpResponse<InputStream> response = httpClient.send(request, HttpResponse.BodyHandlers.ofInputStream());
            if (response.statusCode() != 200) {
                throw new IllegalStateException("Replay request failed with status " + response.statusCode());
            }
            requireJsonContentType(response);
            return extractLog(readBounded(response.body()));
        } catch (IOException exception) {
            throw new IllegalStateException("Failed to fetch replay from " + url, exception);
        } catch (InterruptedException exception) {
            Thread.currentThread().interrupt();
            throw new IllegalStateException("Interrupted while fetching replay from " + url, exception);
        }
    }

    private static URI toJsonUri(URI uri) {
        String path = uri.getPath();
        if (path.endsWith(".json")) {
            return uri;
        }
        try {
            return new URI(uri.getScheme(), null, uri.getHost(), uri.getPort(), path + ".json", null, null);
        } catch (URISyntaxException exception) {
            throw new IllegalArgumentException("Invalid replay URL path: " + path, exception);
        }
    }

    private static void requireJsonContentType(HttpResponse<?> response) {
        String contentType = response.headers().firstValue("Content-Type").orElse("");
        if (!contentType.toLowerCase(Locale.ROOT).contains("application/json")) {
            throw new IllegalStateException("Replay response has non-json content type: " + contentType);
        }
    }

    private String extractLog(String body) throws IOException {
        JsonNode root = objectMapper.readTree(body);
        JsonNode log = root.get("log");
        if (log == null || !log.isTextual()) {
            throw new IllegalStateException("Replay response is missing textual log field");
        }
        return log.asText();
    }

    private static String readBounded(InputStream input) throws IOException {
        try (InputStream stream = input) {
            byte[] buffer = new byte[8 * 1024];
            java.io.ByteArrayOutputStream out = new java.io.ByteArrayOutputStream();
            int total = 0;
            int read;
            while ((read = stream.read(buffer)) != -1) {
                total += read;
                if (total > MAX_RESPONSE_BYTES) {
                    throw new IllegalStateException(
                            "Replay response exceeds maximum size of " + MAX_RESPONSE_BYTES + " bytes");
                }
                out.write(buffer, 0, read);
            }
            return out.toString(StandardCharsets.UTF_8);
        }
    }
}
