// EPF Retirement Adequacy Simulation Engine
// Based on EPF's RIA Framework (2026) and Belanjawanku 2024/2025

export const TIERS = {
  basic:    { amount: 390000,  label: 'Basic',    color: '#D97706', bg: '#78350F', desc: 'Essential retirement needs' },
  adequate: { amount: 650000,  label: 'Adequate',  color: '#2563EB', bg: '#1E3A5F', desc: 'Reasonable standard of living' },
  enhanced: { amount: 1300000, label: 'Enhanced',  color: '#059669', bg: '#064E3B', desc: 'Financial independence' },
};

export const BELANJAWANKU_MONTHLY = 2690; // RM/month for single elderly, Klang Valley (2024/2025)

export const PRESETS = {
  baseline: {
    label: 'Current Baseline',
    desc: 'Status quo policy settings — median formal sector worker',
    values: {
      startAge: 25, retireAge: 60,
      empRate: 11, erRate: 12,
      wageGrowth: 3.5, dividendRate: 5.5,
      startSalary: 2600,
      withdrawalAge: 0, withdrawalPct: 0,
      inflation: 2.5,
    },
  },
  optimistic: {
    label: 'Reform Scenario',
    desc: 'Retire at 65, higher contributions, stronger wage growth',
    values: {
      startAge: 25, retireAge: 65,
      empRate: 13, erRate: 14,
      wageGrowth: 5, dividendRate: 6,
      startSalary: 2600,
      withdrawalAge: 0, withdrawalPct: 0,
      inflation: 2.5,
    },
  },
  crisis: {
    label: 'Crisis Shock',
    desc: 'Baseline + 20% crisis withdrawal at age 40',
    values: {
      startAge: 25, retireAge: 60,
      empRate: 11, erRate: 12,
      wageGrowth: 3.5, dividendRate: 5.5,
      startSalary: 2600,
      withdrawalAge: 40, withdrawalPct: 20,
      inflation: 2.5,
    },
  },
  b40: {
    label: 'B40 Worker',
    desc: 'Lower wage, late start, crisis withdrawal at 38',
    values: {
      startAge: 28, retireAge: 60,
      empRate: 11, erRate: 12,
      wageGrowth: 2.5, dividendRate: 5.5,
      startSalary: 1700,
      withdrawalAge: 38, withdrawalPct: 25,
      inflation: 2.5,
    },
  },
  gig: {
    label: 'Gig Worker',
    desc: 'i-Saraan voluntary, late entry, lower effective rate',
    values: {
      startAge: 30, retireAge: 60,
      empRate: 5, erRate: 0,
      wageGrowth: 3, dividendRate: 5.5,
      startSalary: 2200,
      withdrawalAge: 0, withdrawalPct: 0,
      inflation: 2.5,
    },
  },
};

export function simulate(params) {
  const {
    startAge, retireAge, empRate, erRate,
    wageGrowth, dividendRate, startSalary,
    withdrawalAge, withdrawalPct, inflation,
  } = params;

  const totalContribRate = (empRate + erRate) / 100;
  const annualReturn = dividendRate / 100;
  const annualWageGrowth = wageGrowth / 100;
  const annualInflation = inflation / 100;

  let balance = 0;
  let salary = startSalary * 12; // annual
  const trajectory = [];
  let totalContributions = 0;
  let totalReturns = 0;
  let withdrawalLoss = 0;
  let withdrawalCompoundedLoss = 0;

  for (let age = startAge; age <= 80; age++) {
    if (age <= retireAge) {
      // Accumulation phase
      const contribution = salary * totalContribRate;
      totalContributions += contribution;
      const returnAmt = balance * annualReturn;
      totalReturns += returnAmt;
      balance = balance + contribution + returnAmt;

      // Crisis withdrawal
      if (withdrawalAge > 0 && age === withdrawalAge && withdrawalPct > 0) {
        const withdrawn = balance * (withdrawalPct / 100);
        withdrawalLoss = withdrawn;
        // Calculate compounded loss at retirement
        const yearsToRetire = retireAge - withdrawalAge;
        withdrawalCompoundedLoss = withdrawn * Math.pow(1 + annualReturn, yearsToRetire);
        balance -= withdrawn;
      }

      salary *= (1 + annualWageGrowth);
    } else {
      // Drawdown phase
      const returnAmt = balance * annualReturn;
      totalReturns += returnAmt;
      // Monthly drawdown anchored to Belanjawanku, adjusted for inflation
      const yearsIntoRetirement = age - retireAge;
      const annualDrawdown = BELANJAWANKU_MONTHLY * 12 * Math.pow(1 + annualInflation, yearsIntoRetirement);
      balance = balance + returnAmt - annualDrawdown;
      if (balance < 0) balance = 0;
    }

    trajectory.push({
      age,
      balance: Math.round(balance),
    });
  }

  const balanceAtRetirement = trajectory.find(t => t.age === retireAge)?.balance || 0;
  const yearsOfIncome = trajectory.filter(t => t.age > retireAge && t.balance > 0).length;

  const tier = balanceAtRetirement >= TIERS.enhanced.amount ? 'enhanced'
    : balanceAtRetirement >= TIERS.adequate.amount ? 'adequate'
    : balanceAtRetirement >= TIERS.basic.amount ? 'basic'
    : 'below';

  return {
    trajectory,
    balanceAtRetirement,
    yearsOfIncome,
    tier,
    totalContributions: Math.round(totalContributions),
    totalReturns: Math.round(totalReturns),
    withdrawalLoss: Math.round(withdrawalLoss),
    withdrawalCompoundedLoss: Math.round(withdrawalCompoundedLoss),
  };
}

export function formatRM(val) {
  if (val >= 1000000) return `RM${(val / 1000000).toFixed(2)}M`;
  if (val >= 1000) return `RM${(val / 1000).toFixed(0)}K`;
  return `RM${val.toFixed(0)}`;
}

export function getTierColor(tier) {
  return { enhanced: '#059669', adequate: '#2563EB', basic: '#D97706', below: '#EF4444' }[tier] || '#EF4444';
}
