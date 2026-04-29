package com.vgcenter.damagecalc.application.usecase;

import static org.assertj.core.api.Assertions.assertThat;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.vgcenter.damagecalc.application.port.MoveRepository;
import com.vgcenter.damagecalc.application.port.PokedexRepository;
import com.vgcenter.damagecalc.domain.model.PokemonSpecies;
import com.vgcenter.damagecalc.domain.model.Stats;
import com.vgcenter.damagecalc.domain.model.Type;
import com.vgcenter.damagecalc.domain.replay.ReplayBoardState;
import com.vgcenter.damagecalc.domain.replay.ReplayBoostState;
import com.vgcenter.damagecalc.domain.replay.ReplayEvent;
import com.vgcenter.damagecalc.domain.replay.ReplayPokemonState;
import com.vgcenter.damagecalc.domain.replay.ReplaySideState;
import com.vgcenter.damagecalc.domain.replay.ReplayTimeline;
import com.vgcenter.damagecalc.domain.replay.ReplayTurn;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import org.junit.jupiter.api.Test;

class EvaluateReplayDecisionsServiceTest {

    private static final ReplayScoringWeights DEFAULT_WEIGHTS = new ReplayScoringWeights(1.0d, 1.0d, 30.0d, 20.0d);

    @Test
    void ranksAlternativeMovePairsAgainstPlayedLine() {
        RecordingCalculateDamageUseCase calculateDamageUseCase = new RecordingCalculateDamageUseCase();
        EvaluateReplayDecisionsService service = new EvaluateReplayDecisionsService(
                new StubPokedexRepository(List.of(
                        species("alpha", "Alpha", Type.FIRE, List.of("slam", "blast")),
                        species("beta", "Beta", Type.POISON, List.of("jab", "guard")),
                        species("gamma", "Gamma", Type.WATER, List.of("poke")),
                        species("delta", "Delta", Type.DARK, List.of("counter")))),
                new StubMoveRepository(List.of(
                        damagingMove("slam", "Slam", "NORMAL", 35),
                        damagingMove("blast", "Blast", "FIRE", 80),
                        damagingMove("jab", "Jab", "POISON", 45),
                        statusMove("guard", "Guard"),
                        damagingMove("poke", "Poke", "WATER", 30),
                        damagingMove("counter", "Counter", "DARK", 40))),
                calculateDamageUseCase);

        ReplayTimeline timeline = new ReplayTimeline(
                "Alice",
                "Bob",
                null,
                false,
                List.of(new ReplayTurn(
                        1,
                        boardState(),
                        List.of(
                                move("p1a: Alpha", "Slam", "p2a: Gamma"),
                                move("p1b: Beta", "Guard", "p1b: Beta"),
                                move("p2a: Gamma", "Poke", "p1a: Alpha"),
                                move("p2b: Delta", "Counter", "p1b: Beta")))),
                Map.of(
                        "Alpha", List.of("Slam", "Blast"),
                        "Beta", List.of("Jab", "Guard"),
                        "Gamma", List.of("Poke"),
                        "Delta", List.of("Counter")));

        EvaluateReplayDecisionsResult result =
                service.evaluate(new EvaluateReplayDecisionsCommand("M-A", List.of(timeline), DEFAULT_WEIGHTS, "P1"));

        assertThat(result.games()).hasSize(1);
        TurnReview review = result.games().getFirst().turnReviews().getFirst();
        assertThat(review.verdict()).isEqualTo("suboptimal");
        assertThat(review.played().expectedDamageDealt()).isEqualTo(35.0d);
        assertThat(review.played().expectedDamageTaken()).isEqualTo(70.0d);
        assertThat(review.delta()).isGreaterThan(0.0d);
        assertThat(review.rankedAlternatives()).isNotEmpty();
        assertThat(review.rankedAlternatives().getFirst().choices())
                .extracting(ReplayMoveChoice::moveName)
                .containsExactly("Blast", "Jab");
        assertThat(review.rankedAlternatives().getFirst().score())
                .isGreaterThan(review.played().score());
        assertThat(calculateDamageUseCase.calls)
                .extracting(command -> command.attacker().types().getFirst())
                .contains("FIRE", "POISON", "WATER", "DARK");
        assertThat(calculateDamageUseCase.calls)
                .anySatisfy(
                        command -> assertThat(command.attacker().currentHp()).isEqualTo(98))
                .anySatisfy(
                        command -> assertThat(command.defender().currentHp()).isEqualTo(78));
    }

    @Test
    void protectDominatesAttackWhenFaintThreatIsHigh() {
        // Alpha has Blast (80 BP) and Protect. Opponent's Gamma threatens a KO on Alpha.
        // Protect should rank above attacking because it nullifies the faint pressure.
        EvaluateReplayDecisionsService service = new EvaluateReplayDecisionsService(
                new StubPokedexRepository(List.of(
                        species("alpha", "Alpha", Type.FIRE, List.of("blast", "protect")),
                        species("gamma", "Gamma", Type.WATER, List.of("hydro")))),
                new StubMoveRepository(List.of(
                        damagingMove("blast", "Blast", "FIRE", 80),
                        statusMove("protect", "Protect"),
                        damagingMove("hydro", "Hydro", "WATER", 110))),
                new KoThreatCalculateDamageUseCase());

        ReplayTimeline timeline = new ReplayTimeline(
                "Alice",
                "Bob",
                null,
                false,
                List.of(new ReplayTurn(
                        1,
                        boardState(),
                        List.of(
                                // Alpha attacks, but opponent KOs Alpha
                                move("p1a: Alpha", "Blast", "p2a: Gamma"), move("p2a: Gamma", "Hydro", "p1a: Alpha")))),
                Map.of("Alpha", List.of("Blast", "Protect"), "Gamma", List.of("Hydro")));

        EvaluateReplayDecisionsResult result =
                service.evaluate(new EvaluateReplayDecisionsCommand("M-A", List.of(timeline), DEFAULT_WEIGHTS, "P1"));

        TurnReview review = result.games().getFirst().turnReviews().getFirst();
        // Protect alternative should appear in ranked alternatives
        boolean protectAlternativePresent = review.rankedAlternatives().stream()
                .anyMatch(line -> line.choices().stream().anyMatch(c -> "PROTECT".equals(c.kind())));
        assertThat(protectAlternativePresent).isTrue();
        // Protect alternative must have lower expectedDamageTaken than the played line
        review.rankedAlternatives().stream()
                .filter(line -> line.choices().stream().anyMatch(c -> "PROTECT".equals(c.kind())))
                .findFirst()
                .ifPresent(protectLine -> assertThat(protectLine.expectedDamageTaken())
                        .isLessThan(review.played().expectedDamageTaken()));
    }

    @Test
    void protectDoesNotRankHigherThanGuaranteedKoAttack() {
        // When Alpha can KO the opponent, attacking should outscore Protect.
        EvaluateReplayDecisionsService service = new EvaluateReplayDecisionsService(
                new StubPokedexRepository(List.of(
                        species("alpha", "Alpha", Type.FIRE, List.of("blast", "protect")),
                        species("gamma", "Gamma", Type.WATER, List.of("splash")))),
                new StubMoveRepository(List.of(
                        damagingMove("blast", "Blast", "FIRE", 80),
                        statusMove("protect", "Protect"),
                        statusMove("splash", "Splash"))),
                new GuaranteedKoCalculateDamageUseCase());

        ReplayTimeline timeline = new ReplayTimeline(
                "Alice",
                "Bob",
                null,
                false,
                List.of(new ReplayTurn(1, boardState(), List.of(move("p1a: Alpha", "Blast", "p2a: Gamma")))),
                Map.of("Alpha", List.of("Blast", "Protect"), "Gamma", List.of("Splash")));

        EvaluateReplayDecisionsResult result =
                service.evaluate(new EvaluateReplayDecisionsCommand("M-A", List.of(timeline), DEFAULT_WEIGHTS, "P1"));

        TurnReview review = result.games().getFirst().turnReviews().getFirst();
        // When attacking KOs, the played line is optimal — no alternative scores higher
        assertThat(review.verdict()).isEqualTo("optimal");
        assertThat(review.delta()).isLessThanOrEqualTo(0.01d);
        // Protect alternative, if present, must score worse than the played KO line
        review.rankedAlternatives().stream()
                .filter(line -> line.choices().stream().anyMatch(c -> "PROTECT".equals(c.kind())))
                .findFirst()
                .ifPresent(protectLine -> assertThat(protectLine.score())
                        .isLessThan(review.played().score()));
    }

    @Test
    void advisoryFiresWhenFaintPressureIsHighAndBestLineIsLosing() {
        // Opponent's Gamma and Delta both threaten to KO Alpha. Even best line loses.
        EvaluateReplayDecisionsService service = new EvaluateReplayDecisionsService(
                new StubPokedexRepository(List.of(
                        species("alpha", "Alpha", Type.FIRE, List.of("splash")),
                        species("beta", "Beta", Type.POISON, List.of("splash")),
                        species("gamma", "Gamma", Type.WATER, List.of("hydro")),
                        species("delta", "Delta", Type.DARK, List.of("crunch")))),
                new StubMoveRepository(List.of(
                        statusMove("splash", "Splash"),
                        damagingMove("hydro", "Hydro", "WATER", 110),
                        damagingMove("crunch", "Crunch", "DARK", 80))),
                new KoThreatCalculateDamageUseCase());

        ReplayTimeline timeline = new ReplayTimeline(
                "Alice",
                "Bob",
                null,
                false,
                List.of(new ReplayTurn(
                        1,
                        boardState(),
                        List.of(
                                move("p1a: Alpha", "Splash", "p1a: Alpha"),
                                move("p1b: Beta", "Splash", "p1b: Beta"),
                                move("p2a: Gamma", "Hydro", "p1a: Alpha"),
                                move("p2b: Delta", "Crunch", "p1a: Alpha")))),
                Map.of(
                        "Alpha", List.of("Splash"),
                        "Beta", List.of("Splash"),
                        "Gamma", List.of("Hydro"),
                        "Delta", List.of("Crunch")));

        EvaluateReplayDecisionsResult result =
                service.evaluate(new EvaluateReplayDecisionsCommand("M-A", List.of(timeline), DEFAULT_WEIGHTS, "P1"));

        TurnReview review = result.games().getFirst().turnReviews().getFirst();
        assertThat(review.advisory()).isNotNull();
        assertThat(review.advisory()).contains("Alpha");
    }

    @Test
    void advisoryDoesNotFireWhenUserHasWinningResponse() {
        // Alpha can KO opponent; faint threat exists but the trade is winning.
        EvaluateReplayDecisionsService service = new EvaluateReplayDecisionsService(
                new StubPokedexRepository(List.of(
                        species("alpha", "Alpha", Type.FIRE, List.of("blast")),
                        species("gamma", "Gamma", Type.WATER, List.of("hydro")))),
                new StubMoveRepository(List.of(
                        damagingMove("blast", "Blast", "FIRE", 80), damagingMove("hydro", "Hydro", "WATER", 110))),
                new GuaranteedKoCalculateDamageUseCase());

        ReplayTimeline timeline = new ReplayTimeline(
                "Alice",
                "Bob",
                null,
                false,
                List.of(new ReplayTurn(
                        1,
                        singleActiveBoardState(),
                        List.of(move("p1a: Alpha", "Blast", "p2a: Gamma"), move("p2a: Gamma", "Hydro", "p1a: Alpha")))),
                Map.of("Alpha", List.of("Blast"), "Gamma", List.of("Hydro")));

        EvaluateReplayDecisionsResult result =
                service.evaluate(new EvaluateReplayDecisionsCommand("M-A", List.of(timeline), DEFAULT_WEIGHTS, "P1"));

        TurnReview review = result.games().getFirst().turnReviews().getFirst();
        assertThat(review.advisory()).isNull();
    }

    @Test
    void emitsBo3AdaptationFlagsForReferenceReplayPair() throws IOException {
        EvaluateReplayDecisionsService service = new EvaluateReplayDecisionsService(
                new StubPokedexRepository(referenceSpecies()),
                new StubMoveRepository(referenceMoves()),
                new ConstantDamageUseCase());

        ReplayTimeline gameOne = trimToOpeningTurn(loadTimeline("bo3-game1-2586638266.timeline.json"));
        ReplayTimeline gameTwo = trimToOpeningTurn(loadTimeline("bo3-game2-2586642583.timeline.json"));

        EvaluateReplayDecisionsResult result = service.evaluate(
                new EvaluateReplayDecisionsCommand("M-A", List.of(gameOne, gameTwo), DEFAULT_WEIGHTS, "P1"));

        assertThat(result.games()).hasSize(2);
        assertThat(result.adaptationFlags())
                .anySatisfy(flag -> assertThat(flag).contains("opponent re-led Aerodactyl + Floette-Eternal"))
                .anySatisfy(flag -> assertThat(flag).contains("user changed win condition"));
    }

    @Test
    void wideGuardCreditsBothAlliesAgainstSpreadMove() {
        EvaluateReplayDecisionsService service = new EvaluateReplayDecisionsService(
                new StubPokedexRepository(List.of(
                        species("alpha", "Alpha", Type.FIRE, List.of("wide-guard", "blast")),
                        species("beta", "Beta", Type.GRASS, List.of("leaf")),
                        species("gamma", "Gamma", Type.ROCK, List.of("rock-slide")))),
                new StubMoveRepository(List.of(
                        statusMove("wide-guard", "Wide Guard"),
                        damagingMove("blast", "Blast", "FIRE", 80),
                        damagingMove("leaf", "Leaf", "GRASS", 30),
                        spreadMove("rock-slide", "Rock Slide", "ROCK", 75))),
                new SpreadPressureDamageUseCase());

        ReplayTimeline timeline = new ReplayTimeline(
                "Alice",
                "Bob",
                null,
                false,
                List.of(new ReplayTurn(
                        1,
                        boardState(),
                        List.of(
                                move("p1a: Alpha", "Blast", "p2a: Gamma"),
                                move("p1b: Beta", "Leaf", "p2a: Gamma"),
                                move("p2a: Gamma", "Rock Slide", "p1a: Alpha")))),
                Map.of(
                        "Alpha", List.of("Wide Guard", "Blast"),
                        "Beta", List.of("Leaf"),
                        "Gamma", List.of("Rock Slide")));

        EvaluateReplayDecisionsResult result =
                service.evaluate(new EvaluateReplayDecisionsCommand("M-A", List.of(timeline), DEFAULT_WEIGHTS, "P1"));

        TurnReview review = result.games().getFirst().turnReviews().getFirst();
        ReplayDecisionLine wideGuardLine = review.rankedAlternatives().stream()
                .filter(line -> line.choices().stream().anyMatch(c -> "WIDE_GUARD".equals(c.kind())))
                .findFirst()
                .orElseThrow();
        assertThat(wideGuardLine.expectedDamageTaken()).isEqualTo(0.0d);
    }

    @Test
    void statusMoveCanBeBestAlternative() {
        EvaluateReplayDecisionsService service = new EvaluateReplayDecisionsService(
                new StubPokedexRepository(List.of(
                        species("alpha", "Alpha", Type.FIRE, List.of("tailwind", "splash")),
                        species("gamma", "Gamma", Type.WATER, List.of("splash")))),
                new StubMoveRepository(
                        List.of(statusMove("tailwind", "Tailwind"), damagingMove("splash", "Splash", "NORMAL", 10))),
                new ConstantDamageUseCase());

        ReplayTimeline timeline = new ReplayTimeline(
                "Alice",
                "Bob",
                null,
                false,
                List.of(new ReplayTurn(
                        1, singleActiveBoardState(), List.of(move("p1a: Alpha", "Splash", "p2a: Gamma")))),
                Map.of("Alpha", List.of("Tailwind", "Splash"), "Gamma", List.of("Splash")));

        EvaluateReplayDecisionsResult result =
                service.evaluate(new EvaluateReplayDecisionsCommand("M-A", List.of(timeline), DEFAULT_WEIGHTS, "P1"));

        TurnReview review = result.games().getFirst().turnReviews().getFirst();
        assertThat(review.rankedAlternatives()).isNotEmpty();
        assertThat(review.rankedAlternatives().getFirst().choices())
                .extracting(ReplayMoveChoice::moveName)
                .contains("Tailwind");
    }

    @Test
    void verdictUsesRelativeDeltaThresholds() {
        EvaluateReplayDecisionsService service = new EvaluateReplayDecisionsService(
                new StubPokedexRepository(List.of(
                        species("alpha", "Alpha", Type.FIRE, List.of("strong", "weak")),
                        species("gamma", "Gamma", Type.WATER, List.of("splash")))),
                new StubMoveRepository(List.of(
                        damagingMove("strong", "Strong", "FIRE", 120),
                        damagingMove("weak", "Weak", "FIRE", 95),
                        statusMove("splash", "Splash"))),
                new PowerAsDamageUseCase());

        ReplayTimeline timeline = new ReplayTimeline(
                "Alice",
                "Bob",
                null,
                false,
                List.of(new ReplayTurn(1, singleActiveBoardState(), List.of(move("p1a: Alpha", "Weak", "p2a: Gamma")))),
                Map.of("Alpha", List.of("Strong", "Weak"), "Gamma", List.of("Splash")));

        EvaluateReplayDecisionsResult result =
                service.evaluate(new EvaluateReplayDecisionsCommand("M-A", List.of(timeline), DEFAULT_WEIGHTS, "P1"));

        TurnReview review = result.games().getFirst().turnReviews().getFirst();
        assertThat(review.delta()).isEqualTo(25.0d);
        assertThat(review.verdict()).isEqualTo("acceptable");
    }

    @Test
    void switchIsCandidateActionWithOpportunityCost() {
        EvaluateReplayDecisionsService service = new EvaluateReplayDecisionsService(
                new StubPokedexRepository(List.of(
                        species("alpha", "Alpha", Type.FIRE, List.of("blast")),
                        species("gamma", "Gamma", Type.WATER, List.of("splash")))),
                new StubMoveRepository(
                        List.of(damagingMove("blast", "Blast", "FIRE", 80), statusMove("splash", "Splash"))),
                new ConstantDamageUseCase());

        ReplayTimeline timeline = new ReplayTimeline(
                "Alice",
                "Bob",
                null,
                false,
                List.of(new ReplayTurn(
                        1, singleActiveBoardState(), List.of(move("p1a: Alpha", "Blast", "p2a: Gamma")))),
                Map.of("Alpha", List.of("Blast"), "Gamma", List.of("Splash")));

        EvaluateReplayDecisionsResult result =
                service.evaluate(new EvaluateReplayDecisionsCommand("M-A", List.of(timeline), DEFAULT_WEIGHTS, "P1"));

        TurnReview review = result.games().getFirst().turnReviews().getFirst();
        ReplayDecisionLine switchLine = review.rankedAlternatives().stream()
                .filter(line -> line.choices().stream().anyMatch(c -> "SWITCH".equals(c.kind())))
                .findFirst()
                .orElseThrow();
        assertThat(switchLine.score()).isEqualTo(-5.0d);
    }

    @Test
    void recoilIsDeductedFromUserScore() {
        EvaluateReplayDecisionsService service = new EvaluateReplayDecisionsService(
                new StubPokedexRepository(List.of(
                        species("alpha", "Alpha", Type.FIRE, List.of("brave-bird", "safe-hit")),
                        species("gamma", "Gamma", Type.WATER, List.of("splash")))),
                new StubMoveRepository(List.of(
                        damagingMove("brave-bird", "Brave Bird", "FLYING", 90),
                        damagingMove("safe-hit", "Safe Hit", "FLYING", 90),
                        statusMove("splash", "Splash"))),
                new FixedDamageUseCase(90));

        ReplayTimeline timeline = new ReplayTimeline(
                "Alice",
                "Bob",
                null,
                false,
                List.of(new ReplayTurn(
                        1, singleActiveBoardState(), List.of(move("p1a: Alpha", "Brave Bird", "p2a: Gamma")))),
                Map.of("Alpha", List.of("Brave Bird", "Safe Hit"), "Gamma", List.of("Splash")));

        EvaluateReplayDecisionsResult result =
                service.evaluate(new EvaluateReplayDecisionsCommand("M-A", List.of(timeline), DEFAULT_WEIGHTS, "P1"));

        TurnReview review = result.games().getFirst().turnReviews().getFirst();
        ReplayDecisionLine safeLine = review.rankedAlternatives().stream()
                .filter(line -> line.choices().stream().anyMatch(c -> "Safe Hit".equals(c.moveName())))
                .findFirst()
                .orElseThrow();
        assertThat(safeLine.score()).isGreaterThan(review.played().score());
    }

    @Test
    void koProbabilityBonusUsesClampedUnion() {
        EvaluateReplayDecisionsService service = new EvaluateReplayDecisionsService(
                new StubPokedexRepository(List.of(
                        species("alpha", "Alpha", Type.FIRE, List.of("blast")),
                        species("beta", "Beta", Type.POISON, List.of("jab")),
                        species("gamma", "Gamma", Type.WATER, List.of("splash")),
                        species("delta", "Delta", Type.DARK, List.of("splash")))),
                new StubMoveRepository(List.of(
                        damagingMove("blast", "Blast", "FIRE", 80),
                        damagingMove("jab", "Jab", "POISON", 80),
                        statusMove("splash", "Splash"))),
                new AlwaysKoChanceUseCase());

        ReplayTimeline timeline = new ReplayTimeline(
                "Alice",
                "Bob",
                null,
                false,
                List.of(new ReplayTurn(
                        1,
                        boardState(),
                        List.of(move("p1a: Alpha", "Blast", "p2a: Gamma"), move("p1b: Beta", "Jab", "p2b: Delta")))),
                Map.of(
                        "Alpha", List.of("Blast"),
                        "Beta", List.of("Jab"),
                        "Gamma", List.of("Splash"),
                        "Delta", List.of("Splash")));

        EvaluateReplayDecisionsResult result =
                service.evaluate(new EvaluateReplayDecisionsCommand("M-A", List.of(timeline), DEFAULT_WEIGHTS, "P1"));

        TurnReview review = result.games().getFirst().turnReviews().getFirst();
        assertThat(review.played().score()).isEqualTo(30.0d);
    }

    private static ReplayBoardState boardState() {
        return new ReplayBoardState(
                "none",
                "none",
                new ReplaySideState(
                        "Alice",
                        false,
                        false,
                        false,
                        false,
                        List.of(pokemon("p1a", "Alpha", 50, 100), pokemon("p1b", "Beta", 80, 100))),
                new ReplaySideState(
                        "Bob",
                        false,
                        false,
                        false,
                        false,
                        List.of(pokemon("p2a", "Gamma", 40, 100), pokemon("p2b", "Delta", 100, 100))));
    }

    private static ReplayPokemonState pokemon(String slotId, String speciesName, int hpCurrent, int hpMax) {
        return new ReplayPokemonState(
                slotId, speciesName, hpCurrent, hpMax, null, false, new ReplayBoostState(0, 0, 0, 0, 0, 0, 0));
    }

    private static ReplayEvent move(String actor, String move, String target) {
        return new ReplayEvent("move", List.of(actor, move, target), "|move|%s|%s|%s".formatted(actor, move, target));
    }

    private static PokemonSpecies species(String id, String name, Type type, List<String> moveIds) {
        return new PokemonSpecies(
                id, name, List.of(type), new Stats(120, 90, 90, 90, 90, 90), List.of("none"), moveIds);
    }

    private static MoveDefinition damagingMove(String id, String name, String type, int basePower) {
        return new MoveDefinition(id, name, type, "SPECIAL", basePower, false, false, false, false);
    }

    private static MoveDefinition spreadMove(String id, String name, String type, int basePower) {
        return new MoveDefinition(id, name, type, "PHYSICAL", basePower, true, false, false, false);
    }

    private static MoveDefinition statusMove(String id, String name) {
        return new MoveDefinition(id, name, "NORMAL", "STATUS", 0, false, false, false, false);
    }

    private static ReplayTimeline trimToOpeningTurn(ReplayTimeline timeline) {
        return new ReplayTimeline(
                timeline.sideAName(),
                timeline.sideBName(),
                timeline.winner(),
                timeline.tie(),
                List.of(timeline.turns().getFirst()),
                timeline.revealedMovesBySpecies());
    }

    private static ReplayTimeline loadTimeline(String filename) throws IOException {
        Path path = Path.of("src/test/resources/replays").resolve(filename);
        return new ObjectMapper().readValue(Files.readString(path), ReplayTimeline.class);
    }

    private static List<PokemonSpecies> referenceSpecies() {
        return List.of(
                species("pelipper", "Pelipper", Type.WATER, List.of("weather-ball")),
                species("greninja", "Greninja", Type.WATER, List.of("weather-ball", "ice-beam")),
                species("aerodactyl", "Aerodactyl", Type.ROCK, List.of("tailwind", "dual-wingbeat", "protect")),
                species("floette-eternal", "Floette-Eternal", Type.FAIRY, List.of("calm-mind", "protect")),
                species("sneasler", "Sneasler", Type.FIGHTING, List.of("fake-out")));
    }

    private static List<MoveDefinition> referenceMoves() {
        return List.of(
                damagingMove("weather-ball", "Weather Ball", "NORMAL", 50),
                damagingMove("ice-beam", "Ice Beam", "ICE", 90),
                damagingMove("dual-wingbeat", "Dual Wingbeat", "FLYING", 40),
                damagingMove("fake-out", "Fake Out", "NORMAL", 40),
                statusMove("tailwind", "Tailwind"),
                statusMove("calm-mind", "Calm Mind"),
                statusMove("protect", "Protect"));
    }

    private static final class StubPokedexRepository implements PokedexRepository {

        private final List<PokemonSpecies> species;

        private StubPokedexRepository(List<PokemonSpecies> species) {
            this.species = species;
        }

        @Override
        public List<PokemonSpecies> findAllByRegulation(String regulationId) {
            return species;
        }
    }

    private static final class StubMoveRepository implements MoveRepository {

        private final List<MoveDefinition> moves;

        private StubMoveRepository(List<MoveDefinition> moves) {
            this.moves = moves;
        }

        @Override
        public List<NamedDatasetEntry> findAllByRegulation(String regulationId) {
            return moves.stream()
                    .map(move -> new NamedDatasetEntry(move.id(), move.name()))
                    .toList();
        }

        @Override
        public List<MoveDefinition> findDefinitionsByRegulation(String regulationId) {
            return moves;
        }
    }

    private static final class RecordingCalculateDamageUseCase implements CalculateDamageUseCase {

        private final List<CalculateDamageCommand> calls = new ArrayList<>();
        private final Map<String, Integer> damageByKey = new HashMap<>();

        private RecordingCalculateDamageUseCase() {
            damageByKey.put(key("Alpha", "Slam", "Gamma"), 35);
            damageByKey.put(key("Alpha", "Blast", "Gamma"), 70);
            damageByKey.put(key("Alpha", "Blast", "Delta"), 80);
            damageByKey.put(key("Beta", "Jab", "Gamma"), 45);
            damageByKey.put(key("Beta", "Jab", "Delta"), 20);
            damageByKey.put(key("Gamma", "Poke", "Alpha"), 30);
            damageByKey.put(key("Delta", "Counter", "Beta"), 40);
        }

        @Override
        public CalculateDamageResult calculate(CalculateDamageCommand command) {
            calls.add(command);
            int damage = damageByKey.getOrDefault(
                    key(speciesName(command.attacker()), moveName(command.move()), speciesName(command.defender())), 0);
            return new CalculateDamageResult(
                    new int[] {damage},
                    damage,
                    damage,
                    damage,
                    damage,
                    new KoChanceResult(
                            damage >= command.defender().currentHp() ? "guaranteed OHKO" : "never",
                            damage > 0 ? 1.0d : 0.0d,
                            damage >= command.defender().currentHp() ? 1 : 99));
        }

        private String speciesName(CombatantCommand command) {
            return switch (command.types().getFirst()) {
                case "FIRE" -> "Alpha";
                case "POISON" -> "Beta";
                case "WATER" -> "Gamma";
                case "DARK" -> "Delta";
                default -> "Unknown";
            };
        }

        private String moveName(MoveCommand move) {
            return switch (move.type()) {
                case "FIRE" -> "Blast";
                case "POISON" -> "Jab";
                case "WATER" -> "Poke";
                case "DARK" -> "Counter";
                default -> move.basePower() == 35 ? "Slam" : "Guard";
            };
        }
    }

    private static final class ConstantDamageUseCase implements CalculateDamageUseCase {

        @Override
        public CalculateDamageResult calculate(CalculateDamageCommand command) {
            int damage = command.move().basePower() > 0 ? 20 : 0;
            return new CalculateDamageResult(
                    new int[] {damage},
                    damage,
                    damage,
                    damage,
                    damage,
                    new KoChanceResult(
                            damage >= command.defender().currentHp() ? "guaranteed OHKO" : "never", 0.0d, 99));
        }
    }

    private static final class FixedDamageUseCase implements CalculateDamageUseCase {

        private final int damage;

        private FixedDamageUseCase(int damage) {
            this.damage = damage;
        }

        @Override
        public CalculateDamageResult calculate(CalculateDamageCommand command) {
            int dealt = command.move().basePower() > 0 ? damage : 0;
            return new CalculateDamageResult(
                    new int[] {dealt},
                    dealt,
                    dealt,
                    dealt,
                    dealt,
                    new KoChanceResult(
                            dealt >= command.defender().currentHp() ? "guaranteed OHKO" : "never", 0.0d, 99));
        }
    }

    private static final class PowerAsDamageUseCase implements CalculateDamageUseCase {

        @Override
        public CalculateDamageResult calculate(CalculateDamageCommand command) {
            int dealt = command.move().basePower() > 0 ? command.move().basePower() : 0;
            return new CalculateDamageResult(
                    new int[] {dealt},
                    dealt,
                    dealt,
                    dealt,
                    dealt,
                    new KoChanceResult(
                            dealt >= command.defender().currentHp() ? "guaranteed OHKO" : "never", 0.0d, 99));
        }
    }

    private static final class SpreadPressureDamageUseCase implements CalculateDamageUseCase {

        @Override
        public CalculateDamageResult calculate(CalculateDamageCommand command) {
            if ("ROCK".equals(command.move().type())) {
                return new CalculateDamageResult(new int[] {40}, 40, 40, 40, 40, new KoChanceResult("never", 0.0d, 99));
            }
            return new CalculateDamageResult(new int[] {20}, 20, 20, 20, 20, new KoChanceResult("never", 0.0d, 99));
        }
    }

    private static final class AlwaysKoChanceUseCase implements CalculateDamageUseCase {

        @Override
        public CalculateDamageResult calculate(CalculateDamageCommand command) {
            if (command.move().basePower() == 0) {
                return new CalculateDamageResult(new int[] {0}, 0, 0, 0, 0, new KoChanceResult("never", 0.0d, 99));
            }
            return new CalculateDamageResult(new int[] {0}, 0, 0, 0, 0, new KoChanceResult("guaranteed OHKO", 1.0d, 1));
        }
    }

    private static String key(String attacker, String move, String defender) {
        return attacker + "|" + move + "|" + defender;
    }

    // Returns damage=KO for any attacking move against any target (simulates guaranteed OHKO)
    private static final class GuaranteedKoCalculateDamageUseCase implements CalculateDamageUseCase {

        @Override
        public CalculateDamageResult calculate(CalculateDamageCommand command) {
            if (command.move().basePower() == 0) {
                return new CalculateDamageResult(new int[] {0}, 0, 0, 0, 0, new KoChanceResult("never", 0.0d, 99));
            }
            int hp = command.defender().currentHp();
            return new CalculateDamageResult(
                    new int[] {hp}, hp, hp, hp, hp, new KoChanceResult("guaranteed OHKO", 1.0d, 1));
        }
    }

    // Returns high damage (KO threat) only when opponent targets user, zero when user attacks
    private static final class KoThreatCalculateDamageUseCase implements CalculateDamageUseCase {

        @Override
        public CalculateDamageResult calculate(CalculateDamageCommand command) {
            if (command.move().basePower() == 0) {
                return new CalculateDamageResult(new int[] {0}, 0, 0, 0, 0, new KoChanceResult("never", 0.0d, 99));
            }
            // p2 attacker types: WATER, DARK — always KO
            String attackerType = command.attacker().types().getFirst();
            if ("WATER".equals(attackerType) || "DARK".equals(attackerType)) {
                int hp = command.defender().currentHp();
                return new CalculateDamageResult(
                        new int[] {hp}, hp, hp, hp, hp, new KoChanceResult("guaranteed OHKO", 1.0d, 1));
            }
            // p1 attacker: deal some damage but not a KO
            return new CalculateDamageResult(new int[] {20}, 20, 20, 20, 20, new KoChanceResult("never", 0.0d, 99));
        }
    }

    private static ReplayBoardState singleActiveBoardState() {
        return new ReplayBoardState(
                "none",
                "none",
                new ReplaySideState("Alice", false, false, false, false, List.of(pokemon("p1a", "Alpha", 100, 100))),
                new ReplaySideState("Bob", false, false, false, false, List.of(pokemon("p2a", "Gamma", 100, 100))));
    }
}
