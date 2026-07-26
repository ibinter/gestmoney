import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import * as QRCode from 'qrcode';
import { PrismaService } from '../prisma/prisma.service';
import { DocumentVerificationService } from '../document-verification/document-verification.service';

// ────────────────────────────────────────────────────────────────────────────
// Helpers
// ────────────────────────────────────────────────────────────────────────────

function formatMontantFCFA(amount: number | null | undefined): string {
  if (amount == null) return '—';
  return new Intl.NumberFormat('fr-FR', { style: 'decimal' }).format(amount) + ' FCFA';
}

function formatDateFr(date: Date | string | null | undefined): string {
  if (!date) return '—';
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function formatMonthFr(annee: number, mois: number): string {
  const d = new Date(annee, mois - 1, 1);
  return d.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
}

const TYPE_LABELS: Record<string, string> = {
  DEPOT: 'DÉPÔT',
  RETRAIT: 'RETRAIT',
  TRANSFERT: 'TRANSFERT',
  CASH_IN: 'CASH IN',
  CASH_OUT: 'CASH OUT',
  PAIEMENT: 'PAIEMENT',
};

const STATUT_LABELS: Record<string, string> = {
  COMPLETED: 'COMPLÉTÉE',
  PENDING: 'EN ATTENTE',
  FAILED: 'ÉCHOUÉE',
  CANCELLED: 'ANNULÉE',
  REVERSED: 'REVERSÉE',
};

const STATUT_COLORS: Record<string, string> = {
  COMPLETED: '#16a34a',
  PENDING: '#d97706',
  FAILED: '#dc2626',
  CANCELLED: '#6b7280',
  REVERSED: '#7c3aed',
};

// ────────────────────────────────────────────────────────────────────────────

@Injectable()
export class PdfService {
  private readonly logger = new Logger(PdfService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly documentVerification: DocumentVerificationService,
  ) {}

  // ─── Reçu de transaction ──────────────────────────────────────────────────

  async genererRecuTransaction(transactionId: string, tenantId: string): Promise<Buffer> {
    // 1. Récupérer la transaction + agent + agence (sans nested user — pas de relation
    //    user sur Agent dans le schéma, on récupère l'utilisateur séparément)
    const tx = await this.prisma.transaction.findFirst({
      where: { id: transactionId, tenantId },
      include: {
        agent: { select: { id: true, agentCode: true, userId: true } },
        agency: { select: { id: true, name: true } },
      },
    }) as any;

    if (!tx) throw new NotFoundException(`Transaction ${transactionId} introuvable`);

    // Récupérer le nom de l'agent via son userId
    let agentNom = tx.agent?.agentCode ?? '—';
    if (tx.agent?.userId) {
      const agentUser = await this.prisma.user.findUnique({
        where: { id: tx.agent.userId },
        select: { firstName: true, lastName: true },
      });
      if (agentUser) {
        agentNom = `${agentUser.firstName ?? ''} ${agentUser.lastName ?? ''}`.trim() || agentNom;
      }
    }

    // 2. Générer le token de vérification
    const token = await this.documentVerification.generateToken(
      transactionId,
      'RECU_TRANSACTION',
      tenantId,
      transactionId,
    );
    const verifyUrl = `https://gestmoney.ibigsoft.com/verify/${token}`;

    // 3. Générer le QR code en base64
    let qrDataUrl = '';
    try {
      qrDataUrl = await QRCode.toDataURL(verifyUrl, { width: 120, margin: 1 });
    } catch (err) {
      this.logger.warn('QR code generation failed, skipping QR on receipt', err);
    }

    // 4. Construire le HTML du reçu
    const agenceNom: string = tx.agency?.name ?? '—';
    const operateur: string = tx.operatorCode ?? tx.operator ?? '—';
    const typeLabel: string = TYPE_LABELS[tx.type] ?? tx.type ?? '—';
    const statut: string = tx.status ?? 'PENDING';
    const statutLabel: string = STATUT_LABELS[statut] ?? statut;
    const statutColor: string = STATUT_COLORS[statut] ?? '#6b7280';
    const montant: number = tx.amount != null ? Number(tx.amount) : 0;
    const commission: number = tx.commission != null ? Number(tx.commission) : 0;
    const clientNom: string = tx.receiverName ?? '—';
    const clientPhone: string = tx.receiverPhone ?? '—';
    const reference: string = tx.reference ?? transactionId;
    const createdAt: Date = tx.createdAt ?? new Date();

    const html = `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Reçu ${reference}</title>
<style>
  @page { size: A5; margin: 0; }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    font-family: 'Segoe UI', Arial, sans-serif;
    font-size: 12px;
    color: #1e293b;
    background: #fff;
    padding: 24px;
    max-width: 420px;
    margin: 0 auto;
  }
  .header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    border-bottom: 2px solid #4f46e5;
    padding-bottom: 12px;
    margin-bottom: 16px;
  }
  .brand { font-size: 22px; font-weight: 800; color: #4f46e5; letter-spacing: -0.5px; }
  .brand span { color: #10b981; }
  .subtitle { font-size: 11px; color: #64748b; margin-top: 2px; }
  .recu-title { font-size: 13px; font-weight: 700; color: #334155; text-align: right; }
  .section {
    background: #f8fafc;
    border-radius: 8px;
    padding: 10px 14px;
    margin-bottom: 10px;
  }
  .section-title {
    font-size: 10px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    color: #94a3b8;
    margin-bottom: 6px;
  }
  .row {
    display: flex;
    justify-content: space-between;
    margin-bottom: 4px;
  }
  .row .label { color: #64748b; }
  .row .value { font-weight: 600; text-align: right; }
  .two-col { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
  .badge {
    display: inline-block;
    padding: 3px 10px;
    border-radius: 99px;
    font-size: 11px;
    font-weight: 700;
    color: #fff;
    background: ${statutColor};
  }
  .amount-row {
    display: flex;
    justify-content: space-between;
    align-items: baseline;
    margin-bottom: 4px;
  }
  .amount-label { color: #64748b; font-size: 11px; }
  .amount-value { font-size: 18px; font-weight: 800; color: #1e293b; }
  .commission-value { font-size: 13px; font-weight: 600; color: #64748b; }
  .qr-section {
    display: flex;
    align-items: center;
    gap: 14px;
    background: #f0fdf4;
    border: 1px solid #bbf7d0;
    border-radius: 8px;
    padding: 10px 14px;
    margin-bottom: 10px;
  }
  .qr-img { width: 72px; height: 72px; flex-shrink: 0; }
  .qr-text { font-size: 11px; color: #166534; }
  .qr-text strong { display: block; font-size: 12px; margin-bottom: 2px; }
  .qr-url { font-size: 9px; color: #16a34a; word-break: break-all; margin-top: 4px; }
  .footer {
    text-align: center;
    font-size: 10px;
    color: #94a3b8;
    border-top: 1px solid #e2e8f0;
    padding-top: 10px;
    margin-top: 4px;
  }
  .footer strong { color: #64748b; }
  .ref { font-family: monospace; font-size: 13px; font-weight: 700; color: #4f46e5; }
  .statut-row { display: flex; align-items: center; justify-content: space-between; }
</style>
</head>
<body>

<!-- EN-TÊTE -->
<div class="header">
  <div>
    <div class="brand">GEST<span>MONEY</span></div>
    <div class="subtitle">Plateforme de gestion Mobile Money</div>
  </div>
  <div class="recu-title">Reçu de<br>transaction</div>
</div>

<!-- RÉFÉRENCE + STATUT -->
<div class="section">
  <div class="statut-row">
    <div>
      <div class="section-title">Référence</div>
      <div class="ref">${reference}</div>
    </div>
    <div style="text-align:right">
      <div class="section-title">Statut</div>
      <span class="badge">${statutLabel}</span>
    </div>
  </div>
  <div class="row" style="margin-top:8px">
    <span class="label">Date</span>
    <span class="value">${formatDateFr(createdAt)}</span>
  </div>
</div>

<!-- ÉMETTEUR / BÉNÉFICIAIRE -->
<div class="two-col">
  <div class="section">
    <div class="section-title">Émetteur (Agent)</div>
    <div class="row"><span class="value">${agentNom}</span></div>
    <div class="row"><span class="label">Agence</span><span class="value">${agenceNom}</span></div>
  </div>
  <div class="section">
    <div class="section-title">Bénéficiaire</div>
    <div class="row"><span class="value">${clientNom}</span></div>
    <div class="row"><span class="label">Tél.</span><span class="value">${clientPhone}</span></div>
  </div>
</div>

<!-- DÉTAILS OPÉRATION -->
<div class="section">
  <div class="section-title">Détails de l'opération</div>
  <div class="row">
    <span class="label">Opérateur</span>
    <span class="value">${operateur}</span>
  </div>
  <div class="row">
    <span class="label">Type</span>
    <span class="value">${typeLabel}</span>
  </div>
  <div style="margin-top: 8px; border-top: 1px solid #e2e8f0; padding-top: 8px;">
    <div class="amount-row">
      <span class="amount-label">Montant</span>
      <span class="amount-value">${formatMontantFCFA(montant)}</span>
    </div>
    <div class="amount-row">
      <span class="amount-label">Commission</span>
      <span class="commission-value">${formatMontantFCFA(commission)}</span>
    </div>
  </div>
</div>

<!-- QR CODE -->
${qrDataUrl ? `
<div class="qr-section">
  <img class="qr-img" src="${qrDataUrl}" alt="QR code de vérification" />
  <div class="qr-text">
    <strong>Vérifiez ce reçu</strong>
    Scannez le QR code ou rendez-vous sur :<br>
    <span class="qr-url">${verifyUrl}</span>
  </div>
</div>
` : `
<div class="qr-section">
  <div class="qr-text">
    <strong>Vérifiez ce reçu</strong>
    Rendez-vous sur :<br>
    <span class="qr-url">${verifyUrl}</span>
  </div>
</div>
`}

<!-- PIED DE PAGE -->
<div class="footer">
  <strong>Document généré par IBIG Soft</strong><br>
  Ce reçu fait foi de la transaction effectuée sur la plateforme GESTMONEY.<br>
  En cas de litige, conservez ce document et contactez votre agence.
</div>

</body>
</html>`;

    return Buffer.from(html, 'utf-8');
  }

  // ─── Rapport mensuel PDF ──────────────────────────────────────────────────

  async genererRapportMensuel(tenantId: string, annee: number, mois: number): Promise<Buffer> {
    const debut = new Date(annee, mois - 1, 1, 0, 0, 0, 0);
    const fin = new Date(annee, mois, 0, 23, 59, 59, 999);
    const debutPrecedent = new Date(annee, mois - 2, 1, 0, 0, 0, 0);
    const finPrecedent = new Date(annee, mois - 1, 0, 23, 59, 59, 999);

    // ── Récupération des données ──
    const [
      txCourant,
      txPrecedent,
      parType,
      parOperateur,
      parAgence,
      commissions,
      incidents,
    ] = await Promise.all([
      // Volume + nb transactions mois courant
      this.prisma.transaction.aggregate({
        where: { tenantId, createdAt: { gte: debut, lte: fin } },
        _count: { id: true },
        _sum: { amount: true },
      }),
      // Volume + nb transactions mois précédent (comparaison)
      this.prisma.transaction.aggregate({
        where: { tenantId, createdAt: { gte: debutPrecedent, lte: finPrecedent } },
        _count: { id: true },
        _sum: { amount: true },
      }),
      // Par type
      this.prisma.transaction.groupBy({
        by: ['type'],
        where: { tenantId, createdAt: { gte: debut, lte: fin } },
        _count: { id: true },
        _sum: { amount: true },
      }),
      // Par opérateur
      this.prisma.transaction.groupBy({
        by: ['operatorCode'],
        where: { tenantId, createdAt: { gte: debut, lte: fin } },
        _count: { id: true },
        _sum: { amount: true },
      }),
      // Par agence (top 10)
      this.prisma.transaction.groupBy({
        by: ['agencyId'],
        where: { tenantId, createdAt: { gte: debut, lte: fin } },
        _count: { id: true },
        _sum: { amount: true },
        orderBy: { _sum: { amount: 'desc' } },
        take: 10,
      }),
      // Commissions
      this.prisma.transaction.aggregate({
        where: {
          tenantId,
          createdAt: { gte: debut, lte: fin },
          status: 'COMPLETED',
        },
        _sum: { commission: true },
        _count: { id: true },
      }),
      // Incidents (CANCELLED + FAILED)
      this.prisma.transaction.aggregate({
        where: {
          tenantId,
          createdAt: { gte: debut, lte: fin },
          status: { in: ['CANCELLED', 'FAILED'] },
        },
        _count: { id: true },
      }),
    ]);

    // Enrichir les agences avec leurs noms
    const agencyIds = parAgence.map((r: any) => r.agencyId).filter(Boolean);
    const agenciesInfo = agencyIds.length
      ? await this.prisma.agency.findMany({
          where: { id: { in: agencyIds } },
          select: { id: true, name: true },
        })
      : [];
    const agencyMap = new Map(agenciesInfo.map((a: any) => [a.id, a.name]));

    // Top 5 agents
    const top5Agents = await this.prisma.transaction.groupBy({
      by: ['agentId'],
      where: {
        tenantId,
        createdAt: { gte: debut, lte: fin },
        status: 'COMPLETED',
      },
      _count: { id: true },
      _sum: { amount: true },
      orderBy: { _sum: { amount: 'desc' } },
      take: 5,
    });

    const agentIds = top5Agents.map((r: any) => r.agentId).filter(Boolean);
    // Agent n'a pas de relation `user` dans le schéma Prisma : on récupère
    // les agents + l'agence, puis les utilisateurs séparément
    const agentsInfo: any[] = agentIds.length
      ? await this.prisma.agent.findMany({
          where: { id: { in: agentIds } },
          include: { agency: { select: { name: true } } },
        })
      : [];
    // Récupérer les utilisateurs pour obtenir firstName/lastName
    const agentUserIds = agentsInfo.map((a: any) => a.userId).filter(Boolean);
    const agentUsers: any[] = agentUserIds.length
      ? await this.prisma.user.findMany({
          where: { id: { in: agentUserIds } },
          select: { id: true, firstName: true, lastName: true },
        })
      : [];
    const agentUserMap = new Map(agentUsers.map((u: any) => [u.id, u]));
    const agentMap = new Map(agentsInfo.map((a: any) => ({
      ...a,
      user: agentUserMap.get(a.userId) ?? null,
    })).map((a: any) => [a.id, a]));

    // ── Calculs ──
    const nbTxCourant: number = txCourant._count.id ?? 0;
    const volCourant: number = txCourant._sum.amount != null ? Number(txCourant._sum.amount) : 0;
    const nbTxPrecedent: number = txPrecedent._count.id ?? 0;
    const volPrecedent: number = txPrecedent._sum.amount != null ? Number(txPrecedent._sum.amount) : 0;
    const varNb = nbTxPrecedent > 0 ? (((nbTxCourant - nbTxPrecedent) / nbTxPrecedent) * 100).toFixed(1) : '—';
    const varVol = volPrecedent > 0 ? (((volCourant - volPrecedent) / volPrecedent) * 100).toFixed(1) : '—';
    const commTotal: number = commissions._sum.commission != null ? Number(commissions._sum.commission) : 0;
    const txCompleted: number = commissions._count.id ?? 0;
    const nbIncidents = incidents._count.id ?? 0;
    const periode = formatMonthFr(annee, mois);
    const generated = new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' });

    // ── Rangées tableau par type ──
    const lignesType = parType.map((r: any) => `
      <tr>
        <td>${TYPE_LABELS[r.type] ?? r.type}</td>
        <td class="num">${r._count.id}</td>
        <td class="num">${formatMontantFCFA(r._sum.amount != null ? Number(r._sum.amount) : 0)}</td>
        <td class="num">${nbTxCourant > 0 ? ((r._count.id / nbTxCourant) * 100).toFixed(1) + ' %' : '—'}</td>
      </tr>
    `).join('');

    const lignesOp = parOperateur.map((r: any) => `
      <tr>
        <td>${r.operatorCode ?? '—'}</td>
        <td class="num">${r._count.id}</td>
        <td class="num">${formatMontantFCFA(r._sum.amount != null ? Number(r._sum.amount) : 0)}</td>
        <td class="num">${nbTxCourant > 0 ? ((r._count.id / nbTxCourant) * 100).toFixed(1) + ' %' : '—'}</td>
      </tr>
    `).join('');

    const lignesAgence = parAgence.map((r: any) => `
      <tr>
        <td>${agencyMap.get((r as any).agencyId) ?? (r as any).agencyId ?? '—'}</td>
        <td class="num">${r._count.id}</td>
        <td class="num">${formatMontantFCFA(r._sum.amount != null ? Number(r._sum.amount) : 0)}</td>
      </tr>
    `).join('');

    const lignesAgents = top5Agents.map((r: any, i: number) => {
      const agent = agentMap.get(r.agentId);
      const nom = agent?.user
        ? `${agent.user.firstName ?? ''} ${agent.user.lastName ?? ''}`.trim()
        : agent?.agentCode ?? r.agentId ?? '—';
      const agence = agent?.agency?.name ?? '—';
      return `
      <tr>
        <td><strong>#${i + 1}</strong> ${nom}</td>
        <td>${agence}</td>
        <td class="num">${r._count.id}</td>
        <td class="num">${formatMontantFCFA(r._sum.amount != null ? Number(r._sum.amount) : 0)}</td>
      </tr>`;
    }).join('');

    const varSign = (v: string, better: 'up' | 'down' = 'up') => {
      if (v === '—') return `<span class="neutral">—</span>`;
      const n = parseFloat(v);
      const up = n >= 0;
      const good = better === 'up' ? up : !up;
      return `<span class="${good ? 'up' : 'down'}">${up ? '▲' : '▼'} ${Math.abs(n)} %</span>`;
    };

    const html = `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="utf-8">
<title>Rapport mensuel GESTMONEY — ${periode}</title>
<style>
  @page { size: A4; margin: 20mm 15mm; }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    font-family: 'Segoe UI', Arial, sans-serif;
    font-size: 12px;
    color: #1e293b;
    background: #fff;
  }
  /* COUVERTURE */
  .cover {
    min-height: 100vh;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    text-align: center;
    page-break-after: always;
    background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%);
    color: #fff;
    padding: 60px 40px;
    border-radius: 0;
  }
  .cover-brand { font-size: 48px; font-weight: 900; letter-spacing: -1px; }
  .cover-brand span { color: #34d399; }
  .cover-tagline { font-size: 14px; opacity: 0.8; margin-top: 6px; }
  .cover-title { font-size: 28px; font-weight: 700; margin-top: 40px; }
  .cover-period { font-size: 20px; margin-top: 8px; opacity: 0.9; font-weight: 600; }
  .cover-generated { font-size: 11px; margin-top: 40px; opacity: 0.6; }
  /* PAGES */
  .page { padding: 24px 0; page-break-after: always; }
  .page:last-child { page-break-after: avoid; }
  h1 { font-size: 20px; font-weight: 800; color: #4f46e5; border-bottom: 2px solid #4f46e5; padding-bottom: 8px; margin-bottom: 16px; }
  h2 { font-size: 15px; font-weight: 700; color: #334155; margin: 20px 0 10px; }
  /* KPI GRID */
  .kpi-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-bottom: 20px; }
  .kpi-card {
    background: #f8fafc;
    border-radius: 10px;
    padding: 14px 18px;
    border: 1px solid #e2e8f0;
  }
  .kpi-label { font-size: 10px; text-transform: uppercase; letter-spacing: 0.5px; color: #94a3b8; }
  .kpi-value { font-size: 22px; font-weight: 800; color: #1e293b; margin: 4px 0; }
  .kpi-var { font-size: 11px; }
  .up { color: #16a34a; }
  .down { color: #dc2626; }
  .neutral { color: #64748b; }
  /* TABLE */
  table { width: 100%; border-collapse: collapse; margin-bottom: 16px; }
  th {
    background: #4f46e5;
    color: #fff;
    font-size: 11px;
    text-align: left;
    padding: 8px 10px;
    font-weight: 600;
  }
  td { padding: 7px 10px; border-bottom: 1px solid #f1f5f9; font-size: 11px; }
  tr:last-child td { border-bottom: none; }
  tr:nth-child(even) td { background: #f8fafc; }
  .num { text-align: right; font-family: monospace; }
  tfoot td { font-weight: 700; background: #ede9fe !important; color: #4f46e5; }
  /* FOOTER */
  .page-footer { text-align: center; font-size: 10px; color: #94a3b8; margin-top: 24px; padding-top: 10px; border-top: 1px solid #e2e8f0; }
</style>
</head>
<body>

<!-- PAGE 1 : COUVERTURE -->
<div class="cover">
  <div class="cover-brand">GEST<span>MONEY</span></div>
  <div class="cover-tagline">Plateforme de gestion Mobile Money — IBIG Soft</div>
  <div class="cover-title">Rapport Mensuel d'Activité</div>
  <div class="cover-period">${periode}</div>
  <div class="cover-generated">Document généré le ${generated}</div>
</div>

<!-- PAGE 2 : RÉSUMÉ EXÉCUTIF -->
<div class="page">
  <h1>Résumé Exécutif</h1>
  <div class="kpi-grid">
    <div class="kpi-card">
      <div class="kpi-label">Nb transactions</div>
      <div class="kpi-value">${nbTxCourant.toLocaleString('fr-FR')}</div>
      <div class="kpi-var">vs mois précédent : ${varSign(varNb)}</div>
    </div>
    <div class="kpi-card">
      <div class="kpi-label">Volume traité</div>
      <div class="kpi-value">${formatMontantFCFA(volCourant)}</div>
      <div class="kpi-var">vs mois précédent : ${varSign(varVol)}</div>
    </div>
    <div class="kpi-card">
      <div class="kpi-label">Commissions versées</div>
      <div class="kpi-value">${formatMontantFCFA(commTotal)}</div>
      <div class="kpi-var">Sur ${txCompleted} transactions complétées</div>
    </div>
    <div class="kpi-card">
      <div class="kpi-label">Incidents</div>
      <div class="kpi-value">${nbIncidents}</div>
      <div class="kpi-var">Annulations + échecs</div>
    </div>
  </div>
  <div class="page-footer">GESTMONEY — Rapport ${periode} — Confidentiel</div>
</div>

<!-- PAGE 3 : TRANSACTIONS PAR TYPE -->
<div class="page">
  <h1>Transactions par type</h1>
  <table>
    <thead><tr><th>Type</th><th>Nb transactions</th><th>Volume</th><th>Part</th></tr></thead>
    <tbody>${lignesType || '<tr><td colspan="4" style="text-align:center;color:#94a3b8">Aucune donnée</td></tr>'}</tbody>
    <tfoot><tr><td>TOTAL</td><td class="num">${nbTxCourant.toLocaleString('fr-FR')}</td><td class="num">${formatMontantFCFA(volCourant)}</td><td class="num">100 %</td></tr></tfoot>
  </table>
  <div class="page-footer">GESTMONEY — Rapport ${periode} — Confidentiel</div>
</div>

<!-- PAGE 4 : PAR OPÉRATEUR -->
<div class="page">
  <h1>Transactions par opérateur</h1>
  <table>
    <thead><tr><th>Opérateur</th><th>Nb transactions</th><th>Volume</th><th>Part</th></tr></thead>
    <tbody>${lignesOp || '<tr><td colspan="4" style="text-align:center;color:#94a3b8">Aucune donnée</td></tr>'}</tbody>
  </table>
  <div class="page-footer">GESTMONEY — Rapport ${periode} — Confidentiel</div>
</div>

<!-- PAGE 5 : PERFORMANCE DES AGENCES -->
<div class="page">
  <h1>Performance des agences (Top 10)</h1>
  <table>
    <thead><tr><th>Agence</th><th>Nb transactions</th><th>Volume</th></tr></thead>
    <tbody>${lignesAgence || '<tr><td colspan="3" style="text-align:center;color:#94a3b8">Aucune donnée</td></tr>'}</tbody>
  </table>

  <h2>Top 5 agents</h2>
  <table>
    <thead><tr><th>Agent</th><th>Agence</th><th>Nb transactions</th><th>Volume</th></tr></thead>
    <tbody>${lignesAgents || '<tr><td colspan="4" style="text-align:center;color:#94a3b8">Aucune donnée</td></tr>'}</tbody>
  </table>
  <div class="page-footer">GESTMONEY — Rapport ${periode} — Confidentiel</div>
</div>

<!-- PAGE 6 : COMMISSIONS -->
<div class="page">
  <h1>Commissions versées</h1>
  <div class="kpi-grid">
    <div class="kpi-card">
      <div class="kpi-label">Total commissions</div>
      <div class="kpi-value">${formatMontantFCFA(commTotal)}</div>
      <div class="kpi-var">Transactions complétées : ${txCompleted}</div>
    </div>
    <div class="kpi-card">
      <div class="kpi-label">Commission moyenne / tx</div>
      <div class="kpi-value">${txCompleted > 0 ? formatMontantFCFA(Math.round(commTotal / txCompleted)) : '—'}</div>
      <div class="kpi-var">&nbsp;</div>
    </div>
  </div>

  <h2>Incidents du mois</h2>
  <table>
    <thead><tr><th>Catégorie</th><th>Nb</th></tr></thead>
    <tbody>
      <tr><td>Annulations + Échecs</td><td class="num">${nbIncidents}</td></tr>
      <tr><td>Taux d'incidents</td><td class="num">${nbTxCourant > 0 ? ((nbIncidents / nbTxCourant) * 100).toFixed(2) + ' %' : '—'}</td></tr>
    </tbody>
  </table>
  <div class="page-footer">GESTMONEY — Rapport ${periode} — Document généré le ${generated} — IBIG Soft</div>
</div>

</body>
</html>`;

    return Buffer.from(html, 'utf-8');
  }

  // ─── Helpers privés ───────────────────────────────────────────────────────────

  private async _getTenantInfo(tenantId: string): Promise<{ name: string; ninea: string; rccm: string; adresse: string }> {
    const tenant = await this.prisma.tenant.findUnique({ where: { id: tenantId } });
    const settings: any = (tenant as any)?.settings ?? {};
    return {
      name: (tenant as any)?.name ?? 'GESTMONEY',
      ninea: settings.ninea ?? settings.NINEA ?? '—',
      rccm: settings.rccm ?? settings.RCCM ?? '—',
      adresse: settings.adresse ?? settings.address ?? '—',
    };
  }

  private _entetePdf(tenant: { name: string; ninea: string; rccm: string; adresse: string }, titre: string, exercice: string): string {
    return `
<div class="entete">
  <div class="entete-left">
    <div class="brand">GEST<span>MONEY</span></div>
    <div class="entete-nom">${tenant.name}</div>
    ${tenant.ninea !== '—' ? `<div class="entete-meta">NINEA : ${tenant.ninea}</div>` : ''}
    ${tenant.rccm !== '—' ? `<div class="entete-meta">RCCM : ${tenant.rccm}</div>` : ''}
    ${tenant.adresse !== '—' ? `<div class="entete-meta">${tenant.adresse}</div>` : ''}
  </div>
  <div class="entete-right">
    <div class="entete-titre">${titre}</div>
    <div class="entete-exercice">Exercice : ${exercice}</div>
    <div class="entete-sysco">Conforme SYSCOHADA</div>
  </div>
</div>`;
  }

  private _cssCommun(): string {
    return `
  @page { size: A4 portrait; margin: 18mm 14mm; }
  @media print { body { print-color-adjust: exact; -webkit-print-color-adjust: exact; } }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Segoe UI', Arial, sans-serif; font-size: 11px; color: #1e293b; background: #fff; }
  .entete { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #4f46e5; padding-bottom: 12px; margin-bottom: 18px; }
  .brand { font-size: 24px; font-weight: 900; color: #4f46e5; letter-spacing: -0.5px; }
  .brand span { color: #10b981; }
  .entete-nom { font-size: 13px; font-weight: 700; margin-top: 4px; }
  .entete-meta { font-size: 11px; color: #64748b; margin-top: 2px; }
  .entete-right { text-align: right; }
  .entete-titre { font-size: 16px; font-weight: 800; color: #1e293b; }
  .entete-exercice { font-size: 12px; color: #64748b; margin-top: 4px; }
  .entete-sysco { font-size: 10px; color: #10b981; font-weight: 700; margin-top: 6px; letter-spacing: 0.5px; text-transform: uppercase; }
  table { width: 100%; border-collapse: collapse; margin-bottom: 14px; }
  th { background: #4f46e5; color: #fff; font-size: 10px; text-align: left; padding: 7px 10px; font-weight: 700; letter-spacing: 0.3px; }
  th.r { text-align: right; }
  td { padding: 6px 10px; border-bottom: 1px solid #f1f5f9; font-size: 11px; }
  tr:nth-child(even) td { background: #f8fafc; }
  .r { text-align: right; font-variant-numeric: tabular-nums; }
  .total-row td { font-weight: 700; background: #ede9fe !important; color: #4f46e5; }
  .section-header td { background: #f1f5f9 !important; font-weight: 700; font-size: 11px; color: #374151; text-transform: uppercase; letter-spacing: 0.3px; }
  .pied { text-align: center; font-size: 10px; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 10px; margin-top: 14px; }
  .resultat-net-benefice { text-align: center; padding: 10px; border-radius: 8px; background: rgba(16,185,129,0.1); border: 1px solid #10b981; color: #065f46; font-weight: 800; font-size: 14px; margin: 10px 0; }
  .resultat-net-perte { text-align: center; padding: 10px; border-radius: 8px; background: rgba(220,38,38,0.1); border: 1px solid #dc2626; color: #991b1b; font-weight: 800; font-size: 14px; margin: 10px 0; }
  .signature { display: flex; justify-content: flex-end; margin-top: 28px; }
  .signature-bloc { text-align: center; }
  .signature-ligne { border-top: 1px solid #1e293b; width: 200px; margin: 0 auto 6px; }
  .signature-label { font-size: 11px; color: #64748b; }
`;
  }

  // ─── Bilan annuel OHADA ───────────────────────────────────────────────────────

  async genererBilanPdf(tenantId: string, annee: number, bilanData: any): Promise<Buffer> {
    const tenant = await this._getTenantInfo(tenantId);
    const generated = new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });

    const formatM = (v: any) => {
      const n = parseFloat(String(v ?? '0')) || 0;
      return new Intl.NumberFormat('fr-FR').format(Math.round(n)) + ' XOF';
    };

    const lignesSection = (postes: any[], vide = 'Aucun poste') => {
      if (!postes || postes.length === 0) {
        return `<tr><td colspan="2" style="color:#94a3b8;font-style:italic">${vide}</td></tr>`;
      }
      return postes.map((p: any) => `
        <tr>
          <td>${p.accountNumber} — ${p.label}</td>
          <td class="r">${formatM(p.montant)}</td>
        </tr>`).join('');
    };

    const actif = bilanData?.actif ?? {};
    const passif = bilanData?.passif ?? {};

    const html = `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="utf-8">
<title>Bilan annuel ${annee} — ${tenant.name}</title>
<style>${this._cssCommun()}
.bilan-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
</style>
</head>
<body>

${this._entetePdf(tenant, 'BILAN ANNUEL', String(annee))}

<div class="bilan-grid">
  <!-- ACTIF -->
  <div>
    <table>
      <thead>
        <tr><th colspan="2">ACTIF</th></tr>
      </thead>
      <tbody>
        <tr class="section-header"><td colspan="2">Immobilisations (classe 2)</td></tr>
        ${lignesSection(actif.immobilisations)}
        <tr class="section-header"><td colspan="2">Stocks (classe 3)</td></tr>
        ${lignesSection(actif.stocks)}
        <tr class="section-header"><td colspan="2">Créances (classe 4)</td></tr>
        ${lignesSection(actif.creances)}
        <tr class="section-header"><td colspan="2">Trésorerie (classe 5)</td></tr>
        ${lignesSection(actif.tresorerie)}
      </tbody>
      <tfoot>
        <tr class="total-row"><td>TOTAL ACTIF</td><td class="r">${formatM(actif.totalActif)}</td></tr>
      </tfoot>
    </table>
  </div>

  <!-- PASSIF -->
  <div>
    <table>
      <thead>
        <tr><th colspan="2">PASSIF</th></tr>
      </thead>
      <tbody>
        <tr class="section-header"><td colspan="2">Capitaux propres (classe 1)</td></tr>
        ${lignesSection(passif.capitaux)}
        <tr class="section-header"><td colspan="2">Dettes (classes 4/1)</td></tr>
        ${lignesSection(passif.dettes)}
      </tbody>
      <tfoot>
        <tr class="total-row"><td>TOTAL PASSIF</td><td class="r">${formatM(passif.totalPassif)}</td></tr>
      </tfoot>
    </table>

    ${bilanData?.isBalanced
      ? `<div style="color:#10b981;font-weight:700;font-size:11px;margin-top:6px;">✓ Bilan équilibré — Actif = Passif</div>`
      : `<div style="color:#dc2626;font-weight:700;font-size:11px;margin-top:6px;">⚠ Bilan déséquilibré — Écart : ${formatM(bilanData?.difference)}</div>`
    }
  </div>
</div>

<div class="pied">
  Imprimé le ${generated} — ${tenant.name} — Bilan ${annee} — Conforme SYSCOHADA
</div>

</body>
</html>`;

    return Buffer.from(html, 'utf-8');
  }

  // ─── Compte de résultat OHADA ─────────────────────────────────────────────────

  async genererCompteResultatPdf(tenantId: string, annee: number, crData: any): Promise<Buffer> {
    const tenant = await this._getTenantInfo(tenantId);
    const generated = new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });

    const formatM = (v: any) => {
      const n = parseFloat(String(v ?? '0')) || 0;
      return new Intl.NumberFormat('fr-FR').format(Math.round(n)) + ' XOF';
    };

    const signedColor = (v: any) => {
      const n = parseFloat(String(v ?? '0')) || 0;
      return n >= 0 ? '#065f46' : '#991b1b';
    };

    const lignesSection = (items: any[]) => {
      if (!items || items.length === 0) {
        return `<tr><td colspan="2" style="color:#94a3b8;font-style:italic">Aucun mouvement</td></tr>`;
      }
      return items.map((i: any) => `
        <tr>
          <td>${i.compte} — ${i.libelle}</td>
          <td class="r">${formatM(i.montant)}</td>
        </tr>`).join('');
    };

    const periode = crData?.periode
      ? `${crData.periode.debut} au ${crData.periode.fin}`
      : String(annee);

    const rNet = parseFloat(String(crData?.resultatNet ?? '0')) || 0;
    const rNetClass = rNet >= 0 ? 'resultat-net-benefice' : 'resultat-net-perte';
    const rNetLabel = rNet >= 0 ? 'BÉNÉFICE NET' : 'PERTE NETTE';

    const html = `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="utf-8">
<title>Compte de résultat ${annee} — ${tenant.name}</title>
<style>${this._cssCommun()}
.cr-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
.ri-bloc { margin: 14px 0; padding: 8px 12px; background:#f8fafc; border-left: 3px solid #4f46e5; border-radius: 0 6px 6px 0; }
.ri-label { font-size: 11px; color: #64748b; }
.ri-val { font-size: 13px; font-weight: 800; }
</style>
</head>
<body>

${this._entetePdf(tenant, 'COMPTE DE RÉSULTAT', String(annee))}
<div style="font-size:11px;color:#64748b;margin-bottom:10px;">Période : ${periode}</div>

<!-- EXPLOITATION -->
<div style="font-size:12px;font-weight:700;color:#4f46e5;margin-bottom:6px;text-transform:uppercase;letter-spacing:0.3px;">I. Résultat d'exploitation</div>
<div class="cr-grid">
  <table>
    <thead><tr><th>Produits d'exploitation (70–75)</th><th class="r">Montant</th></tr></thead>
    <tbody>${lignesSection(crData?.produitsExploitation)}</tbody>
    <tfoot><tr class="total-row"><td>Total produits</td><td class="r">${formatM(crData?.totalProduitsExploitation)}</td></tr></tfoot>
  </table>
  <table>
    <thead><tr><th>Charges d'exploitation (60–65)</th><th class="r">Montant</th></tr></thead>
    <tbody>${lignesSection(crData?.chargesExploitation)}</tbody>
    <tfoot><tr class="total-row"><td>Total charges</td><td class="r">${formatM(crData?.totalChargesExploitation)}</td></tr></tfoot>
  </table>
</div>
<div class="ri-bloc">
  <div class="ri-label">Résultat d'exploitation (Produits − Charges)</div>
  <div class="ri-val" style="color:${signedColor(crData?.resultatExploitation)}">${formatM(crData?.resultatExploitation)}</div>
</div>

<!-- FINANCIER -->
<div style="font-size:12px;font-weight:700;color:#4f46e5;margin-bottom:6px;text-transform:uppercase;letter-spacing:0.3px;">II. Résultat financier</div>
<div class="cr-grid">
  <table>
    <thead><tr><th>Produits financiers (76)</th><th class="r">Montant</th></tr></thead>
    <tbody>${lignesSection(crData?.produitsFinanciers)}</tbody>
    <tfoot><tr class="total-row"><td>Total produits financiers</td><td class="r">${formatM(crData?.totalProduitsFinanciers)}</td></tr></tfoot>
  </table>
  <table>
    <thead><tr><th>Charges financières (66)</th><th class="r">Montant</th></tr></thead>
    <tbody>${lignesSection(crData?.chargesFinancieres)}</tbody>
    <tfoot><tr class="total-row"><td>Total charges financières</td><td class="r">${formatM(crData?.totalChargesFinancieres)}</td></tr></tfoot>
  </table>
</div>
<div class="ri-bloc">
  <div class="ri-label">Résultat financier</div>
  <div class="ri-val" style="color:${signedColor(crData?.resultatFinancier)}">${formatM(crData?.resultatFinancier)}</div>
</div>

<!-- EXCEPTIONNEL -->
<div style="font-size:12px;font-weight:700;color:#4f46e5;margin-bottom:6px;text-transform:uppercase;letter-spacing:0.3px;">III. Résultat exceptionnel</div>
<div class="cr-grid">
  <table>
    <thead><tr><th>Produits exceptionnels (77–78)</th><th class="r">Montant</th></tr></thead>
    <tbody>${lignesSection(crData?.produitsExceptionnels)}</tbody>
    <tfoot><tr class="total-row"><td>Total produits exceptionnels</td><td class="r">${formatM(crData?.totalProduitsExceptionnels)}</td></tr></tfoot>
  </table>
  <table>
    <thead><tr><th>Charges exceptionnelles (67–68)</th><th class="r">Montant</th></tr></thead>
    <tbody>${lignesSection(crData?.chargesExceptionnelles)}</tbody>
    <tfoot><tr class="total-row"><td>Total charges exceptionnelles</td><td class="r">${formatM(crData?.totalChargesExceptionnelles)}</td></tr></tfoot>
  </table>
</div>
<div class="ri-bloc">
  <div class="ri-label">Résultat exceptionnel</div>
  <div class="ri-val" style="color:${signedColor(crData?.resultatExceptionnel)}">${formatM(crData?.resultatExceptionnel)}</div>
</div>

<!-- SYNTHÈSE -->
<table>
  <thead><tr><th colspan="2">Synthèse</th></tr></thead>
  <tbody>
    <tr><td>Résultat avant impôt</td><td class="r" style="font-weight:700">${formatM(crData?.resultatAvantImpot)}</td></tr>
    <tr><td>Impôt sur les bénéfices (69)</td><td class="r" style="color:#dc2626">${formatM(crData?.impotBenefices)}</td></tr>
  </tbody>
</table>

<div class="${rNetClass}">${rNetLabel} : ${formatM(crData?.resultatNet)}</div>

<div class="signature">
  <div class="signature-bloc">
    <div class="signature-ligne"></div>
    <div class="signature-label">Le Directeur Général<br>Bon pour accord</div>
  </div>
</div>

<div class="pied">
  Imprimé le ${generated} — ${tenant.name} — Compte de résultat ${annee} — Conforme SYSCOHADA OHADA
</div>

</body>
</html>`;

    return Buffer.from(html, 'utf-8');
  }

  // ─── Bulletin de paie agent ───────────────────────────────────────────────────

  async genererBulletinPaiePdf(tenantId: string, agentId: string, mois: number, annee: number): Promise<Buffer> {
    const tenant = await this._getTenantInfo(tenantId);
    const generated = new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });

    // Récupérer l'agent
    const agent = await (this.prisma as any).agent.findFirst({
      where: { id: agentId, tenantId },
      include: { agency: { select: { name: true } } },
    });
    if (!agent) throw new NotFoundException(`Agent ${agentId} introuvable`);

    // Récupérer l'utilisateur lié à l'agent
    let agentNom = agent.agentCode ?? agentId;
    let agentPrenom = '';
    if (agent.userId) {
      const u = await (this.prisma as any).user.findUnique({
        where: { id: agent.userId },
        select: { firstName: true, lastName: true, phone: true },
      });
      if (u) {
        agentNom = u.lastName ?? agentNom;
        agentPrenom = u.firstName ?? '';
      }
    }

    // Commissions du mois (transactions COMPLETED de l'agent)
    const debut = new Date(annee, mois - 1, 1, 0, 0, 0, 0);
    const fin = new Date(annee, mois, 0, 23, 59, 59, 999);

    const commAgg = await (this.prisma as any).transaction.aggregate({
      where: {
        tenantId,
        agentId,
        status: 'COMPLETED',
        createdAt: { gte: debut, lte: fin },
      },
      _sum: { commission: true, amount: true },
      _count: { id: true },
    });

    const commissionsTotal = parseFloat(String(commAgg._sum.commission ?? '0')) || 0;
    const volumeTotal = parseFloat(String(commAgg._sum.amount ?? '0')) || 0;
    const nbTx = commAgg._count.id ?? 0;

    // Calcul de la rémunération
    const salaireBase = 60_000; // SMIG mensuel Côte d'Ivoire
    const brut = salaireBase + commissionsTotal;
    const cnss = Math.round(brut * 0.063); // 6,3 % salarié
    const brutImposable = brut - cnss;
    const igr = this._computeIGR(brutImposable * 12); // IGR mensuel
    const netAPayer = brut - cnss - igr;

    const periodeMois = new Date(annee, mois - 1, 1).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
    const matricule = agent.agentCode ?? agentId.slice(0, 8).toUpperCase();

    const formatM = (v: number) => new Intl.NumberFormat('fr-FR').format(Math.round(v)) + ' FCFA';

    const html = `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="utf-8">
<title>Bulletin de paie — ${agentPrenom} ${agentNom} — ${periodeMois}</title>
<style>${this._cssCommun()}
.bulletin-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-bottom: 16px; }
.info-bloc { background: #f8fafc; border-radius: 8px; padding: 12px 14px; border: 1px solid #e2e8f0; }
.info-titre { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; color: #94a3b8; margin-bottom: 8px; }
.info-row { display: flex; justify-content: space-between; font-size: 11px; margin-bottom: 4px; }
.info-label { color: #64748b; }
.info-val { font-weight: 600; }
.net-row td { background: #f0fdf4 !important; font-weight: 800; font-size: 14px; color: #065f46; }
.cachet { display: flex; justify-content: space-between; margin-top: 24px; gap: 24px; }
.cachet-bloc { flex: 1; text-align: center; border: 1px dashed #94a3b8; border-radius: 8px; padding: 16px; }
.cachet-titre { font-size: 10px; color: #94a3b8; margin-bottom: 30px; }
</style>
</head>
<body>

${this._entetePdf(tenant, 'BULLETIN DE PAIE', periodeMois)}

<div class="bulletin-grid">
  <div class="info-bloc">
    <div class="info-titre">Employeur</div>
    <div class="info-row"><span class="info-label">Réseau</span><span class="info-val">${tenant.name}</span></div>
    ${tenant.ninea !== '—' ? `<div class="info-row"><span class="info-label">NINEA</span><span class="info-val">${tenant.ninea}</span></div>` : ''}
    ${tenant.adresse !== '—' ? `<div class="info-row"><span class="info-label">Adresse</span><span class="info-val">${tenant.adresse}</span></div>` : ''}
  </div>
  <div class="info-bloc">
    <div class="info-titre">Agent</div>
    <div class="info-row"><span class="info-label">Nom</span><span class="info-val">${agentNom} ${agentPrenom}</span></div>
    <div class="info-row"><span class="info-label">Matricule</span><span class="info-val">${matricule}</span></div>
    <div class="info-row"><span class="info-label">Poste</span><span class="info-val">Agent Mobile Money</span></div>
    <div class="info-row"><span class="info-label">Agence</span><span class="info-val">${agent.agency?.name ?? '—'}</span></div>
    <div class="info-row"><span class="info-label">Période</span><span class="info-val">${periodeMois}</span></div>
  </div>
</div>

<div style="font-size:10px;color:#64748b;margin-bottom:8px;">
  Activité du mois : ${nbTx.toLocaleString('fr-FR')} transaction(s) complétée(s) · Volume : ${formatM(volumeTotal)}
</div>

<table>
  <thead>
    <tr>
      <th>Libellé</th>
      <th class="r">Base / Taux</th>
      <th class="r">Montant</th>
    </tr>
  </thead>
  <tbody>
    <tr class="section-header"><td colspan="3">Rémunération brute</td></tr>
    <tr>
      <td>Salaire de base (SMIG)</td>
      <td class="r">mensuel</td>
      <td class="r">${formatM(salaireBase)}</td>
    </tr>
    <tr>
      <td>Commissions du mois</td>
      <td class="r">${nbTx} tx</td>
      <td class="r">${formatM(commissionsTotal)}</td>
    </tr>
    <tr class="total-row">
      <td colspan="2">Salaire brut</td>
      <td class="r">${formatM(brut)}</td>
    </tr>
    <tr class="section-header"><td colspan="3">Retenues salariales</td></tr>
    <tr>
      <td>CNSS — Part salariale</td>
      <td class="r">6,3 %</td>
      <td class="r" style="color:#dc2626">${formatM(cnss)}</td>
    </tr>
    <tr>
      <td>IGR / IRPP (barème progressif)</td>
      <td class="r">mensuel</td>
      <td class="r" style="color:#dc2626">${formatM(igr)}</td>
    </tr>
  </tbody>
  <tfoot>
    <tr class="net-row">
      <td colspan="2">NET À PAYER</td>
      <td class="r">${formatM(netAPayer)}</td>
    </tr>
  </tfoot>
</table>

<div class="cachet">
  <div class="cachet-bloc">
    <div class="cachet-titre">Cachet et signature employeur</div>
    <div style="font-size:11px;color:#94a3b8">Bon pour paiement</div>
  </div>
  <div class="cachet-bloc">
    <div class="cachet-titre">Signature de l'agent</div>
    <div style="font-size:11px;color:#94a3b8">Lu et approuvé</div>
  </div>
</div>

<div class="pied">
  Imprimé le ${generated} — ${tenant.name} — Bulletin ${periodeMois} — Agent ${matricule} — CNSS 6,3% · IGR progressif CI
</div>

</body>
</html>`;

    return Buffer.from(html, 'utf-8');
  }

  private _computeIGR(annualTaxableIncome: number): number {
    const slabs = [
      { limit: 600_000, rate: 0 },
      { limit: 1_800_000, rate: 0.05 },
      { limit: 3_000_000, rate: 0.10 },
      { limit: 6_000_000, rate: 0.15 },
      { limit: 12_000_000, rate: 0.20 },
      { limit: Infinity, rate: 0.25 },
    ];
    let tax = 0;
    let prev = 0;
    for (const slab of slabs) {
      if (annualTaxableIncome <= prev) break;
      const taxable = Math.min(annualTaxableIncome, slab.limit) - prev;
      tax += taxable * slab.rate;
      prev = slab.limit;
    }
    return Math.round(tax / 12);
  }
}
