package com.vgcenter.damagecalc.domain.model;

public record Stats(int hp, int attack, int defense, int specialAttack, int specialDefense, int speed) {

    public Stats {
        validatePositive("HP", hp);
        validatePositive("Attack", attack);
        validatePositive("Defense", defense);
        validatePositive("Special Attack", specialAttack);
        validatePositive("Special Defense", specialDefense);
        validatePositive("Speed", speed);
    }

    public Stats toBattleStats(Sp sp, Nature nature, int level) {
        if (level <= 0) {
            throw new IllegalArgumentException("Level must be positive");
        }

        return new Stats(
                calculateHp(hp, sp.hp(), level),
                calculateNonHp(Stat.ATTACK, attack, sp.attack(), nature, level),
                calculateNonHp(Stat.DEFENSE, defense, sp.defense(), nature, level),
                calculateNonHp(Stat.SPECIAL_ATTACK, specialAttack, sp.specialAttack(), nature, level),
                calculateNonHp(Stat.SPECIAL_DEFENSE, specialDefense, sp.specialDefense(), nature, level),
                calculateNonHp(Stat.SPEED, speed, sp.speed(), nature, level));
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

    private static int calculateHp(int base, int sp, int level) {
        return (2 * base + sp) * level / 100 + level + 10;
    }

    private static int calculateNonHp(Stat stat, int base, int sp, Nature nature, int level) {
        int unmodified = (2 * base + sp) * level / 100 + 5;
        return nature.applyTo(stat, unmodified);
    }

    private static void validatePositive(String label, int value) {
        if (value <= 0) {
            throw new IllegalArgumentException(label + " must be positive");
        }
    }
}
