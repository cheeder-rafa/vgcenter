package com.vgcenter.damagecalc.domain.gameplan;

import static org.assertj.core.api.Assertions.assertThat;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.io.IOException;
import java.io.InputStream;
import java.util.List;
import org.junit.jupiter.api.Test;

class MatchupScorerTest {

    private final MatchupScorer scorer = new MatchupScorer();

    @Test
    void matchesGoldenFixture() throws IOException {
        for (GoldenCase goldenCase : loadFixture()) {
            MatchupScore score = scorer.score(new MatchupScorer.MatchupScoreContext(
                    goldenCase.offense(),
                    goldenCase.defense(),
                    goldenCase.fasterMatchups(),
                    goldenCase.slowerMatchups(),
                    goldenCase.immunityBlocks()));

            assertThat(score.offense()).as(goldenCase.name()).isEqualTo(goldenCase.expectedOffense());
            assertThat(score.defense()).as(goldenCase.name()).isEqualTo(goldenCase.expectedDefense());
            assertThat(score.speed()).as(goldenCase.name()).isEqualTo(goldenCase.expectedSpeed());
            assertThat(score.immunity()).as(goldenCase.name()).isEqualTo(goldenCase.expectedImmunity());
            assertThat(score.total()).as(goldenCase.name()).isEqualTo(goldenCase.expectedTotal());
        }
    }

    private List<GoldenCase> loadFixture() throws IOException {
        ObjectMapper objectMapper = new ObjectMapper();
        try (InputStream inputStream =
                getClass().getResourceAsStream("/fixtures/gameplan/matchup-scorer-golden.json")) {
            return objectMapper.readValue(inputStream, new TypeReference<List<GoldenCase>>() {});
        }
    }

    private record GoldenCase(
            String name,
            List<MatchupScorer.LeadPressure> offense,
            List<MatchupScorer.LeadPressure> defense,
            int fasterMatchups,
            int slowerMatchups,
            int immunityBlocks,
            int expectedOffense,
            int expectedDefense,
            int expectedSpeed,
            int expectedImmunity,
            int expectedTotal) {}
}
