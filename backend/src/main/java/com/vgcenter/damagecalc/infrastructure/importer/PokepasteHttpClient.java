package com.vgcenter.damagecalc.infrastructure.importer;

import com.vgcenter.damagecalc.application.port.PokepasteClient;
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
public class PokepasteHttpClient implements PokepasteClient {

    private static final int MAX_RESPONSE_BYTES = 256 * 1024;

    private final HttpClient httpClient;
    private final UrlAllowlist allowlist;

    public PokepasteHttpClient() {
        this(
                HttpClient.newBuilder()
                        .followRedirects(HttpClient.Redirect.NEVER)
                        .connectTimeout(Duration.ofSeconds(10))
                        .build(),
                UrlAllowlist.defaultPokepaste());
    }

    PokepasteHttpClient(HttpClient httpClient, UrlAllowlist allowlist) {
        this.httpClient = httpClient;
        this.allowlist = allowlist;
    }

    @Override
    public String fetch(String url) {
        URI validatedUri = allowlist.validate(url);
        URI rawUri = toRawUri(validatedUri);
        try {
            HttpRequest request = HttpRequest.newBuilder(rawUri)
                    .GET()
                    .header("Accept", "text/plain")
                    .timeout(Duration.ofSeconds(10))
                    .build();
            HttpResponse<InputStream> response = httpClient.send(request, HttpResponse.BodyHandlers.ofInputStream());
            if (response.statusCode() != 200) {
                throw new IllegalStateException("Pokepaste request failed with status " + response.statusCode());
            }
            requireTextContentType(response);
            return readBounded(response.body());
        } catch (IOException exception) {
            throw new IllegalStateException("Failed to fetch Pokepaste from " + url, exception);
        } catch (InterruptedException exception) {
            Thread.currentThread().interrupt();
            throw new IllegalStateException("Interrupted while fetching Pokepaste from " + url, exception);
        }
    }

    private static URI toRawUri(URI uri) {
        String path = uri.getPath();
        if (path.endsWith("/raw")) {
            return uri;
        }
        String normalizedPath = path.endsWith("/") ? path.substring(0, path.length() - 1) : path;
        try {
            return new URI(uri.getScheme(), null, uri.getHost(), uri.getPort(), normalizedPath + "/raw", null, null);
        } catch (URISyntaxException exception) {
            throw new IllegalArgumentException("Invalid Pokepaste URL path: " + path, exception);
        }
    }

    private static void requireTextContentType(HttpResponse<?> response) {
        String contentType = response.headers().firstValue("Content-Type").orElse("");
        if (!contentType.toLowerCase(Locale.ROOT).startsWith("text/")) {
            throw new IllegalStateException("Pokepaste response has non-text content type: " + contentType);
        }
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
                            "Pokepaste response exceeds maximum size of " + MAX_RESPONSE_BYTES + " bytes");
                }
                out.write(buffer, 0, read);
            }
            return out.toString(StandardCharsets.UTF_8);
        }
    }
}
