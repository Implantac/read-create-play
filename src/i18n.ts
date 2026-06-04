import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

const ptBrLocale = 'pt-BR';

const resources = {
  pt: {
    translation: {
      "common": {
        "loading": "Carregando...",
        "error": "Erro",
        "success": "Sucesso",
        "save": "Salvar",
        "cancel": "Cancelar",
        "delete": "Excluir",
        "edit": "Editar",
        "search": "Buscar",
        "filter": "Filtrar",
        "all": "Todos",
        "none": "Nenhum",
        "page": "Página",
        "of": "de",
        "login": "Entrar",
        "signup": "Cadastrar",
        "support": "Suporte",
        "access": "Acesso",
        "network": "Rede",
        "vital_access": "Acesso Vitalício",
        "join_network": "Entrar na Rede",
        "back": "Voltar"
      },
      "landing": {
        "hero": {
          "badge": "Protocolo Elite • {{count}} vagas vitalícias restantes",
          "title": "Pare de apostar no escuro.",
          "subtitle": "Jogue com Matemática.",
          "description": "A única plataforma do Brasil que funde +10.000 sorteios, redes neurais e 14 algoritmos de elite.",
          "cta_primary": "Desbloquear Acesso Vitalício",
          "cta_secondary": "Login de Membro"
        },
        "features": {
          "title": "Armas de Alta Precisão",
          "subtitle": "Arsenal completo usado por analistas quantitativos e jogadores profissionais.",
          "items": {
            "xray": {
              "title": "Raio-X dos Sorteios",
              "description": "Analise dezenas quentes, frias e atrasadas com visualização técnica avançada."
            },
            "ia": {
              "title": "IA Preditiva",
              "description": "Redes neurais processam tendências invisíveis em +10.000 sorteios oficiais."
            },
            "optimizer": {
              "title": "Otimizador Elite",
              "description": "Algoritmos genéticos criam matrizes de alta cobertura matemática."
            },
            "backtest": {
              "title": "Backtest Brutal",
              "description": "Valide sua estratégia contra o histórico completo antes de realizar qualquer aposta."
            },
            "simulation": {
              "title": "Simulação Massiva",
              "description": "Execute 1.000.000 de cenários Monte Carlo para enxergar probabilidades reais."
            },
            "sync": {
              "title": "Sync Institucional",
              "description": "Conexão direta com resultados oficiais atualizada em milissegundos."
            }
          }
        },
        "stats": {
          "draws": "Sorteios analisados",
          "lotteries": "Loterias suportadas",
          "algorithms": "Algoritmos de IA",
          "uptime": "Uptime"
        },
        "faq": {
          "title": "Perguntas Frequentes",
          "q1": "Como a IA ajuda nas apostas?",
          "a1": "Nossa IA analisa padrões históricos complexos que o olho humano não consegue detectar, identificando tendências e probabilidades estatísticas.",
          "q2": "O acesso vitalício é realmente único?",
          "a2": "Sim, você paga uma única vez e tem acesso a todas as atualizações futuras e novas ferramentas sem mensalidades.",
          "q3": "Quais loterias são suportadas?",
          "a3": "Suportamos as principais loterias da Caixa, incluindo Mega-Sena, Lotofácil, Quina, e muito mais.",
          "q4": "É garantido que vou ganhar?",
          "a4": "Não. Loterias são jogos de azar. Nossa ferramenta aumenta suas probabilidades matemáticas e estatísticas, mas não garante prêmios."
        }
      },
      "matrix": {
        "title": "Ranking Probabilístico",
        "subtitle": "Matriz de Performance Individual",
        "active_found": "{{count}} Ativos Encontrados",
        "filters": {
          "all": "Todas",
          "top": "Top",
          "delayed": "Atrasadas",
          "hot": "Quentes"
        },
        "columns": {
          "rank": "#",
          "number": "Dezena",
          "score": "Score",
          "freqTotal": "Freq. Total",
          "freqRecent30": "Freq. 30",
          "currentDelay": "Atraso",
          "trend": "Tendência",
          "moment": "Momento (30)",
          "status": "Status"
        },
        "trends": {
          "up": "Subindo",
          "down": "Caindo",
          "stable": "Estável"
        },
        "signals": {
          "green": "Alta",
          "yellow": "Neutra",
          "red": "Baixa"
        }
      }
    }
  }
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    lng: 'pt',
    fallbackLng: 'pt',
    interpolation: {
      escapeValue: false,
    },
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
    }
  });

// Formatadores globais para datas, horas e números em PT-BR
i18n.services.formatter?.add('date', (value: any) => {
  return new Intl.DateTimeFormat(ptBrLocale, { dateStyle: 'short' }).format(value);
});

i18n.services.formatter?.add('dateTime', (value: any) => {
  return new Intl.DateTimeFormat(ptBrLocale, { dateStyle: 'short', timeStyle: 'short' }).format(value);
});

i18n.services.formatter?.add('time', (value: any) => {
  return new Intl.DateTimeFormat(ptBrLocale, { timeStyle: 'short' }).format(value);
});

i18n.services.formatter?.add('currency', (value: any) => {
  return new Intl.NumberFormat(ptBrLocale, { style: 'currency', currency: 'BRL' }).format(value);
});

i18n.services.formatter?.add('number', (value: any) => {
  return new Intl.NumberFormat(ptBrLocale).format(value);
});

i18n.services.formatter?.add('percent', (value: any) => {
  return new Intl.NumberFormat(ptBrLocale, { style: 'percent', minimumFractionDigits: 2 }).format(value / 100);
});

export default i18n;
