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
        "of": "de"
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
    lng: 'pt', // Forçar português como padrão
    fallbackLng: 'pt',
    interpolation: {
      escapeValue: false,
      format: (value, format, lng) => {
        if (value instanceof Date) {
          if (format === 'dateTime') {
            return new Intl.DateTimeFormat(ptBrLocale, {
              dateStyle: 'short',
              timeStyle: 'short',
            }).format(value);
          }
          if (format === 'date') {
            return new Intl.DateTimeFormat(ptBrLocale, {
              dateStyle: 'short',
            }).format(value);
          }
          if (format === 'time') {
            return new Intl.DateTimeFormat(ptBrLocale, {
              timeStyle: 'short',
            }).format(value);
          }
          return new Intl.DateTimeFormat(ptBrLocale).format(value);
        }
        if (typeof value === 'number') {
          if (format === 'currency') {
            return new Intl.NumberFormat(ptBrLocale, {
              style: 'currency',
              currency: 'BRL',
            }).format(value);
          }
          if (format === 'percent') {
            return new Intl.NumberFormat(ptBrLocale, {
              style: 'percent',
              minimumFractionDigits: 2,
            }).format(value / 100);
          }
          return new Intl.NumberFormat(ptBrLocale).format(value);
        }
        return value;
      },
    },
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
    }
  });

export default i18n;
