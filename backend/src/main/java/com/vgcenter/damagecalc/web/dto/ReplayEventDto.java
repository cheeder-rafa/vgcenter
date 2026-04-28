package com.vgcenter.damagecalc.web.dto;

import java.util.List;

public record ReplayEventDto(String type, List<String> arguments, String raw) {}
