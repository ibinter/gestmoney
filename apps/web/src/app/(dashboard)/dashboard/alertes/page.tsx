'use client';
import React, { useState } from 'react';
import {
  Bell, BellOff, Save, CheckCheck, AlertTriangle,
  Info, ShieldAlert, Mail, ToggleLeft, ToggleRight,
  Plus, X, Clock,
} from 'lucide-react';
import { clsx } from 'clsx';
import {
  useAlertes,
  useConfigAlertes,
  updateConfigAlertes,
  marquerAlerteLue,
  marquerToutesLues,
  type ConfigAlertes,
  type AlerteEmise,
} from '@/hooks/useAlertes';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatDate(iso: string) {
  return new Intl.DateTimeFormat('fr-CI', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(new Date(iso));
}

function SeveriteBadge({ severite }: { severite: AlerteEmise['severite'] }) {
  const cfg = {
    INFO:     { cls: 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300',     icon: Info,          label: 'Info' },
    WARNING:  { cls: 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300', icon: AlertTriangle, label: 'Attention' },
    CRITICAL: { cls: 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300',         icon: ShieldAlert,   label: 'Critique' },
  }[severite];

  const Icon = cfg.icon;
  return (
    <span className={clsx('inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium', cfg.cls)}>
      <Icon size={11} />
      {cfg.label}
    </span>
  );
}

function TypeBadge({ type }: { type: AlerteEmise['type'] }) {
  const labels: Record<AlerteEmise['type'], string> = {
    FLOAT_BAS:              'Float bas',
    TRANSACTION_SUSPECTE:   'Transaction suspecte',
    EXPIRATION:             'Expiration',
    AUDIT_QUOTIDIEN:        'Audit quotidien',
  };
  return (
    <span className="text-xs text-gray-500 dark:text-gray-400">{labels[type]}</span>
  );
}

// ─── Toggle UI ────────────────────────────────────────────────────────────────

function Toggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!value)}
      className="flex-shrink-0"
      aria-label={value ? 'Désactiver' : 'Activer'}
    >
      {value
        ? <ToggleRight size={28} className="text-green-500" />
        : <ToggleLeft  size={28} className="text-gray-400" />}
    </button>
  );
}

// ─── Composant principal ──────────────────────────────────────────────────────

export default function AlertesPage() {
  const { data: configData, isLoading: configLoading } = useConfigAlertes();
  const { data: alertesData, isLoading: alertesLoading } = useAlertes({ limit: 30 });

  // État local du formulaire (initialisé depuis l'API)
  const [form, setForm] = useState<Partial<ConfigAlertes>>({});
  const [emailInput, setEmailInput] = useState('');
  const [saving, setSaving] = useState(false);
  const [savedOk, setSavedOk] = useState(false);

  // Fusionner config distante dans l'état local (une seule fois à la réception)
  const config: ConfigAlertes | null = configData
    ? { ...configData, ...form }
    : null;

  function set<K extends keyof ConfigAlertes>(key: K, val: ConfigAlertes[K]) {
    setForm((prev) => ({ ...prev, [key]: val }));
  }

  function ajouterEmail() {
    const email = emailInput.trim().toLowerCase();
    if (!email || !email.includes('@')) return;
    const current = config?.emailsAlerte ?? [];
    if (current.includes(email)) return;
    set('emailsAlerte', [...current, email]);
    setEmailInput('');
  }

  function supprimerEmail(email: string) {
    set('emailsAlerte', (config?.emailsAlerte ?? []).filter((e) => e !== email));
  }

  async function handleSave() {
    if (!config) return;
    setSaving(true);
    try {
      await updateConfigAlertes(form);
      setSavedOk(true);
      setForm({});
      setTimeout(() => setSavedOk(false), 3000);
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  }

  async function handleMarquerToutesLues() {
    await marquerToutesLues();
  }

  async function handleMarquerLue(id: string) {
    await marquerAlerteLue(id);
  }

  const alertes = alertesData?.alertes ?? [];
  const nbNonLues = alertes.filter((a) => !a.lu).length;

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="max-w-4xl mx-auto space-y-8 p-4 md:p-6">

      {/* En-tête */}
      <div className="flex items-center gap-3">
        <Bell size={24} className="text-amber-500" />
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Alertes</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Configurez les seuils et consultez l'historique des alertes
          </p>
        </div>
      </div>

      {/* ── Section 1 : Configuration ─────────────────────────────────────────── */}
      <section className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm">
        <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700 flex items-center gap-2">
          <ShieldAlert size={18} className="text-indigo-500" />
          <h2 className="font-semibold text-gray-900 dark:text-white">Configuration des alertes</h2>
        </div>

        {configLoading ? (
          <div className="p-8 text-center text-gray-400">Chargement…</div>
        ) : config ? (
          <div className="p-6 space-y-6">

            {/* Float bas */}
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-amber-400 inline-block" />
                Float insuffisant
              </h3>
              <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                <label className="text-sm text-gray-600 dark:text-gray-400 w-44 flex-shrink-0">
                  Seuil de float bas
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={0}
                    value={config.seuilFloatBas}
                    onChange={(e) => set('seuilFloatBas', Number(e.target.value))}
                    className="w-36 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-1.5 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-400"
                  />
                  <span className="text-sm text-gray-500">FCFA</span>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row gap-4 pl-0 sm:pl-44">
                <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 cursor-pointer">
                  <Toggle value={config.alerteFloatEmail} onChange={(v) => set('alerteFloatEmail', v)} />
                  <Mail size={14} /> Alerte email
                </label>
                <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 cursor-pointer">
                  <Toggle value={config.alerteFloatInApp} onChange={(v) => set('alerteFloatInApp', v)} />
                  <Bell size={14} /> Alerte in-app
                </label>
              </div>
            </div>

            <hr className="border-gray-100 dark:border-gray-700" />

            {/* Transaction suspecte */}
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-red-400 inline-block" />
                Transaction suspecte
              </h3>
              <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                <label className="text-sm text-gray-600 dark:text-gray-400 w-44 flex-shrink-0">
                  Seuil montant suspect
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min={0}
                    value={config.seuilVolumeTransaction}
                    onChange={(e) => set('seuilVolumeTransaction', Number(e.target.value))}
                    className="w-36 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-1.5 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-400"
                  />
                  <span className="text-sm text-gray-500">FCFA</span>
                </div>
              </div>
              <div className="pl-0 sm:pl-44">
                <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 cursor-pointer">
                  <Toggle value={config.alerteTransactionEmail} onChange={(v) => set('alerteTransactionEmail', v)} />
                  <Mail size={14} /> Alerte email
                </label>
              </div>
            </div>

            <hr className="border-gray-100 dark:border-gray-700" />

            {/* Expiration licence */}
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-blue-400 inline-block" />
                Expiration de licence
              </h3>
              <div className="flex flex-col sm:flex-row gap-4">
                <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 cursor-pointer">
                  <Toggle value={config.alerteExpirationJ7} onChange={(v) => set('alerteExpirationJ7', v)} />
                  Alerte J-7
                </label>
                <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 cursor-pointer">
                  <Toggle value={config.alerteExpirationJ30} onChange={(v) => set('alerteExpirationJ30', v)} />
                  Alerte J-30
                </label>
              </div>
            </div>

            <hr className="border-gray-100 dark:border-gray-700" />

            {/* Résumé audit quotidien */}
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-green-400 inline-block" />
                Résumé quotidien
              </h3>
              <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 cursor-pointer">
                <Toggle value={config.alerteAudit} onChange={(v) => set('alerteAudit', v)} />
                Résumé d'audit quotidien (8h00)
              </label>
            </div>

            <hr className="border-gray-100 dark:border-gray-700" />

            {/* Emails supplémentaires */}
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 flex items-center gap-2">
                <Mail size={14} className="text-gray-400" />
                Destinataires supplémentaires
              </h3>
              <div className="flex gap-2">
                <input
                  type="email"
                  placeholder="email@exemple.com"
                  value={emailInput}
                  onChange={(e) => setEmailInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), ajouterEmail())}
                  className="flex-1 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-1.5 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-400"
                />
                <button
                  type="button"
                  onClick={ajouterEmail}
                  className="flex items-center gap-1 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 text-sm font-medium transition-colors"
                >
                  <Plus size={14} />
                  Ajouter
                </button>
              </div>
              {config.emailsAlerte.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {config.emailsAlerte.map((email) => (
                    <span
                      key={email}
                      className="inline-flex items-center gap-1 rounded-full bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 text-xs px-3 py-1"
                    >
                      {email}
                      <button
                        type="button"
                        onClick={() => supprimerEmail(email)}
                        className="ml-1 hover:text-red-500 transition-colors"
                        aria-label={`Supprimer ${email}`}
                      >
                        <X size={11} />
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Bouton sauvegarder */}
            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={handleSave}
                disabled={saving || Object.keys(form).length === 0}
                className={clsx(
                  'flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-white transition-colors',
                  saving || Object.keys(form).length === 0
                    ? 'bg-gray-300 dark:bg-gray-600 cursor-not-allowed'
                    : 'bg-indigo-600 hover:bg-indigo-700',
                )}
              >
                <Save size={15} />
                {saving ? 'Sauvegarde…' : 'Sauvegarder'}
              </button>
              {savedOk && (
                <span className="text-sm text-green-600 dark:text-green-400 flex items-center gap-1">
                  <CheckCheck size={14} /> Configuration sauvegardée
                </span>
              )}
            </div>
          </div>
        ) : (
          <div className="p-8 text-center text-gray-400">Erreur de chargement</div>
        )}
      </section>

      {/* ── Section 2 : Historique des alertes ───────────────────────────────── */}
      <section className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm">
        <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock size={18} className="text-gray-400" />
            <h2 className="font-semibold text-gray-900 dark:text-white">Historique des alertes</h2>
            {nbNonLues > 0 && (
              <span className="rounded-full bg-red-500 text-white text-xs px-2 py-0.5 font-medium">
                {nbNonLues} non lue{nbNonLues > 1 ? 's' : ''}
              </span>
            )}
          </div>
          {nbNonLues > 0 && (
            <button
              type="button"
              onClick={handleMarquerToutesLues}
              className="flex items-center gap-1.5 text-sm text-indigo-600 dark:text-indigo-400 hover:underline font-medium"
            >
              <CheckCheck size={14} />
              Tout marquer comme lu
            </button>
          )}
        </div>

        {alertesLoading ? (
          <div className="p-8 text-center text-gray-400">Chargement…</div>
        ) : alertes.length === 0 ? (
          <div className="p-12 text-center">
            <BellOff size={32} className="mx-auto mb-3 text-gray-300 dark:text-gray-600" />
            <p className="text-gray-500 dark:text-gray-400 text-sm">Aucune alerte pour le moment</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 dark:border-gray-700 text-left">
                  <th className="px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Date</th>
                  <th className="px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Sévérité</th>
                  <th className="px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Type</th>
                  <th className="px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Titre</th>
                  <th className="px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Détail</th>
                  <th className="px-4 py-3 text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">Statut</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-gray-700/50">
                {alertes.map((alerte) => (
                  <tr
                    key={alerte.id}
                    className={clsx(
                      'transition-colors',
                      alerte.lu
                        ? 'bg-white dark:bg-gray-800'
                        : 'bg-amber-50/50 dark:bg-amber-900/10',
                    )}
                  >
                    <td className="px-4 py-3 text-gray-500 dark:text-gray-400 whitespace-nowrap">
                      {formatDate(alerte.createdAt)}
                    </td>
                    <td className="px-4 py-3">
                      <SeveriteBadge severite={alerte.severite} />
                    </td>
                    <td className="px-4 py-3">
                      <TypeBadge type={alerte.type} />
                    </td>
                    <td className="px-4 py-3 font-medium text-gray-800 dark:text-gray-200 max-w-[180px] truncate">
                      {alerte.titre}
                    </td>
                    <td className="px-4 py-3 text-gray-500 dark:text-gray-400 max-w-[240px] truncate" title={alerte.detail}>
                      {alerte.detail}
                    </td>
                    <td className="px-4 py-3">
                      {alerte.lu ? (
                        <span className="text-xs text-gray-400 dark:text-gray-500 flex items-center gap-1">
                          <CheckCheck size={12} /> Lu
                        </span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleMarquerLue(alerte.id)}
                          className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
                        >
                          <Bell size={12} /> Non lu
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
