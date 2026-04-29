package com.vgcenter.damagecalc.application.usecase;

import static org.assertj.core.api.Assertions.assertThat;

import com.vgcenter.damagecalc.application.port.MoveRepository;
import com.vgcenter.damagecalc.application.port.NatureRepository;
import com.vgcenter.damagecalc.application.port.PokedexRepository;
import com.vgcenter.damagecalc.domain.model.Nature;
import com.vgcenter.damagecalc.domain.model.PokemonSpecies;
import com.vgcenter.damagecalc.domain.model.Stats;
import com.vgcenter.damagecalc.domain.model.Type;
import java.util.List;
import java.util.concurrent.atomic.AtomicInteger;
import net.jqwik.api.Arbitraries;
import net.jqwik.api.ForAll;
import net.jqwik.api.Property;
import net.jqwik.api.Provide;
import net.jqwik.api.constraints.IntRange;
import org.junit.jupiter.api.Test;

class OptimizeAgainstThreatsServiceTest {

    private final PokedexRepository pokedex = _reg -> List.of(snorlax(), floetteEternal(), garchomp(), gengar());
    private final NatureRepository natures = _reg -> List.of(
            Nature.HARDY,
            Nature.BOLD,
            Nature.IMPISH,
            Nature.RELAXED,
            Nature.LAX,
            Nature.CALM,
            Nature.CAREFUL,
            Nature.SASSY,
            Nature.GENTLE,
            Nature.JOLLY,
            Nature.MODEST);
    private final MoveRepository moves = new MoveRepository() {
        @Override
        public List<NamedDatasetEntry> findAllByRegulation(String regulationId) {
            return List.of();
        }

        @Override
        public List<MoveDefinition> findDefinitionsByRegulation(String regulationId) {
            return List.of(earthquake(), shadowBall());
        }
    };
    private final CalculateDamageUseCase calc = command -> {
        int hp = command.defender().stats().hp();
        int bulk = "PHYSICAL".equals(command.move().category())
                ? command.defender().stats().defense()
                : command.defender().stats().specialDefense();
        int pressure =
                command.attacker().stats().attack() + command.attacker().stats().specialAttack();
        int max = Math.max(1, pressure + command.move().basePower() - bulk);
        int min = Math.max(1, (int) Math.floor(max * 0.85));
        int[] rolls = rolls(min, max);
        int koHits = 0;
        for (int roll : rolls) {
            if (roll >= hp) koHits++;
        }
        return new CalculateDamageResult(
                rolls,
                min,
                max,
                min * 100.0 / hp,
                max * 100.0 / hp,
                new KoChanceResult(koHits == 0 ? "guaranteed survival" : "possible KO", koHits / 16.0, koHits));
    };

    @Test
    void expectedDamageSumReturnsBestCandidateWithPerThreatBreakdown() {
        var result = newService().optimize(command(OptimizeAgainstThreatsGoal.EXPECTED_DAMAGE_SUM, threats()));

        assertThat(result.best()).isNotNull();
        assertThat(result.candidates()).isNotEmpty();
        assertThat(result.best().totalSp()).isLessThanOrEqualTo(66);
        assertThat(result.threats()).hasSize(2);
        assertThat(result.threats())
                .extracting(OptimizeAgainstThreatResult::attackerSpeciesId)
                .containsExactly("garchomp", "gengar");
    }

    @Test
    void surviveAllReturnsOnlyZeroKoCandidate() {
        var result = newService().optimize(command(OptimizeAgainstThreatsGoal.SURVIVE_ALL, threats()));

        assertThat(result.best()).isNotNull();
        assertThat(result.candidates()).isNotEmpty();
        assertThat(result.threats()).allMatch(t -> t.ohkoProbability() == 0.0);
    }

    @Test
    void surviveAllLooksAheadFourTiersAndCanPreferHigherTierForLowerExpectedDamage() {
        CalculateDamageUseCase flatDamage = command -> {
            int hp = command.defender().stats().hp();
            int[] rolls = rolls(100, 100);
            return new CalculateDamageResult(
                    rolls, 100, 100, 100.0 / hp, 100.0 / hp, new KoChanceResult("guaranteed survival", 0.0, 0));
        };
        var service = new OptimizeAgainstThreatsService(pokedex, natures, moves, flatDamage);

        var result = service.optimize(command(OptimizeAgainstThreatsGoal.SURVIVE_ALL, threats()));

        assertThat(result.best()).isNotNull();
        assertThat(result.best().totalSp()).isEqualTo(4);
        assertThat(result.best().spHp()).isEqualTo(4);
    }

    @Test
    void candidateAndThreatExposeNearKoMargin() {
        var result = newService().optimize(command(OptimizeAgainstThreatsGoal.EXPECTED_DAMAGE_SUM, threats()));

        assertThat(result.best()).isNotNull();
        assertThat(result.best().nearKoMargin()).isEqualTo(100.0 - result.best().maxDamagePct());
        assertThat(result.threats())
                .allSatisfy(threat -> assertThat(threat.nearKoMargin()).isEqualTo(100.0 - threat.maxDamagePct()));
    }

    @Test
    void expectedDamageSearchBoundsDamageEvaluationsToOneFullPass() {
        AtomicInteger calls = new AtomicInteger();
        CalculateDamageUseCase countingCalc = command -> {
            calls.incrementAndGet();
            return calc.calculate(command);
        };
        var service = new OptimizeAgainstThreatsService(pokedex, natures, moves, countingCalc);
        List<OptimizeAgainstThreatCommand> fourThreats = List.of(
                threat("garchomp", "JOLLY", "earthquake"),
                threat("gengar", "MODEST", "shadow-ball"),
                threat("garchomp", "JOLLY", "earthquake"),
                threat("gengar", "MODEST", "shadow-ball"));

        var result = service.optimize(command(OptimizeAgainstThreatsGoal.EXPECTED_DAMAGE_SUM, fourThreats));

        assertThat(result.best()).isNotNull();
        assertThat(calls.get()).isLessThanOrEqualTo(30_977 * 8 * fourThreats.size());
    }

    @Test
    void filtersIrrelevantNatureSuggestionsForEverySpecialAttackingFastDefender() {
        var result = newService()
                .optimize(new OptimizeAgainstThreatsCommand(
                        "M-A",
                        "floette-eternal",
                        "HARDY",
                        null,
                        null,
                        threats(),
                        OptimizeAgainstThreatsGoal.EXPECTED_DAMAGE_SUM,
                        clearField(),
                        noSide(),
                        noSide(),
                        false));

        assertThat(result.candidates())
                .extracting(DefenseSpreadCandidate::suggestedNatureId)
                .doesNotContain("IMPISH", "RELAXED", "LAX", "CAREFUL", "SASSY");
    }

    @Property(tries = 12)
    void expectedDamageSumRespectsSpCapAndDominatesSingleThreatOptimumOnAverage(
            @ForAll("threatPairs") List<OptimizeAgainstThreatCommand> threats,
            @ForAll @IntRange(min = 0, max = 32) int attackerAttackSp) {
        var service = newService();
        var adjustedThreats = threats.stream()
                .map(t -> new OptimizeAgainstThreatCommand(
                        t.attackerSpeciesId(),
                        t.attackerNatureId(),
                        new SpCommand(0, attackerAttackSp, 0, attackerAttackSp, 0, 0),
                        t.attackerAbilityId(),
                        t.attackerItemId(),
                        t.moveId()))
                .toList();
        var result = service.optimize(command(OptimizeAgainstThreatsGoal.EXPECTED_DAMAGE_SUM, adjustedThreats));

        assertThat(result.best()).isNotNull();
        assertThat(result.candidates()).isNotEmpty();
        assertThat(result.best().spHp() + result.best().spDef() + result.best().spSpd())
                .isLessThanOrEqualTo(66);

        double multiAverage = averageExpectedDamage(result.threats());
        double bestSingleAverage = adjustedThreats.stream()
                .map(threat ->
                        service.optimize(command(OptimizeAgainstThreatsGoal.EXPECTED_DAMAGE_SUM, List.of(threat))))
                .mapToDouble(single -> averageSpreadAgainstThreats(service, single.best(), adjustedThreats))
                .min()
                .orElseThrow();

        assertThat(multiAverage).isLessThanOrEqualTo(bestSingleAverage + 0.0001);
    }

    @Provide
    net.jqwik.api.Arbitrary<List<OptimizeAgainstThreatCommand>> threatPairs() {
        return Arbitraries.of(List.of(
                List.of(threat("garchomp", "JOLLY", "earthquake"), threat("gengar", "MODEST", "shadow-ball")),
                List.of(threat("garchomp", "JOLLY", "earthquake"), threat("garchomp", "JOLLY", "earthquake")),
                List.of(threat("gengar", "MODEST", "shadow-ball"), threat("garchomp", "JOLLY", "earthquake"))));
    }

    private OptimizeAgainstThreatsService newService() {
        return new OptimizeAgainstThreatsService(pokedex, natures, moves, calc);
    }

    private double averageSpreadAgainstThreats(
            OptimizeAgainstThreatsService service,
            DefenseSpreadCandidate candidate,
            List<OptimizeAgainstThreatCommand> threats) {
        var fixed = new OptimizeAgainstThreatsCommand(
                "M-A",
                "snorlax",
                "HARDY",
                null,
                null,
                threats,
                OptimizeAgainstThreatsGoal.EXPECTED_DAMAGE_SUM,
                clearField(),
                noSide(),
                noSide(),
                false,
                candidate);
        return averageExpectedDamage(service.optimize(fixed).threats());
    }

    private static double averageExpectedDamage(List<OptimizeAgainstThreatResult> results) {
        return results.stream()
                .mapToDouble(OptimizeAgainstThreatResult::expectedDamagePct)
                .average()
                .orElseThrow();
    }

    private OptimizeAgainstThreatsCommand command(
            OptimizeAgainstThreatsGoal goal, List<OptimizeAgainstThreatCommand> threats) {
        return new OptimizeAgainstThreatsCommand(
                "M-A", "snorlax", "HARDY", null, null, threats, goal, clearField(), noSide(), noSide(), false);
    }

    private static List<OptimizeAgainstThreatCommand> threats() {
        return List.of(threat("garchomp", "JOLLY", "earthquake"), threat("gengar", "MODEST", "shadow-ball"));
    }

    private static OptimizeAgainstThreatCommand threat(String species, String nature, String move) {
        return new OptimizeAgainstThreatCommand(species, nature, zeroSp(), null, null, move);
    }

    private static SpCommand zeroSp() {
        return new SpCommand(0, 0, 0, 0, 0, 0);
    }

    private static FieldCommand clearField() {
        return new FieldCommand("CLEAR", "NONE", "NONE");
    }

    private static SideConditionsCommand noSide() {
        return new SideConditionsCommand(false, false, false, false, false, false, false);
    }

    private static MoveDefinition earthquake() {
        return new MoveDefinition("earthquake", "Earthquake", "GROUND", "PHYSICAL", 100, true, false, false, false);
    }

    private static MoveDefinition shadowBall() {
        return new MoveDefinition("shadow-ball", "Shadow Ball", "GHOST", "SPECIAL", 80, false, false, false, false);
    }

    private static int[] rolls(int min, int max) {
        int[] r = new int[16];
        for (int i = 0; i < 16; i++) {
            r[i] = min + (max - min) * i / 15;
        }
        return r;
    }

    private static PokemonSpecies snorlax() {
        return new PokemonSpecies(
                "snorlax",
                "Snorlax",
                List.of(Type.NORMAL),
                new Stats(160, 110, 65, 65, 110, 30),
                List.of("immunity", "thick-fat"),
                List.of("body-slam"));
    }

    private static PokemonSpecies floetteEternal() {
        return new PokemonSpecies(
                "floette-eternal",
                "Floette-Eternal",
                List.of(Type.FAIRY),
                new Stats(74, 65, 67, 125, 128, 92),
                List.of("flower-veil"),
                List.of("protect"));
    }

    private static PokemonSpecies garchomp() {
        return new PokemonSpecies(
                "garchomp",
                "Garchomp",
                List.of(Type.DRAGON, Type.GROUND),
                new Stats(108, 130, 95, 80, 85, 102),
                List.of("rough-skin"),
                List.of("earthquake"));
    }

    private static PokemonSpecies gengar() {
        return new PokemonSpecies(
                "gengar",
                "Gengar",
                List.of(Type.GHOST, Type.POISON),
                new Stats(60, 65, 60, 130, 75, 110),
                List.of("cursed-body"),
                List.of("shadow-ball"));
    }
}
