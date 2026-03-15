'use client';

import { TIERS, formatRM } from './simulation';

export default function TrajectoryChart({ trajectory, retireAge, compareTrajectory }) {
  const width = 720;
  const height = 340;
  const pad = { top: 32, right: 24, bottom: 44, left: 72 };
  const cw = width - pad.left - pad.right;
  const ch = height - pad.top - pad.bottom;

  const allBal = [...trajectory.map(t => t.balance), ...(compareTrajectory || []).map(t => t.balance)];
  const maxBal = Math.max(...allBal, TIERS.enhanced.amount * 1.15);
  const minAge = trajectory[0]?.age || 25;
  const maxAge = 80;

  const sx = (age) => pad.left + ((age - minAge) / (maxAge - minAge)) * cw;
  const sy = (bal) => pad.top + ch - (bal / maxBal) * ch;

  const makePath = (data) => data.map((t, i) => `${i === 0 ? 'M' : 'L'}${sx(t.age).toFixed(1)},${sy(t.balance).toFixed(1)}`).join(' ');
  const pathD = makePath(trajectory);
  const areaD = `${pathD} L${sx(trajectory[trajectory.length - 1].age).toFixed(1)},${sy(0).toFixed(1)} L${sx(trajectory[0].age).toFixed(1)},${sy(0).toFixed(1)} Z`;

  const gridPcts = [0, 0.25, 0.5, 0.75, 1];
  const ageMarkers = [25, 30, 35, 40, 45, 50, 55, 60, 65, 70, 75, 80].filter(a => a >= minAge);
  const retireX = sx(retireAge);

  return (
    <svg viewBox={`0 0 ${width} ${height}`} style={{ width: '100%', height: 'auto', display: 'block' }}>
      <defs>
        <linearGradient id="areaFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.2" />
          <stop offset="100%" stopColor="#3B82F6" stopOpacity="0.01" />
        </linearGradient>
        <linearGradient id="lineStroke" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#60A5FA" />
          <stop offset="50%" stopColor="#3B82F6" />
          <stop offset="100%" stopColor="#2563EB" />
        </linearGradient>
      </defs>

      {/* Grid */}
      {gridPcts.map((pct, i) => {
        const y = pad.top + ch * (1 - pct);
        return (
          <g key={i}>
            <line x1={pad.left} y1={y} x2={width - pad.right} y2={y} stroke="#1E293B" strokeWidth="1" />
            <text x={pad.left - 8} y={y + 3} textAnchor="end" fill="#475569" fontSize="9" fontFamily="'JetBrains Mono', monospace">
              {formatRM(maxBal * pct)}
            </text>
          </g>
        );
      })}

      {/* Age axis */}
      {ageMarkers.map(a => (
        <text key={a} x={sx(a)} y={height - 10} textAnchor="middle" fill="#475569" fontSize="9" fontFamily="'JetBrains Mono', monospace">{a}</text>
      ))}
      <text x={width / 2} y={height - 0} textAnchor="middle" fill="#64748B" fontSize="10" fontFamily="'DM Sans', sans-serif">Age</text>

      {/* RIA Tier lines */}
      {Object.entries(TIERS).map(([key, t]) => {
        const y = sy(t.amount);
        if (y < pad.top || y > pad.top + ch) return null;
        return (
          <g key={key}>
            <line x1={pad.left} y1={y} x2={width - pad.right} y2={y} stroke={t.color} strokeWidth="1" strokeDasharray="6,4" opacity="0.65" />
            <text x={width - pad.right - 4} y={y - 5} textAnchor="end" fill={t.color} fontSize="9" fontWeight="600" fontFamily="'DM Sans', sans-serif">
              {t.label} — {formatRM(t.amount)}
            </text>
          </g>
        );
      })}

      {/* Retirement marker */}
      <line x1={retireX} y1={pad.top} x2={retireX} y2={pad.top + ch} stroke="#F59E0B" strokeWidth="1" strokeDasharray="4,4" opacity="0.5" />
      <text x={retireX} y={pad.top - 8} textAnchor="middle" fill="#F59E0B" fontSize="9" fontFamily="'DM Sans', sans-serif" fontWeight="600">
        Retire
      </text>

      {/* Comparison line */}
      {compareTrajectory && (
        <path d={makePath(compareTrajectory)} fill="none" stroke="#94A3B8" strokeWidth="1.5" strokeDasharray="6,4" opacity="0.5" />
      )}

      {/* Main trajectory */}
      <path d={areaD} fill="url(#areaFill)" />
      <path d={pathD} fill="none" stroke="url(#lineStroke)" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />

      {/* Retirement balance dot */}
      {(() => {
        const pt = trajectory.find(t => t.age === retireAge);
        if (!pt) return null;
        return <circle cx={sx(pt.age)} cy={sy(pt.balance)} r="4" fill="#3B82F6" stroke="#0B1120" strokeWidth="2" />;
      })()}
    </svg>
  );
}
