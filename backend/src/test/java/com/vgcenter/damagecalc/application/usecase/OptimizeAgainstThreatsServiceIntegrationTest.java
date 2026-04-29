package com.vgcenter.damagecalc.application.usecase;

import static org.assertj.core.api.Assertions.assertThat;

import com.vgcenter.damagecalc.DamageCalcApplication;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.runner.ApplicationContextRunner;

class OptimizeAgainstThreatsServiceIntegrationTest {

    private final ApplicationContextRunner contextRunner =
            new ApplicationContextRunner().withUserConfiguration(DamageCalcApplication.class);

    @Test
    void surviveAllSuggestsFloetteBoldSpreadAgainstMixedThreats() {
        contextRunner.run(context -> {
            assertThat(context).hasNotFailed();

            OptimizeAgainstThreatsUseCase useCase = context.getBean(OptimizeAgainstThreatsUseCase.class);
            OptimizeAgainstThreatsCommand command = new OptimizeAgainstThreatsCommand(
                    "M-A",
                    "floette-eternal",
                    "HARDY",
                    "flower-veil",
                    null,
                    false,
                    null,
                    List.of(
                            new OptimizeAgainstThreatCommand(
                                    "charizard",
                                    "HARDY",
                                    new SpCommand(0, 0, 0, 32, 0, 0),
                                    "drought",
                                    "charizardite-y",
                                    "overheat",
                                    true,
                                    "charizard-mega-y"),
                            new OptimizeAgainstThreatCommand(
                                    "sneasler",
                                    "HARDY",
                                    new SpCommand(0, 32, 0, 0, 0, 0),
                                    "poison-touch",
                                    null,
                                    "dire-claw",
                                    false,
                                    null),
                            new OptimizeAgainstThreatCommand(
                                    "incineroar",
                                    "HARDY",
                                    new SpCommand(0, 32, 0, 0, 0, 0),
                                    "intimidate",
                                    null,
                                    "flare-blitz",
                                    false,
                                    null)),
                    OptimizeAgainstThreatsGoal.SURVIVE_ALL,
                    new FieldCommand("SUN", "NONE", "NONE"),
                    noSide(),
                    noSide(),
                    false);

            OptimizeAgainstThreatsResult result = useCase.optimize(command);

            assertThat(result.best()).isNotNull();
            assertThat(result.candidates()).isNotEmpty();
            assertThat(result.candidates()).anyMatch(c -> "BOLD".equals(c.suggestedNatureId()) && c.totalSp() <= 56);
            assertThat(result.candidates())
                    .extracting(DefenseSpreadCandidate::suggestedNatureId)
                    .doesNotContain("IMPISH", "RELAXED", "LAX", "CAREFUL", "SASSY");
            assertThat(result.candidates()).allMatch(c -> c.koChanceProbability() == 0.0);
        });
    }

    private static SideConditionsCommand noSide() {
        return new SideConditionsCommand(false, false, false, false, false, false, false);
    }
}
