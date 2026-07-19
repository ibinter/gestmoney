// ============================================================
// UTILITAIRES DE FORMATAGE — GESTMONEY
// ============================================================

/**
 * Formate un montant en devise africaine (XOF par défaut)
 */
export const formatMontant = (amount: number, currency = 'XOF'): string => formatCurrency(amount, currency);

export const formatCurrency = (amount: number, currency = 'XOF'): string => {
  const formatted = new Intl.NumberFormat('fr-FR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
  return `${formatted} ${currency}`;
};

/** Valeur affichée quand une date est absente ou illisible. */
const DATE_ABSENTE = '—';

/**
 * Convertit une entrée quelconque en Date exploitable.
 * Renvoie null si la valeur est absente, vide ou invalide — une API peut
 * parfaitement renvoyer `null` sur un champ date optionnel, et un
 * `undefined.getTime()` faisait planter toute la page qui l'affichait.
 */
function versDate(date: Date | string | null | undefined): Date | null {
  if (date === null || date === undefined || date === '') return null;
  const d = typeof date === 'string' ? new Date(date) : date;
  return d instanceof Date && !Number.isNaN(d.getTime()) ? d : null;
}

/**
 * Formate une date en "10 juil. 2026"
 */
export const formatDate = (date: Date | string | null | undefined): string => {
  const d = versDate(date);
  if (!d) return DATE_ABSENTE;
  return new Intl.DateTimeFormat('fr-FR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(d);
};

/**
 * Formate une date + heure en "10 juil. 2026 à 14:35"
 */
export const formatDateTime = (date: Date | string | null | undefined): string => {
  const d = versDate(date);
  if (!d) return DATE_ABSENTE;
  const datePart = new Intl.DateTimeFormat('fr-FR', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(d);
  const timePart = new Intl.DateTimeFormat('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
  }).format(d);
  return `${datePart} à ${timePart}`;
};

/**
 * Formate une date en temps relatif : "il y a 5 minutes"
 */
export const formatRelativeTime = (date: Date | string | null | undefined): string => {
  const d = versDate(date);
  if (!d) return DATE_ABSENTE;
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);
  const diffWeek = Math.floor(diffDay / 7);
  const diffMonth = Math.floor(diffDay / 30);

  if (diffSec < 60) return "à l'instant";
  if (diffMin < 60) return `il y a ${diffMin} minute${diffMin > 1 ? 's' : ''}`;
  if (diffHour < 24) return `il y a ${diffHour} heure${diffHour > 1 ? 's' : ''}`;
  if (diffDay < 7) return `il y a ${diffDay} jour${diffDay > 1 ? 's' : ''}`;
  if (diffWeek < 4) return `il y a ${diffWeek} semaine${diffWeek > 1 ? 's' : ''}`;
  if (diffMonth < 12) return `il y a ${diffMonth} mois`;
  const diffYear = Math.floor(diffMonth / 12);
  return `il y a ${diffYear} an${diffYear > 1 ? 's' : ''}`;
};

/**
 * Formate un numéro de téléphone selon le pays
 * Exemple CI: "+225 07 12 34 56"
 */
export const formatPhoneNumber = (phone: string, country = 'CI'): string => {
  // Nettoyer le numéro
  const digits = phone.replace(/\D/g, '');

  if (country === 'CI') {
    // Côte d'Ivoire: +225 XX XX XX XX
    if (digits.startsWith('225')) {
      const local = digits.slice(3);
      const parts = local.match(/.{1,2}/g) || [];
      return `+225 ${parts.join(' ')}`;
    }
    if (digits.length === 10) {
      const parts = digits.match(/.{1,2}/g) || [];
      return `+225 ${parts.join(' ')}`;
    }
  }

  if (country === 'SN') {
    // Sénégal: +221 XX XXX XX XX
    if (digits.startsWith('221')) {
      const local = digits.slice(3);
      return `+221 ${local.slice(0, 2)} ${local.slice(2, 5)} ${local.slice(5, 7)} ${local.slice(7)}`;
    }
  }

  // Fallback générique
  return `+${digits}`;
};

/**
 * Formate un pourcentage : "12,5%"
 */
export const formatPercentage = (value: number, decimals = 1): string => {
  return new Intl.NumberFormat('fr-FR', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value) + ' %';
};
