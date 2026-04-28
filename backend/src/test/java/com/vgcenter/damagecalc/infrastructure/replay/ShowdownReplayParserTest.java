package com.vgcenter.damagecalc.infrastructure.replay;

import static org.assertj.core.api.Assertions.assertThat;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.vgcenter.damagecalc.domain.replay.ReplayTimeline;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.stream.Stream;
import org.junit.jupiter.api.Test;

class ShowdownReplayParserTest {

    private static final ObjectMapper OBJECT_MAPPER = new ObjectMapper();
    private static final Path REPLAY_FIXTURE_DIR = Path.of("src/test/resources/replays");

    private final ShowdownReplayParser parser = new ShowdownReplayParser();

    @Test
    void parsesSingleGameFixtureIntoExpectedSnapshot() throws IOException {
        assertMatchesSnapshot("single-regma-2593988469.log", "single-regma-2593988469.timeline.json");
    }

    @Test
    void parsesBestOfThreeGameOneFixtureIntoExpectedSnapshot() throws IOException {
        assertMatchesSnapshot("bo3-game1-2586638266.log", "bo3-game1-2586638266.timeline.json");
    }

    @Test
    void parsesBestOfThreeGameTwoFixtureIntoExpectedSnapshot() throws IOException {
        assertMatchesSnapshot("bo3-game2-2586642583.log", "bo3-game2-2586642583.timeline.json");
    }

    @Test
    void capturesBoardStateAtStartOfTurnBeforeEventsResolve() throws IOException {
        ReplayTimeline timeline =
                parser.parse(Files.readString(REPLAY_FIXTURE_DIR.resolve("single-regma-2593988469.log")));

        assertThat(timeline.turns()).hasSize(10);
        assertThat(timeline.turns().getFirst().boardStateAtStart().sideA().activePokemon())
                .extracting(pokemon -> pokemon.speciesName())
                .containsExactly("Venusaur", "Dragapult");
        assertThat(timeline.turns().get(6).boardStateAtStart().sideB().tailwind())
                .isTrue();
        assertThat(timeline.turns().get(8).boardStateAtStart().weather()).isEqualTo("Snowscape");
    }

    @Test
    void keepsDamageAndFaintEventsInBattleOrder() throws IOException {
        ReplayTimeline timeline =
                parser.parse(Files.readString(REPLAY_FIXTURE_DIR.resolve("single-regma-2593988469.log")));

        assertThat(Stream.concat(timeline.turns().stream().flatMap(turn -> turn.events().stream()), Stream.empty())
                        .map(event -> event.type()))
                .containsSubsequence("-damage", "faint");
    }

    private void assertMatchesSnapshot(String logFilename, String snapshotFilename) throws IOException {
        ReplayTimeline timeline = parser.parse(Files.readString(REPLAY_FIXTURE_DIR.resolve(logFilename)));

        assertThat(OBJECT_MAPPER.writerWithDefaultPrettyPrinter().writeValueAsString(timeline))
                .isEqualTo(Files.readString(REPLAY_FIXTURE_DIR.resolve(snapshotFilename))
                        .trim());
    }
}
