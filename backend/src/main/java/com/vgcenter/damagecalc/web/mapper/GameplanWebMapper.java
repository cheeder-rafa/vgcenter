package com.vgcenter.damagecalc.web.mapper;

import com.vgcenter.damagecalc.application.usecase.CalculateDamageResult;
import com.vgcenter.damagecalc.application.usecase.CombatantCommand;
import com.vgcenter.damagecalc.application.usecase.DamageOptionResult;
import com.vgcenter.damagecalc.application.usecase.EvaluateMatchupCommand;
import com.vgcenter.damagecalc.application.usecase.EvaluateMatchupPokemonCommand;
import com.vgcenter.damagecalc.application.usecase.EvaluateMatchupResult;
import com.vgcenter.damagecalc.application.usecase.EvaluateMineCommand;
import com.vgcenter.damagecalc.application.usecase.KoChanceResult;
import com.vgcenter.damagecalc.application.usecase.MatchupCellResult;
import com.vgcenter.damagecalc.application.usecase.RecommendLineupCommand;
import com.vgcenter.damagecalc.application.usecase.RecommendLineupResult;
import com.vgcenter.damagecalc.application.usecase.RecommendationResult;
import com.vgcenter.damagecalc.application.usecase.StatsCommand;
import com.vgcenter.damagecalc.domain.gameplan.MatchupScore;
import com.vgcenter.damagecalc.domain.gameplan.TurnOneFlags;
import com.vgcenter.damagecalc.web.dto.CalculateDamageResponseDto;
import com.vgcenter.damagecalc.web.dto.EvaluateMatchupPokemonRequestDto;
import com.vgcenter.damagecalc.web.dto.EvaluateMatchupRequestDto;
import com.vgcenter.damagecalc.web.dto.EvaluateMatchupResponseDto;
import com.vgcenter.damagecalc.web.dto.EvaluateMineRequestDto;
import com.vgcenter.damagecalc.web.dto.GameplanDamageOptionDto;
import com.vgcenter.damagecalc.web.dto.GameplanMatchupCellDto;
import com.vgcenter.damagecalc.web.dto.GameplanScoreDto;
import com.vgcenter.damagecalc.web.dto.KoChanceDto;
import com.vgcenter.damagecalc.web.dto.RecommendLineupRequestDto;
import com.vgcenter.damagecalc.web.dto.RecommendLineupResponseDto;
import com.vgcenter.damagecalc.web.dto.RecommendationDto;
import com.vgcenter.damagecalc.web.dto.TurnOneFlagsDto;
import org.springframework.stereotype.Component;

@Component
public class GameplanWebMapper {

    public EvaluateMatchupCommand toCommand(EvaluateMatchupRequestDto request) {
        return new EvaluateMatchupCommand(
                request.regulation(),
                toMineCommand(request.mine()),
                request.opponent().stream().map(this::toPokemonCommand).toList());
    }

    public EvaluateMatchupResponseDto toResponse(EvaluateMatchupResult result) {
        return new EvaluateMatchupResponseDto(
                result.cells().stream().map(this::toCellDto).toList());
    }

    public RecommendLineupCommand toCommand(RecommendLineupRequestDto request) {
        return new RecommendLineupCommand(
                request.regulation(),
                request.mine().stream().map(this::toPokemonCommand).toList(),
                request.winConditionIndex(),
                request.opponent().stream().map(this::toPokemonCommand).toList());
    }

    public RecommendLineupResponseDto toResponse(RecommendLineupResult result) {
        return new RecommendLineupResponseDto(
                result.evaluatedLineups(),
                result.recommendations().stream().map(this::toRecommendationDto).toList());
    }

    private EvaluateMineCommand toMineCommand(EvaluateMineRequestDto mine) {
        return new EvaluateMineCommand(
                mine.lineup().stream().map(this::toPokemonCommand).toList(), mine.winConditionIndex());
    }

    private EvaluateMatchupPokemonCommand toPokemonCommand(EvaluateMatchupPokemonRequestDto pokemon) {
        return new EvaluateMatchupPokemonCommand(
                pokemon.speciesId(),
                toCombatantCommand(pokemon.combatant()),
                pokemon.moveIds(),
                pokemon.assumedForms());
    }

    private CombatantCommand toCombatantCommand(com.vgcenter.damagecalc.web.dto.CombatantRequestDto combatant) {
        return new CombatantCommand(
                combatant.level(),
                new StatsCommand(
                        combatant.stats().hp(),
                        combatant.stats().attack(),
                        combatant.stats().defense(),
                        combatant.stats().specialAttack(),
                        combatant.stats().specialDefense(),
                        combatant.stats().speed()),
                combatant.types(),
                combatant.abilityId(),
                combatant.itemId(),
                combatant.status(),
                combatant.stages(),
                combatant.grounded(),
                combatant.currentHp());
    }

    private GameplanMatchupCellDto toCellDto(MatchupCellResult cell) {
        return new GameplanMatchupCellDto(
                cell.firstOpponentIndex(),
                cell.secondOpponentIndex(),
                cell.opponentLeadSpeciesIds(),
                toScoreDto(cell.score()),
                toFlagsDto(cell.mineFlags()),
                toFlagsDto(cell.opponentFlags()),
                cell.outgoing().stream().map(this::toDamageOptionDto).toList(),
                cell.incoming().stream().map(this::toDamageOptionDto).toList());
    }

    private RecommendationDto toRecommendationDto(RecommendationResult recommendation) {
        return new RecommendationDto(
                recommendation.lineupIndices(),
                recommendation.lineupSpeciesIds(),
                recommendation.winConditionIndex(),
                recommendation.averageScore(),
                recommendation.cells().stream().map(this::toCellDto).toList());
    }

    private GameplanScoreDto toScoreDto(MatchupScore score) {
        return new GameplanScoreDto(score.total(), score.offense(), score.defense(), score.speed(), score.immunity());
    }

    private TurnOneFlagsDto toFlagsDto(TurnOneFlags flags) {
        return new TurnOneFlagsDto(
                flags.protect(),
                flags.redirection(),
                flags.fakeOut(),
                flags.priority(),
                flags.speedControl().name());
    }

    private GameplanDamageOptionDto toDamageOptionDto(DamageOptionResult option) {
        return new GameplanDamageOptionDto(
                option.attackerIndex(), option.defenderIndex(), option.moveId(), toDamageDto(option.damage()));
    }

    private CalculateDamageResponseDto toDamageDto(CalculateDamageResult damage) {
        KoChanceResult koChance = damage.koChance();
        return new CalculateDamageResponseDto(
                damage.rolls(),
                damage.min(),
                damage.max(),
                damage.minPct(),
                damage.maxPct(),
                new KoChanceDto(koChance.description(), koChance.probability(), koChance.hits()));
    }
}
