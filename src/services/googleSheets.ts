/// <reference types="vite/client" />
import { RegionalData } from '../types';

const SCRIPT_URL = import.meta.env.VITE_GOOGLE_APPS_SCRIPT_URL;

export const saveToGoogleSheets = async (data: RegionalData): Promise<boolean> => {
  if (!SCRIPT_URL) {
    console.warn('VITE_GOOGLE_APPS_SCRIPT_URL is not set. Data will not be saved to Google Sheets.');
    return false;
  }

  try {
    const response = await fetch(SCRIPT_URL, {
      method: 'POST',
      body: JSON.stringify({
        action: 'saveData',
        payload: data
      }),
      headers: {
        'Content-Type': 'text/plain;charset=utf-8',
      }
    });

    const result = await response.json();
    return result.status === 'success';
  } catch (error) {
    console.error('Error saving to Google Sheets:', error);
    return false;
  }
};

export const getFromGoogleSheets = async (): Promise<RegionalData[]> => {
  if (!SCRIPT_URL) {
    console.warn('VITE_GOOGLE_APPS_SCRIPT_URL is not set. Cannot fetch data from Google Sheets.');
    return [];
  }

  try {
    const response = await fetch(SCRIPT_URL, {
      method: 'POST',
      body: JSON.stringify({
        action: 'getData'
      }),
      headers: {
        'Content-Type': 'text/plain;charset=utf-8',
      }
    });

    const result = await response.json();
    if (result.status === 'success' && result.data) {
      // Map the returned data back to RegionalData format
      return result.data.map((row: any) => ({
        id: `sheet-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        Region: row.Region || '',
        Province: row.Province || '',
        Year: parseInt(row.Year) || new Date().getFullYear(),
        GDP_Growth: parseFloat(row['GDP Growth']) || 0,
        Revenue: parseFloat(row.Revenue) || 0,
        PAD: parseFloat(row.PAD) || 0,
        Transfer: parseFloat(row['Transfer Revenue']) || 0,
        Expenditure: parseFloat(row.Expenditure) || 0,
        Capital_Expenditure: parseFloat(row['Capital Expenditure']) || 0,
        Personnel_Spending: parseFloat(row['Personnel Spending']) || 0,
        Social_Spending: parseFloat(row['Social Spending']) || 0,
        Fiscal_Balance: parseFloat(row['Fiscal Balance']) || 0,
        Debt: parseFloat(row.Debt) || 0,
        Population: parseInt(row.Population) || 0,
        Unemployment: parseFloat(row.Unemployment) || 0,
        Fiscal_Capacity_Index: parseFloat(row['Fiscal Capacity Index']) || 0,
        Transfer_Dependency: parseFloat(row['Transfer Dependency']) || 0,
        Development_Gap_Index: parseFloat(row['Development Gap Index']) || 0,
        Fiscal_Stress_Score: parseFloat(row['Fiscal Stress Score']) || 0,
        Fiscal_Risk: row['Fiscal Risk'] || 'Low',
        Policy_Simulation_Scenario: row['Policy Simulation Scenario'] || '',
        Policy_Impact: row['Policy Impact'] || '',
        Policy_Recommendation: row['Policy Recommendation'] || ''
      }));
    }
    return [];
  } catch (error) {
    console.error('Error fetching from Google Sheets:', error);
    return [];
  }
};
