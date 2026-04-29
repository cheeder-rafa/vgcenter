package com.vgcenter.damagecalc.application.usecase;

public record CalculateDamageResult(
        int[] rolls,
        int min,
        int max,
        double minPct,
        double maxPct,
        KoChanceResult koChance,
        double accuracy,
        double expectedDamageWithAccuracy,
        double koProbabilityWithCrit) {

    public CalculateDamageResult(int[] rolls, int min, int max, double minPct, double maxPct, KoChanceResult koChance) {
        this(rolls, min, max, minPct, maxPct, koChance, 1.0d, average(rolls), koChance.probability());
    }

    private static double average(int[] rolls) {
        if (rolls == null || rolls.length == 0) {
            return 0.0d;
        }
        long sum = 0L;
        for (int roll : rolls) {
            sum += roll;
        }
        return sum / (double) rolls.length;
    }
}
