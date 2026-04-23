package com.vgcenter.damagecalc.web.dto;

public record TurnOneFlagsDto(
        boolean protect, boolean redirection, boolean fakeOut, boolean priority, String speedControl) {}
