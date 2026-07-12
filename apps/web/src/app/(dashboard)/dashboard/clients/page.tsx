'use client';
import React, { useState, useEffect } from 'react';
import { Search, Plus, UserCheck, TrendingUp, Download } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { StatCard } from '@/components/ui/StatCard';
import { Table, Colonne } from '@/components/ui/Table';
import { Input, Select } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { formatMontant, formatDate } from '@/lib/formatters';
import { exporterCsv } from '@/lib/exportCsv';
import { useClients, useCreateClient } from '@/hooks/useClients';
import { Client } from '@/types';

const FORM_INIT_CLIENT = { prenom: '', nom: '', telephone: '', email: '', ville: '' };

const KYC_LABELS: Record<string, string> = { verifie: 'Verifie', en_attente: 'En attente', rejete: 'Rejete' };
const KYC_COULEURS: Record<string, 'success' | 'warning' | 'danger'> = { verifie: 'success', en_attente: 'warning', rejete: 'danger' };
const STATUT_COULEURS: Record<string, 'success' | 'danger' | 'neutral'> = { actif: 'success', bloque: 'danger', inactif: 'neutral' };

export default function ClientsPage() {
  const [search, setSearch] = useState('');
  const [filtreStatut, setFiltreStatut] = useState('');
  const [filtreKyc, setFiltreKyc] = useState('');
  const [page, setPage] = useState(1);
  const LIMIT = 15;
  const [modalOuvert, setModalOuvert] = useState(false);
  const [formClient, setFormClient] = useState(FORM_INIT_CLIENT);
  const [erreurClient, setErreurClient] = useState('');
  const [succesClient, setSuccesClient] = useState('');

  const { data: allClients = [], isLoading } = useClients();
  const creerClient = useCreateClient();

  const handleSubmitClient = async (e: React.FormEvent) => {
    e.preventDefault();
    setErreurClient('');
    if (!formClient.prenom || !formClient.nom || !formClient.telephone) {
      setErreurClient('Prénom, nom et téléphone sont obligatoires.');
      return;
    }
    try {
      await creerClient.mutateAsync({
        prenom: formClient.prenom,
        nom: formClient.nom,
        telephone: formClient.telephone,
        email: formClient.email || undefined,
        ville: formClient.ville || undefined,
      });
      setSuccesClient(`Client ${formClient.prenom} ${formClient.nom} enregistré.`);
      setFormClient(FORM_INIT_CLIENT);
      setTimeout(() => { setModalOuvert(false); setSuccesClient(''); }, 1500);
    } catch {
      setErreurClient('Erreur lors de l\'enregistrement. Réessayez.');
    }
  };

  const clients = allClients.filter((c) => {
    const matchSearch = !search ||
      `${c.prenom} ${c.nom}`.toLowerCase().includes(search.toLowerCase()) ||
      c.telephone.includes(search) ||
      c.email?.toLowerCase().includes(search.toLowerCase());
    const matchStatut = !filtreStatut || c.statut === filtreStatut;
    const matchKyc = !filtreKyc || c.kycStatut === filtreKyc;
    return matchSearch && matchStatut && matchKyc;
  });

  const totalPages = Math.ceil(clients.length / LIMIT);
  const clientsPage = clients.slice((page - 1) * LIMIT, page * LIMIT);

  useEffect(() => setPage(1), [search, filtreStatut, filtreKyc]);

  const nbActifs = allClients.filter((c) => c.statut === 'actif').length;
  const nbKycPending = allClients.filter((c) => c.kycStatut === 'en_attente').length;
  const totalVolume = allClients.reduce((s, c) => s + c.montantTotal, 0);

  const colonnes: Colonne<Client>[] = [
    {
      key: 'nom',
      titre: 'Client',
      triable: true,
      rendu: (_, c) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-bold">
            {c.prenom[0]}{c.nom[0]}
          </div>
          <div>
            <p className="font-medium text-sm text-text-main">{c.prenom} {c.nom}</p>
            <p className="text-xs text-gray-400">{c.telephone}</p>
          </div>
        </div>
      ),
    },
    { key: 'ville', titre: 'Ville' },
    { key: 'operateur', titre: 'Operateur', rendu: (v) => <span className="text-sm">{String(v)}</span> },
    {
      key: 'soldeWallet',
      titre: 'Solde wallet',
      align: 'right',
      rendu: (v) => <span className="font-semibold text-sm">{formatMontant(Number(v))}</span>,
    },
    {
      key: 'nbTransactions',
      titre: 'Transactions',
      align: 'right',
      triable: true,
      rendu: (v) => <span className="font-mono text-sm">{Number(v)}</span>,
    },
    {
      key: 'montantTotal',
      titre: 'Volume total',
      align: 'right',
      triable: true,
      rendu: (v) => <span className="text-sm text-gray-600">{formatMontant(Number(v))}</span>,
    },
    {
      key: 'kycStatut',
      titre: 'KYC',
      rendu: (v) => <Badge couleur={KYC_COULEURS[String(v)] ?? 'neutral'}>{KYC_LABELS[String(v)] ?? String(v)}</Badge>,
    },
    {
      key: 'statut',
      titre: 'Statut',
      rendu: (v) => <Badge couleur={STATUT_COULEURS[String(v)] ?? 'neutral'} point>{String(v)}</Badge>,
    },
    {
      key: 'createdAt',
      titre: 'Inscription',
      rendu: (v) => <span className="text-xs text-gray-400">{formatDate(String(v))}</span>,
    },
    {
      key: 'id',
      titre: 'Actions',
      rendu: (_, c) => (
        <div className="flex gap-1">
          <button className="text-xs text-primary hover:underline font-medium">Voir</button>
          {c.kycStatut === 'en_attente' && (
            <button className="text-xs text-success hover:underline font-medium ml-1">Verifier KYC</button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text-main">Clients</h1>
          <p className="text-sm text-gray-500">Base clients et gestion KYC</p>
        </div>
        <div className="flex gap-2">
          <Button
            variante="ghost"
            taille="sm"
            icone={<Download size={15} />}
            onClick={() => exporterCsv(clients, [
              { titre: 'Prénom', valeur: (c) => c.prenom },
              { titre: 'Nom', valeur: (c) => c.nom },
              { titre: 'Téléphone', valeur: (c) => c.telephone },
              { titre: 'Email', valeur: (c) => c.email ?? '' },
              { titre: 'Ville', valeur: (c) => c.ville ?? '' },
              { titre: 'KYC', valeur: (c) => c.kycStatut },
              { titre: 'Statut', valeur: (c) => c.statut },
              { titre: 'Opérateur', valeur: (c) => c.operateur },
              { titre: 'Solde wallet (FCFA)', valeur: (c) => c.soldeWallet },
              { titre: 'Transactions', valeur: (c) => c.nbTransactions },
              { titre: 'Volume (FCFA)', valeur: (c) => c.montantTotal },
              { titre: 'Date inscription', valeur: (c) => formatDate(c.createdAt) },
            ], 'clients')}
          >
            Exporter
          </Button>
          <Button variante="primary" taille="sm" icone={<Plus size={15} />} onClick={() => setModalOuvert(true)}>
            Nouveau client
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard titre="Clients actifs" valeur={nbActifs.toString()} sousTexte={`sur ${allClients.length} total`} icone={<UserCheck size={18} />} couleur="success" />
        <StatCard titre="Nouveaux ce mois" valeur="+127" icone={<TrendingUp size={18} />} couleur="primary" />
        <StatCard titre="KYC en attente" valeur={nbKycPending.toString()} icone="🔍" couleur={nbKycPending > 0 ? 'warning' : 'default'} />
        <StatCard titre="Volume total" valeur={formatMontant(totalVolume)} icone="💵" couleur="default" />
      </div>

      <Card padding="none">
        <div className="p-4 border-b border-gray-100">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1">
              <Input
                placeholder="Rechercher (nom, telephone, email)..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                icone={<Search size={16} />}
              />
            </div>
            <Select
              placeholder="Tous statuts"
              value={filtreStatut}
              onChange={(e) => setFiltreStatut(e.target.value)}
              options={[
                { value: 'actif', label: 'Actifs' },
                { value: 'inactif', label: 'Inactifs' },
                { value: 'bloque', label: 'Bloques' },
              ]}
            />
            <Select
              placeholder="Tous KYC"
              value={filtreKyc}
              onChange={(e) => setFiltreKyc(e.target.value)}
              options={[
                { value: 'verifie', label: 'Verifies' },
                { value: 'en_attente', label: 'En attente' },
                { value: 'rejete', label: 'Rejetes' },
              ]}
            />
          </div>
          <p className="text-xs text-gray-400 mt-2">
            {isLoading ? 'Chargement...' : `${clients.length} client(s) trouve(s)`}
          </p>
        </div>
        <Table colonnes={colonnes} donnees={clientsPage} messageVide="Aucun client trouve" />
        <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
          <p className="text-xs text-gray-500">{clients.length} client(s) — Page {page} / {totalPages || 1}</p>
          <div className="flex gap-1">
            <button className="px-3 py-1.5 text-xs rounded-lg border border-gray-200 text-gray-600 hover:bg-surface disabled:opacity-40" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>Précédent</button>
            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => i + 1).map(p => (
              <button key={p} onClick={() => setPage(p)} className={`px-3 py-1.5 text-xs rounded-lg font-medium ${p === page ? 'bg-primary text-sidebar' : 'border border-gray-200 text-gray-600 hover:bg-surface'}`}>{p}</button>
            ))}
            <button className="px-3 py-1.5 text-xs rounded-lg border border-gray-200 text-gray-600 hover:bg-surface disabled:opacity-40" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>Suivant</button>
          </div>
        </div>
      </Card>

      <Modal ouvert={modalOuvert} onFermer={() => { setModalOuvert(false); setFormClient(FORM_INIT_CLIENT); setErreurClient(''); setSuccesClient(''); }} titre="Nouveau client" taille="md">
        <form className="space-y-4" onSubmit={handleSubmitClient}>
          <div className="grid grid-cols-2 gap-3">
            <Input label="Prénom *" placeholder="Prénom" value={formClient.prenom} onChange={(e) => setFormClient((f) => ({ ...f, prenom: e.target.value }))} required />
            <Input label="Nom *" placeholder="Nom" value={formClient.nom} onChange={(e) => setFormClient((f) => ({ ...f, nom: e.target.value }))} required />
          </div>
          <Input label="Téléphone *" type="tel" placeholder="+225 07 00 00 00 00" value={formClient.telephone} onChange={(e) => setFormClient((f) => ({ ...f, telephone: e.target.value }))} required />
          <Input label="Email" type="email" placeholder="client@email.com" value={formClient.email} onChange={(e) => setFormClient((f) => ({ ...f, email: e.target.value }))} />
          <Input label="Ville" placeholder="Abidjan" value={formClient.ville} onChange={(e) => setFormClient((f) => ({ ...f, ville: e.target.value }))} />

          {erreurClient && <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-red-600">{erreurClient}</div>}
          {succesClient && <div className="bg-green-50 border border-green-200 rounded-xl p-3 text-sm text-green-700">{succesClient}</div>}

          <div className="flex gap-3 pt-2">
            <Button type="submit" variante="primary" fullWidth loading={creerClient.isPending}>Enregistrer le client</Button>
            <Button type="button" variante="ghost" onClick={() => { setModalOuvert(false); setFormClient(FORM_INIT_CLIENT); setErreurClient(''); }}>Annuler</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
