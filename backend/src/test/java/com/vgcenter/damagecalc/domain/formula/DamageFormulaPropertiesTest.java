package com.vgcenter.damagecalc.domain.formula;

import static org.assertj.core.api.Assertions.assertThat;

import com.vgcenter.damagecalc.domain.model.Combatant;
import com.vgcenter.damagecalc.domain.model.Move;
import com.vgcenter.damagecalc.domain.model.MoveCategory;
import com.vgcenter.damagecalc.domain.model.Stats;
import com.vgcenter.damagecalc.domain.model.Type;
import java.util.List;
import net.jqwik.api.Arbitraries;
import net.jqwik.api.Arbitrary;
import net.jqwik.api.ForAll;
import net.jqwik.api.Property;
import net.jqwik.api.Provide;

class DamageFormulaPropertiesTest {

    private static final DamageFormula FORMULA = new DamageFormula();

    @Property
    void expectedDamageDropsWhenAccuracyDrops(
            @ForAll("nonResistantContexts") DamageContext context, @ForAll("accuraciesBelowOne") double accuracy) {
        int[] rolls = FORMULA.rolls(context);
        double atAccuracy = FORMULA.expectedDamage(rolls, accuracy);
        double perfectAccuracy = FORMULA.expectedDamage(rolls, 1.0d);

        assertThat(atAccuracy).isLessThanOrEqualTo(perfectAccuracy);
    }

    @Property
    void koProbWithCritAtLeastKoProbWithoutCrit(
            @ForAll("nonResistantContexts") DamageContext context, @ForAll("accuracies") double accuracy) {
        int[] normalRolls = FORMULA.rolls(context);
        int[] critRolls = FORMULA.rolls(new DamageContext(
                context.attacker(),
                context.defender(),
                context.move(),
                context.field(),
                context.attackerSide(),
                context.defenderSide(),
                true,
                context.targets()));
        int defenderHp = context.defender().stats().hp();

        double koProbNoCrit = FORMULA.koProbability(normalRolls, accuracy, defenderHp);
        double koProbWithCrit =
                FORMULA.koProbabilityWithCrit(normalRolls, critRolls, accuracy, 1.0d / 24.0d, defenderHp);

        assertThat(koProbWithCrit).isGreaterThanOrEqualTo(koProbNoCrit);
    }

    @Provide
    Arbitrary<DamageContext> nonResistantContexts() {
        Combatant fireSpecialAttacker = new Combatant(50, new Stats(141, 69, 73, 154, 99, 121), List.of(Type.FIRE));
        Combatant physicalAttacker = new Combatant(50, new Stats(154, 149, 77, 93, 76, 91), List.of(Type.NORMAL));
        Combatant grassDefender = new Combatant(50, new Stats(160, 69, 115, 76, 99, 68), List.of(Type.GRASS));
        Combatant waterDefender = new Combatant(50, new Stats(160, 69, 115, 76, 99, 68), List.of(Type.WATER));
        Move specialFire = new Move(Type.FIRE, MoveCategory.SPECIAL, 90, false);
        Move physicalNormal = new Move(Type.NORMAL, MoveCategory.PHYSICAL, 80, false);

        return Arbitraries.of(
                new DamageContext(
                        fireSpecialAttacker,
                        grassDefender,
                        specialFire,
                        Field.clear(),
                        SideConditions.none(),
                        SideConditions.none(),
                        false,
                        1),
                new DamageContext(
                        physicalAttacker,
                        waterDefender,
                        physicalNormal,
                        Field.clear(),
                        SideConditions.none(),
                        SideConditions.none(),
                        false,
                        1));
    }

    @Provide
    Arbitrary<Double> accuraciesBelowOne() {
        return Arbitraries.doubles().between(0.01d, 0.99d);
    }

    @Provide
    Arbitrary<Double> accuracies() {
        return Arbitraries.doubles().between(0.01d, 1.0d);
    }
}
