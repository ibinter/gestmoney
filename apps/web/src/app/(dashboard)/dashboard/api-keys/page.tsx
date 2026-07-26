'use client';
import React, { useState } from 'react';
import {
  Key,
  Plus,
  Trash2,
  Copy,
  Check,
  X,
  AlertTriangle,
  ShieldCheck,
  Clock,
  Activity,
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { clsx } from 'clsx';

// ─── Types ────────────────────────────────────────────────────────────────────

interface ApiKey {
  id: string;
  nom: string;
  prefix: string;
  permissions: string[];
  actif: boolean;
  expiresAt: string | null;
  lastUsedAt: string | null;
  nbAppels: number;
  ipWhitelist: string[];
  createdAt: string;
  revokedAt: string | null;
}

// ─── Permissions disponibles ──────────────────────────────────────────────────

const PERMISSIONS_DISPONIBLES = [
  { value: 'transactions:read',  label: 'Lire les transactions' },
  { value: 'transactions:write', label: 'Créer des transactions' },
  { value: 'agents:read',        label: 'Lire les agents' },
  { value: 'float:read',         label: 'Lire les floats' },
  { value: 'customers:read',     label: 'Lire les clients' },
  { value: 'reporting:read',     label: 'Accéder aux rapports' },
];

// ─── Hooks ────────────────────────────────────────────────────────────────────

function useApiKeys() {
  return useQuery<ApiKey[]>({
    queryKey: ['api-keys'],
    queryFn: () => api.get('/api-keys').then((r) => r.data),
  });
}

function useCreateApiKey() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: {
      nom: string;
      permissions: string[];
      expiresAt?: string;
      ipWhitelist?: string[];
    }) => api.post('/api-keys', data).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['api-keys'] }),
  });
}

function useRevokeApiKey() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => api.delete(`/api-keys/${id}`).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['api-keys'] }),
  });
}

// ─── Composants utilitaires ───────────────────────────────────────────────────

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => {
        void navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }}
      className="inline-flex items-center gap-1 px-2 py-1 text-xs rounded bg-white/10 hover:bg-white/20 transition-colors"
      title="Copier"
    >
      {copied ? <Check size={12} className="text-green-400" /> : <Copy size={12} />}
      {copied ? 'Copié !' : 'Copier'}
    </button>
  );
}

function Badge({ actif }: { actif: boolean }) {
  return (
    <span
      className={clsx(
        'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium',
        actif
          ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
          : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
      )}
    >
      {actif ? 'Active' : 'Révoquée'}
    </span>
  );
}

function formatDate(d: string | null) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
}

// ─── Modal Créer ──────────────────────────────────────────────────────────────

function ModalCreer({ onClose }: { onClose: () => void }) {
  const [nom, setNom] = useState('');
  const [permissions, setPermissions] = useState<string[]>([]);
  const [expiresAt, setExpiresAt] = useState('');
  const [ipWhitelist, setIpWhitelist] = useState('');
  const [generatedKey, setGeneratedKey] = useState<string | null>(null);
  const create = useCreateApiKey();

  const togglePerm = (p: string) =>
    setPermissions((prev) =>
      prev.includes(p) ? prev.filter((x) => x !== p) : [...prev, p],
    );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    create.mutate(
      {
        nom,
        permissions,
        expiresAt: expiresAt || undefined,
        ipWhitelist: ipWhitelist
          ? ipWhitelist.split(',').map((ip) => ip.trim()).filter(Boolean)
          : undefined,
      },
      {
        onSuccess: (data: { key: string }) => {
          setGeneratedKey(data.key);
        },
      },
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg bg-white dark:bg-gray-800 rounded-2xl shadow-2xl">
        {/* En-tête */}
        <div className="flex items-center justify-between p-5 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-2 font-semibold text-gray-900 dark:text-white">
            <Key size={18} className="text-indigo-500" />
            Nouvelle clé API
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
            <X size={18} />
          </button>
        </div>

        {/* Clé générée — affiché une seule fois */}
        {generatedKey ? (
          <div className="p-5 space-y-4">
            <div className="rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-300 dark:border-amber-700 p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle size={20} className="text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-amber-800 dark:text-amber-300">
                    Copiez votre clé maintenant !
                  </p>
                  <p className="text-sm text-amber-700 dark:text-amber-400 mt-1">
                    Cette clé ne sera plus jamais affichée. Si vous la perdez, vous devrez en générer une nouvelle.
                  </p>
                </div>
              </div>
            </div>

            <div className="relative rounded-lg bg-gray-900 p-4 font-mono text-sm text-gray-100 break-all">
              {generatedKey}
              <div className="mt-3">
                <CopyButton text={generatedKey} />
              </div>
            </div>

            <button
              onClick={onClose}
              className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-medium transition-colors"
            >
              J'ai copié ma clé, fermer
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-5 space-y-4">
            {/* Nom */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Nom de l'intégration *
              </label>
              <input
                required
                value={nom}
                onChange={(e) => setNom(e.target.value)}
                placeholder="Ex: Intégration ERP SAP"
                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
              />
            </div>

            {/* Permissions */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Permissions *
              </label>
              <div className="grid grid-cols-2 gap-2">
                {PERMISSIONS_DISPONIBLES.map((p) => (
                  <label
                    key={p.value}
                    className={clsx(
                      'flex items-center gap-2 p-2.5 rounded-lg border cursor-pointer text-sm transition-colors',
                      permissions.includes(p.value)
                        ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300'
                        : 'border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:border-gray-300',
                    )}
                  >
                    <input
                      type="checkbox"
                      className="sr-only"
                      checked={permissions.includes(p.value)}
                      onChange={() => togglePerm(p.value)}
                    />
                    <ShieldCheck size={14} className={permissions.includes(p.value) ? 'text-indigo-500' : 'text-gray-400'} />
                    {p.label}
                  </label>
                ))}
              </div>
            </div>

            {/* Expiration */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Date d'expiration (optionnel)
              </label>
              <input
                type="date"
                value={expiresAt}
                onChange={(e) => setExpiresAt(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
              />
            </div>

            {/* Whitelist IP */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                IP autorisées (optionnel, séparées par virgule)
              </label>
              <input
                value={ipWhitelist}
                onChange={(e) => setIpWhitelist(e.target.value)}
                placeholder="Ex: 192.168.1.1, 10.0.0.0/24"
                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Laisser vide pour autoriser toutes les IPs
              </p>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm font-medium"
              >
                Annuler
              </button>
              <button
                type="submit"
                disabled={create.isPending || permissions.length === 0}
                className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-medium transition-colors text-sm"
              >
                {create.isPending ? 'Génération...' : 'Générer la clé'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

// ─── Page principale ──────────────────────────────────────────────────────────

export default function ApiKeysPage() {
  const { user } = useAuthStore();
  const { data: keys = [], isLoading } = useApiKeys();
  const revoke = useRevokeApiKey();
  const [showModal, setShowModal] = useState(false);
  const [confirmRevoke, setConfirmRevoke] = useState<string | null>(null);

  const isAdmin =
    user?.roles?.some((r: string) =>
      ['SUPER_ADMIN', 'NETWORK_ADMIN'].includes(r),
    ) ?? false;

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-6">
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Key size={24} className="text-indigo-500" />
            Clés API
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Permettez à vos partenaires d'intégrer GESTMONEY via API (ERP, TPE, apps maison…)
          </p>
        </div>
        {isAdmin && (
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-medium transition-colors text-sm"
          >
            <Plus size={16} />
            Nouvelle clé
          </button>
        )}
      </div>

      {/* Liste */}
      {isLoading ? (
        <div className="text-center py-16 text-gray-400">Chargement…</div>
      ) : keys.length === 0 ? (
        <div className="text-center py-16 rounded-2xl border-2 border-dashed border-gray-200 dark:border-gray-700">
          <Key size={40} className="mx-auto text-gray-300 dark:text-gray-600 mb-3" />
          <p className="text-gray-500 dark:text-gray-400 font-medium">Aucune clé API</p>
          <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
            Créez votre première clé pour commencer les intégrations.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {keys.map((k) => (
            <div
              key={k.id}
              className={clsx(
                'rounded-2xl border p-5 bg-white dark:bg-gray-800 transition-opacity',
                !k.actif && 'opacity-60',
              )}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-gray-900 dark:text-white">{k.nom}</span>
                    <Badge actif={k.actif} />
                  </div>

                  <div className="mt-2 font-mono text-sm text-gray-500 dark:text-gray-400">
                    {k.prefix}••••••••••••••••
                  </div>

                  <div className="mt-3 flex flex-wrap gap-1">
                    {k.permissions.map((p) => (
                      <span
                        key={p}
                        className="px-2 py-0.5 rounded-full text-xs bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800"
                      >
                        {p}
                      </span>
                    ))}
                  </div>

                  <div className="mt-3 flex flex-wrap gap-4 text-xs text-gray-500 dark:text-gray-400">
                    <span className="flex items-center gap-1">
                      <Clock size={12} />
                      Créée le {formatDate(k.createdAt)}
                    </span>
                    {k.expiresAt && (
                      <span className="flex items-center gap-1">
                        <Clock size={12} />
                        Expire le {formatDate(k.expiresAt)}
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <Activity size={12} />
                      {k.nbAppels} appels
                    </span>
                    {k.lastUsedAt && (
                      <span>Dernière utilisation : {formatDate(k.lastUsedAt)}</span>
                    )}
                    {k.ipWhitelist.length > 0 && (
                      <span>IPs : {k.ipWhitelist.join(', ')}</span>
                    )}
                  </div>
                </div>

                {isAdmin && k.actif && (
                  <button
                    onClick={() => setConfirmRevoke(k.id)}
                    className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors text-sm"
                  >
                    <Trash2 size={14} />
                    Révoquer
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal créer */}
      {showModal && <ModalCreer onClose={() => setShowModal(false)} />}

      {/* Modal confirmation révocation */}
      {confirmRevoke && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-sm bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                <Trash2 size={18} className="text-red-600 dark:text-red-400" />
              </div>
              <div>
                <p className="font-semibold text-gray-900 dark:text-white">Révoquer cette clé ?</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Cette action est irréversible. Toutes les intégrations utilisant cette clé cesseront de fonctionner.
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmRevoke(null)}
                className="flex-1 py-2.5 rounded-xl border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-sm font-medium"
              >
                Annuler
              </button>
              <button
                onClick={() => {
                  revoke.mutate(confirmRevoke);
                  setConfirmRevoke(null);
                }}
                className="flex-1 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-medium transition-colors text-sm"
              >
                Révoquer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
