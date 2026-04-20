package com.vgcenter.damagecalc.web.mapper;

import com.vgcenter.damagecalc.application.usecase.ImportedPokemonView;
import com.vgcenter.damagecalc.application.usecase.ImportedTeamResult;
import com.vgcenter.damagecalc.application.usecase.StatsView;
import com.vgcenter.damagecalc.web.dto.ImportedPokemonDto;
import com.vgcenter.damagecalc.web.dto.ImportedTeamResponseDto;
import com.vgcenter.damagecalc.web.dto.StatsResponseDto;
import org.springframework.stereotype.Component;

@Component
public class ImportWebMapper {

    public ImportedTeamResponseDto toResponse(ImportedTeamResult result) {
        return new ImportedTeamResponseDto(
                result.team().stream().map(this::toImportedPokemonDto).toList());
    }

    private ImportedPokemonDto toImportedPokemonDto(ImportedPokemonView pokemon) {
        return new ImportedPokemonDto(
                pokemon.speciesId(),
                pokemon.speciesName(),
                pokemon.nickname(),
                pokemon.level(),
                pokemon.gender(),
                pokemon.abilityId(),
                pokemon.itemId(),
                pokemon.natureId(),
                toStatsDto(pokemon.sp()),
                toStatsDto(pokemon.stats()),
                pokemon.moveIds());
    }

    private StatsResponseDto toStatsDto(StatsView stats) {
        return new StatsResponseDto(
                stats.hp(),
                stats.attack(),
                stats.defense(),
                stats.specialAttack(),
                stats.specialDefense(),
                stats.speed());
    }
}
