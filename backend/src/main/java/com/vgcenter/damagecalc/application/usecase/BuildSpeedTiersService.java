package com.vgcenter.damagecalc.application.usecase;

import com.vgcenter.damagecalc.application.port.NatureRepository;
import com.vgcenter.damagecalc.application.port.PokedexRepository;
import com.vgcenter.damagecalc.domain.model.Nature;
import com.vgcenter.damagecalc.domain.model.PokemonSpecies;
import com.vgcenter.damagecalc.domain.model.Sp;
import com.vgcenter.damagecalc.domain.model.Stats;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;

public final class BuildSpeedTiersService implements BuildSpeedTiersUseCase {

    private static final int VGC_LEVEL = 50;
    private static final Sp ZERO_SP = new Sp(0, 0, 0, 0, 0, 0);

    private final PokedexRepository pokedexRepository;
    private final NatureRepository natureRepository;

    public BuildSpeedTiersService(PokedexRepository pokedexRepository, NatureRepository natureRepository) {
        this.pokedexRepository = pokedexRepository;
        this.natureRepository = natureRepository;
    }

    @Override
    public SpeedTiersResult buildTiers(SpeedTiersCommand command) {
        List<PokemonSpecies> roster = pokedexRepository.findAllByRegulation(command.regulation());
        SpeedTierModifiersCommand modifiers = command.modifiers();

        List<SpeedTierRow> rows = new ArrayList<>();

        for (PokemonSpecies species : roster) {
            int baseSpeed = species.baseStats()
                    .toBattleStats(ZERO_SP, Nature.HARDY, VGC_LEVEL)
                    .speed();
            rows.add(
                    new SpeedTierRow(species.id(), species.name(), applyModifiers(baseSpeed, modifiers), false, false));
            for (var mega : species.megaForms()) {
                int megaSpeed = mega.baseStats()
                        .toBattleStats(ZERO_SP, Nature.HARDY, VGC_LEVEL)
                        .speed();
                rows.add(new SpeedTierRow(mega.id(), mega.name(), applyModifiers(megaSpeed, modifiers), false, true));
            }
        }

        for (SpeedTierEntryCommand entry : command.userTeam()) {
            PokemonSpecies species = pokedexRepository
                    .findById(command.regulation(), entry.speciesId())
                    .orElseThrow(() -> new SpeciesNotFoundException(entry.speciesId()));
            Nature nature = natureRepository
                    .findById(command.regulation(), entry.natureId())
                    .orElse(Nature.HARDY);
            Sp sp = new Sp(0, 0, 0, 0, 0, entry.spSpeed());
            int finalSpeed =
                    species.baseStats().toBattleStats(sp, nature, VGC_LEVEL).speed();
            rows.add(
                    new SpeedTierRow(species.id(), species.name(), applyModifiers(finalSpeed, modifiers), true, false));
        }

        Comparator<SpeedTierRow> order = modifiers.trickRoom()
                ? Comparator.comparingInt(SpeedTierRow::finalSpeed)
                : Comparator.comparingInt(SpeedTierRow::finalSpeed).reversed();

        rows.sort(order);
        return new SpeedTiersResult(rows);
    }

    private static int applyModifiers(int speed, SpeedTierModifiersCommand m) {
        int s = speed;
        if (m.paralysis()) s = s / 2;
        if (m.stages() != 0) s = Stats.applyStage(s, m.stages());
        if (m.tailwind()) s = s * 2;
        if (m.choiceScarf()) s = s * 3 / 2;
        return s;
    }
}
