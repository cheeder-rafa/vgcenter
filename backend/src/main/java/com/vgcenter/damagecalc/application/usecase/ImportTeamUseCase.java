package com.vgcenter.damagecalc.application.usecase;

public interface ImportTeamUseCase {

    ImportedTeamResult importShowdown(String text);

    ImportedTeamResult importPokepaste(String url);
}
