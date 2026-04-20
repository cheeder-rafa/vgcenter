package com.vgcenter.damagecalc.infrastructure.item;

import com.vgcenter.damagecalc.application.port.ItemRepository;
import com.vgcenter.damagecalc.application.usecase.NamedDatasetEntry;
import com.vgcenter.damagecalc.infrastructure.dataset.DatasetDocumentLoader;
import org.springframework.stereotype.Repository;

@Repository
public class JsonItemRepository implements ItemRepository {

    private final DatasetDocumentLoader datasetDocumentLoader;

    public JsonItemRepository(DatasetDocumentLoader datasetDocumentLoader) {
        this.datasetDocumentLoader = datasetDocumentLoader;
    }

    @Override
    public java.util.List<NamedDatasetEntry> findAllByRegulation(String regulationId) {
        return datasetDocumentLoader.loadNamedReferences(regulationId, "items.json").stream()
                .map(entry -> new NamedDatasetEntry(entry.id(), entry.name()))
                .toList();
    }
}
