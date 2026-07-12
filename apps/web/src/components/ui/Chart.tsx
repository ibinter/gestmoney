'use client';
// ============================================================
// COMPOSANTS GRAPHIQUES SVG — GESTMONEY
// ============================================================
import React, { useState } from 'react';

// ——————————————————————————————————————
// BarChart
// ——————————————————————————————————————
interface BarChartProps {
  data: number[];
  labels: string[];
  color?: string;
  height?: number;
}

export function BarChart({ data, labels, color = '#F5B800', height = 200 }: BarChartProps) {
  const [tooltip, setTooltip] = useState<{ idx: number; x: number; y: number } | null>(null);
  const max = Math.max(...data, 1);
  const padding = { top: 16, right: 16, bottom: 36, left: 48 };
  const viewW = 600;
  const viewH = height + padding.top + padding.bottom;
  const chartW = viewW - padding.left - padding.right;
  const chartH = height;
  const barCount = data.length;
  const barGap = 8;
  const barW = Math.max((chartW - barGap * (barCount - 1)) / barCount, 8);

  // Grid lines
  const gridLines = [0, 0.25, 0.5, 0.75, 1].map((r) => chartH - r * chartH);

  return (
    <div className="relative w-full" style={{ userSelect: 'none' }}>
      <svg
        viewBox={`0 0 ${viewW} ${viewH}`}
        className="w-full"
        style={{ overflow: 'visible' }}
        aria-label="Graphique en barres"
        role="img"
      >
        <g transform={`translate(${padding.left},${padding.top})`}>
          {/* Grid */}
          {gridLines.map((y, i) => (
            <line key={i} x1={0} y1={y} x2={chartW} y2={y} stroke="#e5e7eb" strokeWidth={1} />
          ))}

          {/* Axes labels Y */}
          {[0, 0.25, 0.5, 0.75, 1].map((r, i) => (
            <text
              key={i}
              x={-8}
              y={chartH - r * chartH + 4}
              textAnchor="end"
              fontSize={10}
              fill="#9ca3af"
            >
              {Math.round(max * r).toLocaleString('fr-FR')}
            </text>
          ))}

          {/* Barres */}
          {data.map((val, idx) => {
            const barH = (val / max) * chartH;
            const x = idx * (barW + barGap);
            const y = chartH - barH;
            return (
              <g key={idx}>
                <rect
                  x={x}
                  y={y}
                  width={barW}
                  height={barH}
                  fill={color}
                  rx={4}
                  opacity={tooltip?.idx === idx ? 1 : 0.85}
                  className="cursor-pointer"
                  onMouseEnter={() => setTooltip({ idx, x: x + barW / 2, y })}
                  onMouseLeave={() => setTooltip(null)}
                />
                {/* Label X */}
                <text
                  x={x + barW / 2}
                  y={chartH + 20}
                  textAnchor="middle"
                  fontSize={10}
                  fill="#6b7280"
                >
                  {labels[idx] ?? ''}
                </text>
              </g>
            );
          })}

          {/* Tooltip */}
          {tooltip !== null && (
            <g>
              <rect
                x={tooltip.x - 36}
                y={tooltip.y - 32}
                width={72}
                height={24}
                rx={6}
                fill="#1f2937"
                opacity={0.9}
              />
              <text
                x={tooltip.x}
                y={tooltip.y - 15}
                textAnchor="middle"
                fontSize={11}
                fill="white"
              >
                {data[tooltip.idx].toLocaleString('fr-FR')}
              </text>
            </g>
          )}
        </g>
      </svg>
    </div>
  );
}

// ——————————————————————————————————————
// LineChart
// ——————————————————————————————————————
interface LineChartProps {
  data: number[];
  labels: string[];
  color?: string;
  height?: number;
}

export function LineChart({ data, labels, color = '#F5B800', height = 200 }: LineChartProps) {
  const [tooltip, setTooltip] = useState<{ idx: number } | null>(null);
  const max = Math.max(...data, 1);
  const min = Math.min(...data, 0);
  const range = max - min || 1;
  const padding = { top: 16, right: 16, bottom: 36, left: 48 };
  const viewW = 600;
  const viewH = height + padding.top + padding.bottom;
  const chartW = viewW - padding.left - padding.right;
  const chartH = height;

  const toX = (idx: number) => (idx / (data.length - 1)) * chartW;
  const toY = (val: number) => chartH - ((val - min) / range) * chartH;

  const polyPoints = data.map((v, i) => `${toX(i)},${toY(v)}`).join(' ');
  const areaPoints = [
    `0,${chartH}`,
    ...data.map((v, i) => `${toX(i)},${toY(v)}`),
    `${chartW},${chartH}`,
  ].join(' ');

  return (
    <div className="relative w-full">
      <svg viewBox={`0 0 ${viewW} ${viewH}`} className="w-full" aria-label="Graphique en courbe" role="img">
        <defs>
          <linearGradient id="lineGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity={0.25} />
            <stop offset="100%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <g transform={`translate(${padding.left},${padding.top})`}>
          {/* Grid */}
          {[0, 0.25, 0.5, 0.75, 1].map((r, i) => (
            <line key={i} x1={0} y1={chartH - r * chartH} x2={chartW} y2={chartH - r * chartH} stroke="#e5e7eb" strokeWidth={1} />
          ))}

          {/* Labels Y */}
          {[0, 0.25, 0.5, 0.75, 1].map((r, i) => (
            <text key={i} x={-8} y={chartH - r * chartH + 4} textAnchor="end" fontSize={10} fill="#9ca3af">
              {Math.round(min + range * r).toLocaleString('fr-FR')}
            </text>
          ))}

          {/* Area */}
          <polygon points={areaPoints} fill="url(#lineGrad)" />

          {/* Line */}
          <polyline points={polyPoints} fill="none" stroke={color} strokeWidth={2.5} strokeLinejoin="round" strokeLinecap="round" />

          {/* Points */}
          {data.map((val, idx) => (
            <g key={idx}>
              <circle
                cx={toX(idx)}
                cy={toY(val)}
                r={tooltip?.idx === idx ? 6 : 4}
                fill={color}
                stroke="white"
                strokeWidth={2}
                className="cursor-pointer"
                onMouseEnter={() => setTooltip({ idx })}
                onMouseLeave={() => setTooltip(null)}
              />
              <text x={toX(idx)} y={chartH + 20} textAnchor="middle" fontSize={10} fill="#6b7280">
                {labels[idx] ?? ''}
              </text>
              {tooltip?.idx === idx && (
                <g>
                  <rect x={toX(idx) - 36} y={toY(val) - 32} width={72} height={24} rx={6} fill="#1f2937" opacity={0.9} />
                  <text x={toX(idx)} y={toY(val) - 15} textAnchor="middle" fontSize={11} fill="white">
                    {val.toLocaleString('fr-FR')}
                  </text>
                </g>
              )}
            </g>
          ))}
        </g>
      </svg>
    </div>
  );
}

// ——————————————————————————————————————
// DonutChart
// ——————————————————————————————————————
interface DonutSegment {
  label: string;
  value: number;
  color: string;
}

interface DonutChartProps {
  segments: DonutSegment[];
  size?: number;
  thickness?: number;
}

export function DonutChart({ segments, size = 200, thickness = 40 }: DonutChartProps) {
  const [hovered, setHovered] = useState<number | null>(null);
  const total = segments.reduce((s, seg) => s + seg.value, 0) || 1;
  const cx = size / 2;
  const cy = size / 2;
  const r = size / 2 - thickness / 2 - 4;

  // Calculer les arcs
  let cumAngle = -Math.PI / 2; // partir du haut
  const paths = segments.map((seg, idx) => {
    const angle = (seg.value / total) * 2 * Math.PI;
    const startAngle = cumAngle;
    const endAngle = cumAngle + angle;
    cumAngle = endAngle;

    const x1 = cx + r * Math.cos(startAngle);
    const y1 = cy + r * Math.sin(startAngle);
    const x2 = cx + r * Math.cos(endAngle);
    const y2 = cy + r * Math.sin(endAngle);
    const largeArc = angle > Math.PI ? 1 : 0;

    const d = [
      `M ${x1} ${y1}`,
      `A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2}`,
    ].join(' ');

    return { d, seg, idx, midAngle: startAngle + angle / 2 };
  });

  const hoveredSeg = hovered !== null ? segments[hovered] : null;

  return (
    <div className="flex items-center gap-6 flex-wrap">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-label="Graphique donut" role="img">
        {paths.map(({ d, seg, idx, midAngle }) => {
          const isHovered = hovered === idx;
          // décalage léger au hover
          const offset = isHovered ? 6 : 0;
          const dx = Math.cos(midAngle) * offset;
          const dy = Math.sin(midAngle) * offset;
          return (
            <path
              key={idx}
              d={d}
              fill="none"
              stroke={seg.color}
              strokeWidth={isHovered ? thickness + 4 : thickness}
              strokeLinecap="butt"
              transform={`translate(${dx}, ${dy})`}
              className="cursor-pointer transition-all duration-150"
              onMouseEnter={() => setHovered(idx)}
              onMouseLeave={() => setHovered(null)}
            />
          );
        })}
        {/* Centre texte */}
        <text x={cx} y={cy - 8} textAnchor="middle" fontSize={14} fontWeight={700} fill="#1f2937">
          {hoveredSeg
            ? `${Math.round((hoveredSeg.value / total) * 100)}%`
            : `${segments.length}`}
        </text>
        <text x={cx} y={cy + 12} textAnchor="middle" fontSize={11} fill="#6b7280">
          {hoveredSeg ? hoveredSeg.label : 'opérateurs'}
        </text>
      </svg>

      {/* Légende */}
      <div className="flex flex-col gap-2">
        {segments.map((seg, idx) => (
          <div
            key={idx}
            className="flex items-center gap-2 text-sm cursor-pointer"
            onMouseEnter={() => setHovered(idx)}
            onMouseLeave={() => setHovered(null)}
          >
            <span className="inline-block w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: seg.color }} />
            <span className="text-text-main font-medium">{seg.label}</span>
            <span className="text-text-muted">
              {Math.round((seg.value / total) * 100)}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
