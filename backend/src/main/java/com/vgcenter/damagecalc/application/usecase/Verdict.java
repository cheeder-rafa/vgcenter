package com.vgcenter.damagecalc.application.usecase;

/**
 * Plain-English verdict shown in beginner-mode UIs.
 *
 * <p>headline: action-oriented imperative, ≤ 80 chars (e.g., "Lead Incineroar + Rillaboom").
 * subline: supporting context, ≤ 140 chars (e.g., "Strong into Tornadus + Urshifu; watch Flutter Mane + Iron Hands.").
 * callout: optional warning shown as a separate accent line; null when no warning applies.
 */
public record Verdict(String headline, String subline, String callout) {

    public static final int HEADLINE_MAX = 80;
    public static final int SUBLINE_MAX = 140;

    public Verdict {
        if (headline == null || headline.isBlank()) {
            throw new IllegalArgumentException("headline must not be blank");
        }
        if (subline == null) {
            throw new IllegalArgumentException("subline must not be null");
        }
        if (headline.length() > HEADLINE_MAX) {
            throw new IllegalArgumentException("headline exceeds " + HEADLINE_MAX + " chars: " + headline);
        }
        if (subline.length() > SUBLINE_MAX) {
            throw new IllegalArgumentException("subline exceeds " + SUBLINE_MAX + " chars: " + subline);
        }
    }
}
