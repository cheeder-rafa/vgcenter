package com.vgcenter.damagecalc.web.dto;

public record GameplanDamageOptionDto(
        int attackerIndex, int defenderIndex, String moveId, CalculateDamageResponseDto damage) {}
