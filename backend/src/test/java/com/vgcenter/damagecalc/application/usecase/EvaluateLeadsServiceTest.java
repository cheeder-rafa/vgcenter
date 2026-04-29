package com.vgcenter.damagecalc.application.usecase;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.List;
import java.util.Map;
import org.junit.jupiter.api.Test;

class EvaluateLeadsServiceTest {

    private final RecordingDamageUseCase damageUseCase = new RecordingDamageUseCase();
    private final EvaluateLeadsService service = new EvaluateLeadsService(damageUseCase);

    @Test
    void evaluatesSelectedLeadPairIntoAllFifteenOpponentPairs() {
        damageUseCase.nextResults = List.of(
                result(120, 130, "guaranteed OHKO", 1, 1.0d),
                result(45, 55, "guaranteed 2HKO", 2, 1.0d),
                result(35, 40, "guaranteed 3HKO", 3, 1.0d));

        EvaluateLeadsResult result = service.evaluate(new EvaluateLeadsCommand(
                "M-A", List.of(pokemon("flutter-mane", 200), pokemon("incineroar", 80)), opponentTeam(), field()));

        assertThat(result.matchups()).hasSize(15);
        assertThat(result.matchups().getFirst().opponentLeadIds()).containsExactly("opponent-1", "opponent-2");
        assertThat(result.matchups().getFirst().koPressure().label()).isEqualTo("Your OHKOs");
        assertThat(result.matchups().getFirst().twoHitKoPressure().label()).isEqualTo("Your 2HKOs");
        assertThat(result.matchups().getFirst().doubleUpPressure().label()).isEqualTo("Combined KOs");
        assertThat(result.matchups().getFirst().incomingDanger().label()).isEqualTo("Threats on you");
        assertThat(result.matchups().getFirst().speedComparison().label()).isEqualTo("You outspeed");
        assertThat(result.matchups().getFirst().mustReactLabels()).isNotEmpty();
        assertThat(result.matchups().getFirst().turnOneAnnotations()).isNotEmpty();
        assertThat(damageUseCase.commands).isNotEmpty();
    }

    @Test
    void populatesPerCellSummaryAndMatrixSummary() {
        damageUseCase.nextResults = List.of(result(120, 130, "guaranteed OHKO", 1, 1.0d));

        EvaluateLeadsResult result = service.evaluate(new EvaluateLeadsCommand(
                "M-A", List.of(pokemon("flutter-mane", 200), pokemon("incineroar", 80)), opponentTeam(), field()));

        for (LeadMatchupResult cell : result.matchups()) {
            assertThat(cell.summary()).isNotBlank();
        }
        Verdict matrix = result.matrixSummary();
        assertThat(matrix).isNotNull();
        assertThat(matrix.headline()).contains("flutter-mane");
        assertThat(matrix.headline().length()).isLessThanOrEqualTo(Verdict.HEADLINE_MAX);
        assertThat(matrix.subline().length()).isLessThanOrEqualTo(Verdict.SUBLINE_MAX);
    }

    @Test
    void includesHitEvidenceSummariesInMatchupResult() {
        damageUseCase.nextResults = List.of(result(100, 120, "guaranteed OHKO", 1, 1.0d));

        EvaluateLeadsResult result = service.evaluate(new EvaluateLeadsCommand(
                "M-A", List.of(pokemon("flutter-mane", 200), pokemon("incineroar", 80)), opponentTeam(), field()));

        LeadMatchupResult first = result.matchups().getFirst();
        assertThat(first.outgoingEvidence()).isNotEmpty();
        assertThat(first.incomingEvidence()).isNotEmpty();
        assertThat(first.outgoingEvidence().getFirst().selectedAttacking()).isTrue();
        assertThat(first.incomingEvidence().getFirst().selectedAttacking()).isFalse();
        assertThat(first.outgoingEvidence().getFirst().minPct()).isGreaterThan(0);
        assertThat(first.outgoingEvidence().getFirst().moveType()).isNotBlank();
        assertThat(first.outgoingEvidence().getFirst().attackerName()).isEqualTo("flutter-mane");
    }

    @Test
    void marksSlowLeadsAsMustReactWhenOpponentCanHitFirst() {
        damageUseCase.nextResults = List.of(result(20, 25, "guaranteed 4HKO", 4, 1.0d));

        EvaluateLeadsResult result = service.evaluate(new EvaluateLeadsCommand(
                "M-A", List.of(pokemon("slow-left", 40), pokemon("slow-right", 35)), opponentTeam(), field()));

        assertThat(result.matchups().getFirst().mustReactLabels()).anyMatch(label -> label.contains("move first"));
    }

    @Test
    void picksBestEvidenceByExpectedDamageWeightedByAccuracy() {
        CalculateDamageUseCase scoringUseCase = command -> {
            if ("FAIRY".equals(command.move().type())) {
                return new CalculateDamageResult(
                        new int[] {10, 10, 10, 10, 10, 10, 10, 10, 90, 90, 90, 90, 90, 90, 90, 90},
                        10,
                        90,
                        10,
                        90,
                        new KoChanceResult("possible KO", 0.5, 1));
            }
            return new CalculateDamageResult(
                    new int[] {52, 52, 52, 52, 52, 52, 52, 52, 68, 68, 68, 68, 68, 68, 68, 68},
                    52,
                    68,
                    52,
                    68,
                    new KoChanceResult("possible KO", 0.5, 1));
        };
        EvaluateLeadsService localService = new EvaluateLeadsService(scoringUseCase);
        PreviewPokemonCommand selected = new PreviewPokemonCommand(
                "picker",
                "picker",
                combatant(120),
                List.of(
                        new MoveCommand("FAIRY", "SPECIAL", 95, false, false, false, false, 0.5d, false),
                        new MoveCommand("FIRE", "SPECIAL", 95, false, false, false, false, 1.0d, false)),
                false,
                0,
                List.of());
        PreviewPokemonCommand opponent = pokemon("target", 100);

        DamageMatrix matrix = localService.buildMatrix("M-A", List.of(selected), List.of(opponent), field());

        assertThat(matrix.bestOutgoing()[0][0]).isNotNull();
        assertThat(matrix.bestOutgoing()[0][0].move().type()).isEqualTo("FIRE");
    }

    @Test
    void koPressureCountsOnlyLikelyKos() {
        PreviewPokemonCommand selectedA = pokemon("selected-a", 120);
        PreviewPokemonCommand selectedB = pokemon("selected-b", 110);
        PreviewPokemonCommand oppA = pokemon("opp-a", 100);
        PreviewPokemonCommand oppB = pokemon("opp-b", 90);

        HitEvidence likelyKo = hitEvidence(selectedA, oppA, 70, 100, 0.6);
        HitEvidence unlikelyKo = hitEvidence(selectedA, oppB, 70, 100, 0.4);
        HitEvidence neutralA = hitEvidence(selectedB, oppA, 20, 30, 0.1);
        HitEvidence neutralB = hitEvidence(selectedB, oppB, 20, 30, 0.1);

        DamageMatrix matrix = new DamageMatrix(
                new HitEvidence[][] {{likelyKo, unlikelyKo}, {neutralA, neutralB}},
                new HitEvidence[][] {{neutralA, neutralB}, {neutralA, neutralB}});

        EvaluateLeadsResult result = service.evaluateFromMatrix(
                List.of(selectedA, selectedB), new int[] {0, 1}, List.of(oppA, oppB), matrix);

        assertThat(result.matchups()).hasSize(1);
        assertThat(result.matchups().getFirst().koPressure().value()).isEqualTo(1.0);
    }

    @Test
    void speedAnnotationsReportFasterSlowerAndTiedCounts() {
        PreviewPokemonCommand selectedA = pokemon("selected-a", 120);
        PreviewPokemonCommand selectedB = pokemon("selected-b", 100);
        PreviewPokemonCommand oppA = pokemon("opp-a", 110);
        PreviewPokemonCommand oppB = pokemon("opp-b", 100);

        HitEvidence neutral = hitEvidence(selectedA, oppA, 20, 30, 0.1);
        DamageMatrix matrix = new DamageMatrix(
                new HitEvidence[][] {{neutral, neutral}, {neutral, neutral}},
                new HitEvidence[][] {{neutral, neutral}, {neutral, neutral}});

        EvaluateLeadsResult result = service.evaluateFromMatrix(
                List.of(selectedA, selectedB), new int[] {0, 1}, List.of(oppA, oppB), matrix);

        assertThat(result.matchups().getFirst().turnOneAnnotations())
                .anyMatch(annotation -> annotation.contains("faster: 2")
                        && annotation.contains("slower: 1")
                        && annotation.contains("tied: 1"));
    }

    private static List<PreviewPokemonCommand> opponentTeam() {
        return List.of(
                pokemon("opponent-1", 130),
                pokemon("opponent-2", 120),
                pokemon("opponent-3", 110),
                pokemon("opponent-4", 100),
                pokemon("opponent-5", 90),
                pokemon("opponent-6", 85));
    }

    private static PreviewPokemonCommand pokemon(String id, int speed) {
        return new PreviewPokemonCommand(
                id,
                id,
                combatant(speed),
                List.of(move("FAIRY", "SPECIAL", 90), move("FIRE", "PHYSICAL", 80)),
                false,
                0,
                List.of());
    }

    private static CombatantCommand combatant(int speed) {
        return new CombatantCommand(
                50,
                new StatsCommand(100, 100, 100, 100, 100, speed),
                List.of("NORMAL"),
                "none",
                "none",
                "NONE",
                Map.of(),
                true,
                100);
    }

    private static MoveCommand move(String type, String category, int power) {
        return new MoveCommand(type, category, power, false, false, false, false);
    }

    private static HitEvidence hitEvidence(
            PreviewPokemonCommand attacker, PreviewPokemonCommand defender, int min, int max, double koProbability) {
        return new HitEvidence(
                attacker,
                defender,
                move("NORMAL", "SPECIAL", 80),
                new CalculateDamageResult(
                        rolls(min, max), min, max, min, max, new KoChanceResult("possible KO", koProbability, 1)));
    }

    private static PreviewFieldCommand field() {
        return new PreviewFieldCommand(
                new FieldCommand("CLEAR", "NONE", "NONE"),
                new SideConditionsCommand(false, false, false, false, false, false, false),
                new SideConditionsCommand(false, false, false, false, false, false, false),
                false,
                1);
    }

    private static CalculateDamageResult result(String koDescription, int hits) {
        return result(40, 50, koDescription, hits, hits == 1 ? 1.0d : 0.5d);
    }

    private static CalculateDamageResult result(int min, int max, String koDescription, int hits, double probability) {
        return new CalculateDamageResult(
                rolls(min, max), min, max, min, max, new KoChanceResult(koDescription, probability, hits));
    }

    private static int[] rolls(int min, int max) {
        int[] output = new int[16];
        for (int i = 0; i < 16; i++) {
            output[i] = i < 8 ? min : max;
        }
        return output;
    }

    private static final class RecordingDamageUseCase implements CalculateDamageUseCase {
        private List<CalculateDamageResult> nextResults = List.of(result("guaranteed 3HKO", 3));
        private final java.util.concurrent.CopyOnWriteArrayList<CalculateDamageCommand> commands =
                new java.util.concurrent.CopyOnWriteArrayList<>();
        private final java.util.concurrent.atomic.AtomicInteger index =
                new java.util.concurrent.atomic.AtomicInteger(0);

        @Override
        public CalculateDamageResult calculate(CalculateDamageCommand command) {
            commands.add(command);
            int i = index.getAndIncrement();
            return nextResults.get(i % nextResults.size());
        }
    }
}
