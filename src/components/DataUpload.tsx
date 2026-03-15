import React, { useState } from 'react';
import { Upload, FileSpreadsheet, FileText, CheckCircle2, AlertCircle, Download } from 'lucide-react';
import * as XLSX from 'xlsx';
import { RegionalData } from '../types';
import { calculateFiscalMetrics } from '../utils/fiscalCalculations';

export default function DataUpload({ onUpload }: { onUpload: (data: RegionalData[]) => void }) {
  const [isDragging, setIsDragging] = useState(false);
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'processing' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files) as File[];
    processFiles(files);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files) as File[];
      processFiles(files);
    }
  };

  const processFiles = async (files: File[]) => {
    setUploadStatus('processing');
    try {
      const allData: RegionalData[] = [];

      for (const file of files) {
        if (file.name.endsWith('.xlsx') || file.name.endsWith('.xls')) {
          const data = await processExcel(file);
          allData.push(...data);
        } else if (file.name.endsWith('.pdf')) {
          // In a real app, we'd use pdfjs-dist here.
          // For this prototype, we'll simulate PDF extraction.
          const data = await simulatePDFExtraction(file);
          allData.push(...data);
        } else {
          throw new Error('Format file tidak didukung. Silakan unggah file .xlsx atau .pdf.');
        }
      }

      // Calculate metrics for all uploaded data
      const processedData = allData.map(calculateFiscalMetrics);
      
      onUpload(processedData);
      setUploadStatus('success');
      setTimeout(() => setUploadStatus('idle'), 3000);
    } catch (error: any) {
      setUploadStatus('error');
      setErrorMessage(error.message || 'Terjadi kesalahan saat mengunggah.');
    }
  };

  const processExcel = (file: File): Promise<RegionalData[]> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          const firstSheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[firstSheetName];
          const json = XLSX.utils.sheet_to_json(worksheet) as any[];
          
          // Map JSON to RegionalData structure
          const mappedData: RegionalData[] = json.map((row, index) => ({
            id: `excel-${Date.now()}-${index}`,
            Region: row.Region || row.region || 'Daerah Tidak Diketahui',
            Province: row.Province || row.province || 'Provinsi Tidak Diketahui',
            Year: parseInt(row.Year || row.year) || new Date().getFullYear(),
            GDP_Growth: parseFloat(row.GDP_Growth || row.gdp_growth) || 0,
            Revenue: parseFloat(row.Revenue || row.revenue) || 0,
            PAD: parseFloat(row.PAD || row.pad) || 0,
            Transfer: parseFloat(row.Transfer || row.transfer) || 0,
            Expenditure: parseFloat(row.Expenditure || row.expenditure) || 0,
            Capital_Expenditure: parseFloat(row.Capital_Expenditure || row.capital_expenditure) || 0,
            Personnel_Spending: parseFloat(row.Personnel_Spending || row.personnel_spending) || 0,
            Social_Spending: parseFloat(row.Social_Spending || row.social_spending) || 0,
            Fiscal_Balance: parseFloat(row.Fiscal_Balance || row.fiscal_balance) || 0,
            Debt: parseFloat(row.Debt || row.debt) || 0,
            Population: parseInt(row.Population || row.population) || 0,
            Unemployment: parseFloat(row.Unemployment || row.unemployment) || 0,
          }));
          
          resolve(mappedData);
        } catch (error) {
          reject(new Error('Gagal membaca file Excel. Pastikan kolom sesuai dengan format yang dibutuhkan.'));
        }
      };
      reader.onerror = () => reject(new Error('Gagal membaca file.'));
      reader.readAsArrayBuffer(file);
    });
  };

  const simulatePDFExtraction = (file: File): Promise<RegionalData[]> => {
    return new Promise((resolve) => {
      setTimeout(() => {
        // Simulate extracted data from APBD PDF
        resolve([{
          id: `pdf-${Date.now()}`,
          Region: file.name.replace('.pdf', ''),
          Province: 'Provinsi Simulasi',
          Year: new Date().getFullYear(),
          GDP_Growth: 5.2,
          Revenue: 1500000,
          PAD: 300000,
          Transfer: 1100000,
          Expenditure: 1550000,
          Capital_Expenditure: 400000,
          Personnel_Spending: 600000,
          Social_Spending: 200000,
          Fiscal_Balance: -50000,
          Debt: 100000,
          Population: 500000,
          Unemployment: 6.5,
        }]);
      }, 1500);
    });
  };

  const downloadTemplate = () => {
    const templateData = [{
      Region: 'Jakarta', Province: 'DKI Jakarta', Year: 2023,
      GDP_Growth: 5.2, Revenue: 80000000, PAD: 55000000, Transfer: 20000000,
      Expenditure: 75000000, Capital_Expenditure: 20000000, Personnel_Spending: 25000000,
      Social_Spending: 10000000, Fiscal_Balance: 5000000, Debt: 15000000,
      Population: 10500000, Unemployment: 7.5
    }];
    
    const ws = XLSX.utils.json_to_sheet(templateData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Template");
    XLSX.writeFile(wb, "Template_Data_Fiskal.xlsx");
  };

  const loadSampleData = () => {
    setUploadStatus('processing');
    setTimeout(() => {
      const sampleData: RegionalData[] = [
        // 2022 Data
        {
          id: 'sample-1-2022', Region: 'Jakarta', Province: 'DKI Jakarta', Year: 2022,
          GDP_Growth: 4.8, Revenue: 75000000, PAD: 50000000, Transfer: 18000000,
          Expenditure: 70000000, Capital_Expenditure: 18000000, Personnel_Spending: 23000000,
          Social_Spending: 9000000, Fiscal_Balance: 5000000, Debt: 14000000,
          Population: 10400000, Unemployment: 8.0
        },
        {
          id: 'sample-2-2022', Region: 'Surabaya', Province: 'Jawa Timur', Year: 2022,
          GDP_Growth: 5.5, Revenue: 9500000, PAD: 4500000, Transfer: 3800000,
          Expenditure: 9800000, Capital_Expenditure: 2200000, Personnel_Spending: 3800000,
          Social_Spending: 1300000, Fiscal_Balance: -300000, Debt: 1800000,
          Population: 2950000, Unemployment: 6.5
        },
        // 2023 Data
        {
          id: 'sample-1-2023', Region: 'Jakarta', Province: 'DKI Jakarta', Year: 2023,
          GDP_Growth: 5.2, Revenue: 80000000, PAD: 55000000, Transfer: 20000000,
          Expenditure: 75000000, Capital_Expenditure: 20000000, Personnel_Spending: 25000000,
          Social_Spending: 10000000, Fiscal_Balance: 5000000, Debt: 15000000,
          Population: 10500000, Unemployment: 7.5
        },
        {
          id: 'sample-2-2023', Region: 'Surabaya', Province: 'Jawa Timur', Year: 2023,
          GDP_Growth: 5.8, Revenue: 10000000, PAD: 5000000, Transfer: 4000000,
          Expenditure: 10500000, Capital_Expenditure: 2500000, Personnel_Spending: 4000000,
          Social_Spending: 1500000, Fiscal_Balance: -500000, Debt: 2000000,
          Population: 3000000, Unemployment: 6.2
        },
        {
          id: 'sample-3-2023', Region: 'Bandung', Province: 'Jawa Barat', Year: 2023,
          GDP_Growth: 5.0, Revenue: 7000000, PAD: 2500000, Transfer: 4000000,
          Expenditure: 7200000, Capital_Expenditure: 1500000, Personnel_Spending: 3500000,
          Social_Spending: 1000000, Fiscal_Balance: -200000, Debt: 1000000,
          Population: 2500000, Unemployment: 8.1
        },
        {
          id: 'sample-4-2023', Region: 'Medan', Province: 'Sumatera Utara', Year: 2023,
          GDP_Growth: 4.5, Revenue: 6000000, PAD: 1500000, Transfer: 4200000,
          Expenditure: 6500000, Capital_Expenditure: 1000000, Personnel_Spending: 3800000,
          Social_Spending: 800000, Fiscal_Balance: -500000, Debt: 1200000,
          Population: 2400000, Unemployment: 8.9
        },
        {
          id: 'sample-5-2023', Region: 'Makassar', Province: 'Sulawesi Selatan', Year: 2023,
          GDP_Growth: 6.1, Revenue: 4500000, PAD: 1200000, Transfer: 3000000,
          Expenditure: 4400000, Capital_Expenditure: 1200000, Personnel_Spending: 2000000,
          Social_Spending: 500000, Fiscal_Balance: 100000, Debt: 500000,
          Population: 1500000, Unemployment: 5.5
        },
        // 2024 Data
        {
          id: 'sample-1-2024', Region: 'Jakarta', Province: 'DKI Jakarta', Year: 2024,
          GDP_Growth: 5.4, Revenue: 85000000, PAD: 60000000, Transfer: 21000000,
          Expenditure: 80000000, Capital_Expenditure: 22000000, Personnel_Spending: 26000000,
          Social_Spending: 11000000, Fiscal_Balance: 5000000, Debt: 14500000,
          Population: 10600000, Unemployment: 7.0
        },
        {
          id: 'sample-2-2024', Region: 'Surabaya', Province: 'Jawa Timur', Year: 2024,
          GDP_Growth: 6.0, Revenue: 11000000, PAD: 5800000, Transfer: 4200000,
          Expenditure: 11200000, Capital_Expenditure: 2800000, Personnel_Spending: 4200000,
          Social_Spending: 1600000, Fiscal_Balance: -200000, Debt: 2100000,
          Population: 3050000, Unemployment: 5.9
        }
      ];
      
      const processedData = sampleData.map(calculateFiscalMetrics);
      onUpload(processedData);
      setUploadStatus('success');
      setTimeout(() => setUploadStatus('idle'), 3000);
    }, 1000);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="bg-white p-8 rounded-xl shadow-sm border border-slate-200">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-xl font-semibold text-slate-800">Unggah Data Fiskal Daerah</h3>
            <p className="text-slate-500 mt-1">
              Unggah dataset Excel (.xlsx) atau dokumen APBD PDF.
            </p>
          </div>
          <div className="flex space-x-2">
            <button 
              onClick={downloadTemplate}
              className="px-4 py-2 bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 rounded-lg text-sm font-medium transition-colors flex items-center space-x-2"
            >
              <Download size={16} />
              <span>Unduh Template</span>
            </button>
            <button 
              onClick={loadSampleData}
              className="px-4 py-2 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-lg text-sm font-medium transition-colors"
            >
              Muat Data Sampel
            </button>
          </div>
        </div>

        <div 
          className={`border-2 border-dashed rounded-xl p-12 text-center transition-colors mt-6 ${
            isDragging ? 'border-indigo-500 bg-indigo-50' : 'border-slate-300 hover:border-indigo-400 hover:bg-slate-50'
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <div className="flex justify-center mb-4">
            <div className="p-4 bg-indigo-100 rounded-full text-indigo-600">
              <Upload size={32} />
            </div>
          </div>
          <h4 className="text-lg font-medium text-slate-700 mb-2">Tarik dan lepas file di sini</h4>
          <p className="text-sm text-slate-500 mb-6">atau klik untuk menelusuri dari komputer Anda</p>
          
          <input 
            type="file" 
            id="file-upload" 
            className="hidden" 
            multiple 
            accept=".xlsx,.xls,.pdf" 
            onChange={handleFileInput}
          />
          <label 
            htmlFor="file-upload" 
            className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 cursor-pointer transition-colors"
          >
            Pilih File
          </label>
        </div>

        {uploadStatus === 'processing' && (
          <div className="mt-6 p-4 bg-blue-50 text-blue-700 rounded-lg flex items-center">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-700 mr-3"></div>
            Memproses file dan menjalankan analisis fiskal AI...
          </div>
        )}

        {uploadStatus === 'success' && (
          <div className="mt-6 p-4 bg-emerald-50 text-emerald-700 rounded-lg flex items-center">
            <CheckCircle2 className="mr-3" size={20} />
            Data berhasil diunggah dan dianalisis!
          </div>
        )}

        {uploadStatus === 'error' && (
          <div className="mt-6 p-4 bg-rose-50 text-rose-700 rounded-lg flex items-center">
            <AlertCircle className="mr-3" size={20} />
            {errorMessage}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <div className="flex items-center space-x-3 mb-4">
            <FileSpreadsheet className="text-emerald-600" size={24} />
            <h4 className="text-lg font-semibold text-slate-800">Persyaratan Format Excel</h4>
          </div>
          <p className="text-sm text-slate-600 mb-4">
            Pastikan file Excel Anda berisi kolom berikut (tidak peka huruf besar/kecil):
          </p>
          <ul className="text-sm text-slate-500 space-y-1 list-disc list-inside">
            <li>Region, Province, Year</li>
            <li>GDP_Growth, Population, Unemployment</li>
            <li>Revenue, PAD, Transfer</li>
            <li>Expenditure, Capital_Expenditure</li>
            <li>Personnel_Spending, Social_Spending</li>
            <li>Fiscal_Balance, Debt</li>
          </ul>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <div className="flex items-center space-x-3 mb-4">
            <FileText className="text-rose-600" size={24} />
            <h4 className="text-lg font-semibold text-slate-800">Ekstraksi PDF APBD</h4>
          </div>
          <p className="text-sm text-slate-600 mb-4">
            Mesin AI secara otomatis mendeteksi dan mengekstrak tabel fiskal dari dokumen resmi APBD.
          </p>
          <p className="text-sm text-slate-500">
            Sistem menormalisasi kata kunci seperti "Pendapatan Asli Daerah" menjadi PAD dan "Belanja Pegawai" menjadi Personnel Spending.
          </p>
        </div>
      </div>
    </div>
  );
}
