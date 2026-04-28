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
                                move("p2b: Delta", "Counter", "p1b: Beta")))));

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

    private static MoveDefinition statusMove(String id, String name) {
        return new MoveDefinition(id, name, "NORMAL", "STATUS", 0, false, false, false, false);
    }

    private static ReplayTimeline trimToOpeningTurn(ReplayTimeline timeline) {
        return new ReplayTimeline(
                timeline.sideAName(),
                timeline.sideBName(),
                timeline.winner(),
                timeline.tie(),
                List.of(timeline.turns().getFirst()));
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

    private static String key(String attacker, String move, String defender) {
        return attacker + "|" + move + "|" + defender;
    }
}
