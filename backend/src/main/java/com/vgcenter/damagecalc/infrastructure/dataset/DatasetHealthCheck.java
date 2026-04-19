package com.vgcenter.damagecalc.infrastructure.dataset;

import org.springframework.beans.factory.SmartInitializingSingleton;
import org.springframework.stereotype.Component;

@Component
public class DatasetHealthCheck implements SmartInitializingSingleton {

    private final DatasetValidator datasetValidator;
    private final DatasetProperties datasetProperties;

    public DatasetHealthCheck(DatasetValidator datasetValidator, DatasetProperties datasetProperties) {
        this.datasetValidator = datasetValidator;
        this.datasetProperties = datasetProperties;
    }

    @Override
    public void afterSingletonsInstantiated() {
        datasetProperties.getRegulations().forEach(datasetValidator::validateRegulation);
    }
}
