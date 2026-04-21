package com.vgcenter.damagecalc.application.usecase;

import com.vgcenter.damagecalc.application.port.NatureRepository;
import com.vgcenter.damagecalc.application.port.PokedexRepository;
import com.vgcenter.damagecalc.domain.mega.MegaForm;
import com.vgcenter.damagecalc.domain.model.Combatant;
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
        Sp sp = toDomain(command.sp());
        Stats baseStats = resolveBaseStats(species, command);
        Stats finalStats = buildCombatant(species, sp, nature, command).stats();
        return new BuildStatsResult(toStatsView(baseStats), toStatsView(finalStats));
    }

    private Combatant buildCombatant(PokemonSpecies species, Sp sp, Nature nature, BuildStatsCommand command) {
        if (!command.megaActive()) {
            return species.buildCombatant(VGC_LEVEL, sp, nature, false);
        }
        if (command.megaFormId() != null && !command.megaFormId().isBlank()) {
            return species.buildCombatant(VGC_LEVEL, sp, nature, command.megaFormId());
        }
        if (species.megaForms().size() > 1) {
            throw new IllegalArgumentException(
                    "Species '%s' requires megaFormId when Mega evolution is active".formatted(species.id()));
        }
        return species.buildCombatant(VGC_LEVEL, sp, nature, true);
    }

    private Stats resolveBaseStats(PokemonSpecies species, BuildStatsCommand command) {
        if (!command.megaActive()) {
            return species.baseStats();
        }
        if (command.megaFormId() != null && !command.megaFormId().isBlank()) {
            return resolveMegaForm(species, command.megaFormId()).baseStats();
        }
        if (species.megaForms().size() > 1) {
            throw new IllegalArgumentException(
                    "Species '%s' requires megaFormId when Mega evolution is active".formatted(species.id()));
        }
        MegaForm megaForm = species.megaForm()
                .orElseThrow(() -> new IllegalArgumentException(
                        "Species '%s' has no Mega form registered".formatted(species.id())));
        return megaForm.baseStats();
    }

    private MegaForm resolveMegaForm(PokemonSpecies species, String megaFormId) {
        return species.megaForms().stream()
                .filter(candidate -> candidate.id().equals(megaFormId))
                .findFirst()
                .orElseThrow(() -> new IllegalArgumentException(
                        "Species '%s' has no Mega form '%s' registered".formatted(species.id(), megaFormId)));
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
