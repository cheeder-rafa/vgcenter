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
            case NONE, CLEAR -> damage;
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
        long value = context.attacker().stats().valueFor(attackingStat);
        return switch (context.attacker().ability()) {
            case HUGE_POWER, PURE_POWER -> context.move().category() == MoveCategory.PHYSICAL ? value * 2 : value;
            case HUSTLE -> context.move().category() == MoveCategory.PHYSICAL ? value * 3 / 2 : value;
            case SOLAR_POWER ->
                context.move().category() == MoveCategory.SPECIAL && context.weather() == Weather.SUN
                        ? value * 3 / 2
                        : value;
            default -> value;
        };
    }

    private long defendingStat(DamageContext context) {
        Stat defendingStat =
                switch (context.room()) {
                    case WONDER ->
                        context.move().category() == MoveCategory.PHYSICAL ? Stat.SPECIAL_DEFENSE : Stat.DEFENSE;
                    case NONE, MAGIC, TRICK ->
                        context.move().category() == MoveCategory.PHYSICAL ? Stat.DEFENSE : Stat.SPECIAL_DEFENSE;
                };
        long value = context.defender().stats().valueFor(defendingStat);
        if (context.defender().ability() == Ability.FUR_COAT
                && !context.ignoresDefenderAbility()
                && context.move().category() == MoveCategory.PHYSICAL
                && defendingStat == Stat.DEFENSE) {
            return value * 2;
        }
        return value;
    }

    private long applyMultiplier(long damage, int numerator, int denominator) {
        return damage * numerator / denominator;
    }

    private int effectiveBasePower(DamageContext context) {
        int basePower = context.move().basePower();
        if (context.move().doublePowerWhenUserStatused() && context.attacker().status() != StatusCondition.NONE) {
            basePower *= 2;
        }
        if (boostAbilityMatchesTypeThreshold(context)) {
            basePower = basePower * 3 / 2;
        }
        if (context.attacker().ability() == Ability.TECHNICIAN && context.move().basePower() <= 60) {
            basePower = basePower * 3 / 2;
        }
        if (context.attacker().ability() == Ability.WATER_BUBBLE
                && context.move().type() == Type.WATER) {
            basePower *= 2;
        }
        return basePower;
    }

    private List<Modifier> otherModifiers() {
        return List.of(
                new ProtectModifier(),
                new TerrainModifier(),
                new HelpingHandModifier(),
                new AuraModifier(),
                new ScreenModifier(),
                new FriendGuardModifier(),
                new AttackerItemModifier(),
                new DefenderItemModifier(),
                new AttackerAbilityModifier(),
                new DefenderAbilityModifier());
    }

    private boolean boostAbilityMatchesTypeThreshold(DamageContext context) {
        if (!context.attacker().atOrBelowThirdHp()) {
            return false;
        }
        return switch (context.attacker().ability()) {
            case BLAZE -> context.move().type() == Type.FIRE;
            case TORRENT -> context.move().type() == Type.WATER;
            case OVERGROW -> context.move().type() == Type.GRASS;
            case SWARM -> context.move().type() == Type.BUG;
            default -> false;
        };
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

    private final class AuraModifier implements Modifier {

        @Override
        public boolean applies(DamageContext context) {
            return context.move().type() == Type.FAIRY && fairyAuraActive(context);
        }

        @Override
        public long apply(long damage, DamageContext context) {
            return applyMultiplier(damage, 4, 3);
        }

        private boolean fairyAuraActive(DamageContext context) {
            return context.attacker().ability() == Ability.FAIRY_AURA
                    || context.defender().ability() == Ability.FAIRY_AURA;
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
            if (context.attacker().item() == Item.LIFE_ORB) {
                return applyMultiplier(damage, 13, 10);
            }
            if (context.attacker().item() == Item.EXPERT_BELT && context.superEffective()) {
                return applyMultiplier(damage, 6, 5);
            }
            if (boostedTypeFor(context.attacker().item()) == context.move().type()) {
                return applyMultiplier(damage, 6, 5);
            }
            return damage;
        }
    }

    private final class DefenderItemModifier implements Modifier {

        @Override
        public boolean applies(DamageContext context) {
            return !context.itemsSuppressed() && context.defender().item() != Item.NONE;
        }

        @Override
        public long apply(long damage, DamageContext context) {
            if (berryReducesDamage(context.defender().item(), context)) {
                return applyMultiplier(damage, 1, 2);
            }
            return damage;
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
                case FAIRY_AURA -> damage;
                case GUTS -> gutsAdjustment(damage, context);
                case NEUROFORCE -> context.superEffective() ? applyMultiplier(damage, 5, 4) : damage;
                case PIERCING_DRILL, UNSEEN_FIST -> damage;
                case SNIPER -> context.criticalHit() ? applyMultiplier(damage, 3, 2) : damage;
                case TOUGH_CLAWS -> context.move().contact() ? applyMultiplier(damage, 13, 10) : damage;
                case TINTED_LENS -> context.resisted() ? applyMultiplier(damage, 2, 1) : damage;
                default -> damage;
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
            return context.defender().ability() != Ability.NONE && !abilitySuppressedByMoldBreaker(context);
        }

        @Override
        public long apply(long damage, DamageContext context) {
            return switch (context.defender().ability()) {
                case FAIRY_AURA -> damage;
                case DRY_SKIN -> context.move().type() == Type.FIRE ? applyMultiplier(damage, 5, 4) : damage;
                case FILTER, SOLID_ROCK -> context.superEffective() ? applyMultiplier(damage, 3, 4) : damage;
                case FLUFFY -> fluffyAdjustment(damage, context);
                case HEATPROOF -> context.move().type() == Type.FIRE ? applyMultiplier(damage, 1, 2) : damage;
                case MULTISCALE -> context.defender().fullHp() ? applyMultiplier(damage, 1, 2) : damage;
                case THICK_FAT ->
                    context.move().type() == Type.FIRE || context.move().type() == Type.ICE
                            ? applyMultiplier(damage, 1, 2)
                            : damage;
                case WATER_BUBBLE -> context.move().type() == Type.FIRE ? applyMultiplier(damage, 1, 2) : damage;
                default -> damage;
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

    private boolean abilitySuppressedByMoldBreaker(DamageContext context) {
        if (!context.ignoresDefenderAbility()) {
            return false;
        }
        return switch (context.defender().ability()) {
            case DRY_SKIN,
                    EARTH_EATER,
                    FILTER,
                    FLASH_FIRE,
                    FLUFFY,
                    FUR_COAT,
                    HEATPROOF,
                    LEVITATE,
                    LIGHTNING_ROD,
                    MULTISCALE,
                    SAP_SIPPER,
                    SOLID_ROCK,
                    THICK_FAT,
                    VOLT_ABSORB,
                    WATER_ABSORB,
                    WATER_BUBBLE -> true;
            default -> false;
        };
    }

    private Type boostedTypeFor(Item item) {
        return switch (item) {
            case BLACK_BELT -> Type.FIGHTING;
            case BLACK_GLASSES -> Type.DARK;
            case CHARCOAL -> Type.FIRE;
            case DRAGON_FANG -> Type.DRAGON;
            case FAIRY_FEATHER -> Type.FAIRY;
            case HARD_STONE -> Type.ROCK;
            case MAGNET -> Type.ELECTRIC;
            case METAL_COAT -> Type.STEEL;
            case MIRACLE_SEED -> Type.GRASS;
            case MYSTIC_WATER -> Type.WATER;
            case NEVER_MELT_ICE -> Type.ICE;
            case POISON_BARB -> Type.POISON;
            case SHARP_BEAK -> Type.FLYING;
            case SILK_SCARF -> Type.NORMAL;
            case SILVER_POWDER -> Type.BUG;
            case SOFT_SAND -> Type.GROUND;
            case SPELL_TAG -> Type.GHOST;
            case TWISTED_SPOON -> Type.PSYCHIC;
            default -> null;
        };
    }

    private Type resistedTypeFor(Item item) {
        return switch (item) {
            case BABIRI_BERRY -> Type.STEEL;
            case CHARTI_BERRY -> Type.ROCK;
            case CHILAN_BERRY -> Type.NORMAL;
            case CHOPLE_BERRY -> Type.FIGHTING;
            case COBA_BERRY -> Type.FLYING;
            case COLBUR_BERRY -> Type.DARK;
            case HABAN_BERRY -> Type.DRAGON;
            case KASIB_BERRY -> Type.GHOST;
            case KEBIA_BERRY -> Type.POISON;
            case OCCA_BERRY -> Type.FIRE;
            case PASSHO_BERRY -> Type.WATER;
            case PAYAPA_BERRY -> Type.PSYCHIC;
            case RINDO_BERRY -> Type.GRASS;
            case ROSELI_BERRY -> Type.FAIRY;
            case SHUCA_BERRY -> Type.GROUND;
            case TANGA_BERRY -> Type.BUG;
            case WACAN_BERRY -> Type.ELECTRIC;
            case YACHE_BERRY -> Type.ICE;
            default -> null;
        };
    }

    private boolean berryReducesDamage(Item item, DamageContext context) {
        if (item == Item.CHILAN_BERRY) {
            return context.move().type() == Type.NORMAL;
        }
        Type resistedType = resistedTypeFor(item);
        return resistedType != null && context.move().type() == resistedType && context.superEffective();
    }
}
