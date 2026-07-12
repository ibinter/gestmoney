// ============================================================
// GESTMONEY — Templates HTML d'emails transactionnels
// Chaque template est une fonction qui prend des variables
// et retourne un document HTML complet prêt à envoyer.
// ============================================================

export type TemplateId =
  | 'bienvenue'
  | 'reset_mdp'
  | 'transaction_confirmee'
  | 'alerte_float'
  | 'rapport_mensuel'
  | 'invitation_agent';

export interface TemplateInfo {
  id: TemplateId;
  titre: string;
  sujet: string;
  description: string;
  categorie: 'auth' | 'transaction' | 'alerte' | 'rapport' | 'reseau';
  declencheur: string;
  actif: boolean;
  variables: string[];
}

export const TEMPLATES_INFO: TemplateInfo[] = [
  {
    id: 'bienvenue',
    titre: 'Bienvenue',
    sujet: 'Bienvenue sur GESTMONEY — votre compte est actif',
    description: 'Envoyé dès la création d\'un compte utilisateur ou opérateur.',
    categorie: 'auth',
    declencheur: 'Création de compte',
    actif: true,
    variables: ['prenom', 'nom', 'email', 'role', 'nomSociete', 'urlConnexion'],
  },
  {
    id: 'reset_mdp',
    titre: 'Réinitialisation mot de passe',
    sujet: 'Réinitialisez votre mot de passe GESTMONEY',
    description: 'Lien sécurisé (valable 1h) pour changer le mot de passe.',
    categorie: 'auth',
    declencheur: 'Demande de reset',
    actif: true,
    variables: ['prenom', 'urlReset', 'expiration'],
  },
  {
    id: 'transaction_confirmee',
    titre: 'Confirmation de transaction',
    sujet: 'Transaction confirmée — {{montant}} FCFA via {{operateur}}',
    description: 'Reçu électronique envoyé après chaque transaction validée.',
    categorie: 'transaction',
    declencheur: 'Transaction validée',
    actif: true,
    variables: ['prenom', 'montant', 'operateur', 'reference', 'dateHeure', 'agence', 'agent', 'soldeApres'],
  },
  {
    id: 'alerte_float',
    titre: 'Alerte float bas',
    sujet: '⚠️ Float {{operateur}} bas — action requise',
    description: 'Alerte envoyée quand le float d\'un opérateur passe sous le seuil configuré.',
    categorie: 'alerte',
    declencheur: 'Seuil float dépassé',
    actif: true,
    variables: ['nomSociete', 'operateur', 'soldeActuel', 'seuil', 'urlDashboard'],
  },
  {
    id: 'rapport_mensuel',
    titre: 'Rapport mensuel',
    sujet: 'Votre rapport GESTMONEY — {{mois}} {{annee}}',
    description: 'Synthèse mensuelle des performances envoyée au gestionnaire.',
    categorie: 'rapport',
    declencheur: '1er du mois à 8h00',
    actif: true,
    variables: ['prenom', 'mois', 'annee', 'ca', 'nbTransactions', 'nouveauxClients', 'topAgent', 'urlRapport'],
  },
  {
    id: 'invitation_agent',
    titre: 'Invitation agent',
    sujet: 'Vous êtes invité à rejoindre {{nomSociete}} sur GESTMONEY',
    description: 'Email d\'invitation envoyé aux nouveaux agents avec leurs identifiants temporaires.',
    categorie: 'reseau',
    declencheur: 'Création d\'un agent',
    actif: true,
    variables: ['prenom', 'nomSociete', 'agence', 'loginTemporaire', 'mdpTemporaire', 'urlConnexion'],
  },
];

// ─── Styles communs ────────────────────────────────────────────────────────

const BASE_STYLE = `
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;900&display=swap');
  * { margin:0; padding:0; box-sizing:border-box; }
  body { background:#F0F2F5; font-family:'Inter',Arial,sans-serif; color:#111; }
  .wrapper { max-width:600px; margin:32px auto; }
  .card { background:#fff; border-radius:16px; overflow:hidden; box-shadow:0 2px 16px rgba(0,0,0,.08); }
  .header { background:#111; padding:28px 36px; display:flex; align-items:center; gap:12px; }
  .logo-icon { width:42px; height:42px; background:#fff; border-radius:10px; display:flex; align-items:center; justify-content:center; font-weight:900; font-size:22px; color:#111; flex-shrink:0; }
  .logo-text { color:#fff; font-size:22px; font-weight:900; letter-spacing:-0.04em; }
  .logo-text .y { color:#FFD000; }
  .logo-text .r { color:#E84545; }
  .logo-text .g { color:#44C767; }
  .body { padding:36px; }
  .body h1 { font-size:22px; font-weight:900; color:#111; margin-bottom:8px; }
  .body .sub { font-size:15px; color:#555; line-height:1.6; margin-bottom:24px; }
  .btn { display:inline-block; background:#009E00; color:#fff!important; font-weight:700; font-size:15px; padding:14px 32px; border-radius:10px; text-decoration:none; margin:4px 0; }
  .btn-secondary { display:inline-block; background:#111; color:#fff!important; font-weight:600; font-size:14px; padding:12px 28px; border-radius:10px; text-decoration:none; }
  .box { background:#F7F8FA; border:1px solid #E5E7EB; border-radius:12px; padding:20px 24px; margin:20px 0; }
  .box-warning { background:#FFFBEB; border-color:#FCD34D; }
  .box-danger { background:#FEF2F2; border-color:#FCA5A5; }
  .kpi-grid { display:grid; grid-template-columns:repeat(3,1fr); gap:12px; margin:20px 0; }
  .kpi { background:#F7F8FA; border:1px solid #E5E7EB; border-radius:10px; padding:14px 16px; text-align:center; }
  .kpi label { font-size:10px; color:#888; font-weight:600; text-transform:uppercase; letter-spacing:.06em; }
  .kpi .val { font-size:20px; font-weight:900; color:#111; margin-top:3px; }
  .divider { border:none; border-top:1px solid #F0F0F0; margin:24px 0; }
  .meta { font-size:12px; color:#999; }
  .footer { padding:20px 36px; text-align:center; }
  .footer p { font-size:11px; color:#aaa; margin-top:4px; }
  .tag { display:inline-block; background:#F3F4F6; color:#555; font-size:11px; font-weight:600; padding:3px 10px; border-radius:999px; margin-right:4px; }
  .tag-green { background:#D1FAE5; color:#065F46; }
  .tag-yellow { background:#FEF3C7; color:#92400E; }
  .tag-red { background:#FEE2E2; color:#991B1B; }
  table.data { width:100%; border-collapse:collapse; font-size:13px; margin:16px 0; }
  table.data th { background:#111; color:#fff; text-align:left; padding:9px 14px; font-size:11px; text-transform:uppercase; letter-spacing:.06em; }
  table.data td { padding:9px 14px; border-bottom:1px solid #F0F0F0; color:#444; }
  table.data tr:last-child td { border:none; }
  @media(max-width:600px) { .wrapper{margin:0;} .body{padding:24px;} .kpi-grid{grid-template-columns:1fr 1fr;} }
`;

function baseLayout(contenu: string, anneeCourante = new Date().getFullYear()): string {
  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <style>${BASE_STYLE}</style>
</head>
<body>
<div class="wrapper">
  <div class="card">
    <div class="header">
      <div class="logo-icon">G</div>
      <div class="logo-text">GEST<span class="y">M</span><span class="r">O</span>N<span class="g">EY</span></div>
    </div>
    <div class="body">
      ${contenu}
    </div>
  </div>
  <div class="footer">
    <p>© ${anneeCourante} IBIG Soft · ibigsoft.com · Tous droits réservés</p>
    <p>Vous recevez cet email car vous utilisez GESTMONEY. <a href="#" style="color:#009E00">Se désabonner</a></p>
  </div>
</div>
</body>
</html>`;
}

// ─── Template : Bienvenue ─────────────────────────────────────────────────

export interface VarsBienvenue {
  prenom: string;
  nom: string;
  email: string;
  role?: string;
  nomSociete?: string;
  urlConnexion?: string;
}

export function templateBienvenue(v: VarsBienvenue): string {
  return baseLayout(`
    <h1>Bienvenue, ${v.prenom} ! 🎉</h1>
    <p class="sub">Votre compte GESTMONEY est actif. Vous pouvez désormais gérer vos opérations Mobile Money, suivre vos transactions et piloter votre réseau d'agents.</p>

    <div class="box">
      <table class="data">
        <tr><td><strong>Nom complet</strong></td><td>${v.prenom} ${v.nom}</td></tr>
        <tr><td><strong>Adresse email</strong></td><td>${v.email}</td></tr>
        ${v.role ? `<tr><td><strong>Rôle</strong></td><td><span class="tag">${v.role}</span></td></tr>` : ''}
        ${v.nomSociete ? `<tr><td><strong>Société</strong></td><td>${v.nomSociete}</td></tr>` : ''}
      </table>
    </div>

    <a href="${v.urlConnexion ?? '#'}" class="btn">Accéder à mon espace</a>

    <hr class="divider"/>
    <p class="meta">Pour toute question, contactez notre support : <a href="mailto:support@ibigsoft.com" style="color:#009E00">support@ibigsoft.com</a></p>
  `);
}

// ─── Template : Reset mot de passe ───────────────────────────────────────

export interface VarsResetMdp {
  prenom: string;
  urlReset: string;
  expiration?: string;
}

export function templateResetMdp(v: VarsResetMdp): string {
  return baseLayout(`
    <h1>Réinitialisation de mot de passe</h1>
    <p class="sub">Bonjour ${v.prenom}, vous avez demandé à réinitialiser votre mot de passe GESTMONEY. Cliquez sur le bouton ci-dessous pour créer un nouveau mot de passe.</p>

    <div class="box box-warning">
      <p style="font-size:13px;color:#92400E;">⏱ Ce lien est valable <strong>${v.expiration ?? '1 heure'}</strong>. Passé ce délai, vous devrez faire une nouvelle demande.</p>
    </div>

    <a href="${v.urlReset}" class="btn">Réinitialiser mon mot de passe</a>

    <hr class="divider"/>
    <p class="meta">Si vous n'avez pas demandé cette réinitialisation, ignorez cet email. Votre mot de passe reste inchangé.</p>
    <p class="meta" style="margin-top:8px;">Lien direct : <span style="font-family:monospace;font-size:11px;color:#666;">${v.urlReset}</span></p>
  `);
}

// ─── Template : Transaction confirmée ────────────────────────────────────

export interface VarsTransaction {
  prenom: string;
  montant: string;
  operateur: string;
  reference: string;
  dateHeure: string;
  agence?: string;
  agent?: string;
  soldeApres?: string;
  type?: 'depot' | 'retrait' | 'transfert';
}

export function templateTransaction(v: VarsTransaction): string {
  const typeLabel = v.type === 'retrait' ? 'Retrait' : v.type === 'transfert' ? 'Transfert' : 'Dépôt';
  const typeColor = v.type === 'retrait' ? 'tag-red' : v.type === 'transfert' ? 'tag-yellow' : 'tag-green';
  return baseLayout(`
    <h1>Transaction confirmée ✅</h1>
    <p class="sub">Bonjour ${v.prenom}, votre transaction a été traitée avec succès.</p>

    <div style="text-align:center;padding:24px;background:#F0FDF4;border:2px solid #86EFAC;border-radius:14px;margin:20px 0;">
      <p style="font-size:13px;color:#16A34A;font-weight:600;text-transform:uppercase;letter-spacing:.06em;">Montant</p>
      <p style="font-size:42px;font-weight:900;color:#111;letter-spacing:-0.04em;">${v.montant} <span style="font-size:18px;font-weight:600;color:#555;">FCFA</span></p>
      <span class="${typeColor} tag" style="font-size:12px;">${typeLabel}</span>
      <span class="tag" style="font-size:12px;">${v.operateur}</span>
    </div>

    <div class="box">
      <table class="data">
        <tr><td><strong>Référence</strong></td><td style="font-family:monospace">${v.reference}</td></tr>
        <tr><td><strong>Date & heure</strong></td><td>${v.dateHeure}</td></tr>
        ${v.agence ? `<tr><td><strong>Agence</strong></td><td>${v.agence}</td></tr>` : ''}
        ${v.agent ? `<tr><td><strong>Agent</strong></td><td>${v.agent}</td></tr>` : ''}
        ${v.soldeApres ? `<tr><td><strong>Solde après</strong></td><td><strong>${v.soldeApres} FCFA</strong></td></tr>` : ''}
      </table>
    </div>

    <hr class="divider"/>
    <p class="meta">Conservez la référence <strong>${v.reference}</strong> pour toute contestation. En cas de problème : <a href="mailto:support@ibigsoft.com" style="color:#009E00">support@ibigsoft.com</a></p>
  `);
}

// ─── Template : Alerte float bas ─────────────────────────────────────────

export interface VarsAlerteFloat {
  nomSociete: string;
  operateur: string;
  soldeActuel: string;
  seuil: string;
  urlDashboard?: string;
}

export function templateAlerteFloat(v: VarsAlerteFloat): string {
  return baseLayout(`
    <h1>⚠️ Alerte : Float bas</h1>
    <p class="sub">Le solde float de <strong>${v.operateur}</strong> est passé en dessous du seuil configuré. Une action est requise pour éviter l'interruption de service.</p>

    <div class="box box-danger">
      <div class="kpi-grid">
        <div class="kpi">
          <label>Opérateur</label>
          <div class="val" style="font-size:15px;">${v.operateur}</div>
        </div>
        <div class="kpi">
          <label>Solde actuel</label>
          <div class="val" style="color:#DC2626;">${v.soldeActuel} FCFA</div>
        </div>
        <div class="kpi">
          <label>Seuil d'alerte</label>
          <div class="val" style="color:#D97706;">${v.seuil} FCFA</div>
        </div>
      </div>
    </div>

    <p style="font-size:14px;color:#444;line-height:1.6;margin-bottom:20px;">Approvisionnez le float <strong>${v.operateur}</strong> dès que possible pour maintenir la continuité des opérations de vos agents.</p>

    <a href="${v.urlDashboard ?? '#'}" class="btn" style="background:#DC2626;">Gérer le float maintenant</a>

    <hr class="divider"/>
    <p class="meta">Alerte générée automatiquement pour <strong>${v.nomSociete}</strong>. Modifiez vos seuils dans Paramètres &gt; Float.</p>
  `);
}

// ─── Template : Rapport mensuel ──────────────────────────────────────────

export interface VarsRapport {
  prenom: string;
  mois: string;
  annee: string;
  ca: string;
  nbTransactions: string;
  nouveauxClients: string;
  topAgent?: string;
  urlRapport?: string;
  variationCa?: string;
}

export function templateRapportMensuel(v: VarsRapport): string {
  return baseLayout(`
    <h1>Rapport mensuel — ${v.mois} ${v.annee}</h1>
    <p class="sub">Bonjour ${v.prenom}, voici la synthèse de vos performances pour le mois de <strong>${v.mois} ${v.annee}</strong>.</p>

    <div class="kpi-grid">
      <div class="kpi">
        <label>Chiffre d'affaires</label>
        <div class="val">${v.ca}</div>
        ${v.variationCa ? `<p style="font-size:11px;color:#16A34A;margin-top:3px;">${v.variationCa}</p>` : ''}
      </div>
      <div class="kpi">
        <label>Transactions</label>
        <div class="val">${v.nbTransactions}</div>
      </div>
      <div class="kpi">
        <label>Nouveaux clients</label>
        <div class="val">${v.nouveauxClients}</div>
      </div>
    </div>

    ${v.topAgent ? `
    <div class="box" style="display:flex;align-items:center;gap:16px;">
      <div style="width:44px;height:44px;border-radius:50%;background:#FEF3C7;display:flex;align-items:center;justify-content:center;font-size:22px;flex-shrink:0;">🏆</div>
      <div>
        <p style="font-size:12px;color:#888;font-weight:600;text-transform:uppercase;">Meilleur agent du mois</p>
        <p style="font-size:17px;font-weight:700;color:#111;margin-top:2px;">${v.topAgent}</p>
      </div>
    </div>` : ''}

    <a href="${v.urlRapport ?? '#'}" class="btn">Voir le rapport complet</a>
    <br/><br/>
    <a href="${v.urlRapport ?? '#'}" class="btn-secondary">Télécharger en PDF</a>

    <hr class="divider"/>
    <p class="meta">Rapport généré automatiquement par GESTMONEY. Prochain rapport : le 1er ${v.annee === new Date().getFullYear().toString() ? 'du mois prochain' : v.mois + ' ' + (parseInt(v.annee) + 1)}.</p>
  `);
}

// ─── Template : Invitation agent ─────────────────────────────────────────

export interface VarsInvitationAgent {
  prenom: string;
  nomSociete: string;
  agence?: string;
  loginTemporaire: string;
  mdpTemporaire: string;
  urlConnexion?: string;
}

export function templateInvitationAgent(v: VarsInvitationAgent): string {
  return baseLayout(`
    <h1>Vous êtes invité à rejoindre ${v.nomSociete}</h1>
    <p class="sub">Bonjour ${v.prenom}, <strong>${v.nomSociete}</strong> vous invite à rejoindre leur réseau d'agents GESTMONEY${v.agence ? ` — agence <strong>${v.agence}</strong>` : ''}. Voici vos identifiants de connexion.</p>

    <div class="box" style="background:#F0FDF4;border-color:#86EFAC;">
      <p style="font-size:13px;color:#555;font-weight:600;margin-bottom:12px;">Vos identifiants temporaires :</p>
      <table class="data">
        <tr><td><strong>Identifiant</strong></td><td style="font-family:monospace;font-size:16px;color:#111;">${v.loginTemporaire}</td></tr>
        <tr><td><strong>Mot de passe temporaire</strong></td><td style="font-family:monospace;font-size:16px;color:#111;">${v.mdpTemporaire}</td></tr>
      </table>
    </div>

    <div class="box box-warning">
      <p style="font-size:13px;color:#92400E;">🔒 Pour votre sécurité, vous devrez <strong>changer votre mot de passe</strong> dès votre première connexion.</p>
    </div>

    <a href="${v.urlConnexion ?? '#'}" class="btn">Se connecter maintenant</a>

    <hr class="divider"/>
    <p class="meta">Cet email est confidentiel. Ne partagez jamais vos identifiants. En cas de problème : <a href="mailto:support@ibigsoft.com" style="color:#009E00">support@ibigsoft.com</a></p>
  `);
}

// ─── Rendus (prévisualisation avec données de démo) ───────────────────────

export function rendreDemoTemplate(id: TemplateId): string {
  const now = new Date();
  const mois = now.toLocaleDateString('fr-FR', { month: 'long' });
  const annee = now.getFullYear().toString();

  switch (id) {
    case 'bienvenue':
      return templateBienvenue({ prenom: 'Kouamé', nom: 'Assi', email: 'kouame@orangemoney.ci', role: 'Gestionnaire', nomSociete: 'OrangeMoney CI', urlConnexion: '#' });
    case 'reset_mdp':
      return templateResetMdp({ prenom: 'Kouamé', urlReset: '#', expiration: '1 heure' });
    case 'transaction_confirmee':
      return templateTransaction({ prenom: 'Fatoumata', montant: '150 000', operateur: 'Wave Sénégal', reference: 'TX-2026-07-A48C9F', dateHeure: `${now.toLocaleDateString('fr-FR')} à ${now.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}`, agence: 'Agence Plateau', agent: 'Koné Drissa', soldeApres: '2 840 000', type: 'depot' });
    case 'alerte_float':
      return templateAlerteFloat({ nomSociete: 'Wave Sénégal', operateur: 'Wave', soldeActuel: '450 000', seuil: '1 000 000', urlDashboard: '#' });
    case 'rapport_mensuel':
      return templateRapportMensuel({ prenom: 'Léontine', mois, annee, ca: '48 200 000 FCFA', nbTransactions: '3 247', nouveauxClients: '128', topAgent: 'Koné Drissa — 8 200 000 FCFA', urlRapport: '#', variationCa: '+12% vs mois précédent' });
    case 'invitation_agent':
      return templateInvitationAgent({ prenom: 'Drissa', nomSociete: 'OrangeMoney CI', agence: 'Agence Cocody', loginTemporaire: 'agent_drissa_k', mdpTemporaire: 'Tmp@2026!', urlConnexion: '#' });
  }
}
