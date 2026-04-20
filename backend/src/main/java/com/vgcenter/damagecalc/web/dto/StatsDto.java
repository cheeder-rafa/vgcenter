package com.vgcenter.damagecalc.web.dto;

import jakarta.validation.constraints.Positive;

public record StatsDto(
        @Positive int hp,
        @Positive int attack,
        @Positive int defense,
        @Positive int specialAttack,
        @Positive int specialDefense,
        @Positive int speed) {}
