package com.vgcenter.damagecalc.application.usecase;

public record SpeedTierModifiersCommand(
        boolean tailwind, boolean trickRoom, boolean paralysis, boolean choiceScarf, int stages) {}
