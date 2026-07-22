// ============================================================
// HOOK — RAPPORTS & BI (React Query + API réelle)
// ============================================================
import { useQuery, useMutation } from '@tanstack/react-query';
import api from '@/lib/api';

export interface AlerteBI {
  id: string;
  type: 'danger' | 'warning' | 'info';
  message: string;
}

export interface RapportHistorique {
  id: string;
  titre: string;
  type: 'mensuel' | 'hebdomadaire' | 'journalier';
  statut: 'disponible' | 'generation';
  date: string;
  taille: string;
  fileUrl?: string;
}

export interface RapportsData {
  ca: number;
  nbTransactions: number;
  nouveauxClients: number;
  ticketMoyen: number;
  variationCa: number;
  /** Non fourni par l'API — laissé indéfini pour masquer la tendance. */
  variationTx?: number;
  variationClients?: number;
  progression: number;
  objectif: number;
  parOperateur: { key: string; label: string; logo: string; couleur: string; montant: number; pct: number }[];
  topAgents: { nom: string; agence: string; montant: number; nbTx: number; badge: string }[];
  alertes: AlerteBI[];
  historique: RapportHistorique[];
}

/**
 * Objectif de CA (présentation) : cible de progression, PAS une donnée de CA
 * fabriquée. Le pourcentage de progression est calculé sur le CA réel.
 */
const OBJECTIF_CA = 200_000_000;

/** Métadonnées d'affichage des opérateurs (label/couleur uniquement). Les
 * montants proviennent toujours de l'API. */
const OPERATEUR_META: Record<string, { label: string; logo: string; couleur: string }> = {
  ORANGE_MONEY: { label: 'Orange Money', logo: '🟠', couleur: '#F97316' },
  MTN_MOMO:     { label: 'MTN MoMo',     logo: '🟡', couleur: '#EAB308' },
  WAVE:         { label: 'Wave',          logo: '🔵', couleur: '#3B82F6' },
  MOOV:         { label: 'Moov',          logo: '🟢', couleur: '#22C55E' },
  AIRTEL:       { label: 'Airtel',        logo: '🔴', couleur: '#EF4444' },
};

function metaOperateur(code?: string): { label: string; logo: string; couleur: string } {
  const key = (code ?? '').toUpperCase();
  return OPERATEUR_META[key] ?? { label: code || '—', logo: '⚪', couleur: '#94A3B8' };
}

/**
 * Convertit la période choisie dans l'UI en bornes ISO (startDate/endDate),
 * qui sont les query params réellement attendus par `GET /reports/*`.
 */
function bornesPeriode(periode?: string): { startDate: string; endDate: string } {
  const iso = (d: Date) => d.toISOString();
  switch (periode) {
    case 'decembre_2023':
      return { startDate: iso(new Date(Date.UTC(2023, 11, 1))), endDate: iso(new Date(Date.UTC(2023, 11, 31, 23, 59, 59))) };
    case 'trimestre_4_2023':
      return { startDate: iso(new Date(Date.UTC(2023, 9, 1))), endDate: iso(new Date(Date.UTC(2023, 11, 31, 23, 59, 59))) };
    case 'janvier_2024':
      return { startDate: iso(new Date(Date.UTC(2024, 0, 1))), endDate: iso(new Date(Date.UTC(2024, 0, 31, 23, 59, 59))) };
    default:
      // 30 derniers jours
      return { startDate: iso(new Date(Date.now() - 30 * 86400000)), endDate: iso(new Date()) };
  }
}

function toArray(payload: unknown): Record<string, unknown>[] {
  const body = (payload as { data?: unknown })?.data ?? payload;
  return Array.isArray(body) ? (body as Record<string, unknown>[]) : [];
}

function versTypeFr(type?: string): RapportHistorique['type'] {
  switch (type) {
    case 'DAILY':
      return 'journalier';
    case 'MONTHLY':
      return 'mensuel';
    default:
      return 'hebdomadaire';
  }
}

export function useRapports(periode?: string) {
  return useQuery({
    queryKey: ['rapports', periode ?? 'default'],
    queryFn: async (): Promise<RapportsData> => {
      const params = bornesPeriode(periode);

      // Appels réels en parallèle. Toute erreur réseau/serveur remonte à React
      // Query (isError) — plus aucun fallback mock. L'historique est optionnel :
      // s'il échoue on garde une liste vide sans casser la page.
      const [kpiRes, opsRes, agentsRes, histoRes] = await Promise.all([
        api.get('/reports/kpi', { params }),
        api.get('/reports/operators-comparison', { params }),
        api.get('/reports/agents-performance', { params }),
        api.get('/reports').catch(() => ({ data: [] })),
      ]);

      const kpi = (kpiRes.data?.data ?? kpiRes.data ?? {}) as Record<string, unknown>;
      const ca = Number(kpi.chiffreAffaires ?? 0);
      const nbTransactions = Number(kpi.totalTransactions ?? 0);
      const nouveauxClients = Number(kpi.nouveauxClients ?? 0);
      const ticketMoyen = nbTransactions > 0 ? Math.round(ca / nbTransactions) : 0;

      // ─── Répartition réelle par opérateur ───────────────────────────────
      const opsRaw = toArray(opsRes.data);
      const montantOp = (o: Record<string, unknown>) =>
        Number((o._sum as { amount?: unknown } | undefined)?.amount ?? 0);
      const totalOps = opsRaw.reduce((s, o) => s + montantOp(o), 0);
      const parOperateur = opsRaw
        .map((o) => {
          const code = String(o.operatorCode ?? '');
          const meta = metaOperateur(code);
          const montant = montantOp(o);
          return {
            key: code.toLowerCase() || 'inconnu',
            label: meta.label,
            logo: meta.logo,
            couleur: meta.couleur,
            montant,
            pct: totalOps > 0 ? Math.round((montant / totalOps) * 100) : 0,
          };
        })
        .sort((a, b) => b.montant - a.montant);

      // ─── Top agents réels ───────────────────────────────────────────────
      const agentsRaw = toArray(agentsRes.data);
      const topAgents = agentsRaw.slice(0, 5).map((a, i) => ({
        nom: String(a.agentId ?? '—'),
        agence: '—',
        montant: Number(a.montant ?? 0),
        nbTx: Number(a.transactions ?? 0),
        badge: ['🥇', '🥈', '🥉'][i] ?? '',
      }));

      // ─── Historique réel des rapports générés ───────────────────────────
      const historique: RapportHistorique[] = toArray(histoRes.data).map((r) => ({
        id: String(r.id ?? ''),
        titre: `Rapport ${versTypeFr(String(r.type))} ${new Date(String(r.generatedAt ?? Date.now())).toLocaleDateString('fr-FR')}`,
        type: versTypeFr(String(r.type)),
        statut: r.status === 'COMPLETED' ? 'disponible' : 'generation',
        date: new Date(String(r.generatedAt ?? Date.now())).toISOString().slice(0, 10),
        taille: '—',
      }));

      const progression = OBJECTIF_CA > 0 ? Math.min(Math.round((ca / OBJECTIF_CA) * 100), 100) : 0;

      return {
        ca,
        nbTransactions,
        nouveauxClients,
        ticketMoyen,
        variationCa: Number(kpi.croissance ?? 0),
        progression,
        objectif: OBJECTIF_CA,
        parOperateur,
        topAgents,
        alertes: [],
        historique,
      };
    },
    staleTime: 60_000,
  });
}

// Mappe les types FR de l'UI vers l'enum ReportType attendu par l'API (DTO EN strict).
type ReportTypeApi =
  | 'DAILY'
  | 'MONTHLY'
  | 'AGENT_PERFORMANCE'
  | 'OPERATOR_COMPARISON'
  | 'FLOAT_USAGE'
  | 'COMMISSIONS'
  | 'CUSTOM';

function versReportType(type?: string): ReportTypeApi {
  switch (type) {
    case 'journalier':
      return 'DAILY';
    case 'mensuel':
      return 'MONTHLY';
    case 'hebdomadaire':
      return 'CUSTOM';
    default:
      return 'MONTHLY';
  }
}

export function useGenererRapport() {
  return useMutation({
    mutationFn: async (params: { periode: string; type?: string; startDate?: string; endDate?: string }) => {
      // Le DTO GenerateReportDto (backend) exige { type: ReportType, format }
      // et refuse tout champ non listé (forbidNonWhitelisted). On ne transmet
      // donc jamais `periode` brut : on le convertit en type + dates optionnelles.
      const payload: Record<string, unknown> = {
        type: versReportType(params.type),
        format: 'PDF',
      };
      if (params.startDate) payload.startDate = params.startDate;
      if (params.endDate) payload.endDate = params.endDate;
      const res = await api.post('/reports/generate', payload);
      return res.data;
    },
  });
}
