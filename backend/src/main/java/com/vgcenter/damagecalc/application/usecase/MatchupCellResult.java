package com.vgcenter.damagecalc.application.usecase;

import com.vgcenter.damagecalc.domain.gameplan.MatchupScore;
import com.vgcenter.damagecalc.domain.gameplan.TurnOneFlags;
import java.util.List;
import java.util.Objects;

public record MatchupCellResult(
        int firstOpponentIndex,
        int secondOpponentIndex,
        List<String> opponentLeadSpeciesIds,
        MatchupScore score,
        TurnOneFlags mineFlags,
        TurnOneFlags opponentFlags,
        List<DamageOptionResult> outgoing,
        List<DamageOptionResult> incoming) {

    public MatchupCellResult {
        opponentLeadSpeciesIds =
                List.copyOf(Objects.requireNonNull(opponentLeadSpeciesIds, "opponentLeadSpeciesIds must not be null"));
        Objects.requireNonNull(score, "score must not be null");
        Objects.requireNonNull(mineFlags, "mineFlags must not be null");
        Objects.requireNonNull(opponentFlags, "opponentFlags must not be null");
        outgoing = List.copyOf(Objects.requireNonNull(outgoing, "outgoing must not be null"));
        incoming = List.copyOf(Objects.requireNonNull(incoming, "incoming must not be null"));
    }
}
