package com.vgcenter.damagecalc.application.usecase;

public record ReplayScoringWeights(
        double damageDealtWeight, double damageTakenWeight, double koBonus, double faintPenalty) {

    public ReplayScoringWeights {
        validate(damageDealtWeight, "damageDealtWeight");
        validate(damageTakenWeight, "damageTakenWeight");
        validate(koBonus, "koBonus");
        validate(faintPenalty, "faintPenalty");
    }

    public static ReplayScoringWeights defaults() {
        return new ReplayScoringWeights(1.0d, 1.0d, 30.0d, 20.0d);
    }

    private static void validate(double value, String label) {
        if (!Double.isFinite(value) || value < 0.0d) {
            throw new IllegalArgumentException(label + " must be finite and non-negative");
        }
    }
}
