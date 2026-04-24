package com.vgcenter.damagecalc.infrastructure.config;

import io.github.bucket4j.Bandwidth;
import io.github.bucket4j.Bucket;
import io.github.bucket4j.ConsumptionProbe;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.time.Duration;
import java.util.Locale;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.TimeUnit;
import java.util.function.Supplier;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

@Component
public class RateLimitFilter extends OncePerRequestFilter {

    private static final int MAX_TRACKED_CLIENTS = 10_000;

    private final Map<String, Bucket> importBuckets = new ConcurrentHashMap<>();
    private final Map<String, Bucket> globalBuckets = new ConcurrentHashMap<>();

    private final Supplier<Bucket> importBucketFactory;
    private final Supplier<Bucket> globalBucketFactory;

    public RateLimitFilter() {
        this(
                () -> Bucket.builder()
                        .addLimit(Bandwidth.builder()
                                .capacity(10)
                                .refillGreedy(10, Duration.ofMinutes(1))
                                .build())
                        .build(),
                () -> Bucket.builder()
                        .addLimit(Bandwidth.builder()
                                .capacity(120)
                                .refillGreedy(120, Duration.ofMinutes(1))
                                .build())
                        .build());
    }

    RateLimitFilter(Supplier<Bucket> importBucketFactory, Supplier<Bucket> globalBucketFactory) {
        this.importBucketFactory = importBucketFactory;
        this.globalBucketFactory = globalBucketFactory;
    }

    @Override
    protected boolean shouldNotFilter(HttpServletRequest request) {
        String path = request.getRequestURI();
        return path == null || !path.startsWith("/api/");
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
            throws ServletException, IOException {
        String clientId = clientId(request);
        Map<String, Bucket> poolRef;
        Supplier<Bucket> factoryRef;
        if (request.getRequestURI().startsWith("/api/v1/import/")) {
            poolRef = importBuckets;
            factoryRef = importBucketFactory;
        } else {
            poolRef = globalBuckets;
            factoryRef = globalBucketFactory;
        }
        if (poolRef.size() > MAX_TRACKED_CLIENTS) {
            poolRef.clear();
        }
        Bucket bucket = poolRef.computeIfAbsent(clientId, key -> factoryRef.get());
        ConsumptionProbe probe = bucket.tryConsumeAndReturnRemaining(1);
        if (!probe.isConsumed()) {
            long retryAfterSeconds = TimeUnit.NANOSECONDS.toSeconds(probe.getNanosToWaitForRefill()) + 1;
            response.setStatus(429);
            response.setHeader("Retry-After", Long.toString(retryAfterSeconds));
            response.setContentType("application/problem+json");
            response.getWriter()
                    .write("{\"type\":\"https://vgcenter.dev/problems/rate-limit\","
                            + "\"title\":\"Too Many Requests\","
                            + "\"status\":429,"
                            + "\"detail\":\"Rate limit exceeded. Retry after " + retryAfterSeconds + " seconds.\"}");
            return;
        }
        chain.doFilter(request, response);
    }

    private static String clientId(HttpServletRequest request) {
        String forwarded = request.getHeader("X-Forwarded-For");
        if (forwarded != null && !forwarded.isBlank()) {
            int comma = forwarded.indexOf(',');
            String first = (comma < 0 ? forwarded : forwarded.substring(0, comma)).trim();
            if (!first.isEmpty()) {
                return first.toLowerCase(Locale.ROOT);
            }
        }
        String remote = request.getRemoteAddr();
        return remote == null ? "unknown" : remote.toLowerCase(Locale.ROOT);
    }
}
