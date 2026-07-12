export const generateId = (): string =>
  `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

export const formatCurrency = (amount: number, currency = 'FCFA'): string =>
  `${new Intl.NumberFormat('fr-FR').format(amount)} ${currency}`;

export const formatDate = (iso: string): string =>
  new Intl.DateTimeFormat('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(iso));

export const formatTime = (iso: string): string =>
  new Intl.DateTimeFormat('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(iso));
