package com.vgcenter.damagecalc.application.port;

import com.vgcenter.damagecalc.domain.model.Nature;
import java.util.List;
import java.util.Optional;

public interface NatureRepository {

    List<Nature> findAllByRegulation(String regulationId);

    default Optional<Nature> findById(String regulationId, String natureId) {
        return findAllByRegulation(regulationId).stream()
                .filter(nature -> nature.name().equalsIgnoreCase(natureId))
                .findFirst();
    }
}
