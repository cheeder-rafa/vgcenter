package com.vgcenter.damagecalc.application.usecase;

public final class SpeciesNotFoundException extends RuntimeException {

    public SpeciesNotFoundException(String speciesId) {
        super("Unknown species: " + speciesId);
    }
}
