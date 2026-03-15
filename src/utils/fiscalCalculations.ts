import { RegionalData } from '../types';

export function calculateFiscalMetrics(data: RegionalData): RegionalData {
  // 1. Fiscal Capacity Index (0-100)
  // Indicators: PAD ratio, PAD growth (simplified), Revenue diversification, GDP per capita (simplified), Transfer dependency
  
  const padRatio = (data.PAD / data.Revenue) * 100;
  const transferDependency = (data.Transfer / data.Revenue) * 100;
  
  // Simplified index calculation for prototype
  // Higher PAD ratio is better (+), lower transfer dependency is better (-)
  let capacityScore = (padRatio * 1.5) + ((100 - transferDependency) * 0.5);
  
  // Normalize to 0-100
  capacityScore = Math.max(0, Math.min(100, capacityScore));
  
  // 2. Fiscal Stress Predictor (0-100)
  // Indicators: Personnel spending >50%, PAD ratio <10%, Transfer dependency >75%, Fiscal deficit >5%
  
  let stressScore = 0;
  
  const personnelRatio = (data.Personnel_Spending / data.Expenditure) * 100;
  if (personnelRatio > 50) stressScore += 25;
  else if (personnelRatio > 40) stressScore += 15;
  
  if (padRatio < 10) stressScore += 25;
  else if (padRatio < 20) stressScore += 15;
  
  if (transferDependency > 75) stressScore += 25;
  else if (transferDependency > 60) stressScore += 15;
  
  const deficitRatio = (Math.abs(Math.min(0, data.Fiscal_Balance)) / data.Revenue) * 100;
  if (deficitRatio > 5) stressScore += 25;
  else if (deficitRatio > 3) stressScore += 15;

  // Normalize to 0-100
  stressScore = Math.max(0, Math.min(100, stressScore));

  // Risk Classification
  let risk: RegionalData['Fiscal_Risk'] = 'Stable';
  if (stressScore >= 80) risk = 'Severe fiscal stress';
  else if (stressScore >= 60) risk = 'High risk';
  else if (stressScore >= 30) risk = 'Warning';

  // Development Gap Index (simplified)
  // Based on social spending per capita and capital expenditure
  const socialPerCapita = data.Social_Spending / data.Population;
  const capitalRatio = (data.Capital_Expenditure / data.Expenditure) * 100;
  
  // Normalized 0-100 (higher means larger gap/worse)
  // In a real scenario, this would compare against national averages
  const gapIndex = Math.max(0, Math.min(100, 100 - (capitalRatio * 2) - (socialPerCapita * 0.01)));

  return {
    ...data,
    Fiscal_Capacity_Index: capacityScore,
    Transfer_Dependency: transferDependency,
    Fiscal_Stress_Score: stressScore,
    Fiscal_Risk: risk,
    Development_Gap_Index: gapIndex
  };
}
