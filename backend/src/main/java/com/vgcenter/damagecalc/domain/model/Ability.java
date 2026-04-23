package com.vgcenter.damagecalc.domain.model;

import java.util.Locale;

public enum Ability {
    NONE,
    ADAPTABILITY,
    BLAZE,
    DRY_SKIN,
    EARTH_EATER,
    FAIRY_AURA,
    FLASH_FIRE,
    FILTER,
    FLUFFY,
    FUR_COAT,
    GUTS,
    HEATPROOF,
    HUGE_POWER,
    HUSTLE,
    LEVITATE,
    LIGHTNING_ROD,
    MOLD_BREAKER,
    MULTISCALE,
    NEUROFORCE,
    OVERGROW,
    PIERCING_DRILL,
    PURE_POWER,
    SNIPER,
    SOLID_ROCK,
    SOLAR_POWER,
    SAP_SIPPER,
    SWARM,
    TECHNICIAN,
    THICK_FAT,
    TINTED_LENS,
    TORRENT,
    TOUGH_CLAWS,
    WATER_ABSORB,
    WATER_BUBBLE,
    VOLT_ABSORB,
    UNSEEN_FIST;

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
