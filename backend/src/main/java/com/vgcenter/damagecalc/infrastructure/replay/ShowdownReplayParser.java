package com.vgcenter.damagecalc.infrastructure.replay;

import com.vgcenter.damagecalc.application.port.ReplayParser;
import com.vgcenter.damagecalc.domain.replay.ReplayBoardState;
import com.vgcenter.damagecalc.domain.replay.ReplayBoostState;
import com.vgcenter.damagecalc.domain.replay.ReplayEvent;
import com.vgcenter.damagecalc.domain.replay.ReplayPokemonState;
import com.vgcenter.damagecalc.domain.replay.ReplaySideState;
import com.vgcenter.damagecalc.domain.replay.ReplayTimeline;
import com.vgcenter.damagecalc.domain.replay.ReplayTurn;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import org.springframework.stereotype.Component;

@Component
public class ShowdownReplayParser implements ReplayParser {

    private static final List<String> TRACKED_EVENTS = List.of(
            "move",
            "switch",
            "-damage",
            "-heal",
            "-status",
            "-boost",
            "-unboost",
            "-weather",
            "-fieldstart",
            "-fieldend",
            "-sidestart",
            "-sideend",
            "faint",
            "win",
            "tie");

    @Override
    public ReplayTimeline parse(String protocolLog) {
        if (protocolLog == null || protocolLog.isBlank()) {
            throw new IllegalArgumentException("Replay protocol log must not be blank");
        }

        MutableBattleState battleState = new MutableBattleState();
        List<ReplayTurn> turns = new ArrayList<>();
        ReplayBoardState currentBoardState = null;
        List<ReplayEvent> currentEvents = new ArrayList<>();
        Integer currentTurn = null;

        for (String line : protocolLog.split("\n")) {
            if (line.isBlank()) {
                continue;
            }
            String[] parts = line.split("\\|", -1);
            if (parts.length < 2) {
                continue;
            }
            String eventType = parts[1];
            applyBattleState(battleState, eventType, parts);
            if ("turn".equals(eventType)) {
                if (currentTurn != null) {
                    turns.add(new ReplayTurn(currentTurn, currentBoardState, List.copyOf(currentEvents)));
                }
                currentTurn = Integer.parseInt(parts[2]);
                currentBoardState = battleState.snapshot();
                currentEvents = new ArrayList<>();
                continue;
            }
            if (currentTurn != null && TRACKED_EVENTS.contains(eventType)) {
                currentEvents.add(
                        new ReplayEvent(eventType, Arrays.asList(parts).subList(2, parts.length), line));
            }
        }

        if (currentTurn != null) {
            turns.add(new ReplayTurn(currentTurn, currentBoardState, List.copyOf(currentEvents)));
        }

        return new ReplayTimeline(
                battleState.sideA.playerName, battleState.sideB.playerName, battleState.winner, battleState.tie, turns);
    }

    private static void applyBattleState(MutableBattleState battleState, String eventType, String[] parts) {
        switch (eventType) {
            case "player" -> battleState.side(parts[2]).playerName = parts[3];
            case "switch" -> {
                MutablePokemonState pokemon = battleState.active(parts[2]);
                pokemon.speciesName = parseSpeciesName(parts[3]);
                applyCondition(pokemon, parts[4]);
                pokemon.resetBoosts();
            }
            case "detailschange" -> battleState.active(parts[2]).speciesName = parseSpeciesName(parts[3]);
            case "-damage", "-heal" -> applyCondition(battleState.active(parts[2]), parts[3]);
            case "-status" -> battleState.active(parts[2]).status = parts[3];
            case "-curestatus" -> battleState.active(parts[2]).status = null;
            case "-boost" -> battleState.active(parts[2]).adjustBoost(parts[3], parseAmount(parts[4]));
            case "-unboost" -> battleState.active(parts[2]).adjustBoost(parts[3], -parseAmount(parts[4]));
            case "-weather" -> battleState.weather = parts[2];
            case "-fieldstart" -> battleState.terrain = normalizeField(parts[2]);
            case "-fieldend" -> battleState.terrain = "none";
            case "-sidestart" -> battleState.sideFromToken(parts[2]).applySideCondition(parts[3], true);
            case "-sideend" -> battleState.sideFromToken(parts[2]).applySideCondition(parts[3], false);
            case "faint" -> {
                MutablePokemonState pokemon = battleState.active(parts[2]);
                pokemon.hpCurrent = 0;
                pokemon.fainted = true;
            }
            case "win" -> battleState.winner = parts[2];
            case "tie" -> battleState.tie = true;
            default -> {}
        }
    }

    private static int parseAmount(String raw) {
        return Integer.parseInt(raw);
    }

    private static String normalizeField(String raw) {
        return raw.startsWith("move: ") ? raw.substring("move: ".length()) : raw;
    }

    private static String parseSpeciesName(String details) {
        return details.split(",", 2)[0].trim();
    }

    private static void applyCondition(MutablePokemonState pokemon, String rawCondition) {
        String[] conditionParts = rawCondition.trim().split(" ");
        String hpToken = conditionParts[0];
        if ("0".equals(hpToken) || "0/0".equals(hpToken)) {
            pokemon.hpCurrent = 0;
            pokemon.hpMax = hpToken.contains("/") ? Integer.parseInt(hpToken.substring(hpToken.indexOf('/') + 1)) : 100;
            pokemon.fainted = true;
        } else if (hpToken.contains("/")) {
            String[] hpParts = hpToken.split("/", 2);
            pokemon.hpCurrent = Integer.parseInt(hpParts[0]);
            pokemon.hpMax = Integer.parseInt(hpParts[1]);
            pokemon.fainted = false;
        }
        pokemon.status = null;
        for (int index = 1; index < conditionParts.length; index++) {
            String token = conditionParts[index];
            if ("fnt".equals(token)) {
                pokemon.hpCurrent = 0;
                pokemon.fainted = true;
            } else if (!token.startsWith("[")) {
                pokemon.status = token;
            }
        }
    }

    private static final class MutableBattleState {

        private final MutableSideState sideA = new MutableSideState();
        private final MutableSideState sideB = new MutableSideState();
        private String weather = "none";
        private String terrain = "none";
        private String winner;
        private boolean tie;

        private MutableSideState side(String sideId) {
            return "p1".equals(sideId) ? sideA : sideB;
        }

        private MutableSideState sideFromToken(String token) {
            return side(token.substring(0, 2));
        }

        private MutablePokemonState active(String slotToken) {
            MutableSideState side = side(slotToken.substring(0, 2));
            return side.active.computeIfAbsent(parseSlotId(slotToken), MutablePokemonState::new);
        }

        private ReplayBoardState snapshot() {
            return new ReplayBoardState(weather, terrain, sideA.snapshot(), sideB.snapshot());
        }
    }

    private static final class MutableSideState {

        private String playerName;
        private boolean tailwind;
        private boolean reflect;
        private boolean lightScreen;
        private boolean auroraVeil;
        private final Map<String, MutablePokemonState> active = new LinkedHashMap<>();

        private void applySideCondition(String rawCondition, boolean activeState) {
            String condition = normalizeField(rawCondition);
            switch (condition) {
                case "Tailwind" -> tailwind = activeState;
                case "Reflect" -> reflect = activeState;
                case "Light Screen" -> lightScreen = activeState;
                case "Aurora Veil" -> auroraVeil = activeState;
                default -> {}
            }
        }

        private ReplaySideState snapshot() {
            return new ReplaySideState(
                    playerName,
                    tailwind,
                    reflect,
                    lightScreen,
                    auroraVeil,
                    active.values().stream()
                            .sorted(Comparator.comparing(pokemon -> pokemon.slotId))
                            .map(MutablePokemonState::snapshot)
                            .toList());
        }
    }

    private static final class MutablePokemonState {

        private final String slotId;
        private String speciesName = "";
        private int hpCurrent = 100;
        private int hpMax = 100;
        private String status;
        private boolean fainted;
        private int attack;
        private int defense;
        private int specialAttack;
        private int specialDefense;
        private int speed;
        private int accuracy;
        private int evasion;

        private MutablePokemonState(String slotId) {
            this.slotId = slotId;
        }

        private void adjustBoost(String stat, int amount) {
            switch (stat) {
                case "atk" -> attack += amount;
                case "def" -> defense += amount;
                case "spa" -> specialAttack += amount;
                case "spd" -> specialDefense += amount;
                case "spe" -> speed += amount;
                case "accuracy" -> accuracy += amount;
                case "evasion" -> evasion += amount;
                default -> {}
            }
        }

        private void resetBoosts() {
            attack = 0;
            defense = 0;
            specialAttack = 0;
            specialDefense = 0;
            speed = 0;
            accuracy = 0;
            evasion = 0;
        }

        private ReplayPokemonState snapshot() {
            return new ReplayPokemonState(
                    slotId,
                    speciesName,
                    hpCurrent,
                    hpMax,
                    status,
                    fainted,
                    new ReplayBoostState(attack, defense, specialAttack, specialDefense, speed, accuracy, evasion));
        }
    }

    private static String parseSlotId(String slotToken) {
        int separator = slotToken.indexOf(':');
        return separator >= 0 ? slotToken.substring(0, separator) : slotToken;
    }
}
