'use client';
import { TIERS, formatRM } from './engine';

// ── Slider ──────────────────────────────────────────────────────────
export function Slider({ label, value, onChange, min, max, step, unit, hint }) {
  return (
    <div className="mb-3.5">
      <div className="flex justify-between items-baseline mb-0.5">
        <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">{label}</span>
        <span className="font-mono text-[13px] font-bold text-slate-100">{value}{unit}</span>
      </div>
      {hint && <div className="text-[9px] text-slate-500 mb-0.5 leading-tight">{hint}</div>}
      <input type="range" min={min} max={max} step={step} value={value}
        onChange={e => onChange(parseFloat(e.target.value))} className="w-full" />
      <div className="flex justify-between text-[8px] text-slate-600 font-mono mt-0.5">
        <span>{min}{unit}</span><span>{max}{unit}</span>
      </div>
    </div>
  );
}

// ── Metric Card ─────────────────────────────────────────────────────
export function Metric({ label, value, sub, color }) {
  return (
    <div className="bg-gradient-to-br from-[#0F172A] to-[#1E293B]/40 border border-[#1E293B] rounded-xl p-3 flex-1 min-w-[130px]">
      <div className="text-[9px] text-slate-500 uppercase tracking-widest font-semibold mb-1">{label}</div>
      <div className="font-mono text-lg font-extrabold leading-tight" style={{ color: color || '#F1F5F9' }}>{value}</div>
      {sub && <div className="text-[9px] text-slate-500 mt-1 leading-tight">{sub}</div>}
    </div>
  );
}

// ── Tier Badge ──────────────────────────────────────────────────────
export function TierBadge({ tier }) {
  const c = { enhanced:{l:'Enhanced',fg:'#059669',bg:'#064E3B'}, adequate:{l:'Adequate',fg:'#2563EB',bg:'#1E3A5F'},
              basic:{l:'Basic',fg:'#D97706',bg:'#78350F'}, below:{l:'Below Basic',fg:'#EF4444',bg:'#7F1D1D'} }[tier];
  return <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold" style={{color:c.fg,background:c.bg}}>{c.l}</span>;
}

// ── Preset Button ───────────────────────────────────────────────────
export function PresetBtn({ label, active, onClick, title }) {
  return (
    <button onClick={onClick} title={title}
      className={`px-2 py-1 rounded-md text-[9px] font-semibold border transition-all
        ${active ? 'border-blue-500 bg-blue-500/10 text-blue-400' : 'border-[#1E293B] bg-[#0F172A] text-slate-500 hover:border-slate-500 hover:text-slate-300'}`}>
      {label}
    </button>
  );
}

// ── SVG Trajectory Chart ────────────────────────────────────────────
export function TrajectoryChart({ trajectory, retireAge, compareTrajectory, mcPercentiles, mcAges, height: chartHeight = 300 }) {
  const width = 700, height = chartHeight;
  const pad = { top: 30, right: 20, bottom: 40, left: 68 };
  const cw = width - pad.left - pad.right;
  const ch = height - pad.top - pad.bottom;

  const allBal = [
    ...trajectory.map(t => t.balance),
    ...(compareTrajectory || []).map(t => t.balance),
    ...(mcPercentiles?.p90 || []).map(t => t.balance),
  ];
  const maxBal = Math.max(...allBal, TIERS.enhanced.amount * 1.1);
  const minAge = trajectory[0]?.age || 25;
  const maxAge = 80;

  const sx = (a) => pad.left + ((a - minAge) / (maxAge - minAge)) * cw;
  const sy = (b) => pad.top + ch - (b / maxBal) * ch;
  const makePath = (d) => d.map((t,i) => `${i===0?'M':'L'}${sx(t.age).toFixed(1)},${sy(t.balance).toFixed(1)}`).join(' ');
  const pathD = makePath(trajectory);
  const areaD = `${pathD} L${sx(trajectory[trajectory.length-1].age).toFixed(1)},${sy(0).toFixed(1)} L${sx(trajectory[0].age).toFixed(1)},${sy(0).toFixed(1)} Z`;

  const gridPcts = [0, 0.25, 0.5, 0.75, 1];
  const ages = [25,30,35,40,45,50,55,60,65,70,75,80].filter(a => a >= minAge);

  // MC fan area
  let mcFanPath90 = '', mcFanPath75 = '';
  if (mcPercentiles && mcAges) {
    const p10 = mcPercentiles.p10, p90 = mcPercentiles.p90;
    const p25 = mcPercentiles.p25, p75 = mcPercentiles.p75;
    const top90 = p90.map(t => `${sx(t.age).toFixed(1)},${sy(t.balance).toFixed(1)}`).join(' L');
    const bot10 = [...p10].reverse().map(t => `${sx(t.age).toFixed(1)},${sy(t.balance).toFixed(1)}`).join(' L');
    mcFanPath90 = `M${top90} L${bot10} Z`;
    const top75 = p75.map(t => `${sx(t.age).toFixed(1)},${sy(t.balance).toFixed(1)}`).join(' L');
    const bot25 = [...p25].reverse().map(t => `${sx(t.age).toFixed(1)},${sy(t.balance).toFixed(1)}`).join(' L');
    mcFanPath75 = `M${top75} L${bot25} Z`;
  }

  return (
    <svg viewBox={`0 0 ${width} ${height}`} style={{ width:'100%', height:'auto', display:'block' }}>
      <defs>
        <linearGradient id="af" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.2" />
          <stop offset="100%" stopColor="#3B82F6" stopOpacity="0.01" />
        </linearGradient>
        <linearGradient id="ls" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#60A5FA" />
          <stop offset="100%" stopColor="#2563EB" />
        </linearGradient>
      </defs>

      {gridPcts.map((p,i) => {
        const y = pad.top + ch * (1-p);
        return <g key={i}><line x1={pad.left} y1={y} x2={width-pad.right} y2={y} stroke="#1E293B" /><text x={pad.left-6} y={y+3} textAnchor="end" fill="#475569" fontSize="8" fontFamily="'JetBrains Mono'">{formatRM(maxBal*p)}</text></g>;
      })}
      {ages.map(a => <text key={a} x={sx(a)} y={height-10} textAnchor="middle" fill="#475569" fontSize="8" fontFamily="'JetBrains Mono'">{a}</text>)}
      <text x={width/2} y={height-1} textAnchor="middle" fill="#64748B" fontSize="9" fontFamily="'DM Sans'">Age</text>

      {Object.entries(TIERS).map(([k,t]) => {
        const y = sy(t.amount); if (y < pad.top || y > pad.top+ch) return null;
        return <g key={k}><line x1={pad.left} y1={y} x2={width-pad.right} y2={y} stroke={t.color} strokeWidth="1" strokeDasharray="6,4" opacity="0.55" />
          <text x={width-pad.right-4} y={y-4} textAnchor="end" fill={t.color} fontSize="8" fontWeight="600" fontFamily="'DM Sans'">{t.label} — {formatRM(t.amount)}</text></g>;
      })}

      <line x1={sx(retireAge)} y1={pad.top} x2={sx(retireAge)} y2={pad.top+ch} stroke="#F59E0B" strokeDasharray="4,4" opacity="0.4" />
      <text x={sx(retireAge)} y={pad.top-6} textAnchor="middle" fill="#F59E0B" fontSize="8" fontWeight="600">Retire</text>

      {/* MC fans */}
      {mcFanPath90 && <path d={mcFanPath90} fill="#3B82F6" opacity="0.06" />}
      {mcFanPath75 && <path d={mcFanPath75} fill="#3B82F6" opacity="0.1" />}
      {mcPercentiles?.p50 && <path d={makePath(mcPercentiles.p50)} fill="none" stroke="#60A5FA" strokeWidth="1" strokeDasharray="3,3" opacity="0.5" />}

      {compareTrajectory && <path d={makePath(compareTrajectory)} fill="none" stroke="#94A3B8" strokeWidth="1.5" strokeDasharray="6,4" opacity="0.5" />}

      <path d={areaD} fill="url(#af)" />
      <path d={pathD} fill="none" stroke="url(#ls)" strokeWidth="2.5" strokeLinejoin="round" />

      {(() => { const pt = trajectory.find(t=>t.age===retireAge); if(!pt) return null;
        return <circle cx={sx(pt.age)} cy={sy(pt.balance)} r="3.5" fill="#3B82F6" stroke="#0B1120" strokeWidth="2" />;
      })()}
    </svg>
  );
}

// ── Multi-line chart for cohorts ────────────────────────────────────
export function CohortChart({ cohortResults, retireAge }) {
  const width = 700, height = 320;
  const pad = { top: 20, right: 20, bottom: 40, left: 68 };
  const cw = width - pad.left - pad.right;
  const ch = height - pad.top - pad.bottom;

  let maxBal = TIERS.enhanced.amount * 0.5;
  cohortResults.forEach(cr => { cr.trajectory.forEach(t => { if(t.balance > maxBal) maxBal = t.balance; }); });
  maxBal *= 1.1;
  const minAge = 24, maxAge = 61;

  const sx = (a) => pad.left + ((a - minAge) / (maxAge - minAge)) * cw;
  const sy = (b) => pad.top + ch - (b / maxBal) * ch;

  return (
    <svg viewBox={`0 0 ${width} ${height}`} style={{ width:'100%', height:'auto', display:'block' }}>
      {[0,0.25,0.5,0.75,1].map((p,i) => {
        const y = pad.top+ch*(1-p);
        return <g key={i}><line x1={pad.left} y1={y} x2={width-pad.right} y2={y} stroke="#1E293B" /><text x={pad.left-6} y={y+3} textAnchor="end" fill="#475569" fontSize="8" fontFamily="'JetBrains Mono'">{formatRM(maxBal*p)}</text></g>;
      })}
      {[25,30,35,40,45,50,55,60].map(a => <text key={a} x={sx(a)} y={height-10} textAnchor="middle" fill="#475569" fontSize="8" fontFamily="'JetBrains Mono'">{a}</text>)}

      {Object.entries(TIERS).map(([k,t]) => {
        const y = sy(t.amount); if (y < pad.top || y > pad.top+ch) return null;
        return <g key={k}><line x1={pad.left} y1={y} x2={width-pad.right} y2={y} stroke={t.color} strokeDasharray="5,3" opacity="0.4" /><text x={width-pad.right-3} y={y-3} textAnchor="end" fill={t.color} fontSize="7" fontWeight="600">{t.label}</text></g>;
      })}

      {cohortResults.map((cr, i) => {
        const accum = cr.trajectory.filter(t => t.age <= retireAge);
        const d = accum.map((t,j) => `${j===0?'M':'L'}${sx(t.age).toFixed(1)},${sy(t.balance).toFixed(1)}`).join(' ');
        return <path key={i} d={d} fill="none" stroke={cr.color} strokeWidth="2" opacity="0.85" />;
      })}
    </svg>
  );
}

// ── Tier Distribution Bar ───────────────────────────────────────────
export function TierDistBar({ distribution }) {
  const segments = [
    { key:'below', pct: distribution.below, color:'#EF4444', label:'Below' },
    { key:'basic', pct: distribution.basic, color:'#D97706', label:'Basic' },
    { key:'adequate', pct: distribution.adequate, color:'#2563EB', label:'Adequate' },
    { key:'enhanced', pct: distribution.enhanced, color:'#059669', label:'Enhanced' },
  ];
  return (
    <div>
      <div className="flex rounded-lg overflow-hidden h-6 bg-[#1E293B]">
        {segments.map(s => s.pct > 0 && (
          <div key={s.key} style={{ width:`${s.pct}%`, background:s.color }} className="flex items-center justify-center">
            {s.pct >= 8 && <span className="text-[9px] font-bold text-white/90">{s.pct}%</span>}
          </div>
        ))}
      </div>
      <div className="flex gap-3 mt-1.5">
        {segments.map(s => (
          <span key={s.key} className="text-[9px] text-slate-500 flex items-center gap-1">
            <span className="w-2 h-2 rounded-sm inline-block" style={{background:s.color}} />{s.label} {s.pct}%
          </span>
        ))}
      </div>
    </div>
  );
}
