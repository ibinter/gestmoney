import { Metadata } from 'next';
import { LexiqueView } from '../LexiqueView';

export const metadata: Metadata = {
  title: 'Lexique | GESTMONEY',
  description:
    'Lexique bilingue du Mobile Money et de GESTMONEY — float, cash-in, cash-out, agent, KYC, commission, réconciliation, SYSCOHADA et bien plus.',
};

export default function LexiquePage() {
  return <LexiqueView />;
}
