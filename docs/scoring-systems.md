# Scoring Systems — Preview Coach, Replay Autopsy, Multi-Threat Optimizer

## 1. Preview Coach — "Get Recommendation" (`RecommendPlansService`)

Dado o time de 6 do usuário e o time adversário de 6, recomenda os 3 melhores planos de jogo (quais 4 trazer + lead de 2).

### Pipeline

**Passo 1 — Matriz de dano 6×6** (`buildMatrix`)

Para cada par (meu Pokémon i, adversário j), calcula em paralelo (virtual threads) o melhor golpe de i em j (`bestOutgoing`) e de j em i (`bestIncoming`). "Melhor" = move com maior `maxPct` de dano. Resultado: matriz 6×6 de `HitEvidence` precalculada.

**Passo 2 — Avaliação de todos os C(6,2)=15 leads**

Para cada par de leads possível do meu time, reusa a matriz (sem recalcular dano) e computa um `LeadMatchupResult` com 5 métricas:

| Métrica | O que mede |
|---|---|
| `koPressure` | Quantos OHKOs eu consigo nessa lead vs cada lead adversária |
| `twoHitKoPressure` | 2HKOs |
| `doubleUpPressure` | Alvos que meu duo pode matar combinando dano |
| `incomingDanger` | OHKOs + 2HKOs que o adversário ameaça em mim |
| `speedComparison` | Quantos meus leads são mais rápidos |

**Passo 3 — Score de cada plano** (`score`)

Para cada combinação de bring-4 (C(6,4)=15 combos) com o melhor lead-2 dentro dela:

```
base = offensive × 4 + safe × 1 − risky × 3
```

- `offensive` = matchups onde tenho OHKO ou double-up
- `safe` = matchups com `incomingDanger == 0`
- `risky` = matchups com `incomingDanger >= 2`

Bônus adicionais:

| Condição | Pontos |
|---|---|
| Win condition no lead | +2 |
| Win condition no backline | +6 |
| Trouxer o Mega | +5 |
| Mega lidera | +2 adicional |
| Não trouxer o Mega | −6 |
| `speed-control` / `redirection` na bring | +3 cada (cap total +6) |
| `screens` / `fake-out` / `defense-shred` | +2 cada |
| `helping-hand` | +1 |

**Passo 4 — Seleção dos top-3**

Ordena por score descrescente. `selectDiverse` garante que nenhum par de leads se repita nos 3 planos. `applyMegaEscapeValve` substitui o pior plano por um sem Mega se todos os top-3 incluírem Mega e existir uma alternativa a no máximo 4 pontos de distância.

---

## 2. Replay Autopsy — Decision Review (`EvaluateReplayDecisionsService`)

Para cada turno do replay, compara o que foi jogado com todas as alternativas possíveis e atribui um veredicto.

### Pipeline por turno

**Reconstrução do estado:** HP atual, boosts, clima, terrain e screens são lidos diretamente do `ReplayTimeline` parsado.

**Ações conhecidas vs enumeradas:**
- *Played*: moves extraídos dos eventos `|move|` do replay.
- *Candidates*: todas as permutações de (meu Pokémon × move × alvo adversário), incluindo Protect.

**Score de uma linha** (`scoreLine`):

```
score = (damageDealtWeight  × dealt)
      − (damageTakenWeight  × effectiveTaken)
      + (koBonus            × koProbability)
      − (faintPenalty       × effectiveFaintProb)
```

Pesos default: `damageDealtWeight=1.0`, `damageTakenWeight=1.0`, `koBonus=30.0`, `faintPenalty=20.0`.

`dealt` e `effectiveTaken` = média dos 16 rolls de dano. Se um Pokémon jogar **Protect**, o dano que seria tomado por aquele slot é subtraído de `effectiveTaken` — o Protect é avaliado pelo dano que evita.

**Delta e veredicto:**

```
delta = bestAlternativeScore − playedScore
```

| Delta | Veredicto |
|---|---|
| ≤ 0.01 | `optimal` |
| ≤ 25.0 | `acceptable` |
| > 25.0 | `suboptimal` |

**Advisory:** dispara quando `faintProbability >= 0.8` **e** `bestScore <= 0.0` — o oponente tem >80% de chance de matar algo e nenhuma linha melhora o saldo. Feedback: "não há resposta vencedora — avalie se o bench cobre essa posição."

**Adaptation flags (BO3):** compara os leads do oponente entre games. Registra se o adversário re-liderou o mesmo duo após ganhar ou perder, e se o usuário mudou seu lead entre games.

---

## 3. Multi-Threat Spread Optimizer (`OptimizeAgainstThreatsService`)

Encontra a distribuição de SPs (HP / Def / SpDef, cap 66 total, máx 32 por stat) que melhor sobrevive a uma lista de ameaças, conforme o objetivo escolhido.

### Espaço de busca

Enumera todas as `SpreadTriple(spHp, spDef, spSpd)` com `total ≤ 66` e cada stat `≤ 32`. Para cada spread, testa naturezas candidatas selecionadas com base em pressão física/especial das ameaças.

### Score de um spread

Para cada ameaça, calcula `CalculateDamageResult` e extrai:

- `worstKoChance`: `max(koChanceProbability)` entre todas as ameaças
- `expectedDamageSum`: soma de `avgRoll / defHP × 100` de todas as ameaças

### Objetivos e comparador

| Goal | Ordenação primária | Desempate |
|---|---|---|
| `WORST_CASE_KO` | minimize `worstKoChance` | `expectedDamageSum` → total SP |
| `EXPECTED_DAMAGE_SUM` | minimize `expectedDamageSum` | `worstKoChance` → total SP |
| `SURVIVE_ALL` | tier mínimo de SP com `worstKoChance == 0` | `expectedDamageSum` → total SP |

O modo `SURVIVE_ALL` percorre os spreads tier a tier (0 SP, 1 SP, …) e para assim que encontra um spread que garanta sobrevivência em todas as ameaças, evitando varrer o espaço inteiro. Retorna os 3 melhores spreads distintos.
