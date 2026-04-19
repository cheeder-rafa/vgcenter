package com.vgcenter.damagecalc.domain.formula;

import com.vgcenter.damagecalc.domain.model.MoveCategory;
import com.vgcenter.damagecalc.domain.model.Stat;
import com.vgcenter.damagecalc.domain.model.Type;

public final class DamageFormula {

    public long calculate(DamageContext context) {
        return calculate(context, 100);
    }

    public int[] rolls(DamageContext context) {
        int[] rolls = new int[16];
        for (int i = 0; i < rolls.length; i++) {
            rolls[i] = Math.toIntExact(calculate(context, 85 + i));
        }
        return rolls;
    }

    long calculate(DamageContext context, int randomPercent) {
        long damage = baseDamage(context);
        damage = applyTargetsModifier(damage, context);
        damage = applyWeatherModifier(damage, context);
        damage = applyCriticalHit(damage, context);
        damage = applyRandomFactor(damage, randomPercent);
        damage = applyStab(damage, context);
        return applyTypeEffectiveness(damage, context);
    }

    long baseDamage(DamageContext context) {
        long levelFactor = context.attacker().level() * 2L / 5L + 2L;
        long attack = attackingStat(context);
        long defense = defendingStat(context);
        long scaled = levelFactor * context.move().basePower() * attack / defense;
        return scaled / 50L + 2L;
    }

    long applyTargetsModifier(long damage, DamageContext context) {
        if (context.move().spread() && context.targets() > 1) {
            return applyMultiplier(damage, 3, 4);
        }
        return damage;
    }

    long applyWeatherModifier(long damage, DamageContext context) {
        return switch (context.weather()) {
            case CLEAR -> damage;
            case SUN ->
                switch (context.move().type()) {
                    case FIRE -> applyMultiplier(damage, 3, 2);
                    case WATER -> applyMultiplier(damage, 1, 2);
                    default -> damage;
                };
            case RAIN ->
                switch (context.move().type()) {
                    case WATER -> applyMultiplier(damage, 3, 2);
                    case FIRE -> applyMultiplier(damage, 1, 2);
                    default -> damage;
                };
            case SAND -> sandAdjustedDamage(damage, context);
            case SNOW -> snowAdjustedDamage(damage, context);
        };
    }

    long applyCriticalHit(long damage, DamageContext context) {
        if (context.criticalHit()) {
            return applyMultiplier(damage, 3, 2);
        }
        return damage;
    }

    long applyRandomFactor(long damage, int randomPercent) {
        if (randomPercent < 85 || randomPercent > 100) {
            throw new IllegalArgumentException("Random percent must be between 85 and 100");
        }
        return applyMultiplier(damage, randomPercent, 100);
    }

    long applyStab(long damage, DamageContext context) {
        if (context.attacker().hasType(context.move().type())) {
            return applyMultiplier(damage, 3, 2);
        }
        return damage;
    }

    long applyTypeEffectiveness(long damage, DamageContext context) {
        int scale = 4;
        for (Type defenderType : context.defender().types()) {
            scale = scale * context.move().type().damageScaleAgainst(defenderType) / 4;
            if (scale == 0) {
                return 0;
            }
        }
        return applyMultiplier(damage, scale, 4);
    }

    private long sandAdjustedDamage(long damage, DamageContext context) {
        if (context.move().category() == MoveCategory.SPECIAL
                && context.defender().hasType(Type.ROCK)) {
            return applyMultiplier(damage, 2, 3);
        }
        return damage;
    }

    private long snowAdjustedDamage(long damage, DamageContext context) {
        if (context.move().category() == MoveCategory.PHYSICAL
                && context.defender().hasType(Type.ICE)) {
            return applyMultiplier(damage, 2, 3);
        }
        return damage;
    }

    private long attackingStat(DamageContext context) {
        Stat attackingStat = context.move().category() == MoveCategory.PHYSICAL ? Stat.ATTACK : Stat.SPECIAL_ATTACK;
        return context.attacker().stats().valueFor(attackingStat);
    }

    private long defendingStat(DamageContext context) {
        Stat defendingStat = context.move().category() == MoveCategory.PHYSICAL ? Stat.DEFENSE : Stat.SPECIAL_DEFENSE;
        return context.defender().stats().valueFor(defendingStat);
    }

    private long applyMultiplier(long damage, int numerator, int denominator) {
        return damage * numerator / denominator;
    }
}
