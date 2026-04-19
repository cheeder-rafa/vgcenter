package com.vgcenter.damagecalc.domain.model;

public enum Type {
    NORMAL,
    FIRE,
    WATER,
    ELECTRIC,
    GRASS,
    ICE,
    FIGHTING,
    POISON,
    GROUND,
    FLYING,
    PSYCHIC,
    BUG,
    ROCK,
    GHOST,
    DRAGON,
    DARK,
    STEEL,
    FAIRY;

    public int damageScaleAgainst(Type defenderType) {
        return switch (this) {
            case NORMAL ->
                switch (defenderType) {
                    case ROCK, STEEL -> 2;
                    case GHOST -> 0;
                    default -> 4;
                };
            case FIRE ->
                switch (defenderType) {
                    case FIRE, WATER, ROCK, DRAGON -> 2;
                    case GRASS, ICE, BUG, STEEL -> 8;
                    default -> 4;
                };
            case WATER ->
                switch (defenderType) {
                    case WATER, GRASS, DRAGON -> 2;
                    case FIRE, GROUND, ROCK -> 8;
                    default -> 4;
                };
            case ELECTRIC ->
                switch (defenderType) {
                    case ELECTRIC, GRASS, DRAGON -> 2;
                    case WATER, FLYING -> 8;
                    case GROUND -> 0;
                    default -> 4;
                };
            case GRASS ->
                switch (defenderType) {
                    case FIRE, GRASS, POISON, FLYING, BUG, DRAGON, STEEL -> 2;
                    case WATER, GROUND, ROCK -> 8;
                    default -> 4;
                };
            case ICE ->
                switch (defenderType) {
                    case FIRE, WATER, ICE, STEEL -> 2;
                    case GRASS, GROUND, FLYING, DRAGON -> 8;
                    default -> 4;
                };
            case FIGHTING ->
                switch (defenderType) {
                    case POISON, FLYING, PSYCHIC, BUG, FAIRY -> 2;
                    case NORMAL, ICE, ROCK, DARK, STEEL -> 8;
                    case GHOST -> 0;
                    default -> 4;
                };
            case POISON ->
                switch (defenderType) {
                    case POISON, GROUND, ROCK, GHOST -> 2;
                    case GRASS, FAIRY -> 8;
                    case STEEL -> 0;
                    default -> 4;
                };
            case GROUND ->
                switch (defenderType) {
                    case GRASS, BUG -> 2;
                    case FIRE, ELECTRIC, POISON, ROCK, STEEL -> 8;
                    case FLYING -> 0;
                    default -> 4;
                };
            case FLYING ->
                switch (defenderType) {
                    case ELECTRIC, ROCK, STEEL -> 2;
                    case GRASS, FIGHTING, BUG -> 8;
                    default -> 4;
                };
            case PSYCHIC ->
                switch (defenderType) {
                    case PSYCHIC, STEEL -> 2;
                    case FIGHTING, POISON -> 8;
                    case DARK -> 0;
                    default -> 4;
                };
            case BUG ->
                switch (defenderType) {
                    case FIRE, FIGHTING, POISON, FLYING, GHOST, STEEL, FAIRY -> 2;
                    case GRASS, PSYCHIC, DARK -> 8;
                    default -> 4;
                };
            case ROCK ->
                switch (defenderType) {
                    case FIGHTING, GROUND, STEEL -> 2;
                    case FIRE, ICE, FLYING, BUG -> 8;
                    default -> 4;
                };
            case GHOST ->
                switch (defenderType) {
                    case DARK -> 2;
                    case PSYCHIC, GHOST -> 8;
                    case NORMAL -> 0;
                    default -> 4;
                };
            case DRAGON ->
                switch (defenderType) {
                    case STEEL -> 2;
                    case DRAGON -> 8;
                    case FAIRY -> 0;
                    default -> 4;
                };
            case DARK ->
                switch (defenderType) {
                    case FIGHTING, DARK, FAIRY -> 2;
                    case PSYCHIC, GHOST -> 8;
                    default -> 4;
                };
            case STEEL ->
                switch (defenderType) {
                    case FIRE, WATER, ELECTRIC, STEEL -> 2;
                    case ICE, ROCK, FAIRY -> 8;
                    default -> 4;
                };
            case FAIRY ->
                switch (defenderType) {
                    case FIRE, POISON, STEEL -> 2;
                    case FIGHTING, DRAGON, DARK -> 8;
                    default -> 4;
                };
        };
    }
}
