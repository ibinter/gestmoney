'use client';
import React, { useState } from 'react';
import {
  TicketIcon, Plus, Clock, CheckCircle2, AlertTriangle,
  MessageSquare, Paperclip, Send, ChevronRight, X,
} from 'lucide-react';
import { clsx } from 'clsx';
import { formatRelativeTime } from '@/lib/formatters';
import { useAuthStore } from '@/store/authStore';
import api from '@/lib/api';
import { useT } from '@/lib/i18n';
import type { Translations } from '@/lib/i18n/fr';

// ─── Types ────────────────────────────────────────────────────────────────
type StatutTicket = 'ouvert' | 'en_cours' | 'resolu' | 'ferme';
type PrioriteTicket = 'basse' | 'normale' | 'haute' | 'urgente';
type CategorieTicket = 'technique' | 'facturation' | 'agent' | 'transaction' | 'float' | 'autre';

interface Ticket {
  id: string;
  titre: string;
  statut: StatutTicket;
  priorite: PrioriteTicket;
  categorie: CategorieTicket;
  dateCreation: string;
  dateMaj: string;
  nbMessages: number;
  description: string;
}

interface Message {
  id: string;
  auteur: string;
  role: 'user' | 'support';
  contenu: string;
  date: string;
}

// ─── Mock data ────────────────────────────────────────────────────────────
const MOCK_TICKETS: Ticket[] = [
  {
    id: 'TK-2026-001',
    titre: 'Transaction bloquée en attente depuis 48h',
    statut: 'en_cours',
    priorite: 'haute',
    categorie: 'transaction',
    dateCreation: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    dateMaj: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
    nbMessages: 4,
    description: 'La transaction TX-2026-07-A48C9F est bloquée depuis 48 heures avec le statut "En attente". Le client a confirmé que les fonds ont bien été débités côté Wave.',
  },
  {
    id: 'TK-2026-002',
    titre: 'Impossibilité de se connecter — agent Koné Drissa',
    statut: 'resolu',
    priorite: 'normale',
    categorie: 'technique',
    dateCreation: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    dateMaj: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
    nbMessages: 6,
    description: 'L\'agent Koné Drissa ne peut plus se connecter à l\'application depuis la mise à jour.',
  },
  {
    id: 'TK-2026-003',
    titre: 'Alerte float Orange Money — seuil non respecté',
    statut: 'ouvert',
    priorite: 'urgente',
    categorie: 'float',
    dateCreation: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    dateMaj: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
    nbMessages: 1,
    description: 'Malgré le rechargement du float Orange Money ce matin, les alertes continuent d\'être envoyées et le solde affiché ne correspond pas au solde réel.',
  },
];

const MOCK_MESSAGES: Record<string, Message[]> = {
  'TK-2026-001': [
    { id: 'm1', auteur: 'Vous', role: 'user', contenu: 'La transaction TX-2026-07-A48C9F est bloquée depuis 48h. Le client Wave a confirmé le débit.', date: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString() },
    { id: 'm2', auteur: 'Support IBIG', role: 'support', contenu: 'Bonjour, nous avons bien reçu votre ticket. Pouvez-vous nous donner le numéro de téléphone du client pour vérification côté Wave ?', date: new Date(Date.now() - 46 * 60 * 60 * 1000).toISOString() },
    { id: 'm3', auteur: 'Vous', role: 'user', contenu: 'Le numéro du client est le 07 XX XX XX XX. La transaction référence Wave est WV-20260710-8847C.', date: new Date(Date.now() - 44 * 60 * 60 * 1000).toISOString() },
    { id: 'm4', auteur: 'Support IBIG', role: 'support', contenu: 'Merci. Nous avons transmis la demande à Wave Sénégal. Un retour est attendu sous 24h. Nous vous tenons informé.', date: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString() },
  ],
};

// ─── Constantes UI ────────────────────────────────────────────────────────
/** Clé de traduction du statut dans `t.support.status`. */
const STATUT_I18N: Record<StatutTicket, keyof Translations['support']['status']> = {
  ouvert: 'open', en_cours: 'inProgress', resolu: 'resolved', ferme: 'closed',
};

/** Clé de traduction de la priorité dans `t.support.priority_levels`. */
const PRIORITE_I18N: Record<PrioriteTicket, keyof Translations['support']['priority_levels']> = {
  basse: 'low', normale: 'normal', haute: 'high', urgente: 'urgent',
};

const STATUT_CONFIG: Record<StatutTicket, { couleur: string; icone: React.ReactNode }> = {
  ouvert:   { couleur: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',     icone: <Clock size={11} /> },
  en_cours: { couleur: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300', icone: <AlertTriangle size={11} /> },
  resolu:   { couleur: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300', icone: <CheckCircle2 size={11} /> },
  ferme:    { couleur: 'bg-gray-100 text-gray-500 dark:bg-white/08 dark:text-gray-400',        icone: <X size={11} /> },
};

const PRIORITE_CONFIG: Record<PrioriteTicket, { couleur: string; point: string }> = {
  basse:   { couleur: 'text-gray-400',  point: 'bg-gray-300' },
  normale: { couleur: 'text-blue-500',  point: 'bg-blue-400' },
  haute:   { couleur: 'text-orange-500',point: 'bg-orange-400' },
  urgente: { couleur: 'text-red-500',   point: 'bg-red-500 animate-pulse' },
};

const CATEGORIES: CategorieTicket[] = ['technique', 'transaction', 'float', 'agent', 'facturation', 'autre'];

/** Libellé traduit d'un statut de ticket. */
const labelStatut = (t: Translations, s: StatutTicket) => t.support.status[STATUT_I18N[s]];

/** Libellé traduit d'une priorité de ticket. */
const labelPriorite = (t: Translations, p: PrioriteTicket) => t.support.priority_levels[PRIORITE_I18N[p]];

// ─── Formulaire nouveau ticket ─────────────────────────────────────────────
function NouveauTicketModal({ onFermer, onCreer }: { onFermer: () => void; onCreer: (t: Ticket) => void }) {
  const t = useT();
  const [form, setForm] = useState({
    titre: '', categorie: 'technique' as CategorieTicket,
    priorite: 'normale' as PrioriteTicket, description: '',
  });
  const [envoi, setEnvoi] = useState(false);

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.titre.trim() || !form.description.trim()) return;
    setEnvoi(true);
    try {
      await api.post('/support/tickets', form);
    } catch { /* fallback local */ }
    const nouveau: Ticket = {
      id: `TK-2026-${String(Math.floor(Math.random() * 900 + 100))}`,
      ...form,
      statut: 'ouvert',
      dateCreation: new Date().toISOString(),
      dateMaj: new Date().toISOString(),
      nbMessages: 1,
    };
    onCreer(nouveau);
    setEnvoi(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-lg bg-surface dark:bg-[hsl(0_0%_10%)] rounded-2xl shadow-2xl border border-gray-100 dark:border-white/10 overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-white/08">
          <h2 className="font-bold text-text-main">{t.support.newTicketTitle}</h2>
          <button onClick={onFermer} className="text-text-muted hover:text-text-main p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-white/08 transition-colors">
            <X size={16} />
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-text-muted mb-1.5">{t.support.titleRequired}</label>
            <input
              type="text"
              value={form.titre}
              onChange={(e) => set('titre', e.target.value)}
              placeholder={t.support.titlePlaceholder}
              required
              className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/04 text-text-main text-sm placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-text-muted mb-1.5">{t.support.category}</label>
              <select
                value={form.categorie}
                onChange={(e) => set('categorie', e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/04 text-text-main text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
              >
                {CATEGORIES.map((c) => <option key={c} value={c}>{t.support.categories[c]}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-text-muted mb-1.5">{t.support.priority}</label>
              <select
                value={form.priorite}
                onChange={(e) => set('priorite', e.target.value as PrioriteTicket)}
                className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/04 text-text-main text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
              >
                {(['basse', 'normale', 'haute', 'urgente'] as const).map((p) => (
                  <option key={p} value={p}>{labelPriorite(t, p)}</option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-text-muted mb-1.5">{t.support.descriptionRequired}</label>
            <textarea
              value={form.description}
              onChange={(e) => set('description', e.target.value)}
              rows={5}
              required
              placeholder={t.support.descriptionPlaceholder}
              className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/04 text-text-main text-sm placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all resize-none"
            />
          </div>
          <div className="flex items-center justify-between pt-2">
            <button type="button" onClick={onFermer} className="text-sm text-text-muted hover:text-text-main transition-colors px-3 py-2">{t.support.cancel}</button>
            <button
              type="submit"
              disabled={envoi || !form.titre.trim() || !form.description.trim()}
              className="flex items-center gap-2 bg-primary text-sidebar text-sm font-semibold px-5 py-2.5 rounded-xl hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {envoi ? t.support.sending : <><Send size={14} /> {t.support.sendTicket}</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Vue ticket détaillée ──────────────────────────────────────────────────
function TicketDetail({ ticket, onRetour }: { ticket: Ticket; onRetour: () => void }) {
  const t = useT();
  const [messages, setMessages] = useState<Message[]>(MOCK_MESSAGES[ticket.id] ?? [
    { id: 'm0', auteur: 'Vous', role: 'user', contenu: ticket.description, date: ticket.dateCreation },
  ]);
  const [nouveau, setNouveau] = useState('');
  const { user } = useAuthStore();
  const statut = STATUT_CONFIG[ticket.statut];

  const envoyer = () => {
    if (!nouveau.trim()) return;
    setMessages((prev) => [...prev, {
      id: `m${Date.now()}`, auteur: 'Vous', role: 'user',
      contenu: nouveau.trim(), date: new Date().toISOString(),
    }]);
    setNouveau('');
  };

  return (
    <div className="space-y-6">
      <button onClick={onRetour} className="flex items-center gap-1.5 text-sm text-text-muted hover:text-text-main transition-colors">
        ← {t.support.backToTickets}
      </button>

      <div className="bg-white dark:bg-white/03 rounded-2xl border border-gray-100 dark:border-white/08 overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-100 dark:border-white/08">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                <span className="font-mono text-xs text-text-muted bg-gray-100 dark:bg-white/08 px-2 py-0.5 rounded-lg">{ticket.id}</span>
                <span className={clsx('flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-full', statut.couleur)}>
                  {statut.icone} {labelStatut(t, ticket.statut)}
                </span>
                <span className={clsx('flex items-center gap-1.5 text-[11px] font-semibold', PRIORITE_CONFIG[ticket.priorite].couleur)}>
                  <span className={clsx('w-1.5 h-1.5 rounded-full', PRIORITE_CONFIG[ticket.priorite].point)} />
                  {labelPriorite(t, ticket.priorite)}
                </span>
              </div>
              <h2 className="text-lg font-bold text-text-main">{ticket.titre}</h2>
              <p className="text-xs text-text-muted mt-1">{t.support.openedAt} {formatRelativeTime(ticket.dateCreation)} · {t.support.categoryPrefix} : {t.support.categories[ticket.categorie]}</p>
            </div>
          </div>
        </div>

        {/* Messages */}
        <div className="divide-y divide-gray-50 dark:divide-white/05">
          {messages.map((msg) => {
            const auteur = msg.role === 'user' ? t.support.you : msg.auteur;
            return (
            <div key={msg.id} className={clsx('px-6 py-4', msg.role === 'support' && 'bg-primary/03')}>
              <div className="flex items-center gap-2 mb-2">
                <div className={clsx('w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold', msg.role === 'support' ? 'bg-primary text-sidebar' : 'bg-gray-200 dark:bg-white/15 text-text-main')}>
                  {auteur[0]}
                </div>
                <span className="text-sm font-semibold text-text-main">{auteur}</span>
                {msg.role === 'support' && <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-semibold">{t.support.supportBadge}</span>}
                <span className="text-xs text-text-muted ml-auto">{formatRelativeTime(msg.date)}</span>
              </div>
              <p className="text-sm text-text-muted leading-relaxed pl-8">{msg.contenu}</p>
            </div>
            );
          })}
        </div>

        {/* Répondre */}
        {ticket.statut !== 'ferme' && ticket.statut !== 'resolu' && (
          <div className="px-6 py-4 border-t border-gray-100 dark:border-white/08 bg-gray-50 dark:bg-white/02">
            <div className="flex gap-3">
              <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center text-xs font-bold text-sidebar flex-shrink-0 mt-2">
                {(user?.prenom?.[0] ?? 'V')}
              </div>
              <div className="flex-1">
                <textarea
                  value={nouveau}
                  onChange={(e) => setNouveau(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) envoyer(); }}
                  rows={3}
                  placeholder={t.support.replyPlaceholder}
                  className="w-full px-3 py-2.5 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/04 text-text-main text-sm placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary resize-none transition-all"
                />
                <div className="flex items-center justify-between mt-2">
                  <button className="flex items-center gap-1.5 text-xs text-text-muted hover:text-text-main transition-colors">
                    <Paperclip size={13} /> {t.support.attach}
                  </button>
                  <button
                    onClick={envoyer}
                    disabled={!nouveau.trim()}
                    className="flex items-center gap-1.5 bg-primary text-sidebar text-xs font-semibold px-3 py-1.5 rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-40"
                  >
                    <Send size={12} /> {t.support.reply}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Page principale ───────────────────────────────────────────────────────
export default function SupportPage() {
  const lang = useT();
  const [tickets, setTickets] = useState<Ticket[]>(MOCK_TICKETS);
  const [ticketActif, setTicketActif] = useState<Ticket | null>(null);
  const [modal, setModal] = useState(false);
  const [filtreStatut, setFiltreStatut] = useState<StatutTicket | 'tous'>('tous');

  const creerTicket = (t: Ticket) => {
    setTickets((prev) => [t, ...prev]);
    setModal(false);
    setTicketActif(t);
  };

  const ticketsFiltres = tickets.filter((t) => filtreStatut === 'tous' || t.statut === filtreStatut);

  const stats = {
    total:   tickets.length,
    ouverts: tickets.filter((t) => t.statut === 'ouvert').length,
    enCours: tickets.filter((t) => t.statut === 'en_cours').length,
    resolus: tickets.filter((t) => t.statut === 'resolu').length,
  };

  if (ticketActif) return <TicketDetail ticket={ticketActif} onRetour={() => setTicketActif(null)} />;

  return (
    <div className="space-y-6">
      {modal && <NouveauTicketModal onFermer={() => setModal(false)} onCreer={creerTicket} />}

      {/* En-tête */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-orange-100 dark:bg-orange-900/20 flex items-center justify-center">
            <MessageSquare size={20} className="text-orange-500" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-text-main">{lang.support.title}</h1>
            <p className="text-sm text-text-muted mt-0.5">{lang.support.subtitle}</p>
          </div>
        </div>
        <button
          onClick={() => setModal(true)}
          className="flex items-center gap-2 bg-primary text-sidebar text-sm font-semibold px-4 py-2.5 rounded-xl hover:bg-primary/90 transition-colors"
        >
          <Plus size={16} /> {lang.support.newTicket}
        </button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: lang.support.kpiTotal,      val: stats.total,   col: 'text-text-main' },
          { label: lang.support.kpiOpen,       val: stats.ouverts, col: 'text-blue-500' },
          { label: lang.support.kpiInProgress, val: stats.enCours, col: 'text-yellow-500' },
          { label: lang.support.kpiResolved,   val: stats.resolus, col: 'text-green-500' },
        ].map((k) => (
          <div key={k.label} className="bg-white dark:bg-white/03 rounded-2xl border border-gray-100 dark:border-white/08 px-4 py-3.5 text-center">
            <p className="text-2xl font-black mt-0.5 ${k.col}" style={{ color: 'inherit' }}>
              <span className={k.col}>{k.val}</span>
            </p>
            <p className="text-xs text-text-muted font-medium">{k.label}</p>
          </div>
        ))}
      </div>

      {/* Filtres */}
      <div className="flex gap-2 flex-wrap">
        {(['tous', 'ouvert', 'en_cours', 'resolu', 'ferme'] as const).map((s) => (
          <button
            key={s}
            onClick={() => setFiltreStatut(s)}
            className={clsx(
              'px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors',
              filtreStatut === s
                ? 'bg-primary text-sidebar'
                : 'bg-white dark:bg-white/05 text-text-muted border border-gray-200 dark:border-white/10 hover:border-primary hover:text-primary'
            )}
          >
            {s === 'tous' ? lang.support.filterAll : labelStatut(lang, s as StatutTicket)}
          </button>
        ))}
      </div>

      {/* Liste tickets */}
      <div className="space-y-2">
        {ticketsFiltres.length === 0 ? (
          <div className="bg-white dark:bg-white/03 rounded-2xl border border-gray-100 dark:border-white/08 px-6 py-12 text-center">
            <TicketIcon size={32} className="text-text-muted mx-auto mb-3 opacity-40" />
            <p className="text-text-muted text-sm">{lang.support.noTickets}</p>
            <button onClick={() => setModal(true)} className="mt-3 text-primary text-sm font-semibold hover:underline">
              {lang.support.createFirst}
            </button>
          </div>
        ) : ticketsFiltres.map((t) => {
          const s = STATUT_CONFIG[t.statut];
          const p = PRIORITE_CONFIG[t.priorite];
          return (
            <button
              key={t.id}
              onClick={() => setTicketActif(t)}
              className="w-full bg-white dark:bg-white/03 rounded-2xl border border-gray-100 dark:border-white/08 px-5 py-4 text-left hover:border-primary/30 hover:shadow-sm transition-all group"
            >
              <div className="flex items-start gap-4">
                <div className={clsx('w-2 h-2 rounded-full mt-2 flex-shrink-0', p.point)} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="font-mono text-xs text-text-muted">{t.id}</span>
                    <span className={clsx('flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full', s.couleur)}>
                      {s.icone} {labelStatut(lang, t.statut)}
                    </span>
                    <span className="text-[10px] text-text-muted bg-gray-100 dark:bg-white/08 px-2 py-0.5 rounded-full">
                      {lang.support.categories[t.categorie]}
                    </span>
                  </div>
                  <p className="text-sm font-semibold text-text-main group-hover:text-primary transition-colors truncate">{t.titre}</p>
                  <div className="flex items-center gap-3 mt-1.5 text-xs text-text-muted">
                    <span className="flex items-center gap-1"><MessageSquare size={11} /> {t.nbMessages} {lang.support.messages}</span>
                    <span>{lang.support.updatedAt} {formatRelativeTime(t.dateMaj)}</span>
                  </div>
                </div>
                <ChevronRight size={16} className="text-text-muted group-hover:text-primary transition-colors flex-shrink-0 mt-1" />
              </div>
            </button>
          );
        })}
      </div>

      {/* Contact direct */}
      <div className="bg-gradient-to-r from-primary/08 to-[#FFD000]/08 rounded-2xl border border-primary/15 p-5 flex items-center justify-between gap-4 flex-wrap">
        <div>
          <p className="font-semibold text-text-main text-sm">{lang.support.urgentContact}</p>
          <p className="text-xs text-text-muted mt-0.5">{lang.support.urgentSub}</p>
        </div>
        <a href="mailto:support@ibigsoft.com" className="flex items-center gap-2 bg-primary text-sidebar text-sm font-semibold px-4 py-2.5 rounded-xl hover:bg-primary/90 transition-colors flex-shrink-0">
          support@ibigsoft.com
        </a>
      </div>
    </div>
  );
}
