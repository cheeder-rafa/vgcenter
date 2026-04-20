package com.vgcenter.damagecalc.domain.model;

import java.util.Locale;

public enum Item {
    NONE,
    EXPERT_BELT,
    LIFE_ORB;

    public static Item fromId(String id) {
        if (id == null || id.isBlank()) {
            return NONE;
        }
        String normalized = id.trim().toUpperCase(Locale.ROOT).replace('-', '_');
        try {
            return Item.valueOf(normalized);
        } catch (IllegalArgumentException exception) {
            return NONE;
        }
    }
}
