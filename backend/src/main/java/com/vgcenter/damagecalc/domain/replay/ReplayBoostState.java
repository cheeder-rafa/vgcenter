package com.vgcenter.damagecalc.domain.replay;

public record ReplayBoostState(
        int attack, int defense, int specialAttack, int specialDefense, int speed, int accuracy, int evasion) {}
