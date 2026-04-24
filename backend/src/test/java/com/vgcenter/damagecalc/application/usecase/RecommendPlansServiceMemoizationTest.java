package com.vgcenter.damagecalc.application.usecase;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.concurrent.atomic.AtomicInteger;
import org.junit.jupiter.api.Test;

class RecommendPlansServiceMemoizationTest {

    private final CountingCalculateDamageUseCase calcSpy = new CountingCalculateDamageUseCase();
    private final EvaluateLeadsService evaluateLeadsService = new EvaluateLeadsService(calcSpy);
    private final RecommendPlansService service = new RecommendPlansService(evaluateLeadsService);

    @Test
    void recommendInvokesCalculateDamageAtMost288TimesForFullSixVsSix() {
        service.recommend(new RecommendPlansCommand("M-A", myTeam(), opponentTeam(), null, field()));

        // 6 my mons × 6 opp mons × 2 moves × 2 directions = 288 max
        // (each attacker-defender pair: best move = all moves evaluated, but here 2 moves per mon)
        assertThat(calcSpy.callCount.get()).isLessThanOrEqualTo(288);
    }

    @Test
    void recommendInvokesFarFewerCalculationsWithMemoizationThanNaiveApproach() {
        service.recommend(new RecommendPlansCommand("M-A", myTeam(), opponentTeam(), null, field()));

        // Naive (no memo): 15 lead pairs × 15 opp pairs × 2 selected × 2 opp × 2 moves × 2 dirs = 3600
        // Memoized: max 288. Verified that we're at least 10× better.
        assertThat(calcSpy.callCount.get()).isLessThan(360);
    }

    @Test
    void buildMatrixUsesVirtualThreadsForParallelComputation() throws InterruptedException {
        List<Boolean> virtualFlags = new ArrayList<>();

        CountingCalculateDamageUseCase threadCaptureSpy = new CountingCalculateDamageUseCase() {
            @Override
            public CalculateDamageResult calculate(CalculateDamageCommand command) {
                synchronized (virtualFlags) {
                    virtualFlags.add(Thread.currentThread().isVirtual());
                }
                return super.calculate(command);
            }
        };

        EvaluateLeadsService svc = new EvaluateLeadsService(threadCaptureSpy);
        new RecommendPlansService(svc)
                .recommend(new RecommendPlansCommand("M-A", myTeam(), opponentTeam(), null, field()));

        assertThat(virtualFlags).isNotEmpty();
        assertThat(virtualFlags).contains(true);
    }

    // --- helpers ---

    private static List<PreviewPokemonCommand> myTeam() {
        String[] names = {"Amoonguss", "Incineroar", "Flutter Mane", "Urshifu", "Palafin", "Rillaboom"};
        List<PreviewPokemonCommand> team = new ArrayList<>();
        for (int i = 0; i < 6; i++) {
            team.add(pokemon("my-" + i, names[i], 100 + i * 5));
        }
        return team;
    }

    private static List<PreviewPokemonCommand> opponentTeam() {
        List<PreviewPokemonCommand> team = new ArrayList<>();
        for (int i = 0; i < 6; i++) {
            team.add(pokemon("opp-" + i, "Opponent " + i, 120 - i * 5));
        }
        return team;
    }

    private static PreviewPokemonCommand pokemon(String id, String name, int speed) {
        return new PreviewPokemonCommand(
                id,
                name,
                combatant(speed),
                List.of(move("FAIRY", "SPECIAL", 90), move("FIRE", "PHYSICAL", 80)),
                false,
                0,
                List.of());
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

    private static class CountingCalculateDamageUseCase implements CalculateDamageUseCase {
        final AtomicInteger callCount = new AtomicInteger(0);

        @Override
        public CalculateDamageResult calculate(CalculateDamageCommand command) {
            callCount.incrementAndGet();
            int hp = command.defender().currentHp();
            int min = hp / 3;
            int max = hp / 2;
            return new CalculateDamageResult(
                    new int[] {min, min, min, min, min, min, min, min, max, max, max, max, max, max, max, max},
                    min,
                    max,
                    min,
                    max,
                    new KoChanceResult("guaranteed 3HKO", 0.5d, 3));
        }
    }
}
