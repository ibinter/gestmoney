'use client';
/**
 * SaraWidget — Widget SARA IA flottant amélioré
 * Extension de AssistantIA avec :
 * - Actions contextuelles
 * - Source documentaire
 * - Suggestions par page
 * - Réponses bilingues FR/EN
 */
import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { usePathname } from 'next/navigation';
import {
  Bot, X, Send, Minimize2, Maximize2, Sparkles,
  BookOpen, LifeBuoy, RefreshCw, ChevronRight,
  Globe, MessageSquare,
} from 'lucide-react';
import { clsx } from 'clsx';
import { useAuthStore } from '@/store/authStore';

// ─── Types ──────────────────────────────────────────────────────────────────

interface Message {
  id: string;
  role: 'user' | 'assistant';
  contenu: string;
  source?: string;
  date: Date;
}

// ─── Base de connaissances locale (fallback IA) ──────────────────────────────

const REPONSES_FR: Record<string, { texte: string; source?: string }> = {
  'transaction': { texte: 'Pour enregistrer une transaction : **Transactions → Nouvelle transaction** → choisissez le type (Dépôt/Retrait/Transfert), sélectionnez l\'opérateur, saisissez le montant et le numéro client.\n\nConsultez le **Guide utilisateur** (section Transactions) pour la procédure complète.', source: 'Guide → Transactions' },
  'float': { texte: 'Le **float** est le solde disponible chez chaque opérateur. En cas de float bas :\n1. Allez dans **Gestion Float**\n2. Consultez le solde par opérateur\n3. Approvisionnez l\'opérateur concerné\n\nConfigurez les seuils d\'alerte dans Paramètres → Float.', source: 'Guide → Float & Liquidités' },
  'agent': { texte: 'Pour **ajouter un agent** :\n1. Allez dans **Agents → Ajouter un agent**\n2. Renseignez nom, email, téléphone et agence\n3. L\'agent reçoit ses identifiants par email automatiquement\n\nVoir la **FAQ** : "Comment ajouter un nouvel agent ?"', source: 'Guide → Gestion des Agents' },
  'rapport': { texte: 'Les **rapports** sont disponibles dans **Rapports & BI** :\n- Générez un rapport pour une période donnée\n- Exportez en **CSV, XLSX ou PDF**\n- Recevez des rapports mensuels par email automatiquement', source: 'Guide → Rapports & Exports' },
  'export': { texte: 'GESTMONEY supporte 3 formats d\'export :\n- **CSV** — tableur universel\n- **XLSX** — Excel avec en-tête et formules\n- **PDF** — document formaté\n\nDisponibles dans Transactions et Rapports & BI.', source: 'FAQ → Rapports / Exports' },
  'commission': { texte: 'Les **commissions** sont calculées automatiquement selon le barème configuré par opérateur. Consultez **Commissions → Barèmes** pour voir ou modifier les taux.\n\nLe rapport de commissions par agent est dans **Commissions → Par agent**.', source: 'Guide → Commissions' },
  'mdp': { texte: 'Pour **réinitialiser un mot de passe** :\n- **Le vôtre** : Paramètres → Sécurité → Changer le mot de passe\n- **Celui d\'un agent** : Agents → [Agent] → Actions → Réinitialiser mot de passe\n\nL\'agent reçoit un email avec un lien valable 1 heure.', source: 'FAQ → Connexion / Sécurité' },
  '2fa': { texte: 'Pour activer la **double authentification** :\n1. Paramètres → Sécurité → Double authentification\n2. Cliquez sur "Activer la 2FA"\n3. Scannez le QR code avec Google Authenticator ou Authy\n4. Entrez le code à 6 chiffres pour confirmer', source: 'Guide → Connexion & Sécurité' },
  'aide': { texte: 'Le **Centre d\'aide** est disponible dans la sidebar. Il contient :\n- **Guide utilisateur** : 15 sections, procédures pas-à-pas\n- **100 FAQ** : questions réelles par catégorie\n- **Tickets support** : assistance technique\n- **SARA** (c\'est moi !) : disponible 24h/24', source: 'Centre d\'aide' },
  'rôle': { texte: '**Rôles disponibles dans GESTMONEY** :\n- **SUPER_ADMIN** — Accès total plateforme\n- **ADMIN** — Gestion complète d\'un tenant\n- **MANAGER** — Agents, transactions, rapports\n- **SUPERVISOR** — Supervision d\'agences\n- **AGENT** — Enregistrement transactions uniquement\n- **AUDITOR** — Lecture seule', source: 'Guide → Présentation GESTMONEY' },
  'ticket': { texte: 'Pour ouvrir un **ticket de support** :\n1. Allez dans **Support → Nouveau ticket**\n2. Renseignez le titre, la catégorie et la priorité\n3. Décrivez le problème en détail\n4. Cliquez sur "Envoyer"\n\nRéponse garantie sous 4h en jours ouvrés.', source: 'Guide → Support & Tickets' },
  'seuil': { texte: 'Pour configurer les **seuils d\'alerte float** :\n1. Gestion Float → Paramètres Float → [Opérateur]\n2. Définissez le seuil bas (première alerte)\n3. Définissez le seuil critique (alerte urgente + blocage optionnel)\n4. Choisissez les destinataires email', source: 'Guide → Float & Liquidités' },
};

const REPONSES_EN: Record<string, { texte: string; source?: string }> = {
  'transaction': { texte: 'To record a transaction: **Transactions → New transaction** → choose the type (Deposit/Withdrawal/Transfer), select the operator, enter the amount and client phone number.', source: 'Guide → Transactions' },
  'float': { texte: 'The **float** is the balance held with each Mobile Money operator. If your float is low, go to **Float Management** and top it up.', source: 'Guide → Float & Liquidity' },
  'agent': { texte: 'To **add an agent**: Agents → Add agent → fill in name, email, phone and agency. The agent receives login credentials by email automatically.', source: 'Guide → Agent Management' },
  'password': { texte: 'To **reset a password**:\n- Your own: Settings → Security → Change password\n- An agent\'s: Agents → [Agent] → Actions → Reset password', source: 'FAQ → Security' },
  'report': { texte: 'Reports are available in **Reports & BI**. Generate for any period and export as CSV, XLSX or PDF.', source: 'Guide → Reports & Exports' },
  'commission': { texte: '**Commissions** are calculated automatically from the rate schedule configured per operator. See Commissions → Schedules to view or modify rates.', source: 'Guide → Commissions' },
  'role': { texte: '**GESTMONEY roles**: SUPER_ADMIN (full platform), ADMIN (tenant management), MANAGER (agents + reports), SUPERVISOR (agency oversight), AGENT (transactions only), AUDITOR (read-only).', source: 'Guide → Presentation' },
  'help': { texte: 'The **Help Center** is in the sidebar. It includes a complete User Guide (15 sections), 100 FAQ, support tickets and SARA (that\'s me!).', source: 'Help Center' },
};

// ─── Suggestions contextuelles par page ──────────────────────────────────────

const SUGGESTIONS_CONTEXTUELLES: Record<string, string[]> = {
  '/dashboard': ['Comment lire le tableau de bord ?', 'Que signifient les KPIs ?', 'Comment exporter les données ?'],
  '/dashboard/transactions': ['Comment enregistrer une transaction ?', 'Que faire si une transaction reste en attente ?', 'Comment exporter les transactions ?'],
  '/dashboard/agents': ['Comment ajouter un agent ?', 'Comment voir les performances d\'un agent ?', 'Comment réinitialiser le mot de passe d\'un agent ?'],
  '/dashboard/float': ['Qu\'est-ce que le float ?', 'Comment configurer les seuils d\'alerte ?', 'Comment enregistrer un rechargement de float ?'],
  '/dashboard/commissions': ['Comment configurer les barèmes de commission ?', 'Comment voir les commissions d\'un agent ?', 'Quand les commissions sont-elles versées ?'],
  '/dashboard/rapports': ['Comment générer un rapport mensuel ?', 'Comment exporter en Excel ?', 'Comment comparer deux périodes ?'],
  '/dashboard/agences': ['Comment créer une agence ?', 'Comment comparer les performances des agences ?'],
  '/dashboard/settings': ['Comment activer la 2FA ?', 'Comment modifier le logo de ma société ?', 'Comment configurer les notifications ?'],
  '/dashboard/support': ['Comment ouvrir un ticket ?', 'Quels sont les délais de réponse ?', 'Comment escalader un ticket urgent ?'],
  '/dashboard/aide': ['Qu\'est-ce que GESTMONEY ?', 'Comment contacter le support ?', 'Quels opérateurs sont supportés ?'],
  '/dashboard/faq': ['Comment rechercher une FAQ ?', 'Quelles catégories de FAQ existent ?'],
  '/dashboard/guide': ['Comment naviguer dans le guide ?', 'Puis-je exporter le guide en PDF ?'],
};

const SUGGESTIONS_DEFAULT = [
  'Comment enregistrer une transaction ?',
  'Mon float est bas, que faire ?',
  'Comment ajouter un agent ?',
  'Comment exporter les rapports ?',
];

// ─── Détection de langue ──────────────────────────────────────────────────────

function detecterLangue(texte: string): 'fr' | 'en' {
  const motsEN = ['how', 'what', 'where', 'when', 'why', 'can', 'do', 'does', 'is', 'are', 'the', 'my', 'help'];
  const motsFR = ['comment', 'qu\'est', 'que', 'où', 'quand', 'pourquoi', 'mon', 'ma', 'mes', 'le', 'la', 'les', 'aide'];
  const t = texte.toLowerCase();
  const enScore = motsEN.filter((m) => t.includes(m)).length;
  const frScore = motsFR.filter((m) => t.includes(m)).length;
  return enScore > frScore ? 'en' : 'fr';
}

// ─── Moteur de réponse local ──────────────────────────────────────────────────

function trouverReponseLocale(question: string): { texte: string; source?: string } {
  const q = question.toLowerCase();
  const langue = detecterLangue(q);
  const base = langue === 'en' ? REPONSES_EN : REPONSES_FR;

  for (const [cle, rep] of Object.entries(base)) {
    if (q.includes(cle)) return rep;
  }

  // Recherche également dans FR si EN ne trouve rien (termes techniques communs)
  if (langue === 'en') {
    for (const [cle, rep] of Object.entries(REPONSES_FR)) {
      if (q.includes(cle)) return { texte: rep.texte, source: rep.source };
    }
  }

  if (q.includes('bonjour') || q.includes('salut') || q.includes('hello') || q.includes('hi')) {
    return { texte: langue === 'en'
      ? 'Hello! I\'m SARA, your GESTMONEY AI assistant. Ask me anything about transactions, float management, agents, reports or any feature!'
      : 'Bonjour ! Je suis SARA, votre assistante IA GESTMONEY. Posez-moi vos questions sur les transactions, le float, les agents, les rapports ou n\'importe quelle fonctionnalité !' };
  }

  if (q.includes('merci') || q.includes('thank')) {
    return { texte: langue === 'en' ? 'You\'re welcome! Don\'t hesitate to ask if you have more questions.' : 'Avec plaisir ! N\'hésitez pas si vous avez d\'autres questions.' };
  }

  return { texte: langue === 'en'
    ? `I couldn't find a specific answer for "*${question}*".\n\nYou can:\n- Consult the **User Guide** (sidebar → Help Center → Guide)\n- Browse the **100 FAQ**\n- Open a **support ticket** for complex issues`
    : `Je n'ai pas trouvé de réponse précise pour "*${question}*".\n\nVous pouvez :\n- Consulter le **Guide utilisateur** (sidebar → Centre d'aide → Guide)\n- Parcourir les **100 FAQ**\n- Ouvrir un **ticket de support** pour les problèmes complexes` };
}

// ─── Rendu Markdown simplifié ──────────────────────────────────────────────

function Markdown({ texte }: { texte: string }) {
  const lignes = texte.split('\n');
  return (
    <div className="space-y-0.5">
      {lignes.map((ligne, i) => {
        if (!ligne.trim()) return <div key={i} className="h-1" />;
        const rendu = ligne
          .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
          .replace(/\*(.+?)\*/g, '<em>$1</em>')
          .replace(/`(.+?)`/g, '<code class="bg-black/10 dark:bg-white/10 px-1 rounded text-[11px]">$1</code>');
        if (ligne.startsWith('- ') || ligne.startsWith('• ')) {
          return <li key={i} className="ml-4 list-disc text-[11.5px] leading-relaxed" dangerouslySetInnerHTML={{ __html: rendu.slice(2) }} />;
        }
        if (/^\d+\./.test(ligne)) {
          return <li key={i} className="ml-4 list-decimal text-[11.5px] leading-relaxed" dangerouslySetInnerHTML={{ __html: rendu.replace(/^\d+\.\s*/, '') }} />;
        }
        return <p key={i} className="text-[11.5px] leading-relaxed" dangerouslySetInnerHTML={{ __html: rendu }} />;
      })}
    </div>
  );
}

// ─── Composant principal ───────────────────────────────────────────────────────

export function SaraWidget() {
  const [ouvert, setOuvert] = useState(false);
  const [minimise, setMinimise] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'init',
      role: 'assistant',
      contenu: 'Bonjour ! Je suis **SARA**, votre assistante IA GESTMONEY. Posez-moi vos questions sur les fonctionnalités, les transactions, les agents ou le float. Je réponds aussi en anglais ! 🌍',
      date: new Date(),
    },
  ]);
  const [saisie, setSaisie] = useState('');
  const [enTraitement, setEnTraitement] = useState(false);
  const [nbNonLus, setNbNonLus] = useState(0);
  const [langue, setLangue] = useState<'fr' | 'en'>('fr');
  const fin = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { user } = useAuthStore();
  const pathname = usePathname();

  const suggestions = useMemo(() => {
    if (!pathname) return SUGGESTIONS_DEFAULT;
    // Chercher la suggestion la plus précise
    const cle = Object.keys(SUGGESTIONS_CONTEXTUELLES).find((k) => pathname === k || pathname.startsWith(k + '/'));
    return cle ? SUGGESTIONS_CONTEXTUELLES[cle] : SUGGESTIONS_DEFAULT;
  }, [pathname]);

  useEffect(() => {
    if (ouvert) {
      setNbNonLus(0);
      setTimeout(() => fin.current?.scrollIntoView({ behavior: 'smooth' }), 50);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [ouvert, messages]);

  const envoyer = useCallback(async (texte?: string) => {
    const q = (texte ?? saisie).trim();
    if (!q || enTraitement) return;
    setSaisie('');
    setEnTraitement(true);

    const langueDetectee = detecterLangue(q);
    setLangue(langueDetectee);

    const userMsg: Message = { id: `u${Date.now()}`, role: 'user', contenu: q, date: new Date() };
    setMessages((prev) => [...prev, userMsg]);

    // Délai simulé pour effet naturel
    await new Promise((r) => setTimeout(r, 400 + Math.random() * 600));

    let reponse: string;
    let source: string | undefined;

    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: q,
          userId: user?.id,
          contexte: 'SUPPORT',
          langue: langueDetectee,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        reponse = data.response ?? '';
        source = data.source;
        if (!reponse) throw new Error('empty');
      } else throw new Error('api error');
    } catch {
      const local = trouverReponseLocale(q);
      reponse = local.texte;
      source = local.source;
    }

    const aiMsg: Message = {
      id: `a${Date.now()}`,
      role: 'assistant',
      contenu: reponse,
      source,
      date: new Date(),
    };
    setMessages((prev) => [...prev, aiMsg]);
    setEnTraitement(false);

    if (!ouvert) setNbNonLus((n) => n + 1);
  }, [saisie, enTraitement, user?.id, ouvert]);

  const reinitialiser = () => {
    setMessages([{
      id: 'init-new',
      role: 'assistant',
      contenu: langue === 'en'
        ? 'Conversation cleared. How can I help you?'
        : 'Conversation effacée. Comment puis-je vous aider ?',
      date: new Date(),
    }]);
  };

  const ACTION_EXPLIQUER = langue === 'en' ? 'Explain this page' : 'Expliquer cette page';
  const ACTION_COMMENT = langue === 'en' ? 'How to...' : 'Comment effectuer...';
  const ACTION_SIGNALER = langue === 'en' ? 'Report an issue' : 'Signaler un problème';

  const handleAction = (action: string) => {
    if (action === ACTION_EXPLIQUER) {
      const nomPage = pathname?.split('/').pop() ?? 'page';
      envoyer(langue === 'en' ? `Explain the ${nomPage} page` : `Explique-moi la page ${nomPage}`);
    } else if (action === ACTION_COMMENT) {
      setSaisie(langue === 'en' ? 'How to ' : 'Comment ');
      inputRef.current?.focus();
    } else if (action === ACTION_SIGNALER) {
      envoyer(langue === 'en' ? 'I want to report a problem, how do I open a support ticket?' : 'Je veux signaler un problème, comment ouvrir un ticket de support ?');
    }
  };

  return (
    <>
      {/* Bouton flottant */}
      {!ouvert && (
        <button
          onClick={() => setOuvert(true)}
          className="fixed bottom-6 right-6 z-[70] w-14 h-14 rounded-full bg-[#009E00] text-white shadow-lg shadow-[#009E00]/30 hover:bg-[#007a00] transition-all hover:scale-110 active:scale-95 flex items-center justify-center"
          aria-label="Ouvrir SARA — Assistante IA GESTMONEY"
          title="SARA — Assistant IA GESTMONEY"
        >
          <Bot size={24} />
          {nbNonLus > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
              {nbNonLus}
            </span>
          )}
        </button>
      )}

      {/* Fenêtre chat */}
      {ouvert && (
        <div
          className={clsx(
            'fixed bottom-6 right-6 z-[70] w-[380px] max-w-[calc(100vw-24px)] bg-white dark:bg-[hsl(0_0%_11%)] rounded-2xl shadow-2xl border border-gray-200 dark:border-white/10 flex flex-col transition-all duration-200 overflow-hidden',
            minimise ? 'h-14' : 'h-[560px]'
          )}
        >
          {/* Header */}
          <div className="flex items-center gap-2.5 px-4 py-3 bg-[#009E00] flex-shrink-0">
            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
              <Bot size={17} className="text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-white font-bold text-sm leading-none">SARA</p>
                <span className="text-[10px] bg-white/20 text-white px-1.5 py-0.5 rounded-full font-medium">IA</span>
                <button
                  onClick={() => setLangue((l) => l === 'fr' ? 'en' : 'fr')}
                  title="Changer la langue / Switch language"
                  className="flex items-center gap-1 text-[10px] bg-white/15 hover:bg-white/25 text-white px-1.5 py-0.5 rounded-full transition-colors"
                >
                  <Globe size={9} />
                  {langue.toUpperCase()}
                </button>
              </div>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#FFD000] animate-pulse" />
                <span className="text-white/70 text-[10px]">{langue === 'en' ? 'Available 24/7' : 'Disponible 24h/24'}</span>
              </div>
            </div>
            <div className="flex items-center gap-0.5">
              <button
                onClick={reinitialiser}
                title={langue === 'en' ? 'New conversation' : 'Nouvelle conversation'}
                className="text-white/70 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-colors"
              >
                <RefreshCw size={13} />
              </button>
              <button onClick={() => setMinimise((m) => !m)} className="text-white/70 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-colors">
                {minimise ? <Maximize2 size={13} /> : <Minimize2 size={13} />}
              </button>
              <button onClick={() => setOuvert(false)} className="text-white/70 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-colors">
                <X size={13} />
              </button>
            </div>
          </div>

          {!minimise && (
            <>
              {/* Messages */}
              <div className="flex-1 overflow-y-auto px-3.5 py-3 space-y-3">
                {messages.map((msg) => (
                  <div key={msg.id} className={clsx('flex gap-2', msg.role === 'user' && 'flex-row-reverse')}>
                    {msg.role === 'assistant' && (
                      <div className="w-6 h-6 rounded-full bg-[#009E00]/15 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Sparkles size={12} className="text-[#009E00]" />
                      </div>
                    )}
                    <div className="max-w-[84%] flex flex-col gap-1">
                      <div className={clsx(
                        'rounded-2xl px-3.5 py-2.5 leading-relaxed',
                        msg.role === 'user'
                          ? 'bg-[#009E00] text-white rounded-br-sm text-[12px]'
                          : 'bg-gray-100 dark:bg-white/08 text-text-main rounded-bl-sm'
                      )}>
                        {msg.role === 'assistant'
                          ? <Markdown texte={msg.contenu} />
                          : <p className="text-[12px]">{msg.contenu}</p>}
                      </div>
                      {msg.source && msg.role === 'assistant' && (
                        <div className="flex items-center gap-1 px-1">
                          <BookOpen size={10} className="text-[#009E00]/60" />
                          <span className="text-[10px] text-text-muted italic">{msg.source}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}

                {/* Typing indicator */}
                {enTraitement && (
                  <div className="flex gap-2">
                    <div className="w-6 h-6 rounded-full bg-[#009E00]/15 flex items-center justify-center flex-shrink-0">
                      <Sparkles size={12} className="text-[#009E00]" />
                    </div>
                    <div className="bg-gray-100 dark:bg-white/08 rounded-2xl rounded-bl-sm px-4 py-3 flex items-center gap-1">
                      {[0, 1, 2].map((i) => (
                        <span
                          key={i}
                          className="w-1.5 h-1.5 bg-[#009E00]/50 rounded-full animate-bounce"
                          style={{ animationDelay: `${i * 150}ms` }}
                        />
                      ))}
                    </div>
                  </div>
                )}
                <div ref={fin} />
              </div>

              {/* Actions contextuelles */}
              <div className="px-3.5 py-2 flex gap-1.5 flex-wrap border-t border-gray-100 dark:border-white/05">
                {[ACTION_EXPLIQUER, ACTION_COMMENT, ACTION_SIGNALER].map((action) => (
                  <button
                    key={action}
                    onClick={() => handleAction(action)}
                    className="flex items-center gap-1 text-[10px] font-medium bg-gray-100 dark:bg-white/08 text-text-muted hover:bg-[#009E00]/10 hover:text-[#009E00] px-2 py-1 rounded-full transition-colors"
                  >
                    {action === ACTION_EXPLIQUER && <BookOpen size={9} />}
                    {action === ACTION_COMMENT && <MessageSquare size={9} />}
                    {action === ACTION_SIGNALER && <LifeBuoy size={9} />}
                    {action}
                  </button>
                ))}
              </div>

              {/* Suggestions rapides (uniquement si conversation débutante) */}
              {messages.length <= 1 && (
                <div className="px-3.5 pb-2 flex gap-1.5 flex-wrap">
                  {suggestions.slice(0, 3).map((s) => (
                    <button
                      key={s}
                      onClick={() => envoyer(s)}
                      className="flex items-center gap-1 text-[10px] bg-[#009E00]/08 text-[#007a00] dark:text-[#4ade80] hover:bg-[#009E00]/15 border border-[#009E00]/20 px-2.5 py-1 rounded-full transition-colors"
                    >
                      <ChevronRight size={9} />
                      {s}
                    </button>
                  ))}
                </div>
              )}

              {/* Champ de saisie */}
              <div className="px-3.5 pb-3.5 pt-1.5 border-t border-gray-100 dark:border-white/08 flex gap-2">
                <input
                  ref={inputRef}
                  type="text"
                  value={saisie}
                  onChange={(e) => setSaisie(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) envoyer(); }}
                  placeholder={langue === 'en' ? 'Ask SARA a question…' : 'Posez votre question à SARA…'}
                  className="flex-1 px-3 py-2 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/05 text-text-main text-[12px] placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-[#009E00]/30 focus:border-[#009E00] transition-all"
                />
                <button
                  onClick={() => envoyer()}
                  disabled={!saisie.trim() || enTraitement}
                  className="w-9 h-9 rounded-xl bg-[#009E00] text-white flex items-center justify-center hover:bg-[#007a00] transition-colors disabled:opacity-40 flex-shrink-0"
                  aria-label="Envoyer"
                >
                  <Send size={14} />
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </>
  );
}

// Export par défaut pour usage comme remplacement direct de AssistantIA
export default SaraWidget;
