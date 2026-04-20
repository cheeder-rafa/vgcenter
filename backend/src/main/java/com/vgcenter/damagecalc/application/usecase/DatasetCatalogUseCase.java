package com.vgcenter.damagecalc.application.usecase;

import java.util.List;

public interface DatasetCatalogUseCase {

    List<PokedexEntryView> pokedex(String regulationId);

    List<NamedDatasetEntry> moves(String regulationId);

    List<NamedDatasetEntry> abilities(String regulationId);

    List<NamedDatasetEntry> items(String regulationId);

    List<NatureDefinition> natures(String regulationId);
}
