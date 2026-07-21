import { Metadata } from 'next';
import { GuideView } from './GuideView';

export const metadata: Metadata = {
  title: 'Guide utilisateur',
  description:
    'Guide utilisateur GESTMONEY — prise en main, tableau de bord, agences, agents, transactions, float, commissions, clients & KYC, comptabilité, stock, RH, reporting, licence, SARA et paramètres.',
};

export default function GuidePage() {
  return <GuideView />;
}
