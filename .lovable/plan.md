## Plano: Camada de Síntese do Apostador Profissional

Implementar as 5 lacunas identificadas, entregando a "camada executiva" que faltava sobre o motor Titan.

---

### 1. Painel de Comando do Apostador (`/comando`)

Nova página de decisão única que consolida sinais críticos em uma tela.

**Componente novo**: `src/pages/ComandoApostadorPage.tsx`
- **Card Veredito**: badge grande "APOSTAR AGORA" / "AGUARDAR" / "MODO ACUMULOU" com base em score composto (fase do ciclo + sinal hot/cold + alinhamento winner profile).
- **Ciclo 1-25**: mini-termômetro reutilizando `CycleThermometer` em modo compacto (props `compact`).
- **Top 3 Âncoras**: dezenas com maior lift do dia (via `computeAnchors` em `src/engine/anchors.ts` — arquivo novo, pega pares/trincas + termômetro).
- **Sizing por Banca**: consulta `useBankroll()` e sugere quantidade de jogos (Kelly fracionário já existe).
- **Botão Rápido**: "Gerar Top 3 do Consenso" que dispara o pipeline Caça-Jackpot e leva pra `/gerador` com resultados pré-carregados via query param.

Registrar rota em `src/App.tsx` e adicionar item no `SidebarNav`.

### 2. Fechamento Automático a partir do Consenso

**Arquivo novo**: `src/engine/closing/autoMatrix.ts`
- `pickMatrix({ baseSize, budget, lotteryId, targetGuarantee })` — retorna matriz ideal (ex.: 16→13, 18→14) consultando `src/ai/engines/wheelingMatrices.ts` + custo por jogo.
- Escolhe a maior matriz cujo custo total ≤ `budget` e cuja garantia ≥ alvo.

**UI**: novo botão "🤖 Fechar Automático" em `JackpotFocusPanel.tsx` ao lado do "Enviar Base Âncora". Ao clicar:
- Lê banca diária de `user_roi_tracking` (últimos 30d) ou usa slider manual como fallback.
- Chama `pickMatrix`, gera jogos via wheeling engine, navega para `/fechamentos` com estado pré-populado.

### 3. Comparador Rápido "Sua Aposta vs. Consenso Titan"

**Componente novo**: `src/components/lottery/QuickCompareBet.tsx`
- Input de dezenas (colar/digitar) com validação por modalidade.
- Calcula, em tempo real:
  - Nº de âncoras Titan presentes (do último consenso gerado — armazenar em `sessionStorage` chave `titan:last-consensus`).
  - Score do Winner Profile (reutiliza `scoreAgainstWinnerProfile` de `WinnerProfilePanel`).
  - Sugestão de troca de até 3 dezenas (algoritmo guloso: remove menores scores, adiciona maiores âncoras).
- Renderizado em card na página `/comando` e também no rodapé de `/gerador`.

### 4. Histórico de Performance do Motor

**Migração DB**: nova tabela `engine_performance_log`
```
id, user_id, lottery_id, preset_hash, config jsonb,
generated_at, evaluated_concurso int,
avg_hits real, max_hits int, tiers_hit jsonb,
created_at
```
GRANT completo + RLS por `auth.uid()`.

**Hook novo**: `src/hooks/useEnginePerformance.ts`
- `logGeneration(config, games)` — grava snapshot na tabela ao gerar Top no Caça-Jackpot.
- `evaluateAgainstLatest()` — cruza com `lottery_draws` mais recente e atualiza métricas.
- Roda automaticamente após `post-sync-notify` (adicionar chamada RPC lá).

**Painel novo**: `src/components/gerador/EnginePerformancePanel.tsx`
- Timeline dos últimos 20 lotes gerados: config, concurso alvo, acertos.
- Agrega por preset: "Modo Acumulou + Cycle 1-25 Closing: 11+ acertos em 32% dos casos".
- Aparece abaixo do Caça-Jackpot em `/gerador`.

### 5. Alerta Pré-Sorteio T-2h

**Edge Function nova**: `supabase/functions/pre-draw-alert/index.ts`
- Recebe cron trigger, itera modalidades com sorteio hoje.
- Calcula sinal contextual (fase do ciclo, hot/cold do dia) reusando lógica de `alerts-scan`.
- Para cada usuário com push habilitado + categoria `pre_draw` ligada, envia notificação via `send-push`.

**Cron via supabase--insert** (não migration, contém URL/anon key):
```sql
select cron.schedule(
  'pre-draw-alert-hourly',
  '0 * * * *',
  $$ select net.http_post(...pre-draw-alert...) $$
);
```
A função internamente checa se está a 2h de um sorteio antes de disparar.

**UI**: adicionar categoria `pre_draw` no `PushNotificationsCard.tsx`.

---

### Ordem de execução

1. Migração `engine_performance_log` (aprovação de DB primeiro).
2. `autoMatrix.ts` + engine helpers puros.
3. `QuickCompareBet` (isolado, sem deps novas).
4. `ComandoApostadorPage` + rota + sidebar.
5. Integração no `JackpotFocusPanel` (Fechar Automático).
6. `EnginePerformancePanel` + hook + integração no post-sync-notify.
7. Edge Function `pre-draw-alert` + cron + toggle no card de push.

### Detalhes técnicos

- Ciclo 1-25: reutilizar `computeCyclePressure` já existente em `CycleThermometer`; expor via `src/engine/lotofacil/cycle.ts` (extrair do componente).
- Consenso persistido: `sessionStorage.setItem('titan:last-consensus', JSON.stringify({ lotteryId, anchors, minPresence, ts }))`.
- Sizing por banca: já temos `bankrollEngine.ts`; adicionar `suggestGameCount(budget, ticketCost, riskProfile)` que retorna `{ count, kellyFraction, warning }`.
- Anti-loop no cron: `pre-draw-alert` guarda `last_notified_concurso` em `user_alert_configs.triggers` para não repetir na mesma janela.

### Fora do escopo

- Não altero pipeline central de scoring nem `strategiesLibrary.ts`.
- Não mexo em `useLotteryContext` (isolamento por modalidade preservado).
- Não toco em RLS de tabelas existentes.
