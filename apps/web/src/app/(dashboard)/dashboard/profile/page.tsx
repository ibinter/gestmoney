'use client';
import React, { useState } from 'react';
import { Edit3, X, Calendar, Phone, Mail, Clock, Activity } from 'lucide-react';
import { clsx } from 'clsx';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardTitle } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { formatDate, formatDateTime, formatRelativeTime } from '@/lib/formatters';
import { useAuthStore } from '@/store/authStore';

const ROLE_LABELS: Record<string, string> = {
  super_admin: 'Super Administrateur',
  SUPER_ADMIN: 'Super Administrateur',
  admin: 'Administrateur',
  ADMIN: 'Administrateur',
  superviseur: 'Superviseur',
  SUPERVISEUR: 'Superviseur',
  agent: 'Agent',
  AGENT: 'Agent',
  caissier: 'Caissier',
  CAISSIER: 'Caissier',
  VIEWER: 'Observateur',
};

const ROLE_COLORS: Record<string, 'success' | 'warning' | 'info' | 'neutral'> = {
  super_admin: 'warning', SUPER_ADMIN: 'warning',
  admin: 'info', ADMIN: 'info',
  superviseur: 'success', SUPERVISEUR: 'success',
  agent: 'neutral', AGENT: 'neutral',
  caissier: 'neutral', CAISSIER: 'neutral',
};

const HISTORIQUE_MOCK = [
  { id: '1', action: 'Connexion réussie', detail: 'Chrome — Windows — session démarrée', date: new Date(Date.now() - 30 * 60 * 1000).toISOString(), type: 'auth' },
  { id: '2', action: 'Transaction créée', detail: 'Retrait MTN MoMo — 75 000 XOF — TXN-20260710-0042', date: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), type: 'transaction' },
  { id: '3', action: 'Rapport généré', detail: 'Rapport mensuel — Juin 2026', date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), type: 'report' },
  { id: '4', action: 'Paramètres modifiés', detail: 'Mise à jour du fuseau horaire', date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), type: 'settings' },
  { id: '5', action: 'Transaction créée', detail: 'Dépôt Orange Money — 120 000 XOF — TXN-20260709-0038', date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), type: 'transaction' },
  { id: '6', action: 'Agent créé', detail: 'Nouvel agent : Diallo Ibrahim', date: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), type: 'admin' },
  { id: '7', action: 'Float rechargé', detail: 'Wave — 500 000 XOF', date: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(), type: 'float' },
  { id: '8', action: 'Déconnexion', detail: 'Session terminée manuellement', date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), type: 'auth' },
];

const TYPE_ICONS: Record<string, string> = {
  auth: '🔐', transaction: '💳', settings: '⚙️',
  report: '📊', admin: '👤', float: '💰',
};

function ModalModifier({ onClose, prenom, nom, email }: { onClose: () => void; prenom: string; nom: string; email: string }) {
  const [form, setForm] = useState({ prenom, nom, email, telephone: '' });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} aria-hidden="true" />
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold text-text-main">Modifier le profil</h2>
          <button onClick={onClose} aria-label="Fermer" className="p-1.5 rounded-lg text-text-muted hover:text-text-main hover:bg-gray-100">
            <X size={20} />
          </button>
        </div>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input label="Prénom" value={form.prenom} onChange={(e) => setForm((f) => ({ ...f, prenom: e.target.value }))} />
            <Input label="Nom" value={form.nom} onChange={(e) => setForm((f) => ({ ...f, nom: e.target.value }))} />
          </div>
          <Input label="Email" type="email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} />
          <Input label="Téléphone" value={form.telephone} onChange={(e) => setForm((f) => ({ ...f, telephone: e.target.value }))} />
        </div>
        <div className="flex gap-3 mt-6">
          <Button variante="primary" fullWidth onClick={onClose}>Enregistrer</Button>
          <Button variante="ghost" fullWidth onClick={onClose}>Annuler</Button>
        </div>
      </div>
    </div>
  );
}

export default function ProfilePage() {
  const [modalOpen, setModalOpen] = useState(false);
  const { user } = useAuthStore();

  const prenom = user?.prenom ?? 'Utilisateur';
  const nom = user?.nom ?? '';
  const email = user?.email ?? '';
  const role = user?.role ?? 'admin';
  const createdAt = user?.createdAt ?? new Date().toISOString();
  const initiales = `${prenom[0] ?? ''}${nom[0] ?? ''}`.toUpperCase();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text-main">Mon profil</h1>
          <p className="text-sm text-text-muted mt-1">Consultez et gérez vos informations personnelles</p>
        </div>
        <Button variante="primary" icone={<Edit3 size={16} />} onClick={() => setModalOpen(true)}>
          Modifier le profil
        </Button>
      </div>

      <Card padding="none">
        <div className="h-24 rounded-t-card" style={{ background: 'linear-gradient(135deg, #1E8C32 0%, #0e1a0e 100%)' }} />
        <div className="px-6 pb-6 -mt-10">
          <div className="flex items-end justify-between flex-wrap gap-4">
            <div className="flex items-end gap-4">
              <div className="w-20 h-20 rounded-2xl bg-primary border-4 border-white flex items-center justify-center text-white text-2xl font-bold shadow-md">
                {initiales}
              </div>
              <div className="pb-1">
                <h2 className="text-xl font-bold text-text-main">{prenom} {nom}</h2>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  <Badge couleur={ROLE_COLORS[role] ?? 'neutral'}>
                    {ROLE_LABELS[role] ?? role}
                  </Badge>
                  {user?.actif && <Badge couleur="success" point>Actif</Badge>}
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-5">
            {[
              { icon: <Mail size={15} />, label: email || 'Non renseigné' },
              { icon: <Phone size={15} />, label: 'Non renseigné' },
              { icon: <Calendar size={15} />, label: `Membre depuis le ${formatDate(createdAt)}` },
            ].map(({ icon, label }, i) => (
              <div key={i} className="flex items-center gap-2 text-sm text-text-muted">
                <span className="shrink-0">{icon}</span>
                <span className="truncate">{label}</span>
              </div>
            ))}
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: 'Transactions créées', value: '1 247', icon: '💳', desc: 'Total depuis le début' },
          { label: 'Sessions', value: '98', icon: '🔐', desc: 'Connexions au total' },
          { label: 'Dernière connexion', value: formatRelativeTime(new Date(Date.now() - 30 * 60 * 1000).toISOString()), icon: '🕐', desc: formatDateTime(new Date(Date.now() - 30 * 60 * 1000).toISOString()) },
        ].map(({ label, value, icon, desc }) => (
          <Card key={label} padding="md">
            <div className="flex items-start gap-3">
              <span className="text-2xl" aria-hidden="true">{icon}</span>
              <div>
                <p className="text-sm text-text-muted">{label}</p>
                <p className="text-xl font-bold text-text-main mt-0.5">{value}</p>
                <p className="text-xs text-text-muted mt-0.5">{desc}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <Card padding="md">
        <CardHeader>
          <CardTitle>Historique des activités récentes</CardTitle>
          <div className="flex items-center gap-2 text-sm text-text-muted">
            <Activity size={14} />
            <span>8 dernières actions</span>
          </div>
        </CardHeader>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left text-text-muted font-medium pb-3 pr-4">Action</th>
                <th className="text-left text-text-muted font-medium pb-3 pr-4">Détail</th>
                <th className="text-left text-text-muted font-medium pb-3 whitespace-nowrap">
                  <Clock size={13} className="inline mr-1" />Date
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {HISTORIQUE_MOCK.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                  <td className="py-3 pr-4">
                    <span className="flex items-center gap-2">
                      <span aria-hidden="true">{TYPE_ICONS[item.type] ?? '📋'}</span>
                      <span className="font-medium text-text-main">{item.action}</span>
                    </span>
                  </td>
                  <td className="py-3 pr-4 text-text-muted max-w-xs truncate">{item.detail}</td>
                  <td className="py-3 whitespace-nowrap text-text-muted">{formatRelativeTime(item.date)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {modalOpen && (
        <ModalModifier onClose={() => setModalOpen(false)} prenom={prenom} nom={nom} email={email} />
      )}
    </div>
  );
}
