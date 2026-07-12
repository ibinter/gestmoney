// ==============================================================================
// Constantes Devises Africaines
// ==============================================================================

export const CURRENCIES = {
  XOF: {
    code: 'XOF',
    name: 'Franc CFA BCEAO',
    symbol: 'F CFA',
    decimals: 0,
    countries: ['CI', 'SN', 'ML', 'BF', 'TG', 'BJ', 'NE', 'GW'],
  },
  XAF: {
    code: 'XAF',
    name: 'Franc CFA BEAC',
    symbol: 'FCFA',
    decimals: 0,
    countries: ['CM', 'CF', 'TD', 'CG', 'GQ', 'GA'],
  },
  GHS: {
    code: 'GHS',
    name: 'Cedi Ghanéen',
    symbol: '₵',
    decimals: 2,
    countries: ['GH'],
  },
  NGN: {
    code: 'NGN',
    name: 'Naira Nigérian',
    symbol: '₦',
    decimals: 2,
    countries: ['NG'],
  },
  KES: {
    code: 'KES',
    name: 'Shilling Kényan',
    symbol: 'KSh',
    decimals: 2,
    countries: ['KE'],
  },
  UGX: {
    code: 'UGX',
    name: 'Shilling Ougandais',
    symbol: 'USh',
    decimals: 0,
    countries: ['UG'],
  },
  TZS: {
    code: 'TZS',
    name: 'Shilling Tanzanien',
    symbol: 'TSh',
    decimals: 0,
    countries: ['TZ'],
  },
  MGA: {
    code: 'MGA',
    name: 'Ariary Malgache',
    symbol: 'Ar',
    decimals: 0,
    countries: ['MG'],
  },
  GNF: {
    code: 'GNF',
    name: 'Franc Guinéen',
    symbol: 'FG',
    decimals: 0,
    countries: ['GN'],
  },
} as const;

export type CurrencyCode = keyof typeof CURRENCIES;
