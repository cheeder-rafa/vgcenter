package com.vgcenter.damagecalc.infrastructure.config;

import com.vgcenter.damagecalc.application.port.AbilityRepository;
import com.vgcenter.damagecalc.application.port.ItemRepository;
import com.vgcenter.damagecalc.application.port.MoveRepository;
import com.vgcenter.damagecalc.application.port.NatureCatalogRepository;
import com.vgcenter.damagecalc.application.port.PokedexRepository;
import com.vgcenter.damagecalc.application.usecase.CalculateDamageService;
import com.vgcenter.damagecalc.application.usecase.CalculateDamageUseCase;
import com.vgcenter.damagecalc.application.usecase.DatasetCatalogService;
import com.vgcenter.damagecalc.application.usecase.DatasetCatalogUseCase;
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
}
