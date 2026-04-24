package com.vgcenter.damagecalc.infrastructure.importer;

import java.net.InetAddress;
import java.net.URI;
import java.net.URISyntaxException;
import java.net.UnknownHostException;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

public final class UrlAllowlist {

    public interface HostResolver {
        InetAddress[] resolve(String host) throws UnknownHostException;
    }

    private static final HostResolver SYSTEM_RESOLVER = InetAddress::getAllByName;

    private static final Pattern DEFAULT_PATH_PATTERN = Pattern.compile("^/[A-Za-z0-9_-]{3,64}(/raw)?/?$");

    private final Set<String> allowedSchemes;
    private final Set<String> allowedHosts;
    private final Set<Integer> allowedPorts;
    private final Pattern pathPattern;
    private final boolean allowPrivateAddresses;
    private final HostResolver hostResolver;

    UrlAllowlist(
            Set<String> allowedSchemes,
            Set<String> allowedHosts,
            Set<Integer> allowedPorts,
            Pattern pathPattern,
            boolean allowPrivateAddresses,
            HostResolver hostResolver) {
        this.allowedSchemes = allowedSchemes.stream()
                .map(scheme -> scheme.toLowerCase(Locale.ROOT))
                .collect(Collectors.toUnmodifiableSet());
        this.allowedHosts = allowedHosts.stream()
                .map(host -> host.toLowerCase(Locale.ROOT))
                .collect(Collectors.toUnmodifiableSet());
        this.allowedPorts = Set.copyOf(allowedPorts);
        this.pathPattern = pathPattern;
        this.allowPrivateAddresses = allowPrivateAddresses;
        this.hostResolver = hostResolver;
    }

    public static UrlAllowlist defaultPokepaste() {
        return new UrlAllowlist(
                Set.of("https"),
                Set.of("pokepast.es", "www.pokepast.es"),
                Set.of(-1, 443),
                DEFAULT_PATH_PATTERN,
                false,
                SYSTEM_RESOLVER);
    }

    public URI validate(String rawUrl) {
        if (rawUrl == null || rawUrl.isBlank()) {
            throw new IllegalArgumentException("URL must not be blank");
        }
        URI uri;
        try {
            uri = new URI(rawUrl.trim());
        } catch (URISyntaxException exception) {
            throw new IllegalArgumentException("URL is not a valid URI", exception);
        }
        if (!uri.isAbsolute()) {
            throw new IllegalArgumentException("URL must be absolute");
        }
        String scheme = uri.getScheme();
        if (scheme == null || !allowedSchemes.contains(scheme.toLowerCase(Locale.ROOT))) {
            throw new IllegalArgumentException(
                    "URL scheme not allowed: " + scheme + " (allowed: " + allowedSchemes + ")");
        }
        if (uri.getUserInfo() != null) {
            throw new IllegalArgumentException("URL must not contain userinfo");
        }
        String host = uri.getHost();
        if (host == null || host.isBlank()) {
            throw new IllegalArgumentException("URL must have a host");
        }
        host = host.toLowerCase(Locale.ROOT);
        if (!allowedHosts.contains(host)) {
            throw new IllegalArgumentException("URL host not allowed: " + host);
        }
        if (!allowedPorts.contains(uri.getPort())) {
            throw new IllegalArgumentException("URL port not allowed: " + uri.getPort());
        }
        String path = uri.getPath();
        if (path == null || path.isBlank()) {
            throw new IllegalArgumentException("URL must have a path");
        }
        if (!pathPattern.matcher(path).matches()) {
            throw new IllegalArgumentException("URL path shape not allowed: " + path);
        }
        if (uri.getRawQuery() != null || uri.getRawFragment() != null) {
            throw new IllegalArgumentException("URL must not contain query or fragment");
        }
        if (!allowPrivateAddresses) {
            rejectPrivateAddresses(host);
        }
        return uri;
    }

    private void rejectPrivateAddresses(String host) {
        InetAddress[] addresses;
        try {
            addresses = hostResolver.resolve(host);
        } catch (UnknownHostException exception) {
            throw new IllegalArgumentException("URL host could not be resolved: " + host, exception);
        }
        if (addresses == null || addresses.length == 0) {
            throw new IllegalArgumentException("URL host resolved to no addresses: " + host);
        }
        List<InetAddress> blocked =
                List.of(addresses).stream().filter(UrlAllowlist::isPrivate).toList();
        if (!blocked.isEmpty()) {
            throw new IllegalArgumentException("URL host resolves to a non-public address: "
                    + blocked.get(0).getHostAddress());
        }
    }

    private static boolean isPrivate(InetAddress address) {
        return address.isAnyLocalAddress()
                || address.isLoopbackAddress()
                || address.isLinkLocalAddress()
                || address.isSiteLocalAddress()
                || address.isMulticastAddress()
                || isCarrierGradeNat(address);
    }

    private static boolean isCarrierGradeNat(InetAddress address) {
        byte[] bytes = address.getAddress();
        if (bytes.length != 4) {
            return false;
        }
        int first = bytes[0] & 0xFF;
        int second = bytes[1] & 0xFF;
        return first == 100 && second >= 64 && second <= 127;
    }
}
