# Implementation Plan: Calculator Improvements Pass 3

## Context

This pass addresses a collection of UX fixes, data accuracy issues, labelling renames, and two new features (stat stage modifiers and Protect mechanic) identified after the Improvements Pass 2 merge.

---

## Issues & Solutions

### 1. SP import mapping wrong (EV→SP conversion)

**Problem:** `ShowdownTextParser.java:341-345` converts EVs with `Math.round(ev * 32 / 252)`. For Tyranitar `EVs: 31 HP / 16 Atk / 1 Def / 1 SpD / 17 Spe`, this yields 4/2/0/0/0/2 — already **correct**. However the user says they see 4/2/0/0/0/2 when they expect 31/16/1/0/1/17 verbatim. The implication is the user's paste uses SP values (0–32) directly written in the EV field.

**Root cause diagnosis:** The paste uses Showdown EV notation, but the values happen to look like raw SPs. The 31→4, 16→2, 17→2 conversion is mathematically correct. The *display* issue is in the `StatTable` — when the imported Pokémon is loaded, `finalStats` from the import API response (fully calculated battle stats) is used directly, but `sp` might not be reflected in the editable SP cells.

**Fix:** Trace `importedTeamMapping.ts:17-23` — the `sp` mapping reads `pokemon.sp.attack` etc. which comes from the `StatsResponseDto sp` field in `ImportedPokemonDto`. The backend correctly returns SP as converted values (e.g. 4 from 31 EVs). The correct behaviour is to show those SP values in the SP column. The likely UI issue is a **padding mismatch** in the `StatTable` SP input cells that clips the visual or a Tailwind `p-*` mismatch. Fix `StatTable.tsx` input cell padding to ensure SP values render correctly.

**Files:** `frontend/src/features/calculator/components/StatTable.tsx`

---

### 2. Mega Charizard Y shows Mega Charizard Z icon

**Problem:** `spriteBadgeSources.ts:18-19` builds paths as `${spriteId}-mega.png`. When `megaFormId` is `charizard-mega-y`, the `spriteId` is still `charizard` (the base species ID) and so it falls back to `/sprites/charizard-mega.png` (which is Mega X icon).

**Fix:** When `megaActive` is true and a specific `megaFormId` is set, use the `megaFormId` as the sprite path. Add an override path: `['/sprites/${megaFormId}.png', '/sprites/${spriteId}-mega.png', ...]`.

The sprites `charizard-mega-x.png` and `charizard-mega-y.png` already exist in `frontend/public/sprites/`.

**Files:**
- `frontend/src/features/calculator/components/spriteBadgeSources.ts`
- `frontend/src/features/calculator/components/SpriteBadge.tsx` (pass `megaFormId` prop)
- `frontend/src/features/calculator/components/PokemonPanel.tsx` (pass `megaFormId` to SpriteBadge)

---

### 3. Import team — only first Pokémon loads

**Problem:** `CalculatorPage.tsx:127-142` calls `handleImportTeam`. The `[activePokemon, ...savedPokemon]` destructure is correct. The `importSavedTeam` call in `useSavedTeamStore` is the suspect. Verify `useSavedTeamStore.importTeam` actually stores the 5 remaining Pokémon and that the `SavedPokemonRail` renders them.

**Fix:** Inspect `useSavedTeamStore.ts` `importTeam` action — if it limits the rail size or fails silently, patch it to accept all 5. Also verify `toSavedPokemon` sets `spriteId` correctly for rail display.

**Files:**
- `frontend/src/features/calculator/store/useSavedTeamStore.ts`
- `frontend/src/features/importer/importedTeamMapping.ts`

---

### 4. Remove Sleep and Freeze; rename Toxic → Poison with damage tick note

**Frontend:** In `shared.ts:23-31` remove `SLEEP` and `FREEZE` from `STATUS_OPTIONS`. Rename `BADLY_POISONED` → `Toxic` label back to just `Poison` with note, or better: keep `POISON` as "Poison / Toxic" and remove `BADLY_POISONED`, or keep both with the fix below. Per the spec: remove Toxic, add a "damage tick" note to Poison. Remove `SLEEP` and `FREEZE` entirely.

**Exact change:**
```ts
export const STATUS_OPTIONS = [
  { value: 'NONE', label: 'Healthy' },
  { value: 'BURN', label: 'Burn' },
  { value: 'POISON', label: 'Poison (−1/8 HP/turn)' },
  { value: 'PARALYSIS', label: 'Paralysis' },
] as const
```
Remove `BADLY_POISONED`, `SLEEP`, `FREEZE`.

**Backend:** `StatusCondition.java` only has `NONE, BURN, PARALYSIS` — already no Freeze/Sleep/Toxic. No backend change needed. The frontend was sending `BADLY_POISONED` and `SLEEP`/`FREEZE` which the backend silently treated as `NONE` (via `fromId` fallback). The Poison tick damage is informational only (doesn't affect the damage calc directly) — the label note is sufficient.

**Files:** `frontend/src/features/calculator/components/shared.ts`

---

### 5. Move type chip text overflow (e.g. "FIGHTING")

**Problem:** `MoveSlotRow.tsx:105` uses `min-w-[7.5ch]` on the type chip span. "FIGHTING" is 8 characters, overflowing 7.5ch. The chip has `whitespace-nowrap` which prevents wrapping but doesn't clip.

**Fix:** Change `min-w-[7.5ch]` to `w-[7ch] text-[0.55rem]` or reduce font size for the type chip in move slots. Alternatively use `text-[0.52rem] tracking-tight` and let the chip size be `w-fit min-w-[6ch]`. Best fix: use a smaller `tracking` and cap with `max-w-[9ch] text-[0.58rem] tracking-tight overflow-hidden`.

Actually the cleanest fix: in `MoveSlotRow.tsx` change the grid column for type from `7.5ch` to `8ch` and add `text-[0.58rem]`.

**Files:** `frontend/src/features/calculator/components/MoveSlotRow.tsx`

---

### 6. Layout misalignment when one side has Mega Evolution and other doesn't

**Problem:** When the mega section renders on one `PokemonPanel` (species has mega forms) but not the other, the panels have different heights causing the move slots on each side to be at different vertical positions.

**Fix:** The cleanest solution without complex layout coordination: give the mega section a `min-h` so both panels always reserve the same space. Add a hidden `min-h-[56px]` placeholder div inside `PokemonPanel` even when `speciesEntry?.megaForms.length` is 0, or simply always render the mega section div but conditionally show/hide its content with `opacity-0 pointer-events-none`.

**Files:** `frontend/src/features/calculator/components/PokemonPanel.tsx`

---

### 7. FieldPanel label cleanups

Changes in `FieldPanel.tsx`:
- Header: `"Arena State · Live"` → `"Field"` (remove "Live" and "Arena State")
- The pulsing dot stays, the section heading `<h2>Field</h2>` stays
- "Defender Side" label stays as-is; "Attacker Side" label stays
- The `BATTLE` chip stays

Actually per spec: replace **"Arena State"** text with **"Field"**, and the other "Field" text (the `<h2>`) with **"Modifiers"**. Remove **"Live"** from the header label.

Result:
- Header label: `"Field"` (was "Arena State · Live")
- `<h2>` text: `"Modifiers"` (was "Field")

**Files:** `frontend/src/features/calculator/components/FieldPanel.tsx`

---

### 8. Side label renames in PokemonPanel + DetailedResult

Changes:
- `PokemonPanel.tsx:205` "Side A · Offense" → "Side A — Attacker" (or just "Attacker")
- `PokemonPanel.tsx:205` "Side B · Counter" → "Side B — Defender" (or just "Defender")  
- `PokemonPanel.tsx:208-209` STRIKE chip → ATTACKER; SHIELD chip → DEFENDER
- `DetailedResult.tsx:107` "OFFENSE" chip → "ATTACKER"; "COUNTER" chip → "DEFENDER"

**Files:**
- `frontend/src/features/calculator/components/PokemonPanel.tsx`
- `frontend/src/features/calculator/components/DetailedResult.tsx`

---

### 9. Attacker/defender roles alternate by focused move side + color swap

**Current:** Attacker panel is always plasma (pink), Defender panel is always cyan. Labels are fixed.

**New behaviour:**
- `focusedSide === 'attacker'` → Side A gets plasma + ATTACKER label, Side B gets cyan + DEFENDER label (current default)
- `focusedSide === 'defender'` → Side B gets plasma + ATTACKER label, Side A gets cyan + DEFENDER label (colors and labels swap)

The `FieldPanel` sections also need to swap their header labels ("Attacker Side" / "Defender Side") based on `focusedSide`. Pass `focusedSide` to `FieldPanel`, and in the store ensure `attackerSide` / `defenderSide` already swap correctly via `selectDamageRequestFor` (they do — `useCalculatorStore.ts:349-350`).

**Implementation:**
- `CalculatorPage.tsx`: pass `focusedSide` to `FieldPanel`
- `FieldPanel.tsx`: accept `focusedSide` prop; swap the section labels
- `PokemonPanel.tsx`: derive `isAttacking = (side === focusedSide)` from props; use `isAttacking` to assign plasma vs cyan accent and ATTACKER vs DEFENDER chip

**Files:**
- `frontend/src/pages/CalculatorPage.tsx`
- `frontend/src/features/calculator/components/PokemonPanel.tsx`
- `frontend/src/features/calculator/components/FieldPanel.tsx`
- `frontend/src/features/calculator/components/DetailedResult.tsx`

---

### 10. Copy damage report — exclude rolls; restore toast; fix chip overlap

**Changes in `DetailedResult.tsx` + `formatReadoutText.ts`:**
1. The `copyText` should only include the summary line (not rolls). Change `formatReadoutText` to return just the summary, or extract a `formatSummaryText` function used for copy.
2. After `copyDamageReport(copyText)` succeeds, call `useToastStore.getState().push("Copied to clipboard")`.
3. The OFFENSE/COUNTER + LIVE chips overlap the copy indicator visually. The "LIVE" chip should be removed (per spec: remove "live" after arena state text, and this includes the LIVE chip in DetailedResult). Keep only the ATTACKER/DEFENDER chip (after rename from OFFENSE/COUNTER).

**Files:**
- `frontend/src/features/calculator/components/DetailedResult.tsx`
- `frontend/src/features/calculator/components/formatReadoutText.ts`
- `frontend/src/features/calculator/store/useToastStore.ts` (verify `push` API)

---

### 11. Stat stage modifiers (frontend + backend)

#### Frontend
Add a stage row to `StatTable.tsx` for each stat (Atk, Def, SpA, SpD, Spe — not HP). Stage range: −6 to +6. Display as +/- buttons or a compact select.

Store stages in `CombatantBuild` as a new `stages` field (partial `Record<Stat, number>`, defaulting to 0).

Add to `useCalculatorStore`:
```ts
stages: { atk: 0, def: 0, spa: 0, spd: 0, spe: 0, spe: 0 }
```

Include `stages` in the `DamageCalculationRequest` combatant object.

#### Backend
Add `stages` map to `CombatantRequest` DTO. In `CalculateDamageService`, after building `Stats`, apply stage multipliers before constructing `Combatant`.

Stage multiplier table (Gen 5+):
- −6 = 2/8, −5 = 2/7, −4 = 2/6, −3 = 2/5, −2 = 2/4, −1 = 2/3
- 0 = 1, +1 = 3/2, +2 = 4/2, +3 = 5/2, +4 = 6/2, +5 = 7/2, +6 = 8/2

Add `applyStage(int baseStat, int stage)` helper in `Stats.java` or a new `StatStages` value class.

**Key files:**
- `frontend/src/features/calculator/components/StatTable.tsx`
- `frontend/src/features/calculator/store/useCalculatorStore.ts`
- `frontend/src/features/calculator/types/api.ts`
- `backend/.../web/dto/CombatantRequestDto.java`
- `backend/.../application/usecase/CalculateDamageService.java`
- `backend/.../domain/model/Stats.java` (add `applyStage` helper)

---

### 12. Protect modifier + Unseen Fist / Piercing Drill abilities

#### Protect UI (frontend)
Add a "Protect" toggle in `FieldPanel.tsx` under the defender side section. When Protect is active:
- Without bypass ability: damage is 0 (or display "Blocked by Protect")
- Unseen Fist (attacker has it): contact moves bypass Protect at ×0.25 damage (Pokémon Champions rules)
- Piercing Drill (attacker has it): bypasses Protect fully on moves it applies to (check Pokémon Champions ruling)

Store `protect` boolean in `defenderSide` (or `attackerSide` from the other direction). Add `protect` to `SideConditions`.

#### Backend
1. Add `PIERCING_DRILL` and `UNSEEN_FIST` to `Ability.java` enum.
2. Add `protect` boolean field to `SideConditions.java`.
3. In `DamageFormula.java` (or `CalculateDamageService`), add a pre-check:
   - If `defenderSide.protect()` is true:
     - If attacker ability is `UNSEEN_FIST` and move is contact → apply ×0.25 (reduced damage)
     - If attacker ability is `PIERCING_DRILL` → no reduction (full damage)
     - Otherwise → return 0
4. Add `PIERCING_DRILL` and `UNSEEN_FIST` to `AttackerAbilityModifier` switch (no modifier effect beyond Protect bypass — they don't boost damage).
5. Add exhaustive switch case entries to `DefenderAbilityModifier` for the new abilities.
6. Write golden tests for the three Protect scenarios.

**Key files:**
- `backend/.../domain/model/Ability.java`
- `backend/.../domain/formula/SideConditions.java`
- `backend/.../domain/formula/DamageFormula.java`
- `backend/.../web/dto/SideConditionsRequestDto.java`
- `frontend/src/features/calculator/components/FieldPanel.tsx`
- `frontend/src/features/calculator/types/api.ts`
- `frontend/src/features/calculator/store/useCalculatorStore.ts`

---

## Execution Order

Split into two sessions to match TDD discipline:

### Session A — Backend (stat stages + Protect + abilities)
1. `StatusCondition.java` — no changes needed
2. `Ability.java` — add `PIERCING_DRILL`, `UNSEEN_FIST`
3. `SideConditions.java` — add `protect` field
4. `Stats.java` — add `applyStage(int stat, int stage)` static helper
5. `CombatantRequestDto.java` — add `stages` map
6. `CalculateDamageService.java` — apply stages before Combatant construction; handle Protect pre-check
7. `DamageFormula.java` — add Protect modifier in `otherModifiers()` list; update ability switch cases
8. Golden tests for stages and Protect
9. `./mvnw verify`

### Session B — Frontend (all UI fixes)
1. `spriteBadgeSources.ts` + `SpriteBadge.tsx` + `PokemonPanel.tsx` — mega sprite fix
2. `useSavedTeamStore.ts` — import team fix
3. `StatTable.tsx` — SP padding fix; add stage inputs
4. `shared.ts` — remove Sleep/Freeze/Toxic status options
5. `MoveSlotRow.tsx` — type chip width fix
6. `PokemonPanel.tsx` — mega section min-height placeholder; rename chips/labels; accept focusedSide for color swap; stage inputs wiring
7. `FieldPanel.tsx` — label renames; accept focusedSide; add Protect toggle
8. `DetailedResult.tsx` — rename chips; remove LIVE chip; copy toast; rolls excluded from clipboard
9. `formatReadoutText.ts` — separate summary from rolls
10. `useCalculatorStore.ts` — add stages to state; add protect to sideConditions
11. `types/api.ts` — extend types
12. `CalculatorPage.tsx` — pass focusedSide to FieldPanel
13. `pnpm lint && pnpm typecheck && pnpm test`

---

## Verification

### Backend
```bash
./mvnw verify
```
- All golden tests pass including new stage and Protect tests
- `DamageFormulaGoldenSetTest` has at least one new case per feature

### Frontend
```bash
pnpm lint && pnpm typecheck && pnpm test
```
Manual checks:
- Import Tyranitar paste → SP cells show 4/2/0/0/0/2 correctly with no visual clipping
- Select Charizard → enable Mega Y → sprite shows Mega Y artwork, not generic mega
- Import 6-Pokémon team → all 6 appear (1 in panel + 5 in rail)
- Status dropdown has: Healthy, Burn, Poison (−1/8 HP/turn), Paralysis only
- FIGHTING type chip fits in the move slot row without overflow
- Both sides with mismatched mega sections stay visually aligned
- FieldPanel header shows "Field"; h2 shows "Modifiers"
- Side chips say "ATTACKER" / "DEFENDER"; no "OFFENSE"/"COUNTER"/"LIVE"
- Clicking a move on Side B → Side B becomes plasma (attacker), Side A becomes cyan (defender); FieldPanel side labels swap
- Clicking a move on Side A → revert to default
- Click damage readout → clipboard contains summary only (no rolls line); toast appears; LIVE chip gone so it doesn't overlap toast
- Stage +1 on Attacker Atk → damage increases proportionally; stat final column reflects staged value
- Protect checked in FieldPanel → move shows 0 damage (or blocked state)
- Protect + Unseen Fist attacker + contact move → shows ×0.25 damage
- Protect + Piercing Drill → full damage

---

## Codex Prompt

```
You are implementing Calculator Improvements Pass 3 for the VGCenter damage calculator.
Branch from develop: `git checkout develop && git pull --ff-only && git checkout -b feature/calc-improvements-pass-3`

Work in two sessions (A=backend, B=frontend). Do backend first, get it green, then frontend.

## SESSION A — Backend

### 1. Ability.java
Add `PIERCING_DRILL` and `UNSEEN_FIST` to the enum at:
`backend/src/main/java/com/vgcenter/damagecalc/domain/model/Ability.java`
Also update `AttackerAbilityModifier` and `DefenderAbilityModifier` switch exhaustiveness in `DamageFormula.java` (new cases return `damage` unchanged — their effect is handled by the Protect modifier).

### 2. SideConditions.java
Add `boolean protect` field to:
`backend/src/main/java/com/vgcenter/damagecalc/domain/formula/SideConditions.java`

### 3. Stats.java
Add a static `applyStage(int baseStat, int stage)` helper to:
`backend/src/main/java/com/vgcenter/damagecalc/domain/model/Stats.java`
Stage multiplier: stage 0=1, ±n uses the Gen 5 2/(2-n) and (2+n)/2 table for negative/positive. Clamp stage to −6..+6.

### 4. CombatantRequestDto.java
Add `Map<String, Integer> stages` field (nullable/optional, defaults to empty). Located at:
`backend/src/main/java/com/vgcenter/damagecalc/web/dto/CombatantRequestDto.java`

### 5. CalculateDamageService.java
Located at `backend/src/main/java/com/vgcenter/damagecalc/application/usecase/CalculateDamageService.java`
- After building battle stats from SP+nature, apply stage multipliers per stat using `Stats.applyStage`.
- Add Protect pre-check: if `defenderSide.protect()` is true, return rolls of all zeros unless attacker ability bypasses (Unseen Fist + contact → ×0.25; Piercing Drill → no penalty).

### 6. SideConditionsRequestDto.java
Add `boolean protect` to:
`backend/src/main/java/com/vgcenter/damagecalc/web/dto/SideConditionsRequestDto.java`
Also update the mapper that converts this DTO to domain `SideConditions`.

### 7. Tests
Write TDD tests first:
- `StatsTest.java` — applyStage at −6, −1, 0, +1, +6
- `DamageFormulaGoldenSetTest.java` — add 3 rows: Protect blocks damage, Protect + Unseen Fist (contact) = ×0.25, Protect + Piercing Drill = full damage
- `DamageFormulaGoldenSetTest.java` — add 2 rows: +1 Atk stage boosts damage, −1 Def stage boosts damage

Run: `./mvnw verify`

## SESSION B — Frontend

### 1. Mega sprite fix
`frontend/src/features/calculator/components/spriteBadgeSources.ts`
When `megaFormId` is provided and not null, use it as the primary sprite path instead of `${spriteId}-mega`:
```ts
const sources = megaActive
  ? [
      megaFormId ? `/sprites/${megaFormId}.png` : null,
      `/sprites/${spriteId}-mega.png`,
      `/sprites/${spriteId}.png`,
    ].filter(Boolean)
  : [`/sprites/${spriteId}.png`]
```
Update `SpriteBadge.tsx` and `PokemonPanel.tsx` to pass `megaFormId` through.

### 2. Import team rail fix
Check `frontend/src/features/calculator/store/useSavedTeamStore.ts`.
The `importTeam(side, savedPokemon[])` action must store all provided Pokémon in the rail for the given side. Ensure the rail array is replaced (not appended) and has no size cap that would drop entries. Verify `SavedPokemonRail` renders all entries.

### 3. SP padding fix
`frontend/src/features/calculator/components/StatTable.tsx`
Ensure SP input cells have consistent padding and the values are visually unclipped. Quick check: the input probably needs `min-w-[3ch]` and `text-right`.

### 4. Status options cleanup
`frontend/src/features/calculator/components/shared.ts`
Replace STATUS_OPTIONS with:
```ts
export const STATUS_OPTIONS = [
  { value: 'NONE', label: 'Healthy' },
  { value: 'BURN', label: 'Burn' },
  { value: 'POISON', label: 'Poison (−⅛ HP/turn)' },
  { value: 'PARALYSIS', label: 'Paralysis' },
] as const
```
Remove BADLY_POISONED, SLEEP, FREEZE.

### 5. Move type chip overflow fix
`frontend/src/features/calculator/components/MoveSlotRow.tsx`
Change the type chip span: use `w-[8.5ch]` instead of `min-w-[7.5ch]`, and add `text-[0.58rem] tracking-tight` to accommodate "FIGHTING".

### 6. Mega section height alignment
`frontend/src/features/calculator/components/PokemonPanel.tsx`
Wrap the mega section in a container that always occupies the same space. When `speciesEntry?.megaForms.length` is 0 or null, render an invisible spacer:
```tsx
<div className={speciesEntry?.megaForms.length ? '' : 'invisible pointer-events-none'}>
  {/* mega section content */}
</div>
```
Keep the actual content conditional inside but reserve the height unconditionally.

### 7. FieldPanel label renames + focusedSide prop + Protect toggle
`frontend/src/features/calculator/components/FieldPanel.tsx`
- Header label text: "Arena State · Live" → "Field"
- `<h2>` text: "Field" → "Modifiers"
- Accept `focusedSide: CalculatorSide` prop
- "Defender Side" label: swap based on focusedSide — when focusedSide='defender', this section label becomes "Attacker Side" (the focused side is attacking); when focusedSide='attacker', keep "Defender Side"
- Similarly swap "Attacker Side" label
- Add Protect toggle in the defender section (it goes on the side that is defending). Label: "Protect". Wire to `defenderSide.protect` in store.

### 8. PokemonPanel renames + color swap + stage inputs
`frontend/src/features/calculator/components/PokemonPanel.tsx`
- Accept `focusedSide: CalculatorSide` prop (already passed via `onFocusSlot` is available; need to add explicit prop)
- Derive `isAttacking = (side === focusedSide)` 
- Swap accent: attacker role → plasma; defender role → cyan (existing logic, just computed dynamically)
- Header label: "Side A · Offense" → `isAttacking ? 'Attacker' : 'Defender'` (include "Side A" prefix if useful)
- Chip: STRIKE → ATTACKER; SHIELD → DEFENDER
- Add stage inputs in `StatTable` section. For each non-HP stat, show a small stage selector (−6 to +6, defaulting 0). Can use a compact `<select>` or +/− buttons. Wire through `combatant.stages` in store.

### 9. DetailedResult chip renames + remove LIVE + copy toast
`frontend/src/features/calculator/components/DetailedResult.tsx`
- "OFFENSE" chip → "ATTACKER"
- "COUNTER" chip → "DEFENDER"  
- Remove the LIVE/RUNNING/ERROR/STANDBY chip entirely (that status info is redundant)
- After `await copyDamageReport(copyText)`, call:
  ```ts
  useToastStore.getState().push('Copied to clipboard')
  ```
- No other changes to the readout display.

### 10. Copy text — exclude rolls
`frontend/src/features/calculator/components/formatReadoutText.ts`
Extract a `formatSummaryText(ctx)` that returns just the first line (no `\n${rolls}`). Use `formatSummaryText` as `copyText` in `DetailedResult.tsx` (the `LiveBlock` still displays both lines via the existing `formatReadoutText`).

### 11. Store + types updates
`frontend/src/features/calculator/store/useCalculatorStore.ts`
- Add `stages: Stages` to `CombatantBuild` default (all zeros)
- Add `protect` to default `SideConditions`
- Include `stages` in the `DamageCalculationRequest` combatant object in `selectDamageRequestFor`
- Include `protect` in the `attackerSide`/`defenderSide` in `selectDamageRequestFor`

`frontend/src/features/calculator/types/api.ts`
- Add `stages: Record<string, number>` to `CombatantRequest`
- Add `protect: boolean` to `SideConditions`

### 12. CalculatorPage
`frontend/src/pages/CalculatorPage.tsx`
Pass `focusedSide` to `<FieldPanel focusedSide={focusedSide} />` and to both `<PokemonPanel focusedSide={focusedSide} />`.

### Run verification
```bash
pnpm lint && pnpm typecheck && pnpm test
```
Fix any type errors or test failures before committing.

## Commit discipline
Commit per concern using Conventional Commits. Suggested commit order:
1. `fix(import): resolve mega sprite variant for Charizard X/Y`
2. `fix(import): persist full team of 6 to saved rail`
3. `fix(ui): remove overflow from move type chip`
4. `fix(ui): align panels when one side has no mega evolution`
5. `feat(ui): rename side labels to Attacker/Defender; swap colors by focused move`
6. `fix(ui): clean up FieldPanel labels; rename Field→Modifiers`
7. `fix(ui): remove Sleep/Freeze status options; merge Toxic into Poison`
8. `fix(ui): copy damage report excludes rolls; restore copy toast`
9. `feat(calc): stat stage modifiers on both sides`
10. `feat(calc): Protect mechanic with Unseen Fist / Piercing Drill bypass`

After both sessions are green, open a PR targeting develop.
```
