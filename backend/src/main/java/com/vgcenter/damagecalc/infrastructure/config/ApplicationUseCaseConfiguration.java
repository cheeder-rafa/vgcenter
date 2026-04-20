package com.vgcenter.damagecalc.infrastructure.config;

import com.vgcenter.damagecalc.application.port.AbilityRepository;
import com.vgcenter.damagecalc.application.port.ItemRepository;
import com.vgcenter.damagecalc.application.port.MoveRepository;
import com.vgcenter.damagecalc.application.port.NatureCatalogRepository;
import com.vgcenter.damagecalc.application.port.NatureRepository;
import com.vgcenter.damagecalc.application.port.PokedexRepository;
import com.vgcenter.damagecalc.application.port.PokepasteClient;
import com.vgcenter.damagecalc.application.port.TeamParser;
import com.vgcenter.damagecalc.application.usecase.BuildStatsService;
import com.vgcenter.damagecalc.application.usecase.BuildStatsUseCase;
import com.vgcenter.damagecalc.application.usecase.CalculateDamageService;
import com.vgcenter.damagecalc.application.usecase.CalculateDamageUseCase;
import com.vgcenter.damagecalc.application.usecase.DatasetCatalogService;
import com.vgcenter.damagecalc.application.usecase.DatasetCatalogUseCase;
import com.vgcenter.damagecalc.application.usecase.ImportTeamService;
import com.vgcenter.damagecalc.application.usecase.ImportTeamUseCase;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class ApplicationUseCaseConfiguration {

    @Bean
    CalculateDamageUseCase calculateDamageUseCase() {
        return new CalculateDamageService();
    }

    @Bean
    DatasetCatalogUseCase datasetCatalogUseCase(
            PokedexRepository pokedexRepository,
            MoveRepository moveRepository,
            AbilityRepository abilityRepository,
            ItemRepository itemRepository,
            NatureCatalogRepository natureCatalogRepository) {
        return new DatasetCatalogService(
                pokedexRepository, moveRepository, abilityRepository, itemRepository, natureCatalogRepository);
    }

    @Bean
    BuildStatsUseCase buildStatsUseCase(PokedexRepository pokedexRepository, NatureRepository natureRepository) {
        return new BuildStatsService(pokedexRepository, natureRepository);
    }

    @Bean
    ImportTeamUseCase importTeamUseCase(TeamParser teamParser, PokepasteClient pokepasteClient) {
        return new ImportTeamService(teamParser, pokepasteClient);
    }
}
