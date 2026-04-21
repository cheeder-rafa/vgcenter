# Improvements Pass 2 — Damage Calculator UX Refinements

> **Status:** approved design, ready to execute.
> **Branch:** `feature/calc-improvements-pass-2` off `develop`; single PR targeting `develop`.
> **Agents:** Claude Code or Codex. Execute the four bounded sessions below in order, committing per concern, stopping for human review between sessions.

## Context

M0–M10 and the first Corrections Pass are complete. Real-world use has surfaced eight issues that either block everyday flows (importer errors, stale stats after swaps), waste screen real-estate (the detailed readout doesn't fit above the fold at 1080p), or miss table-stakes polish (uncolored types, sprite doesn't change on Mega, no saved-Pokémon memory). This pass addresses all eight in a single feature branch so the calculator feels tight end-to-end for the Reg M-A format window.

Scope is **frontend-only except** for one importer fix in `ShowdownTextParser` (to resolve `(M)`/`(F)` gender to `-male`/`-female` species) and reuse of the existing `/api/v1/dataset/build-stats` endpoint per side. The damage formula, dataset JSON, clean-architecture boundaries, and existing golden tests are **not** touched.

---

## Improvement 1 — Species search becomes a proper combobox

**Problem.** `SpeciesSelect.tsx` has an `<input>` that filters the list, but the actual picking happens in a separate native `<select>`. Typing "char" narrows the options but the user still has to open the dropdown to click — it's two steps, and the native select doesn't show the filtered list until opened.

**Change.** Replace the input + select pair with a single combobox: one text input, and an inline popover list of matching Pokémon that appears as the user types. Click a row (or press ↑/↓ + Enter) to select. Only Reg M-A species are searchable (the dataset is already filtered — no extra work).

- File: `frontend/src/features/calculator/components/SpeciesSelect.tsx` (rewrite).
- Keep the existing `PokedexEntry[]` + `onChange(entry | null)` contract so `PokemonPanel` is untouched.
- Clear button (×) inside the input when a species is selected.
- Keyboard: ↑/↓ navigate, Enter picks, Esc closes the popover.
- Reuse `arena-input` + a new `arena-listbox` Tailwind class (or inline).
- Test: update `SpeciesSelect` tests (Vitest + RTL) to cover typing → list appears → Enter picks, and clearing.

---

## Improvement 2 — Independent final-stat calculation per side

**Problem.** `useReactiveDamage.ts:135-140` short-circuits when either side has `speciesId === null`, so `baseStats`/`finalStats` are never fetched until **both** sides are chosen. The user picks a single species and sees stale default stats.

**Change.** Split the build-stats sync out of `useReactiveDamage` so it runs per side independently, regardless of the other side's state. Damage-roll fetching still requires both sides.

- File: `frontend/src/features/calculator/hooks/useReactiveDamage.ts`.
- Extract a new `useBuildStatsSync(side)` hook that watches `(speciesId, natureId, megaActive, sp)` for one side and POSTs `/api/v1/dataset/build-stats` whenever that key changes and a species is present. Call it twice in the page (once per side). `useReactiveDamage` keeps only the damage-roll responsibility, and returns `'idle'` with no error when one side lacks a species.
- Reuses `buildStats` request in `frontend/src/features/calculator/api/datasetApi.ts` (no API changes).
- Test: Vitest covers "one side populated → stats appear"; damage rolls still gated on both sides.

---

## Improvement 3 — Fix Showdown import for `Basculegion (M)` / `(F)` gendered species

**Problem.** Showdown syntax `Basculegion (M)` errors out even though `basculegion-male` is in the dex and `Basculegion-Male` works. `ShowdownTextParser.java:149-164` already parses `gender` into a `Header` record but never fuses it with the species name; `ImportedPokemonView` / downstream resolution receives `"Basculegion"` which fails lookup.

**Change.** In the parser, if the header yields a base species that has gendered dex forms (`<species>-male`, `<species>-female`) and `gender` is `"M"` or `"F"`, rewrite `speciesName` to `<species>-male` / `<species>-female` **before** handing off for resolution. This keeps both Showdown conventions (`Basculegion-Male` and `Basculegion (M)`) working and is a tiny, localized change.

- File: `backend/src/main/java/com/vgcenter/damagecalc/infrastructure/importer/ShowdownTextParser.java`.
- Use the existing `PokedexRepository` (injected; the parser already has access via the import use case) to check whether `"<species>-male"` exists before rewriting. Falls back to the bare species name if not — so non-gendered species with `(M)`/`(F)` trivia still import.
- Hard-code is **not** acceptable per CLAUDE.md data-sourcing policy; dex lookup is the right mechanism.
- Test (TDD, per CLAUDE.md): add `ShowdownTextParserTest` cases —
  - `Basculegion (M)` → resolves to `basculegion-male`.
  - `Basculegion-Male` still resolves.
  - `Pikachu (M)` (no gendered form) → resolves to `pikachu`, ignoring the gender suffix.
  - `Indeedee (F)` → resolves to `indeedee-female`.

---

## Improvement 4 — Compact, copyable damage readout

**Problem.** `DetailedResult.tsx` consumes ~450 px of vertical space: 4-rem damage number, separate KO card, and 16 rolls in a 4×4 grid. At 1920×1080 with the header + panels, it pushes the calculation below the fold. The reference npc-vgc-damage-calculator does it in ~4 lines.

**Change.** Rewrite the `LiveBlock` to match the approved mockup — one Showdown-style readout line, a rolls tuple just below, the entire card clickable to copy:

```
32+ Atk Spell Tag Aegislash Poltergeist vs.
32 HP / 0 Def Aegislash: 108-126 (64.6 - 75.4%)
  -- guaranteed 2HKO
(108, 108, 108, 110, 110, 114, 114, 116,
 116, 116, 120, 120, 122, 122, 126)
```

- File: `frontend/src/features/calculator/components/DetailedResult.tsx`.
- New helper `formatReadoutText(result, attacker, defender, move)` returns the plain-text string above. Offensive-stat label (`32+ Atk`), item (`Spell Tag`), defensive-stat label (`32 HP / 0 Def`) come from the combatants' SP + nature — compute using the same nature tables the backend uses (read `natures.json` on startup via existing `datasetApi` if not already exposed; otherwise surface the nature multipliers in the build-stats response so frontend just formats).
- KO description: render `result.koChance.description` verbatim (the backend already produces `guaranteed 2HKO` / `possible 3HKO` / `possible OHKO (xx.x%)`). Replaces the "No OHKO" bug.
- Clickability: the whole `<article>` gets `role="button"`, `cursor-copy`, `onClick` that calls `navigator.clipboard.writeText(formatReadoutText(...))` and triggers a toast "Copied damage report" (Zustand-backed mini toast reusing existing patterns, or a lightweight local state + fade-out).
- Target height < 150 px total so the header + panels + readout fit in 1080 px.
- Test: Vitest for `formatReadoutText` with a golden input; RTL test for click → `navigator.clipboard.writeText` spy called with expected string; regression test that 2HKO results no longer display "No OHKO".

---

## Improvement 5 — Saved Pokémon rails (persisted)

**Problem.** Importing a team offers no memory — once loaded into a side, the other 5 imported Pokémon are gone and the next import overwrites everything. The user wants a team bench.

**Change.** Add two vertical rails flanking the main 3-column grid. Each rail holds up to 6 small square sprite cards. Left rail saves attacker-side builds; right rail saves defender-side. Clicking a card loads the full saved combatant into that side's panel. Each card has a small × to remove.

- Layout: change `CalculatorPage.tsx` main grid from `lg:grid-cols-[1.2fr_0.7fr_1.2fr]` to `lg:grid-cols-[90px_1.1fr_0.7fr_1.1fr_90px]`. Main panels shrink ~8%, container stays at `max-w-[1600px]`. The rails collapse at `md` breakpoints.
- New files:
  - `frontend/src/features/calculator/components/SavedPokemonRail.tsx` (renders the vertical stack of cards + "add current" button at the top).
  - `frontend/src/features/calculator/components/SavedPokemonCard.tsx` (square sprite button with ×).
  - `frontend/src/features/calculator/store/useSavedTeamStore.ts` (Zustand with `persist` middleware, key `vgcenter.savedTeams.v1`). Two slots: `attackerSaved: SavedPokemon[6]` and `defenderSaved: SavedPokemon[6]`. Shape: a full `CombatantBuild` snapshot plus `speciesName` and `spriteId` for the card.
- Import flow: when a user imports a 6-Pokémon team, the first slot becomes active on that side and the other 5 are auto-saved to that side's rail (pushing out oldest if full — or refusing and showing a toast; choose "refuse + toast" since the user asked for explicit delete control).
- Save button at top of rail pushes current side's combatant to the first empty slot.
- Persistence: `localStorage` via zustand `persist`. Adds two imports in `useCalculatorStore` path but the saved-team store is **separate** to avoid serializing transient damage results.
- Test: Vitest for the store (save, remove, full-capacity behavior); RTL test for card click → side loads the saved build; persistence round-trip via `vi.stubGlobal('localStorage', ...)`.

---

## Improvement 6 — Type-colored chips

**Problem.** `PokemonPanel.tsx:172-181` renders types as plain white chips. The standard VGC palette is so familiar that uncolored types read as broken.

**Change.** Color the type chips by the 18 standard type colors. Implement as a lookup constant (`TYPE_COLORS: Record<TypeId, string>`) and apply `text-` or `bg-` utility classes (or inline `style={{ color }}` for simplicity). Put the helper in `frontend/src/features/calculator/components/typeColors.ts` so it's reusable by the move-type badges in `MoveSlotRow.tsx`.

- Colors follow the Pokémon conventional palette (Fire `#ee8130`, Water `#6390f0`, Grass `#7ac74c`, Electric `#f7d02c`, etc. — full 18-type table in the file).
- Also apply to move-type badges in `MoveSlotRow` for consistency.
- Test: snapshot/regression test on `PokemonPanel` that types render with expected class/style.

---

## Improvement 7 — Mega swap: name prefix + sprite

**Problem.** Toggling mega in `PokemonPanel.tsx:123-139` updates stats/types/ability but **not** the display name or sprite. Mega sprites like `dragonite-mega.png` exist but `SpriteBadge.tsx:16` only uses `speciesId`. New Legends Z-A Mega sprites aren't bundled at all.

**Change.**

1. **Name:** when `megaActive === true`, `PokemonPanel` header displays `Mega {speciesName}`. Keep the species dropdown bound to base speciesId — don't create new dex entries. This is a pure presentation change.
2. **Sprite:** extend `SpriteBadge.tsx` to accept an optional `megaActive` prop; when true, try `/sprites/${speciesId}-mega.png` with fallback to `/sprites/${speciesId}.png` and then `_unknown.png`. Use an `<img>` `onError` chain or a `useMemo`'d URL list with fetch-HEAD probing (prefer the simpler `onError` chain).
3. **Mega sprite bundle:** add `scripts/download-mega-sprites.mjs` modelled after the existing sprite bundler. It scrapes:
   - Classic megas: `https://pokemondb.net/sprite/<name>-mega` (official-artwork images).
   - Legends Z-A megas: the pokebeach article (`https://www.pokebeach.com/2026/01/official-artwork-of-all-legends-z-a-mega-evolutions-revealed`). The script picks the **first available image** per species from the article — per the user's note, that's the official artwork (not the 3D model).
   - Writes to `frontend/public/sprites/<speciesId>-mega.png`, idempotent, skips existing.
   - Console summary of how many were fetched / skipped / failed.
4. Run the script once, commit the resulting PNGs. No manual placement required per the user's guidance.
5. Test: unit test for the mega-sprite URL resolution (`SpriteBadge`); smoke test that the script's URL builder produces the expected file path for a known species. The scraper itself is not unit-tested (network-bound); the bundled PNGs are the source of truth.

---

## Improvement 8 — Clear moves and stale damage on species change

**Problem.** `PokemonPanel.tsx:99-121` (`handleSpeciesChange`) doesn't touch `moves` or `results`. When the user swaps Gholdengo → Urshifu, the four previous move IDs stay (silently invalid, since `MoveSlotRow` just filters the dropdown) **and** the damage percentages for the old moves are still displayed in the inline readout.

**Change.** In the species-change handler, always do three things:

1. Reset all four move slots to `{ moveId: null }`.
2. Clear that side's damage results: `store.setResults({ ... [sideKey]: [null, null, null, null] })`.
3. Reset the "focused slot" to 0 so `DetailedResult` shows standby.

This is a small, pure store patch. Mega toggle is **not** affected — only species change triggers full clear.

- File: `frontend/src/features/calculator/components/PokemonPanel.tsx`.
- Minor helper in `useCalculatorStore.ts`: `clearSideMovesAndResults(side)` to consolidate the three writes and avoid subscriber flicker.
- Test: Vitest — "changing species clears moves and per-side results; does not affect opposite side".

---

## Files touched (summary)

**Backend:**
- `backend/src/main/java/com/vgcenter/damagecalc/infrastructure/importer/ShowdownTextParser.java` — gender-suffix resolution.
- `backend/src/test/java/com/vgcenter/damagecalc/infrastructure/importer/ShowdownTextParserTest.java` — new cases.

**Frontend:**
- `frontend/src/features/calculator/components/SpeciesSelect.tsx` — combobox rewrite.
- `frontend/src/features/calculator/components/DetailedResult.tsx` — compact readout + copy-to-clipboard.
- `frontend/src/features/calculator/components/PokemonPanel.tsx` — Mega name prefix, species-change clear, type-colored chips.
- `frontend/src/features/calculator/components/SpriteBadge.tsx` — mega sprite resolution.
- `frontend/src/features/calculator/components/MoveSlotRow.tsx` — type-colored move badges.
- `frontend/src/features/calculator/components/SavedPokemonRail.tsx` — new.
- `frontend/src/features/calculator/components/SavedPokemonCard.tsx` — new.
- `frontend/src/features/calculator/components/typeColors.ts` — new.
- `frontend/src/features/calculator/hooks/useReactiveDamage.ts` — split out build-stats sync.
- `frontend/src/features/calculator/hooks/useBuildStatsSync.ts` — new.
- `frontend/src/features/calculator/store/useCalculatorStore.ts` — `clearSideMovesAndResults` helper, focusedIndex reset.
- `frontend/src/features/calculator/store/useSavedTeamStore.ts` — new (zustand persist).
- `frontend/src/pages/CalculatorPage.tsx` — layout change (5-column grid with rails).
- `frontend/src/features/importer/ImportTeamModal.tsx` — on success, save non-active entries to the rail.

**Scripts:**
- `scripts/download-mega-sprites.mjs` — new.
- `frontend/public/sprites/*-mega.png` — committed output of the above script.

**Tests (frontend, Vitest + RTL):**
- `SpeciesSelect` combobox interaction.
- `useBuildStatsSync` independent fetch.
- `DetailedResult` format + copy-to-clipboard.
- `useSavedTeamStore` persistence + capacity.
- Species-change clears moves + results.
- `SpriteBadge` mega URL fallback.

---

## Reused existing utilities (do not duplicate)

- `Stats.toBattleStats(Sp, Nature, level)` — backend formula, already behind `/api/v1/dataset/build-stats`. **Do not reimplement** in TS.
- `datasetApi.buildStats` (`frontend/src/features/calculator/api/datasetApi.ts`) — used by the new `useBuildStatsSync`.
- `zustand/middleware` `persist` — already a transitive dep via zustand.
- Existing `arena-*` Tailwind utilities for all new components.
- `navigator.clipboard.writeText` — native, no new library.
- Existing sprite-bundling convention (flat `frontend/public/sprites/*.png`) — mega script follows the same pattern.

---

## Verification

Run end-to-end from a clean `develop`:

1. **Backend tests:**
   ```
   ./mvnw verify
   ```
   Must stay green including ArchUnit; new `ShowdownTextParserTest` cases must pass.

2. **Frontend checks:**
   ```
   cd frontend && pnpm lint && pnpm typecheck && pnpm test
   ```

3. **Manual smoke test** at 1920×1080:
   - Start dev server (`pnpm dev` in frontend + `./mvnw spring-boot:run` in backend).
   - Open the calculator. Confirm header + both panels + detailed readout all fit above the fold (no scroll).
   - Type "char" in species search — confirm inline list; pick Charizard with Enter.
   - Confirm base/SP/final stats render with only one side filled.
   - Pick a defender; set a move on the attacker — confirm single-line readout + rolls tuple. Click it — toast "Copied damage report"; paste into a text editor and confirm format matches reference.
   - Toggle Mega — confirm header reads "Mega Charizard", sprite swaps to the mega art.
   - Verify type chips are colored.
   - Import a 6-Pokémon team via Showdown paste — 1st enters the attacker panel; 5 appear as saved cards on the left rail. Click a saved card — that Pokémon loads into the attacker panel.
   - Paste Showdown set containing `Basculegion (M)` — import succeeds, species resolves to Basculegion-Male.
   - Swap species on either side — confirm all 4 move slots clear and stale damage% disappears.
   - Reload the page — saved cards persist.

---

## Execution — four bounded sessions, one branch, one PR

All four sessions run on the same branch `feature/calc-improvements-pass-2` (cut from `develop`). Between sessions the agent stops and waits for the human maintainer to review the commits before continuing.

### Session A — Backend importer fix + data-layer split
- Improvement 3 (gender-suffix resolution in `ShowdownTextParser`) + its tests.
- Improvement 2 (`useBuildStatsSync` hook split from `useReactiveDamage`) + its tests.
- Improvement 8's store helper (`clearSideMovesAndResults`) + its test — the UI wiring comes in Session B, but the helper is small and lives alongside the store work.
- Commands: `./mvnw spotless:apply && ./mvnw verify` (backend); `cd frontend && pnpm lint && pnpm typecheck && pnpm test` (frontend).
- Commits: `fix(importer): resolve gendered species from Showdown text`, `refactor(calc): split build-stats sync from damage hook`, `feat(calc-store): add clearSideMovesAndResults helper`.

### Session B — Search, readout, types, species-swap wiring
- Improvement 1 (SpeciesSelect combobox rewrite) + tests.
- Improvement 4 (compact copyable DetailedResult) + tests.
- Improvement 6 (`typeColors.ts` + colored chips in `PokemonPanel` and `MoveSlotRow`) + tests.
- Improvement 8's UI wiring in `PokemonPanel.handleSpeciesChange` (calls the Session A helper).
- Verification: `pnpm lint && pnpm typecheck && pnpm test` + manual smoke per the verification checklist.
- Commits: `feat(calc): species search becomes a combobox`, `feat(calc): compact copyable damage readout`, `feat(calc): color type chips`, `fix(calc): clear moves and stale damage on species swap`.

### Session C — Saved Pokémon rails
- Improvement 5 (rail components, persisted store, layout change, import-modal wiring) + tests.
- Verification: frontend checks + smoke test the import → rail populate flow and localStorage round-trip.
- Commits: `feat(calc): persisted saved-team rails`, `feat(importer): save non-active imports to rail`.

### Session D — Mega name + sprites
- Improvement 7.1 (name prefix in `PokemonPanel` header).
- Improvement 7.2 (`SpriteBadge` mega fallback chain) + tests.
- Improvement 7.3 (`scripts/download-mega-sprites.mjs`). Run it once, commit the resulting `-mega.png` files.
- Verification: frontend checks + manual toggle test on a classic Mega (e.g. Charizard) and a Legends Z-A Mega.
- Commits: `feat(calc): mega toggle updates name and sprite`, `chore(assets): bundle mega sprites`.

### After Session D
- Rebase onto the latest `develop`: `git fetch origin && git rebase origin/develop`.
- Open the PR targeting `develop` using `.github/pull_request_template.md`.
- Stop. **Do not merge.** The human maintainer reviews and squash-merges.

---

## Not in scope

- Damage formula changes.
- Dataset JSON edits (roster/items/moves).
- Clean-architecture boundary changes.
- Retuning existing golden tests.
- Switching the layout beyond what's needed to fit rails; `arena-*` theme stays.
- Server-side team persistence (localStorage only; no account system).
