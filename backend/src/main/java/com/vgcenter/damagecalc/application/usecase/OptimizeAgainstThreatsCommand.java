package com.vgcenter.damagecalc.application.usecase;

import java.util.List;
import java.util.Objects;

public record OptimizeAgainstThreatsCommand(
        String regulation,
        String defenderSpeciesId,
        String defenderNatureId,
        String defenderAbilityId,
        String defenderItemId,
        boolean defenderMegaActive,
        String defenderMegaFormId,
        List<OptimizeAgainstThreatCommand> threats,
        OptimizeAgainstThreatsGoal goal,
        FieldCommand field,
        SideConditionsCommand attackerSide,
        SideConditionsCommand defenderSide,
        boolean criticalHit,
        DefenseSpreadCandidate fixedSpread) {

    public OptimizeAgainstThreatsCommand(
            String regulation,
            String defenderSpeciesId,
            String defenderNatureId,
            String defenderAbilityId,
            String defenderItemId,
            List<OptimizeAgainstThreatCommand> threats,
            OptimizeAgainstThreatsGoal goal,
            FieldCommand field,
            SideConditionsCommand attackerSide,
            SideConditionsCommand defenderSide,
            boolean criticalHit) {
        this(
                regulation,
                defenderSpeciesId,
                defenderNatureId,
                defenderAbilityId,
                defenderItemId,
                false,
                null,
                threats,
                goal,
                field,
                attackerSide,
                defenderSide,
                criticalHit,
                null);
    }

    public OptimizeAgainstThreatsCommand(
            String regulation,
            String defenderSpeciesId,
            String defenderNatureId,
            String defenderAbilityId,
            String defenderItemId,
            List<OptimizeAgainstThreatCommand> threats,
            OptimizeAgainstThreatsGoal goal,
            FieldCommand field,
            SideConditionsCommand attackerSide,
            SideConditionsCommand defenderSide,
            boolean criticalHit,
            DefenseSpreadCandidate fixedSpread) {
        this(
                regulation,
                defenderSpeciesId,
                defenderNatureId,
                defenderAbilityId,
                defenderItemId,
                false,
                null,
                threats,
                goal,
                field,
                attackerSide,
                defenderSide,
                criticalHit,
                fixedSpread);
    }

    public OptimizeAgainstThreatsCommand(
            String regulation,
            String defenderSpeciesId,
            String defenderNatureId,
            String defenderAbilityId,
            String defenderItemId,
            boolean defenderMegaActive,
            String defenderMegaFormId,
            List<OptimizeAgainstThreatCommand> threats,
            OptimizeAgainstThreatsGoal goal,
            FieldCommand field,
            SideConditionsCommand attackerSide,
            SideConditionsCommand defenderSide,
            boolean criticalHit) {
        this(
                regulation,
                defenderSpeciesId,
                defenderNatureId,
                defenderAbilityId,
                defenderItemId,
                defenderMegaActive,
                defenderMegaFormId,
                threats,
                goal,
                field,
                attackerSide,
                defenderSide,
                criticalHit,
                null);
    }

    public OptimizeAgainstThreatsCommand {
        Objects.requireNonNull(regulation, "regulation must not be null");
        Objects.requireNonNull(defenderSpeciesId, "defenderSpeciesId must not be null");
        Objects.requireNonNull(defenderNatureId, "defenderNatureId must not be null");
        threats = List.copyOf(Objects.requireNonNull(threats, "threats must not be null"));
        if (threats.isEmpty()) {
            throw new IllegalArgumentException("threats must not be empty");
        }
        Objects.requireNonNull(goal, "goal must not be null");
        Objects.requireNonNull(field, "field must not be null");
        Objects.requireNonNull(attackerSide, "attackerSide must not be null");
        Objects.requireNonNull(defenderSide, "defenderSide must not be null");
    }
}
