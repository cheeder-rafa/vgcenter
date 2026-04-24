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
    void marksSlowLeadsAsMustReactWhenOpponentCanHitFirst() {
        damageUseCase.nextResults = List.of(result(20, 25, "guaranteed 4HKO", 4, 1.0d));

        EvaluateLeadsResult result = service.evaluate(new EvaluateLeadsCommand(
                "M-A", List.of(pokemon("slow-left", 40), pokemon("slow-right", 35)), opponentTeam(), field()));

        assertThat(result.matchups().getFirst().mustReactLabels()).anyMatch(label -> label.contains("move first"));
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
                id, id, combatant(speed), List.of(move("FAIRY", "SPECIAL", 90), move("FIRE", "PHYSICAL", 80)));
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
                new int[] {min, min, min, min, min, min, min, min, max, max, max, max, max, max, max, max},
                min,
                max,
                min,
                max,
                new KoChanceResult(koDescription, probability, hits));
    }

    private static final class RecordingDamageUseCase implements CalculateDamageUseCase {
        private List<CalculateDamageResult> nextResults = List.of(result("guaranteed 3HKO", 3));
        private final java.util.ArrayList<CalculateDamageCommand> commands = new java.util.ArrayList<>();
        private int index;

        @Override
        public CalculateDamageResult calculate(CalculateDamageCommand command) {
            commands.add(command);
            CalculateDamageResult result = nextResults.get(index % nextResults.size());
            index++;
            return result;
        }
    }
}
