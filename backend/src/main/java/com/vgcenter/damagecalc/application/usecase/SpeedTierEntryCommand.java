package com.vgcenter.damagecalc.application.usecase;

public record SpeedTierEntryCommand(String speciesId, String speciesName, int spSpeed, String natureId) {}
