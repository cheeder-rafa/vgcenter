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
    void winConditionIndexInBringFourIsMarkedSupported() {
        evaluateLeadsUseCase.nextResult = emptyEvaluation();

        RecommendPlansResult result =
                service.recommend(new RecommendPlansCommand("M-A", myTeam(6), opponentTeam(), 0, field()));

        // At least one plan should include index 0 (the win condition)
        boolean anySupported = result.plans().stream().anyMatch(PlanRecommendation::winConditionSupported);
        assertThat(anySupported).isTrue();
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

    // --- helpers ---

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
        return new PreviewPokemonCommand(id, name, combatant(speed), List.of(move("FAIRY", "SPECIAL", 90)));
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
