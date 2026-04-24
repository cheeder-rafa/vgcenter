package com.vgcenter.damagecalc.infrastructure.config;

import static org.assertj.core.api.Assertions.assertThat;

import io.github.bucket4j.Bandwidth;
import io.github.bucket4j.Bucket;
import jakarta.servlet.FilterChain;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.time.Duration;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockFilterChain;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.mock.web.MockHttpServletResponse;

class RateLimitFilterTest {

    private static RateLimitFilter withLimits(int importCapacity, int globalCapacity) {
        return new RateLimitFilter(
                () -> Bucket.builder()
                        .addLimit(Bandwidth.builder()
                                .capacity(importCapacity)
                                .refillGreedy(importCapacity, Duration.ofMinutes(1))
                                .build())
                        .build(),
                () -> Bucket.builder()
                        .addLimit(Bandwidth.builder()
                                .capacity(globalCapacity)
                                .refillGreedy(globalCapacity, Duration.ofMinutes(1))
                                .build())
                        .build());
    }

    private static MockHttpServletRequest request(String uri, String ip) {
        MockHttpServletRequest request = new MockHttpServletRequest("POST", uri);
        request.setRequestURI(uri);
        request.setRemoteAddr(ip);
        return request;
    }

    @Test
    void allowsRequestsUnderLimit() throws Exception {
        RateLimitFilter filter = withLimits(3, 100);

        for (int i = 0; i < 3; i++) {
            MockHttpServletRequest request = request("/api/v1/import/pokepaste", "1.2.3.4");
            MockHttpServletResponse response = new MockHttpServletResponse();
            FilterChain chain = new MockFilterChain();
            filter.doFilter(request, response, chain);
            assertThat(response.getStatus()).isEqualTo(HttpServletResponse.SC_OK);
        }
    }

    @Test
    void rejectsRequestOverLimitWith429AndRetryAfter() throws Exception {
        RateLimitFilter filter = withLimits(2, 100);

        for (int i = 0; i < 2; i++) {
            filter.doFilter(
                    request("/api/v1/import/pokepaste", "5.6.7.8"),
                    new MockHttpServletResponse(),
                    new MockFilterChain());
        }

        MockHttpServletResponse response = new MockHttpServletResponse();
        filter.doFilter(request("/api/v1/import/pokepaste", "5.6.7.8"), response, new MockFilterChain());

        assertThat(response.getStatus()).isEqualTo(429);
        assertThat(response.getHeader("Retry-After")).isNotNull();
        assertThat(response.getContentType()).startsWith("application/problem+json");
    }

    @Test
    void tracksImportAndGlobalLimitsSeparately() throws Exception {
        RateLimitFilter filter = withLimits(1, 5);
        MockHttpServletResponse first = new MockHttpServletResponse();
        filter.doFilter(request("/api/v1/import/pokepaste", "9.9.9.9"), first, new MockFilterChain());
        assertThat(first.getStatus()).isEqualTo(HttpServletResponse.SC_OK);

        MockHttpServletResponse second = new MockHttpServletResponse();
        filter.doFilter(request("/api/v1/damage/calculate", "9.9.9.9"), second, new MockFilterChain());
        assertThat(second.getStatus()).isEqualTo(HttpServletResponse.SC_OK);
    }

    @Test
    void skipsNonApiPaths() throws Exception {
        RateLimitFilter filter = withLimits(1, 1);
        MockHttpServletResponse first = new MockHttpServletResponse();
        HttpServletRequest static1 = request("/index.html", "3.3.3.3");
        filter.doFilter(static1, first, new MockFilterChain());
        assertThat(first.getStatus()).isEqualTo(HttpServletResponse.SC_OK);

        MockHttpServletResponse second = new MockHttpServletResponse();
        filter.doFilter(request("/index.html", "3.3.3.3"), second, new MockFilterChain());
        assertThat(second.getStatus()).isEqualTo(HttpServletResponse.SC_OK);
    }

    @Test
    void usesXForwardedForHeader() throws IOException, jakarta.servlet.ServletException {
        RateLimitFilter filter = withLimits(1, 100);

        MockHttpServletRequest req1 = request("/api/v1/import/pokepaste", "10.0.0.1");
        req1.addHeader("X-Forwarded-For", "11.11.11.11, 10.0.0.1");
        MockHttpServletResponse res1 = new MockHttpServletResponse();
        filter.doFilter(req1, res1, new MockFilterChain());
        assertThat(res1.getStatus()).isEqualTo(HttpServletResponse.SC_OK);

        MockHttpServletRequest req2 = request("/api/v1/import/pokepaste", "10.0.0.1");
        req2.addHeader("X-Forwarded-For", "11.11.11.11");
        MockHttpServletResponse res2 = new MockHttpServletResponse();
        filter.doFilter(req2, res2, new MockFilterChain());
        assertThat(res2.getStatus()).isEqualTo(429);
    }
}
