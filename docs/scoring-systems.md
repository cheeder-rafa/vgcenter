# Scoring Systems — Preview Coach, Replay Autopsy, Multi-Threat Optimizer (v1.3)

Resumo funcional pós-fix (M14a–M14e). Para detalhamento técnico e `file:line`, ver [`scoring-systems-technical.md`](./scoring-systems-technical.md).

---

## 1) Damage core compartilhado

Os três sistemas consomem o mesmo núcleo de cálculo (`CalculateDamageService` + `DamageFormula`).

Em v1.3:
- accuracy entra no dano esperado e na probabilidade de OHKO.
- crit entra por média ponderada (`(1-critRate)*normal + critRate*crit`).
- moves always-crit usam taxa de crit de 100%.

Campos relevantes em `CalculateDamageResult` / API:
- `accuracy`
- `expectedDamageWithAccuracy`
- `koProbabilityWithCrit`

---

## 2) Preview Coach (`RecommendPlansService` + `EvaluateLeadsService`)

### Pipeline

1. **Matriz 6×6 (`buildMatrix`)**  
   Para cada par (meu Pokémon, oponente), calcula melhor golpe de ida e volta.

2. **Best move por expected × accuracy**  
   "Melhor" não é mais `maxPct`; agora usa `mean(rolls) * accuracy`.

3. **Avaliação dos 15 leads adversários**  
   Reusa a matriz, sem recalcular dano para cada cenário.

4. **Score de plano (bring-4 + lead-2)**  
   Base:
   - `offensive * 4`
   - `safe * 1`
   - `risky * -3`

   Bônus:
   - win condition no lead `+2`
   - win condition no backline `+6`
   - trouxe Mega `+5`
   - Mega lidera `+2`
   - sem Mega `-6`
   - `speed-control` / `redirection` `+3` (cap total de suporte: `+6`)
   - `screens` / `fake-out` / `defense-shred` `+2`
   - `helping-hand` `+1`

   Penalidade:
   - `-4` se 3/4 do bring for físico-only ou special-only.

5. **Top-3 com diversidade**
   - evita repetir lead pair.
   - `mega escape valve` mantém opção sem Mega quando viável.

### Métricas de matchup

- `koPressure` e `twoHitKoPressure` consideram probabilidade (`>= 0.5`), não só hits mínimos.
- speed comparison diferencia `faster`, `slower` e `tied`.

---

## 3) Replay Autopsy (`EvaluateReplayDecisionsService`)

### Pipeline por turno

1. reconstrói estado do turno.
2. lê linha jogada.
3. enumera alternativas.
4. pontua linhas.
5. ordena e classifica veredicto.

### Ações candidatas

- `ATTACK`
- `PROTECT`
- `WIDE_GUARD`
- `QUICK_GUARD`
- `STATUS`
- `SWITCH`

### Score da linha

```
score = (damageDealtWeight × dealt)
      - (damageTakenWeight × effectiveTaken)
      + (koBonus × koProbabilityAnyKo)
      - (faintPenalty × effectiveFaintProb)
      + utilityBonus
```

Defaults:
- `damageDealtWeight = 1.0`
- `damageTakenWeight = 1.0`
- `koBonus = 30.0`
- `faintPenalty = 20.0`

### Correções de correctness/modelagem em v1.3

- Wide Guard e Quick Guard agora creditam bloqueio correto por tipo de hit (spread/prioridade), não single-slot.
- status moves relevantes têm valor não-zero (`tailwind`, `trickroom`, `helpinghand`, `followme`, `ragepowder`, telas, guards).
- switch entrou na enumeração com custo de oportunidade de `-5`.
- recoil é abatido do próprio usuário (inclui risco de faint por recoil).
- probabilidade agregada usa união: `1 - Π(1 - p_i)`.
- veredicto usa delta relativo (`delta / max(|best|, 1)`):
  - `<= 0.01` optimal
  - `<= 0.25` acceptable
  - `> 0.25` suboptimal

### Advisory

Dispara quando:
- pressão de faint alta (`>= 0.8`) e
- melhor resposta ainda não positiva (`bestScore <= 0`).

---

## 4) Multi-Threat Spread Optimizer (`OptimizeAgainstThreatsService`)

### Busca

Enumera `SpreadTriple(spHp, spDef, spSpd)` com:
- cada stat `<= 32`
- total `<= 66`

Testa naturezas candidatas e calcula score contra lista de ameaças.

### Campos canônicos (v1.3)

- `ohkoProbability` (substitui naming ambíguo antigo)
- `nearKoMargin` (`100 - maxDamagePct`)

`koChanceProbability` foi removido no cleanup de M14e.

### Goals

- `WORST_CASE_KO`:
  1. min `ohkoProbability`
  2. min `expectedDamageSum`
  3. min `totalSp`

- `EXPECTED_DAMAGE_SUM`:
  1. min `expectedDamageSum`
  2. min `ohkoProbability`
  3. min `totalSp`

- `SURVIVE_ALL`:
  1. min `expectedDamageSum`
  2. max `nearKoMargin`
  3. min `totalSp`

### SURVIVE_ALL lookahead

Após encontrar o primeiro tier com sobrevivente, a busca continua por mais 4 tiers para não parar cedo em solução frágil.

---

## 5) Contratos e compatibilidade

### Damage API (`/api/v1/damage/calculate`)

Exposição relevante:
- `accuracy`
- `expectedDamageWithAccuracy`
- `koProbabilityWithCrit`
- `koChance` (legado funcional mantido)

### Optimizer API (`/api/v1/calc/optimize-against-threats`)

Schema atual:
- `ohkoProbability`
- `nearKoMargin`

Sem alias legado:
- `koChanceProbability` removido.

### Dataset

`backend/src/main/resources/data/regulation-m-a/moves.json` segue como source of truth de:
- `accuracy`
- `alwaysCrit`

---

## 6) Testes que blindam regressão

- Property tests do core:
  - monotonicidade de accuracy no expected
  - monotonicidade de crit na probabilidade de KO

- Service tests:
  - replay guards/status/switch/recoil/verdict relativo
  - optimizer `ohkoProbability` + `nearKoMargin` + lookahead
  - preview expected*accuracy + speed tie
  - recommend plans com pesos numéricos e penalidade mono-categoria

- Frontend component test:
  - `SpreadOptimizerPanel` com schema atualizado (`ohkoProbability`, `nearKoMargin`)

---

## 7) Estado dos itens audit

Todos os IDs C/M/B documentados no audit foram cobertos em M14a–M14d e fechados documentalmente em M14e.

Para rastreio por commit e referência de código:
- [`scoring-systems-audit.md`](./scoring-systems-audit.md)
- [`scoring-systems-technical.md`](./scoring-systems-technical.md)

