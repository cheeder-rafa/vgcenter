<!--
PR template for VGCenter.
- Feature/milestone PRs must target `develop`.
- Only `release/*` and `hotfix/*` PRs target `main`.
-->

## Summary

<!-- 1–3 bullets describing the change and why it was made. -->
-
-

## Linked milestone / issue

<!-- e.g. "Implements M3 (full modifier chain) from PLAN.md" -->

## Type of change

- [ ] `feat` — new feature
- [ ] `fix` — bug fix
- [ ] `refactor` — no behavior change
- [ ] `test` — tests only
- [ ] `chore` / `ci` / `docs`

## Checklist (must be satisfied before review)

- [ ] Branch is up to date with `develop` (`git rebase origin/develop`).
- [ ] `./mvnw verify` is green locally.
- [ ] `pnpm lint && pnpm typecheck && pnpm test` is green locally (if frontend changed).
- [ ] No new ArchUnit violations.
- [ ] JaCoCo coverage on `domain` + `application` is still ≥ 85%.
- [ ] No Spring / Jackson / HTTP imports inside `domain`.
- [ ] No domain types leaked through web DTOs.
- [ ] Commit messages follow Conventional Commits.
- [ ] README updated if user-facing behavior changed.

## Verification steps for reviewer

<!-- What the reviewer should run or click to confirm the change works. -->

## Screenshots / damage-calc scenarios (if applicable)

<!-- For calculator changes, paste the before/after damage ranges and reference the golden-set test file covering the change. -->
