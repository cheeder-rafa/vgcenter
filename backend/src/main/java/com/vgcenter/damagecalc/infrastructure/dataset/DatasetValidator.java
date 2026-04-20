package com.vgcenter.damagecalc.infrastructure.dataset;

import com.fasterxml.jackson.databind.JsonNode;
import com.vgcenter.damagecalc.domain.model.Nature;
import com.vgcenter.damagecalc.domain.model.Stat;
import com.vgcenter.damagecalc.domain.model.Type;
import java.util.HashSet;
import java.util.Iterator;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import org.springframework.stereotype.Component;

@Component
public class DatasetValidator {

    private static final List<String> BASE_STAT_FIELDS =
            List.of("hp", "attack", "defense", "specialAttack", "specialDefense", "speed");

    private final DatasetDocumentLoader datasetDocumentLoader;

    public DatasetValidator(DatasetDocumentLoader datasetDocumentLoader) {
        this.datasetDocumentLoader = datasetDocumentLoader;
    }

    public void validateRegulation(String regulation) {
        JsonNode pokedex = datasetDocumentLoader.loadDataTree(regulation, "pokedex.json");
        JsonNode abilities = datasetDocumentLoader.loadDataTree(regulation, "abilities.json");
        JsonNode moves = datasetDocumentLoader.loadDataTree(regulation, "moves.json");
        JsonNode items = datasetDocumentLoader.loadDataTree(regulation, "items.json");
        JsonNode natures = datasetDocumentLoader.loadDataTree(regulation, "natures.json");
        JsonNode megaEvolutions = datasetDocumentLoader.loadDataTree(regulation, "mega-evolutions.json");

        datasetDocumentLoader.loadSchemaTree("pokedex.schema.json");
        datasetDocumentLoader.loadSchemaTree("named-reference.schema.json");
        datasetDocumentLoader.loadSchemaTree("natures.schema.json");
        datasetDocumentLoader.loadSchemaTree("mega-evolutions.schema.json");

        validatePokedexSchema(pokedex);
        validateNamedReferenceSchema(abilities, "abilities.json");
        validateNamedReferenceSchema(moves, "moves.json");
        validateNamedReferenceSchema(items, "items.json");
        validateNaturesSchema(natures);
        validateMegaEvolutionsSchema(megaEvolutions);
        validateCrossReferences(regulation);
    }

    private void validatePokedexSchema(JsonNode pokedex) {
        if (!pokedex.isArray()) {
            throw schemaFailure("pokedex.json", "$", "must be an array");
        }

        for (int index = 0; index < pokedex.size(); index++) {
            JsonNode species = pokedex.get(index);
            String path = "$[" + index + "]";

            requireObject(species, "pokedex.json", path);
            requireText(species, "id", "pokedex.json", path);
            requireText(species, "name", "pokedex.json", path);
            validateTypes(species.get("types"), "pokedex.json", path + ".types");
            validateBaseStats(species.get("baseStats"), "pokedex.json", path + ".baseStats");
            validateTextArray(species.get("abilities"), "pokedex.json", path + ".abilities");
            validateTextArray(species.get("moves"), "pokedex.json", path + ".moves");
        }
    }

    private void validateNamedReferenceSchema(JsonNode root, String filename) {
        if (!root.isArray()) {
            throw schemaFailure(filename, "$", "must be an array");
        }

        for (int index = 0; index < root.size(); index++) {
            JsonNode entry = root.get(index);
            String path = "$[" + index + "]";

            requireObject(entry, filename, path);
            requireText(entry, "id", filename, path);
            requireText(entry, "name", filename, path);
        }
    }

    private void validateNaturesSchema(JsonNode natures) {
        if (!natures.isArray()) {
            throw schemaFailure("natures.json", "$", "must be an array");
        }

        Set<String> seenIds = new HashSet<>();
        for (int index = 0; index < natures.size(); index++) {
            JsonNode entry = natures.get(index);
            String path = "$[" + index + "]";

            requireObject(entry, "natures.json", path);
            requireText(entry, "id", "natures.json", path);
            requireText(entry, "name", "natures.json", path);
            String id = entry.get("id").asText();
            if (!seenIds.add(id)) {
                throw schemaFailure("natures.json", path + ".id", "is duplicated ('" + id + "')");
            }

            try {
                Nature.valueOf(id.toUpperCase(Locale.ROOT));
            } catch (IllegalArgumentException exception) {
                throw schemaFailure("natures.json", path + ".id", "is not a known nature ('" + id + "')");
            }

            validateOptionalStatField(entry.get("increasedStat"), "natures.json", path + ".increasedStat");
            validateOptionalStatField(entry.get("decreasedStat"), "natures.json", path + ".decreasedStat");
        }

        if (seenIds.size() != Nature.values().length) {
            throw schemaFailure(
                    "natures.json",
                    "$",
                    "must contain all " + Nature.values().length + " natures but has " + seenIds.size());
        }
    }

    private void validateMegaEvolutionsSchema(JsonNode megaEvolutions) {
        if (!megaEvolutions.isArray()) {
            throw schemaFailure("mega-evolutions.json", "$", "must be an array");
        }

        Set<String> seenIds = new HashSet<>();
        for (int index = 0; index < megaEvolutions.size(); index++) {
            JsonNode entry = megaEvolutions.get(index);
            String path = "$[" + index + "]";

            requireObject(entry, "mega-evolutions.json", path);
            requireText(entry, "speciesId", "mega-evolutions.json", path);
            requireText(entry, "id", "mega-evolutions.json", path);
            requireText(entry, "name", "mega-evolutions.json", path);
            validateTypes(entry.get("types"), "mega-evolutions.json", path + ".types");
            validateBaseStats(entry.get("baseStats"), "mega-evolutions.json", path + ".baseStats");
            requireText(entry, "ability", "mega-evolutions.json", path);

            String id = entry.get("id").asText();
            if (!seenIds.add(id)) {
                throw schemaFailure("mega-evolutions.json", path + ".id", "is duplicated ('" + id + "')");
            }
        }
    }

    private void validateOptionalStatField(JsonNode node, String filename, String path) {
        if (node == null || node.isNull()) {
            return;
        }
        if (!node.isTextual() || node.asText().isBlank()) {
            throw schemaFailure(filename, path, "must be a non-blank string or null");
        }
        try {
            Stat.valueOf(node.asText());
        } catch (IllegalArgumentException exception) {
            throw schemaFailure(filename, path, "is not a known stat ('" + node.asText() + "')");
        }
    }

    private void validateCrossReferences(String regulation) {
        Set<String> abilityIds = datasetDocumentLoader.loadNamedReferenceIds(regulation, "abilities.json");
        Set<String> moveIds = datasetDocumentLoader.loadNamedReferenceIds(regulation, "moves.json");

        Set<String> speciesIds = new HashSet<>();
        for (PokedexEntryDocument species : datasetDocumentLoader.loadPokedex(regulation)) {
            speciesIds.add(species.id());
            validateReferences(species.id(), species.abilities(), abilityIds, "ability");
            validateReferences(species.id(), species.moves(), moveIds, "move");
        }

        for (MegaEvolutionDocument mega : datasetDocumentLoader.loadMegaEvolutions(regulation)) {
            if (!speciesIds.contains(mega.speciesId())) {
                throw new IllegalStateException(
                        "Unknown species '" + mega.speciesId() + "' referenced by mega evolution '" + mega.id() + "'");
            }
            if (!abilityIds.contains(mega.ability())) {
                throw new IllegalStateException(
                        "Unknown ability '" + mega.ability() + "' referenced by mega evolution '" + mega.id() + "'");
            }
        }
    }

    private void validateTypes(JsonNode typesNode, String filename, String path) {
        validateTextArray(typesNode, filename, path);
        if (typesNode.size() > 2) {
            throw schemaFailure(filename, path, "must contain no more than 2 values");
        }

        Iterator<JsonNode> iterator = typesNode.elements();
        while (iterator.hasNext()) {
            String typeName = iterator.next().asText();
            try {
                Type.valueOf(typeName);
            } catch (IllegalArgumentException exception) {
                throw schemaFailure(filename, path, "contains unknown type '" + typeName + "'");
            }
        }
    }

    private void validateBaseStats(JsonNode baseStatsNode, String filename, String path) {
        requireObject(baseStatsNode, filename, path);
        for (String field : BASE_STAT_FIELDS) {
            JsonNode valueNode = baseStatsNode.get(field);
            if (valueNode == null) {
                throw schemaFailure(filename, path, "missing required property '" + field + "'");
            }
            if (!valueNode.canConvertToInt() || valueNode.asInt() <= 0) {
                throw schemaFailure(filename, path + "." + field, "must be a positive integer");
            }
        }
    }

    private void validateTextArray(JsonNode arrayNode, String filename, String path) {
        if (arrayNode == null) {
            throw schemaFailure(filename, path, "is required");
        }
        if (!arrayNode.isArray() || arrayNode.isEmpty()) {
            throw schemaFailure(filename, path, "must be a non-empty array");
        }

        for (int index = 0; index < arrayNode.size(); index++) {
            JsonNode element = arrayNode.get(index);
            if (!element.isTextual() || element.asText().isBlank()) {
                throw schemaFailure(filename, path + "[" + index + "]", "must be a non-blank string");
            }
        }
    }

    private void requireText(JsonNode node, String fieldName, String filename, String path) {
        JsonNode field = node.get(fieldName);
        if (field == null) {
            throw schemaFailure(filename, path, "missing required property '" + fieldName + "'");
        }
        if (!field.isTextual() || field.asText().isBlank()) {
            throw schemaFailure(filename, path + "." + fieldName, "must be a non-blank string");
        }
    }

    private void requireObject(JsonNode node, String filename, String path) {
        if (node == null) {
            throw schemaFailure(filename, path, "is required");
        }
        if (!node.isObject()) {
            throw schemaFailure(filename, path, "must be an object");
        }
    }

    private void validateReferences(String speciesId, List<String> referencedIds, Set<String> knownIds, String label) {
        for (String referencedId : referencedIds) {
            if (!knownIds.contains(referencedId)) {
                throw new IllegalStateException(
                        "Unknown " + label + " '" + referencedId + "' referenced by species '" + speciesId + "'");
            }
        }
    }

    private IllegalStateException schemaFailure(String filename, String path, String message) {
        return new IllegalStateException("Schema validation failed for " + filename + " at " + path + ": " + message);
    }
}
