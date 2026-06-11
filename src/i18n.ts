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
          "badge": "USE MODA • PROTOCOLO DE INTELIGÊNCIA PLM",
          "title": "DOMINE A CRIAÇÃO.",
          "subtitle": "LIDERE O MERCADO.",
          "description": "A primeira plataforma de PLM com IA generativa e ERP nativo. Transforme o caos operacional em coleções lucrativas com inteligência preditiva e gestão 360º de ponta a ponta.",
          "cta_primary": "Desbloquear USE AI",
          "cta_secondary": "Agendar Demonstração"
        },
        "features": {
          "title": "A Inteligência por trás da Moda",
          "subtitle": "Substitua planilhas, WhatsApp e processos manuais pela plataforma que está redefinindo o futuro do desenvolvimento de coleções.",
          "items": {
            "xray": {
              "title": "PLM + ERP Nativo",
              "description": "Uma única fonte de verdade. Do croqui ao financeiro, tudo integrado sem a necessidade de integrações complexas."
            },
            "ia": {
              "title": "USE AI • Copiloto Criativo",
              "description": "Gere mood boards, paletas e mix de produtos instantaneamente com nossa IA treinada para a indústria fashion."
            },
            "optimizer": {
              "title": "Ficha Técnica Inteligente",
              "description": "Engenharia de produto automatizada com controle de tecidos, aviamentos e custos em tempo real."
            },
            "backtest": {
              "title": "BI Executivo de Luxo",
              "description": "Monitore ROI, margens e giro de estoque com dashboards interativos e análises preditivas de demanda."
            },
            "simulation": {
              "title": "Digital Twin da Coleção",
              "description": "Visualize toda a sua coleção em um ambiente digital antes mesmo da primeira peça piloto ser cortada."
            },
            "sync": {
              "title": "Ecossistema Colaborativo",
              "description": "Feed social, comentários e aprovações em tempo real para conectar Pesquisa, PCP e Vendas."
            }
          }
        },
        "stats": {
          "draws": "Coleções gerenciadas",
          "lotteries": "Marcas conectadas",
          "algorithms": "Modelos de IA",
          "uptime": "Disponibilidade"
        },
        "faq": {
          "title": "Dúvidas sobre o USE MODA PLM AI",
          "q1": "O USE MODA substitui meu ERP atual?",
          "a1": "O USE MODA possui um ERP nativo focado em moda, mas também pode ser integrado aos principais ERPs de mercado via API para manter sua contabilidade e fiscal existentes.",
          "q2": "Como a IA ajuda no desenvolvimento de coleções?",
          "a2": "Nossa IA 'USE AI' analisa tendências de mercado e histórico de vendas para sugerir mix de produtos, paletas de cores e até criar esboços iniciais de fichas técnicas.",
          "q3": "O que é o Digital Twin da Coleção?",
          "a3": "É uma representação digital completa do seu mix de produtos que permite visualizar o equilíbrio da coleção, custos estimados e potencial de venda antes da produção física.",
          "q4": "A plataforma é segura para meus designs proprietários?",
          "a4": "Segurança é nossa prioridade. Utilizamos criptografia de nível bancário e garantimos que seus dados e designs nunca sejam usados para treinar modelos de IA públicos.",
          "q5": "O sistema suporta integração com Adobe Illustrator?",
          "a5": "Sim! Possuímos plugins e integrações nativas para Adobe Illustrator, Corel Draw e as principais ferramentas de CAD do mercado como Audaces e Lectra.",
          "q6": "Qual o tempo médio de implementação?",
          "a6": "Graças à nossa interface intuitiva e processos automatizados de importação, a maioria das empresas começa a operar 100% em menos de 30 dias."
        },
        "how_it_works": {
          "title": "A Jornada USE MODA",
          "step1": {
            "title": "Pesquisa & Insight",
            "desc": "Centralize referências no Mood Board inteligente com análise de tendências via visão computacional."
          },
          "step2": {
            "title": "Engenharia de Produto",
            "desc": "Desenvolva fichas técnicas avançadas com controle automático de insumos e workflow visual em Kanban."
          },
          "step3": {
            "title": "Produção & BI",
            "desc": "Monitore o PCP em tempo real e analise a rentabilidade de cada peça com indicadores financeiros de elite."
          },
          "status_label": "Rede Neural",
          "status_value": "Processando Tendências Verão 2026"
        },
        "testimonials": {
          "title": "Líderes que Escolheram a Evolução",
          "subtitle": "Junte-se às marcas que estão escalando com previsibilidade e design de excelência.",
          "items": {
            "t1": {
              "name": "Valentina Rossi",
              "role": "Diretora Criativa",
              "content": "O USE MODA eliminou o caos de planilhas e WhatsApp. Hoje meu time cria 40% mais rápido com a ajuda da IA."
            },
            "t2": {
              "name": "Alessandro Silva",
              "role": "Head de Produto",
              "content": "A ficha técnica inteligente e a integração com o ERP nativo trouxeram uma precisão de custos que nunca tivemos antes."
            },
            "t3": {
              "name": "Beatriz Mendes",
              "role": "COO de Varejo Fashion",
              "content": "Finalmente um software que entende a linguagem da moda. O Digital Twin é um divisor de águas para nosso planejamento."
            }
          }
        },
        "leads": {
          "title": "Pronto para liderar o mercado?",
          "subtitle": "Solicite uma demonstração personalizada e descubra como o USE MODA pode transformar sua operação.",
          "name_label": "Nome Completo",
          "email_label": "E-mail Profissional",
          "company_label": "Nome da Empresa",
          "role_label": "Cargo / Função",
          "phone_label": "WhatsApp / Telefone",
          "consent_label": "Concordo em receber comunicações e aceito os Termos de Privacidade.",
          "submit_button": "Solicitar Demonstração",
          "success_message": "Sua solicitação foi enviada com sucesso! Nossa equipe entrará em contato em breve.",
          "error_message": "Houve um erro ao enviar sua solicitação. Por favor, tente novamente ou entre em contato via WhatsApp."
        },
        "thanks": {
          "title": "Solicitação Recebida!",
          "subtitle": "Obrigado pelo seu interesse no USE MODA PLM AI.",
          "description": "Nossa equipe de especialistas está analisando seu perfil e entrará em contato em até 24 horas úteis para agendar sua demonstração personalizada.",
          "next_steps_title": "Próximos Passos",
          "step1": "Um consultor entrará em contato via WhatsApp ou E-mail.",
          "step2": "Prepare suas principais dúvidas e desafios operacionais.",
          "step3": "Demonstração ao vivo do USE AI e ERP Nativo.",
          "back_button": "Voltar para Início",
          "whatsapp_button": "Falar com Consultor agora"
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
