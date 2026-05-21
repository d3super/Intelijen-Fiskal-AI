import { RegionalData, PolicyScenario } from '../types';

/**
 * Static Partial Equilibrium Fiscal Multiplier Model - Economic Assumptions
 * Based on IMF, World Bank, and OECD subnational fiscal guidelines.
 */

// Baseline Fiscal Multipliers
export const INFRASTRUCTURE_MULTIPLIER = 1.4;       // Multiplier for capital expenditure/infrastructure
export const SOCIAL_SPENDING_MULTIPLIER = 1.2;      // Multiplier for social security / direct transfers
export const TAX_INCREASE_MULTIPLIER = -0.6;        // Multiplier for regional taxes / PAD rate hikes
export const PERSONNEL_MULTIPLIER = -0.3;           // Multiplier for government wage bill adjustments
export const TRANSFER_DEPENDENCY_MULTIPLIER = -0.2; // Multiplier for variations in central transfer allocations

// Lag Effect Coefficients (how much of the shock translates into the current price period)
export const CAPITAL_LAG = 0.35;    // Capital projects take years (low first-year translation)
export const SOCIAL_LAG = 0.85;     // Social transfers are spent immediately (high current translation)
export const TAX_LAG = 0.70;       // Tax policy changes affect consumer spending within months
export const PERSONNEL_LAG = 0.50;  // Changes in public employment / wages take mid-term effect
export const TRANSFER_LAG = 0.40;   // Transfer reductions take time to propagate through regional programs

// Target parameters / thresholds
export const MAX_DEFICIT_RATIO = 0.05; // 5% of GDP acts as a critical subnational deficit warning
export const GROWTH_CEILING = 12.0;    // Real growth above 12% is generally unrealistic for regional economies
export const GROWTH_FLOOR = -5.0;      // Contraction below -5% triggers systemic crisis warning

export interface SimulationResult {
  baseline: {
    revenue: number;
    pad: number;
    transfer: number;
    expenditure: number;
    capital: number;
    personnel: number;
    social: number;
    balance: number;
    deficitRatio: number;
    gdpGrowth: number;
  };
  simulated: {
    revenue: number;
    pad: number;
    transfer: number;
    expenditure: number;
    capital: number;
    personnel: number;
    social: number;
    balance: number;
    deficitRatio: number;
    gdpGrowth: number;
  };
  metrics: {
    spendingEfficiency: number;
    regionalLeakage: number;
    fiscalDependence: number;
    regionalGDP: number;
  };
  impactBreakdown: {
    capitalImpact: number;
    socialImpact: number;
    taxImpact: number;
    personnelImpact: number;
    transferImpact: number;
    totalImpact: number;
  };
  warnings: {
    type: 'critical' | 'warning' | 'info';
    title: string;
    description: string;
  }[];
  riskScore: number; // 0 (safest) to 100 (high stress risk)
  riskCategory: 'Rendah' | 'Sedang' | 'Tinggi' | 'Kritis';
  recommendations: {
    title: string;
    description: string;
    priority: 'high' | 'medium' | 'low';
  }[];
}

/**
 * Estimator utilities for structural parameters when omitted in raw dataset.
 */
export const estimateRegionalGDP = (d: RegionalData): number => {
  return (d as any).Regional_GDP_Current_Price || (d.Revenue * 6.5) || 5000000;
};

export const estimateSpendingEfficiency = (d: RegionalData): number => {
  if ((d as any).Spending_Efficiency_Index !== undefined) {
    return (d as any).Spending_Efficiency_Index;
  }
  const personnelRatio = d.Expenditure > 0 ? d.Personnel_Spending / d.Expenditure : 0.4;
  const unemploymentFactor = Math.min(0.1, d.Unemployment / 100);
  const base = 0.85; 
  const penalty = Math.max(0, personnelRatio - 0.3) * 0.6 + unemploymentFactor;
  return Math.min(0.95, Math.max(0.40, base - penalty));
};

export const estimateRegionalLeakage = (d: RegionalData): number => {
  if ((d as any).Regional_Leakage_Index !== undefined) {
    return (d as any).Regional_Leakage_Index;
  }
  // Larger regional population structures lead to lower leakages (high multiplier retention)
  const populationPercentile = Math.min(1.0, d.Population / 5000000); 
  return Math.min(0.55, Math.max(0.15, 0.45 - populationPercentile * 0.25));
};

/**
 * Calculates multiplier adjustment coefficients due to extreme fiscal stress.
 */
export const calculateFiscalStressMultiplierPenalty = (d: RegionalData, simulatedDeficitRatio: number): number => {
  let penalty = 1.0;
  
  // High deficit restricts regional spending multiplier retention
  if (simulatedDeficitRatio > MAX_DEFICIT_RATIO) {
    const excess = simulatedDeficitRatio - MAX_DEFICIT_RATIO;
    penalty *= Math.max(0.4, 1.0 - excess * 6.0); // Up to 60% penalty reduction
  }
  
  // Baseline fiscal stress acts as an efficiency barrier
  const stressScore = d.Fiscal_Stress_Score || 0;
  if (stressScore > 40) {
    const stressExcess = (stressScore - 40) / 100;
    penalty *= Math.max(0.65, 1.0 - stressExcess * 0.5);
  }
  
  return penalty;
};

/**
 * Core Policy Simulation Engine using Dynamic Multiplier-Lag architecture
 */
export const runFiscalSimulation = (d: RegionalData, scenario: PolicyScenario): SimulationResult => {
  // 1. Resolve Structural Parameters
  const gdp = estimateRegionalGDP(d);
  const efficiency = estimateSpendingEfficiency(d);
  const leakage = estimateRegionalLeakage(d);
  const dependence = d.Revenue > 0 ? d.Transfer / d.Revenue : 0.5;

  // 2. Baselines
  const baseRev = d.Revenue;
  const basePAD = d.PAD;
  const baseTransfer = d.Transfer;
  const baseExp = d.Expenditure;
  const baseCapital = d.Capital_Expenditure;
  const basePersonnel = d.Personnel_Spending;
  const baseSocial = d.Social_Spending;
  const baseBalance = d.Fiscal_Balance;
  const baseDeficitRatio = baseBalance < 0 ? Math.abs(baseBalance) / gdp : 0;
  const baseGrowth = d.GDP_Growth;

  // 3. Shock calculations
  const padChange = basePAD * (scenario.padIncrease / 100);
  const transferChange = baseTransfer * (scenario.transferDecrease / 100) * -1; // Negative direction for decrease
  
  const capitalChange = baseCapital * (scenario.capitalExpIncrease / 100);
  const personnelChange = basePersonnel * (scenario.personnelExpDecrease / 100) * -1; // Negative direction for decrease
  const socialChange = baseSocial * (scenario.socialExpIncrease / 100);

  // 4. Simulated Budget Totals
  const simRevenue = baseRev + padChange + transferChange;
  const simExpenditure = baseExp + capitalChange + personnelChange + socialChange;
  const simBalance = simRevenue - simExpenditure;
  const simDeficitRatio = simBalance < 0 ? Math.abs(simBalance) / gdp : 0;

  // 5. Multiplying with Stress Penalties
  const stressPenalty = calculateFiscalStressMultiplierPenalty(d, simDeficitRatio);
  const leakAdj = 1.0 - leakage;

  // 6. Impact calculation split by categories (Relative to GDP)
  const capitalImpact = (capitalChange / gdp) * 100 * INFRASTRUCTURE_MULTIPLIER * CAPITAL_LAG * efficiency * leakAdj * stressPenalty;
  const socialImpact = (socialChange / gdp) * 100 * SOCIAL_SPENDING_MULTIPLIER * SOCIAL_LAG * efficiency * leakAdj * stressPenalty;
  
  // Note: Cutting unproductive personnel spending might have a negative growth impact in the short run because of wages contraction
  const personnelImpact = (personnelChange / gdp) * 100 * PERSONNEL_MULTIPLIER * PERSONNEL_LAG * leakAdj * stressPenalty;
  
  // PAD Rate increases extract consumer liquidity, causing a minor growth drag
  const taxImpact = (padChange / gdp) * 100 * TAX_INCREASE_MULTIPLIER * TAX_LAG * leakAdj * stressPenalty;
  
  // Decreasement in federal transfer reduces economic liquidity
  const transferImpact = (transferChange / gdp) * 100 * TRANSFER_DEPENDENCY_MULTIPLIER * TRANSFER_LAG * leakAdj * stressPenalty;

  const totalImpact = capitalImpact + socialImpact + personnelImpact + taxImpact + transferImpact;
  
  // Calculate final growth rate before constraints
  let rawSimGDP = baseGrowth + totalImpact;
  
  // Apply economy realistic caps
  const simGDP = Math.min(GROWTH_CEILING, Math.max(GROWTH_FLOOR, rawSimGDP));

  // 7. Economic Warnings, Risk Scenarios & Validation
  const warnings: SimulationResult['warnings'] = [];
  
  if (simDeficitRatio > MAX_DEFICIT_RATIO) {
    warnings.push({
      type: 'critical',
      title: 'Defisit Melampaui Batas Aman (>5% PDRB)',
      description: `Rasio defisit simulasi mencapai ${(simDeficitRatio * 100).toFixed(2)}% dari PDRB. Kondisi ini dapat menurunkan kredibilitas kapasitas bayar utang daerah dan memicu sanksi fiskal.`
    });
  } else if (simDeficitRatio > 0.03) {
    warnings.push({
      type: 'warning',
      title: 'Peningkatan Defisit Sedang (>3% PDRB)',
      description: `Defisit simulasi bernilai ${(simDeficitRatio * 100).toFixed(2)}% dari PDRB. Dianjurkan memperketat belanja pegawai untuk mengamankan cadangan kas.`
    });
  }

  if (rawSimGDP > GROWTH_CEILING) {
    warnings.push({
      type: 'info',
      title: 'Dampak Pertumbuhan Di-cap (Realism Limit)',
      description: `Skenario fiskal menghasilkan proyeksi pertumbuhan riil di atas ${GROWTH_CEILING}%. Model membatasi hasil maksimal ke angka realistis ${GROWTH_CEILING}% untuk menghindari bias estimasi berlebih.`
    });
  } else if (rawSimGDP < GROWTH_FLOOR) {
    warnings.push({
      type: 'critical',
      title: 'Proyeksi Kontraksi Ekonomi Ekstrim (< -5%)',
      description: `Kombinasi pemotongan anggaran atau kenaikan tarif PAD memicu penyusutan ekonomi hingga ${(rawSimGDP).toFixed(2)}%. Risiko pengangguran masal dapat melonjak tinggi.`
    });
  }

  if (scenario.capitalExpIncrease === 0 && scenario.socialExpIncrease === 0 && (scenario.padIncrease > 20 || scenario.transferDecrease > 15)) {
    warnings.push({
      type: 'warning',
      title: 'Austeritas Fiskal Berbahaya',
      description: 'Anda melakukan peningkatan pajak (PAD) atau pengurangan transfer tanpa menyuntikkan dana kembali ke modal/sosial. Skenario ini memicu kontraksi sirkulasi uang regional.'
    });
  }

  // 8. Scenario Risk Score calculation (out of 100)
  let riskScore = 15; // default base risk
  riskScore += (simDeficitRatio * 100) * 10; // deficit adds risk
  riskScore += scenario.padIncrease * 0.4;    // high tax increase adds social unrest risk
  riskScore += scenario.transferDecrease * 0.6; // transfer instability adds risk
  const stressBase = d.Fiscal_Stress_Score || 0;
  riskScore += stressBase * 0.3; // baseline stress adds to vulnerability

  riskScore = Math.min(100, Math.max(0, riskScore));

  let riskCategory: SimulationResult['riskCategory'] = 'Rendah';
  if (riskScore > 75) riskCategory = 'Kritis';
  else if (riskScore > 50) riskCategory = 'Tinggi';
  else if (riskScore > 25) riskCategory = 'Sedang';

  // 9. Policy Advisor Recommendation Engine
  const recommendations: SimulationResult['recommendations'] = [];

  const rawPersonnelRatio = simExpenditure > 0 ? (basePersonnel - (basePersonnel * (scenario.personnelExpDecrease/100))) / simExpenditure : 0;
  const rawCapitalRatio = simExpenditure > 0 ? (baseCapital + capitalChange) / simExpenditure : 0;

  if (simDeficitRatio > MAX_DEFICIT_RATIO) {
    recommendations.push({
      title: 'Lakukan Manajemen Defisit Segera',
      description: 'Gunakan saldo kas (SiLPA) tahun lalu atau kurangi defisit dengan menurunkan target kenaikan belanja modal/sosial secara bertahap.',
      priority: 'high'
    });
  }

  if (rawPersonnelRatio > 0.40) {
    recommendations.push({
      title: 'Restrukturisasi Belanja Pegawai (Birokrasi Ramping)',
      description: 'Porsi Belanja Pegawai melebihi 40% dari total belanja. Disarankan melakukan moratorium rekrutmen pegawai non-esensial dan digantikan dengan program digitalisasi pelayanan.',
      priority: 'high'
    });
  }

  if (rawCapitalRatio < 0.20 && simGDP < 5.0) {
    recommendations.push({
      title: 'Akselerasi Pengeluaran Pembangunan',
      description: 'Porsi Belanja Modal Anda di bawah 20% belanja total. Disarankan mengalihkan dana dari operasional ATK / perjalanan dinas untuk memicu multiplier infrastruktur jangka panjang.',
      priority: 'medium'
    });
  }

  if (scenario.padIncrease < 5 && dependence > 0.70) {
    recommendations.push({
      title: 'Ekspansi Basis Pajak & Retribusi Mandiri',
      description: `Ketergantungan transfer pusat masih sangat tinggi (${(dependence * 100).toFixed(1)}%). Segera lakukan pemetaan ulang potensi PAD digital lewat elektronifikasi transaksi lokal.`,
      priority: 'medium'
    });
  }

  if (efficiency < 0.60) {
    recommendations.push({
      title: 'Pengembangan Kualitas Tata Kelola Belanja',
      description: 'Indeks efisiensi penyerapan anggaran rendah. Lakukan pengawasan ketat e-purchasing dan review tata ruang untuk meminimalkan sisa anggaran (SiLPA) tidak terserap.',
      priority: 'low'
    });
  }

  if (recommendations.length === 0) {
    recommendations.push({
      title: 'Skenario Fiskal Sehat & Berkelanjutan',
      description: 'Skenario ini mempertahankan bauran belanja produktif dan menjaga kesinambungan fiskal tanpa membebani masyarakat lokal.',
      priority: 'low'
    });
  }

  return {
    baseline: {
      revenue: baseRev,
      pad: basePAD,
      transfer: baseTransfer,
      expenditure: baseExp,
      capital: baseCapital,
      personnel: basePersonnel,
      social: baseSocial,
      balance: baseBalance,
      deficitRatio: baseDeficitRatio,
      gdpGrowth: baseGrowth
    },
    simulated: {
      revenue: simRevenue,
      pad: simRevenue - baseTransfer - (baseRev - basePAD - baseTransfer), // estimate mapping correctly
      transfer: simRevenue - simRevenue + (baseTransfer + transferChange),
      expenditure: simExpenditure,
      capital: baseCapital + capitalChange,
      personnel: basePersonnel + personnelChange,
      social: baseSocial + socialChange,
      balance: simBalance,
      deficitRatio: simDeficitRatio,
      gdpGrowth: simGDP
    },
    metrics: {
      spendingEfficiency: efficiency,
      regionalLeakage: leakage,
      fiscalDependence: dependence,
      regionalGDP: gdp
    },
    impactBreakdown: {
      capitalImpact,
      socialImpact,
      taxImpact,
      personnelImpact,
      transferImpact,
      totalImpact
    },
    warnings,
    riskScore,
    riskCategory,
    recommendations
  };
};
