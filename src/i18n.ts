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
          "badge": "PROTOCOL TITAN • PLATAFORMA DE INTELIGÊNCIA PLM",
          "title": "Domine a Ciência.",
          "subtitle": "Conquiste a Sorte.",
          "description": "Utilize a plataforma de PLM (Product Lifecycle Management) impulsionada por IA para transformar o caos estatístico em estratégias de jogo de alta performance. Onde a ciência de dados encontra o futuro das apostas.",
          "cta_primary": "Desbloquear Neural Core",
          "cta_secondary": "Acesso Membro"
        },
        "features": {
          "title": "Recursos da Plataforma Titan",
          "subtitle": "Utilize as mesmas ferramentas de análise de dados usadas por profissionais para otimizar suas apostas na Mega-Sena e outras loterias.",
          "items": {
            "xray": {
              "title": "Análise Estatística de Loterias",
              "description": "Visualize tendências, números mais sorteados e atrasos com ferramentas profissionais de estatística."
            },
            "ia": {
              "title": "Inteligência Artificial para Loterias",
              "description": "Nossa IA processa milhares de resultados da Mega-Sena, Lotofácil e outras para prever tendências."
            },
            "optimizer": {
              "title": "Gerador de Apostas Inteligente",
              "description": "Crie jogos otimizados matematicamente para aumentar suas chances de ganhar na loteria."
            },
            "backtest": {
              "title": "Simulador de Resultados",
              "description": "Valide suas estratégias de jogo contra todo o histórico de sorteios reais antes de apostar seu dinheiro."
            },
            "simulation": {
              "title": "Probabilidade Matemática",
              "description": "Simule milhões de cenários e combinações para descobrir as chances reais de acerto em cada modalidade."
            },
            "sync": {
              "title": "Resultados em Tempo Real",
              "description": "Acesso imediato aos resultados oficiais da Caixa Econômica Federal, sincronizados automaticamente."
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
          "title": "Dúvidas sobre o Titan Loterias",
          "q1": "O Titan Loterias funciona para Mega-Sena e Lotofácil?",
          "a1": "Sim! Nossa plataforma oferece análise estatística completa para as principais loterias da Caixa, incluindo Mega-Sena, Lotofácil, Quina, Lotomania e muito mais.",
          "q2": "Como a Inteligência Artificial melhora minhas chances?",
          "a2": "Nossa IA processa milhares de sorteios históricos para identificar padrões e tendências que algoritmos comuns ignoram, otimizando seu gerador de apostas com base em dados reais.",
          "q3": "O que é o simulador de resultados e backtest?",
          "a3": "O simulador permite que você teste sua estratégia contra resultados passados (backtest). Assim, você descobre se sua combinação teria ganho prêmios em sorteios anteriores da Lotofácil ou Mega-Sena.",
          "q4": "O acesso vitalício inclui atualizações?",
          "a4": "Com certeza. Ao adquirir o acesso vitalício, você garante todas as futuras ferramentas de análise, novos algoritmos de IA e atualizações de segurança sem pagar mensalidades.",
          "q5": "A plataforma é atualizada com resultados oficiais?",
          "a5": "Sim, sincronizamos nossos dados diretamente com os resultados oficiais da Caixa Econômica Federal em tempo real, garantindo precisão total nas estatísticas.",
          "q6": "O gerador de apostas garante o prêmio acumulado?",
          "a6": "Não. Loterias envolvem sorte. O Titan Loterias é uma ferramenta de apoio que utiliza matemática e estatística para aumentar suas probabilidades, mas não prometemos ganhos garantidos."
        },
        "how_it_works": {
          "title": "Como Funciona o Titan Loterias",
          "step1": {
            "title": "Análise de Big Data",
            "desc": "Monitoramos todos os resultados oficiais das loterias brasileiras para alimentar nossa base de dados estatísticos."
          },
          "step2": {
            "title": "Cálculo de Tendências",
            "desc": "Nossa inteligência artificial analisa milhões de combinações em busca de padrões e anomalias estatísticas recorrentes."
          },
          "step3": {
            "title": "Apostas Otimizadas",
            "desc": "Você recebe sugestões de jogos baseadas em modelos matemáticos de alta performance para aumentar suas chances."
          },
          "status_label": "Status do Sistema",
          "status_value": "Operando em Alta Fidelidade"
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
