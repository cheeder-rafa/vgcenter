package com.vgcenter.damagecalc.application.port;

import static org.assertj.core.api.Assertions.assertThat;

import com.vgcenter.damagecalc.domain.model.PokemonSpecies;
import com.vgcenter.damagecalc.domain.model.Stats;
import com.vgcenter.damagecalc.domain.model.Type;
import java.util.List;
import org.junit.jupiter.api.Test;

class PokedexRepositoryTest {

    @Test
    void findsSpeciesByIdWithinTheRequestedRegulation() {
        PokemonSpecies meowscarada = new PokemonSpecies(
                "meowscarada",
                "Meowscarada",
                List.of(Type.GRASS, Type.DARK),
                new Stats(76, 110, 70, 81, 70, 123),
                List.of("overgrow", "protean"),
                List.of("flower-trick"));
        PokemonSpecies skeledirge = new PokemonSpecies(
                "skeledirge",
                "Skeledirge",
                List.of(Type.FIRE, Type.GHOST),
                new Stats(104, 75, 100, 110, 75, 66),
                List.of("blaze", "unaware"),
                List.of("torch-song"));

        PokedexRepository repository = regulationId -> {
            assertThat(regulationId).isEqualTo("M-A");
            return List.of(meowscarada, skeledirge);
        };

        assertThat(repository.findById("M-A", "skeledirge")).contains(skeledirge);
        assertThat(repository.findById("M-A", "dragonite")).isEmpty();
    }
}
