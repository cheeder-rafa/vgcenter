package com.vgcenter.damagecalc.infrastructure.pokedex;

import static org.assertj.core.api.Assertions.assertThat;

import com.vgcenter.damagecalc.DamageCalcApplication;
import com.vgcenter.damagecalc.application.port.PokedexRepository;
import com.vgcenter.damagecalc.domain.model.PokemonSpecies;
import com.vgcenter.damagecalc.domain.model.Type;
import org.assertj.core.api.InstanceOfAssertFactories;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.runner.ApplicationContextRunner;

class JsonPokedexRepositoryIntegrationTest {

    private static final int EXPECTED_REGULATION_M_A_SPECIES = 201;

    private final ApplicationContextRunner contextRunner =
            new ApplicationContextRunner().withUserConfiguration(DamageCalcApplication.class);

    @Test
    void loadsRegulationMAPokedexFromJson() {
        contextRunner.run(context -> {
            assertThat(context).hasNotFailed();

            var pokedexRepository = context.getBean(PokedexRepository.class);
            var species = pokedexRepository.findAllByRegulation("M-A");

            assertThat(species).hasSize(EXPECTED_REGULATION_M_A_SPECIES);

            assertThat(species.stream()
                            .filter(entry -> entry.id().equals("skeledirge"))
                            .findFirst())
                    .get()
                    .asInstanceOf(InstanceOfAssertFactories.type(PokemonSpecies.class))
                    .satisfies(skeledirge -> {
                        assertThat(skeledirge.name()).isEqualTo("Skeledirge");
                        assertThat(skeledirge.types()).containsExactly(Type.FIRE, Type.GHOST);
                        assertThat(skeledirge.baseStats().specialAttack()).isEqualTo(110);
                        assertThat(skeledirge.abilityIds()).containsExactly("blaze", "unaware");
                        assertThat(skeledirge.moveIds()).contains("torch-song", "shadow-ball", "hyper-voice");
                    });
        });
    }

    @Test
    void attachesMegaFormsToSpeciesDeclaredInMegaEvolutionsJson() {
        contextRunner.run(context -> {
            assertThat(context).hasNotFailed();

            var pokedexRepository = context.getBean(PokedexRepository.class);
            var species = pokedexRepository.findAllByRegulation("M-A");

            var charizard = species.stream()
                    .filter(entry -> entry.id().equals("charizard"))
                    .findFirst()
                    .orElseThrow();

            assertThat(charizard.megaForms())
                    .extracting(mega -> mega.id())
                    .contains("charizard-mega-x", "charizard-mega-y");
        });
    }

    @Test
    void speciesWithoutMegaFormExposesEmptyOptional() {
        contextRunner.run(context -> {
            var pokedexRepository = context.getBean(PokedexRepository.class);
            var species = pokedexRepository.findAllByRegulation("M-A");

            var hydrapple = species.stream()
                    .filter(entry -> entry.id().equals("hydrapple"))
                    .findFirst()
                    .orElseThrow();

            assertThat(hydrapple.megaForm()).isEmpty();
            assertThat(species).noneMatch(entry -> entry.id().equals("gholdengo"));
        });
    }

    @Test
    void exposesAlternateFormsAsDistinctSpeciesEntries() {
        contextRunner.run(context -> {
            var pokedexRepository = context.getBean(PokedexRepository.class);
            var species = pokedexRepository.findAllByRegulation("M-A");

            assertThat(species)
                    .extracting(PokemonSpecies::id)
                    .contains(
                            "rotom",
                            "rotom-heat",
                            "rotom-wash",
                            "meowstic-male",
                            "meowstic-female",
                            "aegislash-shield",
                            "aegislash-blade",
                            "lycanroc-midday",
                            "lycanroc-midnight",
                            "lycanroc-dusk",
                            "palafin-zero",
                            "palafin-hero")
                    .doesNotContain("meowstic", "aegislash", "lycanroc", "palafin");
        });
    }
}
