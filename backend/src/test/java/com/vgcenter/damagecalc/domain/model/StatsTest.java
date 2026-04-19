package com.vgcenter.damagecalc.domain.model;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import org.junit.jupiter.api.Test;

class StatsTest {

    @Test
    void calculatesBattleStatsUsingSpFormulaAndNatureModifiers() {
        Stats baseStats = new Stats(91, 123, 95, 89, 90, 102);
        Sp sp = new Sp(7, 17, 11, 9, 5, 31);

        Stats battleStats = baseStats.toBattleStats(sp, Nature.ADAMANT, 50);

        assertThat(battleStats).isEqualTo(new Stats(154, 149, 105, 88, 97, 122));
    }

    @Test
    void supportsNeutralNaturesWithoutChangingNonHpStats() {
        Stats baseStats = new Stats(80, 70, 65, 125, 90, 110);
        Sp sp = new Sp(3, 5, 7, 21, 9, 13);

        Stats battleStats = baseStats.toBattleStats(sp, Nature.SERIOUS, 50);

        assertThat(battleStats).isEqualTo(new Stats(141, 77, 73, 140, 99, 121));
    }

    @Test
    void rejectsSpOutsideTheChampionsRange() {
        assertThatThrownBy(() -> new Sp(0, 0, 0, 33, 0, 0))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("SP");
    }

    @Test
    void returnsValuesByStatForStatsAndSp() {
        Stats stats = new Stats(154, 149, 105, 88, 97, 122);
        Sp sp = new Sp(7, 17, 11, 9, 5, 31);

        assertThat(stats.valueFor(Stat.HP)).isEqualTo(154);
        assertThat(stats.valueFor(Stat.ATTACK)).isEqualTo(149);
        assertThat(stats.valueFor(Stat.DEFENSE)).isEqualTo(105);
        assertThat(stats.valueFor(Stat.SPECIAL_ATTACK)).isEqualTo(88);
        assertThat(stats.valueFor(Stat.SPECIAL_DEFENSE)).isEqualTo(97);
        assertThat(stats.valueFor(Stat.SPEED)).isEqualTo(122);

        assertThat(sp.valueFor(Stat.HP)).isEqualTo(7);
        assertThat(sp.valueFor(Stat.ATTACK)).isEqualTo(17);
        assertThat(sp.valueFor(Stat.DEFENSE)).isEqualTo(11);
        assertThat(sp.valueFor(Stat.SPECIAL_ATTACK)).isEqualTo(9);
        assertThat(sp.valueFor(Stat.SPECIAL_DEFENSE)).isEqualTo(5);
        assertThat(sp.valueFor(Stat.SPEED)).isEqualTo(31);
    }

    @Test
    void natureDoesNotModifyHp() {
        assertThat(Nature.ADAMANT.applyTo(Stat.HP, 154)).isEqualTo(154);
    }

    @Test
    void rejectsNonPositiveBaseStatsAndLevel() {
        assertThatThrownBy(() -> new Stats(0, 1, 1, 1, 1, 1))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("HP");

        assertThatThrownBy(() -> new Stats(1, 1, 1, 1, 1, 1).toBattleStats(new Sp(0, 0, 0, 0, 0, 0), Nature.HARDY, 0))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("Level");
    }
}
