package com.vgcenter.damagecalc.infrastructure.ability;

import com.vgcenter.damagecalc.application.port.AbilityRepository;
import com.vgcenter.damagecalc.application.usecase.NamedDatasetEntry;
import com.vgcenter.damagecalc.infrastructure.dataset.DatasetDocumentLoader;
import org.springframework.stereotype.Repository;

@Repository
public class JsonAbilityRepository implements AbilityRepository {

    private final DatasetDocumentLoader datasetDocumentLoader;

    public JsonAbilityRepository(DatasetDocumentLoader datasetDocumentLoader) {
        this.datasetDocumentLoader = datasetDocumentLoader;
    }

    @Override
    public java.util.List<NamedDatasetEntry> findAllByRegulation(String regulationId) {
        return datasetDocumentLoader.loadNamedReferences(regulationId, "abilities.json").stream()
                .map(entry -> new NamedDatasetEntry(entry.id(), entry.name()))
                .toList();
    }
}
