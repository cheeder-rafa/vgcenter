package com.vgcenter.damagecalc.application.usecase;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.vgcenter.damagecalc.application.port.ReplayParser;
import com.vgcenter.damagecalc.application.port.ReplaySource;
import com.vgcenter.damagecalc.domain.replay.ReplayTimeline;
import com.vgcenter.damagecalc.domain.replay.ReplayTurn;
import java.util.List;
import java.util.Map;
import org.junit.jupiter.api.Test;

class ParseReplayServiceTest {

    @Test
    void parsesRawProtocolLogDirectly() {
        RecordingReplayParser parser = new RecordingReplayParser();
        ParseReplayService service = new ParseReplayService(parser, url -> {
            throw new AssertionError("replay source should not be called for raw log parsing");
        });

        ReplayTimeline result = service.parse(new ParseReplayCommand(null, "|turn|1"));

        assertThat(result).isSameAs(parser.timeline);
        assertThat(parser.lastProtocolLog).isEqualTo("|turn|1");
    }

    @Test
    void fetchesReplayUrlBeforeParsing() {
        RecordingReplayParser parser = new RecordingReplayParser();
        RecordingReplaySource replaySource = new RecordingReplaySource("|turn|2");
        ParseReplayService service = new ParseReplayService(parser, replaySource);

        ReplayTimeline result =
                service.parse(new ParseReplayCommand("https://replay.pokemonshowdown.com/example", null));

        assertThat(result).isSameAs(parser.timeline);
        assertThat(replaySource.lastUrl).isEqualTo("https://replay.pokemonshowdown.com/example");
        assertThat(parser.lastProtocolLog).isEqualTo("|turn|2");
    }

    @Test
    void rejectsRequestWithoutUrlOrLog() {
        ParseReplayService service = new ParseReplayService(new RecordingReplayParser(), url -> "");

        assertThatThrownBy(() -> service.parse(new ParseReplayCommand(" ", " ")))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("either");
    }

    @Test
    void rejectsRequestWithBothUrlAndLog() {
        ParseReplayService service = new ParseReplayService(new RecordingReplayParser(), url -> "");

        assertThatThrownBy(() -> service.parse(new ParseReplayCommand("https://example.com", "|turn|1")))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("exactly one");
    }

    private static final class RecordingReplayParser implements ReplayParser {

        private final ReplayTimeline timeline = new ReplayTimeline(
                "Alice",
                "Bob",
                null,
                false,
                List.of(new ReplayTurn(1, ReplayTimelineFixtures.boardState(), List.of())),
                Map.of());

        private String lastProtocolLog;

        @Override
        public ReplayTimeline parse(String protocolLog) {
            lastProtocolLog = protocolLog;
            return timeline;
        }
    }

    private static final class RecordingReplaySource implements ReplaySource {

        private final String response;
        private String lastUrl;

        private RecordingReplaySource(String response) {
            this.response = response;
        }

        @Override
        public String fetch(String url) {
            lastUrl = url;
            return response;
        }
    }
}
