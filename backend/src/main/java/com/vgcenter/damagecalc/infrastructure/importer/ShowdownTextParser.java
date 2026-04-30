package com.vgcenter.damagecalc.infrastructure.importer;

import com.vgcenter.damagecalc.application.port.AbilityRepository;
import com.vgcenter.damagecalc.application.port.ItemRepository;
import com.vgcenter.damagecalc.application.port.MoveRepository;
import com.vgcenter.damagecalc.application.port.NatureRepository;
import com.vgcenter.damagecalc.application.port.PokedexRepository;
import com.vgcenter.damagecalc.application.port.TeamParser;
import com.vgcenter.damagecalc.application.usecase.ImportedPokemonView;
import com.vgcenter.damagecalc.application.usecase.NamedDatasetEntry;
import com.vgcenter.damagecalc.application.usecase.StatsView;
import com.vgcenter.damagecalc.domain.mega.MegaForm;
import com.vgcenter.damagecalc.domain.model.Nature;
import com.vgcenter.damagecalc.domain.model.PokemonSpecies;
import com.vgcenter.damagecalc.domain.model.Sp;
import com.vgcenter.damagecalc.domain.model.Stat;
import com.vgcenter.damagecalc.domain.model.Stats;
import java.text.Normalizer;
import java.util.ArrayList;
import java.util.EnumMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Objects;
import java.util.regex.Pattern;
import org.springframework.stereotype.Component;

@Component
public class ShowdownTextParser implements TeamParser {
    private static final Pattern DANGLING_METADATA_HEADER =
            Pattern.compile("^(Ability|Level|EVs|IVs|Tera Type|Shiny|Happiness|[A-Za-z]+ Nature|-\\s).*$");
    private static final Map<String, String> SPECIES_ALIAS = Map.ofEntries(
            Map.entry("aegislash", "aegislashshield"),
            Map.entry("mausholdfour", "maushold"),
            Map.entry("mausholdfamilyoffour", "maushold"));

    private final PokedexRepository pokedexRepository;
    private final MoveRepository moveRepository;
    private final AbilityRepository abilityRepository;
    private final ItemRepository itemRepository;
    private final NatureRepository natureRepository;

    public ShowdownTextParser(
            PokedexRepository pokedexRepository,
            MoveRepository moveRepository,
            AbilityRepository abilityRepository,
            ItemRepository itemRepository,
            NatureRepository natureRepository) {
        this.pokedexRepository = pokedexRepository;
        this.moveRepository = moveRepository;
        this.abilityRepository = abilityRepository;
        this.itemRepository = itemRepository;
        this.natureRepository = natureRepository;
    }

    @Override
    public List<ImportedPokemonView> parse(String regulationId, String text) {
        String showdownText = requireText(text, "Showdown text");
        Map<String, PokemonSpecies> speciesByKey = speciesLookup(regulationId);
        Map<String, String> moveIdsByKey = datasetLookup(moveRepository.findAllByRegulation(regulationId));
        Map<String, String> abilityIdsByKey = datasetLookup(abilityRepository.findAllByRegulation(regulationId));
        Map<String, String> itemIdsByKey = datasetLookup(itemRepository.findAllByRegulation(regulationId));
        List<ImportedPokemonView> importedTeam = new ArrayList<>();
        for (String block : mergeDanglingBlocks(showdownText.split("\\R\\s*\\R"))) {
            if (!block.isBlank()) {
                importedTeam.add(
                        parseBlock(regulationId, block, speciesByKey, moveIdsByKey, abilityIdsByKey, itemIdsByKey));
            }
        }
        return importedTeam;
    }

    private List<String> mergeDanglingBlocks(String[] rawBlocks) {
        List<String> mergedBlocks = new ArrayList<>();
        for (String rawBlock : rawBlocks) {
            if (rawBlock.isBlank()) {
                continue;
            }
            String trimmedBlock = rawBlock.trim();
            if (!mergedBlocks.isEmpty() && startsWithDanglingMetadata(trimmedBlock)) {
                int previousIndex = mergedBlocks.size() - 1;
                mergedBlocks.set(
                        previousIndex, mergedBlocks.get(previousIndex) + System.lineSeparator() + trimmedBlock);
                continue;
            }
            mergedBlocks.add(trimmedBlock);
        }
        return mergedBlocks;
    }

    private ImportedPokemonView parseBlock(
            String regulationId,
            String block,
            Map<String, PokemonSpecies> speciesByKey,
            Map<String, String> moveIdsByKey,
            Map<String, String> abilityIdsByKey,
            Map<String, String> itemIdsByKey) {
        ParsedSet parsedSet = parseRawSet(block);
        String resolvedSpeciesName =
                resolveGenderedSpeciesName(regulationId, parsedSet.speciesName(), parsedSet.gender());
        PokemonSpecies species = resolveSpecies(speciesByKey, resolvedSpeciesName);
        Nature nature = resolveNature(regulationId, parsedSet.natureName());
        String abilityId = resolveAbility(species, abilityIdsByKey, parsedSet.abilityName());
        String itemId = resolveDatasetId(itemIdsByKey, parsedSet.itemName(), "item", true);
        List<String> moveIds = parsedSet.moves().stream()
                .map(moveName -> resolveMove(species, moveIdsByKey, moveName))
                .toList();
        Sp sp = toSp(parsedSet.evs());
        Stats battleStats = species.baseStats().toBattleStats(sp, nature, parsedSet.level());
        return new ImportedPokemonView(
                species.id(),
                species.name(),
                parsedSet.nickname(),
                parsedSet.level(),
                parsedSet.gender(),
                abilityId,
                itemId,
                nature.name().toLowerCase(Locale.ROOT),
                new StatsView(sp.hp(), sp.attack(), sp.defense(), sp.specialAttack(), sp.specialDefense(), sp.speed()),
                toStatsView(battleStats),
                moveIds);
    }

    private ParsedSet parseRawSet(String block) {
        List<String> lines =
                block.lines().map(String::trim).filter(line -> !line.isBlank()).toList();
        if (lines.isEmpty()) {
            throw new IllegalArgumentException("Showdown set must not be empty");
        }

        Header header = parseHeader(lines.getFirst());
        Map<Stat, Integer> evs = defaultEffortValues();
        String abilityName = null;
        int level = 50;
        String natureName = null;
        List<String> moves = new ArrayList<>();

        for (int index = 1; index < lines.size(); index++) {
            String line = lines.get(index);
            if (line.startsWith("Ability: ")) {
                abilityName = line.substring("Ability: ".length()).trim();
            } else if (line.startsWith("Level: ")) {
                level = Integer.parseInt(line.substring("Level: ".length()).trim());
            } else if (line.startsWith("EVs: ")) {
                evs = parseEffortValues(line.substring("EVs: ".length()));
            } else if (line.endsWith(" Nature")) {
                natureName =
                        line.substring(0, line.length() - " Nature".length()).trim();
            } else if (line.startsWith("- ")) {
                moves.add(line.substring(2).trim());
            }
        }

        return new ParsedSet(
                header.nickname(),
                header.speciesName(),
                header.gender(),
                header.itemName(),
                abilityName,
                level,
                natureName,
                evs,
                List.copyOf(moves));
    }

    private Header parseHeader(String line) {
        String trimmedLine = requireText(line, "Showdown set header");
        if (startsWithDanglingMetadata(trimmedLine)) {
            throw new IllegalArgumentException("Invalid Showdown set header: " + trimmedLine);
        }
        String itemName = null;
        int itemSeparator = trimmedLine.lastIndexOf(" @ ");
        if (itemSeparator >= 0) {
            itemName = trimmedLine.substring(itemSeparator + 3).trim();
            trimmedLine = trimmedLine.substring(0, itemSeparator).trim();
        }

        String gender = null;
        if (trimmedLine.endsWith(" (M)") || trimmedLine.endsWith(" (F)")) {
            gender = trimmedLine.substring(trimmedLine.length() - 2, trimmedLine.length() - 1);
            trimmedLine = trimmedLine.substring(0, trimmedLine.length() - 4).trim();
        }

        String speciesName = trimmedLine;
        String nickname = null;
        int nicknameSeparator = trimmedLine.lastIndexOf(" (");
        if (nicknameSeparator >= 0 && trimmedLine.endsWith(")")) {
            nickname = trimmedLine.substring(0, nicknameSeparator).trim();
            speciesName = trimmedLine
                    .substring(nicknameSeparator + 2, trimmedLine.length() - 1)
                    .trim();
        }
        return new Header(blankToNull(nickname), speciesName, gender, blankToNull(itemName));
    }

    private boolean startsWithDanglingMetadata(String line) {
        String firstLine = line.lines()
                .map(String::trim)
                .filter(candidate -> !candidate.isBlank())
                .findFirst()
                .orElse("");
        return DANGLING_METADATA_HEADER.matcher(firstLine).matches();
    }

    private Map<Stat, Integer> parseEffortValues(String rawEffortValues) {
        Map<Stat, Integer> evs = defaultEffortValues();
        for (String entry : rawEffortValues.split("/")) {
            String[] pieces = entry.trim().split("\\s+", 2);
            if (pieces.length != 2) {
                throw new IllegalArgumentException("Invalid EV entry: " + entry.trim());
            }
            evs.put(toStat(pieces[1]), Integer.parseInt(pieces[0]));
        }
        return evs;
    }

    private Nature resolveNature(String regulationId, String natureName) {
        String resolvedNatureName = natureName == null ? "Serious" : natureName;
        return natureRepository
                .findById(regulationId, resolvedNatureName)
                .orElseThrow(() -> new IllegalArgumentException("Unknown nature: " + resolvedNatureName));
    }

    private String resolveAbility(PokemonSpecies species, Map<String, String> abilityIdsByKey, String abilityName) {
        if (abilityName == null || abilityName.isBlank()) {
            return species.abilityIds().getFirst();
        }
        String abilityId = resolveDatasetId(abilityIdsByKey, abilityName, "ability", false);
        if (!species.abilityIds().contains(abilityId)
                && !megaAbilityIds(species).contains(abilityId)) {
            throw new IllegalArgumentException("Ability '" + abilityName + "' is not legal for " + species.name());
        }
        return abilityId;
    }

    private String resolveMove(PokemonSpecies species, Map<String, String> moveIdsByKey, String moveName) {
        String moveId = resolveDatasetId(moveIdsByKey, moveName, "move", false);
        if (!species.moveIds().contains(moveId)) {
            throw new IllegalArgumentException("Move '" + moveName + "' is not legal for " + species.name());
        }
        return moveId;
    }

    private String resolveDatasetId(Map<String, String> idsByKey, String rawName, String label, boolean allowBlank) {
        if (rawName == null || rawName.isBlank()) {
            if (allowBlank) {
                return "none";
            }
            throw new IllegalArgumentException("Missing " + label + " value");
        }
        if ("none".equalsIgnoreCase(rawName) || "no item".equalsIgnoreCase(rawName)) {
            return "none";
        }
        String resolvedId = idsByKey.get(normalizeKey(rawName));
        if (resolvedId == null) {
            throw new IllegalArgumentException("Unknown " + label + ": " + rawName);
        }
        return resolvedId;
    }

    private PokemonSpecies resolveSpecies(Map<String, PokemonSpecies> speciesByKey, String rawSpeciesName) {
        String normalizedKey = normalizeKey(rawSpeciesName);
        String resolvedKey = SPECIES_ALIAS.getOrDefault(normalizedKey, normalizedKey);
        PokemonSpecies species = speciesByKey.get(resolvedKey);
        if (species == null) {
            throw new IllegalArgumentException("Unknown species: " + rawSpeciesName);
        }
        return species;
    }

    private String resolveGenderedSpeciesName(String regulationId, String rawSpeciesName, String gender) {
        String normalizedSpeciesKey = normalizeKey(rawSpeciesName);
        if ("M".equals(gender) || "F".equals(gender)) {
            String candidateId = normalizedSpeciesKey + ("M".equals(gender) ? "-male" : "-female");
            if (pokedexRepository.findById(regulationId, candidateId).isPresent()) {
                return candidateId;
            }
            return rawSpeciesName;
        }

        if (pokedexRepository.findById(regulationId, normalizedSpeciesKey).isPresent()) {
            return rawSpeciesName;
        }

        for (String suffix : List.of("-male", "-female")) {
            String candidateId = normalizedSpeciesKey + suffix;
            if (pokedexRepository.findById(regulationId, candidateId).isPresent()) {
                return candidateId;
            }
        }

        return rawSpeciesName;
    }

    private Map<String, PokemonSpecies> speciesLookup(String regulationId) {
        Map<String, PokemonSpecies> speciesByKey = new LinkedHashMap<>();
        for (PokemonSpecies species : pokedexRepository.findAllByRegulation(regulationId)) {
            registerSpeciesKey(speciesByKey, species.id(), species);
            registerSpeciesKey(speciesByKey, species.name(), species);
            for (MegaForm megaForm : species.megaForms()) {
                registerSpeciesKey(speciesByKey, megaForm.id(), species);
                registerSpeciesKey(speciesByKey, megaForm.name(), species);
            }
        }
        return speciesByKey;
    }

    private void registerSpeciesKey(Map<String, PokemonSpecies> speciesByKey, String rawKey, PokemonSpecies species) {
        speciesByKey.putIfAbsent(normalizeKey(rawKey), species);
    }

    private Map<String, String> datasetLookup(List<NamedDatasetEntry> entries) {
        Map<String, String> idsByKey = new LinkedHashMap<>();
        for (NamedDatasetEntry entry : entries) {
            idsByKey.putIfAbsent(normalizeKey(entry.id()), entry.id());
            idsByKey.putIfAbsent(normalizeKey(entry.name()), entry.id());
        }
        return idsByKey;
    }

    private List<String> megaAbilityIds(PokemonSpecies species) {
        return species.megaForms().stream().map(MegaForm::abilityId).toList();
    }

    private Map<Stat, Integer> defaultEffortValues() {
        Map<Stat, Integer> evs = new EnumMap<>(Stat.class);
        evs.put(Stat.HP, 0);
        evs.put(Stat.ATTACK, 0);
        evs.put(Stat.DEFENSE, 0);
        evs.put(Stat.SPECIAL_ATTACK, 0);
        evs.put(Stat.SPECIAL_DEFENSE, 0);
        evs.put(Stat.SPEED, 0);
        return evs;
    }

    private Sp toSp(Map<Stat, Integer> evs) {
        boolean usesLegacyEvScale =
                evs.values().stream().filter(Objects::nonNull).anyMatch(value -> value > 32);
        return new Sp(
                toSpValue(evs.get(Stat.HP), usesLegacyEvScale),
                toSpValue(evs.get(Stat.ATTACK), usesLegacyEvScale),
                toSpValue(evs.get(Stat.DEFENSE), usesLegacyEvScale),
                toSpValue(evs.get(Stat.SPECIAL_ATTACK), usesLegacyEvScale),
                toSpValue(evs.get(Stat.SPECIAL_DEFENSE), usesLegacyEvScale),
                toSpValue(evs.get(Stat.SPEED), usesLegacyEvScale));
    }

    private int toSpValue(Integer effortValue, boolean usesLegacyEvScale) {
        int normalizedValue = Objects.requireNonNullElse(effortValue, 0);
        if (!usesLegacyEvScale) {
            return Math.max(0, normalizedValue);
        }
        int converted = (int) Math.round(normalizedValue * 32.0d / 252.0d);
        return Math.max(0, Math.min(32, converted));
    }

    private Stat toStat(String rawStat) {
        return switch (normalizeKey(rawStat)) {
            case "hp" -> Stat.HP;
            case "atk", "attack" -> Stat.ATTACK;
            case "def", "defense" -> Stat.DEFENSE;
            case "spa", "specialattack", "spatk" -> Stat.SPECIAL_ATTACK;
            case "spd", "specialdefense", "spdef" -> Stat.SPECIAL_DEFENSE;
            case "spe", "speed" -> Stat.SPEED;
            default -> throw new IllegalArgumentException("Unsupported EV stat: " + rawStat);
        };
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

    private String normalizeKey(String value) {
        String normalized = Normalizer.normalize(requireText(value, "Lookup value"), Normalizer.Form.NFD)
                .replaceAll("\\p{M}+", "");
        StringBuilder builder = new StringBuilder(normalized.length());
        for (int index = 0; index < normalized.length(); index++) {
            char current = normalized.charAt(index);
            if (Character.isLetterOrDigit(current)) {
                builder.append(Character.toLowerCase(current));
            }
        }
        return builder.toString();
    }

    private static String requireText(String value, String label) {
        if (value == null || value.isBlank()) {
            throw new IllegalArgumentException(label + " must not be blank");
        }
        return value.trim();
    }

    private static String blankToNull(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }

    private record Header(String nickname, String speciesName, String gender, String itemName) {}

    private record ParsedSet(
            String nickname,
            String speciesName,
            String gender,
            String itemName,
            String abilityName,
            int level,
            String natureName,
            Map<Stat, Integer> evs,
            List<String> moves) {}
}
