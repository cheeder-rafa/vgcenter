package com.vgcenter.damagecalc.application.usecase;

import com.vgcenter.damagecalc.domain.replay.ReplayTimeline;

public interface ParseReplayUseCase {

    ReplayTimeline parse(ParseReplayCommand command);
}
