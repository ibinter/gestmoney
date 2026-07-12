'use client';
import React, { useState, useMemo } from 'react';
import {
  Search, BookOpen, Zap, ArrowLeftRight, Wallet, Users,
  BarChart3, Bell, Shield, ChevronDown, ChevronRight,
  ExternalLink, Download, HelpCircle, CheckCircle2,
} from 'lucide-react';
import { clsx } from 'clsx';
import { exporterPdf } from '@/lib/exportPdf';
import { useT } from '@/lib/i18n';

// ─── Données du guide ──────────────────────────────────────────────────────

interface Article {
  id: string;
  titre: string;
  contenu: string; // HTML
  tags: string[];
}

interface Section {
  id: string;
  titre: string;
  icone: React.ElementType;
  couleur: string;
  description: string;
  articles: Article[];
}

const SECTIONS: Section[] = [
  {
    id: 'demarrage',
    titre: 'Démarrage rapide',
    icone: Zap,
    couleur: '#009E00',
    description: 'Configurer votre compte et effectuer vos premières opérations.',
    articles: [
      {
        id: 'premiere-connexion',
        titre: 'Se connecter pour la première fois',
        tags: ['connexion', 'compte', 'mot de passe'],
        contenu: `
          <p>Après la création de votre compte, vous recevez un email contenant vos identifiants temporaires.</p>
          <ol>
            <li>Ouvrez le lien de connexion reçu par email ou naviguez vers <code>app.gestmoney.com</code></li>
            <li>Saisissez votre adresse email et le mot de passe temporaire</li>
            <li>Au premier login, l'application vous demandera de choisir un nouveau mot de passe sécurisé</li>
            <li>Activez la <strong>double authentification (2FA)</strong> recommandée pour sécuriser votre compte</li>
          </ol>
          <div class="tip">💡 Utilisez <kbd>⌘K</kbd> (Mac) ou <kbd>Ctrl+K</kbd> (Windows) pour naviguer rapidement dans l'application.</div>
        `,
      },
      {
        id: 'wizard-onboarding',
        titre: 'Guide de configuration initiale',
        tags: ['configuration', 'opérateurs', 'agences'],
        contenu: `
          <p>À votre première connexion, un <strong>wizard de démarrage</strong> vous guide en 4 étapes :</p>
          <ol>
            <li><strong>Bienvenue</strong> — Découvrez les fonctionnalités principales</li>
            <li><strong>Opérateurs</strong> — Activez les réseaux Mobile Money (Orange Money, Wave, MTN…)</li>
            <li><strong>Premier agent</strong> — Créez votre premier agent de terrain</li>
            <li><strong>Terminé</strong> — Accédez au tableau de bord</li>
          </ol>
          <p>Vous pouvez relancer ce wizard à tout moment depuis <strong>Paramètres &gt; Guide de démarrage</strong>.</p>
        `,
      },
      {
        id: 'navigation',
        titre: 'Navigation dans l\'application',
        tags: ['navigation', 'raccourcis', 'clavier'],
        contenu: `
          <p>GESTMONEY dispose d'une <strong>palette de commandes</strong> accessible par <kbd>⌘K</kbd> / <kbd>Ctrl+K</kbd>.</p>
          <p>Elle vous permet de naviguer vers n'importe quelle page en quelques touches.</p>
          <ul>
            <li><kbd>↑</kbd> <kbd>↓</kbd> — Naviguer dans la liste</li>
            <li><kbd>Entrée</kbd> — Aller à la page sélectionnée</li>
            <li><kbd>Échap</kbd> — Fermer la palette</li>
          </ul>
          <p>La <strong>barre latérale</strong> affiche les badges en temps réel : transactions en attente, alertes float, notifications.</p>
        `,
      },
    ],
  },
  {
    id: 'transactions',
    titre: 'Transactions',
    icone: ArrowLeftRight,
    couleur: '#3B82F6',
    description: 'Enregistrer, valider et suivre toutes les opérations Mobile Money.',
    articles: [
      {
        id: 'creer-transaction',
        titre: 'Enregistrer une nouvelle transaction',
        tags: ['transaction', 'dépôt', 'retrait', 'transfert'],
        contenu: `
          <p>Depuis <strong>Transactions &gt; Nouvelle transaction</strong> :</p>
          <ol>
            <li>Sélectionnez le <strong>type</strong> : Dépôt, Retrait ou Transfert</li>
            <li>Choisissez l'<strong>opérateur</strong> Mobile Money concerné</li>
            <li>Saisissez le <strong>montant</strong> et le <strong>numéro du client</strong></li>
            <li>Ajoutez la <strong>référence opérateur</strong> (code de la transaction sur le réseau)</li>
            <li>Cliquez sur <strong>Valider</strong> — la transaction est enregistrée et un reçu peut être imprimé</li>
          </ol>
          <div class="tip">💡 Les transactions en attente apparaissent dans le badge rouge de la sidebar.</div>
        `,
      },
      {
        id: 'statuts-transaction',
        titre: 'Comprendre les statuts',
        tags: ['statut', 'en attente', 'validé', 'rejeté'],
        contenu: `
          <ul>
            <li><span class="badge badge-green">Validée</span> — Transaction traitée avec succès</li>
            <li><span class="badge badge-yellow">En attente</span> — En cours de traitement ou en attente de confirmation opérateur</li>
            <li><span class="badge badge-red">Rejetée</span> — Transaction échouée (fonds insuffisants, numéro invalide…)</li>
            <li><span class="badge badge-gray">Annulée</span> — Annulée par l'opérateur ou le gestionnaire</li>
          </ul>
          <p>Seul un <strong>Gestionnaire</strong> ou <strong>Superviseur</strong> peut valider manuellement une transaction en attente.</p>
        `,
      },
      {
        id: 'export-transactions',
        titre: 'Exporter les transactions',
        tags: ['export', 'CSV', 'PDF', 'XLSX'],
        contenu: `
          <p>Depuis la page <strong>Transactions</strong>, utilisez les boutons d'export en haut à droite :</p>
          <ul>
            <li><strong>CSV</strong> — Format tableur universel, compatible Excel/LibreOffice</li>
            <li><strong>XLSX</strong> — Format Excel natif avec en-tête GESTMONEY</li>
            <li><strong>PDF</strong> — Document formaté prêt à imprimer ou archiver</li>
          </ul>
          <p>Les exports respectent les <strong>filtres actifs</strong> (période, opérateur, statut, agence).</p>
        `,
      },
    ],
  },
  {
    id: 'float',
    titre: 'Gestion du Float',
    icone: Wallet,
    couleur: '#F59E0B',
    description: 'Surveiller et maintenir les soldes float de chaque opérateur.',
    articles: [
      {
        id: 'quest-ce-float',
        titre: 'Qu\'est-ce que le float ?',
        tags: ['float', 'solde', 'opérateur'],
        contenu: `
          <p>Le <strong>float</strong> est le solde disponible que votre réseau détient chez chaque opérateur Mobile Money. Il représente la capacité de traitement :</p>
          <ul>
            <li><strong>Float élevé</strong> → peut effectuer plus de retraits</li>
            <li><strong>Float bas</strong> → doit être réapprovisionné pour continuer les opérations</li>
          </ul>
          <p>GESTMONEY surveille les floats en temps réel et envoie des <strong>alertes automatiques</strong> par email et notification quand un seuil est atteint.</p>
        `,
      },
      {
        id: 'configurer-seuils',
        titre: 'Configurer les seuils d\'alerte',
        tags: ['seuil', 'alerte', 'configuration'],
        contenu: `
          <p>Depuis <strong>Gestion Float &gt; Paramètres Float</strong> :</p>
          <ol>
            <li>Sélectionnez l'opérateur à configurer</li>
            <li>Définissez le <strong>seuil bas</strong> (déclenchement de l'alerte)</li>
            <li>Définissez le <strong>seuil critique</strong> (alerte urgente + blocage optionnel)</li>
            <li>Choisissez qui reçoit les alertes (emails des gestionnaires)</li>
          </ol>
          <div class="warning">⚠️ Un float en dessous du seuil critique peut bloquer les retraits des agents.</div>
        `,
      },
    ],
  },
  {
    id: 'agents',
    titre: 'Agents & Agences',
    icone: Users,
    couleur: '#8B5CF6',
    description: 'Créer et gérer votre réseau d\'agents de terrain.',
    articles: [
      {
        id: 'creer-agent',
        titre: 'Ajouter un nouvel agent',
        tags: ['agent', 'création', 'invitation'],
        contenu: `
          <p>Depuis <strong>Agents &gt; Ajouter un agent</strong> :</p>
          <ol>
            <li>Renseignez le <strong>prénom, nom</strong> et <strong>numéro de téléphone</strong></li>
            <li>Associez l'agent à une <strong>agence / point de vente</strong></li>
            <li>Définissez son <strong>rôle</strong> (Agent, Superviseur agence)</li>
            <li>GESTMONEY envoie automatiquement un <strong>email d'invitation</strong> avec ses identifiants temporaires</li>
          </ol>
          <p>L'agent devra changer son mot de passe à sa première connexion.</p>
        `,
      },
      {
        id: 'performances-agents',
        titre: 'Suivre les performances d\'un agent',
        tags: ['performance', 'commission', 'classement'],
        contenu: `
          <p>Depuis la fiche d'un agent, vous accédez à :</p>
          <ul>
            <li>Le <strong>volume de transactions</strong> du mois en cours et des mois précédents</li>
            <li>Le <strong>montant total traité</strong> et le ticket moyen</li>
            <li>Les <strong>commissions générées</strong></li>
            <li>Le <strong>classement</strong> par rapport aux autres agents du réseau</li>
          </ul>
          <p>Le tableau de bord affiche automatiquement le <strong>Top Agent du mois</strong>.</p>
        `,
      },
    ],
  },
  {
    id: 'rapports',
    titre: 'Rapports & BI',
    icone: BarChart3,
    couleur: '#EC4899',
    description: 'Générer et analyser les rapports de performance mensuelle.',
    articles: [
      {
        id: 'generer-rapport',
        titre: 'Générer un rapport mensuel',
        tags: ['rapport', 'génération', 'mensuel'],
        contenu: `
          <p>Depuis <strong>Rapports &amp; BI</strong> :</p>
          <ol>
            <li>Sélectionnez la <strong>période</strong> souhaitée dans le menu déroulant</li>
            <li>Cliquez sur <strong>Générer rapport</strong></li>
            <li>GESTMONEY calcule les KPIs, la répartition par opérateur et le classement des agents</li>
            <li>Le rapport apparaît dans l'historique en quelques secondes</li>
          </ol>
          <p>Les rapports peuvent être exportés en <strong>CSV, XLSX ou PDF</strong> depuis l'historique.</p>
        `,
      },
      {
        id: 'rapport-automatique',
        titre: 'Rapports automatiques mensuels',
        tags: ['automatique', 'email', 'planification'],
        contenu: `
          <p>GESTMONEY génère automatiquement un <strong>rapport de synthèse</strong> le 1er de chaque mois et l'envoie par email aux gestionnaires.</p>
          <p>Pour configurer les destinataires : <strong>Paramètres &gt; Notifications &gt; Rapports</strong></p>
          <p>Le rapport email contient :</p>
          <ul>
            <li>Chiffre d'affaires et variation vs mois précédent</li>
            <li>Nombre de transactions et nouveaux clients</li>
            <li>Meilleur agent du mois</li>
            <li>Lien vers le rapport PDF complet</li>
          </ul>
        `,
      },
    ],
  },
  {
    id: 'securite',
    titre: 'Sécurité & Accès',
    icone: Shield,
    couleur: '#E60000',
    description: 'Protéger votre compte et gérer les droits d\'accès.',
    articles: [
      {
        id: 'activer-2fa',
        titre: 'Activer la double authentification (2FA)',
        tags: ['2FA', 'sécurité', 'TOTP', 'authenticator'],
        contenu: `
          <p>La 2FA ajoute une couche de sécurité en exigeant un code temporaire en plus de votre mot de passe.</p>
          <ol>
            <li>Allez dans <strong>Paramètres &gt; Sécurité &gt; Double authentification</strong></li>
            <li>Cliquez sur <strong>Activer la 2FA</strong></li>
            <li>Scannez le QR code avec <strong>Google Authenticator</strong> ou <strong>Authy</strong></li>
            <li>Saisissez le code à 6 chiffres pour confirmer l'activation</li>
          </ol>
          <div class="tip">💡 Conservez vos codes de récupération dans un endroit sûr.</div>
        `,
      },
      {
        id: 'roles-permissions',
        titre: 'Rôles et permissions',
        tags: ['rôle', 'permission', 'accès', 'RBAC'],
        contenu: `
          <ul>
            <li><span class="badge badge-red">SUPER_ADMIN</span> — Accès total à toute la plateforme et à la console SuperAdmin</li>
            <li><span class="badge badge-yellow">ADMIN</span> — Gestion complète d'un tenant (société)</li>
            <li><span class="badge badge-blue">MANAGER</span> — Gestion des agents, validation des transactions, rapports</li>
            <li><span class="badge badge-purple">SUPERVISOR</span> — Supervision d'une ou plusieurs agences</li>
            <li><span class="badge badge-gray">AGENT</span> — Enregistrement des transactions uniquement</li>
            <li><span class="badge badge-gray">AUDITOR</span> — Lecture seule, audit des journaux</li>
          </ul>
        `,
      },
    ],
  },
];

const FAQ = [
  {
    q: 'Comment réinitialiser le mot de passe d\'un agent ?',
    r: 'Depuis la fiche de l\'agent (Agents > [Nom de l\'agent] > Actions), cliquez sur "Réinitialiser le mot de passe". Un email est envoyé automatiquement à l\'agent.',
  },
  {
    q: 'Que faire si une transaction reste bloquée en "En attente" ?',
    r: 'Vérifiez d\'abord le solde float de l\'opérateur concerné. Si le float est suffisant, contactez le support opérateur avec la référence de la transaction. Un gestionnaire peut forcer la validation ou le rejet depuis Transactions > [Référence] > Actions.',
  },
  {
    q: 'Comment ajouter un nouvel opérateur Mobile Money ?',
    r: 'Rendez-vous dans Paramètres > Opérateurs. Cliquez sur "Ajouter un opérateur", renseignez les informations de connexion API et définissez les seuils de float. L\'opérateur apparaîtra dans les formulaires de transaction.',
  },
  {
    q: 'Les données sont-elles sauvegardées automatiquement ?',
    r: 'Oui. GESTMONEY effectue des sauvegardes automatiques toutes les heures avec rétention de 30 jours. En cas d\'incident, contactez le support IBIG Soft pour une restauration.',
  },
  {
    q: 'Comment contacter le support technique ?',
    r: 'Par email : support@ibigsoft.com (réponse sous 4h ouvrées). Pour les urgences, utilisez le chat en direct disponible dans la Console SuperAdmin.',
  },
];

// ─── Composant article expandable ─────────────────────────────────────────
function ArticleAccordion({ article }: { article: Article }) {
  const [ouvert, setOuvert] = useState(false);
  return (
    <div className={clsx('border border-gray-100 dark:border-white/08 rounded-xl overflow-hidden transition-all', ouvert && 'shadow-sm')}>
      <button
        onClick={() => setOuvert((o) => !o)}
        className="w-full flex items-center justify-between px-4 py-3.5 text-left hover:bg-gray-50 dark:hover:bg-white/03 transition-colors"
      >
        <span className="text-sm font-semibold text-text-main">{article.titre}</span>
        {ouvert ? <ChevronDown size={16} className="text-text-muted flex-shrink-0" /> : <ChevronRight size={16} className="text-text-muted flex-shrink-0" />}
      </button>
      {ouvert && (
        <div
          className="px-4 pb-4 prose-guide text-sm text-text-muted leading-relaxed border-t border-gray-100 dark:border-white/08 pt-3"
          dangerouslySetInnerHTML={{ __html: article.contenu }}
        />
      )}
    </div>
  );
}

// ─── FAQ item ─────────────────────────────────────────────────────────────
function FaqItem({ q, r }: { q: string; r: string }) {
  const [ouvert, setOuvert] = useState(false);
  return (
    <div className="border border-gray-100 dark:border-white/08 rounded-xl overflow-hidden">
      <button
        onClick={() => setOuvert((o) => !o)}
        className="w-full flex items-center justify-between px-4 py-4 text-left hover:bg-gray-50 dark:hover:bg-white/03 transition-colors gap-3"
      >
        <div className="flex items-start gap-3 min-w-0">
          <HelpCircle size={16} className="text-primary flex-shrink-0 mt-0.5" />
          <span className="text-sm font-semibold text-text-main">{q}</span>
        </div>
        {ouvert ? <ChevronDown size={16} className="text-text-muted flex-shrink-0" /> : <ChevronRight size={16} className="text-text-muted flex-shrink-0" />}
      </button>
      {ouvert && (
        <div className="px-4 pb-4 pl-11 border-t border-gray-100 dark:border-white/08 pt-3">
          <p className="text-sm text-text-muted leading-relaxed">{r}</p>
        </div>
      )}
    </div>
  );
}

// ─── Page principale ───────────────────────────────────────────────────────
export default function AidePage() {
  const t = useT();
  const [recherche, setRecherche] = useState('');
  const [sectionActive, setSectionActive] = useState<string | null>(null);

  const resultatsRecherche = useMemo(() => {
    if (!recherche.trim()) return [];
    const q = recherche.toLowerCase();
    const res: { section: Section; article: Article }[] = [];
    SECTIONS.forEach((section) => {
      section.articles.forEach((article) => {
        if (
          article.titre.toLowerCase().includes(q) ||
          article.tags.some((t) => t.includes(q)) ||
          article.contenu.toLowerCase().includes(q)
        ) {
          res.push({ section, article });
        }
      });
    });
    return res;
  }, [recherche]);

  const sectionsFiltrees = sectionActive ? SECTIONS.filter((s) => s.id === sectionActive) : SECTIONS;

  const handleExportPdf = () => {
    const lignes = SECTIONS.flatMap((s) =>
      s.articles.map((a) => ({
        section: s.titre,
        article: a.titre,
        tags: a.tags.join(', '),
      }) as Record<string, unknown>)
    );
    exporterPdf(
      lignes,
      [
        { titre: 'Section', valeur: (r) => String(r.section) },
        { titre: 'Article', valeur: (r) => String(r.article) },
        { titre: 'Mots-clés', valeur: (r) => String(r.tags) },
      ],
      { titre: 'Guide Utilisateur GESTMONEY', sousTitre: 'Documentation complète' }
    );
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      {/* En-tête */}
      <div className="flex items-start justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <BookOpen size={20} className="text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-text-main">{t.aide.title}</h1>
            <p className="text-sm text-text-muted mt-0.5">{t.aide.subtitle} — {SECTIONS.reduce((n, s) => n + s.articles.length, 0)} {t.aide.articles}</p>
          </div>
        </div>
        <button
          onClick={handleExportPdf}
          className="flex items-center gap-2 text-sm font-semibold text-text-muted border border-gray-200 dark:border-white/10 px-3 py-2 rounded-xl hover:bg-gray-50 dark:hover:bg-white/05 transition-colors"
        >
          <Download size={15} />
          {t.aide.exportPdf}
        </button>
      </div>

      {/* Barre de recherche */}
      <div className="relative">
        <Search size={17} className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" />
        <input
          type="text"
          placeholder={t.aide.searchPlaceholder}
          value={recherche}
          onChange={(e) => setRecherche(e.target.value)}
          className="w-full pl-11 pr-4 py-3.5 rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/04 text-text-main text-sm placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
        />
        {recherche && (
          <button onClick={() => setRecherche('')} className="absolute right-4 top-1/2 -translate-y-1/2 text-text-muted hover:text-text-main text-xs">
            Effacer
          </button>
        )}
      </div>

      {/* Résultats de recherche */}
      {recherche.trim() && (
        <div>
          <p className="text-xs text-text-muted font-semibold uppercase tracking-wide mb-3">
            {resultatsRecherche.length} résultat{resultatsRecherche.length !== 1 ? 's' : ''} pour &ldquo;{recherche}&rdquo;
          </p>
          {resultatsRecherche.length === 0 ? (
            <div className="bg-white dark:bg-white/03 rounded-2xl border border-gray-100 dark:border-white/08 px-6 py-10 text-center">
              <p className="text-text-muted text-sm">Aucun article trouvé. Essayez d&apos;autres mots-clés.</p>
              <a href="mailto:support@ibigsoft.com" className="text-primary text-sm font-semibold mt-3 inline-flex items-center gap-1">
                Contacter le support <ExternalLink size={12} />
              </a>
            </div>
          ) : (
            <div className="space-y-2">
              {resultatsRecherche.map(({ section, article }) => (
                <div key={article.id} className="bg-white dark:bg-white/03 rounded-xl border border-gray-100 dark:border-white/08 overflow-hidden">
                  <div className="px-4 pt-3 pb-1 flex items-center gap-2">
                    <section.icone size={13} style={{ color: section.couleur }} />
                    <span className="text-[10px] font-semibold text-text-muted uppercase tracking-wide">{section.titre}</span>
                  </div>
                  <ArticleAccordion article={article} />
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Filtres sections (si pas de recherche) */}
      {!recherche.trim() && (
        <>
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => setSectionActive(null)}
              className={clsx('px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors', !sectionActive ? 'bg-primary text-sidebar' : 'bg-white dark:bg-white/05 text-text-muted border border-gray-200 dark:border-white/10 hover:border-primary hover:text-primary')}
            >
              Tout afficher
            </button>
            {SECTIONS.map((s) => (
              <button
                key={s.id}
                onClick={() => setSectionActive(sectionActive === s.id ? null : s.id)}
                className={clsx('flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors', sectionActive === s.id ? 'text-sidebar' : 'bg-white dark:bg-white/05 text-text-muted border border-gray-200 dark:border-white/10 hover:text-text-main')}
                style={sectionActive === s.id ? { backgroundColor: s.couleur } : {}}
              >
                <s.icone size={12} />
                {s.titre}
              </button>
            ))}
          </div>

          {/* Sections & articles */}
          <div className="space-y-6">
            {sectionsFiltrees.map((section) => (
              <div key={section.id} className="bg-white dark:bg-white/03 rounded-2xl border border-gray-100 dark:border-white/08 overflow-hidden">
                {/* Header section */}
                <div className="px-6 py-5 flex items-center gap-4 border-b border-gray-100 dark:border-white/08" style={{ borderLeftWidth: 4, borderLeftColor: section.couleur, borderLeftStyle: 'solid' }}>
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: section.couleur + '18' }}>
                    <section.icone size={19} style={{ color: section.couleur }} />
                  </div>
                  <div>
                    <h2 className="font-bold text-text-main">{section.titre}</h2>
                    <p className="text-xs text-text-muted mt-0.5">{section.description}</p>
                  </div>
                  <span className="ml-auto text-xs text-text-muted bg-gray-100 dark:bg-white/08 px-2 py-1 rounded-full flex-shrink-0">{section.articles.length} article{section.articles.length > 1 ? 's' : ''}</span>
                </div>

                {/* Articles */}
                <div className="px-4 py-3 space-y-1.5">
                  {section.articles.map((article) => (
                    <ArticleAccordion key={article.id} article={article} />
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* FAQ */}
          <div className="bg-white dark:bg-white/03 rounded-2xl border border-gray-100 dark:border-white/08 overflow-hidden">
            <div className="px-6 py-5 border-b border-gray-100 dark:border-white/08 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#FFD000]/15 flex items-center justify-center">
                <HelpCircle size={19} className="text-[#b8960a] dark:text-[#FFD000]" />
              </div>
              <div>
                <h2 className="font-bold text-text-main">Questions fréquentes</h2>
                <p className="text-xs text-text-muted mt-0.5">Les questions les plus posées par les utilisateurs</p>
              </div>
            </div>
            <div className="px-4 py-3 space-y-1.5">
              {FAQ.map((faq) => (
                <FaqItem key={faq.q} q={faq.q} r={faq.r} />
              ))}
            </div>
          </div>

          {/* Contact support */}
          <div className="bg-gradient-to-r from-[#009E00]/10 to-[#FFD000]/10 rounded-2xl border border-[#009E00]/20 p-6 flex items-center justify-between flex-wrap gap-4">
            <div>
              <h3 className="font-bold text-text-main">Vous n&apos;avez pas trouvé la réponse ?</h3>
              <p className="text-sm text-text-muted mt-1">Notre équipe support répond sous 4h en jours ouvrés.</p>
            </div>
            <div className="flex gap-3 flex-wrap">
              <a
                href="mailto:support@ibigsoft.com"
                className="flex items-center gap-2 bg-white dark:bg-white/08 text-text-main text-sm font-semibold px-4 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-white/12 transition-colors"
              >
                <ExternalLink size={14} />
                Email support
              </a>
              <button className="flex items-center gap-2 bg-primary text-sidebar text-sm font-semibold px-4 py-2.5 rounded-xl hover:bg-primary/90 transition-colors">
                <CheckCircle2 size={14} />
                Chat en direct
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
