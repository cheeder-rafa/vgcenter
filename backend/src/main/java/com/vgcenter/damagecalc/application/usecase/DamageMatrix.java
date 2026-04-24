package com.vgcenter.damagecalc.application.usecase;

/**
 * Pre-computed best-move matrix for a (myTeam × opponentTeam) pairing.
 *
 * <p>{@code bestOutgoing[i][j]} is the best {@link HitEvidence} for {@code myTeam[i]} attacking
 * {@code opponentTeam[j]} (may be {@code null} if that attacker has no damaging moves).
 *
 * <p>{@code bestIncoming[j][i]} is the best {@link HitEvidence} for {@code opponentTeam[j]}
 * attacking {@code myTeam[i]} (may be {@code null} if that attacker has no damaging moves).
 */
public record DamageMatrix(HitEvidence[][] bestOutgoing, HitEvidence[][] bestIncoming) {}
