// ═══════════════════════════════════════════════════════════════════════
// EPF Retirement Adequacy — Simulation Engine v2
// Deterministic + Monte Carlo, with cohort profiles and scarring logic
// ═══════════════════════════════════════════════════════════════════════

export const TIERS = {
  basic:    { amount: 390000,   label: 'Basic',    color: '#D97706', bg: '#78350F' },
  adequate: { amount: 650000,   label: 'Adequate', color: '#2563EB', bg: '#1E3A5F' },
  enhanced: { amount: 1300000,  label: 'Enhanced', color: '#059669', bg: '#064E3B' },
};

export const BELANJAWANKU = 2690; // RM/month single elderly Klang Valley 2024/2025

// ── Presets ──────────────────────────────────────────────────────────
export const PRESETS = {
  baseline:   { label:'Current Baseline',   desc:'Median formal sector worker, status quo',
    values:{ startAge:25, retireAge:60, currentAge:25, currentBalance:0, empRate:11, erRate:12, wageGrowth:3.5, dividendRate:5.5, startSalary:2600, withdrawalAge:0, withdrawalPct:0, inflation:2.5 }},
  reform:     { label:'Reform Scenario',    desc:'Retire 65, higher contributions & wage growth',
    values:{ startAge:25, retireAge:65, currentAge:25, currentBalance:0, empRate:13, erRate:14, wageGrowth:5,   dividendRate:6,   startSalary:2600, withdrawalAge:0, withdrawalPct:0, inflation:2.5 }},
  crisis:     { label:'Crisis Shock',       desc:'Baseline + 20% withdrawal at age 40',
    values:{ startAge:25, retireAge:60, currentAge:25, currentBalance:0, empRate:11, erRate:12, wageGrowth:3.5, dividendRate:5.5, startSalary:2600, withdrawalAge:40, withdrawalPct:20, inflation:2.5 }},
  b40:        { label:'B40 Worker',         desc:'Lower wage, late start, crisis withdrawal',
    values:{ startAge:28, retireAge:60, currentAge:28, currentBalance:0, empRate:11, erRate:12, wageGrowth:2.5, dividendRate:5.5, startSalary:1700, withdrawalAge:38, withdrawalPct:25, inflation:2.5 }},
  gig:        { label:'Gig Worker',         desc:'i-Saraan voluntary, no employer contribution',
    values:{ startAge:30, retireAge:60, currentAge:30, currentBalance:0, empRate:5,  erRate:0,  wageGrowth:3,   dividendRate:5.5, startSalary:2200, withdrawalAge:0, withdrawalPct:0, inflation:2.5 }},
  midcareer:  { label:'Mid-Career (Age 40)',desc:'Already 40, has RM120K saved, RM4500/mo salary',
    values:{ startAge:25, retireAge:60, currentAge:40, currentBalance:120000, empRate:11, erRate:12, wageGrowth:3.5, dividendRate:5.5, startSalary:4500, withdrawalAge:0, withdrawalPct:0, inflation:2.5 }},
};

// ── Cohort Profiles (for Simulation 2) ──────────────────────────────
export const COHORTS = [
  { key:'b40_male',     label:'B40 Male',             startAge:24, salary:1500, wageGrowth:2.0, empRate:11, erRate:12, color:'#EF4444' },
  { key:'b40_female',   label:'B40 Female',           startAge:26, salary:1400, wageGrowth:1.8, empRate:11, erRate:12, color:'#F87171' },
  { key:'m40_male',     label:'M40 Male',             startAge:25, salary:3200, wageGrowth:3.5, empRate:11, erRate:12, color:'#3B82F6' },
  { key:'m40_female',   label:'M40 Female',           startAge:25, salary:2900, wageGrowth:3.2, empRate:11, erRate:12, color:'#60A5FA' },
  { key:'t20_male',     label:'T20 Male',             startAge:25, salary:6500, wageGrowth:5.0, empRate:11, erRate:12, color:'#059669' },
  { key:'t20_female',   label:'T20 Female',           startAge:25, salary:5800, wageGrowth:4.5, empRate:11, erRate:12, color:'#34D399' },
  { key:'gig_worker',   label:'Gig (i-Saraan)',       startAge:30, salary:2200, wageGrowth:3.0, empRate:5,  erRate:0,  color:'#A855F7' },
  { key:'late_formal',  label:'Late Formal Entry',    startAge:35, salary:2000, wageGrowth:2.5, empRate:11, erRate:12, color:'#F59E0B' },
];

// ── Deterministic Simulation ────────────────────────────────────────
export function simulate(params) {
  const { startAge, retireAge, currentAge, currentBalance, empRate, erRate,
          wageGrowth, dividendRate, startSalary, withdrawalAge, withdrawalPct, inflation } = params;

  const totalRate = (empRate + erRate) / 100;
  const r = dividendRate / 100;
  const g = wageGrowth / 100;
  const inf = inflation / 100;

  // If currentAge > startAge, we start from current position
  const effectiveStartAge = Math.max(startAge, currentAge || startAge);
  let balance = currentBalance || 0;

  // If starting fresh (currentAge <= startAge), accumulate from startAge
  // If mid-career, salary is already at startSalary level (user inputs current salary)
  let salary = startSalary * 12;

  // If fresh start, grow salary from startAge to effectiveStartAge
  if (!currentBalance && effectiveStartAge > startAge) {
    for (let a = startAge; a < effectiveStartAge; a++) {
      const contrib = salary * totalRate;
      balance += contrib + balance * r;
      salary *= (1 + g);
    }
  }

  const trajectory = [];
  let totalContrib = 0, totalReturn = 0, wLoss = 0, wCompounded = 0;

  for (let age = effectiveStartAge; age <= 80; age++) {
    if (age <= retireAge) {
      const contrib = salary * totalRate;
      totalContrib += contrib;
      const ret = balance * r;
      totalReturn += ret;
      balance += contrib + ret;

      if (withdrawalAge > 0 && age === withdrawalAge && withdrawalPct > 0) {
        const w = balance * (withdrawalPct / 100);
        wLoss = w;
        wCompounded = w * Math.pow(1 + r, retireAge - withdrawalAge);
        balance -= w;
      }
      salary *= (1 + g);
    } else {
      const ret = balance * r;
      totalReturn += ret;
      const draw = BELANJAWANKU * 12 * Math.pow(1 + inf, age - retireAge);
      balance = Math.max(0, balance + ret - draw);
    }
    trajectory.push({ age, balance: Math.round(balance) });
  }

  const balAtRetire = trajectory.find(t => t.age === retireAge)?.balance || 0;
  const yrsIncome = trajectory.filter(t => t.age > retireAge && t.balance > 0).length;
  const tier = balAtRetire >= TIERS.enhanced.amount ? 'enhanced'
    : balAtRetire >= TIERS.adequate.amount ? 'adequate'
    : balAtRetire >= TIERS.basic.amount ? 'basic' : 'below';

  return { trajectory, balanceAtRetirement: balAtRetire, yearsOfIncome: yrsIncome, tier,
           totalContributions: Math.round(totalContrib), totalReturns: Math.round(totalReturn),
           withdrawalLoss: Math.round(wLoss), withdrawalCompoundedLoss: Math.round(wCompounded) };
}

// ── Monte Carlo Simulation ──────────────────────────────────────────
// Box-Muller for normal random numbers (no external deps)
function randNormal(mean, std) {
  const u1 = Math.random(), u2 = Math.random();
  return mean + std * Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
}

export function monteCarloSimulate(params, { runs = 500, returnVol = 2.0, wageVol = 1.5 } = {}) {
  const { startAge, retireAge, currentAge, currentBalance, empRate, erRate,
          wageGrowth, dividendRate, startSalary, withdrawalAge, withdrawalPct, inflation } = params;

  const totalRate = (empRate + erRate) / 100;
  const meanR = dividendRate / 100;
  const meanG = wageGrowth / 100;
  const inf = inflation / 100;
  const rVol = returnVol / 100;
  const wVol = wageVol / 100;

  const effectiveStart = Math.max(startAge, currentAge || startAge);
  const allFinals = [];
  const percentileTrajectories = { p10: [], p25: [], p50: [], p75: [], p90: [] };
  const ageRange = [];
  for (let a = effectiveStart; a <= retireAge; a++) ageRange.push(a);

  // Collect all balances at each age
  const balancesByAge = ageRange.map(() => []);

  for (let run = 0; run < runs; run++) {
    let balance = currentBalance || 0;
    let salary = startSalary * 12;

    // Pre-accumulate if needed
    if (!currentBalance && effectiveStart > startAge) {
      for (let a = startAge; a < effectiveStart; a++) {
        const thisR = Math.max(0.01, randNormal(meanR, rVol));
        const thisG = Math.max(-0.02, randNormal(meanG, wVol));
        balance += salary * totalRate + balance * thisR;
        salary *= (1 + thisG);
      }
    }

    for (let i = 0; i < ageRange.length; i++) {
      const age = ageRange[i];
      const thisR = Math.max(0.005, randNormal(meanR, rVol));
      const thisG = Math.max(-0.03, randNormal(meanG, wVol));

      const contrib = salary * totalRate;
      balance += contrib + balance * thisR;

      if (withdrawalAge > 0 && age === withdrawalAge && withdrawalPct > 0) {
        balance -= balance * (withdrawalPct / 100);
      }

      salary *= (1 + thisG);
      balancesByAge[i].push(Math.round(balance));
    }

    allFinals.push(Math.round(balance));
  }

  // Compute percentiles at each age
  const pctKeys = [10, 25, 50, 75, 90];
  const pctLabels = ['p10', 'p25', 'p50', 'p75', 'p90'];
  const pctTrajectories = pctLabels.map(() => []);

  for (let i = 0; i < ageRange.length; i++) {
    const sorted = balancesByAge[i].slice().sort((a, b) => a - b);
    const n = sorted.length;
    for (let pi = 0; pi < pctKeys.length; pi++) {
      const idx = Math.floor(n * pctKeys[pi] / 100);
      pctTrajectories[pi].push({ age: ageRange[i], balance: sorted[Math.min(idx, n - 1)] });
    }
  }

  const result = {};
  pctLabels.forEach((label, i) => { result[label] = pctTrajectories[i]; });

  // Tier distribution
  const tierCounts = { below: 0, basic: 0, adequate: 0, enhanced: 0 };
  allFinals.forEach(b => {
    if (b >= TIERS.enhanced.amount) tierCounts.enhanced++;
    else if (b >= TIERS.adequate.amount) tierCounts.adequate++;
    else if (b >= TIERS.basic.amount) tierCounts.basic++;
    else tierCounts.below++;
  });
  Object.keys(tierCounts).forEach(k => { tierCounts[k] = Math.round(tierCounts[k] / runs * 100); });

  const sorted = allFinals.slice().sort((a, b) => a - b);

  return {
    percentiles: result,
    tierDistribution: tierCounts,
    median: sorted[Math.floor(runs / 2)],
    p10: sorted[Math.floor(runs * 0.1)],
    p90: sorted[Math.floor(runs * 0.9)],
    ages: ageRange,
    runs,
  };
}

// ── Helpers ─────────────────────────────────────────────────────────
export function formatRM(val) {
  if (val >= 1e6) return `RM${(val/1e6).toFixed(2)}M`;
  if (val >= 1e3) return `RM${(val/1e3).toFixed(0)}K`;
  return `RM${val.toFixed(0)}`;
}

export function getTierColor(tier) {
  return { enhanced:'#059669', adequate:'#2563EB', basic:'#D97706', below:'#EF4444' }[tier] || '#EF4444';
}
