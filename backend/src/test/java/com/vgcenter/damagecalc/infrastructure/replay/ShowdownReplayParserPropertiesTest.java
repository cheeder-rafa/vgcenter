package com.vgcenter.damagecalc.infrastructure.replay;

import static org.assertj.core.api.Assertions.assertThat;

import com.vgcenter.damagecalc.domain.replay.ReplayEvent;
import com.vgcenter.damagecalc.domain.replay.ReplayTimeline;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.List;
import net.jqwik.api.Arbitraries;
import net.jqwik.api.Arbitrary;
import net.jqwik.api.ForAll;
import net.jqwik.api.Property;
import net.jqwik.api.Provide;

class ShowdownReplayParserPropertiesTest {

    private static final Path REPLAY_FIXTURE_DIR = Path.of("src/test/resources/replays");

    private final ShowdownReplayParser parser = new ShowdownReplayParser();

    @Property
    void turnNumbersStrictlyIncrease(@ForAll("fixtureNames") String fixtureName) throws IOException {
        ReplayTimeline timeline = parseFixture(fixtureName);

        assertThat(timeline.turns())
                .extracting(turn -> turn.number())
                .isSorted()
                .doesNotHaveDuplicates();
    }

    @Property
    void faintAlwaysFollowsZeroDamageEvent(@ForAll("fixtureNames") String fixtureName) throws IOException {
        ReplayTimeline timeline = parseFixture(fixtureName);

        for (var turn : timeline.turns()) {
            List<ReplayEvent> events = turn.events();
            for (int index = 1; index < events.size(); index++) {
                ReplayEvent event = events.get(index);
                if (!event.type().equals("faint")) {
                    continue;
                }
                int damageIndex = index - 1;
                while (damageIndex >= 0 && !events.get(damageIndex).type().equals("-damage")) {
                    damageIndex--;
                }
                assertThat(damageIndex).isGreaterThanOrEqualTo(0);
                ReplayEvent damageEvent = events.get(damageIndex);
                assertThat(damageEvent.arguments()).isNotEmpty();
                assertThat(damageEvent.arguments().get(1)).contains("0 fnt");
            }
        }
    }

    @Provide
    Arbitrary<String> fixtureNames() {
        return Arbitraries.of(
                "single-regma-2593988469.log",
                "bo3-game1-2586638266.log",
                "bo3-game2-2586642583.log",
                "status-brn-par.log",
                "status-slp-psn-tox.log",
                "bo3-with-brn-game1.log",
                "bo3-with-brn-game2.log");
    }

    private ReplayTimeline parseFixture(String fixtureName) throws IOException {
        return parser.parse(Files.readString(REPLAY_FIXTURE_DIR.resolve(fixtureName)));
    }
}
