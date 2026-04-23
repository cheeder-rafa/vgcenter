package com.vgcenter.damagecalc.domain.model;

import java.util.Locale;

public enum Item {
    NONE,
    BABIRI_BERRY,
    BLACK_BELT,
    BLACK_GLASSES,
    CHARCOAL,
    CHARTI_BERRY,
    CHILAN_BERRY,
    CHOPLE_BERRY,
    COBA_BERRY,
    COLBUR_BERRY,
    EXPERT_BELT,
    FAIRY_FEATHER,
    HABAN_BERRY,
    HARD_STONE,
    KASIB_BERRY,
    KEBIA_BERRY,
    LIFE_ORB,
    LEFTOVERS,
    MAGNET,
    METAL_COAT,
    MIRACLE_SEED,
    MYSTIC_WATER,
    NEVER_MELT_ICE,
    OCCA_BERRY,
    PASSHO_BERRY,
    PAYAPA_BERRY,
    POISON_BARB,
    RINDO_BERRY,
    ROSELI_BERRY,
    SHARP_BEAK,
    SHUCA_BERRY,
    SILK_SCARF,
    SILVER_POWDER,
    SOFT_SAND,
    SPELL_TAG,
    TANGA_BERRY,
    TWISTED_SPOON,
    WACAN_BERRY,
    YACHE_BERRY,
    DRAGON_FANG,
    SITRUS_BERRY;

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
