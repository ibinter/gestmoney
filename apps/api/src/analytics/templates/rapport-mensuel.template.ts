/**
 * Template HTML pour le rapport mensuel automatique GESTMONEY.
 * Généré côté serveur et envoyé par email aux NETWORK_ADMIN.
 */

export interface RapportMensuelData {
  nomReseau: string;
  moisAnnee: string;           // ex. "Juin 2025"
  moisAnneeUrl: string;        // ex. "2025-06"
  dashboardUrl: string;

  // KPIs du mois en cours
  nbTransactions: number;
  volume: number;
  commissions: number;
  agentsActifs: number;

  // Evolution vs mois précédent (en %)
  evoTransactions: number;
  evoVolume: number;
  evoCommissions: number;
  evoAgents: number;

  // Top 3 agences
  topAgences: { nom: string; nbTx: number; volume: number }[];

  // Top 3 agents
  topAgents: { nom: string; agence: string; nbTx: number; volume: number }[];

  currency: string; // ex. "XOF"
}

function formaterMontant(n: number, currency: string): string {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency, maximumFractionDigits: 0 }).format(n);
}

function evo(v: number): string {
  const color = v >= 0 ? '#16a34a' : '#dc2626';
  const arrow = v >= 0 ? '↑' : '↓';
  return `<span style="color:${color};font-weight:600;">${arrow} ${Math.abs(v).toFixed(1)} %</span>`;
}

export function genererRapportMensuelHtml(d: RapportMensuelData): string {
  const curr = d.currency || 'XOF';

  const lignesAgences = d.topAgences.map((a, i) =>
    `<tr style="background:${i % 2 === 0 ? '#f9fafb' : '#ffffff'};">
      <td style="padding:8px 12px;">${i + 1}. ${a.nom}</td>
      <td style="padding:8px 12px;text-align:right;">${a.nbTx}</td>
      <td style="padding:8px 12px;text-align:right;">${formaterMontant(a.volume, curr)}</td>
    </tr>`
  ).join('');

  const lignesAgents = d.topAgents.map((a, i) =>
    `<tr style="background:${i % 2 === 0 ? '#f9fafb' : '#ffffff'};">
      <td style="padding:8px 12px;">${i + 1}. ${a.nom}</td>
      <td style="padding:8px 12px;">${a.agence}</td>
      <td style="padding:8px 12px;text-align:right;">${a.nbTx}</td>
      <td style="padding:8px 12px;text-align:right;">${formaterMontant(a.volume, curr)}</td>
    </tr>`
  ).join('');

  return `<!doctype html>
<html lang="fr">
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1.0"/>
  <title>Rapport mensuel — ${d.nomReseau} — ${d.moisAnnee}</title>
</head>
<body style="margin:0;padding:0;background:#f0f4f8;font-family:Arial,Helvetica,sans-serif;color:#1f2937;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f0f4f8;padding:28px 0;">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0"
             style="max-width:620px;background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.10);">

        <!-- HEADER -->
        <tr>
          <td style="background:#0a2e15;padding:22px 32px;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td>
                  <span style="color:#ffffff;font-size:22px;font-weight:800;letter-spacing:1px;">GESTMONEY</span>
                </td>
                <td align="right">
                  <span style="color:#86efac;font-size:12px;">Rapport mensuel automatique</span>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- TITRE -->
        <tr>
          <td style="padding:28px 32px 20px;border-bottom:1px solid #e5e7eb;">
            <h1 style="margin:0;font-size:20px;color:#0a2e15;font-weight:700;">
              ${d.nomReseau}
            </h1>
            <p style="margin:6px 0 0;font-size:15px;color:#6b7280;">Rapport mensuel — ${d.moisAnnee}</p>
          </td>
        </tr>

        <!-- KPI 4 CASES -->
        <tr>
          <td style="padding:24px 32px 8px;">
            <p style="margin:0 0 12px;font-size:13px;font-weight:600;text-transform:uppercase;color:#6b7280;letter-spacing:0.5px;">
              Indicateurs clés du mois
            </p>
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td width="25%" style="padding:0 6px 0 0;">
                  <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:14px;text-align:center;">
                    <div style="font-size:22px;font-weight:700;color:#15803d;">${d.nbTransactions.toLocaleString('fr-FR')}</div>
                    <div style="font-size:11px;color:#6b7280;margin-top:4px;">Transactions</div>
                  </div>
                </td>
                <td width="25%" style="padding:0 6px;">
                  <div style="background:#eff6ff;border:1px solid #bfdbfe;border-radius:8px;padding:14px;text-align:center;">
                    <div style="font-size:16px;font-weight:700;color:#1d4ed8;">${formaterMontant(d.volume, curr)}</div>
                    <div style="font-size:11px;color:#6b7280;margin-top:4px;">Volume</div>
                  </div>
                </td>
                <td width="25%" style="padding:0 6px;">
                  <div style="background:#fefce8;border:1px solid #fde68a;border-radius:8px;padding:14px;text-align:center;">
                    <div style="font-size:16px;font-weight:700;color:#b45309;">${formaterMontant(d.commissions, curr)}</div>
                    <div style="font-size:11px;color:#6b7280;margin-top:4px;">Commissions</div>
                  </div>
                </td>
                <td width="25%" style="padding:0 0 0 6px;">
                  <div style="background:#faf5ff;border:1px solid #e9d5ff;border-radius:8px;padding:14px;text-align:center;">
                    <div style="font-size:22px;font-weight:700;color:#7e22ce;">${d.agentsActifs}</div>
                    <div style="font-size:11px;color:#6b7280;margin-top:4px;">Agents actifs</div>
                  </div>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- EVOLUTION VS MOIS PRECEDENT -->
        <tr>
          <td style="padding:20px 32px 8px;">
            <p style="margin:0 0 12px;font-size:13px;font-weight:600;text-transform:uppercase;color:#6b7280;letter-spacing:0.5px;">
              Performance vs mois précédent
            </p>
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0"
                   style="border:1px solid #e5e7eb;border-radius:8px;overflow:hidden;font-size:14px;">
              <tr style="background:#f9fafb;">
                <td style="padding:10px 14px;color:#374151;">Transactions</td>
                <td style="padding:10px 14px;text-align:right;">${evo(d.evoTransactions)}</td>
              </tr>
              <tr>
                <td style="padding:10px 14px;color:#374151;">Volume traité</td>
                <td style="padding:10px 14px;text-align:right;">${evo(d.evoVolume)}</td>
              </tr>
              <tr style="background:#f9fafb;">
                <td style="padding:10px 14px;color:#374151;">Commissions générées</td>
                <td style="padding:10px 14px;text-align:right;">${evo(d.evoCommissions)}</td>
              </tr>
              <tr>
                <td style="padding:10px 14px;color:#374151;">Agents actifs</td>
                <td style="padding:10px 14px;text-align:right;">${evo(d.evoAgents)}</td>
              </tr>
            </table>
          </td>
        </tr>

        <!-- TOP 3 AGENCES -->
        <tr>
          <td style="padding:20px 32px 8px;">
            <p style="margin:0 0 12px;font-size:13px;font-weight:600;text-transform:uppercase;color:#6b7280;letter-spacing:0.5px;">
              Top 3 agences du mois
            </p>
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0"
                   style="border:1px solid #e5e7eb;border-radius:8px;overflow:hidden;font-size:14px;">
              <tr style="background:#0a2e15;">
                <th style="padding:10px 12px;color:#ffffff;text-align:left;font-weight:600;">Agence</th>
                <th style="padding:10px 12px;color:#ffffff;text-align:right;font-weight:600;">Tx</th>
                <th style="padding:10px 12px;color:#ffffff;text-align:right;font-weight:600;">Volume</th>
              </tr>
              ${lignesAgences || '<tr><td colspan="3" style="padding:12px;text-align:center;color:#9ca3af;">Aucune donnée</td></tr>'}
            </table>
          </td>
        </tr>

        <!-- TOP 3 AGENTS -->
        <tr>
          <td style="padding:20px 32px 8px;">
            <p style="margin:0 0 12px;font-size:13px;font-weight:600;text-transform:uppercase;color:#6b7280;letter-spacing:0.5px;">
              Top 3 agents du mois
            </p>
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0"
                   style="border:1px solid #e5e7eb;border-radius:8px;overflow:hidden;font-size:14px;">
              <tr style="background:#0a2e15;">
                <th style="padding:10px 12px;color:#ffffff;text-align:left;font-weight:600;">Agent</th>
                <th style="padding:10px 12px;color:#ffffff;text-align:left;font-weight:600;">Agence</th>
                <th style="padding:10px 12px;color:#ffffff;text-align:right;font-weight:600;">Tx</th>
                <th style="padding:10px 12px;color:#ffffff;text-align:right;font-weight:600;">Volume</th>
              </tr>
              ${lignesAgents || '<tr><td colspan="4" style="padding:12px;text-align:center;color:#9ca3af;">Aucune donnée</td></tr>'}
            </table>
          </td>
        </tr>

        <!-- CTA -->
        <tr>
          <td style="padding:24px 32px;text-align:center;">
            <a href="${d.dashboardUrl}"
               style="display:inline-block;background:#0a2e15;color:#ffffff;font-weight:700;font-size:15px;
                      padding:14px 32px;border-radius:8px;text-decoration:none;letter-spacing:0.3px;">
              Voir le rapport complet →
            </a>
          </td>
        </tr>

        <!-- FOOTER -->
        <tr>
          <td style="padding:18px 32px;background:#f9fafb;border-top:1px solid #e5e7eb;font-size:12px;color:#9ca3af;text-align:center;">
            <p style="margin:0;">IBIG Soft · Plateforme GESTMONEY</p>
            <p style="margin:6px 0 0;">Cet email est généré automatiquement. Merci de ne pas y répondre.</p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}
