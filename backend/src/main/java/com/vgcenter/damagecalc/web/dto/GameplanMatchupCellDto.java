package com.vgcenter.damagecalc.web.dto;

import java.util.List;

public record GameplanMatchupCellDto(
        int firstOpponentIndex,
        int secondOpponentIndex,
        List<String> opponentLeadSpeciesIds,
        GameplanScoreDto score,
        TurnOneFlagsDto mineFlags,
        TurnOneFlagsDto opponentFlags,
        List<GameplanDamageOptionDto> outgoing,
        List<GameplanDamageOptionDto> incoming) {}
