package com.vgcenter.damagecalc.domain.gameplan;

import java.util.List;
import java.util.Objects;
import java.util.Set;

public record TurnOneFlags(
        boolean protect, boolean redirection, boolean fakeOut, boolean priority, SpeedControl speedControl) {

    private static final Set<String> PROTECT_MOVES = Set.of("protect");
    private static final Set<String> REDIRECTION_MOVES = Set.of("follow-me", "rage-powder");
    private static final Set<String> FAKE_OUT_MOVES = Set.of("fake-out");
    private static final Set<String> PRIORITY_MOVES = Set.of(
            "accelerock",
            "aqua-jet",
            "bullet-punch",
            "extreme-speed",
            "fake-out",
            "grassy-glide",
            "ice-shard",
            "mach-punch",
            "quick-attack",
            "shadow-sneak",
            "sucker-punch",
            "vacuum-wave");
    private static final Set<String> TAILWIND_MOVES = Set.of("tailwind");
    private static final Set<String> TRICK_ROOM_MOVES = Set.of("trick-room");

    public TurnOneFlags {
        Objects.requireNonNull(speedControl, "speedControl must not be null");
    }

    public static TurnOneFlags classify(List<SidePokemon> leads) {
        List<SidePokemon> normalizedLeads = List.copyOf(Objects.requireNonNull(leads, "leads must not be null"));
        boolean protect = hasAnyMove(normalizedLeads, PROTECT_MOVES);
        boolean redirection = hasAnyMove(normalizedLeads, REDIRECTION_MOVES);
        boolean fakeOut = hasAnyMove(normalizedLeads, FAKE_OUT_MOVES);
        boolean priority = hasAnyMove(normalizedLeads, PRIORITY_MOVES);
        boolean tailwind = hasAnyMove(normalizedLeads, TAILWIND_MOVES);
        boolean trickRoom = hasAnyMove(normalizedLeads, TRICK_ROOM_MOVES);
        return new TurnOneFlags(protect, redirection, fakeOut, priority, speedControl(tailwind, trickRoom));
    }

    private static boolean hasAnyMove(List<SidePokemon> leads, Set<String> moveIds) {
        return leads.stream()
                .flatMap(lead -> lead.moveIds().stream())
                .filter(Objects::nonNull)
                .anyMatch(moveIds::contains);
    }

    private static SpeedControl speedControl(boolean tailwind, boolean trickRoom) {
        if (tailwind && trickRoom) {
            return SpeedControl.BOTH;
        }
        if (tailwind) {
            return SpeedControl.TAILWIND;
        }
        if (trickRoom) {
            return SpeedControl.TRICK_ROOM;
        }
        return SpeedControl.NONE;
    }

    public enum SpeedControl {
        NONE,
        TAILWIND,
        TRICK_ROOM,
        BOTH
    }

    public record SidePokemon(List<String> moveIds, String abilityId, String itemId) {

        public SidePokemon {
            moveIds = List.copyOf(Objects.requireNonNull(moveIds, "moveIds must not be null"));
        }
    }
}
