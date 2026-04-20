package com.vgcenter.damagecalc.application.usecase;

import com.vgcenter.damagecalc.application.port.AbilityRepository;
import com.vgcenter.damagecalc.application.port.ItemRepository;
import com.vgcenter.damagecalc.application.port.MoveRepository;
import com.vgcenter.damagecalc.application.port.NatureCatalogRepository;
import com.vgcenter.damagecalc.application.port.PokedexRepository;
import com.vgcenter.damagecalc.domain.mega.MegaForm;

public final class DatasetCatalogService implements DatasetCatalogUseCase {

    private final PokedexRepository pokedexRepository;
    private final MoveRepository moveRepository;
    private final AbilityRepository abilityRepository;
    private final ItemRepository itemRepository;
    private final NatureCatalogRepository natureCatalogRepository;

    public DatasetCatalogService(
            PokedexRepository pokedexRepository,
            MoveRepository moveRepository,
            AbilityRepository abilityRepository,
            ItemRepository itemRepository,
            NatureCatalogRepository natureCatalogRepository) {
        this.pokedexRepository = pokedexRepository;
        this.moveRepository = moveRepository;
        this.abilityRepository = abilityRepository;
        this.itemRepository = itemRepository;
        this.natureCatalogRepository = natureCatalogRepository;
    }

    @Override
    public java.util.List<PokedexEntryView> pokedex(String regulationId) {
        return pokedexRepository.findAllByRegulation(regulationId).stream()
                .map(species -> new PokedexEntryView(
                        species.id(),
                        species.name(),
                        species.types().stream().map(Enum::name).toList(),
                        toStatsView(species.baseStats()),
                        species.abilityIds(),
                        species.moveIds(),
                        species.megaForms().stream().map(this::toMegaFormView).toList()))
                .toList();
    }

    @Override
    public java.util.List<NamedDatasetEntry> moves(String regulationId) {
        return moveRepository.findAllByRegulation(regulationId);
    }

    @Override
    public java.util.List<NamedDatasetEntry> abilities(String regulationId) {
        return abilityRepository.findAllByRegulation(regulationId);
    }

    @Override
    public java.util.List<NamedDatasetEntry> items(String regulationId) {
        return itemRepository.findAllByRegulation(regulationId);
    }

    @Override
    public java.util.List<NatureDefinition> natures(String regulationId) {
        return natureCatalogRepository.findAllByRegulation(regulationId);
    }

    private MegaFormView toMegaFormView(MegaForm megaForm) {
        return new MegaFormView(
                megaForm.id(),
                megaForm.name(),
                megaForm.types().stream().map(Enum::name).toList(),
                toStatsView(megaForm.baseStats()),
                megaForm.abilityId());
    }

    private StatsView toStatsView(com.vgcenter.damagecalc.domain.model.Stats stats) {
        return new StatsView(
                stats.hp(),
                stats.attack(),
                stats.defense(),
                stats.specialAttack(),
                stats.specialDefense(),
                stats.speed());
    }
}
