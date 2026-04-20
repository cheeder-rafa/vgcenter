package com.vgcenter.damagecalc.application.port;

import com.vgcenter.damagecalc.application.usecase.ImportedPokemonView;
import java.util.List;

public interface TeamParser {

    List<ImportedPokemonView> parse(String regulationId, String text);
}
