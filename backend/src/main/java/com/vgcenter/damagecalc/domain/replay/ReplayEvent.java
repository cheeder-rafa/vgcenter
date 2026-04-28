package com.vgcenter.damagecalc.domain.replay;

import java.util.List;

public record ReplayEvent(String type, List<String> arguments, String raw) {}
