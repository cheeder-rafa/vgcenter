package com.vgcenter.damagecalc.application.port;

import com.vgcenter.damagecalc.domain.model.PokemonSpecies;
import java.util.List;
import java.util.Optional;

public interface PokedexRepository {

    List<PokemonSpecies> findAllByRegulation(String regulationId);

    default Optional<PokemonSpecies> findById(String regulationId, String speciesId) {
        return findAllByRegulation(regulationId).stream()
                .filter(species -> species.id().equals(speciesId))
                .findFirst();
    }
}
