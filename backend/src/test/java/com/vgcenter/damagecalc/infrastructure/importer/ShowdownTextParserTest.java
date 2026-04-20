package com.vgcenter.damagecalc.infrastructure.importer;

import static org.assertj.core.api.Assertions.assertThat;

import com.vgcenter.damagecalc.application.port.AbilityRepository;
import com.vgcenter.damagecalc.application.port.ItemRepository;
import com.vgcenter.damagecalc.application.port.MoveRepository;
import com.vgcenter.damagecalc.application.port.NatureRepository;
import com.vgcenter.damagecalc.application.port.PokedexRepository;
import com.vgcenter.damagecalc.application.usecase.ImportedPokemonView;
import com.vgcenter.damagecalc.application.usecase.NamedDatasetEntry;
import com.vgcenter.damagecalc.domain.model.Nature;
import com.vgcenter.damagecalc.domain.model.PokemonSpecies;
import com.vgcenter.damagecalc.domain.model.Sp;
import com.vgcenter.damagecalc.domain.model.Stats;
import com.vgcenter.damagecalc.domain.model.Type;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.List;
import org.junit.jupiter.api.Test;

class ShowdownTextParserTest {

    private final PokedexRepository pokedexRepository = regulationId -> List.of(
            new PokemonSpecies(
                    "charizard",
                    "Charizard",
                    List.of(Type.FIRE, Type.FLYING),
                    new Stats(78, 84, 78, 109, 85, 100),
                    List.of("blaze", "solar-power"),
                    List.of("heat-wave", "air-slash", "protect", "solar-beam")),
            new PokemonSpecies(
                    "venusaur",
                    "Venusaur",
                    List.of(Type.GRASS, Type.POISON),
                    new Stats(80, 82, 83, 100, 100, 80),
                    List.of("overgrow", "chlorophyll"),
                    List.of("sleep-powder", "sludge-bomb", "giga-drain", "protect")));

    private final MoveRepository moveRepository = regulationId -> List.of(
            new NamedDatasetEntry("heat-wave", "Heat Wave"),
            new NamedDatasetEntry("air-slash", "Air Slash"),
            new NamedDatasetEntry("protect", "Protect"),
            new NamedDatasetEntry("solar-beam", "Solar Beam"),
            new NamedDatasetEntry("sleep-powder", "Sleep Powder"),
            new NamedDatasetEntry("sludge-bomb", "Sludge Bomb"),
            new NamedDatasetEntry("giga-drain", "Giga Drain"));

    private final AbilityRepository abilityRepository = regulationId -> List.of(
            new NamedDatasetEntry("blaze", "Blaze"),
            new NamedDatasetEntry("solar-power", "Solar Power"),
            new NamedDatasetEntry("overgrow", "Overgrow"),
            new NamedDatasetEntry("chlorophyll", "Chlorophyll"));

    private final ItemRepository itemRepository = regulationId -> List.of(
            new NamedDatasetEntry("charizardite-y", "Charizardite Y"),
            new NamedDatasetEntry("focus-sash", "Focus Sash"));

    private final NatureRepository natureRepository =
            regulationId -> List.of(Nature.TIMID, Nature.CALM, Nature.SERIOUS);

    private final ShowdownTextParser parser = new ShowdownTextParser(
            pokedexRepository, moveRepository, abilityRepository, itemRepository, natureRepository);

    @Test
    void parsesFixtureIntoRegulationBackedImportedPokemon() throws IOException {
        List<ImportedPokemonView> team = parser.parse("M-A", loadFixture("showdown-import-team.txt"));

        assertThat(team).hasSize(2);
        assertThat(team.getFirst()).satisfies(charizard -> {
            assertThat(charizard.speciesId()).isEqualTo("charizard");
            assertThat(charizard.speciesName()).isEqualTo("Charizard");
            assertThat(charizard.nickname()).isEqualTo("Solaris");
            assertThat(charizard.gender()).isEqualTo("M");
            assertThat(charizard.level()).isEqualTo(50);
            assertThat(charizard.abilityId()).isEqualTo("blaze");
            assertThat(charizard.itemId()).isEqualTo("charizardite-y");
            assertThat(charizard.natureId()).isEqualTo("timid");
            assertThat(charizard.sp())
                    .isEqualTo(new com.vgcenter.damagecalc.application.usecase.StatsView(1, 0, 0, 32, 0, 32));
            assertThat(charizard.stats())
                    .isEqualTo(toStatsView(new Stats(78, 84, 78, 109, 85, 100)
                            .toBattleStats(new Sp(1, 0, 0, 32, 0, 32), Nature.TIMID, 50)));
            assertThat(charizard.moveIds()).containsExactly("heat-wave", "air-slash", "protect", "solar-beam");
        });
        assertThat(team.get(1)).satisfies(venusaur -> {
            assertThat(venusaur.speciesId()).isEqualTo("venusaur");
            assertThat(venusaur.nickname()).isNull();
            assertThat(venusaur.gender()).isEqualTo("F");
            assertThat(venusaur.itemId()).isEqualTo("focus-sash");
            assertThat(venusaur.abilityId()).isEqualTo("chlorophyll");
            assertThat(venusaur.natureId()).isEqualTo("calm");
            assertThat(venusaur.sp())
                    .isEqualTo(new com.vgcenter.damagecalc.application.usecase.StatsView(32, 0, 1, 0, 0, 32));
            assertThat(venusaur.moveIds()).containsExactly("sleep-powder", "sludge-bomb", "giga-drain", "protect");
        });
    }

    private static String loadFixture(String fileName) throws IOException {
        try (var inputStream = ShowdownTextParserTest.class.getResourceAsStream("/fixtures/" + fileName)) {
            return new String(inputStream.readAllBytes(), StandardCharsets.UTF_8);
        }
    }

    private static com.vgcenter.damagecalc.application.usecase.StatsView toStatsView(Stats stats) {
        return new com.vgcenter.damagecalc.application.usecase.StatsView(
                stats.hp(),
                stats.attack(),
                stats.defense(),
                stats.specialAttack(),
                stats.specialDefense(),
                stats.speed());
    }
}
