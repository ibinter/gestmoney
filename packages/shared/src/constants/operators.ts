// ==============================================================================
// Constantes Opérateurs Mobile Money
// ==============================================================================

export const OPERATORS = {
  ORANGE_MONEY: {
    code: 'ORANGE_MONEY',
    name: 'Orange Money',
    logo: '/images/operators/orange-money.svg',
    color: '#FF6600',
    countries: ['CI', 'SN', 'ML', 'BF', 'GN', 'CM', 'MG', 'MR'],
    currency: 'XOF',
  },
  MTN_MOMO: {
    code: 'MTN_MOMO',
    name: 'MTN Mobile Money',
    logo: '/images/operators/mtn-momo.svg',
    color: '#FFCC00',
    countries: ['CI', 'GH', 'CM', 'BJ', 'GN', 'RW', 'UG', 'ZM'],
    currency: 'XOF',
  },
  WAVE: {
    code: 'WAVE',
    name: 'Wave',
    logo: '/images/operators/wave.svg',
    color: '#1DA1F2',
    countries: ['CI', 'SN', 'ML', 'BF', 'UG'],
    currency: 'XOF',
  },
  MOOV_MONEY: {
    code: 'MOOV_MONEY',
    name: 'Moov Money',
    logo: '/images/operators/moov-money.svg',
    color: '#0066CC',
    countries: ['CI', 'BJ', 'TG', 'BF', 'ML', 'MR'],
    currency: 'XOF',
  },
  FREE_MONEY: {
    code: 'FREE_MONEY',
    name: 'Free Money',
    logo: '/images/operators/free-money.svg',
    color: '#E30613',
    countries: ['SN'],
    currency: 'XOF',
  },
  AIRTEL_MONEY: {
    code: 'AIRTEL_MONEY',
    name: 'Airtel Money',
    logo: '/images/operators/airtel-money.svg',
    color: '#E60000',
    countries: ['BF', 'MG', 'MW', 'TZ', 'UG', 'ZM', 'KE'],
    currency: 'XOF',
  },
  MPESA: {
    code: 'MPESA',
    name: 'M-PESA',
    logo: '/images/operators/mpesa.svg',
    color: '#00A651',
    countries: ['KE', 'TZ', 'MZ', 'GH', 'EG'],
    currency: 'KES',
  },
} as const;

export type OperatorKey = keyof typeof OPERATORS;

export const OPERATOR_LIST = Object.values(OPERATORS);
