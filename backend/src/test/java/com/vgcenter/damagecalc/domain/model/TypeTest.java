package com.vgcenter.damagecalc.domain.model;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.EnumMap;
import java.util.Map;
import java.util.Set;
import org.junit.jupiter.api.Test;

class TypeTest {

    private static final Map<Type, Set<Type>> DOUBLE_DAMAGE = doubleDamageChart();
    private static final Map<Type, Set<Type>> HALF_DAMAGE = halfDamageChart();
    private static final Map<Type, Set<Type>> NO_DAMAGE = noDamageChart();

    @Test
    void usesTheExpectedSingleTypeEffectivenessChart() {
        for (Type attacker : Type.values()) {
            for (Type defender : Type.values()) {
                assertThat(attacker.damageScaleAgainst(defender))
                        .describedAs("%s into %s", attacker, defender)
                        .isEqualTo(expectedScale(attacker, defender));
            }
        }
    }

    private static int expectedScale(Type attacker, Type defender) {
        if (NO_DAMAGE.getOrDefault(attacker, Set.of()).contains(defender)) {
            return 0;
        }
        if (DOUBLE_DAMAGE.getOrDefault(attacker, Set.of()).contains(defender)) {
            return 8;
        }
        if (HALF_DAMAGE.getOrDefault(attacker, Set.of()).contains(defender)) {
            return 2;
        }
        return 4;
    }

    private static Map<Type, Set<Type>> doubleDamageChart() {
        Map<Type, Set<Type>> chart = new EnumMap<>(Type.class);
        chart.put(Type.FIRE, Set.of(Type.GRASS, Type.ICE, Type.BUG, Type.STEEL));
        chart.put(Type.WATER, Set.of(Type.FIRE, Type.GROUND, Type.ROCK));
        chart.put(Type.ELECTRIC, Set.of(Type.WATER, Type.FLYING));
        chart.put(Type.GRASS, Set.of(Type.WATER, Type.GROUND, Type.ROCK));
        chart.put(Type.ICE, Set.of(Type.GRASS, Type.GROUND, Type.FLYING, Type.DRAGON));
        chart.put(Type.FIGHTING, Set.of(Type.NORMAL, Type.ICE, Type.ROCK, Type.DARK, Type.STEEL));
        chart.put(Type.POISON, Set.of(Type.GRASS, Type.FAIRY));
        chart.put(Type.GROUND, Set.of(Type.FIRE, Type.ELECTRIC, Type.POISON, Type.ROCK, Type.STEEL));
        chart.put(Type.FLYING, Set.of(Type.GRASS, Type.FIGHTING, Type.BUG));
        chart.put(Type.PSYCHIC, Set.of(Type.FIGHTING, Type.POISON));
        chart.put(Type.BUG, Set.of(Type.GRASS, Type.PSYCHIC, Type.DARK));
        chart.put(Type.ROCK, Set.of(Type.FIRE, Type.ICE, Type.FLYING, Type.BUG));
        chart.put(Type.GHOST, Set.of(Type.PSYCHIC, Type.GHOST));
        chart.put(Type.DRAGON, Set.of(Type.DRAGON));
        chart.put(Type.DARK, Set.of(Type.PSYCHIC, Type.GHOST));
        chart.put(Type.STEEL, Set.of(Type.ICE, Type.ROCK, Type.FAIRY));
        chart.put(Type.FAIRY, Set.of(Type.FIGHTING, Type.DRAGON, Type.DARK));
        return chart;
    }

    private static Map<Type, Set<Type>> halfDamageChart() {
        Map<Type, Set<Type>> chart = new EnumMap<>(Type.class);
        chart.put(Type.NORMAL, Set.of(Type.ROCK, Type.STEEL));
        chart.put(Type.FIRE, Set.of(Type.FIRE, Type.WATER, Type.ROCK, Type.DRAGON));
        chart.put(Type.WATER, Set.of(Type.WATER, Type.GRASS, Type.DRAGON));
        chart.put(Type.ELECTRIC, Set.of(Type.ELECTRIC, Type.GRASS, Type.DRAGON));
        chart.put(
                Type.GRASS, Set.of(Type.FIRE, Type.GRASS, Type.POISON, Type.FLYING, Type.BUG, Type.DRAGON, Type.STEEL));
        chart.put(Type.ICE, Set.of(Type.FIRE, Type.WATER, Type.ICE, Type.STEEL));
        chart.put(Type.FIGHTING, Set.of(Type.POISON, Type.FLYING, Type.PSYCHIC, Type.BUG, Type.FAIRY));
        chart.put(Type.POISON, Set.of(Type.POISON, Type.GROUND, Type.ROCK, Type.GHOST));
        chart.put(Type.GROUND, Set.of(Type.GRASS, Type.BUG));
        chart.put(Type.FLYING, Set.of(Type.ELECTRIC, Type.ROCK, Type.STEEL));
        chart.put(Type.PSYCHIC, Set.of(Type.PSYCHIC, Type.STEEL));
        chart.put(
                Type.BUG,
                Set.of(Type.FIRE, Type.FIGHTING, Type.POISON, Type.FLYING, Type.GHOST, Type.STEEL, Type.FAIRY));
        chart.put(Type.ROCK, Set.of(Type.FIGHTING, Type.GROUND, Type.STEEL));
        chart.put(Type.GHOST, Set.of(Type.DARK));
        chart.put(Type.DRAGON, Set.of(Type.STEEL));
        chart.put(Type.DARK, Set.of(Type.FIGHTING, Type.DARK, Type.FAIRY));
        chart.put(Type.STEEL, Set.of(Type.FIRE, Type.WATER, Type.ELECTRIC, Type.STEEL));
        chart.put(Type.FAIRY, Set.of(Type.FIRE, Type.POISON, Type.STEEL));
        return chart;
    }

    private static Map<Type, Set<Type>> noDamageChart() {
        Map<Type, Set<Type>> chart = new EnumMap<>(Type.class);
        chart.put(Type.NORMAL, Set.of(Type.GHOST));
        chart.put(Type.ELECTRIC, Set.of(Type.GROUND));
        chart.put(Type.FIGHTING, Set.of(Type.GHOST));
        chart.put(Type.POISON, Set.of(Type.STEEL));
        chart.put(Type.GROUND, Set.of(Type.FLYING));
        chart.put(Type.PSYCHIC, Set.of(Type.DARK));
        chart.put(Type.GHOST, Set.of(Type.NORMAL));
        chart.put(Type.DRAGON, Set.of(Type.FAIRY));
        return chart;
    }
}
