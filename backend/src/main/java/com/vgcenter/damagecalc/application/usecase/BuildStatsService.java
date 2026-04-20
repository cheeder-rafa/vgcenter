package com.vgcenter.damagecalc.application.usecase;

import com.vgcenter.damagecalc.application.port.NatureRepository;
import com.vgcenter.damagecalc.application.port.PokedexRepository;
import com.vgcenter.damagecalc.domain.mega.MegaForm;
import com.vgcenter.damagecalc.domain.model.Nature;
import com.vgcenter.damagecalc.domain.model.PokemonSpecies;
import com.vgcenter.damagecalc.domain.model.Sp;
import com.vgcenter.damagecalc.domain.model.Stats;

public final class BuildStatsService implements BuildStatsUseCase {

    private static final String DEFAULT_REGULATION = "M-A";
    private static final int VGC_LEVEL = 50;

    private final PokedexRepository pokedexRepository;
    private final NatureRepository natureRepository;

    public BuildStatsService(PokedexRepository pokedexRepository, NatureRepository natureRepository) {
        this.pokedexRepository = pokedexRepository;
        this.natureRepository = natureRepository;
    }

    @Override
    public BuildStatsResult buildStats(BuildStatsCommand command) {
        PokemonSpecies species = pokedexRepository
                .findById(DEFAULT_REGULATION, command.speciesId())
                .orElseThrow(() -> new SpeciesNotFoundException(command.speciesId()));
        Nature nature = natureRepository
                .findById(DEFAULT_REGULATION, command.natureId())
                .orElseThrow(() -> new NatureNotFoundException(command.natureId()));
        Stats baseStats = resolveBaseStats(species, command.megaActive());
        Stats finalStats = baseStats.toBattleStats(toDomain(command.sp()), nature, VGC_LEVEL);
        return new BuildStatsResult(toStatsView(baseStats), toStatsView(finalStats));
    }

    private Stats resolveBaseStats(PokemonSpecies species, boolean megaActive) {
        if (!megaActive) {
            return species.baseStats();
        }
        MegaForm megaForm = species.megaForm()
                .orElseThrow(() -> new IllegalArgumentException(
                        "Species '%s' has no Mega form registered".formatted(species.id())));
        return megaForm.baseStats();
    }

    private Sp toDomain(SpCommand command) {
        return new Sp(
                command.hp(),
                command.attack(),
                command.defense(),
                command.specialAttack(),
                command.specialDefense(),
                command.speed());
    }

    private StatsView toStatsView(Stats stats) {
        return new StatsView(
                stats.hp(),
                stats.attack(),
                stats.defense(),
                stats.specialAttack(),
                stats.specialDefense(),
                stats.speed());
    }
}
