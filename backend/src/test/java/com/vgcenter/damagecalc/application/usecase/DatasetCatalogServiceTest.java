package com.vgcenter.damagecalc.application.usecase;

import static org.assertj.core.api.Assertions.assertThat;

import com.vgcenter.damagecalc.application.port.MoveRepository;
import com.vgcenter.damagecalc.domain.mega.MegaForm;
import com.vgcenter.damagecalc.domain.model.PokemonSpecies;
import com.vgcenter.damagecalc.domain.model.Stats;
import com.vgcenter.damagecalc.domain.model.Type;
import java.util.List;
import org.junit.jupiter.api.Test;

class DatasetCatalogServiceTest {

    @Test
    void exposesDatasetEntriesThroughApplicationViews() {
        MoveRepository moveRepository = new MoveRepository() {
            @Override
            public List<NamedDatasetEntry> findAllByRegulation(String regulationId) {
                return List.of(new NamedDatasetEntry("heat-wave", "Heat Wave"));
            }

            @Override
            public List<MoveDefinition> findDefinitionsByRegulation(String regulationId) {
                return List.of(
                        new MoveDefinition("heat-wave", "Heat Wave", "FIRE", "SPECIAL", 95, true, false, false, false));
            }
        };

        DatasetCatalogService service = new DatasetCatalogService(
                regulationId -> List.of(new PokemonSpecies(
                        "charizard",
                        "Charizard",
                        List.of(Type.FIRE, Type.FLYING),
                        new Stats(78, 84, 78, 109, 85, 100),
                        List.of("blaze"),
                        List.of("heat-wave", "protect"),
                        new MegaForm(
                                "charizard-mega-y",
                                "Charizard-Mega-Y",
                                List.of(Type.FIRE, Type.FLYING),
                                new Stats(78, 104, 78, 159, 115, 100),
                                "drought"))),
                moveRepository,
                regulationId -> List.of(new NamedDatasetEntry("blaze", "Blaze")),
                regulationId -> List.of(new NamedDatasetEntry("life-orb", "Life Orb")),
                regulationId -> List.of(new NatureDefinition("modest", "Modest", "SPECIAL_ATTACK", "ATTACK")));

        assertThat(service.pokedex("M-A")).singleElement().satisfies(entry -> {
            assertThat(entry.id()).isEqualTo("charizard");
            assertThat(entry.megaForms()).singleElement().satisfies(megaForm -> {
                assertThat(megaForm.id()).isEqualTo("charizard-mega-y");
                assertThat(megaForm.abilityId()).isEqualTo("drought");
            });
        });
        assertThat(service.moves("M-A"))
                .containsExactly(
                        new MoveDefinition("heat-wave", "Heat Wave", "FIRE", "SPECIAL", 95, true, false, false, false));
        assertThat(service.abilities("M-A")).containsExactly(new NamedDatasetEntry("blaze", "Blaze"));
        assertThat(service.items("M-A")).containsExactly(new NamedDatasetEntry("life-orb", "Life Orb"));
        assertThat(service.natures("M-A"))
                .containsExactly(new NatureDefinition("modest", "Modest", "SPECIAL_ATTACK", "ATTACK"));
    }
}
