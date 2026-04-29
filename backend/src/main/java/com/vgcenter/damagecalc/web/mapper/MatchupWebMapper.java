package com.vgcenter.damagecalc.web.mapper;

import com.vgcenter.damagecalc.application.usecase.BuildThreatMatrixCommand;
import com.vgcenter.damagecalc.application.usecase.BuildThreatMatrixResult;
import com.vgcenter.damagecalc.application.usecase.CombatantCommand;
import com.vgcenter.damagecalc.application.usecase.FieldCommand;
import com.vgcenter.damagecalc.application.usecase.MatrixCellResult;
import com.vgcenter.damagecalc.application.usecase.MoveCommand;
import com.vgcenter.damagecalc.application.usecase.ResolvedMoveCommand;
import com.vgcenter.damagecalc.application.usecase.SideConditionsCommand;
import com.vgcenter.damagecalc.application.usecase.StatsCommand;
import com.vgcenter.damagecalc.application.usecase.ThreatPokemonCommand;
import com.vgcenter.damagecalc.web.dto.KoChanceDto;
import com.vgcenter.damagecalc.web.dto.MatrixCellDto;
import com.vgcenter.damagecalc.web.dto.ThreatMatrixRequestDto;
import com.vgcenter.damagecalc.web.dto.ThreatMatrixResponseDto;
import com.vgcenter.damagecalc.web.dto.ThreatPokemonRequestDto;
import java.util.Arrays;
import java.util.List;
import org.springframework.stereotype.Component;

@Component
public class MatchupWebMapper {

    public BuildThreatMatrixCommand toCommand(ThreatMatrixRequestDto request) {
        return new BuildThreatMatrixCommand(
                request.regulation(),
                request.teamA().stream().map(this::toPokemonCommand).toList(),
                request.teamB().stream().map(this::toPokemonCommand).toList(),
                new FieldCommand(
                        request.field().weather(),
                        request.field().terrain(),
                        request.field().room()),
                toSideCommand(request.sideA()),
                toSideCommand(request.sideB()));
    }

    public ThreatMatrixResponseDto toResponse(BuildThreatMatrixResult result) {
        return new ThreatMatrixResponseDto(
                result.deal().stream()
                        .map(row -> row.stream().map(this::toCellDto).toList())
                        .toList(),
                result.take().stream()
                        .map(row -> row.stream().map(this::toCellDto).toList())
                        .toList());
    }

    private ThreatPokemonCommand toPokemonCommand(ThreatPokemonRequestDto dto) {
        var c = dto.combatant();
        return new ThreatPokemonCommand(
                new CombatantCommand(
                        c.level(),
                        new StatsCommand(
                                c.stats().hp(),
                                c.stats().attack(),
                                c.stats().defense(),
                                c.stats().specialAttack(),
                                c.stats().specialDefense(),
                                c.stats().speed()),
                        c.types(),
                        c.abilityId(),
                        c.itemId(),
                        c.status(),
                        c.stages(),
                        c.grounded(),
                        c.currentHp()),
                dto.moves().stream()
                        .map(rm -> new ResolvedMoveCommand(
                                rm.moveId(),
                                new MoveCommand(
                                        rm.move().type(),
                                        rm.move().category(),
                                        rm.move().basePower(),
                                        rm.move().spread(),
                                        rm.move().contact(),
                                        rm.move().doublePowerWhenUserStatused(),
                                        rm.move().ignoreBurnPenaltyWhenUserStatused(),
                                        rm.move().accuracy() == null
                                                ? 1.0d
                                                : rm.move().accuracy(),
                                        Boolean.TRUE.equals(rm.move().alwaysCrit()))))
                        .toList());
    }

    private SideConditionsCommand toSideCommand(com.vgcenter.damagecalc.web.dto.SideConditionsDto dto) {
        return new SideConditionsCommand(
                dto.reflect(),
                dto.lightScreen(),
                dto.auroraVeil(),
                dto.friendGuard(),
                dto.helpingHand(),
                dto.tailwind(),
                dto.protect());
    }

    private MatrixCellDto toCellDto(MatrixCellResult cell) {
        List<Integer> rolls = Arrays.stream(cell.rolls()).boxed().toList();
        KoChanceDto ko = new KoChanceDto(
                cell.koChance().description(),
                cell.koChance().probability(),
                cell.koChance().hits());
        return new MatrixCellDto(cell.bestMoveId(), cell.minPct(), cell.maxPct(), rolls, ko);
    }
}
