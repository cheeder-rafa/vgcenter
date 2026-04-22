package com.vgcenter.damagecalc.domain.formula;

import com.vgcenter.damagecalc.domain.model.Ability;
import com.vgcenter.damagecalc.domain.model.Item;
import com.vgcenter.damagecalc.domain.model.MoveCategory;
import com.vgcenter.damagecalc.domain.model.Stat;
import com.vgcenter.damagecalc.domain.model.StatusCondition;
import com.vgcenter.damagecalc.domain.model.Type;
import java.util.List;

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
        damage = applyTypeEffectiveness(damage, context);
        damage = applyBurn(damage, context);
        return applyOtherModifiers(damage, context);
    }

    long baseDamage(DamageContext context) {
        long levelFactor = context.attacker().level() * 2L / 5L + 2L;
        long attack = attackingStat(context);
        long defense = defendingStat(context);
        long scaled = levelFactor * effectiveBasePower(context) * attack / defense;
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
            if (context.attacker().ability() == Ability.ADAPTABILITY) {
                return applyMultiplier(damage, 2, 1);
            }
            return applyMultiplier(damage, 3, 2);
        }
        return damage;
    }

    long applyTypeEffectiveness(long damage, DamageContext context) {
        return applyMultiplier(damage, context.typeEffectivenessScale(), 4);
    }

    long applyBurn(long damage, DamageContext context) {
        if (context.attacker().status() == StatusCondition.BURN
                && context.move().category() == MoveCategory.PHYSICAL
                && context.attacker().ability() != Ability.GUTS
                && !context.move().ignoreBurnPenaltyWhenUserStatused()) {
            return applyMultiplier(damage, 1, 2);
        }
        return damage;
    }

    long applyOtherModifiers(long damage, DamageContext context) {
        long modifiedDamage = damage;
        for (Modifier modifier : otherModifiers()) {
            if (modifier.applies(context)) {
                modifiedDamage = modifier.apply(modifiedDamage, context);
            }
        }
        return modifiedDamage;
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
        Stat defendingStat =
                switch (context.room()) {
                    case WONDER ->
                        context.move().category() == MoveCategory.PHYSICAL ? Stat.SPECIAL_DEFENSE : Stat.DEFENSE;
                    case NONE, MAGIC, TRICK ->
                        context.move().category() == MoveCategory.PHYSICAL ? Stat.DEFENSE : Stat.SPECIAL_DEFENSE;
                };
        return context.defender().stats().valueFor(defendingStat);
    }

    private long applyMultiplier(long damage, int numerator, int denominator) {
        return damage * numerator / denominator;
    }

    private int effectiveBasePower(DamageContext context) {
        if (context.move().doublePowerWhenUserStatused() && context.attacker().status() != StatusCondition.NONE) {
            return context.move().basePower() * 2;
        }
        return context.move().basePower();
    }

    private List<Modifier> otherModifiers() {
        return List.of(
                new ProtectModifier(),
                new TerrainModifier(),
                new HelpingHandModifier(),
                new ScreenModifier(),
                new FriendGuardModifier(),
                new AttackerItemModifier(),
                new AttackerAbilityModifier(),
                new DefenderAbilityModifier());
    }

    private final class ProtectModifier implements Modifier {

        @Override
        public boolean applies(DamageContext context) {
            return context.defenderSide().protect();
        }

        @Override
        public long apply(long damage, DamageContext context) {
            if (context.attacker().ability() == Ability.PIERCING_DRILL) {
                return applyMultiplier(damage, 1, 4);
            }
            if (context.attacker().ability() == Ability.UNSEEN_FIST
                    && context.move().contact()) {
                return applyMultiplier(damage, 1, 4);
            }
            return 0L;
        }
    }

    private long applyTerrainBoost(long damage, DamageContext context) {
        return switch (context.terrain()) {
            case ELECTRIC -> groundedTerrainBoost(damage, context, Type.ELECTRIC);
            case GRASSY -> groundedTerrainBoost(damage, context, Type.GRASS);
            case PSYCHIC -> groundedTerrainBoost(damage, context, Type.PSYCHIC);
            case MISTY -> mistyTerrainAdjustment(damage, context);
            case NONE -> damage;
        };
    }

    private long groundedTerrainBoost(long damage, DamageContext context, Type boostedType) {
        if (context.attacker().grounded() && context.move().type() == boostedType) {
            return applyMultiplier(damage, 13, 10);
        }
        return damage;
    }

    private long mistyTerrainAdjustment(long damage, DamageContext context) {
        if (context.defender().grounded() && context.move().type() == Type.DRAGON) {
            return applyMultiplier(damage, 1, 2);
        }
        return damage;
    }

    private final class TerrainModifier implements Modifier {

        @Override
        public boolean applies(DamageContext context) {
            return context.terrain() != Terrain.NONE;
        }

        @Override
        public long apply(long damage, DamageContext context) {
            return applyTerrainBoost(damage, context);
        }
    }

    private final class HelpingHandModifier implements Modifier {

        @Override
        public boolean applies(DamageContext context) {
            return context.attackerSide().helpingHand();
        }

        @Override
        public long apply(long damage, DamageContext context) {
            return applyMultiplier(damage, 3, 2);
        }
    }

    private final class ScreenModifier implements Modifier {

        @Override
        public boolean applies(DamageContext context) {
            return !context.criticalHit() && screenActiveForMove(context);
        }

        @Override
        public long apply(long damage, DamageContext context) {
            return applyMultiplier(damage, 2, 3);
        }

        private boolean screenActiveForMove(DamageContext context) {
            return switch (context.move().category()) {
                case PHYSICAL ->
                    context.defenderSide().reflect() || context.defenderSide().auroraVeil();
                case SPECIAL ->
                    context.defenderSide().lightScreen()
                            || context.defenderSide().auroraVeil();
                case STATUS -> false;
            };
        }
    }

    private final class FriendGuardModifier implements Modifier {

        @Override
        public boolean applies(DamageContext context) {
            return context.defenderSide().friendGuard();
        }

        @Override
        public long apply(long damage, DamageContext context) {
            return applyMultiplier(damage, 3, 4);
        }
    }

    private final class AttackerItemModifier implements Modifier {

        @Override
        public boolean applies(DamageContext context) {
            return !context.itemsSuppressed() && context.attacker().item() != Item.NONE;
        }

        @Override
        public long apply(long damage, DamageContext context) {
            return switch (context.attacker().item()) {
                case LIFE_ORB -> applyMultiplier(damage, 13, 10);
                case EXPERT_BELT -> context.superEffective() ? applyMultiplier(damage, 6, 5) : damage;
                case NONE, LEFTOVERS, SITRUS_BERRY -> damage;
            };
        }
    }

    private final class AttackerAbilityModifier implements Modifier {

        @Override
        public boolean applies(DamageContext context) {
            return context.attacker().ability() != Ability.NONE;
        }

        @Override
        public long apply(long damage, DamageContext context) {
            return switch (context.attacker().ability()) {
                case GUTS -> gutsAdjustment(damage, context);
                case NEUROFORCE -> context.superEffective() ? applyMultiplier(damage, 5, 4) : damage;
                case PIERCING_DRILL, UNSEEN_FIST -> damage;
                case SNIPER -> context.criticalHit() ? applyMultiplier(damage, 3, 2) : damage;
                case TINTED_LENS -> context.resisted() ? applyMultiplier(damage, 2, 1) : damage;
                case NONE, ADAPTABILITY, FILTER, FLUFFY, MULTISCALE, SOLID_ROCK -> damage;
            };
        }

        private long gutsAdjustment(long damage, DamageContext context) {
            if (context.move().category() == MoveCategory.PHYSICAL
                    && context.attacker().status() != StatusCondition.NONE) {
                return applyMultiplier(damage, 3, 2);
            }
            return damage;
        }
    }

    private final class DefenderAbilityModifier implements Modifier {

        @Override
        public boolean applies(DamageContext context) {
            return context.defender().ability() != Ability.NONE;
        }

        @Override
        public long apply(long damage, DamageContext context) {
            return switch (context.defender().ability()) {
                case FILTER, SOLID_ROCK -> context.superEffective() ? applyMultiplier(damage, 3, 4) : damage;
                case FLUFFY -> fluffyAdjustment(damage, context);
                case MULTISCALE -> context.defender().fullHp() ? applyMultiplier(damage, 1, 2) : damage;
                case NONE, ADAPTABILITY, GUTS, NEUROFORCE, PIERCING_DRILL, SNIPER, TINTED_LENS, UNSEEN_FIST -> damage;
            };
        }

        private long fluffyAdjustment(long damage, DamageContext context) {
            if (context.move().type() == Type.FIRE && context.move().contact()) {
                return damage;
            }
            if (context.move().type() == Type.FIRE) {
                return applyMultiplier(damage, 2, 1);
            }
            if (context.move().contact()) {
                return applyMultiplier(damage, 1, 2);
            }
            return damage;
        }
    }
}
