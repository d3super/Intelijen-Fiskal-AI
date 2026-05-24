import { RegionalData } from '../types';

export const saveToGoogleSheet = async (accessToken: string, data: RegionalData[]) => {
  // Create a new spreadsheet
  const createRes = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      properties: {
        title: `Data Fiskal Daerah - ${new Date().toLocaleDateString('id-ID')}`,
      },
    }),
  });

  if (!createRes.ok) throw new Error('Failed to create spreadsheet');
  const spreadsheet = await createRes.json();
  const spreadsheetId = spreadsheet.spreadsheetId;
  const spreadsheetUrl = spreadsheet.spreadsheetUrl;

  // Prepare data for the sheet
  if (data.length === 0) return spreadsheetUrl;
  
  // Get all keys/columns from the first object
  const columns = Object.keys(data[0]);
  
  // Set up values row by row
  const values = [
    columns, // Header row
    ...data.map(row => columns.map(col => String((row as any)[col] || '')))
  ];

  // Write data to the spreadsheet
  const updateRes = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Sheet1!A1:Z${values.length}?valueInputOption=USER_ENTERED`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      range: `Sheet1!A1:Z${values.length}`,
      majorDimension: 'ROWS',
      values: values,
    }),
  });

  if (!updateRes.ok) throw new Error('Failed to update spreadsheet data');

  return spreadsheetUrl;
};
