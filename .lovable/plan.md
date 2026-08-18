# Plano de Implementação: Consolidação e Refinamento do Terminal Quantitativo

Este plano visa resolver as lacunas identificadas na auditoria, unificando a lógica de geração, expandindo motores estatísticos para todas as loterias e automatizando o feedback de ROI.

## 1. Unificação da Camada de Geração
Consolidar a lógica de geração espalhada para garantir que o "Motor de Verdade Matemática" seja aplicado consistentemente em todo o sistema.

- **Ação:** Criar `src/engine/core/GameOrchestrator.ts` que centraliza `universalGameGenerator.ts`, `intelligent-generator.ts` e `professional-generator.ts`.
- **Ação:** Refatorar componentes de UI para usarem exclusivamente o `GameOrchestrator`.

## 2. Motores Estatísticos Específicos (Expansão)
Levar o nível de análise da Lotofácil para Mega-Sena, Quina e Super Sete.

- **Mega-Sena/Quina:** Implementar `MegaSenaStructureAnalyzer` com foco em quadrantes, saltos de linha/coluna e paridade histórica.
- **Super Sete:** Criar `SuperSetePositionalGrid.tsx` para permitir a escolha por coluna (0-9) e ajustar o `SuperSeteEngine` para tratar hits posicionais.

## 3. Automação de ROI e Feedback de Banca
Integrar os dados reais de apostas com o simulador de banca.

- **Ação:** Modificar `useROIByLottery.ts` para ser a fonte da verdade em `GestaoBancaPage.tsx`.
- **Ação:** Implementar um botão "Sincronizar Acertos Reais" na Gestão de Banca para importar sessões automáticas baseadas no `user_roi_tracking`.

## 4. Anti-Abuso e UX de Acesso
Melhorar a transparência sobre limites de planos e proteção de IP.

- **Ação:** Atualizar `SignupPage.tsx` para tratar erros do `signup-guard` com mensagens claras sobre "Limite de contas atingido para este IP".
- **Ação:** Garantir que o limite de 3 jogos do Plano Grátis seja verificado antes da geração no `GameOrchestrator`.

## Detalhes Técnicos
- **Integridade:** Uso de `paired permutation tests` estendidos para as novas loterias.
- **Segurança:** Manutenção de RLS no `user_roi_tracking` e `user_roles`.
- **Performance:** Memoização de análises estruturais pesadas para evitar travamentos no grid.
