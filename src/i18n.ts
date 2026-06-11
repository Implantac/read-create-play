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
          "badge": "TITAN INTEL • INTELIGÊNCIA ESTATÍSTICA APLICADA",
          "title": "INTELIGÊNCIA ARTIFICIAL PARA",
          "subtitle": "LOTERIAS BRASILEIRAS",
          "description": "Analise milhares de concursos, descubra padrões ocultos e gere apostas utilizando estratégias matemáticas avançadas e IA. O Titan Loterias é a plataforma definitiva de inteligência aplicada às loterias brasileiras.",
          "cta_primary": "Testar Gratuitamente",
          "cta_secondary": "Conhecer Recursos"
        },
        "features": {
          "title": "Centro de Inteligência Titan",
          "subtitle": "O sistema abandona qualquer aparência de simples gerador e se posiciona como uma Plataforma de Inteligência Estatística para Loterias Brasileiras.",
          "items": {
            "xray": {
              "title": "Análise Histórica Avançada",
              "description": "Processamos milhões de dados de concursos oficiais para identificar tendências de frequência, atraso e distribuição em múltiplas dimensões."
            },
            "ia": {
              "title": "Titan AI Core",
              "description": "Nossa rede neural aplica modelos matemáticos complexos para detectar padrões ocultos que desafiam a sorte comum através de IA Preditiva."
            },
            "optimizer": {
              "title": "Motor de Probabilidade",
              "description": "Geramos apostas estratégicas com base em modelos de Fibonacci, Monte Carlo e Cadeias de Markov, focando na consistência estatística."
            },
            "backtest": {
              "title": "Simulador de Performance",
              "description": "Execute sua estratégia contra concursos passados e descubra o ROI teórico e a eficiência real antes de realizar qualquer aposta."
            },
            "simulation": {
              "title": "Laboratório de Estratégias",
              "description": "Acesse uma biblioteca profissional de fechamentos, distribuições balanceadas e estratégias proprietárias com Titan Score."
            },
            "sync": {
              "title": "Sincronização Oficial",
              "description": "Dados coletados e atualizados em tempo real diretamente das fontes oficiais, garantindo 100% de precisão para suas decisões."
            }
          }
        },
        "how_it_works": {
          "title": "Arquitetura de Inteligência",
          "step1": {
            "title": "Coleta de Históricos",
            "desc": "Consolidamos todos os concursos oficiais em uma base de Big Data para análise temporal profunda."
          },
          "step2": {
            "title": "Processamento IA",
            "desc": "O Titan AI Core processa milhões de combinações em busca de padrões estatísticos e anomalias de frequência."
          },
          "step3": {
            "title": "Detecção de Padrões",
            "desc": "Identificamos tendências de dezenas quentes, frias e ciclos de retorno através de redes neurais especializadas."
          },
          "step4": {
            "title": "Estratégia Matemática",
            "desc": "Aplicamos filtros de dispersão, equilíbrio estrutural e fechamentos matemáticos para otimizar suas chances."
          },
          "step5": {
            "title": "Apostas Estratégicas",
            "desc": "Geramos combinações com o Titan Score proprietário, auxiliando na tomada de decisão baseada puramente em dados."
          }
        },
        "disclaimer": "As análises são baseadas em dados históricos, estatística, probabilidade e inteligência artificial. O sistema não garante ganhos e deve ser usado como ferramenta de suporte à decisão."
      },
        "testimonials": {
          "title": "Depoimentos de Usuários Reais",
          "subtitle": "Junte-se a milhares de jogadores que já profissionalizaram suas estratégias.",
          "items": {
            "t1": {
              "name": "Ricardo Silva",
              "role": "Analista de Dados",
              "content": "O Titan Loterias mudou completamente minha forma de enxergar os sorteios. A precisão da IA é assustadora."
            },
            "t2": {
              "name": "Ana Oliveira",
              "role": "Jogadora Profissional",
              "content": "As ferramentas de backtest me economizaram centenas de reais em apostas sem sentido. Agora só jogo com estratégia."
            },
            "t3": {
              "name": "Marcos Santos",
              "role": "Entusiasta de Matemática",
              "content": "Melhor plataforma do Brasil. O otimizador de matrizes é simplesmente fantástico para quem busca cobertura real."
            }
          }
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
      },
      "affiliate": {
        "title": "Programa de Afiliados",
        "total_referrals": "Total de Indicações",
        "total_earned": "Total Ganho",
        "available_balance": "Saldo Disponível",
        "invite_title": "Convide e Ganhe",
        "invite_desc": "Ganhe 30% de comissão recorrente em cada assinatura ativa indicada.",
        "benefits": {
          "lifetime": "Comissão vitalícia em assinaturas",
          "min_payout": "Pagamento mínimo R$ 100,00",
          "dashboard": "Dashboard de acompanhamento real",
          "material": "Material promocional exclusivo"
        }
      },
      "gamification": {
        "title": "Progresso Titan",
        "level": "Nível {{level}}",
        "ranks": {
          "r1": "Iniciante",
          "r2": "Explorador",
          "r3": "Estrategista",
          "r4": "Especialista",
          "r5": "Mestre",
          "r6": "Lenda Titan"
        },
        "achievements": "Conquistas & Badges",
        "exp": "XP",
        "stats": {
          "generated": "Jogos Gerados",
          "won": "Acertos"
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
