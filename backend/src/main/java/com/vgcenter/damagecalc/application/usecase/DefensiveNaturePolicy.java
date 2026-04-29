package com.vgcenter.damagecalc.application.usecase;

import com.vgcenter.damagecalc.domain.model.Nature;
import com.vgcenter.damagecalc.domain.model.PokemonSpecies;
import com.vgcenter.damagecalc.domain.model.Stat;
import java.util.ArrayList;
import java.util.List;

final class DefensiveNaturePolicy {

    private static final int SLOW_SPEED_THRESHOLD = 60;

    private DefensiveNaturePolicy() {}

    static List<Nature> candidates(
            PokemonSpecies defender,
            Nature requested,
            List<Nature> fallbacks,
            boolean physicalPressure,
            boolean specialPressure) {
        List<Nature> candidates = new ArrayList<>();
        candidates.add(requested);
        for (Nature fallback : fallbacks) {
            if (fallback == requested || candidates.contains(fallback)) {
                continue;
            }
            if (isRelevant(defender, fallback, physicalPressure, specialPressure)) {
                candidates.add(fallback);
            }
        }
        return candidates;
    }

    private static boolean isRelevant(
            PokemonSpecies defender, Nature nature, boolean physicalPressure, boolean specialPressure) {
        Stat decreased = nature.decreasedStat();
        if (decreased == null) {
            return true;
        }
        if (decreased == Stat.SPEED && defender.baseStats().speed() > SLOW_SPEED_THRESHOLD) {
            return false;
        }
        if (decreased == Stat.DEFENSE && physicalPressure) {
            return false;
        }
        if (decreased == Stat.SPECIAL_DEFENSE && specialPressure) {
            return false;
        }
        if (decreased == strongerOffensiveStat(defender)) {
            return false;
        }
        return true;
    }

    private static Stat strongerOffensiveStat(PokemonSpecies defender) {
        int attack = defender.baseStats().attack();
        int specialAttack = defender.baseStats().specialAttack();
        if (attack > specialAttack) {
            return Stat.ATTACK;
        }
        if (specialAttack > attack) {
            return Stat.SPECIAL_ATTACK;
        }
        return null;
    }
}
