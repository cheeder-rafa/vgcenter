# Scoring Systems — Audit (v1.3 closure)

Arquivo de auditoria histórico para Preview Coach, Replay Autopsy e Multi-Threat Optimizer.

Status atual:
- Todos os itens C/M/B foram resolvidos em v1.3.
- Este arquivo foi mantido para rastreabilidade e links de fechamento.

Merges v1.3:
- M14a: `e6c7a15` (`feat(calc): M14a accuracy and crit in damage core (#100)`)
- M14b: `12cfefd` (`fix(replay): M14b replay correctness (C1,C2,M4,M6,B3,B4) (#101)`)
- M14c: `88c8355` (`fix(optimizer): M14c modelling updates (M1,M7,B1) (#102)`)
- M14d: `b487eda` (`fix(preview): M14d modelling updates (M3,M5,B2,B5) (#103)`)

Referências de comportamento pós-fix:
- [`scoring-systems.md`](./scoring-systems.md)
- [`scoring-systems-technical.md`](./scoring-systems-technical.md)

---

## Premissas pré-fix (histórico)

- ~~`CalculateDamageService` / `DamageFormula.rolls()` não considera accuracy.~~  
  Resolvido em v1.3 M14a (`e6c7a15`).

- ~~`criticalHit=false` hardcoded no replay/optimizer sem ponderação probabilística.~~  
  Resolvido em v1.3 M14a + M14b (`e6c7a15`, `12cfefd`).

- ~~`koChanceProbability` era naming ambíguo no optimizer.~~  
  Resolvido em v1.3 M14c + M14e (`88c8355`, cleanup M14e).

- ~~Pesos numéricos de `RecommendPlansService` não tinham teste dedicado.~~  
  Resolvido em v1.3 M14d (`b487eda`).

---

## Falhas críticas (C)

### ~~C1. Wide Guard / Quick Guard atribuídos como Protect single-slot~~

Status: **resolvido em v1.3** (M14b, commit `12cfefd`).

Fechamento:
- Replay aplica bloqueio por tipo de hit (spread/prioridade) em todos os slots relevantes.
- Referência técnica: `EvaluateReplayDecisionsService.scoreLine` (guard blocking logic).

### ~~C2. Status moves nunca podem ser a melhor alternativa no replay~~

Status: **resolvido em v1.3** (M14b, commit `12cfefd`).

Fechamento:
- `STATUS_MOVE_VALUES` adicionada e integrada ao score.
- Switch/guard/status não ficam mais com valor estrutural zero.

### ~~C3. Accuracy ignorada nos três sistemas~~

Status: **resolvido em v1.3** (M14a, commit `e6c7a15`).

Fechamento:
- core de dano passa a considerar accuracy em expected e KO probability.
- sistemas consumidores herdam via `CalculateDamageUseCase`.

---

## Problemas médios (M)

### ~~M1. `worstKoChance` era só OHKO probabilístico com naming ambíguo~~

Status: **resolvido em v1.3** (M14c, commit `88c8355`; cleanup final em M14e).

Fechamento:
- naming canônico: `ohkoProbability`.
- novo campo: `nearKoMargin`.

### ~~M2. Crit ignorado em probabilidade~~

Status: **resolvido em v1.3** (M14a, commit `e6c7a15`).

Fechamento:
- composição `normal/crit` com peso `(23/24, 1/24)` no caso padrão.
- always-crit forçado para taxa de 100%.

### ~~M3. Preview escolhia best move por `maxPct` em vez de dano esperado~~

Status: **resolvido em v1.3** (M14d, commit `b487eda`).

Fechamento:
- best move usa `mean(rolls) * accuracy`.
- `koPressure`/`twoHitKoPressure` passam a usar limiar probabilístico.

### ~~M4. `koProbability` somado podia exceder 1.0 no replay~~

Status: **resolvido em v1.3** (M14b, commit `12cfefd`).

Fechamento:
- probabilidade agregada por união: `1 - Π(1-p_i)`.

### ~~M5. Speed comparison favorecia usuário em empate~~

Status: **resolvido em v1.3** (M14d, commit `b487eda`).

Fechamento:
- speed comparison separa `faster`, `slower`, `tied`.

### ~~M6. Verdict thresholds não eram normalizados~~

Status: **resolvido em v1.3** (M14b, commit `12cfefd`).

Fechamento:
- veredicto por delta relativo (`delta / max(|best|, 1)`).

### ~~M7. `SURVIVE_ALL` parava no primeiro tier sobrevivente~~

Status: **resolvido em v1.3** (M14c, commit `88c8355`).

Fechamento:
- lookahead de +4 tiers após primeiro sobrevivente.

---

## Polish / cleanup (B)

### ~~B1. Tiebreaker redundante no optimizer~~

Status: **resolvido em v1.3** (M14c, commit `88c8355`).

### ~~B2. Pesos do RecommendPlans sem teste numérico dedicado~~

Status: **resolvido em v1.3** (M14d, commit `b487eda`).

Fechamento:
- `RecommendPlansScoreWeightsTest` adiciona asserts numéricos explícitos.

### ~~B3. Replay não modelava switches~~

Status: **resolvido em v1.3** (M14b, commit `12cfefd`).

Fechamento:
- switch candidato com custo de oportunidade.

### ~~B4. Recoil não era descontado do usuário~~

Status: **resolvido em v1.3** (M14b, commit `12cfefd`).

Fechamento:
- recoil entra em `effectiveTaken` e no risco de faint próprio.

### ~~B5. Preview não penalizava bring mono-categoria~~

Status: **resolvido em v1.3** (M14d, commit `b487eda`).

Fechamento:
- penalidade `-4` com 3/4 físico-only ou special-only.

---

## Resumo final

- ~~Backlog de correções pendentes~~ → **fechado em v1.3**.
- Itens não removidos deste arquivo foram mantidos apenas como trilha histórica.
- Qualquer ajuste adicional deve ser registrado como novo ID e novo milestone, sem reabrir os IDs C/M/B acima.

