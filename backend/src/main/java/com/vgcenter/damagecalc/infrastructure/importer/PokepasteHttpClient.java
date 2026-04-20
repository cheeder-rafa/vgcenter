package com.vgcenter.damagecalc.infrastructure.importer;

import com.vgcenter.damagecalc.application.port.PokepasteClient;
import java.io.IOException;
import java.net.URI;
import java.net.URISyntaxException;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import org.springframework.stereotype.Component;

@Component
public class PokepasteHttpClient implements PokepasteClient {

    private final HttpClient httpClient;

    public PokepasteHttpClient() {
        this(HttpClient.newBuilder()
                .followRedirects(HttpClient.Redirect.NORMAL)
                .connectTimeout(Duration.ofSeconds(10))
                .build());
    }

    PokepasteHttpClient(HttpClient httpClient) {
        this.httpClient = httpClient;
    }

    @Override
    public String fetch(String url) {
        try {
            HttpRequest request = HttpRequest.newBuilder(toRawUri(url))
                    .GET()
                    .header("Accept", "text/plain")
                    .timeout(Duration.ofSeconds(10))
                    .build();
            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() != 200) {
                throw new IllegalStateException("Pokepaste request failed with status " + response.statusCode());
            }
            return response.body();
        } catch (IOException exception) {
            throw new IllegalStateException("Failed to fetch Pokepaste from " + url, exception);
        } catch (InterruptedException exception) {
            Thread.currentThread().interrupt();
            throw new IllegalStateException("Interrupted while fetching Pokepaste from " + url, exception);
        }
    }

    private URI toRawUri(String url) {
        try {
            URI uri = URI.create(requireText(url, "Pokepaste URL"));
            String scheme = requireText(uri.getScheme(), "Pokepaste URL scheme");
            String host = requireText(uri.getHost(), "Pokepaste URL host");
            String path = requireText(uri.getPath(), "Pokepaste URL path");
            if (path.endsWith("/raw")) {
                return uri;
            }
            String normalizedPath = path.endsWith("/") ? path.substring(0, path.length() - 1) : path;
            return new URI(scheme, uri.getUserInfo(), host, uri.getPort(), normalizedPath + "/raw", null, null);
        } catch (IllegalArgumentException | URISyntaxException exception) {
            throw new IllegalArgumentException("Invalid Pokepaste URL: " + url, exception);
        }
    }

    private static String requireText(String value, String label) {
        if (value == null || value.isBlank()) {
            throw new IllegalArgumentException(label + " must not be blank");
        }
        return value.trim();
    }
}
