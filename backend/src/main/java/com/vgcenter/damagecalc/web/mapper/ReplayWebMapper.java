package com.vgcenter.damagecalc.web.mapper;

import com.vgcenter.damagecalc.application.usecase.EvaluateReplayDecisionsCommand;
import com.vgcenter.damagecalc.application.usecase.EvaluateReplayDecisionsResult;
import com.vgcenter.damagecalc.application.usecase.ParseReplayCommand;
import com.vgcenter.damagecalc.application.usecase.ReplayDecisionLine;
import com.vgcenter.damagecalc.application.usecase.ReplayGameReview;
import com.vgcenter.damagecalc.application.usecase.ReplayMoveChoice;
import com.vgcenter.damagecalc.application.usecase.ReplayScoringWeights;
import com.vgcenter.damagecalc.application.usecase.TurnReview;
import com.vgcenter.damagecalc.domain.replay.ReplayBoardState;
import com.vgcenter.damagecalc.domain.replay.ReplayBoostState;
import com.vgcenter.damagecalc.domain.replay.ReplayEvent;
import com.vgcenter.damagecalc.domain.replay.ReplayPokemonState;
import com.vgcenter.damagecalc.domain.replay.ReplaySideState;
import com.vgcenter.damagecalc.domain.replay.ReplayTimeline;
import com.vgcenter.damagecalc.domain.replay.ReplayTurn;
import com.vgcenter.damagecalc.web.dto.ReplayBoardStateDto;
import com.vgcenter.damagecalc.web.dto.ReplayBoostStateDto;
import com.vgcenter.damagecalc.web.dto.ReplayDecisionLineDto;
import com.vgcenter.damagecalc.web.dto.ReplayEvaluateRequestDto;
import com.vgcenter.damagecalc.web.dto.ReplayEvaluateResponseDto;
import com.vgcenter.damagecalc.web.dto.ReplayEventDto;
import com.vgcenter.damagecalc.web.dto.ReplayGameReviewDto;
import com.vgcenter.damagecalc.web.dto.ReplayMoveChoiceDto;
import com.vgcenter.damagecalc.web.dto.ReplayParseRequestDto;
import com.vgcenter.damagecalc.web.dto.ReplayPokemonStateDto;
import com.vgcenter.damagecalc.web.dto.ReplayScoringWeightsDto;
import com.vgcenter.damagecalc.web.dto.ReplaySideStateDto;
import com.vgcenter.damagecalc.web.dto.ReplayTimelineDto;
import com.vgcenter.damagecalc.web.dto.ReplayTurnDto;
import com.vgcenter.damagecalc.web.dto.TurnReviewDto;
import java.util.List;
import org.springframework.stereotype.Component;

@Component
public class ReplayWebMapper {

    public ParseReplayCommand toCommand(ReplayParseRequestDto request) {
        return new ParseReplayCommand(request.url(), request.log());
    }

    public EvaluateReplayDecisionsCommand toCommand(ReplayEvaluateRequestDto request) {
        List<ReplayTimeline> timelines;
        if (request.timeline() != null && request.timelines() != null) {
            throw new IllegalArgumentException("Replay evaluate request must provide timeline or timelines, not both");
        }
        if (request.timeline() != null) {
            timelines = List.of(toTimeline(request.timeline()));
        } else if (request.timelines() != null && !request.timelines().isEmpty()) {
            timelines = request.timelines().stream().map(this::toTimeline).toList();
        } else {
            throw new IllegalArgumentException("Replay evaluate request must provide timeline or timelines");
        }
        return new EvaluateReplayDecisionsCommand(request.regulation(), timelines, toWeights(request.objective()));
    }

    public ReplayTimelineDto toResponse(ReplayTimeline timeline) {
        return new ReplayTimelineDto(
                timeline.sideAName(),
                timeline.sideBName(),
                timeline.winner(),
                timeline.tie(),
                timeline.turns().stream().map(this::toTurnDto).toList());
    }

    public ReplayEvaluateResponseDto toResponse(EvaluateReplayDecisionsResult result) {
        return new ReplayEvaluateResponseDto(
                result.games().stream().map(this::toGameReviewDto).toList(), result.adaptationFlags());
    }

    private ReplayGameReviewDto toGameReviewDto(ReplayGameReview review) {
        return new ReplayGameReviewDto(
                review.gameNumber(),
                review.winner(),
                review.turnReviews().stream().map(this::toTurnReviewDto).toList());
    }

    private TurnReviewDto toTurnReviewDto(TurnReview review) {
        return new TurnReviewDto(
                review.turnNumber(),
                toDecisionLineDto(review.played()),
                review.rankedAlternatives().stream()
                        .map(this::toDecisionLineDto)
                        .toList(),
                review.delta(),
                review.verdict(),
                review.narrative());
    }

    private ReplayDecisionLineDto toDecisionLineDto(ReplayDecisionLine line) {
        return new ReplayDecisionLineDto(
                line.choices().stream().map(this::toMoveChoiceDto).toList(),
                line.score(),
                line.expectedDamageDealt(),
                line.expectedDamageTaken(),
                line.expectedKos(),
                line.expectedFaints());
    }

    private ReplayMoveChoiceDto toMoveChoiceDto(ReplayMoveChoice choice) {
        return new ReplayMoveChoiceDto(
                choice.actorSlotId(),
                choice.actorSpeciesName(),
                choice.moveName(),
                choice.targetSlotId(),
                choice.targetSpeciesName());
    }

    private ReplayTurnDto toTurnDto(ReplayTurn turn) {
        return new ReplayTurnDto(
                turn.number(),
                toBoardStateDto(turn.boardStateAtStart()),
                turn.events().stream().map(this::toEventDto).toList());
    }

    private ReplayBoardStateDto toBoardStateDto(ReplayBoardState boardState) {
        return new ReplayBoardStateDto(
                boardState.weather(),
                boardState.terrain(),
                toSideDto(boardState.sideA()),
                toSideDto(boardState.sideB()));
    }

    private ReplaySideStateDto toSideDto(ReplaySideState side) {
        return new ReplaySideStateDto(
                side.playerName(),
                side.tailwind(),
                side.reflect(),
                side.lightScreen(),
                side.auroraVeil(),
                side.activePokemon().stream().map(this::toPokemonDto).toList());
    }

    private ReplayPokemonStateDto toPokemonDto(ReplayPokemonState pokemon) {
        return new ReplayPokemonStateDto(
                pokemon.slotId(),
                pokemon.speciesName(),
                pokemon.hpCurrent(),
                pokemon.hpMax(),
                pokemon.status(),
                pokemon.fainted(),
                toBoostDto(pokemon.boosts()));
    }

    private ReplayBoostStateDto toBoostDto(ReplayBoostState boosts) {
        return new ReplayBoostStateDto(
                boosts.attack(),
                boosts.defense(),
                boosts.specialAttack(),
                boosts.specialDefense(),
                boosts.speed(),
                boosts.accuracy(),
                boosts.evasion());
    }

    private ReplayEventDto toEventDto(ReplayEvent event) {
        return new ReplayEventDto(event.type(), event.arguments(), event.raw());
    }

    private ReplayTimeline toTimeline(ReplayTimelineDto timeline) {
        return new ReplayTimeline(
                timeline.sideAName(),
                timeline.sideBName(),
                timeline.winner(),
                timeline.tie(),
                timeline.turns().stream().map(this::toTurn).toList());
    }

    private ReplayTurn toTurn(ReplayTurnDto turn) {
        return new ReplayTurn(
                turn.number(),
                toBoardState(turn.boardStateAtStart()),
                turn.events().stream()
                        .map(event -> new ReplayEvent(event.type(), event.arguments(), event.raw()))
                        .toList());
    }

    private ReplayBoardState toBoardState(ReplayBoardStateDto boardState) {
        return new ReplayBoardState(
                boardState.weather(), boardState.terrain(), toSide(boardState.sideA()), toSide(boardState.sideB()));
    }

    private ReplaySideState toSide(ReplaySideStateDto side) {
        return new ReplaySideState(
                side.playerName(),
                side.tailwind(),
                side.reflect(),
                side.lightScreen(),
                side.auroraVeil(),
                side.activePokemon().stream().map(this::toPokemon).toList());
    }

    private ReplayPokemonState toPokemon(ReplayPokemonStateDto pokemon) {
        return new ReplayPokemonState(
                pokemon.slotId(),
                pokemon.speciesName(),
                pokemon.hpCurrent(),
                pokemon.hpMax(),
                pokemon.status(),
                pokemon.fainted(),
                new ReplayBoostState(
                        pokemon.boosts().attack(),
                        pokemon.boosts().defense(),
                        pokemon.boosts().specialAttack(),
                        pokemon.boosts().specialDefense(),
                        pokemon.boosts().speed(),
                        pokemon.boosts().accuracy(),
                        pokemon.boosts().evasion()));
    }

    private ReplayScoringWeights toWeights(ReplayScoringWeightsDto objective) {
        if (objective == null) {
            return ReplayScoringWeights.defaults();
        }
        return new ReplayScoringWeights(
                objective.damageDealtWeight(),
                objective.damageTakenWeight(),
                objective.koBonus(),
                objective.faintPenalty());
    }
}
