package com.vgcenter.damagecalc.application.usecase;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;

public final class EvaluateLeadsService implements EvaluateLeadsUseCase {

    private final CalculateDamageUseCase calculateDamageUseCase;

    public EvaluateLeadsService(CalculateDamageUseCase calculateDamageUseCase) {
        this.calculateDamageUseCase = calculateDamageUseCase;
    }

    @Override
    public EvaluateLeadsResult evaluate(EvaluateLeadsCommand command) {
        List<LeadMatchupResult> matchups = new ArrayList<>();
        for (int first = 0; first < command.opponentTeam().size(); first++) {
            for (int second = first + 1; second < command.opponentTeam().size(); second++) {
                matchups.add(evaluatePair(
                        command,
                        List.of(
                                command.opponentTeam().get(first),
                                command.opponentTeam().get(second))));
            }
        }
        return new EvaluateLeadsResult(matchups);
    }

    private LeadMatchupResult evaluatePair(EvaluateLeadsCommand command, List<PreviewPokemonCommand> opponentLeads) {
        List<HitEvidence> outgoing =
                collectEvidence(command.regulation(), command.selectedLeads(), opponentLeads, command.field(), true);
        List<HitEvidence> incoming =
                collectEvidence(command.regulation(), opponentLeads, command.selectedLeads(), command.field(), false);

        int koCount = countByHits(outgoing, 1);
        int twoHitCount = countByHits(outgoing, 2);
        int incomingKoCount = countByHits(incoming, 1);
        int incomingTwoHitCount = countByHits(incoming, 2);
        int doubleUpCount = countDoubleUps(outgoing, opponentLeads);

        SpeedScore speedScore = compareSpeed(command.selectedLeads(), opponentLeads);
        List<String> mustReactLabels =
                mustReactLabels(koCount, doubleUpCount, incomingKoCount, incomingTwoHitCount, speedScore);
        List<String> annotations = annotations(outgoing, incoming, speedScore);

        return new LeadMatchupResult(
                opponentLeads.stream().map(PreviewPokemonCommand::pokemonId).toList(),
                opponentLeads.stream().map(PreviewPokemonCommand::displayName).toList(),
                new PreviewMetricResult("KO pressure", koCount, tone(koCount, 2, 1)),
                new PreviewMetricResult("2HKO pressure", twoHitCount, tone(twoHitCount, 4, 2)),
                new PreviewMetricResult("Double-up pressure", doubleUpCount, tone(doubleUpCount, 2, 1)),
                new PreviewMetricResult(
                        "Incoming danger",
                        incomingKoCount + incomingTwoHitCount,
                        tone(incomingKoCount * 2 + incomingTwoHitCount, 3, 1)),
                new PreviewMetricResult(
                        "Speed control",
                        speedScore.selectedFasterCount(),
                        tone(speedScore.selectedFasterCount(), 2, 1)),
                mustReactLabels,
                annotations);
    }

    private List<HitEvidence> collectEvidence(
            String regulation,
            List<PreviewPokemonCommand> attackers,
            List<PreviewPokemonCommand> defenders,
            PreviewFieldCommand field,
            boolean selectedAttacking) {
        List<HitEvidence> evidence = new ArrayList<>();
        for (PreviewPokemonCommand attacker : attackers) {
            for (PreviewPokemonCommand defender : defenders) {
                attacker.moves().stream()
                        .filter(move -> move.basePower() > 0)
                        .map(move -> evaluateMove(regulation, attacker, defender, move, field, selectedAttacking))
                        .max(Comparator.comparingDouble(hit -> hit.result().maxPct()))
                        .ifPresent(evidence::add);
            }
        }
        return evidence;
    }

    private HitEvidence evaluateMove(
            String regulation,
            PreviewPokemonCommand attacker,
            PreviewPokemonCommand defender,
            MoveCommand move,
            PreviewFieldCommand field,
            boolean selectedAttacking) {
        CalculateDamageResult result = calculateDamageUseCase.calculate(new CalculateDamageCommand(
                regulation,
                attacker.combatant(),
                defender.combatant(),
                move,
                field.field(),
                selectedAttacking ? field.selectedSide() : field.opponentSide(),
                selectedAttacking ? field.opponentSide() : field.selectedSide(),
                field.criticalHit(),
                field.targets()));
        return new HitEvidence(attacker, defender, move, result);
    }

    private int countByHits(List<HitEvidence> evidence, int maxHits) {
        return (int) evidence.stream()
                .filter(hit -> hit.result().koChance().hits() <= maxHits)
                .count();
    }

    private int countDoubleUps(List<HitEvidence> outgoing, List<PreviewPokemonCommand> opponentLeads) {
        int count = 0;
        for (PreviewPokemonCommand defender : opponentLeads) {
            double combinedMax = outgoing.stream()
                    .filter(hit -> hit.defender().pokemonId().equals(defender.pokemonId()))
                    .mapToDouble(hit -> hit.result().max())
                    .sum();
            if (combinedMax >= defender.combatant().stats().hp()) {
                count++;
            }
        }
        return count;
    }

    private SpeedScore compareSpeed(
            List<PreviewPokemonCommand> selectedLeads, List<PreviewPokemonCommand> opponentLeads) {
        int selectedFaster = 0;
        int opponentFaster = 0;
        for (PreviewPokemonCommand selected : selectedLeads) {
            for (PreviewPokemonCommand opponent : opponentLeads) {
                if (selected.combatant().stats().speed()
                        >= opponent.combatant().stats().speed()) {
                    selectedFaster++;
                } else {
                    opponentFaster++;
                }
            }
        }
        return new SpeedScore(selectedFaster, opponentFaster);
    }

    private List<String> mustReactLabels(
            int koCount, int doubleUpCount, int incomingKoCount, int incomingTwoHitCount, SpeedScore speedScore) {
        List<String> labels = new ArrayList<>();
        if (incomingKoCount > 0) {
            labels.add("Cover immediate KO");
        }
        if (doubleUpCount > 0) {
            labels.add("Double-up is live");
        }
        if (koCount > 0) {
            labels.add("Press KO threat");
        }
        if (incomingTwoHitCount > 0) {
            labels.add("Avoid free 2HKO");
        }
        if (speedScore.opponentFasterCount() > speedScore.selectedFasterCount()) {
            labels.add("Respect faster lead");
        }
        if (labels.isEmpty()) {
            labels.add("Stable opener");
        }
        return labels;
    }

    private List<String> annotations(List<HitEvidence> outgoing, List<HitEvidence> incoming, SpeedScore speedScore) {
        List<String> annotations = new ArrayList<>();
        outgoing.stream()
                .max(Comparator.comparingDouble(hit -> hit.result().maxPct()))
                .ifPresent(hit -> annotations.add("%s threatens %s for %.1f-%.1f%%"
                        .formatted(
                                hit.attacker().displayName(),
                                hit.defender().displayName(),
                                hit.result().minPct(),
                                hit.result().maxPct())));
        incoming.stream()
                .max(Comparator.comparingDouble(hit -> hit.result().maxPct()))
                .ifPresent(hit -> annotations.add("%s returns %.1f-%.1f%% into %s"
                        .formatted(
                                hit.attacker().displayName(),
                                hit.result().minPct(),
                                hit.result().maxPct(),
                                hit.defender().displayName())));
        annotations.add(
                speedScore.selectedFasterCount() >= speedScore.opponentFasterCount()
                        ? "Your leads move first in most checks."
                        : "Opponent leads move first in most checks.");
        return annotations;
    }

    private String tone(double value, double high, double medium) {
        if (value >= high) {
            return "high";
        }
        if (value >= medium) {
            return "medium";
        }
        return "low";
    }

    private record HitEvidence(
            PreviewPokemonCommand attacker,
            PreviewPokemonCommand defender,
            MoveCommand move,
            CalculateDamageResult result) {}

    private record SpeedScore(int selectedFasterCount, int opponentFasterCount) {}
}
