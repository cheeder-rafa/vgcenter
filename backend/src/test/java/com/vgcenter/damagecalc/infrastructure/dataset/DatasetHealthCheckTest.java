package com.vgcenter.damagecalc.infrastructure.dataset;

import static org.assertj.core.api.Assertions.assertThat;

import com.vgcenter.damagecalc.DamageCalcApplication;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.runner.ApplicationContextRunner;

class DatasetHealthCheckTest {

    private final ApplicationContextRunner contextRunner =
            new ApplicationContextRunner().withUserConfiguration(DamageCalcApplication.class);

    @Test
    void failsStartupWhenPokedexReferencesUnknownAbility() {
        contextRunner
                .withPropertyValues("vgcenter.dataset.root=classpath:invalid-data/missing-ability")
                .run(context -> {
                    assertThat(context).hasFailed();
                    assertThat(context.getStartupFailure())
                            .hasMessageContaining("Unknown ability")
                            .hasMessageContaining("does-not-exist")
                            .hasMessageContaining("meowscarada");
                });
    }

    @Test
    void failsStartupWhenPokedexViolatesSchema() {
        contextRunner
                .withPropertyValues("vgcenter.dataset.root=classpath:invalid-data/missing-base-stats")
                .run(context -> {
                    assertThat(context).hasFailed();
                    assertThat(context.getStartupFailure())
                            .hasMessageContaining("Schema validation failed")
                            .hasMessageContaining("pokedex.json")
                            .hasMessageContaining("baseStats");
                });
    }
}
