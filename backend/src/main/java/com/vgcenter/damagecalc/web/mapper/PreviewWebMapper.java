package com.vgcenter.damagecalc.web.mapper;

import com.vgcenter.damagecalc.application.usecase.CombatantCommand;
import com.vgcenter.damagecalc.application.usecase.EvaluateLeadsCommand;
import com.vgcenter.damagecalc.application.usecase.EvaluateLeadsResult;
import com.vgcenter.damagecalc.application.usecase.FieldCommand;
import com.vgcenter.damagecalc.application.usecase.HitEvidenceSummary;
import com.vgcenter.damagecalc.application.usecase.MoveCommand;
import com.vgcenter.damagecalc.application.usecase.PlanRecommendation;
import com.vgcenter.damagecalc.application.usecase.PreviewFieldCommand;
import com.vgcenter.damagecalc.application.usecase.PreviewMetricResult;
import com.vgcenter.damagecalc.application.usecase.PreviewPokemonCommand;
import com.vgcenter.damagecalc.application.usecase.RecommendPlansCommand;
import com.vgcenter.damagecalc.application.usecase.RecommendPlansResult;
import com.vgcenter.damagecalc.application.usecase.SideConditionsCommand;
import com.vgcenter.damagecalc.application.usecase.SpeedTierEntryCommand;
import com.vgcenter.damagecalc.application.usecase.SpeedTierModifiersCommand;
import com.vgcenter.damagecalc.application.usecase.SpeedTiersCommand;
import com.vgcenter.damagecalc.application.usecase.SpeedTiersResult;
import com.vgcenter.damagecalc.application.usecase.StatsCommand;
import com.vgcenter.damagecalc.web.dto.CombatantRequestDto;
import com.vgcenter.damagecalc.web.dto.EvaluateLeadsRequestDto;
import com.vgcenter.damagecalc.web.dto.EvaluateLeadsResponseDto;
import com.vgcenter.damagecalc.web.dto.FieldRequestDto;
import com.vgcenter.damagecalc.web.dto.HitEvidenceSummaryDto;
import com.vgcenter.damagecalc.web.dto.LeadMatchupResponseDto;
import com.vgcenter.damagecalc.web.dto.MoveRequestDto;
import com.vgcenter.damagecalc.web.dto.PlanRecommendationDto;
import com.vgcenter.damagecalc.web.dto.PreviewFieldDto;
import com.vgcenter.damagecalc.web.dto.PreviewMetricDto;
import com.vgcenter.damagecalc.web.dto.PreviewPokemonDto;
import com.vgcenter.damagecalc.web.dto.RecommendPlansRequestDto;
import com.vgcenter.damagecalc.web.dto.RecommendPlansResponseDto;
import com.vgcenter.damagecalc.web.dto.SideConditionsDto;
import com.vgcenter.damagecalc.web.dto.SpeedTierEntryDto;
import com.vgcenter.damagecalc.web.dto.SpeedTierModifiersDto;
import com.vgcenter.damagecalc.web.dto.SpeedTierRowDto;
import com.vgcenter.damagecalc.web.dto.SpeedTiersRequestDto;
import com.vgcenter.damagecalc.web.dto.SpeedTiersResponseDto;
import com.vgcenter.damagecalc.web.dto.StatsDto;
import java.util.List;
import org.springframework.stereotype.Component;

@Component
public class PreviewWebMapper {

    public EvaluateLeadsCommand toCommand(EvaluateLeadsRequestDto request) {
        return new EvaluateLeadsCommand(
                request.regulation(),
                request.selectedLeads().stream().map(this::toPokemonCommand).toList(),
                request.opponentTeam().stream().map(this::toPokemonCommand).toList(),
                toFieldCommand(request.field()));
    }

    public EvaluateLeadsResponseDto toResponse(EvaluateLeadsResult result) {
        return new EvaluateLeadsResponseDto(result.matchups().stream()
                .map(matchup -> new LeadMatchupResponseDto(
                        matchup.opponentLeadIds(),
                        matchup.opponentLeadNames(),
                        toMetricDto(matchup.koPressure()),
                        toMetricDto(matchup.twoHitKoPressure()),
                        toMetricDto(matchup.doubleUpPressure()),
                        toMetricDto(matchup.incomingDanger()),
                        toMetricDto(matchup.speedComparison()),
                        matchup.mustReactLabels(),
                        matchup.turnOneAnnotations(),
                        matchup.outgoingEvidence().stream()
                                .map(this::toEvidenceDto)
                                .toList(),
                        matchup.incomingEvidence().stream()
                                .map(this::toEvidenceDto)
                                .toList()))
                .toList());
    }

    private HitEvidenceSummaryDto toEvidenceDto(HitEvidenceSummary e) {
        return new HitEvidenceSummaryDto(
                e.attackerName(),
                e.defenderName(),
                e.moveName(),
                e.moveType(),
                e.minPct(),
                e.maxPct(),
                e.koLabel(),
                e.koProbability(),
                e.selectedAttacking());
    }

    private PreviewPokemonCommand toPokemonCommand(PreviewPokemonDto dto) {
        return new PreviewPokemonCommand(
                dto.pokemonId(),
                dto.displayName(),
                toCombatantCommand(dto.combatant()),
                dto.moves().stream().map(this::toMoveCommand).toList(),
                dto.isMega(),
                dto.statusMoveCount(),
                dto.supportTags() != null ? dto.supportTags() : List.of());
    }

    private PreviewFieldCommand toFieldCommand(PreviewFieldDto dto) {
        return new PreviewFieldCommand(
                toFieldCommand(dto.field()),
                toSideConditionsCommand(dto.selectedSide()),
                toSideConditionsCommand(dto.opponentSide()),
                dto.criticalHit(),
                dto.targets());
    }

    private CombatantCommand toCombatantCommand(CombatantRequestDto dto) {
        return new CombatantCommand(
                dto.level(),
                toStatsCommand(dto.stats()),
                dto.types(),
                dto.abilityId(),
                dto.itemId(),
                dto.status(),
                dto.stages(),
                dto.grounded(),
                dto.currentHp());
    }

    private MoveCommand toMoveCommand(MoveRequestDto dto) {
        return new MoveCommand(
                dto.type(),
                dto.category(),
                dto.basePower(),
                dto.spread(),
                dto.contact(),
                dto.doublePowerWhenUserStatused(),
                dto.ignoreBurnPenaltyWhenUserStatused(),
                dto.accuracy() == null ? 1.0d : dto.accuracy(),
                Boolean.TRUE.equals(dto.alwaysCrit()));
    }

    private FieldCommand toFieldCommand(FieldRequestDto dto) {
        return new FieldCommand(dto.weather(), dto.terrain(), dto.room());
    }

    private SideConditionsCommand toSideConditionsCommand(SideConditionsDto dto) {
        return new SideConditionsCommand(
                dto.reflect(),
                dto.lightScreen(),
                dto.auroraVeil(),
                dto.friendGuard(),
                dto.helpingHand(),
                dto.tailwind(),
                dto.protect());
    }

    private StatsCommand toStatsCommand(StatsDto dto) {
        return new StatsCommand(
                dto.hp(), dto.attack(), dto.defense(), dto.specialAttack(), dto.specialDefense(), dto.speed());
    }

    private PreviewMetricDto toMetricDto(PreviewMetricResult metric) {
        return new PreviewMetricDto(metric.label(), metric.value(), metric.tone());
    }

    public RecommendPlansCommand toRecommendCommand(RecommendPlansRequestDto request) {
        return new RecommendPlansCommand(
                request.regulation(),
                request.myTeam().stream().map(this::toPokemonCommand).toList(),
                request.opponentTeam().stream().map(this::toPokemonCommand).toList(),
                request.winConditionIndex(),
                toFieldCommand(request.field()));
    }

    public RecommendPlansResponseDto toRecommendResponse(RecommendPlansResult result) {
        return new RecommendPlansResponseDto(
                result.plans().stream().map(this::toPlanDto).toList());
    }

    public SpeedTiersCommand toSpeedTiersCommand(SpeedTiersRequestDto request) {
        List<SpeedTierEntryCommand> userTeam = request.userTeam() == null
                ? List.of()
                : request.userTeam().stream().map(this::toEntryCommand).toList();
        SpeedTierModifiersCommand modifiers = request.modifiers() == null
                ? new SpeedTierModifiersCommand(false, false, false, false, 0)
                : toModifiersCommand(request.modifiers());
        return new SpeedTiersCommand(request.regulation(), userTeam, modifiers);
    }

    public SpeedTiersResponseDto toSpeedTiersResponse(SpeedTiersResult result) {
        return new SpeedTiersResponseDto(result.rows().stream()
                .map(r -> new SpeedTierRowDto(r.speciesId(), r.speciesName(), r.finalSpeed(), r.userTeam(), r.isMega()))
                .toList());
    }

    private SpeedTierEntryCommand toEntryCommand(SpeedTierEntryDto dto) {
        return new SpeedTierEntryCommand(dto.speciesId(), dto.speciesName(), dto.spSpeed(), dto.natureId());
    }

    private SpeedTierModifiersCommand toModifiersCommand(SpeedTierModifiersDto dto) {
        return new SpeedTierModifiersCommand(
                dto.tailwind(), dto.trickRoom(), dto.paralysis(), dto.choiceScarf(), dto.stages());
    }

    private PlanRecommendationDto toPlanDto(PlanRecommendation plan) {
        return new PlanRecommendationDto(
                plan.bringIndices(),
                plan.leadIndices(),
                plan.summary(),
                plan.modesCovered(),
                plan.modesAtRisk(),
                plan.winConditionSupported(),
                plan.leftOutRationale(),
                plan.predictionBurden(),
                plan.winConditionRole());
    }
}
