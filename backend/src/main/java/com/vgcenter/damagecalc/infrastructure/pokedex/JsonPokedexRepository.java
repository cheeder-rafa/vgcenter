package com.vgcenter.damagecalc.infrastructure.pokedex;

import com.vgcenter.damagecalc.application.port.PokedexRepository;
import com.vgcenter.damagecalc.domain.mega.MegaForm;
import com.vgcenter.damagecalc.domain.model.PokemonSpecies;
import com.vgcenter.damagecalc.domain.model.Stats;
import com.vgcenter.damagecalc.domain.model.Type;
import com.vgcenter.damagecalc.infrastructure.dataset.BaseStatsDocument;
import com.vgcenter.damagecalc.infrastructure.dataset.DatasetDocumentLoader;
import com.vgcenter.damagecalc.infrastructure.dataset.MegaEvolutionDocument;
import com.vgcenter.damagecalc.infrastructure.dataset.PokedexEntryDocument;
import java.util.List;
import java.util.Map;
import org.springframework.stereotype.Repository;

@Repository
public class JsonPokedexRepository implements PokedexRepository {

    private final DatasetDocumentLoader datasetDocumentLoader;

    public JsonPokedexRepository(DatasetDocumentLoader datasetDocumentLoader) {
        this.datasetDocumentLoader = datasetDocumentLoader;
    }

    @Override
    public List<PokemonSpecies> findAllByRegulation(String regulationId) {
        Map<String, List<MegaForm>> megaBySpeciesId = datasetDocumentLoader.loadMegaEvolutions(regulationId).stream()
                .collect(java.util.stream.Collectors.groupingBy(
                        MegaEvolutionDocument::speciesId,
                        java.util.stream.Collectors.mapping(
                                this::toMegaForm, java.util.stream.Collectors.toUnmodifiableList())));

        return datasetDocumentLoader.loadPokedex(regulationId).stream()
                .map(entry -> toDomain(entry, megaBySpeciesId.getOrDefault(entry.id(), List.of())))
                .toList();
    }

    private PokemonSpecies toDomain(PokedexEntryDocument entry, List<MegaForm> megaForms) {
        return new PokemonSpecies(
                entry.id(),
                entry.name(),
                entry.types().stream().map(Type::valueOf).toList(),
                toStats(entry.baseStats()),
                entry.abilities(),
                entry.moves(),
                megaForms);
    }

    private MegaForm toMegaForm(MegaEvolutionDocument document) {
        return new MegaForm(
                document.id(),
                document.name(),
                document.types().stream().map(Type::valueOf).toList(),
                toStats(document.baseStats()),
                document.ability());
    }

    private Stats toStats(BaseStatsDocument baseStats) {
        return new Stats(
                baseStats.hp(),
                baseStats.attack(),
                baseStats.defense(),
                baseStats.specialAttack(),
                baseStats.specialDefense(),
                baseStats.speed());
    }
}
