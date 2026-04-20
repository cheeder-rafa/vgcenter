package com.vgcenter.damagecalc.application.port;

import com.vgcenter.damagecalc.application.usecase.NamedDatasetEntry;
import java.util.List;

public interface MoveRepository {

    List<NamedDatasetEntry> findAllByRegulation(String regulationId);
}
