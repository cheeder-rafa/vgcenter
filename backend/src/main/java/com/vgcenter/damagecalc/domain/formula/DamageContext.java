package com.vgcenter.damagecalc.domain.formula;

import com.vgcenter.damagecalc.domain.model.Ability;
import com.vgcenter.damagecalc.domain.model.Combatant;
import com.vgcenter.damagecalc.domain.model.Move;
import com.vgcenter.damagecalc.domain.model.Type;
import java.util.Objects;

public record DamageContext(
        Combatant attacker,
        Combatant defender,
        Move move,
        Field field,
        SideConditions attackerSide,
        SideConditions defenderSide,
        boolean criticalHit,
        int targets) {

    public DamageContext {
        Objects.requireNonNull(attacker, "attacker must not be null");
        Objects.requireNonNull(defender, "defender must not be null");
        Objects.requireNonNull(move, "move must not be null");
        Objects.requireNonNull(field, "field must not be null");
        Objects.requireNonNull(attackerSide, "attackerSide must not be null");
        Objects.requireNonNull(defenderSide, "defenderSide must not be null");
        if (targets <= 0) {
            throw new IllegalArgumentException("Targets must be positive");
        }
    }

    public DamageContext(
            Combatant attacker, Combatant defender, Move move, Weather weather, boolean criticalHit, int targets) {
        this(
                attacker,
                defender,
                move,
                new Field(weather, Terrain.NONE, Room.NONE),
                SideConditions.none(),
                SideConditions.none(),
                criticalHit,
                targets);
    }

    public Weather weather() {
        return field.weather();
    }

    public Terrain terrain() {
        return field.terrain();
    }

    public Room room() {
        return field.room();
    }

    public boolean itemsSuppressed() {
        return room() == Room.MAGIC;
    }

    public int typeEffectivenessScale() {
        if (abilityGrantsImmunity()) {
            return 0;
        }
        int scale = 4;
        for (var defenderType : defender.types()) {
            scale = scale * move.type().damageScaleAgainst(defenderType) / 4;
            if (scale == 0) {
                return 0;
            }
        }
        return scale;
    }

    public boolean superEffective() {
        return typeEffectivenessScale() > 4;
    }

    public boolean resisted() {
        int scale = typeEffectivenessScale();
        return scale > 0 && scale < 4;
    }

    public boolean ignoresDefenderAbility() {
        return attacker.ability() == Ability.MOLD_BREAKER;
    }

    private boolean abilityGrantsImmunity() {
        if (ignoresDefenderAbility()) {
            return false;
        }

        return switch (defender.ability()) {
            case LEVITATE -> move.type() == Type.GROUND;
            case FLASH_FIRE -> move.type() == Type.FIRE;
            case WATER_ABSORB -> move.type() == Type.WATER;
            case VOLT_ABSORB, LIGHTNING_ROD -> move.type() == Type.ELECTRIC;
            case SAP_SIPPER -> move.type() == Type.GRASS;
            case EARTH_EATER -> move.type() == Type.GROUND;
            default -> false;
        };
    }
}
