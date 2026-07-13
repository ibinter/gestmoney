'use client';
import React, { useState } from 'react';

const PROVIDERS = [
  { id: 'groq', nom: 'Groq (LLaMA)', logo: '⚡', modeles: ['llama-3.3-70b-versatile', 'llama-3.1-8b-instant', 'mixtral-8x7b-32768'], statut: 'ACTIF', latenceMoy: 280, tokensTotal: 1_240_000 },
  { id: 'openai', nom: 'OpenAI', logo: '🟢', modeles: ['gpt-4o', 'gpt-4o-mini', 'gpt-3.5-turbo'], statut: 'STANDBY', latenceMoy: 520, tokensTotal: 320_000 },
  { id: 'anthropic', nom: 'Anthropic', logo: '🟡', modeles: ['claude-sonnet-5', 'claude-haiku-4-5-20251001'], statut: 'STANDBY', latenceMoy: 610, tokensTotal: 180_000 },
];

const CONVERSATIONS_RECENTES = [
  { id: '1', sessionId: 'sess_abc123', contexte: 'PUBLIC', messages: 12, tokens: 4_200, provider: 'groq', date: new Date(Date.now() - 5 * 60000).toISOString() },
  { id: '2', sessionId: 'sess_def456', contexte: 'SUPPORT', messages: 8, tokens: 2_800, provider: 'groq', date: new Date(Date.now() - 30 * 60000).toISOString() },
  { id: '3', sessionId: 'sess_ghi789', contexte: 'INTERNE', messages: 25, tokens: 9_100, provider: 'openai', date: new Date(Date.now() - 2 * 3600000).toISOString() },
];

const CONTEXTE_MAP: Record<string, { label: string; couleur: string }> = {
  PUBLIC: { label: '🌐 Public', couleur: '#0ea5e9' },
  INTERNE: { label: '🔒 Interne', couleur: '#8b5cf6' },
  SUPPORT: { label: '🎧 Support', couleur: '#f59e0b' },
};

const SYSTEM_PROMPT_DEFAULT = `Tu es SARA (Smart Automated Response Assistant), l'assistante intelligente de GESTMONEY, la plateforme de gestion Mobile Money éditée par IBIG Soft.

Tes missions :
- Présenter les fonctionnalités de GESTMONEY avec précision et enthousiasme
- Guider les prospects vers l'essai gratuit ou une démonstration
- Répondre aux questions sur les tarifs, les opérateurs supportés, la conformité OHADA
- Escalader vers un humain les questions complexes ou sensibles

Règles :
- Tu ne communiques jamais de données personnelles entre clients
- Tu ne t'engages jamais contractuellement au nom d'IBIG Soft
- Tu restes toujours professionnelle, concise et bienveillante
- En cas de doute, invite l'utilisateur à contacter l'équipe commerciale`;

export default function SaraConfigPage() {
  const [activeProvider, setActiveProvider] = useState('groq');
  const [activeModel, setActiveModel] = useState('llama-3.3-70b-versatile');
  const [temperature, setTemperature] = useState(0.7);
  const [maxTokens, setMaxTokens] = useState(2048);
  const [systemPrompt, setSystemPrompt] = useState(SYSTEM_PROMPT_DEFAULT);
  const [quotaJournalier, setQuotaJournalier] = useState(10000);
  const [quotaMensuel, setQuotaMensuel] = useState(300000);
  const [saved, setSaved] = useState(false);

  const provider = PROVIDERS.find(p => p.id === activeProvider)!;

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-black text-text-main">SARA — Configuration IA</h1>
        <p className="text-sm text-text-muted">Paramètres de l&apos;assistante intelligente GESTMONEY</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Colonne principale */}
        <div className="lg:col-span-2 space-y-5">
          {/* Fournisseur IA */}
          <div className="bg-white dark:bg-white/5 rounded-2xl border border-border p-5">
            <h2 className="text-base font-bold text-text-main mb-4">Fournisseur actif</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {PROVIDERS.map(p => (
                <button key={p.id} onClick={() => { setActiveProvider(p.id); setActiveModel(p.modeles[0]); }}
                  className={`rounded-2xl border-2 p-4 text-left transition-all ${activeProvider === p.id ? 'border-brand-green bg-green-50 dark:bg-green-900/20' : 'border-border bg-white dark:bg-white/5 hover:border-brand-green/50'}`}>
                  <div className="text-2xl mb-2">{p.logo}</div>
                  <p className="font-bold text-sm text-text-main">{p.nom}</p>
                  <p className="text-xs text-text-muted mt-1">{p.statut === 'ACTIF' ? '🟢 Actif' : '⚫ Standby'}</p>
                  <p className="text-xs text-text-muted mt-0.5">~{p.latenceMoy}ms</p>
                </button>
              ))}
            </div>
          </div>

          {/* Modèle */}
          <div className="bg-white dark:bg-white/5 rounded-2xl border border-border p-5">
            <h2 className="text-base font-bold text-text-main mb-4">Modèle</h2>
            <div className="flex flex-col gap-2">
              {provider.modeles.map(m => (
                <label key={m} className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer border transition-all ${activeModel === m ? 'border-brand-green bg-green-50 dark:bg-green-900/20' : 'border-border hover:border-brand-green/50'}`}>
                  <input type="radio" name="modele" value={m} checked={activeModel === m} onChange={() => setActiveModel(m)} className="accent-brand-green" />
                  <span className="font-mono text-sm text-text-main">{m}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Paramètres */}
          <div className="bg-white dark:bg-white/5 rounded-2xl border border-border p-5">
            <h2 className="text-base font-bold text-text-main mb-4">Paramètres de génération</h2>
            <div className="space-y-5">
              <div>
                <div className="flex justify-between mb-2">
                  <label className="text-sm font-semibold text-text-main">Température</label>
                  <span className="text-sm font-black tabular-nums text-brand-green">{temperature}</span>
                </div>
                <input type="range" min="0" max="2" step="0.05" value={temperature}
                  onChange={e => setTemperature(parseFloat(e.target.value))}
                  className="w-full accent-brand-green" />
                <div className="flex justify-between text-xs text-text-muted mt-1">
                  <span>Précis</span><span>Créatif</span>
                </div>
              </div>
              <div>
                <label className="text-sm font-semibold text-text-main block mb-2">Max tokens par réponse</label>
                <input type="number" value={maxTokens} onChange={e => setMaxTokens(+e.target.value)} min={256} max={8192} step={256}
                  className="w-full px-4 py-2.5 rounded-xl border border-border bg-white dark:bg-white/5 text-text-main text-sm outline-none focus:border-brand-green" />
              </div>
            </div>
          </div>

          {/* System Prompt */}
          <div className="bg-white dark:bg-white/5 rounded-2xl border border-border p-5">
            <div className="flex justify-between items-center mb-3">
              <h2 className="text-base font-bold text-text-main">Prompt système</h2>
              <button onClick={() => setSystemPrompt(SYSTEM_PROMPT_DEFAULT)}
                className="text-xs text-text-muted hover:text-brand-green font-semibold">↺ Réinitialiser</button>
            </div>
            <textarea value={systemPrompt} onChange={e => setSystemPrompt(e.target.value)} rows={10}
              className="w-full px-4 py-3 rounded-xl border border-border bg-white dark:bg-white/5 text-text-main text-sm font-mono outline-none focus:border-brand-green resize-y" />
            <p className="text-xs text-text-muted mt-2">{systemPrompt.length} caractères · {Math.ceil(systemPrompt.length / 4)} tokens estimés</p>
          </div>

          <button onClick={handleSave}
            className={`w-full py-3 rounded-2xl text-sm font-black transition-all ${saved ? 'bg-green-100 text-green-800 border border-green-300' : 'bg-brand-green text-white hover:bg-green-700'}`}>
            {saved ? '✓ Configuration sauvegardée !' : 'Sauvegarder la configuration'}
          </button>
        </div>

        {/* Colonne stats */}
        <div className="space-y-5">
          {/* Quotas */}
          <div className="bg-white dark:bg-white/5 rounded-2xl border border-border p-5">
            <h2 className="text-base font-bold text-text-main mb-4">Quotas</h2>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-1.5">
                  <span className="text-text-muted">Journalier</span>
                  <span className="font-bold">8 420 / {quotaJournalier.toLocaleString()}</span>
                </div>
                <div className="h-2 bg-gray-200 dark:bg-white/10 rounded-full overflow-hidden">
                  <div className="h-full rounded-full bg-brand-green" style={{ width: `${8420/quotaJournalier*100}%` }} />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1.5">
                  <span className="text-text-muted">Mensuel</span>
                  <span className="font-bold">124 000 / {quotaMensuel.toLocaleString()}</span>
                </div>
                <div className="h-2 bg-gray-200 dark:bg-white/10 rounded-full overflow-hidden">
                  <div className="h-full rounded-full bg-yellow-400" style={{ width: `${124000/quotaMensuel*100}%` }} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 pt-2">
                <div>
                  <label className="text-xs text-text-muted block mb-1">Quota journalier</label>
                  <input type="number" value={quotaJournalier} onChange={e => setQuotaJournalier(+e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-border bg-white dark:bg-white/5 text-text-main text-sm outline-none focus:border-brand-green" />
                </div>
                <div>
                  <label className="text-xs text-text-muted block mb-1">Quota mensuel</label>
                  <input type="number" value={quotaMensuel} onChange={e => setQuotaMensuel(+e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-border bg-white dark:bg-white/5 text-text-main text-sm outline-none focus:border-brand-green" />
                </div>
              </div>
            </div>
          </div>

          {/* Stats providers */}
          <div className="bg-white dark:bg-white/5 rounded-2xl border border-border p-5">
            <h2 className="text-base font-bold text-text-main mb-4">Usage par provider</h2>
            <div className="space-y-3">
              {PROVIDERS.map(p => (
                <div key={p.id} className="flex items-center gap-3">
                  <span className="text-xl">{p.logo}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between text-xs mb-1">
                      <span className="font-semibold text-text-main">{p.nom}</span>
                      <span className="text-text-muted tabular-nums">{(p.tokensTotal / 1000).toFixed(0)}k tokens</span>
                    </div>
                    <div className="h-1.5 bg-gray-200 dark:bg-white/10 rounded-full">
                      <div className="h-full rounded-full bg-brand-green"
                        style={{ width: `${p.tokensTotal / 1_500_000 * 100}%` }} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Conversations récentes */}
          <div className="bg-white dark:bg-white/5 rounded-2xl border border-border p-5">
            <h2 className="text-base font-bold text-text-main mb-4">Conversations récentes</h2>
            <div className="space-y-3">
              {CONVERSATIONS_RECENTES.map(c => (
                <div key={c.id} className="flex items-start justify-between gap-2 pb-3 border-b border-border last:border-0">
                  <div className="min-w-0">
                    <p className="text-xs font-mono text-text-muted truncate">{c.sessionId}</p>
                    <span className="text-xs font-semibold" style={{ color: CONTEXTE_MAP[c.contexte]?.couleur }}>
                      {CONTEXTE_MAP[c.contexte]?.label}
                    </span>
                    <p className="text-xs text-text-muted">{c.messages} msg · {c.tokens.toLocaleString()} tok</p>
                  </div>
                  <p className="text-xs text-text-muted flex-shrink-0">{new Date(c.date).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
