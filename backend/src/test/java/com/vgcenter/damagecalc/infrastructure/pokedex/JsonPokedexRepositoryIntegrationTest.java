package com.vgcenter.damagecalc.infrastructure.pokedex;

import static org.assertj.core.api.Assertions.assertThat;

import com.vgcenter.damagecalc.DamageCalcApplication;
import com.vgcenter.damagecalc.application.port.PokedexRepository;
import com.vgcenter.damagecalc.domain.model.Type;
import org.assertj.core.api.InstanceOfAssertFactories;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.runner.ApplicationContextRunner;

class JsonPokedexRepositoryIntegrationTest {

    private final ApplicationContextRunner contextRunner =
            new ApplicationContextRunner().withUserConfiguration(DamageCalcApplication.class);

    @Test
    void loadsMinimalRegulationMAPokedexFromJson() {
        contextRunner.run(context -> {
            assertThat(context).hasNotFailed();

            var pokedexRepository = context.getBean(PokedexRepository.class);
            var species = pokedexRepository.findAllByRegulation("M-A");

            assertThat(species).hasSize(10);

            assertThat(species.stream()
                            .filter(entry -> entry.id().equals("skeledirge"))
                            .findFirst())
                    .get()
                    .asInstanceOf(
                            InstanceOfAssertFactories.type(com.vgcenter.damagecalc.domain.model.PokemonSpecies.class))
                    .satisfies(skeledirge -> {
                        assertThat(skeledirge.name()).isEqualTo("Skeledirge");
                        assertThat(skeledirge.types()).containsExactly(Type.FIRE, Type.GHOST);
                        assertThat(skeledirge.baseStats().specialAttack()).isEqualTo(110);
                        assertThat(skeledirge.abilityIds()).containsExactly("blaze", "unaware");
                        assertThat(skeledirge.moveIds()).contains("torch-song", "shadow-ball", "hyper-voice");
                        assertThat(skeledirge.itemIds()).contains("life-orb", "throat-spray");
                    });
        });
    }
}
