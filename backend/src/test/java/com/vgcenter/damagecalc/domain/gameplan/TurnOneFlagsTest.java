package com.vgcenter.damagecalc.domain.gameplan;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.List;
import org.junit.jupiter.api.Test;

class TurnOneFlagsTest {

    @Test
    void detectsProtectOnlyWhenPresent() {
        TurnOneFlags withProtect =
                TurnOneFlags.classify(List.of(pokemon("protect", "heat-wave"), pokemon("air-slash", "tailwind")));
        TurnOneFlags withoutProtect =
                TurnOneFlags.classify(List.of(pokemon("heat-wave", "air-slash"), pokemon("tailwind", "solar-beam")));

        assertThat(withProtect.protect()).isTrue();
        assertThat(withoutProtect.protect()).isFalse();
    }

    @Test
    void detectsRedirectionOnlyWhenPresent() {
        TurnOneFlags withRedirection =
                TurnOneFlags.classify(List.of(pokemon("follow-me", "protect"), pokemon("heat-wave", "tailwind")));
        TurnOneFlags withoutRedirection =
                TurnOneFlags.classify(List.of(pokemon("protect", "fake-out"), pokemon("tailwind", "heat-wave")));

        assertThat(withRedirection.redirection()).isTrue();
        assertThat(withoutRedirection.redirection()).isFalse();
    }

    @Test
    void detectsFakeOutOnlyWhenPresent() {
        TurnOneFlags withFakeOut =
                TurnOneFlags.classify(List.of(pokemon("fake-out", "quick-attack"), pokemon("protect", "tailwind")));
        TurnOneFlags withoutFakeOut =
                TurnOneFlags.classify(List.of(pokemon("quick-attack", "protect"), pokemon("tailwind", "heat-wave")));

        assertThat(withFakeOut.fakeOut()).isTrue();
        assertThat(withoutFakeOut.fakeOut()).isFalse();
    }

    @Test
    void detectsPriorityOnlyWhenPresent() {
        TurnOneFlags withPriority =
                TurnOneFlags.classify(List.of(pokemon("quick-attack", "protect"), pokemon("tailwind", "heat-wave")));
        TurnOneFlags withoutPriority =
                TurnOneFlags.classify(List.of(pokemon("heat-wave", "protect"), pokemon("tailwind", "solar-beam")));

        assertThat(withPriority.priority()).isTrue();
        assertThat(withoutPriority.priority()).isFalse();
    }

    @Test
    void classifiesSpeedControlModes() {
        assertThat(TurnOneFlags.classify(List.of(pokemon("tailwind", "protect"), pokemon("heat-wave", "solar-beam")))
                        .speedControl())
                .isEqualTo(TurnOneFlags.SpeedControl.TAILWIND);
        assertThat(TurnOneFlags.classify(List.of(pokemon("trick-room", "protect"), pokemon("heat-wave", "solar-beam")))
                        .speedControl())
                .isEqualTo(TurnOneFlags.SpeedControl.TRICK_ROOM);
        assertThat(TurnOneFlags.classify(List.of(pokemon("trick-room", "protect"), pokemon("tailwind", "solar-beam")))
                        .speedControl())
                .isEqualTo(TurnOneFlags.SpeedControl.BOTH);
        assertThat(TurnOneFlags.classify(List.of(pokemon("protect", "heat-wave"), pokemon("air-slash", "solar-beam")))
                        .speedControl())
                .isEqualTo(TurnOneFlags.SpeedControl.NONE);
    }

    private TurnOneFlags.SidePokemon pokemon(String moveOne, String moveTwo) {
        return new TurnOneFlags.SidePokemon(List.of(moveOne, moveTwo), "none", "none");
    }
}
