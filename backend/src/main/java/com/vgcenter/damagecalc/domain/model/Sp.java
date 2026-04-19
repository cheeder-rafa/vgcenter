package com.vgcenter.damagecalc.domain.model;

public record Sp(int hp, int attack, int defense, int specialAttack, int specialDefense, int speed) {

    private static final int MIN_SP = 0;
    private static final int MAX_SP = 32;

    public Sp {
        validateRange("HP SP", hp);
        validateRange("Attack SP", attack);
        validateRange("Defense SP", defense);
        validateRange("Special Attack SP", specialAttack);
        validateRange("Special Defense SP", specialDefense);
        validateRange("Speed SP", speed);
    }

    public int valueFor(Stat stat) {
        return switch (stat) {
            case HP -> hp;
            case ATTACK -> attack;
            case DEFENSE -> defense;
            case SPECIAL_ATTACK -> specialAttack;
            case SPECIAL_DEFENSE -> specialDefense;
            case SPEED -> speed;
        };
    }

    private static void validateRange(String label, int value) {
        if (value < MIN_SP || value > MAX_SP) {
            throw new IllegalArgumentException(label + " must be between 0 and 32");
        }
    }
}
