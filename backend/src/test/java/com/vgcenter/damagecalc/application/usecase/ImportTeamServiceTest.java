package com.vgcenter.damagecalc.application.usecase;

import static org.assertj.core.api.Assertions.assertThat;

import com.vgcenter.damagecalc.application.port.PokepasteClient;
import com.vgcenter.damagecalc.application.port.TeamParser;
import java.util.List;
import org.junit.jupiter.api.Test;

class ImportTeamServiceTest {

    @Test
    void importsShowdownTextUsingTheDefaultRegulation() {
        RecordingTeamParser teamParser = new RecordingTeamParser();
        ImportTeamService service = new ImportTeamService(teamParser, url -> {
            throw new AssertionError("pokepaste client should not be called for showdown imports");
        });

        ImportedTeamResult result = service.importShowdown("paste text");

        assertThat(result.team()).containsExactly(teamParser.importedPokemon);
        assertThat(teamParser.lastRegulationId).isEqualTo("M-A");
        assertThat(teamParser.lastText).isEqualTo("paste text");
    }

    @Test
    void fetchesPokepasteBeforeParsingIt() {
        RecordingTeamParser teamParser = new RecordingTeamParser();
        RecordingPokepasteClient pokepasteClient = new RecordingPokepasteClient("fetched text");
        ImportTeamService service = new ImportTeamService(teamParser, pokepasteClient);

        ImportedTeamResult result = service.importPokepaste("https://pokepast.es/abc123");

        assertThat(result.team()).containsExactly(teamParser.importedPokemon);
        assertThat(pokepasteClient.lastUrl).isEqualTo("https://pokepast.es/abc123");
        assertThat(teamParser.lastRegulationId).isEqualTo("M-A");
        assertThat(teamParser.lastText).isEqualTo("fetched text");
    }

    private static final class RecordingTeamParser implements TeamParser {

        private final ImportedPokemonView importedPokemon = new ImportedPokemonView(
                "charizard",
                "Charizard",
                "Solaris",
                50,
                "M",
                "blaze",
                "charizardite-y",
                "timid",
                new StatsView(1, 0, 0, 32, 0, 32),
                new StatsView(138, 80, 83, 157, 105, 132),
                List.of("heat-wave", "protect"));

        private String lastRegulationId;
        private String lastText;

        @Override
        public List<ImportedPokemonView> parse(String regulationId, String text) {
            lastRegulationId = regulationId;
            lastText = text;
            return List.of(importedPokemon);
        }
    }

    private static final class RecordingPokepasteClient implements PokepasteClient {

        private final String response;
        private String lastUrl;

        private RecordingPokepasteClient(String response) {
            this.response = response;
        }

        @Override
        public String fetch(String url) {
            lastUrl = url;
            return response;
        }
    }
}
