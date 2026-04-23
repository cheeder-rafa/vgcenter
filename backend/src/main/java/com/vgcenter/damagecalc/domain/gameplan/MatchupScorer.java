package com.vgcenter.damagecalc.domain.gameplan;

import java.util.List;
import java.util.Objects;

public final class MatchupScorer {

    /**
     * Guaranteed OHKOs define the top tier of offensive pressure.
     */
    static final int OHKO_POINTS = 20;

    /**
     * Guaranteed 2HKOs matter, but less than outright removal.
     */
    static final int GUARANTEED_TWO_HKO_POINTS = 12;

    /**
     * Sub-2HKO pressure is intentionally minor and scales linearly.
     */
    static final int CHIP_CAP_POINTS = 5;

    /**
     * The tagged win-condition mon gets extra weight on output and survival.
     */
    static final double WIN_CONDITION_MULTIPLIER = 1.5d;

    static final int SPEED_EDGE_POINTS = 2;
    static final int IMMUNITY_BLOCK_POINTS = 4;

    public MatchupScore score(MatchupScoreContext context) {
        Objects.requireNonNull(context, "context must not be null");

        int offense =
                context.offense().stream().mapToInt(this::offenseContribution).sum();
        int defense =
                context.defense().stream().mapToInt(this::defenseContribution).sum();
        int speed = (context.fasterMatchups() - context.slowerMatchups()) * SPEED_EDGE_POINTS;
        int immunity = Math.max(0, context.immunityBlocks()) * IMMUNITY_BLOCK_POINTS;
        int total = clamp(offense + defense + speed + immunity);
        return new MatchupScore(total, offense, defense, speed, immunity);
    }

    private int offenseContribution(LeadPressure pressure) {
        return applyWinCondition(weightedPressure(pressure.minPct(), pressure.maxPct()), pressure.winCondition());
    }

    private int defenseContribution(LeadPressure pressure) {
        return -applyWinCondition(weightedPressure(pressure.minPct(), pressure.maxPct()), pressure.winCondition());
    }

    private int weightedPressure(double minPct, double maxPct) {
        if (minPct >= 100.0d) {
            return OHKO_POINTS;
        }
        if (minPct >= 50.0d) {
            return GUARANTEED_TWO_HKO_POINTS;
        }
        double boundedPct = Math.max(0.0d, Math.min(50.0d, maxPct));
        return (int) Math.round(boundedPct / 50.0d * CHIP_CAP_POINTS);
    }

    private int applyWinCondition(int value, boolean winCondition) {
        if (!winCondition) {
            return value;
        }
        return (int) Math.round(value * WIN_CONDITION_MULTIPLIER);
    }

    private int clamp(int total) {
        return Math.max(-100, Math.min(100, total));
    }

    public record MatchupScoreContext(
            List<LeadPressure> offense,
            List<LeadPressure> defense,
            int fasterMatchups,
            int slowerMatchups,
            int immunityBlocks) {

        public MatchupScoreContext {
            offense = List.copyOf(Objects.requireNonNull(offense, "offense must not be null"));
            defense = List.copyOf(Objects.requireNonNull(defense, "defense must not be null"));
        }
    }

    public record LeadPressure(double minPct, double maxPct, boolean winCondition) {}
}
