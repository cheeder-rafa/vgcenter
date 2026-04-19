package com.vgcenter.damagecalc.domain.formula;

interface Modifier {

    boolean applies(DamageContext context);

    long apply(long damage, DamageContext context);
}
