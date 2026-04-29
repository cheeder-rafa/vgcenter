# Scoring Systems — Audit

Auditoria dos três sistemas documentados em [`scoring-systems.md`](./scoring-systems.md): Preview Coach, Replay Autopsy e Multi-Threat Optimizer. Cada item lista localização (`file:line`), problema observado e fix proposto.

## Premissas validadas no código

- `KoChanceResult` é record `(probability, hits)`; `hits` = mínimo de golpes para KO.
- `CalculateDamageService` / `DamageFormula.rolls()` **não considera accuracy** em momento algum (gera 16 valores 85–100% sem fator de acerto).
- `criticalHit` é hardcoded `false` em `EvaluateReplayDecisionsService.scoreLine` (~L303) e `OptimizeAgainstThreatsService.scoreThreats` (~L259); não há ponderação probabilística pelo 1/24.
- `koChanceProbability` em `OptimizeAgainstThreatResult` recebe o valor de `ohkoProbability(rolls, hp)` — é a probabilidade OHKO, **não** a probabilidade do n-HKO indicado por `KoChance.hits`.
- `RecommendPlansServiceTest` cobre comportamento (Mega muda ranking, support bonus muda ranking) mas **não** os valores numéricos dos pesos.

---

## Falhas críticas (correctness)

### C1. Wide Guard / Quick Guard atribuídos como Protect single-slot

**Onde:** `EvaluateReplayDecisionsService.java` L37–48 e L317–324.

`wideguard` / `quickguard` estão em `PROTECT_MOVE_IDS`, mas o ajuste só desconta `opponentImpact.takenBySlot().get(slot)` do *próprio slot do usuário do Wide Guard*. Quando o adversário usa Rock Slide / Earthquake / Heat Wave, Wide Guard salva os DOIS slots aliados — mas o score só credita um. Quick Guard idem para priority moves.

**Fix:** quando o move é Wide Guard, subtrair de `effectiveTaken` o dano de **todos** os spread moves do oponente, em todos os slots aliados; quando é Quick Guard, subtrair dano apenas de moves com prioridade > 0. Exige carregar `move.spread` e/ou prioridade dentro de `OpponentImpact`.

### C2. Status moves nunca podem ser a melhor alternativa no replay

**Onde:** `EvaluateReplayDecisionsService.java` L411 (`kind = "STATUS"`), L751 (`canCalculate` exige `ATTACK`), L291–311 (`scoreLine` só soma quando `canCalculate`).

Tailwind, Trick Room, Helping Hand, Follow Me, Rage Powder, Light Screen, Fake Tears, Charm — todos contribuem zero ao score. O "melhor turno" calculado pelo sistema é **sempre** uma combinação de ataques. Em VGC, turn-1 Tailwind é regularmente a jogada ótima e o autopsy nunca vai sugerir.

**Fix:** modelar valor de status moves. Caminho mínimo: tabela de bônus fixo por move-id (Tailwind: +20, Trick Room: +20, Helping Hand: bonus proporcional ao dano do parceiro, Follow Me/Rage Powder: dano redirecionado, etc.). Caminho ideal: simulação multi-turno. O caminho mínimo já cobre 80% dos casos reais.

Nota: Fake Out tem `basePower > 0` então é tratado como `ATTACK` — mas seu valor real é o flinch que cancela a ação inimiga, não o dano. Subestimado no score atual.

### C3. Accuracy ignorada nos três sistemas

**Onde:** `CalculateDamageService` / `DamageFormula.rolls()`.

Stone Edge (80%), Hydro Pump (80%), Focus Blast (70%), Hurricane (70%), Inferno (50%), Sleep Powder (75%) são tratados como 100% precisos. Consequências:

- **Preview Coach** "Your OHKOs" conta um Hydro Pump 80% como KO garantido.
- **Replay Autopsy** pode marcar Focus Blast como `optimal` quando Aura Sphere 90% era a escolha matematicamente melhor.
- **Optimizer** rotula spread como "guaranteed OHKO'd" por um Stone Edge que erra 1 em 5.

**Fix:** multiplicar `expectedDamage` por accuracy efetiva (acc × evasion stage); em `koChance.probability` aplicar `accuracy × p_ko_given_hit`. Implementar no nível de `CalculateDamageService` — uma única mudança beneficia os três sistemas.

---

## Problemas médios (modelagem)

### M1. `worstKoChance` é só OHKO probabilístico, mas tratado como "perigo de KO"

**Onde:** `OptimizeAgainstThreatsService.java` L181–184, L269.

O nome sugere "chance de ser nocauteado por essa ameaça" mas o valor é apenas `count(roll >= hp) / 16`. Um spread que toma 95% no max-roll é tratado como `worstKoChance = 0.0` ("guaranteed survival") quando crit (1/24), multi-hit ou um próximo turno derrubam sem dificuldade.

**Fix:** renomear o campo para `ohkoProbability` na resposta e expor `nearKoMargin` (quão perto do KO o pior roll chega). Em `SURVIVE_ALL`, considerar margem residual ≥ 5% HP como filtro para "sobrevivência robusta".

### M2. Crit ignorado em probabilidade

**Onde:** `CalculateDamageService` (flag `criticalHit` boolean).

Com base crit rate 1/24 (~4.2%), spreads marcados como "guaranteed survival" perdem para crit em ~4% das vezes. Pior em moves com crit boost (Frost Breath, Storm Throw = sempre crit) ou usuários com Super Luck / Focus Energy / Scope Lens.

**Fix:** computar `expected = (23/24) × normalDamage + (1/24) × critDamage` na agregação, ou expor `koProbabilityWithCrit` separado. Para moves always-crit, usar 100% crit weight.

### M3. Preview "best move" escolhe pelo `maxPct`, não pelo dano esperado

**Onde:** `EvaluateLeadsService.java` L107–112.

Um move com min 30% / max 95% bate um move com min 70% / max 80% — mesmo o segundo sendo mais consistente e tendo expected damage maior. As métricas downstream (`koPressure`, `doubleUpPressure`) então contam OHKOs frágeis como reais.

**Fix:** trocar critério para média dos rolls × accuracy. Adicionalmente, calcular `koPressure` e `twoHitKoPressure` por probabilidade (e.g. ≥50% chance de KO conta) em vez de "min hits ≤ N" — `koChance.hits` é o número de golpes para KO no pior caso, não no caso esperado.

### M4. `koProbability` somado pode exceder 1.0 e infla o bonus em replay

**Onde:** `EvaluateReplayDecisionsService.java` L289, L310.

`koProbability += result.koChance().probability()` para cada ação. Em doubles, 2 ações com 70% KO prob cada → `koProbability = 1.4` → bonus = `30.0 × 1.4 = 42`. O peso `koBonus = 30.0` foi calibrado para representar 1 KO, não 1.4 KOs.

**Fix:** clamp `min(koProbability, kos_avaliados)` ou `koBonus × (1 - prod(1 - p_i))` (probabilidade de pelo menos um KO).

### M5. Speed comparison sempre favorece o usuário em empate

**Onde:** `EvaluateLeadsService.java` L199–204 (`>= opponent`).

Speed ties em VGC são 50/50 reais. Iron Hands 95 base contra outro Iron Hands 95 base é tratado como "user faster" garantido. Skews `speedComparison` upward and `mustReactLabels` downward.

**Fix:** distinguir três casos (faster, slower, tied); reportar tied como métrica separada ou contar como 0.5.

### M6. Verdict thresholds não são normalizados

**Onde:** `EvaluateReplayDecisionsService.java` L625–633.

Delta 25.0 vale tanto para "best=120, played=95" (perda relativa pequena) quanto para "best=27, played=2" (perda relativa imensa). Turnos late-game com pouco HP em jogo geram scores baixos absolutos onde 25 pontos é catastrófico.

**Fix:** normalizar pelo melhor possível (`delta / max(|best|, 1)`) ou pela faixa de scores enumerados no turno (`delta / (bestScore - worstScore)`).

### M7. SURVIVE_ALL para no primeiro tier com sobrevivente

**Onde:** `OptimizeAgainstThreatsService.java` L121–136.

Se tier 12 tem 1 spread sobrevivente com expected damage 90%, o loop para. Tier 14 poderia ter um sobrevivente com expected damage 60% — não é considerado. É defensável (minimize SP) mas a doc atual sugere "melhor sobrevivente."

**Fix opcional:** continuar até `tier_atual + 4` para permitir spreads marginalmente mais caros mas com dano esperado significativamente menor. Documentar o tradeoff explicitamente.

---

## Polish / cleanup

- **B1.** `OptimizeAgainstThreatsService.java` L281–296: tiebreaker tem `s.candidate().totalSp()` E `spHp + spDef + spSpd` — são o mesmo número. Linha redundante.
- **B2.** `RecommendPlansService.java` weights (`4, 1, -3, +5, +2, -6, +3, +2, +1`) não têm teste numérico. Adicionar `RecommendPlansScoreWeightsTest` que assert valores conhecidos para cenários sintéticos previne regressão.
- **B3.** `EvaluateReplayDecisionsService` não modela switches. "Should I have switched?" é uma das perguntas mais frequentes em replay review e nunca é proposta como alternativa.
- **B4.** Recoil (Brave Bird, Wood Hammer, Flare Blitz) não tem ajuste; usar Wood Hammer 100% sempre vence Wood Hammer + Protect na próxima por não considerar HP perdido próprio.
- **B5.** Preview score não penaliza time mono-categoria (só físicos OU só especiais), vulnerável a Intimidate/burn ou Calm Mind.

---

## Recomendação de prioridade

Para um sprint focado, sugestão de ordem:

1. **C3 (accuracy)** — uma mudança em `CalculateDamageService` propaga benefícios para os três sistemas.
2. **C1 (Wide Guard)** — bug claro, fácil de testar com replay fixture.
3. **C2 (status moves no replay)** — caminho mínimo (lookup table de bonus por move-id) é viável em ~1 dia e fecha o gap mais visível do autopsy.
4. **M3 (Preview best move = expected, não max)** — mudança pequena, alto impacto em qualidade de recomendação.
5. **M4 (clamp `koProbability`)** — ajuste de uma linha, calibração imediata.

Demais itens ficam como follow-ups.

## Arquivos críticos

- `backend/src/main/java/com/vgcenter/damagecalc/application/usecase/CalculateDamageService.java` — accuracy/crit (C3, M2)
- `backend/src/main/java/com/vgcenter/damagecalc/domain/.../DamageFormula.java` — formula central
- `backend/src/main/java/com/vgcenter/damagecalc/application/usecase/EvaluateReplayDecisionsService.java` — C1, C2, M4, M6, B3
- `backend/src/main/java/com/vgcenter/damagecalc/application/usecase/EvaluateLeadsService.java` — M3, M5
- `backend/src/main/java/com/vgcenter/damagecalc/application/usecase/OptimizeAgainstThreatsService.java` — M1, M7, B1
- `backend/src/main/java/com/vgcenter/damagecalc/application/usecase/RecommendPlansService.java` — B2, B5
- `backend/src/main/java/com/vgcenter/damagecalc/application/usecase/ReplayScoringWeights.java` — recalibração após M4

## Verificação ao implementar

- `./mvnw verify` deve continuar verde após cada mudança.
- **C3:** property test em `DamageFormulaPropertiesTest` garantindo `expected ≤ baseExpected` para qualquer accuracy < 100%.
- **C1:** replay fixture com Wide Guard (criar uma se não existir) + snapshot test em `EvaluateReplayDecisionsServiceTest` para o turno em questão.
- **C2:** snapshot test em `EvaluateReplayDecisionsServiceTest` mostrando Tailwind aparecendo como melhor alternativa em um turno onde o usuário atacou e o cálculo confirma que setup era melhor.
- **M3:** golden test em `EvaluateLeadsServiceTest` com move alta-variância vs move consistente, asserting que o consistente é escolhido.
