import { Metadata } from 'next';
import { CasPratiques } from '../CasPratiques';

export const metadata: Metadata = {
  title: 'Cas pratiques',
  description:
    'Cas pratiques GESTMONEY — scénarios pas-à-pas : ouvrir une agence, enregistrer un dépôt/retrait, réapprovisionner le float, clôturer la journée comptable, gérer une licence, poser une question à SARA, et plus.',
};

export default function CasPratiquesPage() {
  return <CasPratiques />;
}
