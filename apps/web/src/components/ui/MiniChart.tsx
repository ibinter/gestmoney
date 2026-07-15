'use client';
// ============================================================
// MINI CHART (SPARKLINE SVG) — GESTMONEY
// Graphique sparkline minimaliste sans dépendance externe
// ============================================================
import React from 'react';

interface MiniChartProps {
  data: number[];
  color?: string;
  /** Largeur en pixels. Si omis, le SVG s'étend en 100% via CSS. */
  width?: number;
  height?: number;
  /** Afficher l'area fill sous la courbe */
  fill?: boolean;
  /** Afficher le dot final */
  showDot?: boolean;
  className?: string;
}

export function MiniChart({
  data,
  color = '#009E00',
  width,
  height = 40,
  fill = true,
  showDot = true,
  className,
}: MiniChartProps) {
  if (!data || data.length < 2) return null;

  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;

  // En mode full-width (width absent), on utilise un viewBox fixe de 300
  const svgWidth = width ?? 300;
  const pad = 2;
  const w = svgWidth - pad * 2;
  const h = height - pad * 2;

  // Normalise une valeur en coordonnée Y (inversé : 0 = haut)
  const fy = (v: number) => pad + h - ((v - min) / range) * h;
  const fx = (i: number) => pad + (i / (data.length - 1)) * w;

  // Construit la polyline
  const points = data.map((v, i) => `${fx(i)},${fy(v)}`).join(' ');

  // Construit le path de l'area fill
  const lastX = fx(data.length - 1);
  const firstX = fx(0);
  const bottom = pad + h;
  const areaPath = [
    `M${firstX},${bottom}`,
    ...data.map((v, i) => `L${fx(i)},${fy(v)}`),
    `L${lastX},${bottom}`,
    'Z',
  ].join(' ');

  const dotX = fx(data.length - 1);
  const dotY = fy(data[data.length - 1]);

  const fillId = `fill-${color.replace('#', '')}-${width}`;

  return (
    <svg
      width={width ?? '100%'}
      height={height}
      viewBox={`0 0 ${svgWidth} ${height}`}
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={fillId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity={0.25} />
          <stop offset="100%" stopColor={color} stopOpacity={0.02} />
        </linearGradient>
      </defs>

      {/* Area fill */}
      {fill && (
        <path d={areaPath} fill={`url(#${fillId})`} />
      )}

      {/* Line */}
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Dot final */}
      {showDot && (
        <>
          <circle cx={dotX} cy={dotY} r={3} fill="white" stroke={color} strokeWidth={1.5} />
        </>
      )}
    </svg>
  );
}

// ─── Variante avec labels ────────────────────────────────────────────────────

interface SparklineWithLabelProps extends MiniChartProps {
  label?: string;
  value?: string;
}

export function SparklineWithLabel({ label, value, ...chartProps }: SparklineWithLabelProps) {
  return (
    <div className="flex items-end justify-between gap-2">
      {(label || value) && (
        <div className="min-w-0">
          {label && <p className="text-xs text-gray-500 truncate">{label}</p>}
          {value && <p className="text-sm font-semibold text-text-main tabular-nums">{value}</p>}
        </div>
      )}
      <MiniChart {...chartProps} />
    </div>
  );
}
