'use client';
import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Mail, Eye, ToggleLeft as ToggleIcon, Send, ChevronRight, CheckCircle2, AlertTriangle, BarChart2, Users, FileText, Zap } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { TEMPLATES_INFO, rendreDemoTemplate, TemplateId, TemplateInfo } from '@/lib/emailTemplates';
import { clsx } from 'clsx';
import { useT } from '@/lib/i18n';
import type { Translations } from '@/lib/i18n/fr';

const categorieLabel = (t: Translations): Record<string, string> => t.superadmin.emailsPage.categories;

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
  const t = useT();
  const [apercu, setApercu] = useState<'desktop' | 'mobile'>('desktop');
  const html = rendreDemoTemplate(templateId);
  // Séparation nette : TEMPLATES_INFO porte la STRUCTURE (catégorie,
  // variables disponibles), le dictionnaire porte le TEXTE affiché. Sans
  // cela la page restait en français même en anglais.
  const structure = TEMPLATES_INFO.find((tpl) => tpl.id === templateId)!;
  const info = t.superadmin.emailsPage.templates[templateId];

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-[#0e0e0e]">
      {/* Topbar preview */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-white/10 bg-[#111] flex-shrink-0">
        <div className="flex items-center gap-3">
          <button onClick={onFermer} className="text-gray-400 hover:text-white transition-colors text-sm flex items-center gap-1">
            {t.superadmin.emailsPage.back}
          </button>
          <span className="text-white/20">|</span>
          <span className="text-white text-sm font-medium">{info.titre}</span>
          <span className="text-[10px] text-gray-400 bg-white/08 px-2 py-0.5 rounded-full font-mono">{info.sujet}</span>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center bg-white/08 rounded-xl p-1 gap-1">
            {([['desktop', t.superadmin.emailsPage.desktop], ['mobile', t.superadmin.emailsPage.mobile]] as const).map(([mode, label]) => (
              <button
                key={mode}
                onClick={() => setApercu(mode)}
                className={clsx(
                  'px-3 py-1.5 rounded-lg text-xs font-medium transition-colors',
                  apercu === mode ? 'bg-white/15 text-white' : 'text-gray-300 hover:text-white hover:bg-white/10'
                )}
              >
                {label}
              </button>
            ))}
          </div>
          <button
            onClick={onFermer}
            className="text-gray-400 hover:text-white px-3 py-1.5 rounded-lg text-sm hover:bg-white/08 transition-colors"
          >
            {t.superadmin.emailsPage.close}
          </button>
        </div>
      </div>

      {/* Simulateur client email */}
      <div className="flex-1 overflow-auto bg-[#1a1a2e] flex flex-col items-center py-8 px-4">
        {/* En-tête simulé inbox */}
        <div className="w-full bg-[#22222e] rounded-t-xl border border-white/10 px-5 py-3 text-sm text-gray-400 flex items-center gap-4 transition-all duration-300" style={{ maxWidth: apercu === 'mobile' ? 380 : 620 }}>
          <span className="text-gray-500 text-xs">{t.superadmin.emailsPage.from}</span>
          <span className="text-gray-300 font-medium">GESTMONEY &lt;noreply@gestmoney.ibigsoft.com&gt;</span>
          <span className="text-gray-500 text-xs ml-auto">{t.superadmin.emailsPage.subject}</span>
          <span className="text-gray-300 truncate max-w-[200px] text-xs">{info.sujet}</span>
        </div>

        {/* Rendu HTML */}
        <div className="w-full border-x border-b border-white/10 rounded-b-xl overflow-hidden shadow-2xl transition-all duration-300" style={{ maxWidth: apercu === 'mobile' ? 380 : 620 }}>
          <iframe
            srcDoc={html}
            title={`${t.superadmin.emailsPage.previewTitle} ${info.titre}`}
            className="w-full border-0"
            style={{ height: '600px', background: '#F0F2F5' }}
            sandbox="allow-same-origin"
          />
        </div>

        {/* Infos */}
        <div className="w-full max-w-[620px] mt-4 bg-white/05 rounded-xl border border-white/10 p-4">
          <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider mb-2">{t.superadmin.emailsPage.availableVars}</p>
          <div className="flex flex-wrap gap-2">
            {structure.variables.map((v) => (
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
  const t = useT();
  const CATEGORIE_LABEL = categorieLabel(t);
  // `info` porte la structure (id, catégorie, variables) ; le texte affiché
  // vient du dictionnaire, sans quoi la carte resterait en français.
  const libelles = t.superadmin.emailsPage.templates[info.id];
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
            aria-label={actif ? t.superadmin.emailsPage.disable : t.superadmin.emailsPage.enable}
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

        <h3 className="text-sm font-bold text-text-main mb-1">{libelles.titre}</h3>
        <p className="text-xs text-text-muted leading-relaxed mb-3">{libelles.description}</p>

        <div className="flex items-center gap-2 text-xs text-text-muted">
          <Zap size={11} className="text-[#FFD000] flex-shrink-0" />
          <span className="truncate">{libelles.declencheur}</span>
        </div>
      </div>

      <div className="px-5 pb-4 flex items-center gap-2 border-t border-gray-100 dark:border-white/06 pt-3">
        <button
          onClick={onPreview}
          className="flex items-center gap-1.5 text-xs font-semibold text-primary hover:text-primary/80 transition-colors"
        >
          <Eye size={13} /> {t.superadmin.emailsPage.preview}
        </button>
        <span className="text-gray-200 dark:text-white/10">|</span>
        <button
          onClick={onTest}
          className="flex items-center gap-1.5 text-xs font-semibold text-text-muted hover:text-text-main transition-colors"
        >
          <Send size={13} /> {t.superadmin.emailsPage.sendTest}
        </button>
        <span className="ml-auto text-[10px] text-text-muted font-mono">{info.id}</span>
      </div>
    </div>
  );
}

// ─── Page principale ───────────────────────────────────────────────────────
export default function EmailsPage() {
  const t = useT();
  const CATEGORIE_LABEL = categorieLabel(t);
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
              <button onClick={() => router.push('/superadmin')} className="text-sm text-text-muted hover:text-text-main transition-colors">{t.superadmin.emailsPage.breadcrumb}</button>
              <ChevronRight size={14} className="text-text-muted" />
              <span className="text-sm font-semibold text-text-main">{t.superadmin.emailsPage.title}</span>
            </div>
            <p className="text-xs text-text-muted mt-0.5">{nbActifs}/{TEMPLATES_INFO.length} {t.superadmin.emailsPage.templatesActive}</p>
          </div>
        </div>

        <button
          className="flex items-center gap-2 bg-primary text-sidebar text-sm font-semibold px-4 py-2.5 rounded-xl hover:bg-primary/90 transition-colors"
          onClick={() => alert(t.superadmin.emailsPage.smtpAlert)}
        >
          <Mail size={15} />
          {t.superadmin.emailsPage.smtpButton}
        </button>
      </div>

      {/* KPIs email */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: t.superadmin.emailsPage.kpi.sent30d, valeur: STATS_MOCK.envoyes_30j.toLocaleString('fr-FR'), couleur: '#3B82F6', icone: <Mail size={16} /> },
          { label: t.superadmin.emailsPage.kpi.openRate, valeur: `${STATS_MOCK.taux_ouverture}%`, couleur: '#10B981', icone: <Eye size={16} /> },
          { label: t.superadmin.emailsPage.kpi.clickRate, valeur: `${STATS_MOCK.taux_clic}%`, couleur: '#8B5CF6', icone: <ChevronRight size={16} /> },
          { label: t.superadmin.emailsPage.kpi.errors, valeur: STATS_MOCK.en_erreur.toString(), couleur: '#EF4444', icone: <AlertTriangle size={16} /> },
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
          {t.superadmin.emailsPage.testSentPrefix} {TEMPLATES_INFO.find((tpl) => tpl.id === testEnvoye)?.titre} {t.superadmin.emailsPage.testSentSuffix} {user?.email}
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
            {cat === 'all' ? t.superadmin.emailsPage.all : CATEGORIE_LABEL[cat]}
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
            <h2 className="text-sm font-bold text-text-main">{t.superadmin.emailsPage.smtpTitle}</h2>
            <p className="text-xs text-text-muted">{t.superadmin.emailsPage.smtpSub}</p>
          </div>
          <span className="ml-auto flex items-center gap-1.5 text-xs font-semibold text-[#009E00] bg-[#009E00]/10 px-2.5 py-1 rounded-full">
            <span className="w-1.5 h-1.5 rounded-full bg-[#009E00] animate-pulse" />
            {t.superadmin.emailsPage.connected}
          </span>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
          {[
            { label: t.superadmin.emailsPage.smtpFields.server, valeur: 'smtp.sendgrid.net' },
            { label: t.superadmin.emailsPage.smtpFields.port, valeur: '587 (TLS)' },
            { label: t.superadmin.emailsPage.smtpFields.sender, valeur: 'noreply@gestmoney.ibigsoft.com' },
            { label: t.superadmin.emailsPage.smtpFields.displayName, valeur: 'GESTMONEY' },
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
