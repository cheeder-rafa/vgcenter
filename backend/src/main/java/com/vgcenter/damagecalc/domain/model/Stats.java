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
        if (level != 50) {
            throw new IllegalArgumentException("Level must be 50: Pokémon Champions battles are fixed at level 50");
        }

        return new Stats(
                calculateHp(hp, sp.hp()),
                calculateNonHp(Stat.ATTACK, attack, sp.attack(), nature),
                calculateNonHp(Stat.DEFENSE, defense, sp.defense(), nature),
                calculateNonHp(Stat.SPECIAL_ATTACK, specialAttack, sp.specialAttack(), nature),
                calculateNonHp(Stat.SPECIAL_DEFENSE, specialDefense, sp.specialDefense(), nature),
                calculateNonHp(Stat.SPEED, speed, sp.speed(), nature));
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

    private static int calculateHp(int base, int sp) {
        return base + sp + 75;
    }

    private static int calculateNonHp(Stat stat, int base, int sp, Nature nature) {
        return nature.applyTo(stat, base + sp + 20);
    }

    private static void validatePositive(String label, int value) {
        if (value <= 0) {
            throw new IllegalArgumentException(label + " must be positive");
        }
    }
}
