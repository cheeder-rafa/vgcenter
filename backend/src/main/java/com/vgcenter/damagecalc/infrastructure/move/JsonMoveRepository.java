package com.vgcenter.damagecalc.infrastructure.move;

import com.vgcenter.damagecalc.application.port.MoveRepository;
import com.vgcenter.damagecalc.application.usecase.MoveDefinition;
import com.vgcenter.damagecalc.application.usecase.NamedDatasetEntry;
import com.vgcenter.damagecalc.infrastructure.dataset.DatasetDocumentLoader;
import org.springframework.stereotype.Repository;

@Repository
public class JsonMoveRepository implements MoveRepository {

    private final DatasetDocumentLoader datasetDocumentLoader;

    public JsonMoveRepository(DatasetDocumentLoader datasetDocumentLoader) {
        this.datasetDocumentLoader = datasetDocumentLoader;
    }

    @Override
    public java.util.List<NamedDatasetEntry> findAllByRegulation(String regulationId) {
        return datasetDocumentLoader.loadNamedReferences(regulationId, "moves.json").stream()
                .map(entry -> new NamedDatasetEntry(entry.id(), entry.name()))
                .toList();
    }

    @Override
    public java.util.List<MoveDefinition> findDefinitionsByRegulation(String regulationId) {
        return datasetDocumentLoader.loadMoveDefinitions(regulationId).stream()
                .map(entry -> new MoveDefinition(
                        entry.id(),
                        entry.name(),
                        entry.type(),
                        entry.category(),
                        entry.basePower(),
                        entry.spread(),
                        entry.contact(),
                        entry.doublePowerWhenUserStatused(),
                        entry.ignoreBurnPenaltyWhenUserStatused()))
                .toList();
    }
}
