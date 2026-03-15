export interface RegionalData {
  id: string;
  Region: string;
  Province: string;
  Year: number;
  GDP_Growth: number;
  Revenue: number;
  PAD: number;
  Transfer: number;
  Expenditure: number;
  Capital_Expenditure: number;
  Personnel_Spending: number;
  Social_Spending: number;
  Fiscal_Balance: number;
  Debt: number;
  Population: number;
  Unemployment: number;
  
  // Calculated fields
  Fiscal_Capacity_Index?: number;
  Transfer_Dependency?: number;
  Fiscal_Stress_Score?: number;
  Fiscal_Risk?: 'Stable' | 'Warning' | 'High risk' | 'Severe fiscal stress';
  Development_Gap_Index?: number;
}

export interface AnalysisResult {
  overview: string;
  revenueStructure: string;
  padPerformance: string;
  transferDependency: string;
  expenditureComposition: string;
  fiscalBalance: string;
  debtSustainability: string;
}

export interface PolicyScenario {
  padIncrease: number;
  capitalExpIncrease: number;
  personnelExpDecrease: number;
  socialExpIncrease: number;
  transferDecrease: number;
}
