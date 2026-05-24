/// <reference types="vite/client" />
import { RegionalData } from '../types';

import { RegionalData } from '../types';
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

