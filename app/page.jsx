'use client';

import { useState, useMemo, useCallback } from 'react';
import { TIERS, PRESETS, simulate, formatRM, getTierColor } from './components/simulation';
import TrajectoryChart from './components/Chart';

/* ── Slider ─────────────────────────────────────────────── */
function Slider({ label, value, onChange, min, max, step, unit, hint }) {
  return (
    <div className="mb-4">
      <div className="flex justify-between items-baseline mb-1">
        <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">{label}</span>
        <span className="font-mono text-[14px] font-bold text-slate-100">{value}{unit}</span>
      </div>
      {hint && <div className="text-[9px] text-slate-500 mb-1">{hint}</div>}
      <input type="range" min={min} max={max} step={step} value={value}
        onChange={e => onChange(parseFloat(e.target.value))} className="w-full" />
      <div className="flex justify-between text-[8px] text-slate-600 font-mono mt-0.5">
        <span>{min}{unit}</span><span>{max}{unit}</span>
      </div>
    </div>
  );
}

/* ── Metric Card ────────────────────────────────────────── */
function Metric({ label, value, sub, color }) {
  return (
    <div className="bg-gradient-to-br from-panel to-border/40 border border-border rounded-xl p-3.5 flex-1 min-w-[140px]">
      <div className="text-[9px] text-slate-500 uppercase tracking-widest font-semibold mb-1.5">{label}</div>
      <div className="font-mono text-xl font-extrabold leading-tight" style={{ color: color || '#F1F5F9' }}>{value}</div>
      {sub && <div className="text-[10px] text-slate-500 mt-1">{sub}</div>}
    </div>
  );
}

/* ── Tier Badge ─────────────────────────────────────────── */
function TierBadge({ tier }) {
  const c = {
    enhanced: { l: 'Enhanced',   fg: '#059669', bg: '#064E3B' },
    adequate: { l: 'Adequate',   fg: '#2563EB', bg: '#1E3A5F' },
    basic:    { l: 'Basic',      fg: '#D97706', bg: '#78350F' },
    below:    { l: 'Below Basic', fg: '#EF4444', bg: '#7F1D1D' },
  }[tier] || { l: 'Below Basic', fg: '#EF4444', bg: '#7F1D1D' };
  return (
    <span className="inline-block px-3 py-0.5 rounded-full text-[11px] font-bold tracking-wide"
      style={{ color: c.fg, background: c.bg }}>{c.l}</span>
  );
}

/* ── Preset Button ──────────────────────────────────────── */
function PresetBtn({ label, active, onClick, title }) {
  return (
    <button onClick={onClick} title={title}
      className={`px-2.5 py-1 rounded-md text-[10px] font-semibold border transition-all duration-150 
        ${active
          ? 'border-blue-500 bg-blue-500/10 text-blue-400'
          : 'border-border bg-panel text-slate-500 hover:border-slate-500 hover:text-slate-300'}`}>
      {label}
    </button>
  );
}

/* ── Main Page ──────────────────────────────────────────── */
export default function Home() {
  const [params, setParams] = useState({ ...PRESETS.baseline.values });
  const [compareKey, setCompareKey] = useState(null);
  const [activePreset, setActivePreset] = useState('baseline');

  const set = useCallback((k, v) => {
    setParams(p => ({ ...p, [k]: v }));
    setActivePreset(null);
  }, []);

  const result = useMemo(() => simulate(params), [params]);
  const compareResult = useMemo(() => compareKey ? simulate(PRESETS[compareKey].values) : null, [compareKey]);

  const applyPreset = (key) => {
    setParams({ ...PRESETS[key].values });
    setActivePreset(key);
    setCompareKey(null);
  };

  const tierColor = getTierColor(result.tier);

  return (
    <main className="min-h-screen bg-midnight">
      {/* ── Header ── */}
      <header className="bg-gradient-to-b from-panel to-midnight border-b border-border px-6 pt-5 pb-4">
        <div className="flex items-center gap-2.5 mb-1">
          <div className="w-2 h-2 rounded-full bg-blue-500" style={{ boxShadow: '0 0 8px rgba(59,130,246,0.5)' }} />
          <span className="text-[10px] text-slate-500 uppercase tracking-[0.14em] font-semibold">
            EPF Retirement Adequacy Simulation
          </span>
        </div>
        <h1 className="text-2xl font-extrabold tracking-tight bg-gradient-to-r from-slate-100 to-slate-400 bg-clip-text text-transparent">
          Policy Lever Scorecard
        </h1>
        <p className="text-[12px] text-slate-500 mt-1 max-w-2xl leading-relaxed">
          Interactive simulation under Malaysia&apos;s RIA Framework (2026). Toggle policy levers to compare savings
          trajectories against Basic (RM390K), Adequate (RM650K) and Enhanced (RM1.3M) thresholds.
          Drawdown anchored to Belanjawanku 2024/2025.
        </p>
      </header>

      <div className="flex flex-col lg:flex-row gap-5 p-5">
        {/* ── Left: Controls ── */}
        <aside className="w-full lg:w-[280px] flex-shrink-0 space-y-4">
          {/* Presets */}
          <div>
            <div className="text-[9px] text-slate-500 uppercase tracking-[0.12em] font-semibold mb-2">Quick Scenarios</div>
            <div className="flex flex-wrap gap-1.5">
              {Object.entries(PRESETS).map(([k, p]) => (
                <PresetBtn key={k} label={p.label} active={activePreset === k}
                  onClick={() => applyPreset(k)} title={p.desc} />
              ))}
            </div>
          </div>

          {/* Compare */}
          <div>
            <div className="text-[9px] text-slate-500 uppercase tracking-[0.12em] font-semibold mb-2">
              Compare Against <span className="text-slate-600">(dashed line)</span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {Object.entries(PRESETS).map(([k, p]) => (
                <PresetBtn key={k} label={p.label} active={compareKey === k}
                  onClick={() => setCompareKey(compareKey === k ? null : k)} title={p.desc} />
              ))}
            </div>
          </div>

          {/* Sliders */}
          <div className="bg-panel border border-border rounded-xl p-4">
            <div className="text-[9px] text-slate-500 uppercase tracking-[0.12em] font-semibold mb-4">Policy Levers</div>

            <Slider label="Retirement Age" value={params.retireAge} onChange={v => set('retireAge', v)}
              min={55} max={70} step={1} unit="" hint="Current: 60. Many nations moving to 65." />

            <Slider label="Employee Rate" value={params.empRate} onChange={v => set('empRate', v)}
              min={0} max={20} step={0.5} unit="%" hint="Statutory employee contribution rate" />

            <Slider label="Employer Rate" value={params.erRate} onChange={v => set('erRate', v)}
              min={0} max={20} step={0.5} unit="%" hint="Statutory employer contribution rate" />

            <Slider label="Wage Growth" value={params.wageGrowth} onChange={v => set('wageGrowth', v)}
              min={0} max={8} step={0.5} unit="% p.a." hint="Annual nominal wage growth" />

            <Slider label="EPF Dividend" value={params.dividendRate} onChange={v => set('dividendRate', v)}
              min={3} max={8} step={0.25} unit="% p.a." hint="Annual return on savings. 2024 actual: 6.30%" />

            <Slider label="Starting Salary" value={params.startSalary} onChange={v => set('startSalary', v)}
              min={1000} max={10000} step={100} unit=" RM/mo" hint="Monthly salary at career start" />

            <Slider label="Start Age" value={params.startAge} onChange={v => set('startAge', v)}
              min={18} max={40} step={1} unit="" hint="Age of first EPF contribution" />

            <Slider label="Inflation" value={params.inflation} onChange={v => set('inflation', v)}
              min={1} max={6} step={0.5} unit="% p.a." hint="Drives drawdown cost in retirement" />

            <div className="border-t border-border pt-4 mt-4">
              <div className="text-[9px] text-slate-500 uppercase tracking-[0.12em] font-semibold mb-3">Crisis Withdrawal Shock</div>

              <Slider label="Withdrawal Age" value={params.withdrawalAge} onChange={v => set('withdrawalAge', v)}
                min={0} max={55} step={1} unit="" hint="0 = none. Simulates crisis event (e.g. COVID)." />

              <Slider label="% Withdrawn" value={params.withdrawalPct} onChange={v => set('withdrawalPct', v)}
                min={0} max={50} step={5} unit="%" hint="Share of balance withdrawn at crisis" />
            </div>
          </div>
        </aside>

        {/* ── Right: Results ── */}
        <section className="flex-1 min-w-0 space-y-4">
          {/* Metrics row */}
          <div className="flex flex-wrap gap-3">
            <Metric label="Balance at Retirement" value={formatRM(result.balanceAtRetirement)}
              sub={`At age ${params.retireAge}`} color={tierColor} />
            <Metric label="RIA Tier Achieved" value={<TierBadge tier={result.tier} />}
              sub={result.tier === 'below' ? `Short by ${formatRM(TIERS.basic.amount - result.balanceAtRetirement)}`
                : result.tier === 'basic' ? `${formatRM(TIERS.adequate.amount - result.balanceAtRetirement)} to Adequate`
                : result.tier === 'adequate' ? `${formatRM(TIERS.enhanced.amount - result.balanceAtRetirement)} to Enhanced`
                : 'Financial independence achieved'} />
            <Metric label="Income Sustainability" value={`${result.yearsOfIncome} yrs`}
              sub="Post-retirement at Belanjawanku rate"
              color={result.yearsOfIncome >= 20 ? '#059669' : result.yearsOfIncome >= 10 ? '#D97706' : '#EF4444'} />
            {result.withdrawalLoss > 0 && (
              <Metric label="Compounded Loss" value={formatRM(result.withdrawalCompoundedLoss)}
                sub={`From ${formatRM(result.withdrawalLoss)} withdrawn at age ${params.withdrawalAge}`}
                color="#EF4444" />
            )}
          </div>

          {/* Chart */}
          <div className="bg-panel border border-border rounded-xl p-4">
            <div className="flex justify-between items-center mb-2 px-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                Savings Trajectory (Age {params.startAge}–80)
              </span>
              <div className="flex gap-4 text-[9px] text-slate-500">
                <span className="flex items-center gap-1.5">
                  <span className="inline-block w-3 h-0.5 bg-blue-500 rounded" /> Current
                </span>
                {compareResult && (
                  <span className="flex items-center gap-1.5">
                    <span className="inline-block w-3 h-0.5 bg-slate-400 rounded" style={{ borderTop: '1px dashed' }} /> Compare
                  </span>
                )}
              </div>
            </div>
            <TrajectoryChart
              trajectory={result.trajectory}
              retireAge={params.retireAge}
              compareTrajectory={compareResult?.trajectory}
            />
          </div>

          {/* Insight box */}
          <div className="bg-gradient-to-br from-panel to-border/30 border border-border rounded-xl p-4">
            <div className="text-[9px] text-slate-500 uppercase tracking-[0.12em] font-semibold mb-2">Key Insight</div>
            <p className="text-[13px] text-slate-300 leading-relaxed">
              {result.tier === 'below' && <>
                At current settings, this member <strong className="text-red-400">falls short of even the Basic threshold</strong> by {formatRM(TIERS.basic.amount - result.balanceAtRetirement)}.
                {' '}To reach Basic (RM390K), consider raising the retirement age to {Math.min(params.retireAge + 5, 70)} or increasing total contribution rates.
                {' '}A member in this position risks depleting all savings {result.yearsOfIncome < 20 ? `within ${result.yearsOfIncome} years of retirement` : 'before age 80'}.
              </>}
              {result.tier === 'basic' && <>
                This member reaches <strong className="text-amber-400">Basic savings</strong> — enough for essential needs but not a comfortable retirement.
                {' '}The gap to Adequate is {formatRM(TIERS.adequate.amount - result.balanceAtRetirement)}.
                {' '}Each additional year of work adds approximately {formatRM(Math.round(result.balanceAtRetirement / (params.retireAge - params.startAge) * 1.3))} through combined contributions and compounding.
              </>}
              {result.tier === 'adequate' && <>
                This member achieves <strong className="text-blue-400">Adequate savings</strong> — a reasonable standard of living in retirement.
                {' '}Monthly income starts at ~RM2,708 growing with dividends. The gap to Enhanced is {formatRM(TIERS.enhanced.amount - result.balanceAtRetirement)}.
              </>}
              {result.tier === 'enhanced' && <>
                This member reaches <strong className="text-emerald-400">Enhanced savings</strong> — supporting financial independence.
                {' '}Monthly income can start at ~RM5,417 in Year 1, rising to ~RM14,779 by Year 20.
                {' '}This member has significant buffer against unexpected costs.
              </>}
              {result.withdrawalLoss > 0 && <span className="text-amber-400">
                {' '}Note: The crisis withdrawal of {formatRM(result.withdrawalLoss)} at age {params.withdrawalAge} compounds into an estimated{' '}
                {formatRM(result.withdrawalCompoundedLoss)} of lost retirement savings due to forgone compound returns.
              </span>}
            </p>
          </div>

          {/* Methodology */}
          <p className="text-[9px] text-slate-700 leading-relaxed px-1">
            <strong>Methodology:</strong> Deterministic accumulation model. Contributions = (employee% + employer%) × annual salary.
            Returns compound annually at the dividend rate. Post-retirement drawdown anchored to Belanjawanku 2024/2025
            (RM2,690/mo for single elderly, Klang Valley) adjusted for inflation. RIA tier thresholds per EPF&apos;s framework
            effective January 2026. This is an illustrative simulation, not financial advice.
          </p>
        </section>
      </div>
    </main>
  );
}
