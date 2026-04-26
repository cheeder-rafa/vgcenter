package com.vgcenter.damagecalc.application.port;

import com.vgcenter.damagecalc.application.usecase.MoveDefinition;
import com.vgcenter.damagecalc.application.usecase.NamedDatasetEntry;
import java.util.List;
import java.util.Optional;

public interface MoveRepository {

    List<NamedDatasetEntry> findAllByRegulation(String regulationId);

    default List<MoveDefinition> findDefinitionsByRegulation(String regulationId) {
        return List.of();
    }

    default Optional<MoveDefinition> findById(String regulationId, String moveId) {
        return findDefinitionsByRegulation(regulationId).stream()
                .filter(m -> m.id().equals(moveId))
                .findFirst();
    }
}
