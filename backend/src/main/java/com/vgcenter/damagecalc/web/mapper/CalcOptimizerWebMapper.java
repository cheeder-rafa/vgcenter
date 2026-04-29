package com.vgcenter.damagecalc.web.mapper;

import com.vgcenter.damagecalc.application.usecase.DefenseSpreadCandidate;
import com.vgcenter.damagecalc.application.usecase.FieldCommand;
import com.vgcenter.damagecalc.application.usecase.OptimizeAgainstThreatCommand;
import com.vgcenter.damagecalc.application.usecase.OptimizeAgainstThreatResult;
import com.vgcenter.damagecalc.application.usecase.OptimizeAgainstThreatsCommand;
import com.vgcenter.damagecalc.application.usecase.OptimizeAgainstThreatsGoal;
import com.vgcenter.damagecalc.application.usecase.OptimizeAgainstThreatsResult;
import com.vgcenter.damagecalc.application.usecase.OptimizeDefenseCommand;
import com.vgcenter.damagecalc.application.usecase.OptimizeDefenseResult;
import com.vgcenter.damagecalc.application.usecase.SideConditionsCommand;
import com.vgcenter.damagecalc.application.usecase.SpCommand;
import com.vgcenter.damagecalc.web.dto.DefenseSpreadCandidateDto;
import com.vgcenter.damagecalc.web.dto.FieldRequestDto;
import com.vgcenter.damagecalc.web.dto.OptimizeAgainstThreatDto;
import com.vgcenter.damagecalc.web.dto.OptimizeAgainstThreatResultDto;
import com.vgcenter.damagecalc.web.dto.OptimizeAgainstThreatsRequestDto;
import com.vgcenter.damagecalc.web.dto.OptimizeAgainstThreatsResponseDto;
import com.vgcenter.damagecalc.web.dto.OptimizeDefenseRequestDto;
import com.vgcenter.damagecalc.web.dto.OptimizeDefenseResponseDto;
import com.vgcenter.damagecalc.web.dto.SideConditionsDto;
import com.vgcenter.damagecalc.web.dto.SpDto;
import java.util.List;
import org.springframework.stereotype.Component;

@Component
public class CalcOptimizerWebMapper {

    public OptimizeDefenseCommand toCommand(OptimizeDefenseRequestDto dto) {
        return new OptimizeDefenseCommand(
                dto.regulation(),
                dto.defenderSpeciesId(),
                dto.defenderNatureId(),
                dto.defenderAbilityId(),
                dto.defenderItemId(),
                dto.attackerSpeciesId(),
                dto.attackerNatureId(),
                toSpCommand(dto.attackerSp()),
                dto.attackerAbilityId(),
                dto.attackerItemId(),
                dto.moveId(),
                dto.goal(),
                toFieldCommand(dto.field()),
                toSideConditionsCommand(dto.attackerSide()),
                toSideConditionsCommand(dto.defenderSide()),
                dto.criticalHit());
    }

    public OptimizeDefenseResponseDto toResponse(OptimizeDefenseResult result) {
        List<DefenseSpreadCandidateDto> candidates =
                result.candidates().stream().map(this::toCandidateDto).toList();
        return new OptimizeDefenseResponseDto(candidates);
    }

    public OptimizeAgainstThreatsCommand toCommand(OptimizeAgainstThreatsRequestDto dto) {
        return new OptimizeAgainstThreatsCommand(
                dto.regulation(),
                dto.defender().speciesId(),
                dto.defender().natureId(),
                dto.defender().abilityId(),
                dto.defender().itemId(),
                dto.defender().megaActive(),
                dto.defender().megaFormId(),
                dto.threats().stream().map(this::toThreatCommand).toList(),
                OptimizeAgainstThreatsGoal.valueOf(dto.goal()),
                toFieldCommand(dto.field()),
                toSideConditionsCommand(dto.attackerSide()),
                toSideConditionsCommand(dto.defenderSide()),
                dto.criticalHit());
    }

    public OptimizeAgainstThreatsResponseDto toResponse(OptimizeAgainstThreatsResult result) {
        return new OptimizeAgainstThreatsResponseDto(
                result.best() == null ? null : toCandidateDto(result.best()),
                result.candidates().stream().map(this::toCandidateDto).toList(),
                result.threats().stream().map(this::toThreatResultDto).toList());
    }

    private OptimizeAgainstThreatCommand toThreatCommand(OptimizeAgainstThreatDto dto) {
        return new OptimizeAgainstThreatCommand(
                dto.attackerSpeciesId(),
                dto.attackerNatureId(),
                toSpCommand(dto.attackerSp()),
                dto.attackerAbilityId(),
                dto.attackerItemId(),
                dto.moveId(),
                dto.attackerMegaActive(),
                dto.attackerMegaFormId());
    }

    private OptimizeAgainstThreatResultDto toThreatResultDto(OptimizeAgainstThreatResult result) {
        return new OptimizeAgainstThreatResultDto(
                result.attackerSpeciesId(),
                result.moveId(),
                result.minDamagePct(),
                result.maxDamagePct(),
                result.expectedDamagePct(),
                result.koChanceProbability(),
                result.koChanceDescription());
    }

    private DefenseSpreadCandidateDto toCandidateDto(DefenseSpreadCandidate c) {
        return new DefenseSpreadCandidateDto(
                c.spHp(),
                c.spDef(),
                c.spSpd(),
                c.totalSp(),
                c.remainingSp(),
                c.minDamagePct(),
                c.maxDamagePct(),
                c.koChanceProbability(),
                c.koChanceDescription(),
                c.suggestedNatureId());
    }

    private static SpCommand toSpCommand(SpDto dto) {
        if (dto == null) {
            return new SpCommand(0, 0, 0, 0, 0, 0);
        }
        return new SpCommand(
                dto.hp(), dto.attack(), dto.defense(), dto.specialAttack(), dto.specialDefense(), dto.speed());
    }

    private static FieldCommand toFieldCommand(FieldRequestDto dto) {
        if (dto == null) {
            return new FieldCommand("CLEAR", "NONE", "NONE");
        }
        return new FieldCommand(dto.weather(), dto.terrain(), dto.room());
    }

    private static SideConditionsCommand toSideConditionsCommand(SideConditionsDto dto) {
        if (dto == null) {
            return new SideConditionsCommand(false, false, false, false, false, false, false);
        }
        return new SideConditionsCommand(
                dto.reflect(),
                dto.lightScreen(),
                dto.auroraVeil(),
                dto.friendGuard(),
                dto.helpingHand(),
                dto.tailwind(),
                dto.protect());
    }
}
