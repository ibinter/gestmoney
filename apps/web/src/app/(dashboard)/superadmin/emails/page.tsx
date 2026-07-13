'use client';
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Mail, Eye, ToggleLeft as ToggleIcon, Send, ChevronRight, CheckCircle2, AlertTriangle, BarChart2, Users, FileText, Zap } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { TEMPLATES_INFO, rendreDemoTemplate, TemplateId, TemplateInfo } from '@/lib/emailTemplates';
import { clsx } from 'clsx';

const CATEGORIE_LABEL: Record<string, string> = {
  auth: 'Authentification',
  transaction: 'Transaction',
  alerte: 'Alerte',
  rapport: 'Rapport',
  reseau: 'Réseau',
};

const CATEGORIE_COLOR: Record<string, string> = {
  auth: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  transaction: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
  alerte: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
  rapport: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
  reseau: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300',
};

const CATEGORIE_ICONE: Record<string, React.ReactNode> = {
  auth: <CheckCircle2 size={15} />,
  transaction: <Zap size={15} />,
  alerte: <AlertTriangle size={15} />,
  rapport: <BarChart2 size={15} />,
  reseau: <Users size={15} />,
};

// ─── Stats mock ────────────────────────────────────────────────────────────
const STATS_MOCK = {
  envoyes_30j: 4_821,
  taux_ouverture: 68.4,
  taux_clic: 23.1,
  en_erreur: 7,
};

// ─── Modal prévisualisation ────────────────────────────────────────────────
function PreviewModal({ templateId, onFermer }: { templateId: TemplateId; onFermer: () => void }) {
  const html = rendreDemoTemplate(templateId);
  const info = TEMPLATES_INFO.find((t) => t.id === templateId)!;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-[#0e0e0e]">
      {/* Topbar preview */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-white/10 bg-[#111] flex-shrink-0">
        <div className="flex items-center gap-3">
          <button onClick={onFermer} className="text-gray-400 hover:text-white transition-colors text-sm flex items-center gap-1">
            ← Retour
          </button>
          <span className="text-white/20">|</span>
          <span className="text-white text-sm font-medium">{info.titre}</span>
          <span className="text-[10px] text-gray-400 bg-white/08 px-2 py-0.5 rounded-full font-mono">{info.sujet}</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center bg-white/08 rounded-xl p-1 gap-1">
            {['Desktop', 'Mobile'].map((v) => (
              <button key={v} className="px-3 py-1.5 rounded-lg text-xs font-medium text-gray-300 hover:text-white hover:bg-white/10 transition-colors">{v}</button>
            ))}
          </div>
          <button
            onClick={onFermer}
            className="text-gray-400 hover:text-white px-3 py-1.5 rounded-lg text-sm hover:bg-white/08 transition-colors"
          >
            Fermer
          </button>
        </div>
      </div>

      {/* Simulateur client email */}
      <div className="flex-1 overflow-auto bg-[#1a1a2e] flex flex-col items-center py-8 px-4">
        {/* En-tête simulé inbox */}
        <div className="w-full max-w-[620px] bg-[#22222e] rounded-t-xl border border-white/10 px-5 py-3 text-sm text-gray-400 flex items-center gap-4">
          <span className="text-gray-500 text-xs">De :</span>
          <span className="text-gray-300 font-medium">GESTMONEY &lt;noreply@gestmoney.ibigsoft.com&gt;</span>
          <span className="text-gray-500 text-xs ml-auto">Objet :</span>
          <span className="text-gray-300 truncate max-w-[200px] text-xs">{info.sujet}</span>
        </div>

        {/* Rendu HTML */}
        <div className="w-full max-w-[620px] border-x border-b border-white/10 rounded-b-xl overflow-hidden shadow-2xl">
          <iframe
            srcDoc={html}
            title={`Prévisualisation : ${info.titre}`}
            className="w-full border-0"
            style={{ height: '600px', background: '#F0F2F5' }}
            sandbox="allow-same-origin"
          />
        </div>

        {/* Infos */}
        <div className="w-full max-w-[620px] mt-4 bg-white/05 rounded-xl border border-white/10 p-4">
          <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider mb-2">Variables disponibles</p>
          <div className="flex flex-wrap gap-2">
            {info.variables.map((v) => (
              <code key={v} className="text-xs bg-white/08 text-[#44C767] px-2 py-1 rounded-lg font-mono">{`{{${v}}}`}</code>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Carte template ────────────────────────────────────────────────────────
function TemplateCard({
  info,
  actif,
  onToggle,
  onPreview,
  onTest,
}: {
  info: TemplateInfo;
  actif: boolean;
  onToggle: () => void;
  onPreview: () => void;
  onTest: () => void;
}) {
  return (
    <div className={clsx(
      'bg-white dark:bg-white/03 rounded-2xl border transition-all duration-200',
      actif ? 'border-gray-200 dark:border-white/10' : 'border-dashed border-gray-200 dark:border-white/08 opacity-60'
    )}>
      <div className="p-5">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className={clsx('flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full flex-shrink-0', CATEGORIE_COLOR[info.categorie])}>
              {CATEGORIE_ICONE[info.categorie]}
              {CATEGORIE_LABEL[info.categorie]}
            </div>
          </div>

          {/* Toggle actif/inactif */}
          <button
            onClick={onToggle}
            className={clsx(
              'relative flex-shrink-0 w-10 h-5.5 rounded-full transition-colors duration-200 focus:outline-none',
              actif ? 'bg-primary' : 'bg-gray-200 dark:bg-white/15'
            )}
            style={{ height: '22px' }}
            aria-label={actif ? 'Désactiver' : 'Activer'}
          >
            <span
              className={clsx(
                'absolute top-0.5 w-4.5 h-4.5 bg-white rounded-full shadow transition-transform duration-200',
                actif ? 'translate-x-5' : 'translate-x-0.5'
              )}
              style={{ width: '18px', height: '18px', top: '2px' }}
            />
          </button>
        </div>

        <h3 className="text-sm font-bold text-text-main mb-1">{info.titre}</h3>
        <p className="text-xs text-text-muted leading-relaxed mb-3">{info.description}</p>

        <div className="flex items-center gap-2 text-xs text-text-muted">
          <Zap size={11} className="text-[#FFD000] flex-shrink-0" />
          <span className="truncate">{info.declencheur}</span>
        </div>
      </div>

      <div className="px-5 pb-4 flex items-center gap-2 border-t border-gray-100 dark:border-white/06 pt-3">
        <button
          onClick={onPreview}
          className="flex items-center gap-1.5 text-xs font-semibold text-primary hover:text-primary/80 transition-colors"
        >
          <Eye size={13} /> Prévisualiser
        </button>
        <span className="text-gray-200 dark:text-white/10">|</span>
        <button
          onClick={onTest}
          className="flex items-center gap-1.5 text-xs font-semibold text-text-muted hover:text-text-main transition-colors"
        >
          <Send size={13} /> Envoyer un test
        </button>
        <span className="ml-auto text-[10px] text-text-muted font-mono">{info.id}</span>
      </div>
    </div>
  );
}

// ─── Page principale ───────────────────────────────────────────────────────
export default function EmailsPage() {
  const router = useRouter();
  const { user } = useAuthStore();

  useEffect(() => {
    if (user && user.role !== 'SUPER_ADMIN') router.replace('/dashboard');
  }, [user, router]);

  const [templates, setTemplates] = useState<Record<TemplateId, boolean>>(
    Object.fromEntries(TEMPLATES_INFO.map((t) => [t.id, t.actif])) as Record<TemplateId, boolean>
  );
  const [previewId, setPreviewId] = useState<TemplateId | null>(null);
  const [testEnvoye, setTestEnvoye] = useState<string | null>(null);
  const [filtreCategorie, setFiltreCategorie] = useState<string>('all');

  const toggleTemplate = (id: TemplateId) => {
    setTemplates((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const envoyerTest = (id: TemplateId) => {
    setTestEnvoye(id);
    setTimeout(() => setTestEnvoye(null), 3000);
  };

  const categoriesFiltres = ['all', ...Array.from(new Set(TEMPLATES_INFO.map((t) => t.categorie)))];
  const templatesFiltres = TEMPLATES_INFO.filter((t) =>
    filtreCategorie === 'all' || t.categorie === filtreCategorie
  );

  if (user?.role !== 'SUPER_ADMIN') return null;
  if (previewId) return <PreviewModal templateId={previewId} onFermer={() => setPreviewId(null)} />;

  const nbActifs = Object.values(templates).filter(Boolean).length;

  return (
    <div className="space-y-8">
      {/* En-tête */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center">
            <Mail size={20} className="text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <button onClick={() => router.push('/superadmin')} className="text-sm text-text-muted hover:text-text-main transition-colors">Console SuperAdmin</button>
              <ChevronRight size={14} className="text-text-muted" />
              <span className="text-sm font-semibold text-text-main">Emails automatiques</span>
            </div>
            <p className="text-xs text-text-muted mt-0.5">{nbActifs}/{TEMPLATES_INFO.length} templates actifs</p>
          </div>
        </div>

        <button
          className="flex items-center gap-2 bg-primary text-sidebar text-sm font-semibold px-4 py-2.5 rounded-xl hover:bg-primary/90 transition-colors"
          onClick={() => alert('Ouvre l\'éditeur SMTP dans un vrai déploiement')}
        >
          <Mail size={15} />
          Config. SMTP
        </button>
      </div>

      {/* KPIs email */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Envoyés (30j)', valeur: STATS_MOCK.envoyes_30j.toLocaleString('fr-FR'), couleur: '#3B82F6', icone: <Mail size={16} /> },
          { label: 'Taux d\'ouverture', valeur: `${STATS_MOCK.taux_ouverture}%`, couleur: '#10B981', icone: <Eye size={16} /> },
          { label: 'Taux de clic', valeur: `${STATS_MOCK.taux_clic}%`, couleur: '#8B5CF6', icone: <ChevronRight size={16} /> },
          { label: 'Erreurs d\'envoi', valeur: STATS_MOCK.en_erreur.toString(), couleur: '#EF4444', icone: <AlertTriangle size={16} /> },
        ].map((k) => (
          <div key={k.label} className="bg-white dark:bg-white/03 rounded-2xl border border-gray-100 dark:border-white/08 p-5 flex items-start gap-4">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: k.couleur + '18' }}>
              <span style={{ color: k.couleur }}>{k.icone}</span>
            </div>
            <div>
              <p className="text-xs text-text-muted font-medium uppercase tracking-wide">{k.label}</p>
              <p className="text-2xl font-black text-text-main mt-0.5">{k.valeur}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Message test envoyé */}
      {testEnvoye && (
        <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl px-4 py-3 text-sm text-green-700 dark:text-green-300 flex items-center gap-2">
          <CheckCircle2 size={16} />
          Email de test « {TEMPLATES_INFO.find(t => t.id === testEnvoye)?.titre} » envoyé à {user?.email}
        </div>
      )}

      {/* Filtres par catégorie */}
      <div className="flex items-center gap-2 flex-wrap">
        {categoriesFiltres.map((cat) => (
          <button
            key={cat}
            onClick={() => setFiltreCategorie(cat)}
            className={clsx(
              'px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors',
              filtreCategorie === cat
                ? 'bg-primary text-sidebar'
                : 'bg-white dark:bg-white/05 text-text-muted border border-gray-200 dark:border-white/10 hover:border-primary hover:text-primary'
            )}
          >
            {cat === 'all' ? 'Tous' : CATEGORIE_LABEL[cat]}
          </button>
        ))}
      </div>

      {/* Grille templates */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {templatesFiltres.map((info) => (
          <TemplateCard
            key={info.id}
            info={info}
            actif={templates[info.id]}
            onToggle={() => toggleTemplate(info.id)}
            onPreview={() => setPreviewId(info.id)}
            onTest={() => envoyerTest(info.id)}
          />
        ))}
      </div>

      {/* Config SMTP */}
      <div className="bg-white dark:bg-white/03 rounded-2xl border border-gray-200 dark:border-white/10 p-6">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-white/08 flex items-center justify-center">
            <Mail size={16} className="text-text-muted" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-text-main">Configuration SMTP</h2>
            <p className="text-xs text-text-muted">Paramètres d'envoi des emails transactionnels</p>
          </div>
          <span className="ml-auto flex items-center gap-1.5 text-xs font-semibold text-[#009E00] bg-[#009E00]/10 px-2.5 py-1 rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-[#009E00] animate-pulse" />
            Connecté
          </span>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
          {[
            { label: 'Serveur SMTP', valeur: 'smtp.sendgrid.net' },
            { label: 'Port', valeur: '587 (TLS)' },
            { label: 'Expéditeur', valeur: 'noreply@gestmoney.ibigsoft.com' },
            { label: 'Nom affiché', valeur: 'GESTMONEY' },
          ].map((row) => (
            <div key={row.label} className="bg-gray-50 dark:bg-white/04 rounded-xl px-3 py-2.5">
              <p className="text-[10px] text-text-muted font-semibold uppercase tracking-wide">{row.label}</p>
              <p className="text-xs font-mono text-text-main mt-1 truncate">{row.valeur}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
