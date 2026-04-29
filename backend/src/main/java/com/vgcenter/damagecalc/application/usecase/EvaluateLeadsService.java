package com.vgcenter.damagecalc.application.usecase;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

public final class EvaluateLeadsService implements EvaluateLeadsUseCase {

    private final CalculateDamageUseCase calculateDamageUseCase;

    public EvaluateLeadsService(CalculateDamageUseCase calculateDamageUseCase) {
        this.calculateDamageUseCase = calculateDamageUseCase;
    }

    @Override
    public EvaluateLeadsResult evaluate(EvaluateLeadsCommand command) {
        // Build a mini-matrix for the 2 selected leads to eliminate redundant calcs across 15 pairs.
        DamageMatrix matrix =
                buildMatrix(command.regulation(), command.selectedLeads(), command.opponentTeam(), command.field());
        return evaluateFromMatrix(command.selectedLeads(), new int[] {0, 1}, command.opponentTeam(), matrix);
    }

    @Override
    public DamageMatrix buildMatrix(
            String regulation,
            List<PreviewPokemonCommand> myTeam,
            List<PreviewPokemonCommand> opponentTeam,
            PreviewFieldCommand field) {
        int mySize = myTeam.size();
        int oppSize = opponentTeam.size();
        HitEvidence[][] bestOutgoing = new HitEvidence[mySize][oppSize];
        HitEvidence[][] bestIncoming = new HitEvidence[oppSize][mySize];

        try (ExecutorService executor = Executors.newVirtualThreadPerTaskExecutor()) {
            List<CompletableFuture<Void>> futures = new ArrayList<>();

            for (int i = 0; i < mySize; i++) {
                for (int j = 0; j < oppSize; j++) {
                    final int fi = i, fj = j;
                    futures.add(CompletableFuture.runAsync(
                            () -> bestOutgoing[fi][fj] =
                                    bestEvidence(regulation, myTeam.get(fi), opponentTeam.get(fj), field, true),
                            executor));
                    futures.add(CompletableFuture.runAsync(
                            () -> bestIncoming[fj][fi] =
                                    bestEvidence(regulation, opponentTeam.get(fj), myTeam.get(fi), field, false),
                            executor));
                }
            }

            CompletableFuture.allOf(futures.toArray(new CompletableFuture[0])).join();
        }

        return new DamageMatrix(bestOutgoing, bestIncoming);
    }

    @Override
    public EvaluateLeadsResult evaluateFromMatrix(
            List<PreviewPokemonCommand> selectedLeads,
            int[] selectedLeadIndices,
            List<PreviewPokemonCommand> opponentTeam,
            DamageMatrix matrix) {
        List<LeadMatchupResult> matchups = new ArrayList<>();
        for (int first = 0; first < opponentTeam.size(); first++) {
            for (int second = first + 1; second < opponentTeam.size(); second++) {
                LeadMatchupResult cell = evaluatePairFromMatrix(
                        selectedLeads,
                        selectedLeadIndices,
                        List.of(opponentTeam.get(first), opponentTeam.get(second)),
                        new int[] {first, second},
                        matrix);
                matchups.add(cell.withSummary(buildCellSummary(cell)));
            }
        }
        Verdict matrixSummary = buildMatrixSummary(selectedLeads, matchups);
        return new EvaluateLeadsResult(matchups, matrixSummary);
    }

    private static String buildCellSummary(LeadMatchupResult cell) {
        double your = cell.koPressure().value();
        double combined = cell.doubleUpPressure().value();
        double threats = cell.incomingDanger().value();
        if (combined >= 1 && threats == 0) {
            return "Clean focus KO on " + cell.opponentLeadNames().get(0) + ".";
        }
        if (your >= 1 && threats == 0) {
            return "You OHKO; nothing OHKOs back.";
        }
        if (threats >= 2) {
            return "Heavy pressure — they hit harder than you.";
        }
        if (your == 0 && threats == 0) {
            return "Slow grind — neither side OHKOs.";
        }
        return "Trade — both sides have KO threats.";
    }

    private static Verdict buildMatrixSummary(
            List<PreviewPokemonCommand> selectedLeads, List<LeadMatchupResult> cells) {
        if (cells.isEmpty()) {
            return null;
        }
        int total = cells.size();
        int favored = (int) cells.stream()
                .filter(c -> c.koPressure().value() + c.doubleUpPressure().value()
                        > c.incomingDanger().value())
                .count();
        String leadStr = selectedLeads.size() >= 2
                ? selectedLeads.get(0).displayName() + " + "
                        + selectedLeads.get(1).displayName()
                : "your leads";
        String headline = clip(leadStr + " favored in " + favored + "/" + total + " matchups.", Verdict.HEADLINE_MAX);

        LeadMatchupResult worst = cells.stream()
                .max(Comparator.comparingDouble(c -> c.incomingDanger().value()))
                .orElse(null);
        LeadMatchupResult best = cells.stream()
                .max(Comparator.comparingDouble(c -> c.koPressure().value()
                        + c.doubleUpPressure().value()
                        - c.incomingDanger().value()))
                .orElse(null);

        StringBuilder sub = new StringBuilder();
        if (best != null && best.koPressure().value() + best.doubleUpPressure().value() > 0) {
            sub.append("Best line: ")
                    .append(String.join(" + ", best.opponentLeadNames()))
                    .append('.');
        }
        if (worst != null && worst.incomingDanger().value() >= 2) {
            if (sub.length() > 0) sub.append(' ');
            sub.append("Danger: ")
                    .append(String.join(" + ", worst.opponentLeadNames()))
                    .append('.');
        }
        if (sub.length() == 0) sub.append("Neutral matchup spread.");
        return new Verdict(headline, clip(sub.toString(), Verdict.SUBLINE_MAX), null);
    }

    private static String clip(String s, int max) {
        if (s.length() <= max) return s;
        return s.substring(0, max - 1).trim() + "…";
    }

    private LeadMatchupResult evaluatePairFromMatrix(
            List<PreviewPokemonCommand> selectedLeads,
            int[] selectedLeadIndices,
            List<PreviewPokemonCommand> opponentLeads,
            int[] opponentLeadIndices,
            DamageMatrix matrix) {
        List<HitEvidence> outgoing = new ArrayList<>();
        List<HitEvidence> incoming = new ArrayList<>();

        for (int si : selectedLeadIndices) {
            for (int oi : opponentLeadIndices) {
                HitEvidence out = matrix.bestOutgoing()[si][oi];
                if (out != null) outgoing.add(out);
                HitEvidence in = matrix.bestIncoming()[oi][si];
                if (in != null) incoming.add(in);
            }
        }

        return buildMatchupResult(selectedLeads, opponentLeads, outgoing, incoming);
    }

    private HitEvidence bestEvidence(
            String regulation,
            PreviewPokemonCommand attacker,
            PreviewPokemonCommand defender,
            PreviewFieldCommand field,
            boolean selectedAttacking) {
        return attacker.moves().stream()
                .filter(move -> move.basePower() > 0)
                .map(move -> evaluateMove(regulation, attacker, defender, move, field, selectedAttacking))
                .max(Comparator.comparingDouble(EvaluateLeadsService::expectedDamageWithAccuracy))
                .orElse(null);
    }

    private HitEvidence evaluateMove(
            String regulation,
            PreviewPokemonCommand attacker,
            PreviewPokemonCommand defender,
            MoveCommand move,
            PreviewFieldCommand field,
            boolean selectedAttacking) {
        CalculateDamageResult result = calculateDamageUseCase.calculate(new CalculateDamageCommand(
                regulation,
                attacker.combatant(),
                defender.combatant(),
                move,
                field.field(),
                selectedAttacking ? field.selectedSide() : field.opponentSide(),
                selectedAttacking ? field.opponentSide() : field.selectedSide(),
                field.criticalHit(),
                field.targets()));
        return new HitEvidence(attacker, defender, move, result);
    }

    private LeadMatchupResult buildMatchupResult(
            List<PreviewPokemonCommand> selectedLeads,
            List<PreviewPokemonCommand> opponentLeads,
            List<HitEvidence> outgoing,
            List<HitEvidence> incoming) {
        int koCount = countLikelyKos(outgoing, 1);
        int twoHitCount = countLikelyKos(outgoing, 2);
        int incomingKoCount = countLikelyKos(incoming, 1);
        int incomingTwoHitCount = countLikelyKos(incoming, 2);
        int doubleUpCount = countDoubleUps(outgoing, opponentLeads);

        SpeedScore speedScore = compareSpeed(selectedLeads, opponentLeads);
        List<String> mustReactLabels =
                mustReactLabels(koCount, doubleUpCount, incomingKoCount, incomingTwoHitCount, speedScore);
        List<String> annotations = annotations(outgoing, incoming, speedScore);

        List<HitEvidenceSummary> outgoingEvidence =
                outgoing.stream().map(hit -> toSummary(hit, true)).toList();
        List<HitEvidenceSummary> incomingEvidence =
                incoming.stream().map(hit -> toSummary(hit, false)).toList();

        return new LeadMatchupResult(
                opponentLeads.stream().map(PreviewPokemonCommand::pokemonId).toList(),
                opponentLeads.stream().map(PreviewPokemonCommand::displayName).toList(),
                new PreviewMetricResult("Your OHKOs", koCount, tone(koCount, 2, 1)),
                new PreviewMetricResult("Your 2HKOs", twoHitCount, tone(twoHitCount, 4, 2)),
                new PreviewMetricResult("Combined KOs", doubleUpCount, tone(doubleUpCount, 2, 1)),
                new PreviewMetricResult(
                        "Threats on you",
                        incomingKoCount + incomingTwoHitCount,
                        tone(incomingKoCount * 2 + incomingTwoHitCount, 3, 1)),
                new PreviewMetricResult(
                        "You outspeed", speedScore.selectedFasterCount(), tone(speedScore.selectedFasterCount(), 2, 1)),
                mustReactLabels,
                annotations,
                outgoingEvidence,
                incomingEvidence);
    }

    private int countLikelyKos(List<HitEvidence> evidence, int maxHits) {
        return (int) evidence.stream()
                .filter(hit -> hit.result().koChance().hits() <= maxHits
                        && hit.result().koChance().probability() >= 0.5d)
                .count();
    }

    private int countDoubleUps(List<HitEvidence> outgoing, List<PreviewPokemonCommand> opponentLeads) {
        int count = 0;
        for (PreviewPokemonCommand defender : opponentLeads) {
            double combinedMax = outgoing.stream()
                    .filter(hit -> hit.defender().pokemonId().equals(defender.pokemonId()))
                    .mapToDouble(hit -> hit.result().max())
                    .sum();
            if (combinedMax >= defender.combatant().stats().hp()) {
                count++;
            }
        }
        return count;
    }

    private SpeedScore compareSpeed(
            List<PreviewPokemonCommand> selectedLeads, List<PreviewPokemonCommand> opponentLeads) {
        int selectedFaster = 0;
        int opponentFaster = 0;
        int ties = 0;
        for (PreviewPokemonCommand selected : selectedLeads) {
            for (PreviewPokemonCommand opponent : opponentLeads) {
                int selectedSpeed = selected.combatant().stats().speed();
                int opponentSpeed = opponent.combatant().stats().speed();
                if (selectedSpeed > opponentSpeed) {
                    selectedFaster++;
                } else if (selectedSpeed < opponentSpeed) {
                    opponentFaster++;
                } else {
                    ties++;
                }
            }
        }
        return new SpeedScore(selectedFaster, opponentFaster, ties);
    }

    private List<String> mustReactLabels(
            int koCount, int doubleUpCount, int incomingKoCount, int incomingTwoHitCount, SpeedScore speedScore) {
        List<String> labels = new ArrayList<>();
        if (incomingKoCount > 0) {
            labels.add("Protect or switch — opponent can OHKO one of your leads");
        }
        if (doubleUpCount > 0) {
            labels.add("Both your leads can combine to KO one opponent this turn");
        }
        if (koCount > 0) {
            labels.add("You can OHKO an opponent lead — press the KO");
        }
        if (incomingTwoHitCount > 0) {
            labels.add("Opponent can 2HKO — avoid leaving targets in range");
        }
        if (speedScore.opponentFasterCount() > speedScore.selectedFasterCount()) {
            labels.add("Opponent leads move first — plan around their turn-1 action");
        }
        if (labels.isEmpty()) {
            labels.add("Stable turn 1 — no immediate threats or KO opportunities");
        }
        return labels;
    }

    private List<String> annotations(List<HitEvidence> outgoing, List<HitEvidence> incoming, SpeedScore speedScore) {
        List<String> annotations = new ArrayList<>();
        outgoing.stream()
                .max(Comparator.comparingDouble(EvaluateLeadsService::expectedDamageWithAccuracy))
                .ifPresent(hit -> annotations.add("%s threatens %s for %.1f-%.1f%%"
                        .formatted(
                                hit.attacker().displayName(),
                                hit.defender().displayName(),
                                hit.result().minPct(),
                                hit.result().maxPct())));
        incoming.stream()
                .max(Comparator.comparingDouble(EvaluateLeadsService::expectedDamageWithAccuracy))
                .ifPresent(hit -> annotations.add("%s returns %.1f-%.1f%% into %s"
                        .formatted(
                                hit.attacker().displayName(),
                                hit.result().minPct(),
                                hit.result().maxPct(),
                                hit.defender().displayName())));
        annotations.add(
                speedScore.selectedFasterCount() >= speedScore.opponentFasterCount()
                        ? "Your leads move first in most checks."
                        : "Opponent leads move first in most checks.");
        annotations.add("Speed checks: faster: %d, slower: %d, tied: %d"
                .formatted(speedScore.selectedFasterCount(), speedScore.opponentFasterCount(), speedScore.tiedCount()));
        return annotations;
    }

    private static double expectedDamageWithAccuracy(HitEvidence hit) {
        return average(hit.result().rolls()) * hit.move().accuracy();
    }

    private static double average(int[] rolls) {
        int total = 0;
        for (int roll : rolls) {
            total += roll;
        }
        return total / (double) rolls.length;
    }

    private HitEvidenceSummary toSummary(HitEvidence hit, boolean selectedAttacking) {
        String moveName = hit.move().type() + " " + hit.move().category();
        return new HitEvidenceSummary(
                hit.attacker().displayName(),
                hit.defender().displayName(),
                moveName,
                hit.move().type(),
                hit.result().minPct(),
                hit.result().maxPct(),
                hit.result().koChance().description(),
                hit.result().koChance().probability(),
                selectedAttacking);
    }

    private String tone(double value, double high, double medium) {
        if (value >= high) return "high";
        if (value >= medium) return "medium";
        return "low";
    }

    private record SpeedScore(int selectedFasterCount, int opponentFasterCount, int tiedCount) {}
}
