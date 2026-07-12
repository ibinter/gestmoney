'use client';
import React, { useState } from 'react';
import { Plus, Search, MapPin, Phone, Users, Download } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { StatCard } from '@/components/ui/StatCard';
import { Table, Colonne } from '@/components/ui/Table';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { formatDate } from '@/lib/formatters';
import { exporterCsv } from '@/lib/exportCsv';
import { useAgences, useCreateAgence, useToggleAgenceStatus } from '@/hooks/useAgences';
import { Agence } from '@/types';

const FORM_INIT = { nom: '', code: '', ville: '', adresse: '', telephone: '', responsable: '' };

export default function AgencesPage() {
  const [search, setSearch] = useState('');
  const [modalOuvert, setModalOuvert] = useState(false);
  const [form, setForm] = useState(FORM_INIT);
  const [erreur, setErreur] = useState('');
  const [succes, setSucces] = useState('');

  const { data: allAgences = [], isLoading } = useAgences();
  const creerAgence = useCreateAgence();
  const toggleStatut = useToggleAgenceStatus();

  const agences = allAgences.filter((a) =>
    !search ||
    a.nom.toLowerCase().includes(search.toLowerCase()) ||
    a.ville.toLowerCase().includes(search.toLowerCase()) ||
    a.code.toLowerCase().includes(search.toLowerCase())
  );

  const nbActives = allAgences.filter((a) => a.active).length;
  const totalAgents = allAgences.reduce((s, a) => s + a.nbAgents, 0);
  const totalEnLigne = allAgences.reduce((s, a) => s + a.nbAgentsEnLigne, 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErreur('');
    if (!form.nom || !form.code || !form.ville) {
      setErreur('Veuillez remplir les champs obligatoires (nom, code, ville).');
      return;
    }
    try {
      await creerAgence.mutateAsync(form);
      setSucces(`Agence "${form.nom}" créée avec succès.`);
      setForm(FORM_INIT);
      setTimeout(() => { setModalOuvert(false); setSucces(''); }, 1500);
    } catch {
      setErreur('Erreur lors de la création. Réessayez.');
    }
  };

  const handleToggle = (agence: Agence) => {
    toggleStatut.mutate({ id: agence.id, active: !agence.active });
  };

  const colonnes: Colonne<Agence>[] = [
    {
      key: 'nom',
      titre: 'Agence',
      triable: true,
      rendu: (_, a) => (
        <div>
          <p className="font-semibold text-sm text-text-main">{a.nom}</p>
          <p className="text-xs text-gray-400 font-mono">{a.code}</p>
        </div>
      ),
    },
    {
      key: 'ville',
      titre: 'Localisation',
      rendu: (_, a) => (
        <div className="flex items-start gap-1">
          <MapPin size={12} className="text-gray-400 mt-0.5 flex-shrink-0" />
          <div>
            <p className="text-sm font-medium">{a.ville}</p>
            <p className="text-xs text-gray-400">{a.adresse}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'telephone',
      titre: 'Contact',
      rendu: (_, a) => (
        <div>
          <div className="flex items-center gap-1 text-sm">
            <Phone size={11} className="text-gray-400" />
            <span>{a.telephone}</span>
          </div>
          <p className="text-xs text-gray-400 mt-0.5">Resp. {a.responsableNom}</p>
        </div>
      ),
    },
    {
      key: 'nbAgents',
      titre: 'Agents',
      align: 'right',
      rendu: (_, a) => (
        <div className="text-right">
          <div className="flex items-center justify-end gap-1">
            <Users size={12} className="text-gray-400" />
            <span className="font-semibold text-sm">{a.nbAgents}</span>
          </div>
          <p className="text-xs text-success">{a.nbAgentsEnLigne} en ligne</p>
        </div>
      ),
    },
    {
      key: 'active',
      titre: 'Statut',
      rendu: (v) => <Badge couleur={v ? 'success' : 'danger'}>{v ? 'Active' : 'Inactive'}</Badge>,
    },
    {
      key: 'createdAt',
      titre: 'Ouverture',
      rendu: (v) => <span className="text-xs text-gray-400">{formatDate(String(v))}</span>,
    },
    {
      key: 'id',
      titre: 'Actions',
      rendu: (_, a) => (
        <div className="flex gap-2">
          <button className="text-xs text-primary hover:underline font-medium">Voir</button>
          <button
            className={`text-xs font-medium hover:underline ${a.active ? 'text-danger' : 'text-success'}`}
            onClick={() => handleToggle(a)}
            disabled={toggleStatut.isPending}
          >
            {a.active ? 'Désactiver' : 'Activer'}
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text-main">Agences & Points de vente</h1>
          <p className="text-sm text-gray-500">Gestion du réseau d&apos;agences</p>
        </div>
        <div className="flex gap-2">
          <Button
            variante="ghost"
            taille="sm"
            icone={<Download size={15} />}
            onClick={() => exporterCsv(agences, [
              { titre: 'Nom', valeur: (a) => a.nom },
              { titre: 'Code', valeur: (a) => a.code },
              { titre: 'Ville', valeur: (a) => a.ville },
              { titre: 'Adresse', valeur: (a) => a.adresse },
              { titre: 'Téléphone', valeur: (a) => a.telephone },
              { titre: 'Responsable', valeur: (a) => a.responsableNom },
              { titre: 'Agents', valeur: (a) => a.nbAgents },
              { titre: 'Agents en ligne', valeur: (a) => a.nbAgentsEnLigne },
              { titre: 'Statut', valeur: (a) => a.active ? 'Active' : 'Inactive' },
              { titre: 'Date création', valeur: (a) => formatDate(a.createdAt) },
            ], 'agences')}
          >
            Exporter
          </Button>
          <Button variante="primary" taille="sm" icone={<Plus size={15} />} onClick={() => setModalOuvert(true)}>
            Nouvelle agence
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard titre="Agences actives" valeur={`${nbActives} / ${allAgences.length}`} icone="🏪" couleur="success" />
        <StatCard titre="Total agents" valeur={totalAgents.toString()} icone={<Users size={18} />} couleur="primary" />
        <StatCard titre="Agents en ligne" valeur={totalEnLigne.toString()} sousTexte={`sur ${totalAgents} total`} icone="🟢" couleur="default" />
        <StatCard titre="Villes couvertes" valeur={String(new Set(allAgences.map((a) => a.ville)).size)} icone={<MapPin size={18} />} couleur="default" />
      </div>

      {/* Carte visuelle par ville */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {['Abidjan', 'Bouake', 'San Pedro'].map((ville) => {
          const liste = allAgences.filter((a) => a.ville === ville);
          return (
            <div key={ville} className="bg-white rounded-card shadow-card p-4">
              <h3 className="font-semibold text-sm text-text-main mb-3 flex items-center gap-2">
                <MapPin size={14} className="text-primary" /> {ville}
              </h3>
              <div className="space-y-2">
                {liste.length === 0 && <p className="text-xs text-gray-400">Aucune agence</p>}
                {liste.map((a) => (
                  <div key={a.id} className="flex items-center justify-between text-xs">
                    <span className="text-gray-600">{a.nom}</span>
                    <div className="flex items-center gap-1">
                      <span className="font-medium">{a.nbAgentsEnLigne}/{a.nbAgents}</span>
                      <div className={`w-2 h-2 rounded-full ${a.active ? 'bg-success' : 'bg-gray-300'}`} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      <Card padding="none">
        <div className="p-4 border-b border-gray-100">
          <div className="flex gap-3">
            <div className="flex-1">
              <Input
                placeholder="Rechercher une agence (nom, ville, code)..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                icone={<Search size={16} />}
              />
            </div>
          </div>
          <p className="text-xs text-gray-400 mt-2">
            {isLoading ? 'Chargement...' : `${agences.length} agence(s) trouvée(s)`}
          </p>
        </div>
        <Table colonnes={colonnes} donnees={agences} messageVide="Aucune agence trouvée" />
      </Card>

      <Modal ouvert={modalOuvert} onFermer={() => { setModalOuvert(false); setForm(FORM_INIT); setErreur(''); setSucces(''); }} titre="Nouvelle agence" taille="md">
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div className="grid grid-cols-2 gap-3">
            <Input label="Nom de l'agence *" placeholder="Agence Centre-ville" value={form.nom} onChange={(e) => setForm((f) => ({ ...f, nom: e.target.value }))} required />
            <Input label="Code *" placeholder="AG-XXX-001" value={form.code} onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))} required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Input label="Ville *" placeholder="Abidjan" value={form.ville} onChange={(e) => setForm((f) => ({ ...f, ville: e.target.value }))} required />
            <Input label="Téléphone" type="tel" placeholder="0701000000" value={form.telephone} onChange={(e) => setForm((f) => ({ ...f, telephone: e.target.value }))} />
          </div>
          <Input label="Adresse" placeholder="Rue, Quartier" value={form.adresse} onChange={(e) => setForm((f) => ({ ...f, adresse: e.target.value }))} />
          <Input label="Responsable" placeholder="Nom du responsable" value={form.responsable} onChange={(e) => setForm((f) => ({ ...f, responsable: e.target.value }))} />

          {erreur && <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-red-600">{erreur}</div>}
          {succes && <div className="bg-green-50 border border-green-200 rounded-xl p-3 text-sm text-green-700">{succes}</div>}

          <div className="flex gap-3 pt-2">
            <Button type="submit" variante="primary" fullWidth loading={creerAgence.isPending}>
              Créer l&apos;agence
            </Button>
            <Button type="button" variante="ghost" onClick={() => { setModalOuvert(false); setForm(FORM_INIT); setErreur(''); }}>
              Annuler
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
