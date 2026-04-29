# Scoring Systems Technical (v1.3)
Status: pós-correções M14a, M14b, M14c, M14d, M14e.
Este documento registra o comportamento técnico atual dos sistemas de scoring do VGCenter.
Escopo:
- Preview Coach.
- Replay Autopsy.
- Multi-Threat Spread Optimizer.
Objetivos:
- consolidar o comportamento pós-fix.
- mapear fórmulas e decisões para `file:line`.
- registrar contratos de API e compatibilidade.
Não é escopo:
- simulação completa multi-turno de doubles.
---
## 1) Rastreabilidade de versão
v1.3 (Scoring Systems Hardening) foi entregue em cinco marcos:
- M14a (accuracy + crit no core): merge `e6c7a15`.
- M14b (replay correctness): merge `12cfefd`.
- M14c (optimizer modelling): merge `88c8355`.
- M14d (preview modelling): merge `b487eda`.
- M14e (cleanup + docs): este marco.
IDs do audit cobertos:
- M14a: C3, M2.
- M14b: C1, C2, M4, M6, B3, B4.
- M14c: M1, M7, B1.
- M14d: M3, M5, B2, B5.
- M14e: cleanup final + documentação.
Fonte de contexto:
- `docs/scoring-systems.md`.
- `docs/scoring-systems-audit.md`.
---
## 2) Arquitetura de scoring
### 2.1 Camadas
Regras de dependência:
- `domain`: fórmula pura.
- `application`: orquestra scoring e use cases.
- `web`: DTO/mappers.
Impacto no scoring:
- o mesmo núcleo de dano alimenta Preview, Replay e Optimizer.
- ajuste no core propaga para todos os consumidores.
- contratos externos ficam no `web.dto`, sem leak de domínio.
### 2.2 Núcleo compartilhado
Fluxo comum:
1. `CalculateDamageService.calculate(...)`.
2. `DamageFormula.rolls(...)`.
3. agregações (`expectedDamage`, `koProbability`, `koProbabilityWithCrit`).
4. retorno em `CalculateDamageResult`.
Referências:
- `backend/src/main/java/com/vgcenter/damagecalc/application/usecase/CalculateDamageService.java:23`.
- `backend/src/main/java/com/vgcenter/damagecalc/domain/formula/DamageFormula.java:11`.
- `backend/src/main/java/com/vgcenter/damagecalc/application/usecase/CalculateDamageResult.java:3`.
---
## 3) Damage core pós-M14a
### 3.1 Mudanças centrais
Antes:
- accuracy ignorada no expected e no OHKO.
- crit só entrava quando `criticalHit=true`.
Agora:
- accuracy aplicada no expected e KO.
- crit ponderado por taxa probabilística.
- moves always-crit forçam peso crítico de 100%.
### 3.2 Accuracy no domínio
Normalização:
- `clamp(accuracy, 0.0, 1.0)`.
Referência:
- `DamageFormula.normalizedAccuracy(...)` em `.../DamageFormula.java:250`.
Expected:
- `mean(rolls) * normalizedAccuracy`.
Referência:
- `.../DamageFormula.java:25`.
OHKO:
- `normalizedAccuracy * (lethalRolls / totalRolls)`.
Referência:
- `.../DamageFormula.java:36`.
### 3.3 Crit probabilístico
Composição:
- `koTotal = (1-critRate)*koNormal + critRate*koCrit`.
Referência:
- `.../DamageFormula.java:49`.
No service:
- crit base `1/24`.
- always-crit ou flag manual -> `critRate=1.0`.
Referências:
- `.../CalculateDamageService.java:25`.
- `.../CalculateDamageService.java:31`.
- `.../CalculateDamageService.java:59`.
Expected com crit:
- `weightedExpectedDamage(...)`.
Referência:
- `.../CalculateDamageService.java:109`.
### 3.4 Always-crit moves
Contrato:
- quando move tem `alwaysCrit=true`, o branch crítico é usado como distribuição efetiva.
- resultado coincide com `criticalHit=true` manual.
Teste:
- `backend/src/test/java/com/vgcenter/damagecalc/application/usecase/CalculateDamageServiceTest.java:290`.
### 3.5 TODO explícito
Ainda não implementado:
- Super Luck.
- Focus Energy.
- Scope Lens.
Referência:
- `.../CalculateDamageService.java:58`.
### 3.6 Contrato HTTP
`CalculateDamageResponseDto` contém:
- `accuracy`.
- `expectedDamageWithAccuracy`.
- `koProbabilityWithCrit`.
Referência:
- `backend/src/main/java/com/vgcenter/damagecalc/web/dto/CalculateDamageResponseDto.java:3`.
Mapeamento:
- `backend/src/main/java/com/vgcenter/damagecalc/web/mapper/DamageCalculationWebMapper.java:86`.
### 3.7 Propriedades matemáticas
Property test 1:
- para `acc<1`, expected nunca maior que expected em `acc=1`.
Property test 2:
- em contexto não-resistido, KO com crit é `>=` KO sem crit.
Referência:
- `backend/src/test/java/com/vgcenter/damagecalc/domain/formula/DamageFormulaPropertiesTest.java:23`.
---
## 4) Replay Autopsy pós-M14b
### 4.1 Pipeline
Por turno:
1. lê estado.
2. resolve ações jogadas.
3. enumera ações candidatas.
4. computa score de cada linha.
5. emite delta/veredicto/advisory.
Entry point:
- `.../EvaluateReplayDecisionsService.java:98`.
### 4.2 Ações candidatas
Kinds modelados:
- `ATTACK`
- `PROTECT`
- `WIDE_GUARD`
- `QUICK_GUARD`
- `STATUS`
- `SWITCH`
Referências:
- resolução de kind: `.../EvaluateReplayDecisionsService.java:807`.
- enumeração de candidatos: `.../EvaluateReplayDecisionsService.java:494`.
- adição de switch: `.../EvaluateReplayDecisionsService.java:512`.
### 4.3 C1 resolvido (Wide Guard / Quick Guard)
Implementação atual:
- `OpponentImpact` guarda lista de `OpponentHit`.
- `WIDE_GUARD` bloqueia todo hit com `spreadMove=true`.
- `QUICK_GUARD` bloqueia todo hit com `priorityMove=true`.
- `PROTECT` bloqueia hits direcionados ao próprio slot.
Referências:
- `.../EvaluateReplayDecisionsService.java:369`.
- `.../EvaluateReplayDecisionsService.java:379`.
- `.../EvaluateReplayDecisionsService.java:386`.
- `.../EvaluateReplayDecisionsService.java:826`.
- `.../EvaluateReplayDecisionsService.java:854`.
Efeito:
- crédito de guard deixa de ser single-slot para ataques spread/prioridade.
### 4.4 C2 resolvido (status move value)
Tabela fixa em `STATUS_MOVE_VALUES`:
- tailwind 20.
- trickroom 20.
- helpinghand 12.
- followme 16.
- ragepowder 16.
- reflect 10.
- lightscreen 10.
- auroraveil 12.
- wideguard 12.
- quickguard 10.
Referência:
- `.../EvaluateReplayDecisionsService.java:67`.
Aplicação:
- `utilityValue(...)` soma bônus para status/protect/guard.
- fake out recebe utilidade em `ATTACK_UTILITY_VALUES`.
Referências:
- `.../EvaluateReplayDecisionsService.java:78`.
- `.../EvaluateReplayDecisionsService.java:859`.
### 4.5 M4 resolvido (KO probability não soma acima de 1)
Regras:
- usa união de probabilidades: `1 - Π(1-p_i)`.
- clamp final para `[0,1]`.
Referências:
- `.../EvaluateReplayDecisionsService.java:367`.
- `.../EvaluateReplayDecisionsService.java:888`.
- `.../EvaluateReplayDecisionsService.java:897`.
### 4.6 M6 resolvido (veredicto relativo)
Regra:
- `relativeDelta = delta / max(abs(bestScore), 1.0)`.
Thresholds:
- `<=0.01`: optimal.
- `<=0.25`: acceptable.
- `>0.25`: suboptimal.
Referência:
- `.../EvaluateReplayDecisionsService.java:726`.
### 4.7 B3 resolvido (switch candidato)
Switch agora:
- sempre presente em `candidateActions`.
- recebe custo de oportunidade `-5.0`.
Referências:
- `.../EvaluateReplayDecisionsService.java:64`.
- `.../EvaluateReplayDecisionsService.java:336`.
- `.../EvaluateReplayDecisionsService.java:512`.
### 4.8 B4 resolvido (recoil no score)
Implementação:
- move de recoil identificado por ID.
- recoil = `1/3` do dano esperado da ação.
- recoil entra em `effectiveTaken`.
- pode gerar faint próprio.
Referências:
- `.../EvaluateReplayDecisionsService.java:62`.
- `.../EvaluateReplayDecisionsService.java:65`.
- `.../EvaluateReplayDecisionsService.java:358`.
- `.../EvaluateReplayDecisionsService.java:408`.
### 4.9 Accuracy/always-crit no Replay
Replay converte move com:
- `accuracy`.
- `alwaysCrit`.
Referência:
- `.../EvaluateReplayDecisionsService.java:565`.
Isso garante:
- replay consome o mesmo core de accuracy/crit do endpoint de damage.
### 4.10 Advisory
Condição de disparo:
- faint pressure >= 0.8.
- melhor score <= 0.
Referência:
- `.../EvaluateReplayDecisionsService.java:762`.
### 4.11 Cobertura de teste (replay)
Arquivo:
- `backend/src/test/java/com/vgcenter/damagecalc/application/usecase/EvaluateReplayDecisionsServiceTest.java`.
Anchors:
- status/fixtures: `:308`.
- verdict relativo: `:358`.
- switch com custo: `:362`.
- recoil: `:392`.
---
## 5) Multi-Threat Optimizer pós-M14c
### 5.1 Pipeline
Entrada:
- defender.
- threats.
- goal.
Processo:
1. resolve species/moves/natures.
2. gera spreads legais.
3. score por threat.
4. agrega.
5. ordena por goal.
Entry point:
- `.../OptimizeAgainstThreatsService.java:45`.
### 5.2 M1 resolvido (naming e semântica)
Campo canônico:
- `ohkoProbability`.
Novo campo:
- `nearKoMargin`.
Sem alias legado no DTO final.
Referências:
- `.../OptimizeAgainstThreatResult.java:3`.
- `.../DefenseSpreadCandidate.java:3`.
- `.../OptimizeAgainstThreatResultDto.java:3`.
- `.../DefenseSpreadCandidateDto.java:3`.
### 5.3 nearKoMargin
Definição:
- `nearKoMargin = 100 - maxDamagePct`.
Aplicação:
- em cada ameaça.
- no candidato agregado.
Referências:
- `.../OptimizeAgainstThreatsService.java:202`.
- `.../OptimizeAgainstThreatsService.java:276`.
### 5.4 M7 resolvido (lookahead SURVIVE_ALL)
Regra:
- ao achar primeiro tier sobrevivente, continua até `tier + 4`.
Referências:
- constante: `.../OptimizeAgainstThreatsService.java:24`.
- parada: `.../OptimizeAgainstThreatsService.java:140`.
### 5.5 B1 resolvido (tie-break redundante)
Comparator não repete `totalSp` por soma manual redundante.
Referência:
- `.../OptimizeAgainstThreatsService.java:290`.
### 5.6 Comparadores por goal
`WORST_CASE_KO`:
- min `ohkoProbability`.
- tie: `expectedDamageSum`.
- tie: `totalSp`.
`EXPECTED_DAMAGE_SUM`:
- min `expectedDamageSum`.
- tie: `ohkoProbability`.
- tie: `totalSp`.
`SURVIVE_ALL`:
- min `expectedDamageSum`.
- tie: `nearKoMargin` desc.
- tie: `totalSp`.
Referências:
- `.../OptimizeAgainstThreatsService.java:292`.
- `.../OptimizeAgainstThreatsService.java:297`.
- `.../OptimizeAgainstThreatsService.java:300`.
### 5.7 Accuracy/crit em threat prep
Threat move command usa:
- accuracy do dataset.
- alwaysCrit do dataset.
Referência:
- `.../OptimizeAgainstThreatsService.java:110`.
Observação de modelagem:
- `expectedDamagePct` local do optimizer ainda usa média bruta dos rolls.
- `ohkoProbability` local ainda é OHKO por roll vs HP.
Referências:
- `.../OptimizeAgainstThreatsService.java:274`.
- `.../OptimizeAgainstThreatsService.java:327`.
### 5.8 Testes de optimizer
Arquivo:
- `backend/src/test/java/com/vgcenter/damagecalc/application/usecase/OptimizeAgainstThreatsServiceTest.java`.
Anchors:
- survive-all com OHKO zero: `:85`.
- nearKoMargin consistente: `:114`.
---
## 6) Preview Coach pós-M14d
### 6.1 M3 resolvido (best move por expected*accuracy)
Seleção de melhor evidência:
- `max(average(rolls) * move.accuracy())`.
Referências:
- `.../EvaluateLeadsService.java:107`.
- `.../EvaluateLeadsService.java:110`.
- `.../EvaluateLeadsService.java:266`.
### 6.2 M3 resolvido (koPressure probabilístico)
Critério de contagem:
- `hits <= N` e `probability >= 0.5`.
Referência:
- `.../EvaluateLeadsService.java:173`.
### 6.3 M5 resolvido (speed tie explícito)
Comparação produz:
- faster.
- slower.
- tied.
Referências:
- `.../EvaluateLeadsService.java:194`.
- `.../EvaluateLeadsService.java:261`.
### 6.4 B2 resolvido (pesos travados)
Teste numérico dedicado:
- win condition +2 lead / +6 backline.
- support cap +6.
- mega +5 (+2 se lead).
- sem mega -6.
Referência:
- `backend/src/test/java/com/vgcenter/damagecalc/application/usecase/RecommendPlansScoreWeightsTest.java:15`.
### 6.5 B5 resolvido (mono-categoria -4)
Regra:
- se 3/4 do bring for físico-only -> `-4`.
- se 3/4 do bring for special-only -> `-4`.
Referências:
- `.../RecommendPlansService.java:135`.
- `.../RecommendPlansService.java:142`.
Teste:
- `.../RecommendPlansScoreWeightsTest.java:63`.
---
## 7) API pós-cleanup (M14e)
### 7.1 Damage endpoint
`POST /api/v1/damage/calculate` expõe:
- `rolls`
- `min`
- `max`
- `minPct`
- `maxPct`
- `accuracy`
- `expectedDamageWithAccuracy`
- `koProbabilityWithCrit`
- `koChance`
Referência:
- `backend/src/main/java/com/vgcenter/damagecalc/web/dto/CalculateDamageResponseDto.java:3`.
### 7.2 Optimize-against-threats endpoint
Campos canônicos:
- `ohkoProbability`
- `nearKoMargin`
Alias removido:
- `koChanceProbability`
Referências:
- `backend/src/main/java/com/vgcenter/damagecalc/web/dto/OptimizeAgainstThreatResultDto.java:3`.
- `backend/src/main/java/com/vgcenter/damagecalc/web/dto/DefenseSpreadCandidateDto.java:3`.
- `backend/src/main/java/com/vgcenter/damagecalc/web/mapper/CalcOptimizerWebMapper.java:92`.
### 7.3 Frontend sincronizado
Arquivos migrados:
- `frontend/src/features/calculator/api/optimizerApi.ts`.
- `frontend/src/features/calculator/components/SpreadOptimizerPanel.tsx`.
- `frontend/tests/component/calculator/SpreadOptimizerPanel.test.tsx`.
Pontos:
- KO% no painel usa `ohkoProbability`.
- mocks incluem `nearKoMargin`.
### 7.4 Dataset source of truth
Moves vêm de:
- `backend/src/main/resources/data/regulation-m-a/moves.json`.
Campos relevantes:
- `accuracy`
- `alwaysCrit`
Uso:
- replay: `.../EvaluateReplayDecisionsService.java:574`.
- optimizer: `.../OptimizeAgainstThreatsService.java:118`.
---
## 8) Fórmulas e invariantes
### 8.1 Fórmula de expected (core)
`expectedDamage = mean(rolls) * clamp(acc)`.
### 8.2 Fórmula de OHKO com accuracy (core)
`koProbability = clamp(acc) * p(roll >= hp | hit)`.
### 8.3 Fórmula de mistura com crit (core)
`weighted = (1-critRate)*normal + critRate*crit`.
Aplicado em:
- expected.
- OHKO probability.
### 8.4 Fórmula de união de probabilidade (replay)
`p(any) = 1 - Π(1 - p_i)`.
Aplicado em:
- KO da linha.
- faint da linha.
### 8.5 Fórmula de delta relativo (replay)
`deltaRel = deltaAbs / max(abs(best),1)`.
### 8.6 nearKoMargin (optimizer)
`nearKoMargin = 100 - maxDamagePct`.
### 8.7 Invariantes de produto
- accuracy menor nunca aumenta expected.
- incluir componente crítica nunca reduz probabilidade agregada de KO.
- replay não soma probabilidades acima de 100%.
- switch sempre aparece como alternativa válida.
- preview não trata tie de speed como "você é mais rápido".
- optimizer usa naming explícito (`ohkoProbability`).
---
## 9) Mapeamento direto audit -> implementação
### C1
- resolvido em replay guard blocking multi-slot.
- `.../EvaluateReplayDecisionsService.java:379`.
- `.../EvaluateReplayDecisionsService.java:386`.
### C2
- resolvido em status move values.
- `.../EvaluateReplayDecisionsService.java:67`.
- `.../EvaluateReplayDecisionsService.java:859`.
### C3
- resolvido no core de dano.
- `.../DamageFormula.java:25`.
- `.../DamageFormula.java:36`.
### M1
- resolvido por renome semântico + margem.
- `.../OptimizeAgainstThreatResult.java:9`.
- `.../OptimizeAgainstThreatResult.java:10`.
### M2
- resolvido por weighting de crit.
- `.../DamageFormula.java:49`.
- `.../CalculateDamageService.java:61`.
### M3
- resolvido em best move por expected*accuracy.
- `.../EvaluateLeadsService.java:110`.
### M4
- resolvido por união de probabilidades.
- `.../EvaluateReplayDecisionsService.java:367`.
- `.../EvaluateReplayDecisionsService.java:888`.
### M5
- resolvido por faster/slower/tied.
- `.../EvaluateLeadsService.java:208`.
### M6
- resolvido por threshold relativo.
- `.../EvaluateReplayDecisionsService.java:727`.
### M7
- resolvido por lookahead +4 tiers.
- `.../OptimizeAgainstThreatsService.java:24`.
- `.../OptimizeAgainstThreatsService.java:140`.
### B1
- resolvido por cleanup de comparator.
- `.../OptimizeAgainstThreatsService.java:290`.
### B2
- resolvido por teste numérico.
- `.../RecommendPlansScoreWeightsTest.java:15`.
### B3
- resolvido por candidato SWITCH com custo.
- `.../EvaluateReplayDecisionsService.java:512`.
- `.../EvaluateReplayDecisionsService.java:336`.
### B4
- resolvido por recoil contabilizado.
- `.../EvaluateReplayDecisionsService.java:358`.
- `.../EvaluateReplayDecisionsService.java:408`.
### B5
- resolvido por penalidade mono-categoria.
- `.../RecommendPlansService.java:135`.
---
## 10) Contratos internos relevantes
### 10.1 `CalculateDamageResult`
Campos:
- `rolls`
- `min`
- `max`
- `minPct`
- `maxPct`
- `koChance`
- `accuracy`
- `expectedDamageWithAccuracy`
- `koProbabilityWithCrit`
Referência:
- `backend/src/main/java/com/vgcenter/damagecalc/application/usecase/CalculateDamageResult.java:3`.
### 10.2 DTO optimizer
`DefenseSpreadCandidateDto`:
- `ohkoProbability`
- `nearKoMargin`
`OptimizeAgainstThreatResultDto`:
- `ohkoProbability`
- `nearKoMargin`
Referências:
- `.../DefenseSpreadCandidateDto.java:3`.
- `.../OptimizeAgainstThreatResultDto.java:3`.
### 10.3 Mapper de optimizer
`CalcOptimizerWebMapper` mapeia domain->DTO com campos canônicos.
Referência:
- `.../CalcOptimizerWebMapper.java:92`.
---
## 11) Comportamento operacional por sistema
### 11.1 Preview Coach
Entrada:
- my team 6.
- opponent team 6.
- field.
Pipeline:
1. calcula matriz 6x6 (best outgoing + best incoming).
2. score de cada lead pair.
3. score de cada bring-4 e melhor lead.
4. aplica diversidade + mega escape valve.
5. retorna top-3.
Sinais fortes no score:
- pressão ofensiva.
- segurança de incoming.
- suporte.
- win condition.
- mega policy.
- penalidade mono-categoria.
### 11.2 Replay Autopsy
Entrada:
- uma ou mais timelines.
Pipeline:
1. resolve species/moves conhecidos.
2. calcula impacto adversário do turno.
3. score da linha jogada.
4. enumera combinações candidatas.
5. rankeia alternativas.
6. classifica veredicto por delta relativo.
Fatores de score:
- dano dado.
- dano recebido efetivo.
- chance de pelo menos um KO.
- chance de faint.
- utilidade de status/guard.
- custo de switch.
- recoil.
### 11.3 Multi-Threat Optimizer
Entrada:
- defender build.
- lista de threats.
- goal.
Pipeline:
1. resolve combatants e move definitions.
2. enumera spreads legais (cap 66 total, 32/stat).
3. testa natures candidatas.
4. avalia cada threat.
5. agrega para candidato.
6. ordena conforme goal.
7. retorna top-3 distintos.
---
## 12) Cobertura de testes e verificação
### 12.1 Property tests
Arquivo:
- `backend/src/test/java/com/vgcenter/damagecalc/domain/formula/DamageFormulaPropertiesTest.java`.
Protege:
- monotonicidade de accuracy.
- monotonicidade de crit.
### 12.2 Service tests (damage)
Arquivo:
- `backend/src/test/java/com/vgcenter/damagecalc/application/usecase/CalculateDamageServiceTest.java`.
Protege:
- campos novos de resultado.
- always-crit equivalente a crit forçado.
### 12.3 Service tests (replay)
Arquivo:
- `backend/src/test/java/com/vgcenter/damagecalc/application/usecase/EvaluateReplayDecisionsServiceTest.java`.
Protege:
- guard correctness.
- status move valuation.
- switch candidate.
- recoil accounting.
- verdict relativo.
### 12.4 Service tests (optimizer)
Arquivo:
- `backend/src/test/java/com/vgcenter/damagecalc/application/usecase/OptimizeAgainstThreatsServiceTest.java`.
Protege:
- `ohkoProbability`.
- `nearKoMargin`.
- `SURVIVE_ALL` behavior.
### 12.5 Service tests (preview/recommend)
Arquivos:
- `EvaluateLeadsServiceTest`.
- `RecommendPlansScoreWeightsTest`.
Protege:
- expected*accuracy choice.
- speed tie annotation.
- pesos numéricos.
- penalidade mono-categoria.
### 12.6 Frontend tests
Arquivo:
- `frontend/tests/component/calculator/SpreadOptimizerPanel.test.tsx`.
Protege:
- novo schema de optimizer.
- render de KO% via `ohkoProbability`.
---
## 13) Tradeoffs atuais e limites conhecidos
### 13.1 Replay não simula árvore multi-turno completa
Estado:
- avaliação de turno isolado.
- valores de status são heurísticos.
Racional:
- baixa latência.
- comportamento estável.
### 13.2 Status move value table é estática
Estado:
- valores fixos por move-id.
Risco:
- drift por metagame.
Mitigação:
- tabela é pequena e testável.
- recalibração é local.
### 13.3 Crit stages avançados continuam TODO
Estado:
- core pronto para `critRate`.
- faltam integradores de estágio/item/ability.
### 13.4 Optimizer expected local
Estado:
- `expectedDamagePct` em optimizer usa média dos rolls locais.
Implicação:
- não usa diretamente `expectedDamageWithAccuracy` no agregador local.
---
## 14) Guia de manutenção
### 14.1 Quando alterar o core de dano
Checklist:
1. ajustar property tests.
2. ajustar `CalculateDamageServiceTest`.
3. revisar efeito em replay/preview/optimizer.
4. revisar contratos web.
### 14.2 Quando alterar replay scoring
Checklist:
1. preservar união de probabilidades.
2. preservar custo explícito de switch.
3. preservar recoil em dano recebido.
4. revisar thresholds relativos.
5. cobrir com fixture de setup.
### 14.3 Quando alterar optimizer
Checklist:
1. manter naming canônico.
2. manter `nearKoMargin`.
3. manter ou justificar mudança no lookahead.
4. validar ordenação por goal.
### 14.4 Quando alterar preview/recommend
Checklist:
1. manter best-move por expected*accuracy.
2. manter diferenciação de speed tie.
3. manter testes numéricos de score.
4. manter penalidade mono-categoria.
---
## 15) Mudanças específicas de M14e
### 15.1 Cleanup de DTOs
Removido:
- `koChanceProbability` dos DTOs de optimizer.
Arquivos:
- `backend/src/main/java/com/vgcenter/damagecalc/web/dto/DefenseSpreadCandidateDto.java`.
- `backend/src/main/java/com/vgcenter/damagecalc/web/dto/OptimizeAgainstThreatResultDto.java`.
- `backend/src/main/java/com/vgcenter/damagecalc/web/mapper/CalcOptimizerWebMapper.java`.
### 15.2 Migração frontend
Arquivos:
- `frontend/src/features/calculator/api/optimizerApi.ts`.
- `frontend/src/features/calculator/components/SpreadOptimizerPanel.tsx`.
- `frontend/tests/component/calculator/SpreadOptimizerPanel.test.tsx`.
### 15.3 Fechamento documental
Atualizações exigidas por M14e:
- `docs/scoring-systems.md`.
- `docs/scoring-systems-audit.md`.
- `docs/scoring-systems-technical.md` (este arquivo).
- `README.md`.
---
## 16) FAQ técnica
### 16.1 Por que manter `koChance` e `koProbabilityWithCrit`?
Porque medem coisas diferentes:
- `koChance`: descrição clássica com hits mínimos.
- `koProbabilityWithCrit`: OHKO probabilístico com accuracy + crit.
### 16.2 `WORST_CASE_KO` ainda existe no enum. Isso está errado?
Não.
- é nome de objetivo de API.
- o output público foi corrigido para `ohkoProbability`.
### 16.3 `nearKoMargin` pode ser negativo?
Sim.
- acontece quando `maxDamagePct > 100`.
### 16.4 Replay considera accuracy/evasion stages de forma completa?
Ainda não.
- boosts existem no estado.
- integração numérica de stages de acc/evasion no expected/KO não está fechada.
### 16.5 A tabela de status values é definitiva?
Não.
- é baseline v1.3 para sair de score zero de setup.
- pode evoluir com calibragem futura.
---
## 17) Roadmap técnico pós-v1.3
1. Crit pipeline completo (stages + itens + abilities).
2. Accuracy/evasion stage integration no core.
3. Replay lookahead limitado (depth 2) para setup.
4. Optimizer alinhado com `expectedDamageWithAccuracy`.
5. Status value contextual (board-aware) sem explosão de custo.
---
## 18) Conclusão
v1.3 fecha os principais gaps de scoring apontados no audit:
- accuracy e crit foram centralizados no core.
- replay passou a modelar guard/status/switch/recoil corretamente.
- optimizer ganhou semântica precisa (`ohkoProbability`) e `nearKoMargin`.
- preview passou a privilegiar expected*accuracy e a tratar speed ties de forma explícita.
M14e completa o ciclo removendo campos legados de contrato já migrado e consolidando a documentação técnica pós-fix.
---
## 19) Índice de referências (`file:line`)
### 19.1 Core
- `backend/src/main/java/com/vgcenter/damagecalc/domain/formula/DamageFormula.java:25`
- `backend/src/main/java/com/vgcenter/damagecalc/domain/formula/DamageFormula.java:36`
- `backend/src/main/java/com/vgcenter/damagecalc/domain/formula/DamageFormula.java:49`
- `backend/src/main/java/com/vgcenter/damagecalc/application/usecase/CalculateDamageService.java:25`
- `backend/src/main/java/com/vgcenter/damagecalc/application/usecase/CalculateDamageService.java:31`
- `backend/src/main/java/com/vgcenter/damagecalc/application/usecase/CalculateDamageService.java:57`
- `backend/src/main/java/com/vgcenter/damagecalc/application/usecase/CalculateDamageService.java:58`
- `backend/src/main/java/com/vgcenter/damagecalc/application/usecase/CalculateDamageService.java:60`
- `backend/src/main/java/com/vgcenter/damagecalc/application/usecase/CalculateDamageService.java:61`
- `backend/src/main/java/com/vgcenter/damagecalc/application/usecase/CalculateDamageService.java:109`
- `backend/src/main/java/com/vgcenter/damagecalc/application/usecase/CalculateDamageResult.java:3`
- `backend/src/main/java/com/vgcenter/damagecalc/web/dto/CalculateDamageResponseDto.java:3`
### 19.2 Replay
- `backend/src/main/java/com/vgcenter/damagecalc/application/usecase/EvaluateReplayDecisionsService.java:37`
- `backend/src/main/java/com/vgcenter/damagecalc/application/usecase/EvaluateReplayDecisionsService.java:47`
- `backend/src/main/java/com/vgcenter/damagecalc/application/usecase/EvaluateReplayDecisionsService.java:48`
- `backend/src/main/java/com/vgcenter/damagecalc/application/usecase/EvaluateReplayDecisionsService.java:62`
- `backend/src/main/java/com/vgcenter/damagecalc/application/usecase/EvaluateReplayDecisionsService.java:64`
- `backend/src/main/java/com/vgcenter/damagecalc/application/usecase/EvaluateReplayDecisionsService.java:67`
- `backend/src/main/java/com/vgcenter/damagecalc/application/usecase/EvaluateReplayDecisionsService.java:78`
- `backend/src/main/java/com/vgcenter/damagecalc/application/usecase/EvaluateReplayDecisionsService.java:98`
- `backend/src/main/java/com/vgcenter/damagecalc/application/usecase/EvaluateReplayDecisionsService.java:317`
- `backend/src/main/java/com/vgcenter/damagecalc/application/usecase/EvaluateReplayDecisionsService.java:336`
- `backend/src/main/java/com/vgcenter/damagecalc/application/usecase/EvaluateReplayDecisionsService.java:358`
- `backend/src/main/java/com/vgcenter/damagecalc/application/usecase/EvaluateReplayDecisionsService.java:367`
- `backend/src/main/java/com/vgcenter/damagecalc/application/usecase/EvaluateReplayDecisionsService.java:369`
- `backend/src/main/java/com/vgcenter/damagecalc/application/usecase/EvaluateReplayDecisionsService.java:379`
- `backend/src/main/java/com/vgcenter/damagecalc/application/usecase/EvaluateReplayDecisionsService.java:386`
- `backend/src/main/java/com/vgcenter/damagecalc/application/usecase/EvaluateReplayDecisionsService.java:408`
- `backend/src/main/java/com/vgcenter/damagecalc/application/usecase/EvaluateReplayDecisionsService.java:494`
- `backend/src/main/java/com/vgcenter/damagecalc/application/usecase/EvaluateReplayDecisionsService.java:512`
- `backend/src/main/java/com/vgcenter/damagecalc/application/usecase/EvaluateReplayDecisionsService.java:726`
- `backend/src/main/java/com/vgcenter/damagecalc/application/usecase/EvaluateReplayDecisionsService.java:762`
- `backend/src/main/java/com/vgcenter/damagecalc/application/usecase/EvaluateReplayDecisionsService.java:859`
- `backend/src/main/java/com/vgcenter/damagecalc/application/usecase/EvaluateReplayDecisionsService.java:888`
### 19.3 Optimizer
- `backend/src/main/java/com/vgcenter/damagecalc/application/usecase/OptimizeAgainstThreatsService.java:24`
- `backend/src/main/java/com/vgcenter/damagecalc/application/usecase/OptimizeAgainstThreatsService.java:45`
- `backend/src/main/java/com/vgcenter/damagecalc/application/usecase/OptimizeAgainstThreatsService.java:70`
- `backend/src/main/java/com/vgcenter/damagecalc/application/usecase/OptimizeAgainstThreatsService.java:110`
- `backend/src/main/java/com/vgcenter/damagecalc/application/usecase/OptimizeAgainstThreatsService.java:124`
- `backend/src/main/java/com/vgcenter/damagecalc/application/usecase/OptimizeAgainstThreatsService.java:130`
- `backend/src/main/java/com/vgcenter/damagecalc/application/usecase/OptimizeAgainstThreatsService.java:135`
- `backend/src/main/java/com/vgcenter/damagecalc/application/usecase/OptimizeAgainstThreatsService.java:140`
- `backend/src/main/java/com/vgcenter/damagecalc/application/usecase/OptimizeAgainstThreatsService.java:195`
- `backend/src/main/java/com/vgcenter/damagecalc/application/usecase/OptimizeAgainstThreatsService.java:202`
- `backend/src/main/java/com/vgcenter/damagecalc/application/usecase/OptimizeAgainstThreatsService.java:274`
- `backend/src/main/java/com/vgcenter/damagecalc/application/usecase/OptimizeAgainstThreatsService.java:276`
- `backend/src/main/java/com/vgcenter/damagecalc/application/usecase/OptimizeAgainstThreatsService.java:290`
- `backend/src/main/java/com/vgcenter/damagecalc/application/usecase/OptimizeAgainstThreatsService.java:300`
- `backend/src/main/java/com/vgcenter/damagecalc/application/usecase/OptimizeAgainstThreatsService.java:327`
- `backend/src/main/java/com/vgcenter/damagecalc/application/usecase/DefenseSpreadCandidate.java:3`
- `backend/src/main/java/com/vgcenter/damagecalc/application/usecase/OptimizeAgainstThreatResult.java:3`
- `backend/src/main/java/com/vgcenter/damagecalc/web/dto/DefenseSpreadCandidateDto.java:3`
- `backend/src/main/java/com/vgcenter/damagecalc/web/dto/OptimizeAgainstThreatResultDto.java:3`
- `backend/src/main/java/com/vgcenter/damagecalc/web/mapper/CalcOptimizerWebMapper.java:92`
### 19.4 Preview/Recommend
- `backend/src/main/java/com/vgcenter/damagecalc/application/usecase/EvaluateLeadsService.java:101`
- `backend/src/main/java/com/vgcenter/damagecalc/application/usecase/EvaluateLeadsService.java:107`
- `backend/src/main/java/com/vgcenter/damagecalc/application/usecase/EvaluateLeadsService.java:110`
- `backend/src/main/java/com/vgcenter/damagecalc/application/usecase/EvaluateLeadsService.java:173`
- `backend/src/main/java/com/vgcenter/damagecalc/application/usecase/EvaluateLeadsService.java:194`
- `backend/src/main/java/com/vgcenter/damagecalc/application/usecase/EvaluateLeadsService.java:261`
- `backend/src/main/java/com/vgcenter/damagecalc/application/usecase/EvaluateLeadsService.java:266`
- `backend/src/main/java/com/vgcenter/damagecalc/application/usecase/RecommendPlansService.java:81`
- `backend/src/main/java/com/vgcenter/damagecalc/application/usecase/RecommendPlansService.java:100`
- `backend/src/main/java/com/vgcenter/damagecalc/application/usecase/RecommendPlansService.java:122`
- `backend/src/main/java/com/vgcenter/damagecalc/application/usecase/RecommendPlansService.java:135`
- `backend/src/main/java/com/vgcenter/damagecalc/application/usecase/RecommendPlansService.java:142`
### 19.5 Frontend
- `frontend/src/features/calculator/api/optimizerApi.ts:69`
- `frontend/src/features/calculator/components/SpreadOptimizerPanel.tsx:29`
- `frontend/src/features/calculator/components/SpreadOptimizerPanel.tsx:499`
- `frontend/tests/component/calculator/SpreadOptimizerPanel.test.tsx:59`
### 19.6 Tests
- `backend/src/test/java/com/vgcenter/damagecalc/domain/formula/DamageFormulaPropertiesTest.java:23`
- `backend/src/test/java/com/vgcenter/damagecalc/application/usecase/CalculateDamageServiceTest.java:290`
- `backend/src/test/java/com/vgcenter/damagecalc/application/usecase/EvaluateReplayDecisionsServiceTest.java:358`
- `backend/src/test/java/com/vgcenter/damagecalc/application/usecase/EvaluateReplayDecisionsServiceTest.java:362`
- `backend/src/test/java/com/vgcenter/damagecalc/application/usecase/EvaluateReplayDecisionsServiceTest.java:392`
- `backend/src/test/java/com/vgcenter/damagecalc/application/usecase/OptimizeAgainstThreatsServiceTest.java:85`
- `backend/src/test/java/com/vgcenter/damagecalc/application/usecase/EvaluateLeadsServiceTest.java:126`
- `backend/src/test/java/com/vgcenter/damagecalc/application/usecase/RecommendPlansScoreWeightsTest.java:15`
### 19.7 Dataset source
- `backend/src/main/resources/data/regulation-m-a/moves.json`
