package com.vgcenter.damagecalc.web.mapper;

import com.vgcenter.damagecalc.application.usecase.CalculateDamageCommand;
import com.vgcenter.damagecalc.application.usecase.CalculateDamageResult;
import com.vgcenter.damagecalc.application.usecase.CombatantCommand;
import com.vgcenter.damagecalc.application.usecase.FieldCommand;
import com.vgcenter.damagecalc.application.usecase.KoChanceResult;
import com.vgcenter.damagecalc.application.usecase.MoveCommand;
import com.vgcenter.damagecalc.application.usecase.SideConditionsCommand;
import com.vgcenter.damagecalc.application.usecase.StatsCommand;
import com.vgcenter.damagecalc.web.dto.CalculateDamageResponseDto;
import com.vgcenter.damagecalc.web.dto.DamageCalculationRequestDto;
import org.springframework.stereotype.Component;

@Component
public class DamageCalculationWebMapper {

    public CalculateDamageCommand toCommand(DamageCalculationRequestDto request) {
        return new CalculateDamageCommand(
                request.regulation(),
                new CombatantCommand(
                        request.attacker().level(),
                        toStatsCommand(request.attacker().stats()),
                        request.attacker().types(),
                        request.attacker().abilityId(),
                        request.attacker().itemId(),
                        request.attacker().status(),
                        request.attacker().stages(),
                        request.attacker().grounded(),
                        request.attacker().fullHp()),
                new CombatantCommand(
                        request.defender().level(),
                        toStatsCommand(request.defender().stats()),
                        request.defender().types(),
                        request.defender().abilityId(),
                        request.defender().itemId(),
                        request.defender().status(),
                        request.defender().stages(),
                        request.defender().grounded(),
                        request.defender().fullHp()),
                new MoveCommand(
                        request.move().type(),
                        request.move().category(),
                        request.move().basePower(),
                        request.move().spread(),
                        request.move().contact(),
                        request.move().doublePowerWhenUserStatused(),
                        request.move().ignoreBurnPenaltyWhenUserStatused()),
                new FieldCommand(
                        request.field().weather(),
                        request.field().terrain(),
                        request.field().room()),
                new SideConditionsCommand(
                        request.attackerSide().reflect(),
                        request.attackerSide().lightScreen(),
                        request.attackerSide().auroraVeil(),
                        request.attackerSide().friendGuard(),
                        request.attackerSide().helpingHand(),
                        request.attackerSide().protect()),
                new SideConditionsCommand(
                        request.defenderSide().reflect(),
                        request.defenderSide().lightScreen(),
                        request.defenderSide().auroraVeil(),
                        request.defenderSide().friendGuard(),
                        request.defenderSide().helpingHand(),
                        request.defenderSide().protect()),
                request.criticalHit(),
                request.targets());
    }

    public CalculateDamageResponseDto toResponse(CalculateDamageResult result) {
        KoChanceResult koChance = result.koChance();
        return new CalculateDamageResponseDto(
                result.rolls(),
                result.min(),
                result.max(),
                result.minPct(),
                result.maxPct(),
                new com.vgcenter.damagecalc.web.dto.KoChanceDto(
                        koChance.description(), koChance.probability(), koChance.hits()));
    }

    private StatsCommand toStatsCommand(com.vgcenter.damagecalc.web.dto.StatsDto stats) {
        return new StatsCommand(
                stats.hp(),
                stats.attack(),
                stats.defense(),
                stats.specialAttack(),
                stats.specialDefense(),
                stats.speed());
    }
}
