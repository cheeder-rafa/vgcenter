package com.vgcenter.damagecalc.application.usecase;

public record StatsCommand(int hp, int attack, int defense, int specialAttack, int specialDefense, int speed) {}
