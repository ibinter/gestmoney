'use client';
import React, { useState, useEffect } from 'react';
import { Plus, Search, Download, UserCheck } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { StatCard } from '@/components/ui/StatCard';
import { Table, Colonne } from '@/components/ui/Table';
import { Input, Select } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { Agent } from '@/types';
import { formatMontant, formatDate } from '@/lib/formatters';
import { exporterCsv } from '@/lib/exportCsv';
import { useAgents, useCreateAgent, useToggleAgentStatus } from '@/hooks/useAgents';
import { useAgences } from '@/hooks/useAgences';

const FORM_INIT = { prenom: '', nom: '', email: '', telephone: '', agenceId: '', password: '' };

export default function AgentsPage() {
  const [search, setSearch] = useState('');
  const [filtreAgence, setFiltreAgence] = useState('');
  const [filtreStatut, setFiltreStatut] = useState('');
  const [page, setPage] = useState(1);
  const LIMIT = 15;
  const [modalNouvelAgent, setModalNouvelAgent] = useState(false);
  const [form, setForm] = useState(FORM_INIT);
  const [erreur, setErreur] = useState('');
  const [succes, setSucces] = useState('');

  const { data: allAgents = [], isLoading } = useAgents();
  const { data: allAgences = [] } = useAgences();
  const creerAgent = useCreateAgent();
  const toggleStatut = useToggleAgentStatus();

  const agents = allAgents.filter((a) => {
    const matchSearch =
      !search ||
      `${a.prenom} ${a.nom}`.toLowerCase().includes(search.toLowerCase()) ||
      a.email.toLowerCase().includes(search.toLowerCase()) ||
      a.telephone.includes(search);
    const matchAgence = !filtreAgence || a.agenceId === filtreAgence;
    const matchStatut =
      !filtreStatut ||
      (filtreStatut === 'actif' && a.actif) ||
      (filtreStatut === 'inactif' && !a.actif) ||
      (filtreStatut === 'en_ligne' && a.enLigne);
    return matchSearch && matchAgence && matchStatut;
  });

  const totalPages = Math.ceil(agents.length / LIMIT);
  const agentsPage = agents.slice((page - 1) * LIMIT, page * LIMIT);

  useEffect(() => setPage(1), [search, filtreAgence, filtreStatut]);

  const nbActifs = allAgents.filter((a) => a.actif).length;
  const nbEnLigne = allAgents.filter((a) => a.enLigne).length;
  const totalCommissions = allAgents.reduce((s, a) => s + a.commission, 0);
  const totalTransactions = allAgents.reduce((s, a) => s + a.nbTransactionsAujourdhui, 0);

  const optionsAgences = allAgences.map((a) => ({ value: a.id, label: a.nom }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErreur('');
    if (!form.prenom || !form.nom || !form.email || !form.telephone) {
      setErreur('Veuillez remplir tous les champs obligatoires.');
      return;
    }
    try {
      await creerAgent.mutateAsync({
        prenom: form.prenom,
        nom: form.nom,
        email: form.email,
        telephone: form.telephone,
        agenceId: form.agenceId,
        password: form.password,
      });
      setSucces(`Agent ${form.prenom} ${form.nom} créé avec succès.`);
      setForm(FORM_INIT);
      setTimeout(() => { setModalNouvelAgent(false); setSucces(''); }, 1500);
    } catch {
      setErreur('Erreur lors de la création. Réessayez.');
    }
  };

  const handleToggle = async (agent: Agent) => {
    await toggleStatut.mutateAsync({ id: agent.id, actif: !agent.actif });
  };

  const colonnes: Colonne<Agent>[] = [
    {
      key: 'nom',
      titre: 'Agent',
      triable: true,
      rendu: (_, ligne) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-bold">
            {ligne.prenom[0]}{ligne.nom[0]}
          </div>
          <div>
            <p className="font-medium text-text-main text-sm">{ligne.prenom} {ligne.nom}</p>
            <p className="text-xs text-gray-400">{ligne.email}</p>
          </div>
        </div>
      ),
    },
    { key: 'telephone', titre: 'Telephone', rendu: (v) => <span className="text-sm font-mono">{String(v)}</span> },
    { key: 'agenceNom', titre: 'Agence', triable: true },
    {
      key: 'nbTransactionsAujourdhui',
      titre: 'Transactions auj.',
      align: 'right',
      triable: true,
      rendu: (v) => <span className="font-semibold text-sm">{Number(v)}</span>,
    },
    {
      key: 'montantTransactionsAujourdhui',
      titre: 'Volume auj.',
      align: 'right',
      triable: true,
      rendu: (v) => <span className="text-sm">{formatMontant(Number(v))}</span>,
    },
    {
      key: 'commission',
      titre: 'Commission',
      align: 'right',
      rendu: (v) => <span className="font-semibold text-success">{formatMontant(Number(v))}</span>,
    },
    {
      key: 'enLigne',
      titre: 'En ligne',
      rendu: (v) => (
        <Badge couleur={v ? 'success' : 'neutral'} point>
          {v ? 'En ligne' : 'Hors ligne'}
        </Badge>
      ),
    },
    {
      key: 'actif',
      titre: 'Statut',
      rendu: (v) => <Badge couleur={v ? 'success' : 'danger'}>{v ? 'Actif' : 'Inactif'}</Badge>,
    },
    {
      key: 'createdAt',
      titre: 'Inscription',
      rendu: (v) => <span className="text-xs text-gray-400">{formatDate(String(v))}</span>,
    },
    {
      key: 'id',
      titre: 'Actions',
      rendu: (_, ligne) => (
        <div className="flex gap-1">
          <button className="text-xs text-primary hover:underline font-medium">Voir</button>
          <button
            className={`text-xs font-medium ml-1 hover:underline ${ligne.actif ? 'text-danger' : 'text-success'}`}
            onClick={() => handleToggle(ligne)}
            disabled={toggleStatut.isPending}
          >
            {ligne.actif ? 'Suspendre' : 'Activer'}
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text-main">Agents</h1>
          <p className="text-sm text-gray-500">Gestion des agents Mobile Money</p>
        </div>
        <div className="flex gap-2">
          <Button
            variante="ghost"
            taille="sm"
            icone={<Download size={15} />}
            onClick={() => exporterCsv(agents, [
              { titre: 'Prénom', valeur: (a) => a.prenom },
              { titre: 'Nom', valeur: (a) => a.nom },
              { titre: 'Email', valeur: (a) => a.email },
              { titre: 'Téléphone', valeur: (a) => a.telephone },
              { titre: 'Agence', valeur: (a) => a.agenceNom },
              { titre: 'Statut', valeur: (a) => a.actif ? 'Actif' : 'Inactif' },
              { titre: 'En ligne', valeur: (a) => a.enLigne ? 'Oui' : 'Non' },
              { titre: 'Tx aujourd\'hui', valeur: (a) => a.nbTransactionsAujourdhui },
              { titre: 'Volume today (FCFA)', valeur: (a) => a.montantTransactionsAujourdhui },
              { titre: 'Commission (FCFA)', valeur: (a) => a.commission },
              { titre: 'Date création', valeur: (a) => formatDate(a.createdAt) },
            ], 'agents')}
          >
            Exporter
          </Button>
          <Button variante="primary" taille="sm" icone={<Plus size={15} />} onClick={() => setModalNouvelAgent(true)}>
            Nouvel agent
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard titre="Agents actifs" valeur={`${nbActifs} / ${allAgents.length}`} icone={<UserCheck size={18} />} couleur="success" />
        <StatCard titre="En ligne maintenant" valeur={nbEnLigne.toString()} sousTexte={`sur ${nbActifs} actifs`} icone="🟢" couleur="primary" />
        <StatCard titre="Transactions auj." valeur={totalTransactions.toString()} icone="💳" couleur="default" />
        <StatCard titre="Commissions dues" valeur={formatMontant(totalCommissions)} icone="💰" couleur="warning" />
      </div>

      <Card padding="none">
        <div className="p-4 border-b border-gray-100">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1">
              <Input
                placeholder="Rechercher un agent (nom, email, telephone...)"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                icone={<Search size={16} />}
              />
            </div>
            <Select
              placeholder="Toutes agences"
              value={filtreAgence}
              onChange={(e) => setFiltreAgence(e.target.value)}
              options={optionsAgences}
            />
            <Select
              placeholder="Tous statuts"
              value={filtreStatut}
              onChange={(e) => setFiltreStatut(e.target.value)}
              options={[
                { value: 'actif', label: 'Actifs' },
                { value: 'inactif', label: 'Inactifs' },
                { value: 'en_ligne', label: 'En ligne' },
              ]}
            />
            {(search || filtreAgence || filtreStatut) && (
              <Button variante="ghost" taille="md" onClick={() => { setSearch(''); setFiltreAgence(''); setFiltreStatut(''); }}>
                Effacer
              </Button>
            )}
          </div>
          <p className="text-xs text-gray-400 mt-2">
            {isLoading ? 'Chargement...' : `${agents.length} agent(s) trouve(s)`}
          </p>
        </div>
        <Table colonnes={colonnes} donnees={agentsPage} messageVide="Aucun agent trouve" />
        <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
          <p className="text-xs text-gray-500">{agents.length} agent(s) — Page {page} / {totalPages || 1}</p>
          <div className="flex gap-1">
            <button className="px-3 py-1.5 text-xs rounded-lg border border-gray-200 text-gray-600 hover:bg-surface disabled:opacity-40" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>Précédent</button>
            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => i + 1).map(p => (
              <button key={p} onClick={() => setPage(p)} className={`px-3 py-1.5 text-xs rounded-lg font-medium ${p === page ? 'bg-primary text-sidebar' : 'border border-gray-200 text-gray-600 hover:bg-surface'}`}>{p}</button>
            ))}
            <button className="px-3 py-1.5 text-xs rounded-lg border border-gray-200 text-gray-600 hover:bg-surface disabled:opacity-40" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>Suivant</button>
          </div>
        </div>
      </Card>

      <Modal ouvert={modalNouvelAgent} onFermer={() => { setModalNouvelAgent(false); setForm(FORM_INIT); setErreur(''); setSucces(''); }} titre="Ajouter un nouvel agent" taille="md">
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="grid grid-cols-2 gap-3">
            <Input label="Prenom *" placeholder="Prenom de l'agent" value={form.prenom} onChange={(e) => setForm((f) => ({ ...f, prenom: e.target.value }))} required />
            <Input label="Nom *" placeholder="Nom de l'agent" value={form.nom} onChange={(e) => setForm((f) => ({ ...f, nom: e.target.value }))} required />
          </div>
          <Input label="Email *" type="email" placeholder="agent@exemple.com" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} required />
          <Input label="Telephone *" type="tel" placeholder="+225 07 00 00 00 00" value={form.telephone} onChange={(e) => setForm((f) => ({ ...f, telephone: e.target.value }))} required />
          <Select
            label="Agence"
            options={optionsAgences}
            placeholder="Choisir une agence"
            value={form.agenceId}
            onChange={(e) => setForm((f) => ({ ...f, agenceId: e.target.value }))}
          />
          <Input label="Mot de passe temporaire *" type="password" placeholder="Minimum 8 caracteres" value={form.password} onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))} required />

          {erreur && <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-red-600">{erreur}</div>}
          {succes && <div className="bg-green-50 border border-green-200 rounded-xl p-3 text-sm text-green-700">{succes}</div>}

          <div className="flex gap-3 pt-2">
            <Button type="submit" variante="primary" fullWidth loading={creerAgent.isPending}>
              Creer l&apos;agent
            </Button>
            <Button type="button" variante="ghost" onClick={() => { setModalNouvelAgent(false); setForm(FORM_INIT); setErreur(''); }}>
              Annuler
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
