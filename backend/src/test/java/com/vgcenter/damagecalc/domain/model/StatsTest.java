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

        // Champions formula — HP: base+sp+75; Other: nature × (base+sp+20).
        // HP  = 91 + 7 + 75                           = 173
        // Atk = floor(1.1 × (123 + 17 + 20))  = ⌊176⌋ = 176
        // Def =               95 + 11 + 20           = 126
        // SpA = floor(0.9 × ( 89 +  9 + 20)) = ⌊106.2⌋= 106
        // SpD =               90 +  5 + 20           = 115
        // Spe =              102 + 31 + 20           = 153
        assertThat(battleStats).isEqualTo(new Stats(173, 176, 126, 106, 115, 153));
    }

    @Test
    void supportsNeutralNaturesWithoutChangingNonHpStats() {
        Stats baseStats = new Stats(80, 70, 65, 125, 90, 110);
        Sp sp = new Sp(3, 5, 7, 21, 9, 13);

        Stats battleStats = baseStats.toBattleStats(sp, Nature.SERIOUS, 50);

        // Neutral nature: each non-HP stat is base+sp+20 with no multiplier.
        assertThat(battleStats).isEqualTo(new Stats(158, 95, 92, 166, 119, 143));
    }

    @Test
    void paralysisHalvesSpeed() {
        Stats baseStats = new Stats(80, 70, 65, 125, 90, 110);
        Sp sp = new Sp(3, 5, 7, 21, 9, 13);

        Stats battleStats = baseStats.toBattleStats(sp, Nature.SERIOUS, 50, StatusCondition.PARALYSIS);

        assertThat(battleStats).isEqualTo(new Stats(158, 95, 92, 166, 119, 71));
    }

    @Test
    void pinsChampionsConstantsWithZeroSpAndNeutralNature() {
        Stats baseStats = new Stats(100, 100, 100, 100, 100, 100);
        Sp sp = new Sp(0, 0, 0, 0, 0, 0);

        Stats battleStats = baseStats.toBattleStats(sp, Nature.HARDY, 50);

        // Canary: pins the +75 HP / +20 other-stat constants so the classic
        // (2·base+sp)·L/100 formula cannot be reintroduced without this failing.
        assertThat(battleStats).isEqualTo(new Stats(175, 120, 120, 120, 120, 120));
    }

    @Test
    void rejectsSpOutsideTheChampionsRange() {
        assertThatThrownBy(() -> new Sp(0, 0, 0, 33, 0, 0))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("SP");
    }

    @Test
    void returnsValuesByStatForStatsAndSp() {
        Stats stats = new Stats(173, 176, 126, 106, 115, 153);
        Sp sp = new Sp(7, 17, 11, 9, 5, 31);

        assertThat(stats.valueFor(Stat.HP)).isEqualTo(173);
        assertThat(stats.valueFor(Stat.ATTACK)).isEqualTo(176);
        assertThat(stats.valueFor(Stat.DEFENSE)).isEqualTo(126);
        assertThat(stats.valueFor(Stat.SPECIAL_ATTACK)).isEqualTo(106);
        assertThat(stats.valueFor(Stat.SPECIAL_DEFENSE)).isEqualTo(115);
        assertThat(stats.valueFor(Stat.SPEED)).isEqualTo(153);

        assertThat(sp.valueFor(Stat.HP)).isEqualTo(7);
        assertThat(sp.valueFor(Stat.ATTACK)).isEqualTo(17);
        assertThat(sp.valueFor(Stat.DEFENSE)).isEqualTo(11);
        assertThat(sp.valueFor(Stat.SPECIAL_ATTACK)).isEqualTo(9);
        assertThat(sp.valueFor(Stat.SPECIAL_DEFENSE)).isEqualTo(5);
        assertThat(sp.valueFor(Stat.SPEED)).isEqualTo(31);
    }

    @Test
    void natureDoesNotModifyHp() {
        assertThat(Nature.ADAMANT.applyTo(Stat.HP, 173)).isEqualTo(173);
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
