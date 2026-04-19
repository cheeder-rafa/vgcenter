package com.vgcenter.damagecalc.infrastructure.dataset;

import java.util.List;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

@Component
@ConfigurationProperties(prefix = "vgcenter.dataset")
public class DatasetProperties {

    private String root = "classpath:data";
    private String schemaRoot = "classpath:data/schema";
    private List<String> regulations = List.of("M-A");

    public String getRoot() {
        return root;
    }

    public void setRoot(String root) {
        this.root = root;
    }

    public String getSchemaRoot() {
        return schemaRoot;
    }

    public void setSchemaRoot(String schemaRoot) {
        this.schemaRoot = schemaRoot;
    }

    public List<String> getRegulations() {
        return regulations;
    }

    public void setRegulations(List<String> regulations) {
        this.regulations = List.copyOf(regulations);
    }
}
