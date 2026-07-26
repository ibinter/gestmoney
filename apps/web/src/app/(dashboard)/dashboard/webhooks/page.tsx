'use client';
import React, { useState } from 'react';
import {
  Plus, Trash2, Play, History, Copy, Check,
  ExternalLink, X, ChevronRight, Loader2, Webhook,
} from 'lucide-react';
import { clsx } from 'clsx';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { formatRelativeTime } from '@/lib/formatters';

// ─── Types ───────────────────────────────────────────────────────────────────

interface WebhookEndpoint {
  id: string;
  url: string;
  actif: boolean;
  evenements: string[];
  description?: string;
  createdAt: string;
}

interface Livraison {
  id: string;
  evenement: string;
  reponseCode: number | null;
  reponseBody: string | null;
  reussi: boolean;
  tentatives: number;
  createdAt: string;
}

const TOUS_EVENEMENTS = [
  'transaction.created',
  'transaction.completed',
  'transaction.cancelled',
  'float.updated',
  'float.low',
  'agent.created',
  'licence.expiring',
  'licence.expired',
] as const;

// ─── Hooks ───────────────────────────────────────────────────────────────────

function useWebhooks() {
  return useQuery<WebhookEndpoint[]>({
    queryKey: ['webhooks'],
    queryFn: () => api.get('/webhooks').then((r) => r.data),
  });
}

function useLivraisons(webhookId: string | null) {
  return useQuery<Livraison[]>({
    queryKey: ['webhooks', webhookId, 'livraisons'],
    queryFn: () => api.get(`/webhooks/${webhookId}/livraisons`).then((r) => r.data),
    enabled: !!webhookId,
  });
}

// ─── CopyButton ──────────────────────────────────────────────────────────────

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  const copier = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button
      type="button"
      onClick={copier}
      className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded border border-current opacity-70 hover:opacity-100 transition-opacity"
    >
      {copied ? <Check size={12} /> : <Copy size={12} />}
      {copied ? 'Copié' : 'Copier'}
    </button>
  );
}

// ─── Modal Créer ─────────────────────────────────────────────────────────────

function ModalCreer({ onClose, onCreated }: { onClose: () => void; onCreated: (secret: string) => void }) {
  const qc = useQueryClient();
  const [url, setUrl] = useState('');
  const [description, setDescription] = useState('');
  const [evenements, setEvenements] = useState<string[]>([]);

  const mutation = useMutation({
    mutationFn: (data: { url: string; evenements: string[]; description?: string }) =>
      api.post('/webhooks', data).then((r) => r.data),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['webhooks'] });
      onCreated(data.secretPlaintext ?? '');
    },
  });

  const toggle = (ev: string) =>
    setEvenements((prev) => prev.includes(ev) ? prev.filter((e) => e !== ev) : [...prev, ev]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
      <div className="bg-[color:var(--gm-surface)] rounded-2xl w-full max-w-lg shadow-2xl border border-white/10">
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
          <h2 className="text-base font-semibold">Ajouter un webhook</h2>
          <button type="button" onClick={onClose} className="text-white/50 hover:text-white">
            <X size={18} />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1.5">URL de destination *</label>
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://mon-erp.exemple.com/webhook"
              className="gm-input w-full"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1.5">Description</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Webhook vers ERP principal"
              className="gm-input w-full"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Événements *</label>
            <div className="grid grid-cols-2 gap-2">
              {TOUS_EVENEMENTS.map((ev) => (
                <label key={ev} className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={evenements.includes(ev)}
                    onChange={() => toggle(ev)}
                    className="accent-[color:var(--gm-primary)]"
                  />
                  <span className="text-xs font-mono text-white/80">{ev}</span>
                </label>
              ))}
            </div>
          </div>

          {mutation.error && (
            <p className="text-sm text-red-400">{(mutation.error as any)?.message ?? 'Erreur'}</p>
          )}
        </div>

        <div className="flex justify-end gap-3 px-6 pb-5">
          <button type="button" onClick={onClose} className="gm-btn gm-btn-ghost text-sm">
            Annuler
          </button>
          <button
            type="button"
            disabled={!url || evenements.length === 0 || mutation.isPending}
            onClick={() => mutation.mutate({ url, evenements, description: description || undefined })}
            className="gm-btn gm-btn-primary text-sm"
          >
            {mutation.isPending ? <Loader2 size={14} className="animate-spin" /> : 'Créer'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Modal Secret ─────────────────────────────────────────────────────────────

function ModalSecret({ secret, onClose }: { secret: string; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4">
      <div className="bg-[color:var(--gm-surface)] rounded-2xl w-full max-w-md shadow-2xl border border-[color:var(--gm-primary)]/40">
        <div className="p-6 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-green-500/20 flex items-center justify-center text-green-400">
              <Check size={20} />
            </div>
            <div>
              <h2 className="text-base font-semibold">Webhook créé</h2>
              <p className="text-xs text-white/50">Copiez le secret — il ne sera plus affiché</p>
            </div>
          </div>

          <div className="bg-black/30 rounded-xl p-4 border border-white/10 space-y-2">
            <p className="text-xs text-white/50 font-medium uppercase tracking-wider">Secret HMAC-SHA256</p>
            <p className="font-mono text-xs break-all text-[color:var(--gm-primary)]">{secret}</p>
          </div>

          <p className="text-xs text-white/50">
            Utilisez ce secret pour vérifier la signature <code className="text-white/70">X-Gestmoney-Signature</code> sur chaque requête entrante.
          </p>

          <div className="flex items-center justify-between pt-1">
            <CopyButton text={secret} />
            <button type="button" onClick={onClose} className="gm-btn gm-btn-primary text-sm">
              J&apos;ai copié le secret
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Drawer Livraisons ────────────────────────────────────────────────────────

function DrawerLivraisons({
  webhook,
  onClose,
}: {
  webhook: WebhookEndpoint;
  onClose: () => void;
}) {
  const { data: livraisons = [], isLoading } = useLivraisons(webhook.id);
  const qc = useQueryClient();

  const retry = useMutation({
    mutationFn: (livraisonId: string) =>
      api.post(`/webhooks/livraisons/${livraisonId}/retenter`).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['webhooks', webhook.id, 'livraisons'] }),
  });

  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="flex-1 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="w-full max-w-lg bg-[color:var(--gm-surface)] border-l border-white/10 flex flex-col h-full overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10 flex-shrink-0">
          <div>
            <h2 className="text-sm font-semibold">Historique livraisons</h2>
            <p className="text-xs text-white/50 truncate max-w-[280px]">{webhook.url}</p>
          </div>
          <button type="button" onClick={onClose} className="text-white/50 hover:text-white">
            <X size={18} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto divide-y divide-white/5">
          {isLoading && (
            <div className="flex justify-center py-10">
              <Loader2 size={20} className="animate-spin text-white/40" />
            </div>
          )}
          {!isLoading && livraisons.length === 0 && (
            <div className="py-12 text-center text-sm text-white/40">Aucune livraison</div>
          )}
          {livraisons.map((l) => (
            <div key={l.id} className="px-5 py-3.5 space-y-1.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span
                    className={clsx(
                      'w-2 h-2 rounded-full flex-shrink-0',
                      l.reussi ? 'bg-green-400' : 'bg-red-400'
                    )}
                  />
                  <span className="text-xs font-mono text-white/80">{l.evenement}</span>
                  {l.reponseCode && (
                    <span className={clsx('text-xs font-bold', l.reussi ? 'text-green-400' : 'text-red-400')}>
                      {l.reponseCode}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-white/40">{formatRelativeTime(l.createdAt)}</span>
                  {!l.reussi && (
                    <button
                      type="button"
                      onClick={() => retry.mutate(l.id)}
                      disabled={retry.isPending}
                      className="text-xs text-[color:var(--gm-primary)] hover:underline disabled:opacity-50"
                    >
                      Retenter
                    </button>
                  )}
                </div>
              </div>
              {l.reponseBody && (
                <p className="text-xs text-white/40 font-mono truncate pl-4">{l.reponseBody}</p>
              )}
              <p className="text-xs text-white/30 pl-4">{l.tentatives} tentative{l.tentatives > 1 ? 's' : ''}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Page principale ──────────────────────────────────────────────────────────

export default function WebhooksPage() {
  const { data: webhooks = [], isLoading } = useWebhooks();
  const qc = useQueryClient();

  const [modalCreer, setModalCreer] = useState(false);
  const [secretAfficher, setSecretAfficher] = useState<string | null>(null);
  const [webhookHistorique, setWebhookHistorique] = useState<WebhookEndpoint | null>(null);
  const [testResults, setTestResults] = useState<Record<string, { reussi: boolean; code: number | null; body: string }>>({});

  const deleteWebhook = useMutation({
    mutationFn: (id: string) => api.delete(`/webhooks/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['webhooks'] }),
  });

  const testWebhook = useMutation({
    mutationFn: (id: string) => api.post(`/webhooks/${id}/test`).then((r) => r.data),
    onSuccess: (data, id) => {
      setTestResults((prev) => ({
        ...prev,
        [id]: { reussi: data.reussi, code: data.reponseCode, body: data.reponseBody ?? '' },
      }));
    },
  });

  return (
    <div className="flex flex-col gap-6 p-4 md:p-6 max-w-4xl mx-auto">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold flex items-center gap-2">
            <Webhook size={22} className="text-[color:var(--gm-primary)]" />
            Webhooks
          </h1>
          <p className="text-sm text-white/50 mt-0.5">
            Intégrez GESTMONEY à vos systèmes externes (ERP, CRM, apps maison)
          </p>
        </div>
        <button
          type="button"
          onClick={() => setModalCreer(true)}
          className="gm-btn gm-btn-primary text-sm flex items-center gap-1.5"
        >
          <Plus size={15} />
          Ajouter
        </button>
      </div>

      {/* Événements supportés */}
      <div className="gm-card p-4">
        <p className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-3">
          Événements supportés
        </p>
        <div className="flex flex-wrap gap-2">
          {TOUS_EVENEMENTS.map((ev) => (
            <span key={ev} className="text-xs font-mono px-2 py-1 rounded-lg bg-[color:var(--gm-primary)]/10 text-[color:var(--gm-primary)] border border-[color:var(--gm-primary)]/20">
              {ev}
            </span>
          ))}
        </div>
      </div>

      {/* Liste */}
      {isLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 size={24} className="animate-spin text-white/40" />
        </div>
      ) : webhooks.length === 0 ? (
        <div className="gm-card p-12 text-center">
          <Webhook size={36} className="text-white/20 mx-auto mb-3" />
          <p className="text-sm text-white/50">Aucun webhook configuré</p>
          <button
            type="button"
            onClick={() => setModalCreer(true)}
            className="mt-4 gm-btn gm-btn-primary text-sm inline-flex items-center gap-1.5"
          >
            <Plus size={14} /> Créer le premier webhook
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {webhooks.map((wh) => {
            const testResult = testResults[wh.id];
            return (
              <div key={wh.id} className="gm-card p-4 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 min-w-0">
                    <div
                      className={clsx(
                        'mt-0.5 w-2.5 h-2.5 rounded-full flex-shrink-0',
                        wh.actif ? 'bg-green-400' : 'bg-white/20'
                      )}
                      title={wh.actif ? 'Actif' : 'Inactif'}
                    />
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p className="text-sm font-mono text-white/90 truncate">{wh.url}</p>
                        <a
                          href={wh.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-white/30 hover:text-white/70 flex-shrink-0"
                        >
                          <ExternalLink size={12} />
                        </a>
                      </div>
                      {wh.description && (
                        <p className="text-xs text-white/50 mt-0.5">{wh.description}</p>
                      )}
                      <p className="text-xs text-white/30 mt-0.5">
                        Créé {formatRelativeTime(wh.createdAt)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <button
                      type="button"
                      onClick={() => testWebhook.mutate(wh.id)}
                      disabled={testWebhook.isPending && testWebhook.variables === wh.id}
                      title="Tester (ping)"
                      className="p-1.5 rounded-lg hover:bg-white/10 text-white/50 hover:text-white transition-colors"
                    >
                      {testWebhook.isPending && testWebhook.variables === wh.id
                        ? <Loader2 size={14} className="animate-spin" />
                        : <Play size={14} />
                      }
                    </button>
                    <button
                      type="button"
                      onClick={() => setWebhookHistorique(wh)}
                      title="Historique"
                      className="p-1.5 rounded-lg hover:bg-white/10 text-white/50 hover:text-white transition-colors"
                    >
                      <History size={14} />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (confirm('Supprimer ce webhook ?')) deleteWebhook.mutate(wh.id);
                      }}
                      title="Supprimer"
                      className="p-1.5 rounded-lg hover:bg-red-500/20 text-white/50 hover:text-red-400 transition-colors"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                {/* Événements abonnés */}
                <div className="flex flex-wrap gap-1.5 pl-5">
                  {wh.evenements.map((ev) => (
                    <span
                      key={ev}
                      className="text-[11px] font-mono px-1.5 py-0.5 rounded bg-white/5 text-white/50 border border-white/10"
                    >
                      {ev}
                    </span>
                  ))}
                </div>

                {/* Résultat test */}
                {testResult && (
                  <div
                    className={clsx(
                      'flex items-center gap-2 text-xs px-3 py-2 rounded-lg border pl-5',
                      testResult.reussi
                        ? 'bg-green-500/10 border-green-500/20 text-green-400'
                        : 'bg-red-500/10 border-red-500/20 text-red-400'
                    )}
                  >
                    {testResult.reussi ? <Check size={12} /> : <X size={12} />}
                    {testResult.reussi ? 'Ping réussi' : 'Ping échoué'}
                    {testResult.code && <span className="font-bold ml-1">HTTP {testResult.code}</span>}
                    {testResult.body && (
                      <span className="font-mono text-[10px] truncate max-w-[300px] opacity-70">
                        {testResult.body}
                      </span>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Section doc signature */}
      <div className="gm-card p-5 space-y-3">
        <h3 className="text-sm font-semibold flex items-center gap-2">
          <ChevronRight size={14} className="text-[color:var(--gm-primary)]" />
          Vérifier la signature HMAC
        </h3>
        <p className="text-xs text-white/50">
          Chaque requête POST inclut l&apos;en-tête{' '}
          <code className="text-white/80 bg-white/10 px-1 rounded">X-Gestmoney-Signature: sha256=&lt;hex&gt;</code>.
          Calculez vous-même le HMAC-SHA256 du corps brut avec votre secret et comparez.
        </p>
        <pre className="text-xs bg-black/30 rounded-xl p-3 overflow-x-auto text-white/70 border border-white/10">{`// Node.js
const crypto = require('crypto');
const sig = crypto.createHmac('sha256', SECRET)
  .update(rawBody).digest('hex');
if (sig !== receivedSig) throw new Error('Signature invalide');`}</pre>
      </div>

      {/* Modals & Drawer */}
      {modalCreer && (
        <ModalCreer
          onClose={() => setModalCreer(false)}
          onCreated={(secret) => {
            setModalCreer(false);
            setSecretAfficher(secret);
          }}
        />
      )}

      {secretAfficher && (
        <ModalSecret secret={secretAfficher} onClose={() => setSecretAfficher(null)} />
      )}

      {webhookHistorique && (
        <DrawerLivraisons
          webhook={webhookHistorique}
          onClose={() => setWebhookHistorique(null)}
        />
      )}
    </div>
  );
}
