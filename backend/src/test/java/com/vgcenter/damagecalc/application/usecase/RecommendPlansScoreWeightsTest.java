package com.vgcenter.damagecalc.application.usecase;

import static org.assertj.core.api.Assertions.assertThat;

import java.lang.reflect.Method;
import java.util.List;
import java.util.Map;
import org.junit.jupiter.api.Test;

class RecommendPlansScoreWeightsTest {

    private final RecommendPlansService service = new RecommendPlansService(new NoopEvaluateLeadsUseCase());

    @Test
    void winConditionWeightsRemainBacklinePlusSixLeadingPlusTwo() throws Exception {
        EvaluateLeadsResult eval = new EvaluateLeadsResult(List.of());
        List<PreviewPokemonCommand> team = neutralTeam();

        int leadingScore = score(eval, List.of(0, 1, 2, 3), List.of(0, 1), 0, team);
        int backlineScore = score(eval, List.of(0, 1, 2, 3), List.of(1, 2), 0, team);

        assertThat(leadingScore).isEqualTo(2);
        assertThat(backlineScore).isEqualTo(6);
    }

    @Test
    void supportBonusRemainsCappedAtSix() throws Exception {
        EvaluateLeadsResult eval = new EvaluateLeadsResult(List.of());
        List<PreviewPokemonCommand> team = List.of(
                pokemon("a", false, List.of("speed-control", "redirection")),
                pokemon("b", false, List.of("screens")),
                pokemon("c", false, List.of("fake-out")),
                pokemon("d", false, List.of("helping-hand")),
                pokemon("e", false, List.of()),
                pokemon("f", false, List.of()));

        int score = score(eval, List.of(0, 1, 2, 3), List.of(0, 1), null, team);

        assertThat(score).isEqualTo(6);
    }

    @Test
    void megaBonusRemainsPlusFiveAndLeadBonusPlusTwo() throws Exception {
        EvaluateLeadsResult eval = new EvaluateLeadsResult(List.of());
        List<PreviewPokemonCommand> team = List.of(
                pokemon("a", false, List.of()),
                pokemon("b", false, List.of()),
                pokemon("c", false, List.of()),
                pokemon("d", false, List.of()),
                pokemon("e", false, List.of()),
                pokemon("mega", true, List.of()));

        int bringMegaBackline = score(eval, List.of(0, 1, 2, 5), List.of(0, 1), null, team);
        int bringMegaLeading = score(eval, List.of(0, 1, 2, 5), List.of(0, 3), null, team);
        int benchMega = score(eval, List.of(0, 1, 2, 3), List.of(0, 1), null, team);

        assertThat(bringMegaBackline).isEqualTo(5);
        assertThat(bringMegaLeading).isEqualTo(7);
        assertThat(benchMega).isEqualTo(-6);
    }

    @Test
    void monoCategoryPenaltyIsMinusFourWhenThreeOfFourAreSameCategory() throws Exception {
        EvaluateLeadsResult eval = new EvaluateLeadsResult(List.of());
        List<PreviewPokemonCommand> team = List.of(
                physicalOnly("p1"),
                physicalOnly("p2"),
                physicalOnly("p3"),
                mixed("mix"),
                specialOnly("s1"),
                specialOnly("s2"));

        int monoPhysicalScore = score(eval, List.of(0, 1, 2, 3), List.of(0, 1), null, team);
        int mixedScore = score(eval, List.of(0, 3, 4, 5), List.of(0, 1), null, team);

        assertThat(monoPhysicalScore).isEqualTo(-4);
        assertThat(mixedScore).isEqualTo(0);
    }

    private int score(
            EvaluateLeadsResult eval,
            List<Integer> bring,
            List<Integer> leadWithinBring,
            Integer winConditionIndex,
            List<PreviewPokemonCommand> team)
            throws Exception {
        Method score = RecommendPlansService.class.getDeclaredMethod(
                "score", EvaluateLeadsResult.class, List.class, List.class, Integer.class, List.class);
        score.setAccessible(true);
        return (int) score.invoke(service, eval, bring, leadWithinBring, winConditionIndex, team);
    }

    private static List<PreviewPokemonCommand> neutralTeam() {
        return List.of(
                pokemon("a", false, List.of()),
                pokemon("b", false, List.of()),
                pokemon("c", false, List.of()),
                pokemon("d", false, List.of()),
                pokemon("e", false, List.of()),
                pokemon("f", false, List.of()));
    }

    private static PreviewPokemonCommand pokemon(String id, boolean mega, List<String> supportTags) {
        return new PreviewPokemonCommand(
                id,
                id,
                combatant(),
                List.of(
                        new MoveCommand("FAIRY", "SPECIAL", 90, false, false, false, false),
                        new MoveCommand("NORMAL", "PHYSICAL", 80, false, false, false, false)),
                mega,
                0,
                supportTags);
    }

    private static PreviewPokemonCommand physicalOnly(String id) {
        return new PreviewPokemonCommand(
                id,
                id,
                combatant(),
                List.of(new MoveCommand("NORMAL", "PHYSICAL", 80, false, false, false, false)),
                false,
                0,
                List.of());
    }

    private static PreviewPokemonCommand specialOnly(String id) {
        return new PreviewPokemonCommand(
                id,
                id,
                combatant(),
                List.of(new MoveCommand("NORMAL", "SPECIAL", 80, false, false, false, false)),
                false,
                0,
                List.of());
    }

    private static PreviewPokemonCommand mixed(String id) {
        return new PreviewPokemonCommand(
                id,
                id,
                combatant(),
                List.of(
                        new MoveCommand("NORMAL", "PHYSICAL", 80, false, false, false, false),
                        new MoveCommand("FIRE", "SPECIAL", 80, false, false, false, false)),
                false,
                0,
                List.of());
    }

    private static CombatantCommand combatant() {
        return new CombatantCommand(
                50,
                new StatsCommand(100, 100, 100, 100, 100, 100),
                List.of("NORMAL"),
                "none",
                "none",
                "NONE",
                Map.of(),
                true,
                100);
    }

    private static final class NoopEvaluateLeadsUseCase implements EvaluateLeadsUseCase {
        @Override
        public EvaluateLeadsResult evaluate(EvaluateLeadsCommand command) {
            return new EvaluateLeadsResult(List.of());
        }

        @Override
        public DamageMatrix buildMatrix(
                String regulation,
                List<PreviewPokemonCommand> myTeam,
                List<PreviewPokemonCommand> opponentTeam,
                PreviewFieldCommand field) {
            return new DamageMatrix(
                    new HitEvidence[myTeam.size()][opponentTeam.size()],
                    new HitEvidence[opponentTeam.size()][myTeam.size()]);
        }

        @Override
        public EvaluateLeadsResult evaluateFromMatrix(
                List<PreviewPokemonCommand> selectedLeads,
                int[] selectedLeadIndices,
                List<PreviewPokemonCommand> opponentTeam,
                DamageMatrix matrix) {
            return new EvaluateLeadsResult(List.of());
        }
    }
}
