// ============================================================
// HOOK — STATUT DE LICENCE (React Query + API réelle)
// Endpoint backend : GET /licences/mon-statut
// Renvoie le statut de l'établissement porté par le JWT — jamais
// celui d'un autre. Aucune donnée en dur : dates, jours restants
// et plan viennent tous de l'API.
// ============================================================
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';

/** enum StatutLicence — miroir de `apps/api/src/licences/dto/licences.dto.ts`. */
export type StatutLicence =
  | 'ESSAI'
  | 'EN_ATTENTE_PAIEMENT'
  | 'PROVISOIRE'
  | 'ACTIVE'
  | 'GRACE'
  | 'DECOUVERTE'
  | 'EXPIREE'
  | 'SUSPENDUE'
  | 'REVOQUEE';

/** Compteur de quota — miroir de `CompteurQuota` côté API. */
export type CompteurQuota = 'agences' | 'agents' | 'transactionsMois';

/** État d'un compteur de quota (palier Découverte). */
export interface EtatQuota {
  compteur: CompteurQuota;
  valeur: number;
  plafond: number;
  restant: number;
  autorise: boolean;
}

/** Miroir de `StatutLicenceResultat` (les dates arrivent sérialisées en ISO). */
export interface StatutLicenceResultat {
  tenantId: string;
  statut: StatutLicence;
  plan: string;
  actif: boolean;
  trialEndsAt: string | null;
  subscriptionEndsAt: string | null;
  graceJusquA: string | null;
  provisoireJusquA: string | null;
  joursRestants: number | null;
  essaiConsomme: boolean;
  motif: string | null;
}

export const CLE_LICENCE = ['licence', 'mon-statut'] as const;

/**
 * Statut de licence de l'utilisateur courant.
 *
 * `staleTime` d'une minute : la valeur ne bouge qu'au rythme d'un paiement ou
 * d'une action d'administration, inutile de la retirer à chaque montage. Elle
 * est en revanche rafraîchie au retour sur l'onglet, pour que le bandeau
 * disparaisse rapidement après un renouvellement effectué ailleurs.
 *
 * `retry: false` : un échec ici ne doit jamais dégrader la navigation — sans
 * réponse, on n'affiche simplement aucun bandeau.
 */
export function useStatutLicence() {
  return useQuery<StatutLicenceResultat>({
    queryKey: CLE_LICENCE,
    queryFn: async () => {
      const { data } = await api.get<StatutLicenceResultat>('/licences/mon-statut');
      return data;
    },
    staleTime: 60_000,
    refetchOnWindowFocus: true,
    retry: false,
  });
}

export const CLE_QUOTAS = ['licence', 'mon-statut', 'quotas'] as const;

/**
 * Quotas du palier Découverte (agences, agents, transactions/mois).
 *
 * Hors palier gratuit, l'API renvoie `plafond = Infinity` : le composant
 * consommateur n'affiche alors aucun compteur. `staleTime` court (15 s) car ces
 * valeurs bougent à chaque création, contrairement au statut.
 */
export function useQuotas() {
  return useQuery<EtatQuota[]>({
    queryKey: CLE_QUOTAS,
    queryFn: async () => {
      const { data } = await api.get<EtatQuota[]>('/licences/mon-statut/quotas');
      return data;
    },
    staleTime: 15_000,
    refetchOnWindowFocus: true,
    retry: false,
  });
}
