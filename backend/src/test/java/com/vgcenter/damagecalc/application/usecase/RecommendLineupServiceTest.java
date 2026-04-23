package com.vgcenter.damagecalc.application.usecase;

import static org.assertj.core.api.Assertions.assertThat;

import com.vgcenter.damagecalc.domain.gameplan.MatchupScore;
import com.vgcenter.damagecalc.domain.gameplan.TurnOneFlags;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import org.junit.jupiter.api.Test;

class RecommendLineupServiceTest {

    private final StubEvaluateMatchupUseCase evaluateMatchupUseCase = new StubEvaluateMatchupUseCase();
    private final RecommendLineupService service = new RecommendLineupService(evaluateMatchupUseCase);

    @Test
    void evaluatesFortyFiveLineupPermutationsAndReturnsTheTopThree() {
        RecommendLineupResult result =
                service.recommend(new RecommendLineupCommand("M-A", myTeam(), 4, opponentTeam()));

        assertThat(evaluateMatchupUseCase.commands).hasSize(45);
        assertThat(result.recommendations()).hasSize(3);
        assertThat(result.evaluatedLineups()).isEqualTo(45);

        assertThat(result.recommendations().get(0).lineupSpeciesIds())
                .containsExactly("mine-2", "mine-3", "mine-4", "mine-5");
        assertThat(result.recommendations().get(0).lineupIndices()).containsExactly(2, 3, 4, 5);
        assertThat(result.recommendations().get(0).averageScore()).isEqualTo(14.0d);
        assertThat(result.recommendations().get(0).cells()).hasSize(15);
        assertThat(result.recommendations().get(0).winConditionIndex()).isEqualTo(2);

        assertThat(result.recommendations())
                .extracting(RecommendationResult::averageScore)
                .containsExactly(14.0d, 14.0d, 14.0d);
    }

    private List<EvaluateMatchupPokemonCommand> myTeam() {
        return List.of(
                pokemon("mine-0", 100),
                pokemon("mine-1", 110),
                pokemon("mine-2", 120),
                pokemon("mine-3", 130),
                pokemon("mine-4", 140),
                pokemon("mine-5", 150));
    }

    private List<EvaluateMatchupPokemonCommand> opponentTeam() {
        return List.of(
                pokemon("opp-0", 90),
                pokemon("opp-1", 91),
                pokemon("opp-2", 92),
                pokemon("opp-3", 93),
                pokemon("opp-4", 94),
                pokemon("opp-5", 95));
    }

    private EvaluateMatchupPokemonCommand pokemon(String speciesId, int speed) {
        return new EvaluateMatchupPokemonCommand(
                speciesId,
                new CombatantCommand(
                        50,
                        new StatsCommand(150, 100, 100, 100, 100, speed),
                        List.of("NORMAL"),
                        "ability",
                        "item",
                        "NONE",
                        Map.of(),
                        true,
                        150),
                List.of("move-a", "move-b", "move-c", "move-d"),
                List.of());
    }

    private static final class StubEvaluateMatchupUseCase implements EvaluateMatchupUseCase {

        private final List<EvaluateMatchupCommand> commands = new ArrayList<>();

        @Override
        public EvaluateMatchupResult evaluate(EvaluateMatchupCommand command) {
            commands.add(command);
            int score = command.mine().lineup().stream()
                    .map(EvaluateMatchupPokemonCommand::speciesId)
                    .mapToInt(speciesId -> Integer.parseInt(speciesId.substring("mine-".length())))
                    .sum();
            List<MatchupCellResult> cells = new ArrayList<>();
            for (int first = 0; first < 6; first++) {
                for (int second = first + 1; second < 6; second++) {
                    cells.add(new MatchupCellResult(
                            first,
                            second,
                            List.of("opp-" + first, "opp-" + second),
                            new MatchupScore(score, score, 0, 0, 0),
                            new TurnOneFlags(false, false, false, false, TurnOneFlags.SpeedControl.NONE),
                            new TurnOneFlags(false, false, false, false, TurnOneFlags.SpeedControl.NONE),
                            List.of(),
                            List.of()));
                }
            }
            return new EvaluateMatchupResult(cells);
        }
    }
}
