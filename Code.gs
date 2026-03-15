// Code.gs
// Google Apps Script Backend for AI Regional Fiscal Intelligence & Stress Prediction System

const SHEET_NAME = "FiscalData";

function doPost(e) {
  try {
    const data = JSON.parse(e.postData.contents);
    const action = data.action;

    if (action === "saveData") {
      return saveToSheet(data.payload);
    } else if (action === "getData") {
      return getFromSheet();
    } else {
      return createResponse({ status: "error", message: "Unknown action" }, 400);
    }
  } catch (error) {
    return createResponse({ status: "error", message: error.toString() }, 500);
  }
}

function doGet(e) {
  return createResponse({ status: "success", message: "API is running" }, 200);
}

function saveToSheet(payload) {
  const sheet = getOrCreateSheet(SHEET_NAME);
  
  // Define columns
  const headers = [
    "Timestamp", "Region", "Province", "Year", "GDP Growth", "Revenue", "PAD",
    "Transfer Revenue", "Expenditure", "Capital Expenditure", "Personnel Spending",
    "Social Spending", "Fiscal Balance", "Debt", "Population", "Unemployment",
    "Fiscal Capacity Index", "Transfer Dependency", "Development Gap Index",
    "Fiscal Stress Score", "Fiscal Risk", "Policy Simulation Scenario",
    "Policy Impact", "Policy Recommendation"
  ];

  // Check if headers exist
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(headers);
  }

  // Append data
  const rowData = headers.map(header => {
    if (header === "Timestamp") return new Date().toISOString();
    return payload[header] || payload[header.replace(/ /g, "_")] || "";
  });

  sheet.appendRow(rowData);

  return createResponse({ status: "success", message: "Data saved successfully" }, 200);
}

function getFromSheet() {
  const sheet = getOrCreateSheet(SHEET_NAME);
  const data = sheet.getDataRange().getValues();
  
  if (data.length <= 1) {
    return createResponse({ status: "success", data: [] }, 200);
  }

  const headers = data[0];
  const rows = data.slice(1);
  
  const result = rows.map(row => {
    const obj = {};
    headers.forEach((header, index) => {
      obj[header] = row[index];
    });
    return obj;
  });

  return createResponse({ status: "success", data: result }, 200);
}

function getOrCreateSheet(sheetName) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(sheetName);
  if (!sheet) {
    sheet = ss.insertSheet(sheetName);
  }
  return sheet;
}

function createResponse(data, statusCode) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

// Setup function to initialize the spreadsheet
function setup() {
  const sheet = getOrCreateSheet(SHEET_NAME);
  const headers = [
    "Timestamp", "Region", "Province", "Year", "GDP Growth", "Revenue", "PAD",
    "Transfer Revenue", "Expenditure", "Capital Expenditure", "Personnel Spending",
    "Social Spending", "Fiscal Balance", "Debt", "Population", "Unemployment",
    "Fiscal Capacity Index", "Transfer Dependency", "Development Gap Index",
    "Fiscal Stress Score", "Fiscal Risk", "Policy Simulation Scenario",
    "Policy Impact", "Policy Recommendation"
  ];
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(headers);
  }
}
