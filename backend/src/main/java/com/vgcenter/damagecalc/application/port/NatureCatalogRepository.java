package com.vgcenter.damagecalc.application.port;

import com.vgcenter.damagecalc.application.usecase.NatureDefinition;
import java.util.List;

public interface NatureCatalogRepository {

    List<NatureDefinition> findAllByRegulation(String regulationId);
}
