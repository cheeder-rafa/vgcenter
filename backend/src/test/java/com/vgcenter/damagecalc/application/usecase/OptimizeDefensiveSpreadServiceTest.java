package com.vgcenter.damagecalc.application.usecase;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.vgcenter.damagecalc.application.port.MoveRepository;
import com.vgcenter.damagecalc.application.port.NatureRepository;
import com.vgcenter.damagecalc.application.port.PokedexRepository;
import com.vgcenter.damagecalc.domain.model.Nature;
import com.vgcenter.damagecalc.domain.model.PokemonSpecies;
import com.vgcenter.damagecalc.domain.model.Stats;
import com.vgcenter.damagecalc.domain.model.Type;
import java.util.List;
import org.junit.jupiter.api.Test;

class OptimizeDefensiveSpreadServiceTest {

    // Snorlax: base 160 HP → at 0 SP Hardy: 160+0+75=235 HP
    // Garchomp: attacker
    private final PokedexRepository pokedex = _reg -> List.of(snorlax(), garchomp());

    private final NatureRepository natures = _reg -> List.of(Nature.JOLLY, Nature.HARDY);

    private final MoveRepository moves = new MoveRepository() {
        @Override
        public List<NamedDatasetEntry> findAllByRegulation(String reg) {
            return List.of();
        }

        @Override
        public List<MoveDefinition> findDefinitionsByRegulation(String reg) {
            return List.of(earthquake());
        }
    };

    // --- always-survive stub: every spread survives ---
    private final CalculateDamageUseCase calcAlwaysSurvives = cmd -> {
        int hp = cmd.defender().stats().hp();
        int minDmg = (int) (hp * 0.75);
        int maxDmg = (int) (hp * 0.90);
        int[] rolls = rolls(minDmg, maxDmg);
        return new CalculateDamageResult(
                rolls,
                minDmg,
                maxDmg,
                minDmg * 100.0 / hp,
                maxDmg * 100.0 / hp,
                new KoChanceResult("guaranteed survival", 0.0, 0));
    };

    // --- never-survive stub: all spreads are KO'd ---
    private final CalculateDamageUseCase calcAlwaysKos = cmd -> {
        int hp = cmd.defender().stats().hp();
        int minDmg = (int) (hp * 1.05);
        int maxDmg = (int) (hp * 1.20);
        int[] rolls = rolls(minDmg, maxDmg);
        return new CalculateDamageResult(
                rolls,
                minDmg,
                maxDmg,
                minDmg * 100.0 / hp,
                maxDmg * 100.0 / hp,
                new KoChanceResult("guaranteed OHKO", 1.0, 1));
    };

    // --- threshold stub: survives only when defender HP >= threshold ---
    private static CalculateDamageUseCase calcSurvivesAtHp(int threshold) {
        return cmd -> {
            int hp = cmd.defender().stats().hp();
            if (hp >= threshold) {
                int minDmg = (int) (hp * 0.75);
                int maxDmg = (int) (hp * 0.90);
                int[] rolls = rolls(minDmg, maxDmg);
                return new CalculateDamageResult(
                        rolls,
                        minDmg,
                        maxDmg,
                        minDmg * 100.0 / hp,
                        maxDmg * 100.0 / hp,
                        new KoChanceResult("guaranteed survival", 0.0, 0));
            } else {
                int minDmg = (int) (hp * 1.05);
                int maxDmg = (int) (hp * 1.20);
                int[] rolls = rolls(minDmg, maxDmg);
                return new CalculateDamageResult(
                        rolls,
                        minDmg,
                        maxDmg,
                        minDmg * 100.0 / hp,
                        maxDmg * 100.0 / hp,
                        new KoChanceResult("guaranteed OHKO", 1.0, 1));
            }
        };
    }

    @Test
    void whenZeroSpAlreadySurvives_returnsCandidateWithZeroTotalSp() {
        var service = new OptimizeDefensiveSpreadService(pokedex, natures, moves, calcAlwaysSurvives);
        var result = service.optimize(command("ALWAYS_SURVIVE"));

        assertThat(result.candidates()).isNotEmpty();
        long zeroSpCandidates =
                result.candidates().stream().filter(c -> c.totalSp() == 0).count();
        assertThat(zeroSpCandidates).isGreaterThanOrEqualTo(1);
    }

    @Test
    void whenNoSpreadMeetsGoal_returnsEmptyCandidates() {
        var service = new OptimizeDefensiveSpreadService(pokedex, natures, moves, calcAlwaysKos);
        var result = service.optimize(command("ALWAYS_SURVIVE"));

        assertThat(result.candidates()).isEmpty();
    }

    @Test
    void returnsMinimumSpCandidates() {
        // Snorlax base HP 160: at Hardy 0 SP = 235 HP. Each +1 spHp adds 1 HP.
        // Threshold just above base HP forces ≥1 SP investment.
        int threshold = snorlaxHp(0, 0, 0) + 1; // one above zero-SP HP
        var service = new OptimizeDefensiveSpreadService(pokedex, natures, moves, calcSurvivesAtHp(threshold));
        var result = service.optimize(command("ALWAYS_SURVIVE"));

        assertThat(result.candidates()).isNotEmpty();
        int minTotal = result.candidates().stream()
                .mapToInt(DefenseSpreadCandidate::totalSp)
                .min()
                .orElseThrow();
        assertThat(result.candidates()).allMatch(c -> c.totalSp() == minTotal);
    }

    @Test
    void candidatesHaveCorrectRemainingSpField() {
        var service = new OptimizeDefensiveSpreadService(pokedex, natures, moves, calcAlwaysSurvives);
        var result = service.optimize(command("ALWAYS_SURVIVE"));

        assertThat(result.candidates()).isNotEmpty();
        result.candidates().forEach(c -> assertThat(c.remainingSp()).isEqualTo(32 - c.totalSp()));
    }

    @Test
    void candidatesDoNotExceedMaxTotalSp() {
        var service = new OptimizeDefensiveSpreadService(pokedex, natures, moves, calcAlwaysSurvives);
        var result = service.optimize(command("ALWAYS_SURVIVE"));

        result.candidates()
                .forEach(c -> assertThat(c.spHp() + c.spDef() + c.spSpd()).isLessThanOrEqualTo(32));
    }

    @Test
    void unknownDefenderSpecies_throwsSpeciesNotFoundException() {
        var service = new OptimizeDefensiveSpreadService(pokedex, natures, moves, calcAlwaysSurvives);
        var cmd = new OptimizeDefenseCommand(
                "M-A",
                "unknown-species",
                "HARDY",
                null,
                null,
                "garchomp",
                "JOLLY",
                zeroSp(),
                null,
                null,
                "earthquake",
                "ALWAYS_SURVIVE",
                clearField(),
                noSide(),
                noSide(),
                false);

        assertThatThrownBy(() -> service.optimize(cmd)).isInstanceOf(SpeciesNotFoundException.class);
    }

    @Test
    void alwaysSurvive_withHighKoChance_returnsNoCandidates() {
        // Stub: returns 81.25% KO chance — meetsGoal(ALWAYS_SURVIVE) must reject this
        CalculateDamageUseCase calc = cmd -> {
            int hp = cmd.defender().stats().hp();
            int minDmg = (int) (hp * 0.85);
            int maxDmg = hp + 1;
            int[] r = rolls(minDmg, maxDmg);
            return new CalculateDamageResult(
                    r,
                    minDmg,
                    maxDmg,
                    minDmg * 100.0 / hp,
                    maxDmg * 100.0 / hp,
                    new KoChanceResult("81.25% OHKO", 0.8125, 13));
        };
        var service = new OptimizeDefensiveSpreadService(pokedex, natures, moves, calc);
        var result = service.optimize(command("ALWAYS_SURVIVE"));

        assertThat(result.candidates()).isEmpty();
    }

    @Test
    void alwaysSurvive_requiresZeroKoChance() {
        // Stub: mix — 0 KO at high HP, 12.5% KO at low HP
        CalculateDamageUseCase calc = cmd -> {
            int hp = cmd.defender().stats().hp();
            boolean survives = hp >= 240;
            int minDmg = (int) (hp * 0.85);
            int maxDmg = survives ? (hp - 1) : (hp + 1);
            int[] r = rolls(minDmg, maxDmg);
            double prob = survives ? 0.0 : 0.125;
            return new CalculateDamageResult(
                    r,
                    minDmg,
                    maxDmg,
                    minDmg * 100.0 / hp,
                    maxDmg * 100.0 / hp,
                    new KoChanceResult(prob == 0 ? "survival" : "partial", prob, prob == 0 ? 0 : 2));
        };
        var service = new OptimizeDefensiveSpreadService(pokedex, natures, moves, calc);
        var result = service.optimize(command("ALWAYS_SURVIVE"));

        assertThat(result.candidates()).isNotEmpty();
        // All returned candidates must have zero KO chance
        assertThat(result.candidates()).allMatch(c -> c.koChanceProbability() == 0.0);
    }

    @Test
    void candidatesSortedByKoChanceThenTotalSp() {
        // Return varying KO chances based on HP (simulate spread differences)
        CalculateDamageUseCase calc = cmd -> {
            int hp = cmd.defender().stats().hp();
            int minDmg = (int) (hp * 0.10);
            int maxDmg = (int) (hp * 0.87);
            int[] r = rolls(minDmg, maxDmg);
            return new CalculateDamageResult(
                    r,
                    minDmg,
                    maxDmg,
                    minDmg * 100.0 / hp,
                    maxDmg * 100.0 / hp,
                    new KoChanceResult("survival", 0.0, 0));
        };
        var service = new OptimizeDefensiveSpreadService(pokedex, natures, moves, calc);
        var result = service.optimize(command("ALWAYS_SURVIVE"));

        // First result in the tier must be at minimum totalSp
        assertThat(result.candidates()).isNotEmpty();
        int firstTotal = result.candidates().get(0).totalSp();
        assertThat(result.candidates()).allMatch(c -> c.totalSp() == firstTotal);
    }

    @Test
    void goal87_5_filtersOnKoChanceProbability() {
        // Stub: returns 12.5% KO chance (just at threshold for 87.5% survival)
        CalculateDamageUseCase calc = cmd -> {
            int hp = cmd.defender().stats().hp();
            int minDmg = (int) (hp * 0.85);
            int maxDmg = hp + 1;
            int[] rolls = rolls(minDmg, maxDmg);
            return new CalculateDamageResult(
                    rolls,
                    minDmg,
                    maxDmg,
                    minDmg * 100.0 / hp,
                    maxDmg * 100.0 / hp,
                    new KoChanceResult("12.5% OHKO", 0.125, 1));
        };
        var service = new OptimizeDefensiveSpreadService(pokedex, natures, moves, calc);
        var result = service.optimize(command("SURVIVE_87_5"));

        // 0.125 ≤ 0.125 → meets the goal
        assertThat(result.candidates()).isNotEmpty();
    }

    // --- helpers ---

    private static int snorlaxHp(int spHp, int spDef, int spSpd) {
        // Hardy nature: no modifier; HP formula: base + sp + 75
        return 160 + spHp + 75;
    }

    private OptimizeDefenseCommand command(String goal) {
        return new OptimizeDefenseCommand(
                "M-A",
                "snorlax",
                "HARDY",
                null,
                null,
                "garchomp",
                "JOLLY",
                zeroSp(),
                null,
                null,
                "earthquake",
                goal,
                clearField(),
                noSide(),
                noSide(),
                false);
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

    private static PokemonSpecies garchomp() {
        return new PokemonSpecies(
                "garchomp",
                "Garchomp",
                List.of(Type.DRAGON, Type.GROUND),
                new Stats(108, 130, 95, 80, 85, 102),
                List.of("rough-skin"),
                List.of("earthquake"));
    }
}
