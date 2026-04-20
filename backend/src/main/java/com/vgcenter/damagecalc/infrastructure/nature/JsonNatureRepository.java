package com.vgcenter.damagecalc.infrastructure.nature;

import com.vgcenter.damagecalc.application.port.NatureRepository;
import com.vgcenter.damagecalc.domain.model.Nature;
import com.vgcenter.damagecalc.infrastructure.dataset.DatasetDocumentLoader;
import com.vgcenter.damagecalc.infrastructure.dataset.NatureEntryDocument;
import java.util.List;
import java.util.Locale;
import org.springframework.stereotype.Repository;

@Repository
public class JsonNatureRepository implements NatureRepository {

    private final DatasetDocumentLoader datasetDocumentLoader;

    public JsonNatureRepository(DatasetDocumentLoader datasetDocumentLoader) {
        this.datasetDocumentLoader = datasetDocumentLoader;
    }

    @Override
    public List<Nature> findAllByRegulation(String regulationId) {
        return datasetDocumentLoader.loadNatures(regulationId).stream()
                .map(this::toDomain)
                .toList();
    }

    private Nature toDomain(NatureEntryDocument entry) {
        return Nature.valueOf(entry.id().toUpperCase(Locale.ROOT));
    }
}
