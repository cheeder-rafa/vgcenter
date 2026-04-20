package com.vgcenter.damagecalc.infrastructure.nature;

import static org.assertj.core.api.Assertions.assertThat;

import com.vgcenter.damagecalc.DamageCalcApplication;
import com.vgcenter.damagecalc.application.port.NatureRepository;
import com.vgcenter.damagecalc.domain.model.Nature;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.runner.ApplicationContextRunner;

class JsonNatureRepositoryIntegrationTest {

    private final ApplicationContextRunner contextRunner =
            new ApplicationContextRunner().withUserConfiguration(DamageCalcApplication.class);

    @Test
    void loadsAllTwentyFiveNaturesFromJson() {
        contextRunner.run(context -> {
            assertThat(context).hasNotFailed();

            NatureRepository natureRepository = context.getBean(NatureRepository.class);
            var natures = natureRepository.findAllByRegulation("M-A");

            assertThat(natures).hasSize(Nature.values().length).containsExactlyInAnyOrder(Nature.values());
        });
    }

    @Test
    void findsIndividualNatureByCanonicalId() {
        contextRunner.run(context -> {
            NatureRepository natureRepository = context.getBean(NatureRepository.class);

            assertThat(natureRepository.findById("M-A", "adamant")).contains(Nature.ADAMANT);
            assertThat(natureRepository.findById("M-A", "MODEST")).contains(Nature.MODEST);
            assertThat(natureRepository.findById("M-A", "not-a-nature")).isEmpty();
        });
    }
}
