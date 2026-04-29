package com.vgcenter.damagecalc.application.usecase;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assumptions.assumeFalse;

import com.vgcenter.damagecalc.DamageCalcApplication;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.Duration;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.runner.ApplicationContextRunner;

/**
 * Service-level performance test: asserts the 6×6 threat matrix completes within budget.
 * Budget is 500ms server-side (native Linux, warm JVM). This test runs inside a Spring
 * context with JIT-warmed code paths; WSL2 hosts are inherently slower.
 */
class BuildThreatMatrixServicePerformanceTest {

    private final ApplicationContextRunner contextRunner =
            new ApplicationContextRunner().withUserConfiguration(DamageCalcApplication.class);

    @Test
    void sixBySixMatrixCompletesUnderFiveHundredMilliseconds() {
        assumeFalse(isWsl2(), "WSL2 JVM is ~2-3× slower than native Linux; skip perf budget assertion");
        contextRunner.run(context -> {
            assertThat(context).hasNotFailed();
            BuildThreatMatrixUseCase useCase = context.getBean(BuildThreatMatrixUseCase.class);

            List<ThreatPokemonCommand> team = sixPokemonTeam();
            BuildThreatMatrixCommand command = new BuildThreatMatrixCommand(
                    "M-A", team, team, new FieldCommand("CLEAR", "NONE", "NONE"), noSide(), noSide());

            // warm-up: let Spring + JIT compile hot paths before measuring
            for (int i = 0; i < 3; i++) {
                useCase.build(command);
            }

            Instant start = Instant.now();
            BuildThreatMatrixResult result = useCase.build(command);
            Duration elapsed = Duration.between(start, Instant.now());

            assertThat(result.deal()).hasSize(6);
            assertThat(result.deal().get(0)).hasSize(6);
            // 6×6×4-moves×2-directions = 288 calc calls.
            // Target: <500ms on native Linux (warm JVM). WSL2 may exceed this bound.
            assertThat(elapsed.toMillis())
                    .as(
                            "6×6 threat matrix must complete in <500ms (warm Spring context), took %dms",
                            elapsed.toMillis())
                    .isLessThan(500L);
        });
    }

    private static List<ThreatPokemonCommand> sixPokemonTeam() {
        List<ThreatPokemonCommand> team = new ArrayList<>();
        team.add(sneasler());
        team.add(garchomp());
        team.add(incineroar());
        team.add(charizard());
        team.add(milotic());
        team.add(tyranitar());
        return team;
    }

    private static ThreatPokemonCommand sneasler() {
        return new ThreatPokemonCommand(
                new CombatantCommand(
                        50,
                        new StatsCommand(155, 162, 83, 69, 106, 158),
                        List.of("FIGHTING", "POISON"),
                        "unburden",
                        "sitrus-berry",
                        "NONE",
                        Map.of(),
                        true,
                        155),
                List.of(
                        new ResolvedMoveCommand(
                                "poison-jab", new MoveCommand("POISON", "PHYSICAL", 80, false, true, false, false)),
                        new ResolvedMoveCommand(
                                "close-combat",
                                new MoveCommand("FIGHTING", "PHYSICAL", 120, false, true, false, false)),
                        new ResolvedMoveCommand(
                                "dire-claw", new MoveCommand("POISON", "PHYSICAL", 80, false, true, false, false)),
                        new ResolvedMoveCommand(
                                "protect", new MoveCommand("NORMAL", "STATUS", 0, false, false, false, false))));
    }

    private static ThreatPokemonCommand garchomp() {
        return new ThreatPokemonCommand(
                new CombatantCommand(
                        50,
                        new StatsCommand(183, 161, 115, 100, 106, 159),
                        List.of("DRAGON", "GROUND"),
                        "rough-skin",
                        "choice-scarf",
                        "NONE",
                        Map.of(),
                        true,
                        183),
                List.of(
                        new ResolvedMoveCommand(
                                "earthquake", new MoveCommand("GROUND", "PHYSICAL", 100, true, false, false, false)),
                        new ResolvedMoveCommand(
                                "rock-slide", new MoveCommand("ROCK", "PHYSICAL", 75, true, false, false, false)),
                        new ResolvedMoveCommand(
                                "scale-shot", new MoveCommand("DRAGON", "PHYSICAL", 25, false, false, false, false)),
                        new ResolvedMoveCommand(
                                "protect", new MoveCommand("NORMAL", "STATUS", 0, false, false, false, false))));
    }

    private static ThreatPokemonCommand incineroar() {
        return new ThreatPokemonCommand(
                new CombatantCommand(
                        50,
                        new StatsCommand(183, 145, 115, 105, 115, 98),
                        List.of("FIRE", "DARK"),
                        "intimidate",
                        "sitrus-berry",
                        "NONE",
                        Map.of(),
                        true,
                        183),
                List.of(
                        new ResolvedMoveCommand(
                                "fake-out", new MoveCommand("NORMAL", "PHYSICAL", 40, false, true, false, false)),
                        new ResolvedMoveCommand(
                                "flare-blitz", new MoveCommand("FIRE", "PHYSICAL", 120, false, true, false, false)),
                        new ResolvedMoveCommand(
                                "darkest-lariat", new MoveCommand("DARK", "PHYSICAL", 85, false, true, false, false)),
                        new ResolvedMoveCommand(
                                "protect", new MoveCommand("NORMAL", "STATUS", 0, false, false, false, false))));
    }

    private static ThreatPokemonCommand charizard() {
        return new ThreatPokemonCommand(
                new CombatantCommand(
                        50,
                        new StatsCommand(153, 116, 100, 149, 108, 151),
                        List.of("FIRE", "FLYING"),
                        "blaze",
                        "sitrus-berry",
                        "NONE",
                        Map.of(),
                        false,
                        153),
                List.of(
                        new ResolvedMoveCommand(
                                "heat-wave", new MoveCommand("FIRE", "SPECIAL", 95, true, false, false, false)),
                        new ResolvedMoveCommand(
                                "air-slash", new MoveCommand("FLYING", "SPECIAL", 75, false, false, false, false)),
                        new ResolvedMoveCommand(
                                "flamethrower", new MoveCommand("FIRE", "SPECIAL", 90, false, false, false, false)),
                        new ResolvedMoveCommand(
                                "protect", new MoveCommand("NORMAL", "STATUS", 0, false, false, false, false))));
    }

    private static ThreatPokemonCommand milotic() {
        return new ThreatPokemonCommand(
                new CombatantCommand(
                        50,
                        new StatsCommand(196, 92, 116, 133, 163, 110),
                        List.of("WATER"),
                        "competitive",
                        "sitrus-berry",
                        "NONE",
                        Map.of(),
                        true,
                        196),
                List.of(
                        new ResolvedMoveCommand(
                                "surf", new MoveCommand("WATER", "SPECIAL", 90, true, false, false, false)),
                        new ResolvedMoveCommand(
                                "ice-beam", new MoveCommand("ICE", "SPECIAL", 90, false, false, false, false)),
                        new ResolvedMoveCommand(
                                "recover", new MoveCommand("NORMAL", "STATUS", 0, false, false, false, false)),
                        new ResolvedMoveCommand(
                                "protect", new MoveCommand("NORMAL", "STATUS", 0, false, false, false, false))));
    }

    private static ThreatPokemonCommand tyranitar() {
        return new ThreatPokemonCommand(
                new CombatantCommand(
                        50,
                        new StatsCommand(183, 175, 140, 115, 120, 111),
                        List.of("ROCK", "DARK"),
                        "sand-stream",
                        "sitrus-berry",
                        "NONE",
                        Map.of(),
                        true,
                        183),
                List.of(
                        new ResolvedMoveCommand(
                                "rock-slide", new MoveCommand("ROCK", "PHYSICAL", 75, true, false, false, false)),
                        new ResolvedMoveCommand(
                                "crunch", new MoveCommand("DARK", "PHYSICAL", 80, false, true, false, false)),
                        new ResolvedMoveCommand(
                                "earthquake", new MoveCommand("GROUND", "PHYSICAL", 100, true, false, false, false)),
                        new ResolvedMoveCommand(
                                "protect", new MoveCommand("NORMAL", "STATUS", 0, false, false, false, false))));
    }

    private static SideConditionsCommand noSide() {
        return new SideConditionsCommand(false, false, false, false, false, false, false);
    }

    private static boolean isWsl2() {
        try {
            String procVersion = Files.readString(Path.of("/proc/version")).toLowerCase();
            return procVersion.contains("microsoft") || procVersion.contains("wsl");
        } catch (IOException e) {
            return false;
        }
    }
}
