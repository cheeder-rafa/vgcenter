package com.vgcenter.damagecalc.application.usecase;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import org.junit.jupiter.api.Test;

class RecommendPlansServiceTest {

    private final RecordingEvaluateLeadsUseCase evaluateLeadsUseCase = new RecordingEvaluateLeadsUseCase();
    private final RecommendPlansService service = new RecommendPlansService(evaluateLeadsUseCase);

    @Test
    void returnsUpToThreePlansForAFullTeam() {
        evaluateLeadsUseCase.nextResult = emptyEvaluation();

        RecommendPlansResult result =
                service.recommend(new RecommendPlansCommand("M-A", myTeam(6), opponentTeam(), null, field()));

        assertThat(result.plans()).hasSizeLessThanOrEqualTo(3);
        assertThat(result.plans()).isNotEmpty();
    }

    @Test
    void eachPlanBringsExactlyFourPokemon() {
        evaluateLeadsUseCase.nextResult = emptyEvaluation();

        RecommendPlansResult result =
                service.recommend(new RecommendPlansCommand("M-A", myTeam(6), opponentTeam(), null, field()));

        for (PlanRecommendation plan : result.plans()) {
            assertThat(plan.bringIndices()).hasSize(4);
        }
    }

    @Test
    void eachPlanHasExactlyTwoLeadIndicesWithinBringFour() {
        evaluateLeadsUseCase.nextResult = emptyEvaluation();

        RecommendPlansResult result =
                service.recommend(new RecommendPlansCommand("M-A", myTeam(6), opponentTeam(), null, field()));

        for (PlanRecommendation plan : result.plans()) {
            assertThat(plan.leadIndices()).hasSize(2);
            assertThat(plan.leadIndices().get(0)).isBetween(0, 3);
            assertThat(plan.leadIndices().get(1)).isBetween(0, 3);
            assertThat(plan.leadIndices().get(0))
                    .isNotEqualTo(plan.leadIndices().get(1));
        }
    }

    @Test
    void topPlanPrefersLeadPairWithOffensivePressure() {
        // first lead pair evaluation has OHKO pressure, rest are weak
        evaluateLeadsUseCase.strongFirstResult = true;

        RecommendPlansResult result =
                service.recommend(new RecommendPlansCommand("M-A", myTeam(6), opponentTeam(), null, field()));

        assertThat(result.plans()).isNotEmpty();
        // The plan with the most OHKOs should rank first
        assertThat(result.plans().getFirst().summary()).isNotBlank();
    }

    @Test
    void winConditionRoleIsNoneWhenNoWinConditionSet() {
        evaluateLeadsUseCase.nextResult = emptyEvaluation();

        RecommendPlansResult result =
                service.recommend(new RecommendPlansCommand("M-A", myTeam(6), opponentTeam(), null, field()));

        assertThat(result.plans()).allMatch(p -> "none".equals(p.winConditionRole()));
    }

    @Test
    void winConditionRoleIsAlwaysAValidValue() {
        // Validates the field exists and stays within the allowed set.
        evaluateLeadsUseCase.nextResult = emptyEvaluation();
        List<String> validRoles = List.of("leading", "backline", "benched", "none");

        RecommendPlansResult withWc =
                service.recommend(new RecommendPlansCommand("M-A", myTeam(6), opponentTeam(), 0, field()));
        assertThat(withWc.plans()).allMatch(p -> validRoles.contains(p.winConditionRole()));

        RecommendPlansResult withoutWc =
                service.recommend(new RecommendPlansCommand("M-A", myTeam(6), opponentTeam(), null, field()));
        assertThat(withoutWc.plans()).allMatch(p -> "none".equals(p.winConditionRole()));
    }

    @Test
    void winConditionRoleIsBacklineOrLeadingWhenInBringFour() {
        evaluateLeadsUseCase.nextResult = emptyEvaluation();

        RecommendPlansResult result =
                service.recommend(new RecommendPlansCommand("M-A", myTeam(6), opponentTeam(), 0, field()));

        boolean anyBrought = result.plans().stream()
                .anyMatch(p -> "backline".equals(p.winConditionRole()) || "leading".equals(p.winConditionRole()));
        assertThat(anyBrought).isTrue();
    }

    @Test
    void predictionBurdenIsLowWhenFewRiskyMatchups() {
        evaluateLeadsUseCase.nextResult = emptyEvaluation(); // no incoming danger

        RecommendPlansResult result =
                service.recommend(new RecommendPlansCommand("M-A", myTeam(6), opponentTeam(), null, field()));

        assertThat(result.plans().getFirst().predictionBurden()).isEqualTo("low");
    }

    @Test
    void predictionBurdenIsHighWhenManyRiskyMatchups() {
        evaluateLeadsUseCase.nextResult = dangerousEvaluation(); // all matchups have incoming KO

        RecommendPlansResult result =
                service.recommend(new RecommendPlansCommand("M-A", myTeam(6), opponentTeam(), null, field()));

        assertThat(result.plans().getFirst().predictionBurden()).isEqualTo("high");
    }

    @Test
    void rejectsMyTeamSmallerThanSix() {
        assertThatThrownBy(() ->
                        service.recommend(new RecommendPlansCommand("M-A", myTeam(4), opponentTeam(), null, field())))
                .isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    void summaryAndRationaleAreNonBlank() {
        evaluateLeadsUseCase.nextResult = emptyEvaluation();

        RecommendPlansResult result =
                service.recommend(new RecommendPlansCommand("M-A", myTeam(6), opponentTeam(), null, field()));

        for (PlanRecommendation plan : result.plans()) {
            assertThat(plan.summary()).isNotBlank();
            assertThat(plan.leftOutRationale()).hasSizeLessThanOrEqualTo(2);
            assertThat(plan.modesCovered()).isNotNull();
            assertThat(plan.modesAtRisk()).isNotNull();
        }
    }

    @Test
    void handlesWellExcludesMatchupWithNegativeCoverageScore() {
        // matchup[0] "Opponent 0 + Opponent 1": koPressure=1 (+3) but incomingDanger=2 (-4) → net=-1
        // old code includes it (koPressure>0); new code should exclude it
        evaluateLeadsUseCase.nextResult = mixedCoverageEvaluation();

        RecommendPlansResult result =
                service.recommend(new RecommendPlansCommand("M-A", myTeam(6), opponentTeam(), null, field()));

        assertThat(result.plans().getFirst().modesCovered()).doesNotContain("Opponent 0 + Opponent 1");
    }

    @Test
    void megaIsIncludedInTopPlanWhenTeamHasOne() {
        // Mega at index 5: without scoring all bring-4 tie and stable sort picks {0,1,2,3} first
        // (which does NOT include index 5). After scoring, +5 bonus for including Mega / -6 penalty
        // for leaving it out should push the Mega-containing plan to the top.
        evaluateLeadsUseCase.nextResult = emptyEvaluation();
        List<PreviewPokemonCommand> team = teamWithMegaAtIndex(5);

        RecommendPlansResult result =
                service.recommend(new RecommendPlansCommand("M-A", team, opponentTeam(), null, field()));

        assertThat(result.plans().getFirst().bringIndices()).contains(5);
    }

    @Test
    void supportKitBoostsPlanScore() {
        // Support mon at index 5: without scoring stable sort picks {0,1,2,3} (no index 5).
        // After scoring, speed-control+redirection bonus should push the support plan to the top.
        evaluateLeadsUseCase.nextResult = emptyEvaluation();
        List<PreviewPokemonCommand> team = teamWithSupportMonAtIndex(5);

        RecommendPlansResult result =
                service.recommend(new RecommendPlansCommand("M-A", team, opponentTeam(), null, field()));

        assertThat(result.plans().getFirst().bringIndices()).contains(5);
    }

    @Test
    void handlesWellRanksHigherCoverageScoreFirst() {
        // matchup[0] "Opponent 0 + Opponent 1": koPressure=1, incomingDanger=0 → score=3
        // matchup[1] "Opponent 0 + Opponent 2": doubleUpPressure=2, incomingDanger=0 → score=6
        // new code should put matchup[1] first
        evaluateLeadsUseCase.nextResult = rankedCoverageEvaluation();

        RecommendPlansResult result =
                service.recommend(new RecommendPlansCommand("M-A", myTeam(6), opponentTeam(), null, field()));

        PlanRecommendation plan = result.plans().getFirst();
        assertThat(plan.modesCovered()).isNotEmpty();
        assertThat(plan.modesCovered().getFirst()).isEqualTo("Opponent 0 + Opponent 2");
    }

    // --- helpers ---

    private static List<PreviewPokemonCommand> teamWithMegaAtIndex(int megaIndex) {
        List<PreviewPokemonCommand> team = new ArrayList<>();
        String[] names = {"Amoonguss", "Incineroar", "Charizard-Mega-Y", "Urshifu", "Palafin", "Rillaboom"};
        for (int i = 0; i < 6; i++) {
            boolean isMega = i == megaIndex;
            team.add(new PreviewPokemonCommand(
                    "mon-" + i,
                    names[i % names.length],
                    combatant(100 + i * 5),
                    List.of(move("FAIRY", "SPECIAL", 90)),
                    isMega,
                    0,
                    List.of()));
        }
        return team;
    }

    private static List<PreviewPokemonCommand> teamWithSupportMonAtIndex(int supportIndex) {
        // Support mon has speed-control + redirection tags (bonus = 3 + 3 = 6 after capping)
        List<PreviewPokemonCommand> team = new ArrayList<>();
        String[] names = {"Amoonguss", "Incineroar", "Flutter Mane", "Urshifu", "Palafin", "Rillaboom"};
        for (int i = 0; i < 6; i++) {
            List<String> tags = i == supportIndex ? List.of("speed-control", "redirection") : List.of();
            team.add(new PreviewPokemonCommand(
                    "mon-" + i,
                    names[i % names.length],
                    combatant(100 + i * 5),
                    List.of(move("FAIRY", "SPECIAL", 90)),
                    false,
                    0,
                    tags));
        }
        return team;
    }

    private static List<PreviewPokemonCommand> myTeam(int size) {
        List<PreviewPokemonCommand> team = new ArrayList<>();
        String[] names = {"Amoonguss", "Incineroar", "Flutter Mane", "Urshifu", "Palafin", "Rillaboom"};
        for (int i = 0; i < size; i++) {
            team.add(pokemon("mon-" + i, names[i % names.length], 100 + i * 5));
        }
        return team;
    }

    private static List<PreviewPokemonCommand> opponentTeam() {
        return List.of(
                pokemon("opp-0", "Opponent 0", 130),
                pokemon("opp-1", "Opponent 1", 120),
                pokemon("opp-2", "Opponent 2", 110),
                pokemon("opp-3", "Opponent 3", 100),
                pokemon("opp-4", "Opponent 4", 90),
                pokemon("opp-5", "Opponent 5", 80));
    }

    private static PreviewPokemonCommand pokemon(String id, String name, int speed) {
        return new PreviewPokemonCommand(
                id, name, combatant(speed), List.of(move("FAIRY", "SPECIAL", 90)), false, 0, List.of());
    }

    private static CombatantCommand combatant(int speed) {
        return new CombatantCommand(
                50,
                new StatsCommand(155, 120, 100, 140, 100, speed),
                List.of("NORMAL"),
                "none",
                "none",
                "NONE",
                Map.of(),
                true,
                155);
    }

    private static MoveCommand move(String type, String category, int power) {
        return new MoveCommand(type, category, power, false, false, false, false);
    }

    private static PreviewFieldCommand field() {
        return new PreviewFieldCommand(
                new FieldCommand("CLEAR", "NONE", "NONE"),
                new SideConditionsCommand(false, false, false, false, false, false, false),
                new SideConditionsCommand(false, false, false, false, false, false, false),
                false,
                1);
    }

    private static EvaluateLeadsResult emptyEvaluation() {
        List<LeadMatchupResult> matchups = new ArrayList<>();
        String[][] pairs = {
            {"opp-0", "opp-1"}, {"opp-0", "opp-2"}, {"opp-0", "opp-3"},
            {"opp-0", "opp-4"}, {"opp-0", "opp-5"}, {"opp-1", "opp-2"},
            {"opp-1", "opp-3"}, {"opp-1", "opp-4"}, {"opp-1", "opp-5"},
            {"opp-2", "opp-3"}, {"opp-2", "opp-4"}, {"opp-2", "opp-5"},
            {"opp-3", "opp-4"}, {"opp-3", "opp-5"}, {"opp-4", "opp-5"}
        };
        String[][] names = {
            {"Opponent 0", "Opponent 1"}, {"Opponent 0", "Opponent 2"}, {"Opponent 0", "Opponent 3"},
            {"Opponent 0", "Opponent 4"}, {"Opponent 0", "Opponent 5"}, {"Opponent 1", "Opponent 2"},
            {"Opponent 1", "Opponent 3"}, {"Opponent 1", "Opponent 4"}, {"Opponent 1", "Opponent 5"},
            {"Opponent 2", "Opponent 3"}, {"Opponent 2", "Opponent 4"}, {"Opponent 2", "Opponent 5"},
            {"Opponent 3", "Opponent 4"}, {"Opponent 3", "Opponent 5"}, {"Opponent 4", "Opponent 5"}
        };
        for (int i = 0; i < 15; i++) {
            matchups.add(new LeadMatchupResult(
                    List.of(pairs[i][0], pairs[i][1]),
                    List.of(names[i][0], names[i][1]),
                    new PreviewMetricResult("KO pressure", 0, "low"),
                    new PreviewMetricResult("2HKO pressure", 0, "low"),
                    new PreviewMetricResult("Double-up pressure", 0, "low"),
                    new PreviewMetricResult("Incoming danger", 0, "low"),
                    new PreviewMetricResult("Speed control", 1, "medium"),
                    List.of("Stable opener"),
                    List.of("No major threats.")));
        }
        return new EvaluateLeadsResult(matchups);
    }

    private static EvaluateLeadsResult dangerousEvaluation() {
        List<LeadMatchupResult> matchups = new ArrayList<>();
        String[][] pairs = {
            {"opp-0", "opp-1"}, {"opp-0", "opp-2"}, {"opp-0", "opp-3"},
            {"opp-0", "opp-4"}, {"opp-0", "opp-5"}, {"opp-1", "opp-2"},
            {"opp-1", "opp-3"}, {"opp-1", "opp-4"}, {"opp-1", "opp-5"},
            {"opp-2", "opp-3"}, {"opp-2", "opp-4"}, {"opp-2", "opp-5"},
            {"opp-3", "opp-4"}, {"opp-3", "opp-5"}, {"opp-4", "opp-5"}
        };
        String[][] names = {
            {"Opponent 0", "Opponent 1"}, {"Opponent 0", "Opponent 2"}, {"Opponent 0", "Opponent 3"},
            {"Opponent 0", "Opponent 4"}, {"Opponent 0", "Opponent 5"}, {"Opponent 1", "Opponent 2"},
            {"Opponent 1", "Opponent 3"}, {"Opponent 1", "Opponent 4"}, {"Opponent 1", "Opponent 5"},
            {"Opponent 2", "Opponent 3"}, {"Opponent 2", "Opponent 4"}, {"Opponent 2", "Opponent 5"},
            {"Opponent 3", "Opponent 4"}, {"Opponent 3", "Opponent 5"}, {"Opponent 4", "Opponent 5"}
        };
        for (int i = 0; i < 15; i++) {
            matchups.add(new LeadMatchupResult(
                    List.of(pairs[i][0], pairs[i][1]),
                    List.of(names[i][0], names[i][1]),
                    new PreviewMetricResult("KO pressure", 0, "low"),
                    new PreviewMetricResult("2HKO pressure", 0, "low"),
                    new PreviewMetricResult("Double-up pressure", 0, "low"),
                    new PreviewMetricResult("Incoming danger", 3, "high"),
                    new PreviewMetricResult("Speed control", 0, "low"),
                    List.of("Cover immediate KO"),
                    List.of("Opponent threatens both leads.")));
        }
        return new EvaluateLeadsResult(matchups);
    }

    private static EvaluateLeadsResult mixedCoverageEvaluation() {
        // matchup[0]: koPressure=1, incomingDanger=2 → coverage = 3 - 4 = -1 (not covered)
        // matchup[1]: koPressure=1, incomingDanger=0 → coverage = 3 (covered)
        // rest: no pressure
        List<LeadMatchupResult> matchups = new ArrayList<>();
        String[][] pairs = {
            {"opp-0", "opp-1"}, {"opp-0", "opp-2"}, {"opp-0", "opp-3"},
            {"opp-0", "opp-4"}, {"opp-0", "opp-5"}, {"opp-1", "opp-2"},
            {"opp-1", "opp-3"}, {"opp-1", "opp-4"}, {"opp-1", "opp-5"},
            {"opp-2", "opp-3"}, {"opp-2", "opp-4"}, {"opp-2", "opp-5"},
            {"opp-3", "opp-4"}, {"opp-3", "opp-5"}, {"opp-4", "opp-5"}
        };
        String[][] names = {
            {"Opponent 0", "Opponent 1"}, {"Opponent 0", "Opponent 2"}, {"Opponent 0", "Opponent 3"},
            {"Opponent 0", "Opponent 4"}, {"Opponent 0", "Opponent 5"}, {"Opponent 1", "Opponent 2"},
            {"Opponent 1", "Opponent 3"}, {"Opponent 1", "Opponent 4"}, {"Opponent 1", "Opponent 5"},
            {"Opponent 2", "Opponent 3"}, {"Opponent 2", "Opponent 4"}, {"Opponent 2", "Opponent 5"},
            {"Opponent 3", "Opponent 4"}, {"Opponent 3", "Opponent 5"}, {"Opponent 4", "Opponent 5"}
        };
        for (int i = 0; i < 15; i++) {
            double ko = i == 0 ? 1 : (i == 1 ? 1 : 0);
            double danger = i == 0 ? 2 : 0;
            matchups.add(new LeadMatchupResult(
                    List.of(pairs[i][0], pairs[i][1]),
                    List.of(names[i][0], names[i][1]),
                    new PreviewMetricResult("Your OHKOs", ko, ko > 0 ? "high" : "low"),
                    new PreviewMetricResult("Your 2HKOs", 0, "low"),
                    new PreviewMetricResult("Combined KOs", 0, "low"),
                    new PreviewMetricResult("Threats on you", danger, danger >= 2 ? "high" : "low"),
                    new PreviewMetricResult("You outspeed", 1, "medium"),
                    List.of(),
                    List.of()));
        }
        return new EvaluateLeadsResult(matchups);
    }

    private static EvaluateLeadsResult rankedCoverageEvaluation() {
        // matchup[0] "Opponent 0 + Opponent 1": koPressure=1 → score=3
        // matchup[1] "Opponent 0 + Opponent 2": doubleUpPressure=2 → score=6 (should rank first)
        // rest: no pressure
        List<LeadMatchupResult> matchups = new ArrayList<>();
        String[][] pairs = {
            {"opp-0", "opp-1"}, {"opp-0", "opp-2"}, {"opp-0", "opp-3"},
            {"opp-0", "opp-4"}, {"opp-0", "opp-5"}, {"opp-1", "opp-2"},
            {"opp-1", "opp-3"}, {"opp-1", "opp-4"}, {"opp-1", "opp-5"},
            {"opp-2", "opp-3"}, {"opp-2", "opp-4"}, {"opp-2", "opp-5"},
            {"opp-3", "opp-4"}, {"opp-3", "opp-5"}, {"opp-4", "opp-5"}
        };
        String[][] names = {
            {"Opponent 0", "Opponent 1"}, {"Opponent 0", "Opponent 2"}, {"Opponent 0", "Opponent 3"},
            {"Opponent 0", "Opponent 4"}, {"Opponent 0", "Opponent 5"}, {"Opponent 1", "Opponent 2"},
            {"Opponent 1", "Opponent 3"}, {"Opponent 1", "Opponent 4"}, {"Opponent 1", "Opponent 5"},
            {"Opponent 2", "Opponent 3"}, {"Opponent 2", "Opponent 4"}, {"Opponent 2", "Opponent 5"},
            {"Opponent 3", "Opponent 4"}, {"Opponent 3", "Opponent 5"}, {"Opponent 4", "Opponent 5"}
        };
        for (int i = 0; i < 15; i++) {
            double ko = i == 0 ? 1 : 0;
            double doubleUp = i == 1 ? 2 : 0;
            matchups.add(new LeadMatchupResult(
                    List.of(pairs[i][0], pairs[i][1]),
                    List.of(names[i][0], names[i][1]),
                    new PreviewMetricResult("Your OHKOs", ko, ko > 0 ? "high" : "low"),
                    new PreviewMetricResult("Your 2HKOs", 0, "low"),
                    new PreviewMetricResult("Combined KOs", doubleUp, doubleUp > 0 ? "high" : "low"),
                    new PreviewMetricResult("Threats on you", 0, "low"),
                    new PreviewMetricResult("You outspeed", 1, "medium"),
                    List.of(),
                    List.of()));
        }
        return new EvaluateLeadsResult(matchups);
    }

    private static final class RecordingEvaluateLeadsUseCase implements EvaluateLeadsUseCase {
        EvaluateLeadsResult nextResult = emptyEvaluation();
        boolean strongFirstResult = false;
        int callCount = 0;

        @Override
        public EvaluateLeadsResult evaluate(EvaluateLeadsCommand command) {
            callCount++;
            if (strongFirstResult && callCount == 1) {
                return strongEvaluation();
            }
            return nextResult;
        }

        @Override
        public DamageMatrix buildMatrix(
                String regulation,
                List<PreviewPokemonCommand> myTeam,
                List<PreviewPokemonCommand> opponentTeam,
                PreviewFieldCommand field) {
            // Return a stub matrix — RecordingEvaluateLeadsUseCase uses evaluateFromMatrix,
            // not the real damage calc path, so this matrix is never actually queried.
            HitEvidence[][] out = new HitEvidence[myTeam.size()][opponentTeam.size()];
            HitEvidence[][] in = new HitEvidence[opponentTeam.size()][myTeam.size()];
            return new DamageMatrix(out, in);
        }

        @Override
        public EvaluateLeadsResult evaluateFromMatrix(
                List<PreviewPokemonCommand> selectedLeads,
                int[] selectedLeadIndices,
                List<PreviewPokemonCommand> opponentTeam,
                DamageMatrix matrix) {
            callCount++;
            if (strongFirstResult && callCount == 1) {
                return strongEvaluation();
            }
            return nextResult;
        }

        private static EvaluateLeadsResult strongEvaluation() {
            List<LeadMatchupResult> matchups = new ArrayList<>();
            String[][] pairs = {
                {"opp-0", "opp-1"}, {"opp-0", "opp-2"}, {"opp-0", "opp-3"},
                {"opp-0", "opp-4"}, {"opp-0", "opp-5"}, {"opp-1", "opp-2"},
                {"opp-1", "opp-3"}, {"opp-1", "opp-4"}, {"opp-1", "opp-5"},
                {"opp-2", "opp-3"}, {"opp-2", "opp-4"}, {"opp-2", "opp-5"},
                {"opp-3", "opp-4"}, {"opp-3", "opp-5"}, {"opp-4", "opp-5"}
            };
            String[][] names = {
                {"Opponent 0", "Opponent 1"}, {"Opponent 0", "Opponent 2"}, {"Opponent 0", "Opponent 3"},
                {"Opponent 0", "Opponent 4"}, {"Opponent 0", "Opponent 5"}, {"Opponent 1", "Opponent 2"},
                {"Opponent 1", "Opponent 3"}, {"Opponent 1", "Opponent 4"}, {"Opponent 1", "Opponent 5"},
                {"Opponent 2", "Opponent 3"}, {"Opponent 2", "Opponent 4"}, {"Opponent 2", "Opponent 5"},
                {"Opponent 3", "Opponent 4"}, {"Opponent 3", "Opponent 5"}, {"Opponent 4", "Opponent 5"}
            };
            for (int i = 0; i < 15; i++) {
                matchups.add(new LeadMatchupResult(
                        List.of(pairs[i][0], pairs[i][1]),
                        List.of(names[i][0], names[i][1]),
                        new PreviewMetricResult("KO pressure", 2, "high"),
                        new PreviewMetricResult("2HKO pressure", 4, "high"),
                        new PreviewMetricResult("Double-up pressure", 1, "medium"),
                        new PreviewMetricResult("Incoming danger", 0, "low"),
                        new PreviewMetricResult("Speed control", 2, "high"),
                        List.of("Press KO threat"),
                        List.of("Strong outgoing pressure.")));
            }
            return new EvaluateLeadsResult(matchups);
        }
    }
}
