package com.vgcenter.damagecalc.application.usecase;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import org.springframework.stereotype.Service;

@Service
public final class BuildThreatMatrixService implements BuildThreatMatrixUseCase {

    private static final KoChanceResult NO_KO = new KoChanceResult("no damage", 0.0d, 0);
    private static final int[] ZERO_ROLLS = new int[16];

    private final CalculateDamageUseCase calculateDamageUseCase;

    public BuildThreatMatrixService(CalculateDamageUseCase calculateDamageUseCase) {
        this.calculateDamageUseCase = calculateDamageUseCase;
    }

    @Override
    public BuildThreatMatrixResult build(BuildThreatMatrixCommand command) {
        int aSize = command.teamA().size();
        int bSize = command.teamB().size();

        List<List<MatrixCellResult>> deal = new ArrayList<>(aSize);
        List<List<MatrixCellResult>> take = new ArrayList<>(aSize);

        for (int i = 0; i < aSize; i++) {
            ThreatPokemonCommand pokemonA = command.teamA().get(i);
            List<MatrixCellResult> dealRow = new ArrayList<>(bSize);
            List<MatrixCellResult> takeRow = new ArrayList<>(bSize);
            for (int j = 0; j < bSize; j++) {
                ThreatPokemonCommand pokemonB = command.teamB().get(j);
                dealRow.add(bestCell(command, pokemonA, pokemonB));
                takeRow.add(bestCellSwappedSides(command, pokemonB, pokemonA));
            }
            deal.add(List.copyOf(dealRow));
            take.add(List.copyOf(takeRow));
        }

        return new BuildThreatMatrixResult(List.copyOf(deal), List.copyOf(take));
    }

    private MatrixCellResult bestCell(
            BuildThreatMatrixCommand command, ThreatPokemonCommand attacker, ThreatPokemonCommand defender) {

        List<ResolvedMoveCommand> damagingMoves =
                attacker.moves().stream().filter(m -> m.move().basePower() > 0).toList();

        if (damagingMoves.isEmpty()) {
            return new MatrixCellResult(null, 0.0, 0.0, ZERO_ROLLS, NO_KO);
        }

        return damagingMoves.stream()
                .map(rm -> {
                    CalculateDamageCommand calcCmd = new CalculateDamageCommand(
                            command.regulation(),
                            attacker.combatant(),
                            defender.combatant(),
                            rm.move(),
                            command.field(),
                            command.sideA(),
                            command.sideB(),
                            false,
                            1);
                    try {
                        CalculateDamageResult r = calculateDamageUseCase.calculate(calcCmd);
                        return new MatrixCellResult(rm.moveId(), r.minPct(), r.maxPct(), r.rolls(), r.koChance());
                    } catch (IllegalArgumentException e) {
                        return new MatrixCellResult(rm.moveId(), 0.0, 0.0, ZERO_ROLLS, NO_KO);
                    }
                })
                .max(Comparator.comparingDouble(MatrixCellResult::maxPct))
                .orElseThrow();
    }

    private MatrixCellResult bestCellSwappedSides(
            BuildThreatMatrixCommand command, ThreatPokemonCommand attacker, ThreatPokemonCommand defender) {
        BuildThreatMatrixCommand swappedSides = new BuildThreatMatrixCommand(
                command.regulation(),
                command.teamA(),
                command.teamB(),
                command.field(),
                command.sideB(),
                command.sideA());
        return bestCell(swappedSides, attacker, defender);
    }
}
