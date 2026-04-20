package com.vgcenter.damagecalc.application.usecase;

import java.util.List;

public record MegaFormView(String id, String name, List<String> types, StatsView baseStats, String abilityId) {}
