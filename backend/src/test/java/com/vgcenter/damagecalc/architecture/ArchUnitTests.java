package com.vgcenter.damagecalc.architecture;

import static com.tngtech.archunit.lang.syntax.ArchRuleDefinition.noClasses;

import com.tngtech.archunit.core.importer.ImportOption;
import com.tngtech.archunit.junit.AnalyzeClasses;
import com.tngtech.archunit.junit.ArchTest;
import com.tngtech.archunit.lang.ArchRule;
import com.tngtech.archunit.library.Architectures;

@AnalyzeClasses(packages = "com.vgcenter.damagecalc", importOptions = ImportOption.DoNotIncludeTests.class)
class ArchUnitTests {

    @ArchTest
    static final ArchRule cleanArchitectureLayers = Architectures.layeredArchitecture()
            .consideringAllDependencies()
            .withOptionalLayers(true)
            .layer("Domain")
            .definedBy("com.vgcenter.damagecalc.domain..")
            .layer("Application")
            .definedBy("com.vgcenter.damagecalc.application..")
            .layer("Infrastructure")
            .definedBy("com.vgcenter.damagecalc.infrastructure..")
            .layer("Web")
            .definedBy("com.vgcenter.damagecalc.web..")
            .whereLayer("Domain")
            .mayOnlyBeAccessedByLayers("Application", "Infrastructure", "Web")
            .whereLayer("Application")
            .mayOnlyBeAccessedByLayers("Infrastructure", "Web")
            .whereLayer("Infrastructure")
            .mayOnlyBeAccessedByLayers("Web")
            .whereLayer("Web")
            .mayNotBeAccessedByAnyLayer();

    @ArchTest
    static final ArchRule domainStaysFrameworkFree = noClasses()
            .that()
            .resideInAPackage("com.vgcenter.damagecalc.domain..")
            .should()
            .dependOnClassesThat()
            .resideInAnyPackage("org.springframework..", "com.fasterxml.jackson..", "java.net.http..")
            .allowEmptyShould(true);

    @ArchTest
    static final ArchRule domainGameplanStaysFrameworkFree = noClasses()
            .that()
            .resideInAPackage("com.vgcenter.damagecalc.domain.gameplan..")
            .should()
            .dependOnClassesThat()
            .resideInAnyPackage("org.springframework..", "com.fasterxml.jackson..", "java.net.http..");
}
