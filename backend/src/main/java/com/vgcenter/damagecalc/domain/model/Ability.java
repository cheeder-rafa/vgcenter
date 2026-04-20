package com.vgcenter.damagecalc.domain.model;

import java.util.Locale;

public enum Ability {
    NONE,
    ADAPTABILITY,
    FILTER,
    FLUFFY,
    GUTS,
    MULTISCALE,
    NEUROFORCE,
    SNIPER,
    SOLID_ROCK,
    TINTED_LENS;

    public static Ability fromId(String id) {
        if (id == null || id.isBlank()) {
            return NONE;
        }
        String normalised = id.trim().toUpperCase(Locale.ROOT).replace('-', '_');
        try {
            return Ability.valueOf(normalised);
        } catch (IllegalArgumentException exception) {
            return NONE;
        }
    }
}
