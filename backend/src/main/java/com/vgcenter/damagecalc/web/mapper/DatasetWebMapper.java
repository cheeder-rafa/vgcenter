package com.vgcenter.damagecalc.web.mapper;

import com.vgcenter.damagecalc.application.usecase.BuildStatsCommand;
import com.vgcenter.damagecalc.application.usecase.BuildStatsResult;
import com.vgcenter.damagecalc.application.usecase.MegaFormView;
import com.vgcenter.damagecalc.application.usecase.NamedDatasetEntry;
import com.vgcenter.damagecalc.application.usecase.NatureDefinition;
import com.vgcenter.damagecalc.application.usecase.PokedexEntryView;
import com.vgcenter.damagecalc.application.usecase.SpCommand;
import com.vgcenter.damagecalc.application.usecase.StatsView;
import com.vgcenter.damagecalc.web.dto.BuildStatsRequestDto;
import com.vgcenter.damagecalc.web.dto.BuildStatsResponseDto;
import com.vgcenter.damagecalc.web.dto.MegaFormResponseDto;
import com.vgcenter.damagecalc.web.dto.NamedDatasetEntryDto;
import com.vgcenter.damagecalc.web.dto.NatureResponseDto;
import com.vgcenter.damagecalc.web.dto.PokedexEntryResponseDto;
import com.vgcenter.damagecalc.web.dto.StatsResponseDto;
import org.springframework.stereotype.Component;

@Component
public class DatasetWebMapper {

    public BuildStatsCommand toBuildStatsCommand(BuildStatsRequestDto request) {
        return new BuildStatsCommand(
                request.speciesId(),
                new SpCommand(
                        request.sp().hp(),
                        request.sp().attack(),
                        request.sp().defense(),
                        request.sp().specialAttack(),
                        request.sp().specialDefense(),
                        request.sp().speed()),
                request.natureId(),
                request.megaActive());
    }

    public BuildStatsResponseDto toBuildStatsResponse(BuildStatsResult result) {
        return new BuildStatsResponseDto(toStatsResponse(result.baseStats()), toStatsResponse(result.finalStats()));
    }

    public java.util.List<PokedexEntryResponseDto> toPokedexResponse(java.util.List<PokedexEntryView> entries) {
        return entries.stream()
                .map(entry -> new PokedexEntryResponseDto(
                        entry.id(),
                        entry.name(),
                        entry.types(),
                        toStatsResponse(entry.baseStats()),
                        entry.abilityIds(),
                        entry.moveIds(),
                        entry.megaForms().stream().map(this::toMegaResponse).toList()))
                .toList();
    }

    public java.util.List<NamedDatasetEntryDto> toNamedEntries(java.util.List<NamedDatasetEntry> entries) {
        return entries.stream()
                .map(entry -> new NamedDatasetEntryDto(entry.id(), entry.name()))
                .toList();
    }

    public java.util.List<NatureResponseDto> toNatureResponse(java.util.List<NatureDefinition> natures) {
        return natures.stream()
                .map(nature -> new NatureResponseDto(
                        nature.id(), nature.name(), nature.increasedStat(), nature.decreasedStat()))
                .toList();
    }

    private MegaFormResponseDto toMegaResponse(MegaFormView megaForm) {
        return new MegaFormResponseDto(
                megaForm.id(),
                megaForm.name(),
                megaForm.types(),
                toStatsResponse(megaForm.baseStats()),
                megaForm.abilityId());
    }

    private StatsResponseDto toStatsResponse(StatsView stats) {
        return new StatsResponseDto(
                stats.hp(),
                stats.attack(),
                stats.defense(),
                stats.specialAttack(),
                stats.specialDefense(),
                stats.speed());
    }
}
