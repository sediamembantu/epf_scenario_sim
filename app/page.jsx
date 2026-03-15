'use client';
import { useState, useMemo, useCallback } from 'react';
import { TIERS, PRESETS, COHORTS, simulate, monteCarloSimulate, formatRM, getTierColor, BELANJAWANKU } from './components/engine';
import { Slider, Metric, TierBadge, PresetBtn, TrajectoryChart, CohortChart, TierDistBar } from './components/ui';

// ═══════════════════════════════════════════════════════════════════
// TAB 1: Policy Lever Scorecard
// ═══════════════════════════════════════════════════════════════════
function PolicyLeverTab() {
  const [params, setParams] = useState({ ...PRESETS.baseline.values });
  const [compareKey, setCompareKey] = useState(null);
  const [activePreset, setActivePreset] = useState('baseline');
  const [showMC, setShowMC] = useState(false);

  const set = useCallback((k, v) => { setParams(p => ({ ...p, [k]: v })); setActivePreset(null); }, []);
  const result = useMemo(() => simulate(params), [params]);
  const compareResult = useMemo(() => compareKey ? simulate(PRESETS[compareKey].values) : null, [compareKey]);
  const mcResult = useMemo(() => showMC ? monteCarloSimulate(params, { runs: 500, returnVol: 2, wageVol: 1.5 }) : null, [showMC, params]);

  const applyPreset = (k) => { setParams({ ...PRESETS[k].values }); setActivePreset(k); setCompareKey(null); };
  const tc = getTierColor(result.tier);

  return (
    <div className="flex flex-col lg:flex-row gap-5">
      {/* Controls */}
      <aside className="w-full lg:w-[260px] flex-shrink-0 space-y-3">
        <div>
          <div className="text-[9px] text-slate-500 uppercase tracking-[0.12em] font-semibold mb-1.5">Scenarios</div>
          <div className="flex flex-wrap gap-1">{Object.entries(PRESETS).map(([k,p])=><PresetBtn key={k} label={p.label} active={activePreset===k} onClick={()=>applyPreset(k)} title={p.desc}/>)}</div>
        </div>
        <div>
          <div className="text-[9px] text-slate-500 uppercase tracking-[0.12em] font-semibold mb-1.5">Compare <span className="text-slate-600">(dashed)</span></div>
          <div className="flex flex-wrap gap-1">{Object.entries(PRESETS).map(([k,p])=><PresetBtn key={k} label={p.label} active={compareKey===k} onClick={()=>setCompareKey(compareKey===k?null:k)} title={p.desc}/>)}</div>
        </div>

        <div className="bg-[#0F172A] border border-[#1E293B] rounded-xl p-3.5">
          <div className="text-[9px] text-slate-500 uppercase tracking-[0.12em] font-semibold mb-3">Your Profile</div>
          <Slider label="Current Age" value={params.currentAge} onChange={v=>set('currentAge',v)} min={18} max={58} step={1} unit="" hint="Your age today" />
          <Slider label="Current Balance" value={params.currentBalance} onChange={v=>set('currentBalance',v)} min={0} max={500000} step={5000} unit=" RM" hint="Current EPF balance (0 = new entrant)" />
          <Slider label="Current Salary" value={params.startSalary} onChange={v=>set('startSalary',v)} min={1000} max={15000} step={100} unit=" RM/mo" hint="Your current monthly salary" />

          <div className="border-t border-[#1E293B] pt-3 mt-3">
            <div className="text-[9px] text-slate-500 uppercase tracking-[0.12em] font-semibold mb-3">Policy Levers</div>
            <Slider label="Retirement Age" value={params.retireAge} onChange={v=>set('retireAge',v)} min={55} max={70} step={1} unit="" />
            <Slider label="Employee Rate" value={params.empRate} onChange={v=>set('empRate',v)} min={0} max={20} step={0.5} unit="%" />
            <Slider label="Employer Rate" value={params.erRate} onChange={v=>set('erRate',v)} min={0} max={20} step={0.5} unit="%" />
            <Slider label="Wage Growth" value={params.wageGrowth} onChange={v=>set('wageGrowth',v)} min={0} max={8} step={0.5} unit="% p.a." />
            <Slider label="EPF Dividend" value={params.dividendRate} onChange={v=>set('dividendRate',v)} min={3} max={8} step={0.25} unit="% p.a." />
            <Slider label="Inflation" value={params.inflation} onChange={v=>set('inflation',v)} min={1} max={6} step={0.5} unit="% p.a." />
          </div>

          <div className="border-t border-[#1E293B] pt-3 mt-3">
            <div className="text-[9px] text-slate-500 uppercase tracking-[0.12em] font-semibold mb-3">Crisis Shock</div>
            <Slider label="Withdrawal Age" value={params.withdrawalAge} onChange={v=>set('withdrawalAge',v)} min={0} max={55} step={1} unit="" hint="0 = none" />
            <Slider label="% Withdrawn" value={params.withdrawalPct} onChange={v=>set('withdrawalPct',v)} min={0} max={50} step={5} unit="%" />
          </div>
        </div>
      </aside>

      {/* Results */}
      <section className="flex-1 min-w-0 space-y-3">
        <div className="flex flex-wrap gap-2.5">
          <Metric label="Balance at Retirement" value={formatRM(result.balanceAtRetirement)} sub={`At age ${params.retireAge}`} color={tc} />
          <Metric label="RIA Tier" value={<TierBadge tier={result.tier}/>}
            sub={result.tier==='below'?`Short by ${formatRM(TIERS.basic.amount-result.balanceAtRetirement)}`
              :result.tier==='basic'?`${formatRM(TIERS.adequate.amount-result.balanceAtRetirement)} to Adequate`
              :result.tier==='adequate'?`${formatRM(TIERS.enhanced.amount-result.balanceAtRetirement)} to Enhanced`:'Financial independence'} />
          <Metric label="Income Sustainability" value={`${result.yearsOfIncome} yrs`} sub="Post-retire drawdown"
            color={result.yearsOfIncome>=20?'#059669':result.yearsOfIncome>=10?'#D97706':'#EF4444'} />
          {result.withdrawalLoss>0 && <Metric label="Compounded Loss" value={formatRM(result.withdrawalCompoundedLoss)}
            sub={`${formatRM(result.withdrawalLoss)} at age ${params.withdrawalAge}`} color="#EF4444" />}
        </div>

        {/* MC toggle */}
        <div className="flex items-center gap-2">
          <button onClick={()=>setShowMC(!showMC)}
            className={`px-3 py-1 rounded-md text-[10px] font-semibold border transition-all ${showMC?'border-purple-500 bg-purple-500/10 text-purple-400':'border-[#1E293B] bg-[#0F172A] text-slate-500 hover:text-slate-300'}`}>
            {showMC ? '✦ Monte Carlo ON' : '○ Monte Carlo OFF'}
          </button>
          {showMC && <span className="text-[9px] text-slate-500">500 runs · ±2% return vol · ±1.5% wage vol</span>}
        </div>

        {/* MC tier distribution */}
        {mcResult && (
          <div className="bg-[#0F172A] border border-[#1E293B] rounded-xl p-3">
            <div className="text-[9px] text-slate-500 uppercase tracking-[0.12em] font-semibold mb-2">Monte Carlo Tier Distribution ({mcResult.runs} simulations)</div>
            <TierDistBar distribution={mcResult.tierDistribution} />
            <div className="flex gap-4 mt-2 text-[10px] text-slate-400 font-mono">
              <span>P10: {formatRM(mcResult.p10)}</span>
              <span>Median: {formatRM(mcResult.median)}</span>
              <span>P90: {formatRM(mcResult.p90)}</span>
            </div>
          </div>
        )}

        <div className="bg-[#0F172A] border border-[#1E293B] rounded-xl p-3.5">
          <div className="flex justify-between items-center mb-1.5 px-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Savings Trajectory</span>
            <div className="flex gap-3 text-[8px] text-slate-500">
              <span className="flex items-center gap-1"><span className="w-3 h-0.5 bg-blue-500 rounded inline-block"/>Deterministic</span>
              {compareResult && <span className="flex items-center gap-1"><span className="w-3 h-0.5 bg-slate-400 rounded inline-block"/>Compare</span>}
              {showMC && <span className="flex items-center gap-1"><span className="w-3 h-1 bg-blue-500/20 rounded inline-block"/>MC P10–P90</span>}
            </div>
          </div>
          <TrajectoryChart trajectory={result.trajectory} retireAge={params.retireAge}
            compareTrajectory={compareResult?.trajectory}
            mcPercentiles={mcResult?.percentiles} mcAges={mcResult?.ages} />
        </div>

        <div className="bg-gradient-to-br from-[#0F172A] to-[#1E293B]/30 border border-[#1E293B] rounded-xl p-3.5">
          <div className="text-[9px] text-slate-500 uppercase tracking-[0.12em] font-semibold mb-1.5">Insight</div>
          <p className="text-[12px] text-slate-300 leading-relaxed">
            {result.tier==='below'&&<>At current settings, this member <strong className="text-red-400">falls short of Basic</strong> by {formatRM(TIERS.basic.amount-result.balanceAtRetirement)}. Consider raising retirement age or contribution rates.</>}
            {result.tier==='basic'&&<>Reaches <strong className="text-amber-400">Basic savings</strong> — essential needs covered. Gap to Adequate: {formatRM(TIERS.adequate.amount-result.balanceAtRetirement)}. Each extra working year adds ~{formatRM(Math.round(result.balanceAtRetirement/(params.retireAge-params.startAge)*1.3))}.</>}
            {result.tier==='adequate'&&<>Achieves <strong className="text-blue-400">Adequate savings</strong>. Monthly income ~RM2,708 rising with dividends. Gap to Enhanced: {formatRM(TIERS.enhanced.amount-result.balanceAtRetirement)}.</>}
            {result.tier==='enhanced'&&<>Reaches <strong className="text-emerald-400">Enhanced savings</strong> — financial independence. Monthly income ~RM5,417 in Year 1, rising to ~RM14,779 by Year 20.</>}
            {result.withdrawalLoss>0&&<span className="text-amber-400"> Crisis withdrawal of {formatRM(result.withdrawalLoss)} at age {params.withdrawalAge} compounds into {formatRM(result.withdrawalCompoundedLoss)} lost.</span>}
            {mcResult&&<span className="text-purple-300"> Monte Carlo: {mcResult.tierDistribution.below+mcResult.tierDistribution.basic}% probability of landing at Basic or below.</span>}
          </p>
        </div>
      </section>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// TAB 2: Cohort Segmentation
// ═══════════════════════════════════════════════════════════════════
function CohortTab() {
  const [retireAge, setRetireAge] = useState(60);
  const [dividendRate, setDivRate] = useState(5.5);
  const [inflation, setInflation] = useState(2.5);
  const [shockPct, setShockPct] = useState(0);
  const [shockAge, setShockAge] = useState(40);

  const cohortResults = useMemo(() => COHORTS.map(c => {
    const r = simulate({
      startAge: c.startAge, retireAge, currentAge: c.startAge, currentBalance: 0,
      empRate: c.empRate, erRate: c.erRate, wageGrowth: c.wageGrowth, dividendRate,
      startSalary: c.salary, inflation, withdrawalAge: shockPct > 0 ? shockAge : 0, withdrawalPct: shockPct,
    });
    return { ...r, label: c.label, color: c.color, key: c.key };
  }), [retireAge, dividendRate, inflation, shockPct, shockAge]);

  return (
    <div className="flex flex-col lg:flex-row gap-5">
      <aside className="w-full lg:w-[240px] flex-shrink-0 space-y-3">
        <div className="bg-[#0F172A] border border-[#1E293B] rounded-xl p-3.5">
          <div className="text-[9px] text-slate-500 uppercase tracking-[0.12em] font-semibold mb-3">Shared Parameters</div>
          <Slider label="Retirement Age" value={retireAge} onChange={setRetireAge} min={55} max={70} step={1} unit="" />
          <Slider label="EPF Dividend" value={dividendRate} onChange={setDivRate} min={3} max={8} step={0.25} unit="% p.a." />
          <Slider label="Inflation" value={inflation} onChange={setInflation} min={1} max={6} step={0.5} unit="% p.a." />
          <div className="border-t border-[#1E293B] pt-3 mt-3">
            <div className="text-[9px] text-slate-500 uppercase tracking-[0.12em] font-semibold mb-2">Apply Crisis Shock to All</div>
            <Slider label="Withdrawal Age" value={shockAge} onChange={setShockAge} min={30} max={55} step={1} unit="" />
            <Slider label="% Withdrawn" value={shockPct} onChange={setShockPct} min={0} max={40} step={5} unit="%" hint="0 = no crisis" />
          </div>
        </div>

        <div className="bg-[#0F172A] border border-[#1E293B] rounded-xl p-3.5">
          <div className="text-[9px] text-slate-500 uppercase tracking-[0.12em] font-semibold mb-2">Cohort Legend</div>
          {COHORTS.map(c => (
            <div key={c.key} className="flex items-center gap-2 mb-1">
              <span className="w-2.5 h-2.5 rounded-sm flex-shrink-0" style={{background:c.color}} />
              <span className="text-[10px] text-slate-400">{c.label}</span>
              <span className="text-[9px] text-slate-600 ml-auto font-mono">RM{c.salary}</span>
            </div>
          ))}
        </div>
      </aside>

      <section className="flex-1 min-w-0 space-y-3">
        <div className="bg-[#0F172A] border border-[#1E293B] rounded-xl p-3.5">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Accumulation Trajectories by Cohort</div>
          <CohortChart cohortResults={cohortResults} retireAge={retireAge} />
        </div>

        {/* Bar chart */}
        <div className="bg-[#0F172A] border border-[#1E293B] rounded-xl p-3.5">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-3">Balance at Retirement (Age {retireAge})</div>
          {cohortResults.map((cr, i) => {
            const maxBar = Math.max(...cohortResults.map(c=>c.balanceAtRetirement), TIERS.enhanced.amount);
            const pct = (cr.balanceAtRetirement / maxBar) * 100;
            return (
              <div key={i} className="flex items-center gap-2 mb-2">
                <span className="text-[10px] text-slate-400 w-[110px] flex-shrink-0 truncate">{cr.label}</span>
                <div className="flex-1 h-5 bg-[#1E293B] rounded-md overflow-hidden relative">
                  <div className="h-full rounded-md transition-all" style={{width:`${pct}%`, background:cr.color, opacity:0.8}} />
                  {/* Tier markers */}
                  {Object.values(TIERS).map((t,j)=>{
                    const tp = (t.amount/maxBar)*100;
                    return <div key={j} className="absolute top-0 h-full w-px" style={{left:`${tp}%`,background:t.color,opacity:0.4}} />;
                  })}
                </div>
                <span className="font-mono text-[10px] text-slate-300 w-[70px] text-right">{formatRM(cr.balanceAtRetirement)}</span>
                <TierBadge tier={cr.tier} />
              </div>
            );
          })}
        </div>

        <div className="bg-gradient-to-br from-[#0F172A] to-[#1E293B]/30 border border-[#1E293B] rounded-xl p-3.5">
          <div className="text-[9px] text-slate-500 uppercase tracking-[0.12em] font-semibold mb-1.5">Cohort Insight</div>
          <p className="text-[12px] text-slate-300 leading-relaxed">
            {(() => {
              const belowBasic = cohortResults.filter(c => c.tier === 'below');
              const enhanced = cohortResults.filter(c => c.tier === 'enhanced');
              return <>
                <strong>{belowBasic.length} of {cohortResults.length}</strong> cohorts fall below Basic savings.
                {belowBasic.length > 0 && <> Most at risk: <strong className="text-red-400">{belowBasic.map(c=>c.label).join(', ')}</strong>.</>}
                {enhanced.length > 0 && <> Only <strong className="text-emerald-400">{enhanced.map(c=>c.label).join(', ')}</strong> reach Enhanced.</>}
                {' '}The gap between T20 and B40 outcomes is {formatRM(Math.max(...cohortResults.map(c=>c.balanceAtRetirement)) - Math.min(...cohortResults.map(c=>c.balanceAtRetirement)))}, illustrating how income inequality compounds into retirement inequality.
                {shockPct > 0 && <span className="text-amber-400"> With a {shockPct}% crisis withdrawal at age {shockAge}, lower-income cohorts are disproportionately pushed further from adequacy.</span>}
              </>;
            })()}
          </p>
        </div>
      </section>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// TAB 3: Scarring Calculator
// ═══════════════════════════════════════════════════════════════════
function ScarringTab() {
  const [salary, setSalary] = useState(2600);
  const [dividendRate, setDivRate] = useState(5.5);
  const ages = [30, 35, 40, 45, 50];
  const pcts = [10, 15, 20, 25, 30];

  const baseResult = useMemo(() => simulate({
    startAge:25, retireAge:60, currentAge:25, currentBalance:0,
    empRate:11, erRate:12, wageGrowth:3.5, dividendRate, startSalary:salary,
    withdrawalAge:0, withdrawalPct:0, inflation:2.5,
  }), [salary, dividendRate]);

  const matrix = useMemo(() => {
    return pcts.map(pct => ages.map(age => {
      const r = simulate({
        startAge:25, retireAge:60, currentAge:25, currentBalance:0,
        empRate:11, erRate:12, wageGrowth:3.5, dividendRate, startSalary:salary,
        withdrawalAge:age, withdrawalPct:pct, inflation:2.5,
      });
      return {
        balance: r.balanceAtRetirement,
        loss: baseResult.balanceAtRetirement - r.balanceAtRetirement,
        tier: r.tier,
        compoundedLoss: r.withdrawalCompoundedLoss,
        withdrawn: r.withdrawalLoss,
      };
    }));
  }, [salary, dividendRate, baseResult]);

  const maxLoss = Math.max(...matrix.flat().map(m => m.loss));

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3">
        <div className="bg-[#0F172A] border border-[#1E293B] rounded-xl p-3.5 flex-1 min-w-[200px]">
          <Slider label="Monthly Salary" value={salary} onChange={setSalary} min={1000} max={10000} step={100} unit=" RM" />
          <Slider label="EPF Dividend" value={dividendRate} onChange={setDivRate} min={3} max={8} step={0.25} unit="% p.a." />
        </div>
        <Metric label="No-Shock Baseline" value={formatRM(baseResult.balanceAtRetirement)} sub={`${baseResult.tier.charAt(0).toUpperCase()+baseResult.tier.slice(1)} tier at age 60`} color={getTierColor(baseResult.tier)} />
      </div>

      <div className="bg-[#0F172A] border border-[#1E293B] rounded-xl p-4 overflow-x-auto">
        <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-3">
          Scarring Heat Map — Compounded loss by withdrawal age × percentage
        </div>
        <table className="w-full text-[10px]" style={{borderCollapse:'separate',borderSpacing:3}}>
          <thead>
            <tr>
              <th className="text-left text-slate-500 font-semibold px-2 py-1">Withdrawal %</th>
              {ages.map(a => <th key={a} className="text-center text-slate-500 font-semibold px-2 py-1">Age {a}</th>)}
            </tr>
          </thead>
          <tbody>
            {pcts.map((pct, pi) => (
              <tr key={pct}>
                <td className="font-mono font-bold text-slate-300 px-2 py-1">{pct}%</td>
                {ages.map((age, ai) => {
                  const cell = matrix[pi][ai];
                  const intensity = maxLoss > 0 ? cell.loss / maxLoss : 0;
                  const bg = `rgba(239, 68, 68, ${0.08 + intensity * 0.35})`;
                  return (
                    <td key={age} className="text-center px-2 py-2 rounded-md" style={{background:bg}}>
                      <div className="font-mono font-bold text-slate-200">{formatRM(cell.balance)}</div>
                      <div className="text-red-400 text-[9px]">−{formatRM(cell.loss)}</div>
                      <TierBadge tier={cell.tier} />
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="bg-gradient-to-br from-[#0F172A] to-[#1E293B]/30 border border-[#1E293B] rounded-xl p-3.5">
        <div className="text-[9px] text-slate-500 uppercase tracking-[0.12em] font-semibold mb-1.5">Scarring Insight</div>
        <p className="text-[12px] text-slate-300 leading-relaxed">
          A <strong className="text-red-400">30% withdrawal at age 30</strong> costs {formatRM(matrix[4][0].compoundedLoss)} in compounded losses by retirement — 
          despite only {formatRM(matrix[4][0].withdrawn)} actually leaving the account. 
          The same percentage withdrawn at age 50 costs {formatRM(matrix[4][4].compoundedLoss)} — 
          illustrating how <strong>earlier withdrawals scar exponentially more</strong> due to forgone compounding.
          {' '}This is why protecting savings during crises is critical for younger workers.
        </p>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// TAB 4: Monte Carlo Deep Dive
// ═══════════════════════════════════════════════════════════════════
function MonteCarloTab() {
  const [salary, setSalary] = useState(2600);
  const [retireAge, setRetireAge] = useState(60);
  const [dividendRate, setDivRate] = useState(5.5);
  const [returnVol, setReturnVol] = useState(2.0);
  const [wageVol, setWageVol] = useState(1.5);
  const [runs, setRuns] = useState(500);

  const params = { startAge:25, retireAge, currentAge:25, currentBalance:0, empRate:11, erRate:12,
    wageGrowth:3.5, dividendRate, startSalary:salary, withdrawalAge:0, withdrawalPct:0, inflation:2.5 };

  const detResult = useMemo(() => simulate(params), [salary, retireAge, dividendRate]);
  const mcResult = useMemo(() => monteCarloSimulate(params, { runs, returnVol, wageVol }), [salary, retireAge, dividendRate, returnVol, wageVol, runs]);

  return (
    <div className="flex flex-col lg:flex-row gap-5">
      <aside className="w-full lg:w-[240px] flex-shrink-0">
        <div className="bg-[#0F172A] border border-[#1E293B] rounded-xl p-3.5 space-y-0">
          <div className="text-[9px] text-slate-500 uppercase tracking-[0.12em] font-semibold mb-3">Parameters</div>
          <Slider label="Monthly Salary" value={salary} onChange={setSalary} min={1000} max={10000} step={100} unit=" RM" />
          <Slider label="Retirement Age" value={retireAge} onChange={setRetireAge} min={55} max={70} step={1} unit="" />
          <Slider label="Mean Dividend" value={dividendRate} onChange={setDivRate} min={3} max={8} step={0.25} unit="% p.a." />
          <div className="border-t border-[#1E293B] pt-3 mt-3">
            <div className="text-[9px] text-slate-500 uppercase tracking-[0.12em] font-semibold mb-3">Volatility</div>
            <Slider label="Return Volatility" value={returnVol} onChange={setReturnVol} min={0.5} max={5} step={0.5} unit="% σ" hint="Standard deviation of annual returns" />
            <Slider label="Wage Volatility" value={wageVol} onChange={setWageVol} min={0.5} max={4} step={0.5} unit="% σ" hint="Standard deviation of wage growth" />
            <Slider label="Simulations" value={runs} onChange={setRuns} min={100} max={2000} step={100} unit="" />
          </div>
        </div>
      </aside>

      <section className="flex-1 min-w-0 space-y-3">
        <div className="flex flex-wrap gap-2.5">
          <Metric label="Deterministic" value={formatRM(detResult.balanceAtRetirement)} sub="Fixed assumptions" color="#3B82F6" />
          <Metric label="MC Median (P50)" value={formatRM(mcResult.median)} sub={`${runs} simulations`} color="#A855F7" />
          <Metric label="P10 (Downside)" value={formatRM(mcResult.p10)} sub="10th percentile" color="#EF4444" />
          <Metric label="P90 (Upside)" value={formatRM(mcResult.p90)} sub="90th percentile" color="#059669" />
        </div>

        <div className="bg-[#0F172A] border border-[#1E293B] rounded-xl p-3">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Tier Probability Distribution</div>
          <TierDistBar distribution={mcResult.tierDistribution} />
        </div>

        <div className="bg-[#0F172A] border border-[#1E293B] rounded-xl p-3.5">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
            Monte Carlo Fan Chart (P10 – P90)
          </div>
          <TrajectoryChart trajectory={detResult.trajectory} retireAge={retireAge}
            mcPercentiles={mcResult.percentiles} mcAges={mcResult.ages} />
        </div>

        <div className="bg-gradient-to-br from-[#0F172A] to-[#1E293B]/30 border border-[#1E293B] rounded-xl p-3.5">
          <div className="text-[9px] text-slate-500 uppercase tracking-[0.12em] font-semibold mb-1.5">Stochastic Insight</div>
          <p className="text-[12px] text-slate-300 leading-relaxed">
            With ±{returnVol}% return volatility and ±{wageVol}% wage volatility over {runs} simulations, 
            there is a <strong className="text-red-400">{mcResult.tierDistribution.below}% chance of falling below Basic</strong> and 
            a <strong className="text-emerald-400">{mcResult.tierDistribution.enhanced}% chance of reaching Enhanced</strong>.
            {' '}The P10–P90 spread at retirement is {formatRM(mcResult.p90 - mcResult.p10)}, 
            showing how compounding amplifies uncertainty over a {retireAge - 25}-year horizon.
            {' '}This underscores the case for stable returns and consistent contribution policies.
          </p>
        </div>
      </section>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// MAIN PAGE
// ═══════════════════════════════════════════════════════════════════
const TABS = [
  { key:'policy',  label:'Policy Levers',      icon:'⚙' },
  { key:'cohort',  label:'Cohort Analysis',     icon:'👥' },
  { key:'scar',    label:'Scarring Calculator', icon:'⚡' },
  { key:'mc',      label:'Monte Carlo',         icon:'🎲' },
];

export default function Home() {
  const [tab, setTab] = useState('policy');

  return (
    <main className="min-h-screen bg-[#0B1120]">
      {/* Header */}
      <header className="bg-gradient-to-b from-[#0F172A] to-[#0B1120] border-b border-[#1E293B] px-5 pt-4 pb-0">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-2 h-2 rounded-full bg-blue-500" style={{boxShadow:'0 0 8px rgba(59,130,246,0.5)'}} />
          <span className="text-[10px] text-slate-500 uppercase tracking-[0.14em] font-semibold">EPF Retirement Adequacy Simulation</span>
        </div>
        <h1 className="text-xl font-extrabold tracking-tight bg-gradient-to-r from-slate-100 to-slate-400 bg-clip-text text-transparent">
          Policy Lever Scorecard <span className="text-[11px] font-mono text-slate-500 ml-2">v2.0</span>
        </h1>
        <p className="text-[11px] text-slate-500 mt-0.5 max-w-2xl leading-relaxed">
          Interactive simulation under Malaysia&apos;s RIA Framework (2026). Supports current age/balance, cohort segmentation, crisis scarring analysis and Monte Carlo uncertainty modelling.
        </p>

        {/* Tabs */}
        <nav className="flex gap-0 mt-3 -mb-px">
          {TABS.map(t => (
            <button key={t.key} onClick={()=>setTab(t.key)}
              className={`tab-btn px-4 py-2 text-[11px] font-semibold border-b-2 transition-all
                ${tab===t.key ? 'tab-active text-blue-400 border-blue-500' : 'text-slate-500 border-transparent hover:text-slate-300'}`}>
              <span className="mr-1.5">{t.icon}</span>{t.label}
            </button>
          ))}
        </nav>
      </header>

      <div className="p-5 fade-in" key={tab}>
        {tab === 'policy' && <PolicyLeverTab />}
        {tab === 'cohort' && <CohortTab />}
        {tab === 'scar' && <ScarringTab />}
        {tab === 'mc' && <MonteCarloTab />}
      </div>

      <footer className="px-5 pb-4 text-[8px] text-slate-700 leading-relaxed max-w-3xl">
        <strong>Methodology:</strong> Deterministic accumulation-drawdown + optional Monte Carlo (Box-Muller normal, per-year stochastic returns & wage growth).
        Drawdown: Belanjawanku 2024/2025 (RM2,690/mo single elderly, Klang Valley), inflation-adjusted.
        RIA thresholds per EPF framework effective Jan 2026. Illustrative simulation, not financial advice.
      </footer>
    </main>
  );
}
