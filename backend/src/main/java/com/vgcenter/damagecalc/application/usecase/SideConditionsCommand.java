package com.vgcenter.damagecalc.application.usecase;

public record SideConditionsCommand(
        boolean reflect,
        boolean lightScreen,
        boolean auroraVeil,
        boolean friendGuard,
        boolean helpingHand,
        boolean tailwind,
        boolean protect) {}
