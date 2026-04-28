package com.vgcenter.damagecalc.infrastructure.replay;

import static org.assertj.core.api.Assertions.assertThat;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.vgcenter.damagecalc.domain.replay.ReplayBoardState;
import com.vgcenter.damagecalc.domain.replay.ReplayPokemonState;
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

    @Test
    void tracksStatusConditionAcrossTurnsAndClearsOnCureStatus() throws IOException {
        ReplayTimeline timeline =
                parser.parse(Files.readString(REPLAY_FIXTURE_DIR.resolve("status-brn-par.log")));

        assertThat(timeline.turns()).hasSize(4);

        // At the start of turn 2, brn and par are set from events in turn 1
        ReplayBoardState boardAtTurn2 = timeline.turns().get(1).boardStateAtStart();
        assertThat(boardAtTurn2.sideA().activePokemon())
                .filteredOn(p -> p.speciesName().equals("Venusaur"))
                .extracting(ReplayPokemonState::status)
                .containsOnly("par");
        assertThat(boardAtTurn2.sideA().activePokemon())
                .filteredOn(p -> p.speciesName().equals("Charizard"))
                .extracting(ReplayPokemonState::status)
                .containsOnly("brn");

        // At the start of turn 3, par is cured by -curestatus in turn 2; brn persists
        ReplayBoardState boardAtTurn3 = timeline.turns().get(2).boardStateAtStart();
        assertThat(boardAtTurn3.sideA().activePokemon())
                .filteredOn(p -> p.speciesName().equals("Venusaur"))
                .extracting(ReplayPokemonState::status)
                .containsOnly((String) null);
        assertThat(boardAtTurn3.sideA().activePokemon())
                .filteredOn(p -> p.speciesName().equals("Charizard"))
                .extracting(ReplayPokemonState::status)
                .containsOnly("brn");
    }

    @Test
    void tracksSlpPsnToxStatusConditions() throws IOException {
        ReplayTimeline timeline =
                parser.parse(Files.readString(REPLAY_FIXTURE_DIR.resolve("status-slp-psn-tox.log")));

        // At the start of turn 2, slp/psn/tox are set from -status events in turn 1
        ReplayBoardState boardAtTurn2 = timeline.turns().get(1).boardStateAtStart();
        assertThat(boardAtTurn2.sideA().activePokemon())
                .filteredOn(p -> p.speciesName().equals("Venusaur"))
                .extracting(ReplayPokemonState::status)
                .containsOnly("slp");
        assertThat(boardAtTurn2.sideB().activePokemon())
                .filteredOn(p -> p.speciesName().equals("Charizard"))
                .extracting(ReplayPokemonState::status)
                .containsOnly("psn");
        assertThat(boardAtTurn2.sideB().activePokemon())
                .filteredOn(p -> p.speciesName().equals("Ninetales"))
                .extracting(ReplayPokemonState::status)
                .containsOnly("tox");

        // At the start of turn 4, slp is cured; new switch-ins arrive with null status
        ReplayBoardState boardAtTurn4 = timeline.turns().get(3).boardStateAtStart();
        assertThat(boardAtTurn4.sideA().activePokemon())
                .filteredOn(p -> p.speciesName().equals("Venusaur"))
                .extracting(ReplayPokemonState::status)
                .containsOnly((String) null);
    }

    private void assertMatchesSnapshot(String logFilename, String snapshotFilename) throws IOException {
        ReplayTimeline timeline = parser.parse(Files.readString(REPLAY_FIXTURE_DIR.resolve(logFilename)));

        assertThat(OBJECT_MAPPER.writerWithDefaultPrettyPrinter().writeValueAsString(timeline))
                .isEqualTo(Files.readString(REPLAY_FIXTURE_DIR.resolve(snapshotFilename))
                        .trim());
    }
}
