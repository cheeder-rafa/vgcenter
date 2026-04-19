package com.vgcenter.damagecalc;

import static org.assertj.core.api.Assertions.assertThat;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.runner.ApplicationContextRunner;

class DamageCalcApplicationTests {

    private final ApplicationContextRunner contextRunner =
            new ApplicationContextRunner().withUserConfiguration(DamageCalcApplication.class);

    @Test
    void contextLoads() {
        contextRunner.run(context -> assertThat(context).hasNotFailed());
    }
}
