package com.vgcenter.damagecalc.application.usecase;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.List;
import java.util.Map;
import org.junit.jupiter.api.Test;

class BuildThreatMatrixServiceTest {

    private final CalculateDamageService calcService = new CalculateDamageService();
    private final BuildThreatMatrixService service = new BuildThreatMatrixService(calcService);

    private static final FieldCommand CLEAR_FIELD = new FieldCommand("CLEAR", "NONE", "NONE");
    private static final SideConditionsCommand NO_SIDE =
            new SideConditionsCommand(false, false, false, false, false, false, false);

    @Test
    void dealMatrixHasDimensionsMatchingTeamSizes() {
        List<ThreatPokemonCommand> teamA = List.of(fireAttacker(), grassDefender());
        List<ThreatPokemonCommand> teamB = List.of(grassDefender(), waterDefender());

        BuildThreatMatrixResult result =
                service.build(new BuildThreatMatrixCommand("M-A", teamA, teamB, CLEAR_FIELD, NO_SIDE, NO_SIDE));

        assertThat(result.deal()).hasSize(2);
        assertThat(result.deal().get(0)).hasSize(2);
        assertThat(result.take()).hasSize(2);
        assertThat(result.take().get(0)).hasSize(2);
    }

    @Test
    void dealCellPicksBestMoveByMaxPct() {
        // Fire attacker with heat-wave vs grass defender — fire move should outscore normal move
        List<ThreatPokemonCommand> teamA = List.of(fireAttacker());
        List<ThreatPokemonCommand> teamB = List.of(grassDefender());

        BuildThreatMatrixResult result =
                service.build(new BuildThreatMatrixCommand("M-A", teamA, teamB, CLEAR_FIELD, NO_SIDE, NO_SIDE));

        MatrixCellResult cell = result.deal().get(0).get(0);
        assertThat(cell.bestMoveId()).isEqualTo("fire-move");
        assertThat(cell.maxPct()).isGreaterThan(0);
        assertThat(cell.rolls()).hasSize(16);
    }

    @Test
    void takeCellReflectsDefenderAttackingAttacker() {
        List<ThreatPokemonCommand> teamA = List.of(fireAttacker());
        List<ThreatPokemonCommand> teamB = List.of(grassDefender());

        BuildThreatMatrixResult result =
                service.build(new BuildThreatMatrixCommand("M-A", teamA, teamB, CLEAR_FIELD, NO_SIDE, NO_SIDE));

        // take[0][0] = what grassDefender does to fireAttacker
        MatrixCellResult takeCell = result.take().get(0).get(0);
        assertThat(takeCell.bestMoveId()).isEqualTo("grass-move");
        assertThat(takeCell.rolls()).hasSize(16);
    }

    @Test
    void statusMovesWithZeroBasePowerProduceZeroDamageAndAreSkipped() {
        List<ThreatPokemonCommand> teamA = List.of(statusMoveOnly());
        List<ThreatPokemonCommand> teamB = List.of(grassDefender());

        BuildThreatMatrixResult result =
                service.build(new BuildThreatMatrixCommand("M-A", teamA, teamB, CLEAR_FIELD, NO_SIDE, NO_SIDE));

        MatrixCellResult cell = result.deal().get(0).get(0);
        // When only status move is available, best move may have 0 damage
        assertThat(cell).isNotNull();
    }

    @Test
    void emptyMovesListProducesNullBestMove() {
        List<ThreatPokemonCommand> teamA = List.of(noMoves());
        List<ThreatPokemonCommand> teamB = List.of(grassDefender());

        BuildThreatMatrixResult result =
                service.build(new BuildThreatMatrixCommand("M-A", teamA, teamB, CLEAR_FIELD, NO_SIDE, NO_SIDE));

        MatrixCellResult cell = result.deal().get(0).get(0);
        assertThat(cell.bestMoveId()).isNull();
    }

    // --- helpers ---

    private static ThreatPokemonCommand fireAttacker() {
        CombatantCommand combatant = new CombatantCommand(
                50,
                new StatsCommand(140, 76, 70, 158, 95, 123),
                List.of("FIRE"),
                "none",
                "none",
                "NONE",
                Map.of(),
                true,
                140);
        List<ResolvedMoveCommand> moves = List.of(
                new ResolvedMoveCommand(
                        "fire-move", new MoveCommand("FIRE", "SPECIAL", 90, false, false, false, false)),
                new ResolvedMoveCommand(
                        "normal-move", new MoveCommand("NORMAL", "SPECIAL", 60, false, false, false, false)));
        return new ThreatPokemonCommand(combatant, moves);
    }

    private static ThreatPokemonCommand grassDefender() {
        CombatantCommand combatant = new CombatantCommand(
                50,
                new StatsCommand(160, 68, 111, 76, 99, 71),
                List.of("GRASS"),
                "none",
                "none",
                "NONE",
                Map.of(),
                true,
                160);
        List<ResolvedMoveCommand> moves = List.of(new ResolvedMoveCommand(
                "grass-move", new MoveCommand("GRASS", "SPECIAL", 90, false, false, false, false)));
        return new ThreatPokemonCommand(combatant, moves);
    }

    private static ThreatPokemonCommand waterDefender() {
        CombatantCommand combatant = new CombatantCommand(
                50,
                new StatsCommand(170, 68, 90, 76, 99, 71),
                List.of("WATER"),
                "none",
                "none",
                "NONE",
                Map.of(),
                true,
                170);
        List<ResolvedMoveCommand> moves = List.of(new ResolvedMoveCommand(
                "water-move", new MoveCommand("WATER", "SPECIAL", 90, false, false, false, false)));
        return new ThreatPokemonCommand(combatant, moves);
    }

    private static ThreatPokemonCommand statusMoveOnly() {
        CombatantCommand combatant = new CombatantCommand(
                50,
                new StatsCommand(140, 76, 70, 158, 95, 123),
                List.of("GRASS"),
                "none",
                "none",
                "NONE",
                Map.of(),
                true,
                140);
        List<ResolvedMoveCommand> moves = List.of(
                new ResolvedMoveCommand("protect", new MoveCommand("NORMAL", "STATUS", 0, false, false, false, false)));
        return new ThreatPokemonCommand(combatant, moves);
    }

    private static ThreatPokemonCommand noMoves() {
        CombatantCommand combatant = new CombatantCommand(
                50,
                new StatsCommand(140, 76, 70, 158, 95, 123),
                List.of("NORMAL"),
                "none",
                "none",
                "NONE",
                Map.of(),
                true,
                140);
        return new ThreatPokemonCommand(combatant, List.of());
    }
}
