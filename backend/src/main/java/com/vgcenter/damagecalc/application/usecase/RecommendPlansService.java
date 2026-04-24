package com.vgcenter.damagecalc.application.usecase;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

public final class RecommendPlansService implements RecommendPlansUseCase {

    private static final int MAX_PLANS = 3;

    private final EvaluateLeadsUseCase evaluateLeadsUseCase;

    public RecommendPlansService(EvaluateLeadsUseCase evaluateLeadsUseCase) {
        this.evaluateLeadsUseCase = evaluateLeadsUseCase;
    }

    @Override
    public RecommendPlansResult recommend(RecommendPlansCommand command) {
        List<PreviewPokemonCommand> myTeam = command.myTeam();
        List<PreviewPokemonCommand> opponentTeam = command.opponentTeam();

        // Pre-compute the full 6×6 damage matrix in parallel (virtual threads, one task per pair).
        // This replaces the old per-lead-pair fan-out and eliminates ~25× redundant damage calls.
        DamageMatrix matrix =
                evaluateLeadsUseCase.buildMatrix(command.regulation(), myTeam, opponentTeam, command.field());

        // Evaluate all C(6,2) = 15 lead pairs via matrix lookups (no further damage calculation).
        Map<Long, EvaluateLeadsResult> evalCache = new HashMap<>();
        for (int i = 0; i < myTeam.size(); i++) {
            for (int j = i + 1; j < myTeam.size(); j++) {
                EvaluateLeadsResult result = evaluateLeadsUseCase.evaluateFromMatrix(
                        List.of(myTeam.get(i), myTeam.get(j)), new int[] {i, j}, opponentTeam, matrix);
                evalCache.put(pairKey(i, j), result);
            }
        }

        // Enumerate all C(6,4) = 15 bring-4 combinations and find the best lead per bring-4.
        List<PlanCandidate> candidates = new ArrayList<>();
        List<int[]> bringCombos = combinations(6, 4);
        for (int[] bring : bringCombos) {
            PlanCandidate best = bestLeadForBring(bring, myTeam, evalCache, command.winConditionIndex());
            candidates.add(best);
        }

        // Sort by score descending; pick top 3 with diverse lead pairs.
        candidates.sort(Comparator.comparingInt(PlanCandidate::score).reversed());
        List<PlanCandidate> topCandidates = selectDiverse(candidates);
        topCandidates = applyMegaEscapeValve(topCandidates, candidates, myTeam);

        List<PlanRecommendation> plans = topCandidates.stream()
                .map(c -> buildRecommendation(c, myTeam, opponentTeam, command.winConditionIndex()))
                .toList();

        return new RecommendPlansResult(plans);
    }

    private PlanCandidate bestLeadForBring(
            int[] bring,
            List<PreviewPokemonCommand> myTeam,
            Map<Long, EvaluateLeadsResult> evalCache,
            Integer winConditionIndex) {
        List<int[]> leadCombos = combinations(4, 2);
        PlanCandidate best = null;
        for (int[] leadWithinBring : leadCombos) {
            int globalLead0 = bring[leadWithinBring[0]];
            int globalLead1 = bring[leadWithinBring[1]];
            EvaluateLeadsResult eval =
                    evalCache.get(pairKey(Math.min(globalLead0, globalLead1), Math.max(globalLead0, globalLead1)));
            int score = score(eval, toList(bring), toList(leadWithinBring), winConditionIndex, myTeam);
            if (best == null || score > best.score()) {
                best = new PlanCandidate(toList(bring), toList(leadWithinBring), score, eval);
            }
        }
        return best;
    }

    private int score(
            EvaluateLeadsResult eval,
            List<Integer> bring,
            List<Integer> leadWithinBring,
            Integer winConditionIndex,
            List<PreviewPokemonCommand> myTeam) {
        int offensive = 0;
        int safe = 0;
        int risky = 0;
        for (LeadMatchupResult matchup : eval.matchups()) {
            if (matchup.koPressure().value() > 0 || matchup.doubleUpPressure().value() > 0) {
                offensive++;
            }
            if (matchup.incomingDanger().value() == 0) {
                safe++;
            } else if (matchup.incomingDanger().value() >= 2) {
                risky++;
            }
        }
        int base = offensive * 4 + safe * 1 - risky * 3;

        if (winConditionIndex != null && bring.contains(winConditionIndex)) {
            boolean leading = bring.get(leadWithinBring.get(0)).equals(winConditionIndex)
                    || bring.get(leadWithinBring.get(1)).equals(winConditionIndex);
            base += leading ? 2 : 6;
        }

        // Mega priority: strongly prefer bringing the Mega; accept non-Mega plan only when matchup heavily disfavours
        // it.
        int megaIndex = findMegaIndex(myTeam);
        if (megaIndex >= 0) {
            if (bring.contains(megaIndex)) {
                base += 5;
                boolean megaLeading = bring.get(leadWithinBring.get(0)).equals(megaIndex)
                        || bring.get(leadWithinBring.get(1)).equals(megaIndex);
                if (megaLeading) base += 2;
            } else {
                base -= 6;
            }
        }

        // Support-kit credit: each support tag in the bring adds to the score (capped at +6).
        int supportBonus = 0;
        for (int idx : bring) {
            for (String tag : myTeam.get(idx).supportTags()) {
                supportBonus += switch (tag) {
                    case "speed-control", "redirection" -> 3;
                    case "screens", "fake-out", "defense-shred" -> 2;
                    case "helping-hand" -> 1;
                    default -> 0;
                };
            }
        }
        base += Math.min(supportBonus, 6);

        return base;
    }

    private static int findMegaIndex(List<PreviewPokemonCommand> team) {
        for (int i = 0; i < team.size(); i++) {
            if (team.get(i).isMega()) return i;
        }
        return -1;
    }

    private List<PlanCandidate> selectDiverse(List<PlanCandidate> sorted) {
        List<PlanCandidate> selected = new ArrayList<>();
        Set<Long> usedLeadKeys = new HashSet<>();
        for (PlanCandidate c : sorted) {
            if (selected.size() >= MAX_PLANS) break;
            int g0 = c.bring().get(c.leadWithinBring().get(0));
            int g1 = c.bring().get(c.leadWithinBring().get(1));
            long leadKey = pairKey(Math.min(g0, g1), Math.max(g0, g1));
            if (!usedLeadKeys.contains(leadKey) || selected.isEmpty()) {
                selected.add(c);
                usedLeadKeys.add(leadKey);
            }
        }
        // Backfill if not enough diverse plans exist.
        if (selected.size() < MAX_PLANS) {
            for (PlanCandidate c : sorted) {
                if (selected.size() >= MAX_PLANS) break;
                if (!selected.contains(c)) selected.add(c);
            }
        }
        return selected;
    }

    private PlanRecommendation buildRecommendation(
            PlanCandidate candidate,
            List<PreviewPokemonCommand> myTeam,
            List<PreviewPokemonCommand> opponentTeam,
            Integer winConditionIndex) {
        List<Integer> bringIndices = candidate.bring();
        List<Integer> leadWithinBring = candidate.leadWithinBring();
        EvaluateLeadsResult eval = candidate.eval();

        boolean winConditionSupported = winConditionIndex != null && bringIndices.contains(winConditionIndex);

        String winConditionRole;
        if (winConditionIndex == null) {
            winConditionRole = "none";
        } else if (bringIndices.contains(winConditionIndex)) {
            boolean leading = bringIndices.get(leadWithinBring.get(0)).equals(winConditionIndex)
                    || bringIndices.get(leadWithinBring.get(1)).equals(winConditionIndex);
            winConditionRole = leading ? "leading" : "backline";
        } else {
            winConditionRole = "benched";
        }

        List<String> modesCovered = eval.matchups().stream()
                .filter(m -> coverageScore(m) > 0)
                .sorted(Comparator.comparingDouble(RecommendPlansService::coverageScore)
                        .reversed())
                .limit(3)
                .map(m -> String.join(" + ", m.opponentLeadNames()))
                .toList();

        List<String> modesAtRisk = eval.matchups().stream()
                .filter(m -> m.incomingDanger().value() >= 2)
                .sorted(Comparator.comparingDouble(RecommendPlansService::dangerScore)
                        .reversed())
                .limit(3)
                .map(m -> String.join(" + ", m.opponentLeadNames()))
                .toList();

        int riskyCount = (int) eval.matchups().stream()
                .filter(m -> m.incomingDanger().value() >= 2)
                .count();

        String predictionBurden;
        if (riskyCount <= 2) {
            predictionBurden = "low";
        } else if (riskyCount <= 6) {
            predictionBurden = "medium";
        } else {
            predictionBurden = "high";
        }

        String summary = buildSummary(bringIndices, leadWithinBring, myTeam, modesCovered, modesAtRisk);
        List<String> leftOutRationale = buildLeftOutRationale(bringIndices, myTeam);

        return new PlanRecommendation(
                bringIndices,
                leadWithinBring,
                summary,
                modesCovered,
                modesAtRisk,
                winConditionSupported,
                leftOutRationale,
                predictionBurden,
                winConditionRole);
    }

    private String buildSummary(
            List<Integer> bringIndices,
            List<Integer> leadWithinBring,
            List<PreviewPokemonCommand> myTeam,
            List<String> modesCovered,
            List<String> modesAtRisk) {
        String lead0 = myTeam.get(bringIndices.get(leadWithinBring.get(0))).displayName();
        String lead1 = myTeam.get(bringIndices.get(leadWithinBring.get(1))).displayName();
        String leadStr = lead0 + " + " + lead1;
        if (modesCovered.isEmpty() && modesAtRisk.isEmpty()) {
            return "Lead " + leadStr + ". Stable matchup profile.";
        }
        if (modesCovered.isEmpty()) {
            return "Lead " + leadStr + ". Requires careful play against " + modesAtRisk.get(0) + ".";
        }
        if (modesAtRisk.isEmpty()) {
            return "Lead " + leadStr + ". Strong into " + modesCovered.get(0) + " and more.";
        }
        return "Lead " + leadStr + ". Covers " + modesCovered.get(0) + "; watch for " + modesAtRisk.get(0) + ".";
    }

    private List<String> buildLeftOutRationale(List<Integer> bringIndices, List<PreviewPokemonCommand> myTeam) {
        List<String> rationale = new ArrayList<>();
        for (int i = 0; i < myTeam.size(); i++) {
            if (!bringIndices.contains(i)) {
                String name = myTeam.get(i).displayName();
                rationale.add(name + ": left out — coverage handled by the core four.");
            }
        }
        return rationale;
    }

    private List<PlanCandidate> applyMegaEscapeValve(
            List<PlanCandidate> selected, List<PlanCandidate> allSorted, List<PreviewPokemonCommand> myTeam) {
        int megaIndex = findMegaIndex(myTeam);
        if (megaIndex < 0) return selected;

        boolean allBringMega = selected.stream().allMatch(c -> c.bring().contains(megaIndex));
        if (!allBringMega) return selected;

        // All top-3 bring Mega. Find best non-Mega candidate.
        allSorted.stream()
                .filter(c -> !c.bring().contains(megaIndex))
                .findFirst()
                .ifPresent(nonMega -> {
                    int lowestScore = selected.stream()
                            .mapToInt(PlanCandidate::score)
                            .min()
                            .getAsInt();
                    if (nonMega.score() >= lowestScore - 4) {
                        PlanCandidate toRemove = selected.stream()
                                .min(Comparator.comparingInt(PlanCandidate::score))
                                .get();
                        selected.remove(toRemove);
                        selected.add(nonMega);
                    }
                });
        return selected;
    }

    private static double coverageScore(LeadMatchupResult m) {
        return m.koPressure().value() * 3.0
                + m.doubleUpPressure().value() * 3.0
                + m.twoHitKoPressure().value() * 1.0
                - m.incomingDanger().value() * 2.0;
    }

    private static double dangerScore(LeadMatchupResult m) {
        return m.incomingDanger().value() * 3.0 - m.speedComparison().value() * 1.0;
    }

    // --- utilities ---

    private static List<int[]> combinations(int n, int k) {
        List<int[]> result = new ArrayList<>();
        combinationsHelper(n, k, 0, new int[k], result);
        return result;
    }

    private static void combinationsHelper(int n, int k, int start, int[] current, List<int[]> result) {
        if (k == 0) {
            result.add(current.clone());
            return;
        }
        for (int i = start; i < n; i++) {
            current[current.length - k] = i;
            combinationsHelper(n, k - 1, i + 1, current, result);
        }
    }

    private static long pairKey(int i, int j) {
        return (long) i * 10 + j;
    }

    private static List<Integer> toList(int[] arr) {
        List<Integer> list = new ArrayList<>(arr.length);
        for (int v : arr) list.add(v);
        return list;
    }

    private record PlanCandidate(
            List<Integer> bring, List<Integer> leadWithinBring, int score, EvaluateLeadsResult eval) {}
}
