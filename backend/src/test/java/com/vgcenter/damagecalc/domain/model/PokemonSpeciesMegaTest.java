package com.vgcenter.damagecalc.domain.model;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.vgcenter.damagecalc.domain.mega.MegaForm;
import java.util.List;
import java.util.Optional;
import org.junit.jupiter.api.Test;

class PokemonSpeciesMegaTest {

    private static final Stats CHARIZARD_BASE_STATS = new Stats(78, 84, 78, 109, 85, 100);
    private static final Stats CHARIZARD_X_STATS = new Stats(78, 130, 111, 130, 85, 100);
    private static final MegaForm MEGA_CHARIZARD_X = new MegaForm(
            "charizard-mega-x", "Charizard-Mega-X", List.of(Type.FIRE, Type.DRAGON), CHARIZARD_X_STATS, Ability.NONE);

    @Test
    void speciesWithoutMegaFormExposesEmptyOptional() {
        PokemonSpecies species = charizardWithoutMega();

        assertThat(species.megaForm()).isEmpty();
    }

    @Test
    void speciesWithMegaFormExposesItViaOptional() {
        PokemonSpecies species = charizardWithMegaX();

        assertThat(species.megaForm()).contains(MEGA_CHARIZARD_X);
    }

    @Test
    void buildCombatantBaseFormUsesSpeciesBaseStatsAndTypes() {
        PokemonSpecies species = charizardWithMegaX();

        Combatant base = species.buildCombatant(50, new Sp(0, 0, 0, 0, 0, 0), Nature.ADAMANT, false);

        assertThat(base.types()).containsExactly(Type.FIRE, Type.FLYING);
        Combatant expected = Combatant.fromBaseStats(
                50, List.of(Type.FIRE, Type.FLYING), CHARIZARD_BASE_STATS, new Sp(0, 0, 0, 0, 0, 0), Nature.ADAMANT);
        assertThat(base.stats()).isEqualTo(expected.stats());
        assertThat(base.ability()).isEqualTo(Ability.NONE);
    }

    @Test
    void buildCombatantMegaActiveSwapsTypesStatsAndAbility() {
        PokemonSpecies species = charizardWithMegaX();

        Combatant mega = species.buildCombatant(50, new Sp(0, 0, 0, 0, 0, 0), Nature.ADAMANT, true);

        assertThat(mega.types()).containsExactly(Type.FIRE, Type.DRAGON);
        Combatant expected = Combatant.fromBaseStats(
                50, List.of(Type.FIRE, Type.DRAGON), CHARIZARD_X_STATS, new Sp(0, 0, 0, 0, 0, 0), Nature.ADAMANT);
        assertThat(mega.stats()).isEqualTo(expected.stats());
        assertThat(mega.ability()).isEqualTo(Ability.NONE);
    }

    @Test
    void buildCombatantMegaActiveAdoptsMegaAbilityWhenDifferent() {
        MegaForm megaLucario = new MegaForm(
                "lucario-mega",
                "Lucario-Mega",
                List.of(Type.FIGHTING, Type.STEEL),
                new Stats(70, 145, 88, 140, 70, 112),
                Ability.ADAPTABILITY);
        PokemonSpecies lucario = new PokemonSpecies(
                "lucario",
                "Lucario",
                List.of(Type.FIGHTING, Type.STEEL),
                new Stats(70, 110, 70, 115, 70, 90),
                List.of("steadfast"),
                List.of("close-combat"),
                List.of("lucarionite"),
                megaLucario);

        Combatant mega = lucario.buildCombatant(50, new Sp(0, 0, 0, 0, 0, 0), Nature.ADAMANT, true);

        assertThat(mega.ability()).isEqualTo(Ability.ADAPTABILITY);
    }

    @Test
    void buildCombatantMegaActiveThrowsIfSpeciesHasNoMegaForm() {
        PokemonSpecies species = charizardWithoutMega();

        assertThatThrownBy(() -> species.buildCombatant(50, new Sp(0, 0, 0, 0, 0, 0), Nature.ADAMANT, true))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("charizard");
    }

    @Test
    void buildCombatantValidatesLevel() {
        PokemonSpecies species = charizardWithMegaX();

        assertThatThrownBy(() -> species.buildCombatant(0, new Sp(0, 0, 0, 0, 0, 0), Nature.ADAMANT, false))
                .isInstanceOf(IllegalArgumentException.class);
    }

    @Test
    void originalConstructorStillDefaultsToEmptyMegaForm() {
        PokemonSpecies species = new PokemonSpecies(
                "rotom",
                "Rotom",
                List.of(Type.ELECTRIC, Type.GHOST),
                new Stats(50, 50, 77, 95, 77, 91),
                List.of("levitate"),
                List.of("shadow-ball"),
                List.of("choice-specs"));
        assertThat(species.megaForm()).isEqualTo(Optional.empty());
    }

    private static PokemonSpecies charizardWithoutMega() {
        return new PokemonSpecies(
                "charizard",
                "Charizard",
                List.of(Type.FIRE, Type.FLYING),
                CHARIZARD_BASE_STATS,
                List.of("blaze"),
                List.of("flamethrower"),
                List.of("charcoal"));
    }

    private static PokemonSpecies charizardWithMegaX() {
        return new PokemonSpecies(
                "charizard",
                "Charizard",
                List.of(Type.FIRE, Type.FLYING),
                CHARIZARD_BASE_STATS,
                List.of("blaze"),
                List.of("flamethrower", "dragon-claw"),
                List.of("charizardite-x"),
                MEGA_CHARIZARD_X);
    }
}
