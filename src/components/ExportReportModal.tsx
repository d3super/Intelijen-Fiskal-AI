import React, { useState, useMemo, useRef } from 'react';
import { RegionalData, PolicyScenario } from '../types';
import { runFiscalSimulation } from '../utils/fiscalMultiplierModel';
import { Loader2, X, Download, FileText } from 'lucide-react';
import jsPDF from 'jspdf';
import * as htmlToImage from 'html-to-image';

const getRiskLabel = (risk?: string) => {
  switch(risk) {
    case 'Stable': return 'Stabil';
    case 'Warning': return 'Peringatan';
    case 'High risk': return 'Risiko Tinggi';
    case 'Severe fiscal stress': return 'Stres Berat';
    default: return 'Tidak Diketahui';
  }
};

interface ExportReportModalProps {
  data: RegionalData[];
  onClose: () => void;
}

export default function ExportReportModal({ data, onClose }: ExportReportModalProps) {
  const uniqueRegions = useMemo(() => Array.from(new Set(data.map(d => d.Region))).sort(), [data]);
  const [selectedRegion, setSelectedRegion] = useState<string>(uniqueRegions[0] || '');

  const regionDataAllYears = useMemo(() => {
    return data.filter(d => d.Region === selectedRegion).sort((a, b) => a.Year - b.Year);
  }, [data, selectedRegion]);

  const availableYears = useMemo(() => {
    return Array.from(new Set(regionDataAllYears.map(d => d.Year))).sort((a: number, b: number) => b - a);
  }, [regionDataAllYears]);

  const [selectedYear, setSelectedYear] = useState<number>(availableYears[0] || new Date().getFullYear());

  const availableQuarters = useMemo(() => {
    return Array.from(new Set(regionDataAllYears.filter(d => d.Year === selectedYear).map(d => d.Quarter).filter(Boolean) as string[])).sort();
  }, [regionDataAllYears, selectedYear]);

  const [selectedQuarter, setSelectedQuarter] = useState<string>(availableQuarters[0] || '');

  const [isExporting, setIsExporting] = useState(false);
  const reportRef = useRef<HTMLDivElement>(null);

  // Update selected year if region changes
  React.useEffect(() => {
    if (availableYears.length > 0 && !availableYears.includes(selectedYear)) {
      setSelectedYear(availableYears[0]);
    }
  }, [availableYears, selectedYear]);

  // Update selected quarter if year or region changes
  React.useEffect(() => {
    if (availableQuarters.length > 0 && !availableQuarters.includes(selectedQuarter)) {
      setSelectedQuarter(availableQuarters[0]);
    } else if (availableQuarters.length === 0 && selectedQuarter !== '') {
      setSelectedQuarter('');
    }
  }, [availableQuarters, selectedQuarter]);

  const targetData = regionDataAllYears.find(d => d.Year === selectedYear && (d.Quarter === selectedQuarter || (!d.Quarter && !selectedQuarter))) || regionDataAllYears.find(d => d.Year === selectedYear) || regionDataAllYears[0];

  const handleExport = async () => {
    if (!reportRef.current || !targetData) return;
    setIsExporting(true);
    
    try {
      const dataUrl = await htmlToImage.toPng(reportRef.current, { 
        quality: 1.0,
        pixelRatio: 2,
        backgroundColor: '#ffffff'
      });

      const a4Width = 210;
      const a4Height = 297;
      const pdfHeight = (reportRef.current.offsetHeight * a4Width) / reportRef.current.offsetWidth;

      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      let heightLeft = pdfHeight;
      let position = 0;

      pdf.addImage(dataUrl, 'PNG', 0, position, a4Width, pdfHeight);
      heightLeft -= a4Height;

      while (heightLeft > 0) {
        position -= a4Height;
        pdf.addPage();
        pdf.addImage(dataUrl, 'PNG', 0, position, a4Width, pdfHeight);
        heightLeft -= a4Height;
      }

      pdf.save(`Laporan_Fiscalia_${targetData.Region}_${targetData.Year}${targetData.Quarter || ''}.pdf`);
    } catch (error) {
      console.error('Failed to export report PDF', error);
    } finally {
      setIsExporting(false);
      onClose();
    }
  };

  if (!targetData) {
    return null;
  }

  const [presetName, setPresetName] = useState<string>('Pro-Infrastruktur');
  const [scenario, setScenario] = useState<PolicyScenario>({
    padIncrease: 5,
    capitalExpIncrease: 25,
    personnelExpDecrease: 10,
    socialExpIncrease: 5,
    transferDecrease: 0
  });

  const handlePresetChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    setPresetName(val);
    switch (val) {
      case 'Pro-Infrastruktur':
        setScenario({ padIncrease: 5, capitalExpIncrease: 25, personnelExpDecrease: 10, socialExpIncrease: 5, transferDecrease: 0 });
        break;
      case 'Austeritas Ketat':
        setScenario({ padIncrease: 20, capitalExpIncrease: 0, personnelExpDecrease: 15, socialExpIncrease: 0, transferDecrease: 15 });
        break;
      case 'Proteksi Sosial':
        setScenario({ padIncrease: 3, capitalExpIncrease: 5, personnelExpDecrease: 5, socialExpIncrease: 30, transferDecrease: 0 });
        break;
      case 'Ekspansi PAD':
        setScenario({ padIncrease: 15, capitalExpIncrease: 10, personnelExpDecrease: 8, socialExpIncrease: 0, transferDecrease: 15 });
        break;
      default:
        setScenario({ padIncrease: 5, capitalExpIncrease: 25, personnelExpDecrease: 10, socialExpIncrease: 5, transferDecrease: 0 });
    }
  };

  const simResult = runFiscalSimulation(targetData, scenario);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-xl relative flex flex-col">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center">
          <h3 className="text-xl font-bold text-slate-800 flex items-center space-x-2">
            <FileText className="text-indigo-600" size={24} />
            <span>Ekspor Laporan (PDF)</span>
          </h3>
          <button 
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 bg-slate-50 hover:bg-slate-100 rounded-full p-2 transition-colors cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-6 space-y-5 flex-1">
          <div>
             <label className="block text-sm font-medium text-slate-700 mb-1">Daerah</label>
             <select 
               className="w-full px-4 py-2 border border-slate-300 rounded-lg bg-slate-50 text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
               value={selectedRegion}
               onChange={(e) => setSelectedRegion(e.target.value)}
             >
               {uniqueRegions.map(region => (
                 <option key={region} value={region}>{region}</option>
               ))}
             </select>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Tahun</label>
              <select 
                className="w-full px-4 py-2 border border-slate-300 rounded-lg bg-slate-50 text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
              >
                {availableYears.map(year => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            </div>
            
            {availableQuarters.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Kuartal</label>
                <select 
                  className="w-full px-4 py-2 border border-slate-300 rounded-lg bg-slate-50 text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  value={selectedQuarter}
                  onChange={(e) => setSelectedQuarter(e.target.value)}
                >
                  {availableQuarters.map(q => (
                    <option key={q} value={q}>{q}</option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <div>
             <label className="block text-sm font-medium text-slate-700 mb-1">Instrumen Skenario</label>
             <select 
               className="w-full px-4 py-2 border border-slate-300 rounded-lg bg-slate-50 text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
               value={presetName}
               onChange={handlePresetChange}
             >
               <option value="Pro-Infrastruktur">Pro-Infrastruktur</option>
               <option value="Proteksi Sosial">Proteksi Sosial</option>
               <option value="Ekspansi PAD">Ekspansi PAD</option>
               <option value="Austeritas Ketat">Austeritas Ketat</option>
             </select>
          </div>
          
          <div className="bg-indigo-50 border border-indigo-100 p-4 rounded-xl text-sm text-indigo-800">
            <p className="font-medium mb-1">Laporan akan mencakup:</p>
            <ul className="list-disc pl-5 space-y-1 text-slate-700">
              <li>Nama Daerah & Periode</li>
              <li>Parameter Stres Fiskal & Kapasitas</li>
              <li>Narasi Laporan Fiscalia</li>
              <li>Hasil Simulasi Kebijakan & Rekomendasi</li>
            </ul>
          </div>
        </div>

        <div className="p-6 border-t border-slate-100 bg-slate-50 rounded-b-2xl">
          <button 
            onClick={handleExport}
            disabled={isExporting}
            className="w-full flex items-center justify-center space-x-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-6 rounded-xl transition-colors cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {isExporting ? <Loader2 className="animate-spin" size={20} /> : <Download size={20} />}
            <span>{isExporting ? 'Memproses PDF...' : 'Unduh Laporan PDF'}</span>
          </button>
        </div>
      </div>

      {/* Hidden layout for PDF Snapshot rendering */}
      <div className="absolute left-[-9999px] top-[-9999px]">
        <div ref={reportRef} className="bg-white p-10 w-[800px] text-slate-800 font-sans">
          
          {/* Header */}
          <div className="border-b-4 border-indigo-600 pb-6 mb-8 flex justify-between items-end">
            <div>
              <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight">Laporan Fiscalia</h1>
              <p className="text-xl text-slate-500 mt-2">Analisis & Pemantauan Kapasitas Fiskal Daerah</p>
            </div>
            <div className="text-right">
              <p className="text-sm font-semibold uppercase tracking-wider text-indigo-600">Terbitan Resmi</p>
              <p className="text-sm text-slate-500">{new Date().toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
            </div>
          </div>

          {/* 1 & 2: Nama Daerah & Periode */}
          <div className="bg-slate-50 p-6 rounded-xl border border-slate-200 mb-8 grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-slate-500 uppercase font-semibold">1. Nama Daerah</p>
              <p className="text-2xl font-bold text-slate-800">{targetData.Region}</p>
              <p className="text-sm text-slate-500">{targetData.Province}</p>
            </div>
            <div>
              <p className="text-sm text-slate-500 uppercase font-semibold">2. Periode Analisis</p>
              <p className="text-2xl font-bold text-slate-800">{targetData.Year} {targetData.Quarter || ''}</p>
            </div>
          </div>

          {/* 3: Parameter Fiskal */}
          <h2 className="text-xl font-bold text-slate-800 border-b border-slate-200 pb-2 mb-4">3. Parameter Fiskal Terkini</h2>
          <div className="grid grid-cols-3 gap-4 mb-8">
            <div className="border border-slate-200 rounded-lg p-4">
              <p className="text-xs text-slate-500 font-bold uppercase mb-1">Skor Stres Fiskal</p>
              <p className="text-2xl font-bold text-slate-800">{targetData.Fiscal_Stress_Score?.toFixed(1) || 0} / 100</p>
            </div>
            <div className="border border-slate-200 rounded-lg p-4">
              <p className="text-xs text-slate-500 font-bold uppercase mb-1">Indeks Kapasitas Fiskal</p>
              <p className="text-2xl font-bold text-slate-800">{targetData.Fiscal_Capacity_Index?.toFixed(1) || 0}</p>
            </div>
            <div className="border border-slate-200 rounded-lg p-4">
              <p className="text-xs text-slate-500 font-bold uppercase mb-1">Ketergantungan Transfer</p>
              <p className="text-2xl font-bold text-slate-800">{targetData.Transfer_Dependency?.toFixed(1) || 0}%</p>
            </div>
          </div>

          {/* 4: Narasi Laporan Fiscalia */}
          <h2 className="text-xl font-bold text-slate-800 border-b border-slate-200 pb-2 mb-4">4. Narasi Laporan Fiscalia</h2>
          <div className="bg-slate-50 rounded-lg p-6 border border-slate-200 mb-8 space-y-4">
            <p className="text-sm text-slate-700 leading-relaxed text-justify">
              Berdasarkan kinerja fiskal pada periode pengamatan, <strong>PAD (Pendapatan Asli Daerah) menyumbang {((targetData.PAD / targetData.Revenue) * 100).toFixed(1)}%</strong> dari total pendapatan daerah. Dengan rasio ketergantungan transfer sebesar <strong>{targetData.Transfer_Dependency?.toFixed(1)}%</strong>, daerah ini bergantung secara {targetData.Transfer_Dependency && targetData.Transfer_Dependency > 70 ? 'berat' : 'moderat'} pada transfer pemerintah pusat (DAU, DAK, DBH).
            </p>
            <p className="text-sm text-slate-700 leading-relaxed text-justify">
              Alokasi belanja pemerintah daerah terfokus pada: <strong>Belanja Pegawai ({(targetData.Personnel_Spending / targetData.Expenditure * 100).toFixed(1)}%)</strong>, Belanja Modal ({(targetData.Capital_Expenditure / targetData.Expenditure * 100).toFixed(1)}%), dan Belanja Sosial ({(targetData.Social_Spending / targetData.Expenditure * 100).toFixed(1)}%). Skor stres fiskal adalah <strong>{targetData.Fiscal_Stress_Score?.toFixed(1)}/100</strong>, mengklasifikasikan daerah ini dalam kategori <strong>'{getRiskLabel(targetData.Fiscal_Risk || 'Low')}'</strong>. Keseimbangan fiskal menunjukkan {targetData.Fiscal_Balance < 0 ? 'defisit' : 'surplus'} sebesar {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(Math.abs(targetData.Fiscal_Balance))}.
            </p>
          </div>

          {/* 5: Hasil Simulasi Kebijakan */}
          <h2 className="text-xl font-bold text-slate-800 border-b border-slate-200 pb-2 mb-4">5. Hasil Simulasi Kebijakan ({presetName})</h2>
          
          <div className="mb-6 grid grid-cols-2 gap-6">
            <div>
              <p className="font-semibold text-sm text-slate-800 mb-2">Instrumen Skenario</p>
              <ul className="text-sm text-slate-600 space-y-1 list-disc pl-4">
                <li>Peningkatan PAD: {scenario.padIncrease}%</li>
                <li>Pengurangan Transfer: {scenario.transferDecrease}%</li>
                <li>Peningkatan Belanja Modal: {scenario.capitalExpIncrease}%</li>
                <li>Pengurangan Belanja Pegawai: {scenario.personnelExpDecrease}%</li>
                <li>Peningkatan Belanja Sosial: {scenario.socialExpIncrease}%</li>
              </ul>
            </div>
            <div>
              <p className="font-semibold text-sm text-slate-800 mb-2">Karakteristik Struktural</p>
              <ul className="text-sm text-slate-600 space-y-1 list-disc pl-4">
                <li>Indeks Efisiensi Belanja: {(simResult.metrics.spendingEfficiency * 100).toFixed(1)}%</li>
                <li>Kebocoran Keluar Wilayah: {(simResult.metrics.regionalLeakage * 100).toFixed(1)}%</li>
                <li>Tingkat Ketergantungan Fiskal: {(simResult.metrics.fiscalDependence * 100).toFixed(1)}%</li>
              </ul>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4">
              <p className="text-xs text-emerald-800 font-bold uppercase mb-1">Proyeksi PDRB</p>
              <p className="text-xl font-bold text-emerald-700">{simResult.simulated.gdpGrowth.toFixed(2)}%</p>
              <p className="text-xs text-emerald-600 mt-1">({simResult.impactBreakdown.totalImpact > 0 ? '+' : ''}{simResult.impactBreakdown.totalImpact.toFixed(2)}% dari Base)</p>
            </div>
            <div className={`border rounded-lg p-4 ${simResult.simulated.balance < 0 ? 'bg-rose-50 border-rose-200' : 'bg-emerald-50 border-emerald-200'}`}>
              <p className={`text-xs font-bold uppercase mb-1 ${simResult.simulated.balance < 0 ? 'text-rose-800' : 'text-emerald-800'}`}>Keseimbangan</p>
              <p className={`text-lg font-bold ${simResult.simulated.balance < 0 ? 'text-rose-700' : 'text-emerald-700'}`}>
                {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(Math.abs(simResult.simulated.balance))}
              </p>
              <p className={`text-xs mt-1 ${simResult.simulated.balance < 0 ? 'text-rose-600' : 'text-emerald-600'}`}>{simResult.simulated.balance < 0 ? 'Defisit' : 'Surplus'}</p>
            </div>
            <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
              <p className="text-xs text-slate-600 font-bold uppercase mb-1">Indeks Risiko Skenario</p>
              <p className="text-xl font-bold text-slate-800">{simResult.riskScore.toFixed(1)} <span className="text-sm font-normal">/ 100</span></p>
              <p className="text-xs text-slate-500 mt-1">Kategori: {simResult.riskCategory}</p>
            </div>
          </div>

          <div>
            <p className="font-semibold text-sm text-slate-800 mb-3 border-b border-slate-100 pb-1">Rekomendasi Kebijakan Penyeimbang</p>
            <div className="space-y-3">
              {simResult.recommendations.map((rec, ind) => (
                <div key={ind} className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-sm">
                  <div className="flex justify-between items-start mb-1">
                    <span className="font-bold text-slate-800">{rec.title}</span>
                    <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${rec.priority === 'high' ? 'bg-rose-100 text-rose-700' : rec.priority === 'medium' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>
                      {rec.priority}
                    </span>
                  </div>
                  <p className="text-slate-600 text-xs">{rec.description}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-8 text-center text-xs text-slate-400">
            <p>Digenerasi melalui Platform Fiscalia secara otomatis pada {new Date().toLocaleString('id-ID')}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
