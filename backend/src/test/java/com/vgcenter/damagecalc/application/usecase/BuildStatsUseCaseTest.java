package com.vgcenter.damagecalc.application.usecase;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.vgcenter.damagecalc.domain.mega.MegaForm;
import com.vgcenter.damagecalc.domain.model.Nature;
import com.vgcenter.damagecalc.domain.model.PokemonSpecies;
import com.vgcenter.damagecalc.domain.model.Stats;
import com.vgcenter.damagecalc.domain.model.Type;
import java.util.List;
import org.junit.jupiter.api.Test;

class BuildStatsUseCaseTest {

    @Test
    void buildsFinalStatsFromBaseSpeciesStatsAtLevelFifty() {
        BuildStatsUseCase useCase =
                new BuildStatsService(regulationId -> List.of(charizard()), regulationId -> List.of(Nature.MODEST));

        BuildStatsResult result = useCase.buildStats(
                new BuildStatsCommand("charizard", new SpCommand(12, 4, 0, 20, 0, 8), "modest", false));

        assertThat(result.baseStats()).isEqualTo(new StatsView(78, 84, 78, 109, 85, 100));
        assertThat(result.finalStats()).isEqualTo(new StatsView(144, 81, 83, 136, 90, 109));
    }

    @Test
    void usesMegaBaseStatsWhenMegaIsActive() {
        BuildStatsUseCase useCase =
                new BuildStatsService(regulationId -> List.of(charizard()), regulationId -> List.of(Nature.MODEST));

        BuildStatsResult result = useCase.buildStats(
                new BuildStatsCommand("charizard", new SpCommand(12, 4, 0, 20, 0, 8), "modest", true));

        assertThat(result.baseStats()).isEqualTo(new StatsView(78, 104, 78, 159, 115, 100));
        assertThat(result.finalStats()).isEqualTo(new StatsView(144, 99, 83, 191, 120, 109));
    }

    @Test
    void rejectsUnknownSpecies() {
        BuildStatsUseCase useCase =
                new BuildStatsService(regulationId -> List.of(charizard()), regulationId -> List.of());

        assertThatThrownBy(() -> useCase.buildStats(
                        new BuildStatsCommand("missingno", new SpCommand(0, 0, 0, 0, 0, 0), "modest", false)))
                .isInstanceOf(SpeciesNotFoundException.class)
                .hasMessage("Unknown species: missingno");
    }

    @Test
    void rejectsUnknownNature() {
        BuildStatsUseCase useCase =
                new BuildStatsService(regulationId -> List.of(charizard()), regulationId -> List.of(Nature.SERIOUS));

        assertThatThrownBy(() -> useCase.buildStats(
                        new BuildStatsCommand("charizard", new SpCommand(0, 0, 0, 0, 0, 0), "modest", false)))
                .isInstanceOf(NatureNotFoundException.class)
                .hasMessage("Unknown nature: modest");
    }

    private static PokemonSpecies charizard() {
        return new PokemonSpecies(
                "charizard",
                "Charizard",
                List.of(Type.FIRE, Type.FLYING),
                new Stats(78, 84, 78, 109, 85, 100),
                List.of("blaze"),
                List.of("heat-wave", "protect"),
                new MegaForm(
                        "charizard-mega-y",
                        "Charizard-Mega-Y",
                        List.of(Type.FIRE, Type.FLYING),
                        new Stats(78, 104, 78, 159, 115, 100),
                        "drought"));
    }
}
