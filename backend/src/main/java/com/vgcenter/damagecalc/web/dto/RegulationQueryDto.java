package com.vgcenter.damagecalc.web.dto;

import jakarta.validation.constraints.NotBlank;

public record RegulationQueryDto(@NotBlank String regulation) {}
