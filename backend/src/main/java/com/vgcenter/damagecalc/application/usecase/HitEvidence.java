package com.vgcenter.damagecalc.application.usecase;

public record HitEvidence(
        PreviewPokemonCommand attacker,
        PreviewPokemonCommand defender,
        MoveCommand move,
        CalculateDamageResult result) {}
