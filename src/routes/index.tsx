import React from 'react';
import ReactMarkdown from 'react-markdown';

const markdown = `
# RELATÓRIO DE STATUS DO PROJETO - TITAN LOTERIAS
**Data:** 4 de Agosto de 2026
**Status Global:** 🚀 Em Evolução Avançada (Arquitetura 10/10)

## ✅ O QUE JÁ FUNCIONA (IMPLEMENTADO)

### 1. Núcleo de Inteligência e IA
- **IA Titan Consultora:** Implementada via \`ai-chat\` e \`AIAnalystPage\`. Capaz de explicar decisões e sugerir melhorias.
- **Motores Estatísticos Avançados:** Monte Carlo, Cadeias de Markov (HMM), Entropia de Shannon e Testes Qui-quadrado.
- **Engine de Estratégias:** Centralizado em \`strategiesLibrary.ts\` com modelos de Hot-Cold, Repetição e Jackpot Focus.
- **SHAP Explainer:** Sistema de explicabilidade para justificar por que certos números foram sugeridos.
- **Bayesian Strategy Weighting:** Ponderação dinâmica de algoritmos baseada em performance histórica.

### 2. Geradores e Fechamentos
- **Jackpot Focus Panel:** Gerador especializado em prêmios principais (Lotofácil 15 pontos, Mega Sena).
- **Adaptive Closing Pipeline:** Pipeline híbrido estocástico para fechamentos matemáticos otimizados.
- **Universal Game Generator:** Motor único que suporta todas as loterias da CEF com filtros customizados.
- **Wheeling Engine:** Suporte a matrizes reais (Ex: 18->14) com controle de redundância.

### 3. Análise e Visualização
- **Dashboard Vivo:** Painel com Titan Stats, alertas proativos e tendências de tempo (Hoje/Semana/Mês).
- **Laboratório Estatístico:** \`StrategyLabPage\` para backtests rápidos e comparação de performance.
- **Heatmaps e Ciclos:** Termômetro de ciclos, mapas de calor interativos e análise de coocorrência (Lift metrics).
- **ROI Dashboard:** Gestão de banca com Critério de Kelly e simulações de Monte Carlo para lucro/prejuízo.

### 4. Infraestrutura e Segurança
- **Edge Functions (Supabase):** Mais de 15 funções para sync, alertas, pagamentos e processamento de IA.
- **Segurança (God Mode):** RBAC robusto com nível \`super_admin\` para acesso irrestrito.
- **Signup Guard:** Proteção por IP para evitar abuso de contas gratuitas.
- **PWA Offiline:** Preparado para instalação e funcionamento resiliente em dispositivos móveis.

---

## 🛠 O QUE AINDA FALTA IMPLEMENTAR (DE ACORDO COM O PLANO MESTRE)

### Etapas em Progresso ou Pendentes:

1. **Etapa 12 - Central de Estudos (Integrada):**
   - Embora tenhamos o Master Prompt e muitas análises, falta uma seção dedicada (\`CentralEstudosPage\`) que consolide vídeos, tutoriais e o glossário matemático de forma amigável para o usuário comum.

2. **Etapa 14 - Gamificação Completa:**
   - O sistema já possui lógica de níveis, mas falta a interface visual de "Medalhas" e "Conquistas" (Badges) para incentivar o uso frequente sem promover o vício.

3. **Etapa 18 - API Pública Documentada:**
   - A arquitetura interna é modular, mas a documentação externa para desenvolvedores (OpenAPI/Swagger) consumirem os motores do Titan ainda não foi gerada.

4. **Etapa 20 - Refinamento de UX Premium (Micro-interações):**
   - O design é Glassmorphism e moderno, mas ainda há espaço para micro-animações de "sucesso" em fechamentos complexos e transições de página mais fluidas via Framer Motion em todos os módulos.

5. **Ajustes de Limite de Jogos (Plano Gratuito):**
   - Precisamos garantir que o limite de "3 jogos por loteria" no plano gratuito esteja bloqueando rigorosamente a geração em todos os novos painéis (JackpotFocus, etc).

---

## 📈 PRÓXIMOS PASSOS RECOMENDADOS

1. **Unificação da Central de Estudos:** Criar o módulo de glossário e tutoriais.
2. **Dashboard de Conquistas:** Implementar a UI da Etapa 14.
3. **Auditoria de Limites:** Revisar o middleware de acesso para o novo limite de 3 jogos do plano free.
4. **Otimização de Renderização:** Aplicar virtualização de listas no Histórico Unificado se o usuário tiver > 5000 jogos salvos.

---
*Relatório gerado pelo Arquiteto Oficial do Titan Loterias.*
`;

const MasterPrompt = () => {
  return (
    <div className="p-8 max-w-4xl mx-auto prose prose-invert font-sans bg-background min-h-screen">
      <ReactMarkdown>{markdown}</ReactMarkdown>
    </div>
  );
};

export default MasterPrompt;
