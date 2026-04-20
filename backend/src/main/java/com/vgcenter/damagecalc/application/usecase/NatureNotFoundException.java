package com.vgcenter.damagecalc.application.usecase;

public final class NatureNotFoundException extends RuntimeException {

    public NatureNotFoundException(String natureId) {
        super("Unknown nature: " + natureId);
    }
}
