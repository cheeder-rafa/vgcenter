package com.vgcenter.damagecalc.domain.formula;

public record SideConditions(
        boolean reflect,
        boolean lightScreen,
        boolean auroraVeil,
        boolean friendGuard,
        boolean helpingHand,
        boolean tailwind,
        boolean protect) {

    private static final SideConditions NONE = new SideConditions(false, false, false, false, false, false, false);

    public static SideConditions none() {
        return NONE;
    }
}
