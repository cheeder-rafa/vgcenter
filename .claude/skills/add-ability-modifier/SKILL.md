---
name: add-ability-modifier
description: Use when adding a new ability's effect on damage — creates the domain Modifier class, registers it in the modifier chain, and writes golden tests. Only applies to abilities that alter damage; skip for abilities with no damage effect (e.g., field-state abilities handled elsewhere).
---

# Add an ability modifier (TDD)

Follow these steps exactly when adding a new ability that alters damage (Huge Power, Tinted Lens, Sniper, Solid Rock, etc.).

## 1. Write the failing test

Create or extend `backend/src/test/java/com/vgcenter/damagecalc/domain/formula/abilities/<AbilityName>ModifierTest.java`.

- Include at least 2 golden scenarios from Showdown's calc (adjusted for SP).
- Cover on-state and off-state (ability active vs. inactive).
- Cover any edge case unique to this ability (e.g., type immunity flips, stage clamping).

Run `./mvnw test -Dtest=<AbilityName>ModifierTest` and confirm it fails for the right reason (not a compile error).

## 2. Implement the modifier

Create `backend/src/main/java/com/vgcenter/damagecalc/domain/formula/abilities/<AbilityName>Modifier.java` implementing `Modifier`.

- Pure function — no Spring, no static state.
- Its `apply(long damage, DamageContext ctx)` returns the new damage value.
- If the ability has no effect in the current context, return `damage` unchanged.

## 3. Register it in the modifier chain

Open `backend/src/main/java/com/vgcenter/damagecalc/domain/formula/ModifierChainFactory.java` (or equivalent registry) and add a mapping from `AbilityId.<NAME>` to the new class at the correct position in the modifier order. Refer to `PLAN.md` → "Damage Formula Reference" for the canonical order.

## 4. Run the tests

```bash
cd backend
./mvnw test -Dtest=<AbilityName>ModifierTest
```

Iterate until green. Then:

```bash
./mvnw verify
```

All tests, Spotless, Checkstyle, ArchUnit, and JaCoCo (≥ 85% on domain) must pass.

## 5. Commit

```bash
./mvnw spotless:apply
git add backend/src/main/java/com/vgcenter/damagecalc/domain/formula/abilities/<AbilityName>Modifier.java \
        backend/src/test/java/com/vgcenter/damagecalc/domain/formula/abilities/<AbilityName>ModifierTest.java \
        backend/src/main/java/com/vgcenter/damagecalc/domain/formula/ModifierChainFactory.java
git commit -m "Add <AbilityName> damage modifier"
```

## Common pitfalls

- **Wrong modifier order:** placing an ability modifier before or after the wrong step changes the output. Re-read the dissertation ordering in `PLAN.md`.
- **Leaking infrastructure:** abilities live in `domain` — do not import Spring or Jackson.
- **Forgetting golden tests:** if a newly-added ability has no golden-set coverage, future refactors can silently break it.
