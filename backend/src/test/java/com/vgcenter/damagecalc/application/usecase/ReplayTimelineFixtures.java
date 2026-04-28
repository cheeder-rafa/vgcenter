package com.vgcenter.damagecalc.application.usecase;

import com.vgcenter.damagecalc.domain.replay.ReplayBoardState;
import com.vgcenter.damagecalc.domain.replay.ReplayBoostState;
import com.vgcenter.damagecalc.domain.replay.ReplayPokemonState;
import com.vgcenter.damagecalc.domain.replay.ReplaySideState;
import java.util.List;

public final class ReplayTimelineFixtures {

    private ReplayTimelineFixtures() {}

    public static ReplayBoardState boardState() {
        return new ReplayBoardState(
                "none",
                "none",
                new ReplaySideState(
                        "Alice",
                        false,
                        false,
                        false,
                        false,
                        List.of(new ReplayPokemonState(
                                "p1a", "Venusaur", 100, 100, null, false, new ReplayBoostState(0, 0, 0, 0, 0, 0, 0)))),
                new ReplaySideState(
                        "Bob",
                        false,
                        false,
                        false,
                        false,
                        List.of(new ReplayPokemonState(
                                "p2a",
                                "Dragonite",
                                100,
                                100,
                                null,
                                false,
                                new ReplayBoostState(0, 0, 0, 0, 0, 0, 0)))));
    }
}
