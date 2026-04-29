package com.vgcenter.damagecalc.domain.model;

public enum Nature {
    HARDY(null, null),
    LONELY(Stat.ATTACK, Stat.DEFENSE),
    BRAVE(Stat.ATTACK, Stat.SPEED),
    ADAMANT(Stat.ATTACK, Stat.SPECIAL_ATTACK),
    NAUGHTY(Stat.ATTACK, Stat.SPECIAL_DEFENSE),
    BOLD(Stat.DEFENSE, Stat.ATTACK),
    DOCILE(null, null),
    RELAXED(Stat.DEFENSE, Stat.SPEED),
    IMPISH(Stat.DEFENSE, Stat.SPECIAL_ATTACK),
    LAX(Stat.DEFENSE, Stat.SPECIAL_DEFENSE),
    TIMID(Stat.SPEED, Stat.ATTACK),
    HASTY(Stat.SPEED, Stat.DEFENSE),
    SERIOUS(null, null),
    JOLLY(Stat.SPEED, Stat.SPECIAL_ATTACK),
    NAIVE(Stat.SPEED, Stat.SPECIAL_DEFENSE),
    MODEST(Stat.SPECIAL_ATTACK, Stat.ATTACK),
    MILD(Stat.SPECIAL_ATTACK, Stat.DEFENSE),
    QUIET(Stat.SPECIAL_ATTACK, Stat.SPEED),
    BASHFUL(null, null),
    RASH(Stat.SPECIAL_ATTACK, Stat.SPECIAL_DEFENSE),
    CALM(Stat.SPECIAL_DEFENSE, Stat.ATTACK),
    GENTLE(Stat.SPECIAL_DEFENSE, Stat.DEFENSE),
    SASSY(Stat.SPECIAL_DEFENSE, Stat.SPEED),
    CAREFUL(Stat.SPECIAL_DEFENSE, Stat.SPECIAL_ATTACK),
    QUIRKY(null, null);

    private final Stat increasedStat;
    private final Stat decreasedStat;

    Nature(Stat increasedStat, Stat decreasedStat) {
        this.increasedStat = increasedStat;
        this.decreasedStat = decreasedStat;
    }

    public Stat increasedStat() {
        return increasedStat;
    }

    public Stat decreasedStat() {
        return decreasedStat;
    }

    public int applyTo(Stat stat, int baseValue) {
        if (stat == Stat.HP) {
            return baseValue;
        }
        if (stat == increasedStat) {
            return (int) Math.floor(baseValue * 1.1d);
        }
        if (stat == decreasedStat) {
            return (int) Math.floor(baseValue * 0.9d);
        }
        return baseValue;
    }
}
