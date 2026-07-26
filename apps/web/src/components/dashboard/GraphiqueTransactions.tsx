'use client';
// ============================================================
// GraphiqueTransactions — Courbe 30 jours (Recharts)
// Affiche nombre de transactions + volume journalier
// ============================================================
import React from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import type { JourStat } from '@/hooks/useAnalytics';

interface Props {
  data: JourStat[];
}

function formatDateCourte(iso: string): string {
  const d = new Date(iso);
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function formatVolume(v: number): string {
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000) return `${(v / 1_000).toFixed(0)}k`;
  return String(v);
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload || payload.length === 0) return null;
  return (
    <div style={{
      background: 'var(--gm-surface, #fff)',
      border: '1px solid var(--gm-border, #e5e7eb)',
      borderRadius: 10,
      padding: '10px 14px',
      fontSize: 13,
      boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
    }}>
      <div style={{ fontWeight: 700, marginBottom: 6, color: 'var(--gm-text)' }}>{label}</div>
      {payload.map((p: any) => (
        <div key={p.dataKey} style={{ color: p.color, marginBottom: 2 }}>
          {p.name} : <strong>{p.dataKey === 'volume'
            ? `${Number(p.value).toLocaleString('fr-FR')} XOF`
            : p.value}</strong>
        </div>
      ))}
    </div>
  );
};

export function GraphiqueTransactions({ data }: Props) {
  // Afficher 1 tick sur 5 pour ne pas surcharger l'axe X
  const chartData = data.map((d) => ({
    ...d,
    label: formatDateCourte(d.date),
  }));

  return (
    <div className="gm-section-card" style={{ marginBottom: 24 }}>
      <div className="gm-section-head">
        <div>
          <div className="gm-section-title">Activité transactionnelle — 30 derniers jours</div>
          <div className="gm-section-sub">Nombre de transactions et volume (XOF) par jour</div>
        </div>
      </div>
      <div style={{ padding: '8px 12px 16px' }}>
        <ResponsiveContainer width="100%" height={220}>
          <LineChart data={chartData} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--gm-border, #f0f0f0)" />
            <XAxis
              dataKey="label"
              tick={{ fontSize: 10, fill: 'var(--gm-text-2, #6b7280)' }}
              interval={4}
            />
            <YAxis
              yAxisId="left"
              tick={{ fontSize: 10, fill: 'var(--gm-text-2, #6b7280)' }}
              tickFormatter={(v) => String(v)}
              width={32}
            />
            <YAxis
              yAxisId="right"
              orientation="right"
              tick={{ fontSize: 10, fill: 'var(--gm-text-2, #6b7280)' }}
              tickFormatter={formatVolume}
              width={44}
            />
            <Tooltip content={<CustomTooltip />} />
            <Legend
              wrapperStyle={{ fontSize: 12, paddingTop: 8 }}
              formatter={(value) => value === 'count' ? 'Nb transactions' : 'Volume (XOF)'}
            />
            <Line
              yAxisId="left"
              type="monotone"
              dataKey="count"
              stroke="var(--gm-primary, #009E00)"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4 }}
              name="count"
            />
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="volume"
              stroke="#F5B800"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4 }}
              name="volume"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
