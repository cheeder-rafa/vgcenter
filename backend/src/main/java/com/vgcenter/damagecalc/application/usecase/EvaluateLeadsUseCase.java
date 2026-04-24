package com.vgcenter.damagecalc.application.usecase;

import java.util.List;

public interface EvaluateLeadsUseCase {

    EvaluateLeadsResult evaluate(EvaluateLeadsCommand command);

    /**
     * Pre-computes best-move evidence for every (myTeam[i], opponentTeam[j]) pair in both
     * directions. Implementations should compute these in parallel.
     */
    DamageMatrix buildMatrix(
            String regulation,
            List<PreviewPokemonCommand> myTeam,
            List<PreviewPokemonCommand> opponentTeam,
            PreviewFieldCommand field);

    /**
     * Assembles all 15 opponent lead-pair matchups using a pre-computed matrix, avoiding redundant
     * damage calculations. {@code selectedLeadIndices} maps position 0 and 1 to row indices into
     * {@code matrix.bestOutgoing} and column indices into {@code matrix.bestIncoming}.
     */
    EvaluateLeadsResult evaluateFromMatrix(
            List<PreviewPokemonCommand> selectedLeads,
            int[] selectedLeadIndices,
            List<PreviewPokemonCommand> opponentTeam,
            DamageMatrix matrix);
}
