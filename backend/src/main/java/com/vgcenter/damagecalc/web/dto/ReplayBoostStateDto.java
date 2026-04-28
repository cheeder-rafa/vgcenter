package com.vgcenter.damagecalc.web.dto;

public record ReplayBoostStateDto(
        int attack, int defense, int specialAttack, int specialDefense, int speed, int accuracy, int evasion) {}
