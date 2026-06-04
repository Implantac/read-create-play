import i18n from 'i18next';

export const formatCurrency = (value: number): string => {
  return i18n.t('{{value, currency}}', { value });
};

export const formatDate = (date: string | Date): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  return i18n.t('{{value, dateTime}}', { value: d });
};

export const formatTime = (date: string | Date): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  return i18n.t('{{value, time}}', { value: d });
};

export const formatPercent = (value: number): string => {
  return i18n.t('{{value, percent}}', { value });
};

export const formatNumber = (value: number): string => {
  return i18n.t('{{value, number}}', { value });
};
