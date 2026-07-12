export interface Operator {
  id: string;
  name: string;
  color: string;
  logo: string;
  minFloat: number;
}

export const OPERATORS: Operator[] = [
  {
    id: 'orange',
    name: 'Orange Money',
    color: '#FF6600',
    logo: '🟠',
    minFloat: 50000,
  },
  {
    id: 'mtn',
    name: 'MTN Mobile Money',
    color: '#FFCC00',
    logo: '🟡',
    minFloat: 50000,
  },
  {
    id: 'wave',
    name: 'Wave',
    color: '#1AC0FF',
    logo: '🔵',
    minFloat: 30000,
  },
  {
    id: 'moov',
    name: 'Moov Money',
    color: '#009CDE',
    logo: '🔷',
    minFloat: 30000,
  },
  {
    id: 'airtel',
    name: 'Airtel Money',
    color: '#FF0000',
    logo: '🔴',
    minFloat: 30000,
  },
];

export const getOperator = (id: string): Operator | undefined =>
  OPERATORS.find((op) => op.id === id);
