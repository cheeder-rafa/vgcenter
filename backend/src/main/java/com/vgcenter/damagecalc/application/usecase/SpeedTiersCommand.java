package com.vgcenter.damagecalc.application.usecase;

import java.util.List;

public record SpeedTiersCommand(
        String regulation, List<SpeedTierEntryCommand> userTeam, SpeedTierModifiersCommand modifiers) {}
