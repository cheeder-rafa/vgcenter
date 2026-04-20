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
        // Champions formula, Charizard + MODEST (+SpA, -Atk), SP 12/4/0/20/0/8:
        // HP  = 78 + 12 + 75                         = 165
        // Atk = floor(0.9 × ( 84 +  4 + 20)) = ⌊97.2⌋=  97
        // Def =              78 +  0 + 20           =  98
        // SpA = floor(1.1 × (109 + 20 + 20)) = ⌊163.9⌋=163
        // SpD =              85 +  0 + 20           = 105
        // Spe =             100 +  8 + 20           = 128
        assertThat(result.finalStats()).isEqualTo(new StatsView(165, 97, 98, 163, 105, 128));
    }

    @Test
    void usesMegaBaseStatsWhenMegaIsActive() {
        BuildStatsUseCase useCase =
                new BuildStatsService(regulationId -> List.of(charizard()), regulationId -> List.of(Nature.MODEST));

        BuildStatsResult result = useCase.buildStats(
                new BuildStatsCommand("charizard", new SpCommand(12, 4, 0, 20, 0, 8), "modest", true));

        assertThat(result.baseStats()).isEqualTo(new StatsView(78, 104, 78, 159, 115, 100));
        // Mega-Y base (78,104,78,159,115,100) + MODEST + same SP:
        // HP  = 78 + 12 + 75                         = 165
        // Atk = floor(0.9 × (104 +  4 + 20)) = ⌊115.2⌋=115
        // Def =              78 +  0 + 20           =  98
        // SpA = floor(1.1 × (159 + 20 + 20)) = ⌊218.9⌋=218
        // SpD =             115 +  0 + 20           = 135
        // Spe =             100 +  8 + 20           = 128
        assertThat(result.finalStats()).isEqualTo(new StatsView(165, 115, 98, 218, 135, 128));
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
