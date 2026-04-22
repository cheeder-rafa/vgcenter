package com.vgcenter.damagecalc.infrastructure.importer;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

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
                    List.of("sleep-powder", "sludge-bomb", "giga-drain", "protect")),
            new PokemonSpecies(
                    "basculegion-male",
                    "Basculegion-Male",
                    List.of(Type.WATER, Type.GHOST),
                    new Stats(120, 112, 65, 80, 75, 78),
                    List.of("adaptability"),
                    List.of("liquidation", "aqua-jet", "last-respects", "protect")),
            new PokemonSpecies(
                    "pikachu",
                    "Pikachu",
                    List.of(Type.ELECTRIC),
                    new Stats(35, 55, 40, 50, 50, 90),
                    List.of("static"),
                    List.of("protect")),
            new PokemonSpecies(
                    "indeedee",
                    "Indeedee",
                    List.of(Type.PSYCHIC, Type.NORMAL),
                    new Stats(60, 65, 55, 105, 95, 95),
                    List.of("inner-focus"),
                    List.of("protect")),
            new PokemonSpecies(
                    "indeedee-female",
                    "Indeedee-Female",
                    List.of(Type.PSYCHIC, Type.NORMAL),
                    new Stats(70, 55, 65, 95, 105, 85),
                    List.of("psychic-surge"),
                    List.of("protect")),
            new PokemonSpecies(
                    "sneasler",
                    "Sneasler",
                    List.of(Type.FIGHTING, Type.POISON),
                    new Stats(80, 130, 60, 40, 80, 120),
                    List.of("pressure", "unburden"),
                    List.of("dire-claw", "close-combat", "fake-out", "protect")),
            new PokemonSpecies(
                    "kingambit",
                    "Kingambit",
                    List.of(Type.DARK, Type.STEEL),
                    new Stats(100, 135, 120, 60, 85, 50),
                    List.of("defiant", "supreme-overlord"),
                    List.of("kowtow-cleave", "sucker-punch", "low-kick", "protect")),
            new PokemonSpecies(
                    "froslass",
                    "Froslass",
                    List.of(Type.ICE, Type.GHOST),
                    new Stats(70, 80, 70, 80, 70, 110),
                    List.of("snow-cloak", "cursed-body"),
                    List.of("blizzard", "aurora-veil", "shadow-ball", "protect")),
            new PokemonSpecies(
                    "milotic",
                    "Milotic",
                    List.of(Type.WATER),
                    new Stats(95, 60, 79, 100, 125, 81),
                    List.of("marvel-scale", "competitive"),
                    List.of("scald", "icy-wind", "life-dew", "protect")),
            new PokemonSpecies(
                    "dragonite",
                    "Dragonite",
                    List.of(Type.DRAGON, Type.FLYING),
                    new Stats(91, 134, 95, 100, 100, 80),
                    List.of("inner-focus", "multiscale"),
                    List.of("dragon-claw", "tailwind", "low-kick", "extreme-speed")));

    private final MoveRepository moveRepository = regulationId -> List.of(
            new NamedDatasetEntry("heat-wave", "Heat Wave"),
            new NamedDatasetEntry("air-slash", "Air Slash"),
            new NamedDatasetEntry("protect", "Protect"),
            new NamedDatasetEntry("solar-beam", "Solar Beam"),
            new NamedDatasetEntry("sleep-powder", "Sleep Powder"),
            new NamedDatasetEntry("sludge-bomb", "Sludge Bomb"),
            new NamedDatasetEntry("giga-drain", "Giga Drain"),
            new NamedDatasetEntry("dire-claw", "Dire Claw"),
            new NamedDatasetEntry("close-combat", "Close Combat"),
            new NamedDatasetEntry("fake-out", "Fake Out"),
            new NamedDatasetEntry("kowtow-cleave", "Kowtow Cleave"),
            new NamedDatasetEntry("sucker-punch", "Sucker Punch"),
            new NamedDatasetEntry("low-kick", "Low Kick"),
            new NamedDatasetEntry("blizzard", "Blizzard"),
            new NamedDatasetEntry("aurora-veil", "Aurora Veil"),
            new NamedDatasetEntry("shadow-ball", "Shadow Ball"),
            new NamedDatasetEntry("scald", "Scald"),
            new NamedDatasetEntry("icy-wind", "Icy Wind"),
            new NamedDatasetEntry("life-dew", "Life Dew"),
            new NamedDatasetEntry("dragon-claw", "Dragon Claw"),
            new NamedDatasetEntry("tailwind", "Tailwind"),
            new NamedDatasetEntry("extreme-speed", "Extreme Speed"),
            new NamedDatasetEntry("liquidation", "Liquidation"),
            new NamedDatasetEntry("aqua-jet", "Aqua Jet"),
            new NamedDatasetEntry("last-respects", "Last Respects"));

    private final AbilityRepository abilityRepository = regulationId -> List.of(
            new NamedDatasetEntry("blaze", "Blaze"),
            new NamedDatasetEntry("solar-power", "Solar Power"),
            new NamedDatasetEntry("overgrow", "Overgrow"),
            new NamedDatasetEntry("chlorophyll", "Chlorophyll"),
            new NamedDatasetEntry("unburden", "Unburden"),
            new NamedDatasetEntry("defiant", "Defiant"),
            new NamedDatasetEntry("adaptability", "Adaptability"),
            new NamedDatasetEntry("cursed-body", "Cursed Body"),
            new NamedDatasetEntry("competitive", "Competitive"),
            new NamedDatasetEntry("multiscale", "Multiscale"));

    private final ItemRepository itemRepository = regulationId -> List.of(
            new NamedDatasetEntry("charizardite-y", "Charizardite Y"),
            new NamedDatasetEntry("focus-sash", "Focus Sash"),
            new NamedDatasetEntry("white-herb", "White Herb"),
            new NamedDatasetEntry("chople-berry", "Chople Berry"),
            new NamedDatasetEntry("froslassite", "Froslassite"),
            new NamedDatasetEntry("sitrus-berry", "Sitrus Berry"),
            new NamedDatasetEntry("dragon-fang", "Dragon Fang"));

    private final NatureRepository natureRepository =
            regulationId -> List.of(Nature.TIMID, Nature.CALM, Nature.SERIOUS, Nature.ADAMANT, Nature.BOLD);

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

    @Test
    void resolvesGenderSuffixToMaleSpeciesFormWhenDexEntryExists() {
        ImportedPokemonView pokemon =
                parser.parse("M-A", "Basculegion (M)\n- Protect").getFirst();

        assertThat(pokemon.speciesId()).isEqualTo("basculegion-male");
        assertThat(pokemon.speciesName()).isEqualTo("Basculegion-Male");
        assertThat(pokemon.gender()).isEqualTo("M");
    }

    @Test
    void stillResolvesExplicitMaleSpeciesFormName() {
        ImportedPokemonView pokemon =
                parser.parse("M-A", "Basculegion-Male\n- Protect").getFirst();

        assertThat(pokemon.speciesId()).isEqualTo("basculegion-male");
        assertThat(pokemon.speciesName()).isEqualTo("Basculegion-Male");
        assertThat(pokemon.gender()).isNull();
    }

    @Test
    void resolvesBasculegionWithoutGenderMarkerToMaleForm() {
        ImportedPokemonView pokemon =
                parser.parse("M-A", "Basculegion\n- Protect").getFirst();

        assertThat(pokemon.speciesId()).isEqualTo("basculegion-male");
        assertThat(pokemon.speciesName()).isEqualTo("Basculegion-Male");
        assertThat(pokemon.gender()).isNull();
    }

    @Test
    void ignoresGenderSuffixWhenSpeciesHasNoGenderedDexForm() {
        ImportedPokemonView pokemon =
                parser.parse("M-A", "Pikachu (M)\n- Protect").getFirst();

        assertThat(pokemon.speciesId()).isEqualTo("pikachu");
        assertThat(pokemon.speciesName()).isEqualTo("Pikachu");
        assertThat(pokemon.gender()).isEqualTo("M");
    }

    @Test
    void resolvesGenderSuffixToFemaleSpeciesFormWhenDexEntryExists() {
        ImportedPokemonView pokemon =
                parser.parse("M-A", "Indeedee (F)\n- Protect").getFirst();

        assertThat(pokemon.speciesId()).isEqualTo("indeedee-female");
        assertThat(pokemon.speciesName()).isEqualTo("Indeedee-Female");
        assertThat(pokemon.gender()).isEqualTo("F");
    }

    @Test
    void parsesPokepasteBodyWithStrayBlankLineBeforeAbility() {
        List<ImportedPokemonView> team = parser.parse("M-A", """
                Sneasler @ White Herb

                Ability: Unburden
                Level: 50
                EVs: 32 HP / 1 Atk / 28 Def / 1 SpD / 4 Spe
                Adamant Nature
                - Dire Claw
                - Close Combat
                - Fake Out
                - Protect

                Kingambit @ Chople Berry
                Ability: Defiant
                Level: 50
                EVs: 8 HP / 32 Atk / 1 Def / 25 Spe
                Adamant Nature
                - Kowtow Cleave
                - Sucker Punch
                - Low Kick
                - Protect

                Basculegion (M) @ Focus Sash
                Ability: Adaptability
                Level: 50
                EVs: 32 Atk / 1 Def / 1 SpD / 32 Spe
                Adamant Nature
                - Liquidation
                - Aqua Jet
                - Last Respects
                - Protect

                Froslass (F) @ Froslassite
                Ability: Cursed Body
                Level: 50
                EVs: 32 HP / 15 Def / 1 SpA / 18 Spe
                Timid Nature
                - Blizzard
                - Aurora Veil
                - Shadow Ball
                - Protect

                Milotic @ Sitrus Berry
                Ability: Competitive
                Level: 50
                EVs: 31 HP / 11 Def / 7 SpA / 4 SpD / 13 Spe
                Bold Nature
                - Scald
                - Icy Wind
                - Life Dew
                - Protect

                Dragonite @ Dragon Fang
                Ability: Multiscale
                Level: 50
                EVs: 21 HP / 32 Atk / 13 Spe
                Adamant Nature
                - Dragon Claw
                - Tailwind
                - Low Kick
                - Extreme Speed
                """);

        assertThat(team).hasSize(6);
        assertThat(team.getFirst().speciesId()).isEqualTo("sneasler");
        assertThat(team.getFirst().abilityId()).isEqualTo("unburden");
        assertThat(team.getFirst().sp())
                .isEqualTo(new com.vgcenter.damagecalc.application.usecase.StatsView(32, 1, 28, 0, 1, 4));
        assertThat(team.get(1).sp())
                .isEqualTo(new com.vgcenter.damagecalc.application.usecase.StatsView(8, 32, 1, 0, 0, 25));
        assertThat(team.get(5).sp())
                .isEqualTo(new com.vgcenter.damagecalc.application.usecase.StatsView(21, 32, 0, 0, 0, 13));
    }

    @Test
    void rejectsBlockWhoseFirstLineIsAbilityWithClearMessage() {
        assertThatThrownBy(() -> parser.parse("M-A", """
                Ability: Unburden
                Level: 50
                - Protect
                """))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("Invalid Showdown set header: Ability: Unburden")
                .hasMessageNotContaining("Unknown species:");
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
