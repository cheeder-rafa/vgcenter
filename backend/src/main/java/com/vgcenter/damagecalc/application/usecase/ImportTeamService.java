package com.vgcenter.damagecalc.application.usecase;

import com.vgcenter.damagecalc.application.port.PokepasteClient;
import com.vgcenter.damagecalc.application.port.TeamParser;

public final class ImportTeamService implements ImportTeamUseCase {

    private static final String DEFAULT_REGULATION = "M-A";

    private final TeamParser teamParser;
    private final PokepasteClient pokepasteClient;

    public ImportTeamService(TeamParser teamParser, PokepasteClient pokepasteClient) {
        this.teamParser = teamParser;
        this.pokepasteClient = pokepasteClient;
    }

    @Override
    public ImportedTeamResult importShowdown(String text) {
        return new ImportedTeamResult(teamParser.parse(DEFAULT_REGULATION, text));
    }

    @Override
    public ImportedTeamResult importPokepaste(String url) {
        return new ImportedTeamResult(teamParser.parse(DEFAULT_REGULATION, pokepasteClient.fetch(url)));
    }
}
