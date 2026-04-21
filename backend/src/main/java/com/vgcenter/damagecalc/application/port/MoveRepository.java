package com.vgcenter.damagecalc.application.port;

import com.vgcenter.damagecalc.application.usecase.MoveDefinition;
import com.vgcenter.damagecalc.application.usecase.NamedDatasetEntry;
import java.util.List;

public interface MoveRepository {

    List<NamedDatasetEntry> findAllByRegulation(String regulationId);

    default List<MoveDefinition> findDefinitionsByRegulation(String regulationId) {
        return List.of();
    }
}
