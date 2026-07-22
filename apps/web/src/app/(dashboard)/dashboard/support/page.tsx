'use client';
import React, { useState } from 'react';
import {
  TicketIcon, Plus, Clock, CheckCircle2, AlertTriangle,
  MessageSquare, Paperclip, Send, ChevronRight, X,
} from 'lucide-react';
import { clsx } from 'clsx';
import { formatRelativeTime } from '@/lib/formatters';
import { useAuthStore } from '@/store/authStore';
import { useT } from '@/lib/i18n';
import type { Translations } from '@/lib/i18n/fr';
import {
  useTickets, useTicket, useCreateTicket, useEnvoyerMessage, useSupportStats,
  type ApiTicket, type ApiMessage, type PrioriteApi, type StatutApi,
} from '@/hooks/useSupport';

// ─── Types (valeurs FR minuscules attendues par les configs UI) ─────────────
type StatutTicket = 'ouvert' | 'en_cours' | 'resolu' | 'ferme';
type PrioriteTicket = 'basse' | 'normale' | 'haute' | 'urgente';
type CategorieTicket = 'technique' | 'facturation' | 'agent' | 'transaction' | 'float' | 'autre';

interface Ticket {
  id: string;          // id réel API (pour le détail / les mutations)
  numero: string;      // référence affichée (ex. TK-2026-001)
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
  pieceJointe?: string | null;
  pieceJointeNom?: string | null;
}

// ─── Mapping enums API (MAJUSCULES) → valeurs des configs UI ─────────────────
const STATUT_MAP: Record<StatutApi, StatutTicket> = {
  NOUVEAU: 'ouvert',
  OUVERT: 'ouvert',
  EN_COURS: 'en_cours',
  ATTENTE_CLIENT: 'en_cours',
  ESCALADE: 'en_cours',
  RESOLU: 'resolu',
  FERME: 'ferme',
};

const PRIORITE_MAP: Record<PrioriteApi, PrioriteTicket> = {
  BASSE: 'basse',
  NORMALE: 'normale',
  HAUTE: 'haute',
  URGENTE: 'urgente',
};

const CATEGORIES: CategorieTicket[] = ['technique', 'transaction', 'float', 'agent', 'facturation', 'autre'];

/** Ramène une catégorie libre de l'API vers une clé connue (sinon « autre »). */
function mapCategorie(c: string | null): CategorieTicket {
  const val = (c ?? '').toLowerCase() as CategorieTicket;
  return CATEGORIES.includes(val) ? val : 'autre';
}

/** Convertit un ticket API vers la forme locale consommée par le rendu. */
function mapTicket(t: ApiTicket): Ticket {
  return {
    id: t.id,
    numero: t.numero,
    titre: t.objet,
    statut: STATUT_MAP[t.statut] ?? 'ouvert',
    priorite: PRIORITE_MAP[t.priorite] ?? 'normale',
    categorie: mapCategorie(t.categorie),
    dateCreation: t.createdAt,
    dateMaj: t.updatedAt,
    nbMessages: t.nbMessages,
    description: t.description,
  };
}

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

/** Libellé traduit d'un statut de ticket. */
const labelStatut = (t: Translations, s: StatutTicket) => t.support.status[STATUT_I18N[s]];

/** Libellé traduit d'une priorité de ticket. */
const labelPriorite = (t: Translations, p: PrioriteTicket) => t.support.priority_levels[PRIORITE_I18N[p]];

// ─── Formulaire nouveau ticket ─────────────────────────────────────────────
function NouveauTicketModal({ onFermer, onCreer }: { onFermer: () => void; onCreer: (id: string) => void }) {
  const t = useT();
  const creer = useCreateTicket();
  const [form, setForm] = useState({
    titre: '', categorie: 'technique' as CategorieTicket,
    priorite: 'normale' as PrioriteTicket, description: '',
  });
  const [erreur, setErreur] = useState('');

  const set = (k: string, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.titre.trim() || !form.description.trim()) return;
    setErreur('');
    try {
      const ticket = await creer.mutateAsync({
        objet: form.titre.trim(),
        description: form.description.trim(),
        categorie: form.categorie,
        priorite: form.priorite.toUpperCase() as PrioriteApi,
      });
      onCreer(ticket.id);
    } catch {
      setErreur('Une erreur est survenue. Réessayez.');
    }
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
          {erreur && <p className="text-xs text-red-500">{erreur}</p>}
          <div className="flex items-center justify-between pt-2">
            <button type="button" onClick={onFermer} className="text-sm text-text-muted hover:text-text-main transition-colors px-3 py-2">{t.support.cancel}</button>
            <button
              type="submit"
              disabled={creer.isPending || !form.titre.trim() || !form.description.trim()}
              className="flex items-center gap-2 bg-primary text-sidebar text-sm font-semibold px-5 py-2.5 rounded-xl hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {creer.isPending ? t.support.sending : <><Send size={14} /> {t.support.sendTicket}</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Vue ticket détaillée ──────────────────────────────────────────────────
function TicketDetail({ ticketId, onRetour }: { ticketId: string; onRetour: () => void }) {
  const t = useT();
  const { user } = useAuthStore();
  const { data, isLoading, isError } = useTicket(ticketId);
  const envoyerMessage = useEnvoyerMessage();
  const [nouveau, setNouveau] = useState('');
  const [fichierJoint, setFichierJoint] = useState<{ nom: string; dataUrl: string } | null>(null);
  const [fichierErr, setFichierErr] = useState('');
  const attachRef = React.useRef<HTMLInputElement>(null);

  const choisirFichier = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    e.target.value = '';
    if (!f) return;
    if (f.size > 3_000_000) { setFichierErr('Fichier trop volumineux (max 3 Mo).'); return; }
    setFichierErr('');
    const reader = new FileReader();
    reader.onload = () => setFichierJoint({ nom: f.name, dataUrl: String(reader.result) });
    reader.onerror = () => setFichierErr('Lecture du fichier impossible.');
    reader.readAsDataURL(f);
  };

  const envoyer = async () => {
    if ((!nouveau.trim() && !fichierJoint) || envoyerMessage.isPending) return;
    const contenu = nouveau.trim() || (fichierJoint ? `📎 ${fichierJoint.nom}` : '');
    try {
      await envoyerMessage.mutateAsync({
        id: ticketId,
        contenu,
        ...(fichierJoint
          ? { pieceJointe: fichierJoint.dataUrl, pieceJointeNom: fichierJoint.nom }
          : {}),
      });
      setNouveau('');
      setFichierJoint(null);
      setFichierErr('');
    } catch { /* l'erreur reste visible via l'état de la mutation */ }
  };

  const retour = (
    <button onClick={onRetour} className="flex items-center gap-1.5 text-sm text-text-muted hover:text-text-main transition-colors">
      ← {t.support.backToTickets}
    </button>
  );

  if (isLoading) {
    return (
      <div className="space-y-6">
        {retour}
        <div className="bg-white dark:bg-white/03 rounded-2xl border border-gray-100 dark:border-white/08 px-6 py-12 text-center">
          <p className="text-text-muted text-sm animate-pulse">{t.support.sending}…</p>
        </div>
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className="space-y-6">
        {retour}
        <div className="bg-white dark:bg-white/03 rounded-2xl border border-gray-100 dark:border-white/08 px-6 py-12 text-center">
          <AlertTriangle size={32} className="text-red-400 mx-auto mb-3 opacity-70" />
          <p className="text-text-muted text-sm">{t.support.noTickets}</p>
        </div>
      </div>
    );
  }

  const ticket = mapTicket(data);
  const statut = STATUT_CONFIG[ticket.statut];
  const messages: Message[] = data.messages
    .filter((m: ApiMessage) => !m.interne)
    .map((m: ApiMessage) => {
      const role: Message['role'] = m.auteurId && user?.id === m.auteurId ? 'user' : 'support';
      return {
        id: m.id,
        role,
        auteur: m.auteurNom ?? (role === 'user' ? t.support.you : t.support.supportBadge),
        contenu: m.contenu,
        date: m.createdAt,
        pieceJointe: m.pieceJointe ?? null,
        pieceJointeNom: m.pieceJointeNom ?? null,
      };
    });

  return (
    <div className="space-y-6">
      {retour}

      <div className="bg-white dark:bg-white/03 rounded-2xl border border-gray-100 dark:border-white/08 overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-100 dark:border-white/08">
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                <span className="font-mono text-xs text-text-muted bg-gray-100 dark:bg-white/08 px-2 py-0.5 rounded-lg">{ticket.numero}</span>
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
              <p className="text-sm text-text-muted leading-relaxed pl-8 whitespace-pre-line">{msg.contenu}</p>
              {msg.pieceJointe && (
                <div className="pl-8 mt-2">
                  {msg.pieceJointe.startsWith('data:image/') ? (
                    <a href={msg.pieceJointe} target="_blank" rel="noreferrer" download={msg.pieceJointeNom ?? 'piece-jointe'}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={msg.pieceJointe} alt={msg.pieceJointeNom ?? ''} className="max-h-40 rounded-lg border border-gray-200 dark:border-white/10" />
                    </a>
                  ) : (
                    <a href={msg.pieceJointe} download={msg.pieceJointeNom ?? 'piece-jointe'} className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline">
                      <Paperclip size={12} /> {msg.pieceJointeNom ?? 'piece-jointe'}
                    </a>
                  )}
                </div>
              )}
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
                  <button type="button" onClick={() => attachRef.current?.click()} className="flex items-center gap-1.5 text-xs text-text-muted hover:text-text-main transition-colors">
                    <Paperclip size={13} /> {fichierJoint?.nom ?? t.support.attach}
                  </button>
                  <input ref={attachRef} type="file" className="hidden" onChange={choisirFichier} />
                  <button
                    onClick={envoyer}
                    disabled={(!nouveau.trim() && !fichierJoint) || envoyerMessage.isPending}
                    className="flex items-center gap-1.5 bg-primary text-sidebar text-xs font-semibold px-3 py-1.5 rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-40"
                  >
                    <Send size={12} /> {t.support.reply}
                  </button>
                </div>
                {fichierErr && <p className="text-xs text-red-500 mt-1">{fichierErr}</p>}
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
  const [ticketActifId, setTicketActifId] = useState<string | null>(null);
  const [modal, setModal] = useState(false);
  const [filtreStatut, setFiltreStatut] = useState<StatutTicket | 'tous'>('tous');

  const { data: apiTickets, isLoading, isError } = useTickets();
  const { data: statsApi } = useSupportStats();

  const tickets: Ticket[] = (apiTickets ?? []).map(mapTicket);

  const creerTicket = (id: string) => {
    setModal(false);
    setTicketActifId(id);
  };

  const ticketsFiltres = tickets.filter((t) => filtreStatut === 'tous' || t.statut === filtreStatut);

  const stats = statsApi ?? {
    total:   tickets.length,
    ouverts: tickets.filter((t) => t.statut === 'ouvert').length,
    enCours: tickets.filter((t) => t.statut === 'en_cours').length,
    resolus: tickets.filter((t) => t.statut === 'resolu').length,
  };

  if (ticketActifId) return <TicketDetail ticketId={ticketActifId} onRetour={() => setTicketActifId(null)} />;

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
        {isLoading ? (
          <div className="bg-white dark:bg-white/03 rounded-2xl border border-gray-100 dark:border-white/08 px-6 py-12 text-center">
            <p className="text-text-muted text-sm animate-pulse">{lang.support.sending}…</p>
          </div>
        ) : isError ? (
          <div className="bg-white dark:bg-white/03 rounded-2xl border border-gray-100 dark:border-white/08 px-6 py-12 text-center">
            <AlertTriangle size={32} className="text-red-400 mx-auto mb-3 opacity-70" />
            <p className="text-text-muted text-sm">{lang.support.noTickets}</p>
          </div>
        ) : ticketsFiltres.length === 0 ? (
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
              onClick={() => setTicketActifId(t.id)}
              className="w-full bg-white dark:bg-white/03 rounded-2xl border border-gray-100 dark:border-white/08 px-5 py-4 text-left hover:border-primary/30 hover:shadow-sm transition-all group"
            >
              <div className="flex items-start gap-4">
                <div className={clsx('w-2 h-2 rounded-full mt-2 flex-shrink-0', p.point)} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="font-mono text-xs text-text-muted">{t.numero}</span>
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
