# Estado Atual do Projeto - Titan Loterias Quant

## Versão: v0.9.0-quant-baseline
Data: 18/08/2026

## Visão Geral
O projeto está em transição de um gerador de jogos para uma plataforma quantitativa completa.

## Estrutura de Rotas e Páginas
- **Público**: Landing, Login, Signup, Planos, Estudos, Suporte.
- **Privado**: Dashboard, Comando, Gerador, Fechamentos, Análise, Histórico, IA Chat/Autônoma, Estratégias, Strategy Lab, ROI, Banca.

## Engines Existentes
- `src/engine/core/GameOrchestrator.ts`: Unificação da lógica de geração.
- `src/engine/evidence/EvidenceEngine.ts`: Motor de evidências (Monte Carlo implementado).
- `src/engine/bankroll/bankrollEngine.ts`: Gestão de banca (Kelly Criterion).
- `src/engine/lotteries/`: Motores específicos por modalidade.

## Pendências Identificadas (Auditoria v6.0)
1. Fragmentação de Geradores (Em progresso via GameOrchestrator).
2. Motores Específicos não-Lotofácil (Incompletos).
3. Integração Automática de ROI (Implementada v6.2).
4. Interface Super Sete (Implementada v6.1).
5. Feedback IP Guard (Implementado v6.1).
6. Ablação por Indicador (Pela metade).
