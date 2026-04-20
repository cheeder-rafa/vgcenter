package com.vgcenter.damagecalc.infrastructure.nature;

import com.vgcenter.damagecalc.application.port.NatureCatalogRepository;
import com.vgcenter.damagecalc.application.usecase.NatureDefinition;
import com.vgcenter.damagecalc.infrastructure.dataset.DatasetDocumentLoader;
import org.springframework.stereotype.Repository;

@Repository
public class JsonNatureCatalogRepository implements NatureCatalogRepository {

    private final DatasetDocumentLoader datasetDocumentLoader;

    public JsonNatureCatalogRepository(DatasetDocumentLoader datasetDocumentLoader) {
        this.datasetDocumentLoader = datasetDocumentLoader;
    }

    @Override
    public java.util.List<NatureDefinition> findAllByRegulation(String regulationId) {
        return datasetDocumentLoader.loadNatures(regulationId).stream()
                .map(entry ->
                        new NatureDefinition(entry.id(), entry.name(), entry.increasedStat(), entry.decreasedStat()))
                .toList();
    }
}
