'use client';
import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Search, X, LayoutDashboard, ArrowRight, Users, Building2, Repeat2, BarChart3, Wallet, FileText, Settings, UserCircle, Bell } from 'lucide-react';
import { clsx } from 'clsx';

interface Item {
  id: string;
  label: string;
  description?: string;
  icon: React.ReactNode;
  href: string;
  categorie: string;
}

const NAVIGATION: Item[] = [
  { id: 'dashboard',      label: 'Tableau de bord',  description: 'Vue d\'ensemble en temps réel', icon: <LayoutDashboard size={16} />, href: '/dashboard', categorie: 'Navigation' },
  { id: 'transactions',   label: 'Transactions',      description: 'Dépôts, retraits, transferts', icon: <Repeat2 size={16} />,         href: '/dashboard/transactions', categorie: 'Navigation' },
  { id: 'agents',         label: 'Agents',            description: 'Gestion des agents de terrain', icon: <Users size={16} />,            href: '/dashboard/agents', categorie: 'Navigation' },
  { id: 'agences',        label: 'Agences & PDV',     description: 'Points de vente et agences',   icon: <Building2 size={16} />,         href: '/dashboard/agences', categorie: 'Navigation' },
  { id: 'clients',        label: 'Clients',           description: 'Base clients et fidélité',     icon: <UserCircle size={16} />,        href: '/dashboard/clients', categorie: 'Navigation' },
  { id: 'float',          label: 'Gestion du float',  description: 'Soldes et réapprovisionnement',icon: <Wallet size={16} />,            href: '/dashboard/float', categorie: 'Navigation' },
  { id: 'caisse',         label: 'Caisse',            description: 'Journal de caisse et coffre',  icon: <Wallet size={16} />,            href: '/dashboard/caisse', categorie: 'Navigation' },
  { id: 'commissions',    label: 'Commissions',       description: 'Plans et paiements agents',    icon: <FileText size={16} />,          href: '/dashboard/commissions', categorie: 'Navigation' },
  { id: 'performances',   label: 'Performances',      description: 'Comparatifs opérateurs',       icon: <BarChart3 size={16} />,         href: '/dashboard/performances', categorie: 'Navigation' },
  { id: 'rapports',       label: 'Rapports & BI',     description: 'Export et analyses',           icon: <FileText size={16} />,          href: '/dashboard/rapports', categorie: 'Navigation' },
  { id: 'notifications',  label: 'Notifications',     description: 'Alertes et messages système',  icon: <Bell size={16} />,              href: '/dashboard/notifications', categorie: 'Navigation' },
  { id: 'profile',        label: 'Mon profil',        description: 'Informations personnelles',    icon: <UserCircle size={16} />,        href: '/dashboard/profile', categorie: 'Navigation' },
  { id: 'settings',       label: 'Paramètres',        description: 'Configuration de l\'espace',   icon: <Settings size={16} />,          href: '/dashboard/settings', categorie: 'Navigation' },
];

function score(item: Item, q: string): number {
  const low = q.toLowerCase();
  const l = item.label.toLowerCase();
  const d = (item.description ?? '').toLowerCase();
  if (l === low) return 100;
  if (l.startsWith(low)) return 80;
  if (l.includes(low)) return 60;
  if (d.includes(low)) return 30;
  return 0;
}

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState(0);
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  const results = query.trim().length === 0
    ? NAVIGATION.slice(0, 8)
    : NAVIGATION.map((item) => ({ item, s: score(item, query) }))
        .filter(({ s }) => s > 0)
        .sort((a, b) => b.s - a.s)
        .map(({ item }) => item)
        .slice(0, 8);

  const handleOpen = useCallback(() => {
    setOpen(true);
    setQuery('');
    setSelected(0);
  }, []);

  const handleClose = useCallback(() => {
    setOpen(false);
    setQuery('');
    setSelected(0);
  }, []);

  const handleSelect = useCallback((href: string) => {
    handleClose();
    router.push(href);
  }, [router, handleClose]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setOpen((v) => { if (v) { handleClose(); return false; } handleOpen(); return true; });
      }
      if (e.key === 'Escape') handleClose();
    };
    const onCustom = () => handleOpen();
    window.addEventListener('keydown', onKey);
    window.addEventListener('open-command-palette', onCustom);
    return () => {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('open-command-palette', onCustom);
    };
  }, [handleOpen, handleClose]);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 10);
  }, [open]);

  useEffect(() => { setSelected(0); }, [query]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setSelected((s) => Math.min(s + 1, results.length - 1)); }
    if (e.key === 'ArrowUp')   { e.preventDefault(); setSelected((s) => Math.max(s - 1, 0)); }
    if (e.key === 'Enter' && results[selected]) handleSelect(results[selected].href);
  };

  if (!open) return null;

  // Grouper par catégorie
  const grouped = results.reduce<Record<string, Item[]>>((acc, item) => {
    (acc[item.categorie] ??= []).push(item);
    return acc;
  }, {});

  let flatIndex = 0;

  return (
    <div className="fixed inset-0 z-[200] flex items-start justify-center pt-[15vh] px-4" role="dialog" aria-modal="true" aria-label="Recherche globale">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={handleClose} />

      {/* Panel */}
      <div className="relative w-full max-w-xl bg-white dark:bg-[#1a1a1a] rounded-2xl shadow-2xl border border-gray-200 dark:border-white/10 overflow-hidden">

        {/* Input */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-gray-100 dark:border-white/08">
          <Search size={18} className="text-gray-400 shrink-0" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Rechercher une page, une action…"
            className="flex-1 text-sm bg-transparent text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 outline-none"
          />
          {query && (
            <button onClick={() => setQuery('')} className="p-1 rounded text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
              <X size={14} />
            </button>
          )}
          <kbd className="text-xs bg-gray-100 dark:bg-white/10 text-gray-400 dark:text-gray-500 px-1.5 py-0.5 rounded font-mono shrink-0">Esc</kbd>
        </div>

        {/* Résultats */}
        <div className="max-h-80 overflow-y-auto py-2">
          {results.length === 0 ? (
            <div className="py-10 text-center text-sm text-gray-400 dark:text-gray-500">
              Aucun résultat pour &quot;{query}&quot;
            </div>
          ) : (
            Object.entries(grouped).map(([cat, items]) => (
              <div key={cat}>
                <p className="px-4 py-1.5 text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">{cat}</p>
                {items.map((item) => {
                  const idx = flatIndex++;
                  const isSelected = idx === selected;
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleSelect(item.href)}
                      onMouseEnter={() => setSelected(idx)}
                      className={clsx(
                        'w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors',
                        isSelected
                          ? 'bg-gray-100 dark:bg-white/10'
                          : 'hover:bg-gray-50 dark:hover:bg-white/05'
                      )}
                    >
                      <span className={clsx(
                        'w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-colors',
                        isSelected ? 'bg-[#FFD000]/20 text-[#b8960a] dark:text-[#FFD000]' : 'bg-gray-100 dark:bg-white/10 text-gray-500 dark:text-gray-400'
                      )}>
                        {item.icon}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className={clsx('text-sm font-medium truncate', isSelected ? 'text-gray-900 dark:text-white' : 'text-gray-700 dark:text-gray-300')}>
                          {item.label}
                        </p>
                        {item.description && (
                          <p className="text-xs text-gray-400 dark:text-gray-500 truncate">{item.description}</p>
                        )}
                      </div>
                      {isSelected && <ArrowRight size={14} className="shrink-0 text-gray-400" />}
                    </button>
                  );
                })}
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-2.5 border-t border-gray-100 dark:border-white/08 flex items-center gap-4 text-xs text-gray-400 dark:text-gray-500">
          <span className="flex items-center gap-1"><kbd className="bg-gray-100 dark:bg-white/10 px-1 rounded font-mono">↑↓</kbd> Naviguer</span>
          <span className="flex items-center gap-1"><kbd className="bg-gray-100 dark:bg-white/10 px-1 rounded font-mono">↵</kbd> Ouvrir</span>
          <span className="flex items-center gap-1"><kbd className="bg-gray-100 dark:bg-white/10 px-1 rounded font-mono">Esc</kbd> Fermer</span>
        </div>
      </div>
    </div>
  );
}
