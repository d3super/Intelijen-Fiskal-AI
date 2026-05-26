/// <reference types="vite/client" />

import { RegionalData, CustomScenario } from '../types';
import { getAccessToken } from '../utils/auth';

const SPREADSHEET_ID_KEY = 'fiscalia_spreadsheet_id';

export const saveToGoogleSheetsBulk = async (data: RegionalData[]): Promise<boolean> => {
  const token = await getAccessToken();
  if (!token) return false;

  try {
    let spreadsheetId = localStorage.getItem(SPREADSHEET_ID_KEY);
    
    if (!spreadsheetId) {
      // Create a new spreadsheet
      const createRes = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          properties: {
            title: `Database Fiskal Daerah - ${new Date().toLocaleDateString('id-ID')}`,
          },
        }),
      });

      if (!createRes.ok) throw new Error('Failed to create spreadsheet');
      const spreadsheet = await createRes.json();
      spreadsheetId = spreadsheet.spreadsheetId;
      localStorage.setItem(SPREADSHEET_ID_KEY, spreadsheetId as string);
    }

    if (data.length === 0) return true;
    
    // Convert to values array
    const columns = Object.keys(data[0]);
    const values = [
      columns,
      ...data.map(row => columns.map(col => String((row as any)[col] || '')))
    ];

    // Read existing data to see if we need to append or replace
    // Actually, appending is safer for "menyimpan data secara permanen"
    
    // We will just append
    const appendValues = data.map(row => columns.map(col => String((row as any)[col] || '')));

    // But wait, what if the header isn't there? We should probably just clear and replace all data, or append.
    // If we're updating the whole dataset from React state, let's just clear and overwrite to ensure sync.
    const updateRes = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Sheet1!A1:Z${values.length}?valueInputOption=USER_ENTERED`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        range: `Sheet1!A1:Z${values.length}`,
        majorDimension: 'ROWS',
        values: values,
      }),
    });

    if (!updateRes.ok) throw new Error('Failed to update spreadsheet data');
    
    return true;
  } catch (error) {
    console.error('Error saving to Google Sheets:', error);
    return false;
  }
};

export const getFromGoogleSheets = async (token?: string): Promise<RegionalData[]> => {
  const accessToken = token || await getAccessToken();
  if (!accessToken) return [];

  const spreadsheetId = localStorage.getItem(SPREADSHEET_ID_KEY);
  if (!spreadsheetId) return [];

  try {
    const response = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Sheet1!A1:Z`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      }
    });

    if (!response.ok) return [];

    const result = await response.json();
    if (result.values && result.values.length > 1) {
      const headers = result.values[0];
      const rows = result.values.slice(1);
      
      return rows.map((row: any[], i: number) => {
        const obj: any = { id: `sheet-${Date.now()}-${i}` };
        headers.forEach((header: string, index: number) => {
          let val: any = row[index] || '';
          if (!isNaN(Number(val)) && val !== '') val = Number(val);
          obj[header] = val;
        });
        return obj as RegionalData;
      });
    }
    return [];
  } catch (error) {
    console.error('Error fetching from Google Sheets:', error);
    return [];
  }
};

export const ensureSkenarioSheetExists = async (token: string, spreadsheetId: string): Promise<boolean> => {
  try {
    const res = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return false;
    const spreadsheet = await res.json();
    const sheetTitles = spreadsheet.sheets?.map((s: any) => s.properties?.title) || [];
    
    if (!sheetTitles.includes('Skenario')) {
      const addSheetRes = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}:batchUpdate`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          requests: [
            {
              addSheet: {
                properties: { title: 'Skenario' },
              },
            },
          ],
        }),
      });
      return addSheetRes.ok;
    }
    return true;
  } catch (err) {
    console.error('Error ensuring Skenario sheet exists:', err);
    return false;
  }
};

export const saveCustomScenarioToSheets = async (scenario: Omit<CustomScenario, 'createdAt' | 'id'>): Promise<boolean> => {
  const token = await getAccessToken();
  if (!token) return false;

  try {
    let spreadsheetId = localStorage.getItem(SPREADSHEET_ID_KEY);
    
    if (!spreadsheetId) {
      const createRes = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          properties: {
            title: `Database Fiskal Daerah - ${new Date().toLocaleDateString('id-ID')}`,
          },
        }),
      });

      if (!createRes.ok) throw new Error('Failed to create spreadsheet');
      const spreadsheet = await createRes.json();
      spreadsheetId = spreadsheet.spreadsheetId;
      localStorage.setItem(SPREADSHEET_ID_KEY, spreadsheetId as string);
    }

    const sheetOk = await ensureSkenarioSheetExists(token, spreadsheetId as string);
    if (!sheetOk) throw new Error('Failed to ensure Skenario sheet exists');

    const getRes = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Skenario!A1:Z`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    
    const result = await getRes.json();
    const existingValues = result.values || [];
    
    const headers = [
      'ID',
      'Judul Skenario',
      'Deskripsi',
      'Daerah',
      'Tahun',
      'Kuartal',
      'Kenaikan PAD (%)',
      'Kenaikan Belanja Modal (%)',
      'Pengurangan Belanja Pegawai (%)',
      'Kenaikan Belanja Sosial (%)',
      'Pengurangan Transfer (%)',
      'Tanggal Dibuat'
    ];

    const hasHeaders = existingValues.length > 0;
    const nextRowIndex = existingValues.length + 1;
    
    const id = `scenario-${Date.now()}`;
    const createdAt = new Date().toLocaleString('id-ID');
    
    const newRow = [
      id,
      scenario.title,
      scenario.description,
      scenario.region,
      String(scenario.year),
      scenario.quarter || '',
      String(scenario.padIncrease),
      String(scenario.capitalExpIncrease),
      String(scenario.personnelExpDecrease),
      String(scenario.socialExpIncrease),
      String(scenario.transferDecrease),
      createdAt
    ];

    const updateValues: string[][] = [];
    if (!hasHeaders) {
      updateValues.push(headers);
    }
    updateValues.push(newRow);

    const range = !hasHeaders 
      ? `Skenario!A1:L2` 
      : `Skenario!A${nextRowIndex}:L${nextRowIndex}`;

    const updateRes = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}?valueInputOption=USER_ENTERED`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        range,
        majorDimension: 'ROWS',
        values: updateValues,
      }),
    });

    if (!updateRes.ok) throw new Error('Failed to write scenario to sheets');
    return true;
  } catch (error) {
    console.error('Error saving scenario to sheets:', error);
    return false;
  }
};

export const getCustomScenariosFromSheets = async (): Promise<CustomScenario[]> => {
  const token = await getAccessToken();
  if (!token) return [];

  const spreadsheetId = localStorage.getItem(SPREADSHEET_ID_KEY);
  if (!spreadsheetId) return [];

  try {
    const sheetOk = await ensureSkenarioSheetExists(token, spreadsheetId);
    if (!sheetOk) return [];

    const getRes = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Skenario!A1:Z`, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!getRes.ok) return [];
    
    const result = await getRes.json();
    const values = result.values || [];
    if (values.length <= 1) return [];

    const headers = values[0];
    const rows = values.slice(1);

    const keyMap: Record<string, keyof CustomScenario> = {
      'ID': 'id',
      'Judul Skenario': 'title',
      'Deskripsi': 'description',
      'Daerah': 'region',
      'Tahun': 'year',
      'Kuartal': 'quarter',
      'Kenaikan PAD (%)': 'padIncrease',
      'Kenaikan Belanja Modal (%)': 'capitalExpIncrease',
      'Pengurangan Belanja Pegawai (%)': 'personnelExpDecrease',
      'Kenaikan Belanja Sosial (%)': 'socialExpIncrease',
      'Pengurangan Transfer (%)': 'transferDecrease',
      'Tanggal Dibuat': 'createdAt',
    };

    return rows.map((row: any[]) => {
      const scenario: any = {};
      headers.forEach((header: string, idx: number) => {
        const key = keyMap[header];
        if (key) {
          let val = row[idx] || '';
          if (['year', 'padIncrease', 'capitalExpIncrease', 'personnelExpDecrease', 'socialExpIncrease', 'transferDecrease'].includes(key)) {
            val = Number(val) || 0;
          }
          scenario[key] = val;
        }
      });
      return scenario as CustomScenario;
    });
  } catch (error) {
    console.error('Error getting custom scenarios from sheets:', error);
    return [];
  }
};

