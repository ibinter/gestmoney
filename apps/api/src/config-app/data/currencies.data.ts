export interface CurrencyData {
  code: string;
  nameEn: string;
  nameFr: string;
  symbol: string;
  /** Nombre de décimales pour l'affichage */
  decimals: number;
  /** Séparateur décimal */
  decimalSeparator: string;
  /** Séparateur des milliers */
  thousandsSeparator: string;
  /** Position du symbole : 'before' | 'after' */
  symbolPosition: 'before' | 'after';
  /** Pays utilisant cette devise */
  countries: string[];
  /** Unité minimale (en centimes ou équivalent) */
  minUnit: number;
}

export const CURRENCIES_DATA: Record<string, CurrencyData> = {
  XOF: {
    code: 'XOF',
    nameEn: 'West African CFA Franc',
    nameFr: 'Franc CFA (UEMOA)',
    symbol: 'F CFA',
    decimals: 0,
    decimalSeparator: ',',
    thousandsSeparator: ' ',
    symbolPosition: 'after',
    countries: ['CI', 'SN', 'BF', 'ML', 'TG', 'BJ', 'NE', 'GW'],
    minUnit: 1,
  },
  XAF: {
    code: 'XAF',
    nameEn: 'Central African CFA Franc',
    nameFr: 'Franc CFA (CEMAC)',
    symbol: 'FCFA',
    decimals: 0,
    decimalSeparator: ',',
    thousandsSeparator: ' ',
    symbolPosition: 'after',
    countries: ['CM', 'CG', 'CF', 'TD', 'GQ', 'GA'],
    minUnit: 1,
  },
  GHS: {
    code: 'GHS',
    nameEn: 'Ghanaian Cedi',
    nameFr: 'Cedi Ghanéen',
    symbol: '₵',
    decimals: 2,
    decimalSeparator: '.',
    thousandsSeparator: ',',
    symbolPosition: 'before',
    countries: ['GH'],
    minUnit: 0.01,
  },
  KES: {
    code: 'KES',
    nameEn: 'Kenyan Shilling',
    nameFr: 'Shilling Kényan',
    symbol: 'KSh',
    decimals: 2,
    decimalSeparator: '.',
    thousandsSeparator: ',',
    symbolPosition: 'before',
    countries: ['KE'],
    minUnit: 0.01,
  },
  NGN: {
    code: 'NGN',
    nameEn: 'Nigerian Naira',
    nameFr: 'Naira Nigérian',
    symbol: '₦',
    decimals: 2,
    decimalSeparator: '.',
    thousandsSeparator: ',',
    symbolPosition: 'before',
    countries: ['NG'],
    minUnit: 0.01,
  },
  TZS: {
    code: 'TZS',
    nameEn: 'Tanzanian Shilling',
    nameFr: 'Shilling Tanzanien',
    symbol: 'TSh',
    decimals: 0,
    decimalSeparator: '.',
    thousandsSeparator: ',',
    symbolPosition: 'before',
    countries: ['TZ'],
    minUnit: 1,
  },
  UGX: {
    code: 'UGX',
    nameEn: 'Ugandan Shilling',
    nameFr: 'Shilling Ougandais',
    symbol: 'USh',
    decimals: 0,
    decimalSeparator: '.',
    thousandsSeparator: ',',
    symbolPosition: 'before',
    countries: ['UG'],
    minUnit: 1,
  },
  RWF: {
    code: 'RWF',
    nameEn: 'Rwandan Franc',
    nameFr: 'Franc Rwandais',
    symbol: 'RF',
    decimals: 0,
    decimalSeparator: '.',
    thousandsSeparator: ',',
    symbolPosition: 'before',
    countries: ['RW'],
    minUnit: 1,
  },
  MZN: {
    code: 'MZN',
    nameEn: 'Mozambican Metical',
    nameFr: 'Metical Mozambicain',
    symbol: 'MT',
    decimals: 2,
    decimalSeparator: ',',
    thousandsSeparator: '.',
    symbolPosition: 'before',
    countries: ['MZ'],
    minUnit: 0.01,
  },
};

/**
 * Formate un montant selon les règles de la devise.
 */
export function formatAmount(amount: number, currencyCode: string): string {
  const currency = CURRENCIES_DATA[currencyCode];
  if (!currency) return `${amount} ${currencyCode}`;

  const formatted = amount.toLocaleString('fr-FR', {
    minimumFractionDigits: currency.decimals,
    maximumFractionDigits: currency.decimals,
  });

  return currency.symbolPosition === 'before'
    ? `${currency.symbol} ${formatted}`
    : `${formatted} ${currency.symbol}`;
}
