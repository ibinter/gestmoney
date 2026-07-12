'use client';
import React, { useState, useRef, useEffect } from 'react';
import { Bot, X, Send, Minimize2, Maximize2, Sparkles } from 'lucide-react';
import { clsx } from 'clsx';
import { useAuthStore } from '@/store/authStore';
import { useT } from '@/lib/i18n';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  contenu: string;
  date: Date;
}

// ─── Réponses contextuelles pré-définies ─────────────────────────────────
// En production, ces réponses seraient générées par l'API /ai/chat
const REPONSES: Record<string, string> = {
  'transaction': 'Pour enregistrer une transaction : allez dans **Transactions > Nouvelle transaction**, choisissez le type (Dépôt/Retrait/Transfert), sélectionnez l\'opérateur et saisissez le montant.\n\nVous pouvez aussi utiliser **⌘K** et taper "transactions" pour y accéder rapidement.',
  'float': 'Le **float** est le solde disponible chez chaque opérateur. Si votre float est bas :\n\n1. Allez dans **Gestion Float**\n2. Consultez le solde par opérateur\n3. Approvisionnez l\'opérateur concerné\n\nLes alertes sont configurables dans Paramètres > Float.',
  'agent': 'Pour **ajouter un agent** :\n1. Allez dans **Agents > Ajouter un agent**\n2. Renseignez nom, téléphone et agence\n3. L\'agent reçoit ses identifiants par email automatiquement.',
  'rapport': 'Les **rapports** sont disponibles dans **Rapports & BI**. Vous pouvez :\n- Générer un rapport pour une période donnée\n- Exporter en **CSV, XLSX ou PDF**\n- Recevoir des rapports mensuels par email automatiquement.',
  'export': 'GESTMONEY supporte 3 formats d\'export :\n- **CSV** — tableur universel\n- **XLSX** — Excel avec en-tête GESTMONEY\n- **PDF** — document formaté prêt à imprimer\n\nDisponibles dans Rapports & BI, et aussi dans Transactions.',
  'commission': 'Les **commissions** sont calculées automatiquement selon le barème configuré par opérateur. Consultez la page **Commissions** pour voir le détail par agent et par opérateur.',
  'mdp': 'Pour **réinitialiser un mot de passe** :\n- Pour vous : Paramètres > Sécurité > Changer le mot de passe\n- Pour un agent : Agents > [Nom de l\'agent] > Actions > Réinitialiser mot de passe\n\nL\'agent recevra un email avec un lien sécurisé valable 1 heure.',
  '2fa': 'Pour activer la **double authentification** :\n1. Allez dans **Paramètres > Sécurité**\n2. Cliquez sur "Activer la 2FA"\n3. Scannez le QR code avec Google Authenticator ou Authy\n4. Saisissez le code à 6 chiffres pour confirmer\n\nRecommandé pour tous les comptes gestionnaires.',
  'superadmin': 'La **Console SuperAdmin** est accessible via le lien jaune en bas de la sidebar. Elle affiche :\n- KPIs globaux de tous les tenants\n- Gestion des emails automatiques\n- Journal d\'audit global\n- Licences et facturation',
  'aide': 'Le **Centre d\'aide** est disponible dans la sidebar sous "Centre d\'aide". Il contient 14 articles répartis en 6 sections et une FAQ.\n\nVous pouvez aussi rechercher n\'importe quelle fonctionnalité avec **⌘K**.',
};

const SUGGESTIONS = [
  'Comment enregistrer une transaction ?',
  'Mon float est bas, que faire ?',
  'Comment ajouter un agent ?',
  'Exporter les rapports en PDF',
];

function trouverReponse(question: string): string {
  const q = question.toLowerCase();
  for (const [cle, reponse] of Object.entries(REPONSES)) {
    if (q.includes(cle)) return reponse;
  }
  if (q.includes('bonjour') || q.includes('salut') || q.includes('hello')) {
    return 'Bonjour ! Je suis votre assistant GESTMONEY. Posez-moi vos questions sur les transactions, le float, les agents, les rapports ou toute autre fonctionnalité. 😊';
  }
  if (q.includes('merci')) {
    return 'Avec plaisir ! N\'hésitez pas si vous avez d\'autres questions. 👍';
  }
  return `Je n'ai pas trouvé de réponse précise pour "*${question}*".\n\nVous pouvez :\n- Consulter le **Centre d\'aide** (sidebar > Centre d\'aide)\n- Ouvrir un **ticket de support** (sidebar > Support)\n- Contacter l\'équipe : **support@ibigsoft.com**`;
}

// ─── Rendu Markdown simplifié ──────────────────────────────────────────────
function MarkdownSimple({ texte }: { texte: string }) {
  const lignes = texte.split('\n');
  return (
    <div className="space-y-1">
      {lignes.map((ligne, i) => {
        if (!ligne.trim()) return <br key={i} />;
        // Bold **texte**
        const rendu = ligne.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>').replace(/\*(.+?)\*/g, '<em>$1</em>');
        if (ligne.startsWith('- ')) {
          return <li key={i} className="ml-3 list-disc" dangerouslySetInnerHTML={{ __html: rendu.slice(2) }} />;
        }
        if (/^\d+\./.test(ligne)) {
          return <li key={i} className="ml-3 list-decimal" dangerouslySetInnerHTML={{ __html: rendu.replace(/^\d+\.\s*/, '') }} />;
        }
        return <p key={i} dangerouslySetInnerHTML={{ __html: rendu }} />;
      })}
    </div>
  );
}

// ─── Composant principal ───────────────────────────────────────────────────
export function AssistantIA() {
  const [ouvert, setOuvert] = useState(false);
  const [minimise, setMinimise] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'init',
      role: 'assistant',
      contenu: 'Bonjour ! Je suis votre assistant GESTMONEY alimenté par l\'IA. Posez-moi vos questions sur les fonctionnalités, les transactions, les agents ou le float. 💬',
      date: new Date(),
    },
  ]);
  const [saisie, setSaisie] = useState('');
  const [enTraitement, setEnTraitement] = useState(false);
  const [nbNonLus, setNbNonLus] = useState(0);
  const fin = useRef<HTMLDivElement>(null);
  const { user } = useAuthStore();
  const t = useT();

  useEffect(() => {
    if (ouvert) {
      setNbNonLus(0);
      fin.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [ouvert, messages]);

  const envoyer = async (texte?: string) => {
    const q = (texte ?? saisie).trim();
    if (!q || enTraitement) return;
    setSaisie('');
    setEnTraitement(true);

    const userMsg: Message = { id: `u${Date.now()}`, role: 'user', contenu: q, date: new Date() };
    setMessages((prev) => [...prev, userMsg]);

    // Simulation délai IA (300-800ms)
    await new Promise((r) => setTimeout(r, 300 + Math.random() * 500));

    let reponse: string;
    try {
      // Tenter l'API en production
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: q, userId: user?.id }),
      });
      if (res.ok) {
        const data = await res.json();
        reponse = data.response ?? trouverReponse(q);
      } else {
        reponse = trouverReponse(q);
      }
    } catch {
      reponse = trouverReponse(q);
    }

    const aiMsg: Message = { id: `a${Date.now()}`, role: 'assistant', contenu: reponse, date: new Date() };
    setMessages((prev) => [...prev, aiMsg]);
    setEnTraitement(false);

    if (!ouvert) setNbNonLus((n) => n + 1);
  };

  return (
    <>
      {/* Bulle flottante */}
      {!ouvert && (
        <button
          onClick={() => setOuvert(true)}
          className="fixed bottom-6 right-6 z-[70] w-14 h-14 rounded-full bg-primary text-sidebar shadow-lg hover:bg-primary/90 transition-all hover:scale-110 active:scale-95 flex items-center justify-center"
          aria-label="Ouvrir l'assistant IA"
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
            'fixed bottom-6 right-6 z-[70] w-[360px] bg-white dark:bg-[hsl(0_0%_11%)] rounded-2xl shadow-2xl border border-gray-200 dark:border-white/10 flex flex-col transition-all duration-300 overflow-hidden',
            minimise ? 'h-14' : 'h-[520px]'
          )}
        >
          {/* Header */}
          <div className="flex items-center gap-3 px-4 py-3 bg-primary flex-shrink-0">
            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
              <Bot size={18} className="text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white font-bold text-sm leading-none">{t.assistant.title}</p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#FFD000] animate-pulse" />
                <span className="text-white/70 text-[10px]">{t.assistant.online}</span>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button onClick={() => setMinimise((m) => !m)} className="text-white/70 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-colors">
                {minimise ? <Maximize2 size={14} /> : <Minimize2 size={14} />}
              </button>
              <button onClick={() => setOuvert(false)} className="text-white/70 hover:text-white p-1.5 rounded-lg hover:bg-white/10 transition-colors">
                <X size={14} />
              </button>
            </div>
          </div>

          {!minimise && (
            <>
              {/* Messages */}
              <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
                {messages.map((msg) => (
                  <div key={msg.id} className={clsx('flex gap-2', msg.role === 'user' && 'flex-row-reverse')}>
                    {msg.role === 'assistant' && (
                      <div className="w-6 h-6 rounded-full bg-primary/15 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Sparkles size={12} className="text-primary" />
                      </div>
                    )}
                    <div className={clsx(
                      'max-w-[82%] rounded-2xl px-3.5 py-2.5 text-xs leading-relaxed',
                      msg.role === 'user'
                        ? 'bg-primary text-sidebar rounded-br-sm'
                        : 'bg-gray-100 dark:bg-white/08 text-text-main rounded-bl-sm'
                    )}>
                      {msg.role === 'assistant'
                        ? <MarkdownSimple texte={msg.contenu} />
                        : <p>{msg.contenu}</p>
                      }
                    </div>
                  </div>
                ))}

                {/* Typing indicator */}
                {enTraitement && (
                  <div className="flex gap-2">
                    <div className="w-6 h-6 rounded-full bg-primary/15 flex items-center justify-center flex-shrink-0">
                      <Sparkles size={12} className="text-primary" />
                    </div>
                    <div className="bg-gray-100 dark:bg-white/08 rounded-2xl rounded-bl-sm px-4 py-3 flex items-center gap-1">
                      {[0, 1, 2].map((i) => (
                        <span
                          key={i}
                          className="w-1.5 h-1.5 bg-gray-400 dark:bg-white/40 rounded-full animate-bounce"
                          style={{ animationDelay: `${i * 150}ms` }}
                        />
                      ))}
                    </div>
                  </div>
                )}
                <div ref={fin} />
              </div>

              {/* Suggestions rapides */}
              {messages.length <= 1 && (
                <div className="px-4 pb-2 flex gap-1.5 flex-wrap">
                  {t.assistant.suggestions.map((s) => (
                    <button
                      key={s}
                      onClick={() => envoyer(s)}
                      className="text-[10px] bg-gray-100 dark:bg-white/08 text-text-muted hover:bg-primary/10 hover:text-primary border border-gray-200 dark:border-white/10 px-2.5 py-1 rounded-full transition-colors"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              )}

              {/* Saisie */}
              <div className="px-3 pb-3 pt-2 border-t border-gray-100 dark:border-white/08 flex gap-2">
                <input
                  type="text"
                  value={saisie}
                  onChange={(e) => setSaisie(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') envoyer(); }}
                  placeholder={t.assistant.placeholder}
                  className="flex-1 px-3 py-2 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/05 text-text-main text-xs placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
                />
                <button
                  onClick={() => envoyer()}
                  disabled={!saisie.trim() || enTraitement}
                  className="w-9 h-9 rounded-xl bg-primary text-sidebar flex items-center justify-center hover:bg-primary/90 transition-colors disabled:opacity-40 flex-shrink-0"
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
