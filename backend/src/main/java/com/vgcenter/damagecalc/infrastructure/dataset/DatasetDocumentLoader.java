package com.vgcenter.damagecalc.infrastructure.dataset;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.io.IOException;
import java.io.InputStream;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import org.springframework.core.io.Resource;
import org.springframework.core.io.ResourceLoader;
import org.springframework.stereotype.Component;

@Component
public class DatasetDocumentLoader {

    private final ObjectMapper objectMapper;
    private final ResourceLoader resourceLoader;
    private final DatasetProperties datasetProperties;

    public DatasetDocumentLoader(
            ObjectMapper objectMapper, ResourceLoader resourceLoader, DatasetProperties datasetProperties) {
        this.objectMapper = objectMapper;
        this.resourceLoader = resourceLoader;
        this.datasetProperties = datasetProperties;
    }

    public JsonNode loadDataTree(String regulation, String filename) {
        return readTree(resolveDataLocation(regulation, filename));
    }

    public JsonNode loadSchemaTree(String filename) {
        return readTree(datasetProperties.getSchemaRoot() + "/" + filename);
    }

    public List<PokedexEntryDocument> loadPokedex(String regulation) {
        JsonNode pokedexNode = loadDataTree(regulation, "pokedex.json");
        return readValue(
                pokedexNode,
                objectMapper.getTypeFactory().constructCollectionType(List.class, PokedexEntryDocument.class));
    }

    public List<NatureEntryDocument> loadNatures(String regulation) {
        JsonNode naturesNode = loadDataTree(regulation, "natures.json");
        return readValue(
                naturesNode,
                objectMapper.getTypeFactory().constructCollectionType(List.class, NatureEntryDocument.class));
    }

    public List<MegaEvolutionDocument> loadMegaEvolutions(String regulation) {
        JsonNode megaNode = loadDataTree(regulation, "mega-evolutions.json");
        return readValue(
                megaNode,
                objectMapper.getTypeFactory().constructCollectionType(List.class, MegaEvolutionDocument.class));
    }

    public Set<String> loadNamedReferenceIds(String regulation, String filename) {
        return loadNamedReferences(regulation, filename).stream()
                .map(NamedReferenceDocument::id)
                .collect(java.util.stream.Collectors.toUnmodifiableSet());
    }

    public List<NamedReferenceDocument> loadNamedReferences(String regulation, String filename) {
        JsonNode referenceNode = loadDataTree(regulation, filename);
        return readValue(
                referenceNode,
                objectMapper.getTypeFactory().constructCollectionType(List.class, NamedReferenceDocument.class));
    }

    private <T> T readValue(JsonNode node, com.fasterxml.jackson.databind.JavaType type) {
        try {
            return objectMapper.readerFor(type).readValue(node);
        } catch (IOException exception) {
            throw new IllegalStateException("Failed to deserialize dataset resource", exception);
        }
    }

    private JsonNode readTree(String location) {
        Resource resource = resourceLoader.getResource(location);
        if (!resource.exists()) {
            throw new IllegalStateException("Missing dataset resource: " + location);
        }

        try (InputStream inputStream = resource.getInputStream()) {
            return objectMapper.readTree(inputStream);
        } catch (IOException exception) {
            throw new IllegalStateException("Failed to read dataset resource: " + location, exception);
        }
    }

    private String resolveDataLocation(String regulation, String filename) {
        String normalizedRegulation = regulation.toLowerCase(Locale.ROOT).replaceAll("[^a-z0-9]+", "-");
        return datasetProperties.getRoot() + "/regulation-" + normalizedRegulation + "/" + filename;
    }
}
