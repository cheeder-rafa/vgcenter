package com.vgcenter.damagecalc.application.usecase;

import static org.assertj.core.api.Assertions.assertThat;

import com.vgcenter.damagecalc.application.port.MoveRepository;
import com.vgcenter.damagecalc.domain.gameplan.MatchupScorer;
import java.util.List;
import java.util.Map;
import org.junit.jupiter.api.Test;

class EvaluateMatchupServiceTest {

    private final CalculateDamageService calculateDamageService = new CalculateDamageService();
    private final EvaluateMatchupService service =
            new EvaluateMatchupService(calculateDamageService, new StubMoveRepository(), new MatchupScorer());

    @Test
    void evaluatesAllOpponentLeadPairsAndReusesRawDamageOutputs() {
        EvaluateMatchupResult result = service.evaluate(new EvaluateMatchupCommand("M-A", myLineup(), opponentTeam()));

        assertThat(result.cells()).hasSize(15);

        MatchupCellResult openingCell = cell(result, 0, 1);
        assertDamageEquals(
                findOutgoing(openingCell, 0, 0, "heat-wave").damage(),
                rawDamage(myLineup().lineup().get(0), opponentTeam().get(0), move("heat-wave"), 2));

        MatchupCellResult middleCell = cell(result, 0, 2);
        assertDamageEquals(
                findOutgoing(middleCell, 1, 1, "close-combat").damage(),
                rawDamage(myLineup().lineup().get(1), opponentTeam().get(2), move("close-combat"), 1));

        MatchupCellResult lateCell = cell(result, 3, 4);
        assertDamageEquals(
                findIncoming(lateCell, 0, 0, "thunderbolt").damage(),
                rawDamage(opponentTeam().get(3), myLineup().lineup().get(0), move("thunderbolt"), 1));
    }

    private void assertDamageEquals(CalculateDamageResult actual, CalculateDamageResult expected) {
        assertThat(actual.rolls()).containsExactly(expected.rolls());
        assertThat(actual.min()).isEqualTo(expected.min());
        assertThat(actual.max()).isEqualTo(expected.max());
        assertThat(actual.minPct()).isEqualTo(expected.minPct());
        assertThat(actual.maxPct()).isEqualTo(expected.maxPct());
        assertThat(actual.koChance()).isEqualTo(expected.koChance());
    }

    private CalculateDamageResult rawDamage(
            EvaluateMatchupPokemonCommand attacker,
            EvaluateMatchupPokemonCommand defender,
            MoveDefinition move,
            int targets) {
        return calculateDamageService.calculate(new CalculateDamageCommand(
                "M-A",
                attacker.combatant(),
                defender.combatant(),
                new MoveCommand(
                        move.type(),
                        move.category(),
                        move.basePower(),
                        move.spread(),
                        move.contact(),
                        move.doublePowerWhenUserStatused(),
                        move.ignoreBurnPenaltyWhenUserStatused()),
                new FieldCommand("CLEAR", "NONE", "NONE"),
                new SideConditionsCommand(false, false, false, false, false, false, false),
                new SideConditionsCommand(false, false, false, false, false, false, false),
                false,
                targets));
    }

    private MatchupCellResult cell(EvaluateMatchupResult result, int firstOpponentIndex, int secondOpponentIndex) {
        return result.cells().stream()
                .filter(cell -> cell.firstOpponentIndex() == firstOpponentIndex
                        && cell.secondOpponentIndex() == secondOpponentIndex)
                .findFirst()
                .orElseThrow();
    }

    private DamageOptionResult findOutgoing(
            MatchupCellResult cell, int attackerIndex, int defenderIndex, String moveId) {
        return cell.outgoing().stream()
                .filter(option -> option.attackerIndex() == attackerIndex)
                .filter(option -> option.defenderIndex() == defenderIndex)
                .filter(option -> option.moveId().equals(moveId))
                .findFirst()
                .orElseThrow();
    }

    private DamageOptionResult findIncoming(
            MatchupCellResult cell, int attackerIndex, int defenderIndex, String moveId) {
        return cell.incoming().stream()
                .filter(option -> option.attackerIndex() == attackerIndex)
                .filter(option -> option.defenderIndex() == defenderIndex)
                .filter(option -> option.moveId().equals(moveId))
                .findFirst()
                .orElseThrow();
    }

    private EvaluateMineCommand myLineup() {
        return new EvaluateMineCommand(
                List.of(
                        pokemon(
                                "charizard",
                                new CombatantCommand(
                                        50,
                                        new StatsCommand(153, 104, 98, 161, 105, 152),
                                        List.of("FIRE", "FLYING"),
                                        "blaze",
                                        "life-orb",
                                        "NONE",
                                        Map.of(),
                                        true,
                                        153),
                                "heat-wave",
                                "air-slash",
                                "protect",
                                "solar-beam"),
                        pokemon(
                                "lucario",
                                new CombatantCommand(
                                        50,
                                        new StatsCommand(145, 162, 90, 135, 90, 142),
                                        List.of("FIGHTING", "STEEL"),
                                        "adaptability",
                                        "life-orb",
                                        "NONE",
                                        Map.of(),
                                        true,
                                        145),
                                "close-combat",
                                "bullet-punch",
                                "protect",
                                "tailwind"),
                        pokemon(
                                "gastrodon",
                                new CombatantCommand(
                                        50,
                                        new StatsCommand(186, 92, 113, 115, 132, 59),
                                        List.of("WATER", "GROUND"),
                                        "storm-drain",
                                        "leftovers",
                                        "NONE",
                                        Map.of(),
                                        true,
                                        186),
                                "earth-power",
                                "ice-beam",
                                "recover",
                                "protect"),
                        pokemon(
                                "amoonguss",
                                new CombatantCommand(
                                        50,
                                        new StatsCommand(188, 94, 108, 105, 124, 50),
                                        List.of("GRASS", "POISON"),
                                        "regenerator",
                                        "sitrus-berry",
                                        "NONE",
                                        Map.of(),
                                        true,
                                        188),
                                "rage-powder",
                                "spore",
                                "protect",
                                "pollen-puff")),
                1);
    }

    private List<EvaluateMatchupPokemonCommand> opponentTeam() {
        return List.of(
                pokemon(
                        "blastoise",
                        new CombatantCommand(
                                50,
                                new StatsCommand(154, 103, 120, 137, 126, 98),
                                List.of("WATER"),
                                "torrent",
                                "mystic-water",
                                "NONE",
                                Map.of(),
                                true,
                                154),
                        "water-pulse",
                        "ice-beam",
                        "aura-sphere",
                        "protect"),
                pokemon(
                        "venusaur",
                        new CombatantCommand(
                                50,
                                new StatsCommand(155, 102, 103, 152, 120, 132),
                                List.of("GRASS", "POISON"),
                                "overgrow",
                                "black-sludge",
                                "NONE",
                                Map.of(),
                                true,
                                155),
                        "leaf-storm",
                        "sludge-bomb",
                        "sleep-powder",
                        "protect"),
                pokemon(
                        "tyranitar",
                        new CombatantCommand(
                                50,
                                new StatsCommand(175, 166, 130, 104, 121, 81),
                                List.of("ROCK", "DARK"),
                                "sand-stream",
                                "choice-band",
                                "NONE",
                                Map.of(),
                                true,
                                175),
                        "rock-slide",
                        "crunch",
                        "low-kick",
                        "protect"),
                pokemon(
                        "pikachu",
                        new CombatantCommand(
                                50,
                                new StatsCommand(110, 117, 60, 112, 70, 156),
                                List.of("ELECTRIC"),
                                "lightning-rod",
                                "light-ball",
                                "NONE",
                                Map.of(),
                                true,
                                110),
                        "thunderbolt",
                        "fake-out",
                        "quick-attack",
                        "protect"),
                pokemon(
                        "farigiraf",
                        new CombatantCommand(
                                50,
                                new StatsCommand(180, 106, 90, 142, 103, 92),
                                List.of("NORMAL", "PSYCHIC"),
                                "armor-tail",
                                "throat-spray",
                                "NONE",
                                Map.of(),
                                true,
                                180),
                        "hyper-voice",
                        "dazzling-gleam",
                        "trick-room",
                        "protect"),
                pokemon(
                        "pelipper",
                        new CombatantCommand(
                                50,
                                new StatsCommand(150, 81, 95, 115, 90, 117),
                                List.of("WATER", "FLYING"),
                                "drizzle",
                                "focus-sash",
                                "NONE",
                                Map.of(),
                                true,
                                150),
                        "hurricane",
                        "weather-ball",
                        "tailwind",
                        "protect"));
    }

    private EvaluateMatchupPokemonCommand pokemon(
            String speciesId, CombatantCommand combatant, String move1, String move2, String move3, String move4) {
        return new EvaluateMatchupPokemonCommand(speciesId, combatant, List.of(move1, move2, move3, move4), List.of());
    }

    private MoveDefinition move(String moveId) {
        return new StubMoveRepository()
                .findDefinitionsByRegulation("M-A").stream()
                        .filter(move -> move.id().equals(moveId))
                        .findFirst()
                        .orElseThrow();
    }

    private static final class StubMoveRepository implements MoveRepository {

        private static final List<MoveDefinition> MOVES = List.of(
                new MoveDefinition("heat-wave", "Heat Wave", "FIRE", "SPECIAL", 95, true, false, false, false),
                new MoveDefinition("air-slash", "Air Slash", "FLYING", "SPECIAL", 75, false, false, false, false),
                new MoveDefinition("protect", "Protect", "NORMAL", "STATUS", 0, false, false, false, false),
                new MoveDefinition("solar-beam", "Solar Beam", "GRASS", "SPECIAL", 120, false, false, false, false),
                new MoveDefinition(
                        "close-combat", "Close Combat", "FIGHTING", "PHYSICAL", 120, false, true, false, false),
                new MoveDefinition("bullet-punch", "Bullet Punch", "STEEL", "PHYSICAL", 40, false, true, false, false),
                new MoveDefinition("tailwind", "Tailwind", "FLYING", "STATUS", 0, true, false, false, false),
                new MoveDefinition("earth-power", "Earth Power", "GROUND", "SPECIAL", 90, false, false, false, false),
                new MoveDefinition("ice-beam", "Ice Beam", "ICE", "SPECIAL", 90, false, false, false, false),
                new MoveDefinition("recover", "Recover", "NORMAL", "STATUS", 0, false, false, false, false),
                new MoveDefinition("rage-powder", "Rage Powder", "BUG", "STATUS", 0, false, false, false, false),
                new MoveDefinition("spore", "Spore", "GRASS", "STATUS", 0, false, false, false, false),
                new MoveDefinition("pollen-puff", "Pollen Puff", "BUG", "SPECIAL", 90, false, false, false, false),
                new MoveDefinition("water-pulse", "Water Pulse", "WATER", "SPECIAL", 60, false, false, false, false),
                new MoveDefinition("aura-sphere", "Aura Sphere", "FIGHTING", "SPECIAL", 80, false, false, false, false),
                new MoveDefinition("leaf-storm", "Leaf Storm", "GRASS", "SPECIAL", 130, false, false, false, false),
                new MoveDefinition("sludge-bomb", "Sludge Bomb", "POISON", "SPECIAL", 90, false, false, false, false),
                new MoveDefinition("sleep-powder", "Sleep Powder", "GRASS", "STATUS", 0, false, false, false, false),
                new MoveDefinition("rock-slide", "Rock Slide", "ROCK", "PHYSICAL", 75, true, false, false, false),
                new MoveDefinition("crunch", "Crunch", "DARK", "PHYSICAL", 80, false, true, false, false),
                new MoveDefinition("low-kick", "Low Kick", "FIGHTING", "PHYSICAL", 80, false, true, false, false),
                new MoveDefinition("thunderbolt", "Thunderbolt", "ELECTRIC", "SPECIAL", 90, false, false, false, false),
                new MoveDefinition("fake-out", "Fake Out", "NORMAL", "PHYSICAL", 40, false, true, false, false),
                new MoveDefinition("quick-attack", "Quick Attack", "NORMAL", "PHYSICAL", 40, false, true, false, false),
                new MoveDefinition("hyper-voice", "Hyper Voice", "NORMAL", "SPECIAL", 90, true, false, false, false),
                new MoveDefinition(
                        "dazzling-gleam", "Dazzling Gleam", "FAIRY", "SPECIAL", 80, true, false, false, false),
                new MoveDefinition("trick-room", "Trick Room", "PSYCHIC", "STATUS", 0, false, false, false, false),
                new MoveDefinition("hurricane", "Hurricane", "FLYING", "SPECIAL", 110, false, false, false, false),
                new MoveDefinition(
                        "weather-ball", "Weather Ball", "NORMAL", "SPECIAL", 50, false, false, false, false));

        @Override
        public List<NamedDatasetEntry> findAllByRegulation(String regulationId) {
            return MOVES.stream()
                    .map(move -> new NamedDatasetEntry(move.id(), move.name()))
                    .toList();
        }

        @Override
        public List<MoveDefinition> findDefinitionsByRegulation(String regulationId) {
            return MOVES;
        }
    }
}
