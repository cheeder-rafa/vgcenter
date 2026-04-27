package com.vgcenter.damagecalc.application.usecase;

import static org.assertj.core.api.Assertions.assertThat;

import com.vgcenter.damagecalc.application.port.NatureRepository;
import com.vgcenter.damagecalc.application.port.PokedexRepository;
import com.vgcenter.damagecalc.domain.mega.MegaForm;
import com.vgcenter.damagecalc.domain.model.Nature;
import com.vgcenter.damagecalc.domain.model.PokemonSpecies;
import com.vgcenter.damagecalc.domain.model.Stats;
import com.vgcenter.damagecalc.domain.model.Type;
import java.util.Comparator;
import java.util.List;
import org.junit.jupiter.api.Test;

class BuildSpeedTiersServiceTest {

    private final PokedexRepository pokedex = _reg -> List.of(garchomp(), incineroar());
    private final NatureRepository natures = _reg -> List.of(Nature.JOLLY, Nature.TIMID, Nature.HARDY, Nature.QUIET);
    private final BuildSpeedTiersService service = new BuildSpeedTiersService(pokedex, natures);

    @Test
    void jollyGarchompAtMaxSpeedSp_hasSpeed169() {
        // (102 + 32 + 20) * 1.1 = 169.4 → 169
        var result = service.buildTiers(
                new SpeedTiersCommand("M-A", List.of(entry("garchomp", 32, "JOLLY")), noModifiers()));

        SpeedTierRow userRow = result.rows().stream()
                .filter(SpeedTierRow::userTeam)
                .findFirst()
                .orElseThrow();
        assertThat(userRow.finalSpeed()).isEqualTo(169);
        assertThat(userRow.speciesId()).isEqualTo("garchomp");
    }

    @Test
    void rosterSpeeds_computedAtZeroSpNeutralNature() {
        // Garchomp base speed 102: 102 + 0 + 20 = 122
        var result = service.buildTiers(new SpeedTiersCommand("M-A", List.of(), noModifiers()));

        SpeedTierRow garchompRoster = result.rows().stream()
                .filter(r -> r.speciesId().equals("garchomp") && !r.userTeam())
                .findFirst()
                .orElseThrow();
        assertThat(garchompRoster.finalSpeed()).isEqualTo(122);
    }

    @Test
    void tailwindDoublesFinalSpeed() {
        var result =
                service.buildTiers(new SpeedTiersCommand("M-A", List.of(), modifiers(true, false, false, false, 0)));

        SpeedTierRow garchompRow = result.rows().stream()
                .filter(r -> r.speciesId().equals("garchomp"))
                .findFirst()
                .orElseThrow();
        // base roster speed 122 * 2 = 244
        assertThat(garchompRow.finalSpeed()).isEqualTo(244);
    }

    @Test
    void trickRoomSortsAscending() {
        var result =
                service.buildTiers(new SpeedTiersCommand("M-A", List.of(), modifiers(false, true, false, false, 0)));

        // Incineroar base 60 → 60+20=80, Garchomp 102 → 122; under TR Incineroar should come first
        List<SpeedTierRow> rows = result.rows();
        assertThat(rows.get(0).finalSpeed())
                .isLessThanOrEqualTo(rows.get(rows.size() - 1).finalSpeed());
    }

    @Test
    void choiceScarfAppliesOneAndHalfMultiplier() {
        var result =
                service.buildTiers(new SpeedTiersCommand("M-A", List.of(), modifiers(false, false, false, true, 0)));

        SpeedTierRow garchompRow = result.rows().stream()
                .filter(r -> r.speciesId().equals("garchomp"))
                .findFirst()
                .orElseThrow();
        // 122 * 3 / 2 = 183
        assertThat(garchompRow.finalSpeed()).isEqualTo(183);
    }

    @Test
    void paralysisHalvesFinalSpeed() {
        var result =
                service.buildTiers(new SpeedTiersCommand("M-A", List.of(), modifiers(false, false, true, false, 0)));

        SpeedTierRow garchompRow = result.rows().stream()
                .filter(r -> r.speciesId().equals("garchomp"))
                .findFirst()
                .orElseThrow();
        // 122 / 2 = 61
        assertThat(garchompRow.finalSpeed()).isEqualTo(61);
    }

    @Test
    void positiveStagesIncreaseSpeed() {
        var result =
                service.buildTiers(new SpeedTiersCommand("M-A", List.of(), modifiers(false, false, false, false, 1)));

        SpeedTierRow garchompRow = result.rows().stream()
                .filter(r -> r.speciesId().equals("garchomp"))
                .findFirst()
                .orElseThrow();
        // applyStage(122, 1) = 122 * 3 / 2 = 183
        assertThat(garchompRow.finalSpeed()).isEqualTo(183);
    }

    @Test
    void userTeamEntriesAreFlaggedAndIncludedAlongsideRoster() {
        var result = service.buildTiers(
                new SpeedTiersCommand("M-A", List.of(entry("incineroar", 0, "HARDY")), noModifiers()));

        long userRows = result.rows().stream().filter(SpeedTierRow::userTeam).count();
        long rosterRows = result.rows().stream().filter(r -> !r.userTeam()).count();
        // Roster has 2 species, user has 1 entry — total rows = 3
        assertThat(userRows).isEqualTo(1);
        assertThat(rosterRows).isEqualTo(2);
    }

    @Test
    void defaultSortIsDescendingBySpeed() {
        var result = service.buildTiers(new SpeedTiersCommand("M-A", List.of(), noModifiers()));

        List<Integer> speeds =
                result.rows().stream().map(SpeedTierRow::finalSpeed).toList();
        List<Integer> sorted = speeds.stream().sorted(Comparator.reverseOrder()).toList();
        assertThat(speeds).isEqualTo(sorted);
    }

    @Test
    void rosterIncludesMegaRow_whenSpeciesHasMegaForm() {
        // Venusaur base speed 80 → (80+20)=100; Mega Venusaur speed 80 → 100 (same but isMega=true)
        PokedexRepository pokedexWithMega = _reg -> List.of(venusaurWithMega());
        BuildSpeedTiersService svc = new BuildSpeedTiersService(pokedexWithMega, natures);

        var result = svc.buildTiers(new SpeedTiersCommand("M-A", List.of(), noModifiers()));

        List<SpeedTierRow> megaRows =
                result.rows().stream().filter(SpeedTierRow::isMega).toList();
        assertThat(megaRows).hasSize(1);
        assertThat(megaRows.get(0).speciesId()).isEqualTo("venusaur-mega");
        assertThat(megaRows.get(0).speciesName()).isEqualTo("Mega Venusaur");
        assertThat(megaRows.get(0).finalSpeed()).isEqualTo(100);
    }

    @Test
    void megaRowAppliesModifiers() {
        PokedexRepository pokedexWithMega = _reg -> List.of(venusaurWithMega());
        BuildSpeedTiersService svc = new BuildSpeedTiersService(pokedexWithMega, natures);

        // Mega Venusaur base speed 80 → 100 at L50; tailwind: 100*2=200
        var result = svc.buildTiers(new SpeedTiersCommand("M-A", List.of(), modifiers(true, false, false, false, 0)));

        SpeedTierRow megaRow =
                result.rows().stream().filter(SpeedTierRow::isMega).findFirst().orElseThrow();
        assertThat(megaRow.finalSpeed()).isEqualTo(200);
    }

    // --- helpers ---

    private static SpeedTierEntryCommand entry(String speciesId, int spSpeed, String natureId) {
        return new SpeedTierEntryCommand(speciesId, capitalize(speciesId), spSpeed, natureId);
    }

    private static SpeedTierModifiersCommand noModifiers() {
        return new SpeedTierModifiersCommand(false, false, false, false, 0);
    }

    private static SpeedTierModifiersCommand modifiers(
            boolean tailwind, boolean trickRoom, boolean paralysis, boolean choiceScarf, int stages) {
        return new SpeedTierModifiersCommand(tailwind, trickRoom, paralysis, choiceScarf, stages);
    }

    private static PokemonSpecies garchomp() {
        return new PokemonSpecies(
                "garchomp",
                "Garchomp",
                List.of(Type.DRAGON, Type.GROUND),
                new Stats(108, 130, 95, 80, 85, 102),
                List.of("rough-skin"),
                List.of("earthquake"));
    }

    private static PokemonSpecies incineroar() {
        return new PokemonSpecies(
                "incineroar",
                "Incineroar",
                List.of(Type.FIRE, Type.DARK),
                new Stats(95, 115, 90, 80, 90, 60),
                List.of("blaze", "intimidate"),
                List.of("flare-blitz"));
    }

    private static PokemonSpecies venusaurWithMega() {
        MegaForm megaVenusaur = new MegaForm(
                "venusaur-mega",
                "Mega Venusaur",
                List.of(Type.GRASS, Type.POISON),
                new Stats(80, 100, 123, 122, 120, 80),
                "thick-fat");
        return new PokemonSpecies(
                "venusaur",
                "Venusaur",
                List.of(Type.GRASS, Type.POISON),
                new Stats(80, 82, 83, 100, 100, 80),
                List.of("overgrow"),
                List.of("petal-blizzard"),
                megaVenusaur);
    }

    private static String capitalize(String s) {
        return s.isEmpty() ? s : Character.toUpperCase(s.charAt(0)) + s.substring(1);
    }
}
