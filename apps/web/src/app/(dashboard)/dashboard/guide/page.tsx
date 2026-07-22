// Guide utilisateur dans l'espace connecté (avec la sidebar du dashboard).
// Réutilise la vue riche du guide public, en gardant la navigation interne
// dans le dashboard (basePath) et le retour vers /dashboard.
import { GuideView } from '@/app/guide/GuideView';

export default function DashboardGuidePage() {
  return <GuideView basePath="/dashboard/guide" homeHref="/dashboard" />;
}
