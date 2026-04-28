package com.vgcenter.damagecalc.application.usecase;

import com.vgcenter.damagecalc.application.port.ReplayParser;
import com.vgcenter.damagecalc.application.port.ReplaySource;
import com.vgcenter.damagecalc.domain.replay.ReplayTimeline;

public final class ParseReplayService implements ParseReplayUseCase {

    private final ReplayParser replayParser;
    private final ReplaySource replaySource;

    public ParseReplayService(ReplayParser replayParser, ReplaySource replaySource) {
        this.replayParser = replayParser;
        this.replaySource = replaySource;
    }

    @Override
    public ReplayTimeline parse(ParseReplayCommand command) {
        String url = normalize(command.url());
        String log = normalize(command.log());
        if (url == null && log == null) {
            throw new IllegalArgumentException("Replay parse request must provide either url or log");
        }
        if (url != null && log != null) {
            throw new IllegalArgumentException("Replay parse request must provide exactly one of url or log");
        }
        return replayParser.parse(url != null ? replaySource.fetch(url) : log);
    }

    private static String normalize(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }
}
