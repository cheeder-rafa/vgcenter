package com.vgcenter.damagecalc.web.mapper;

import com.vgcenter.damagecalc.application.usecase.ParseReplayCommand;
import com.vgcenter.damagecalc.domain.replay.ReplayBoardState;
import com.vgcenter.damagecalc.domain.replay.ReplayBoostState;
import com.vgcenter.damagecalc.domain.replay.ReplayEvent;
import com.vgcenter.damagecalc.domain.replay.ReplayPokemonState;
import com.vgcenter.damagecalc.domain.replay.ReplaySideState;
import com.vgcenter.damagecalc.domain.replay.ReplayTimeline;
import com.vgcenter.damagecalc.domain.replay.ReplayTurn;
import com.vgcenter.damagecalc.web.dto.ReplayBoardStateDto;
import com.vgcenter.damagecalc.web.dto.ReplayBoostStateDto;
import com.vgcenter.damagecalc.web.dto.ReplayEventDto;
import com.vgcenter.damagecalc.web.dto.ReplayParseRequestDto;
import com.vgcenter.damagecalc.web.dto.ReplayPokemonStateDto;
import com.vgcenter.damagecalc.web.dto.ReplaySideStateDto;
import com.vgcenter.damagecalc.web.dto.ReplayTimelineDto;
import com.vgcenter.damagecalc.web.dto.ReplayTurnDto;
import org.springframework.stereotype.Component;

@Component
public class ReplayWebMapper {

    public ParseReplayCommand toCommand(ReplayParseRequestDto request) {
        return new ParseReplayCommand(request.url(), request.log());
    }

    public ReplayTimelineDto toResponse(ReplayTimeline timeline) {
        return new ReplayTimelineDto(
                timeline.sideAName(),
                timeline.sideBName(),
                timeline.winner(),
                timeline.tie(),
                timeline.turns().stream().map(this::toTurnDto).toList());
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
}
