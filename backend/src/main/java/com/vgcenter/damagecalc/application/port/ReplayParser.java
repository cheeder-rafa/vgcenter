package com.vgcenter.damagecalc.application.port;

import com.vgcenter.damagecalc.domain.replay.ReplayTimeline;

public interface ReplayParser {

    ReplayTimeline parse(String protocolLog);
}
