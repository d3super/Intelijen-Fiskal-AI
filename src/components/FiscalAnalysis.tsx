import React, { useState, useMemo } from 'react';
import { RegionalData } from '../types';
import ReactMarkdown from 'react-markdown';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, AreaChart, Area
} from 'recharts';
import { 
  Activity, AlertTriangle, TrendingDown, TrendingUp, ShieldAlert, Calendar, 
  HelpCircle, X, Info, Cpu, Sparkles, CheckCircle2, Loader2, Copy, Check,
  ChevronDown, Search, ArrowUpRight, ArrowDownRight, Award, FileText, Database,
  TrendingUp as TrendUpIcon, Layers, Radio
} from 'lucide-react';

interface FiscalAnalysisProps {
  data: RegionalData[];
}

export default function FiscalAnalysis({ data }: FiscalAnalysisProps) {
  // Theme colors from the premium SaaS palette
  const COLORS = ['#3b82f6', '#f97316', '#10b981', '#6366f1', '#ec4899', '#f59e0b', '#06b6d4', '#84cc16'];
  const SOFT_COLORS = ['#eff6ff', '#fff7ed', '#ecfdf5', '#eef2ff', '#fdf2f8', '#fffbeb', '#ecfeff', '#f1f8e9'];

  const uniqueRegions = useMemo(() => Array.from(new Set(data.map(d => d.Region))).sort(), [data]);
  const [selectedRegion, setSelectedRegion] = useState<string>(uniqueRegions[0] || '');
  const [isRuleInfoOpen, setIsRuleInfoOpen] = useState(false);

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

  if (data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-slate-500 py-20 bg-slate-50/50 rounded-3xl border border-slate-150">
        <Activity size={48} className="mb-4 text-slate-300 animate-pulse" />
        <h3 className="text-xl font-bold text-slate-700">Tidak Ada Data Fiskal</h3>
        <p className="mt-2 text-sm text-slate-400 max-w-sm text-center">Silakan unggah data fiskal daerah untuk melihat analisis.</p>
      </div>
    );
  }

  const regionData = regionDataAllYears.find(d => d.Year === selectedYear && (d.Quarter === selectedQuarter || (!d.Quarter && !selectedQuarter))) || regionDataAllYears.find(d => d.Year === selectedYear) || regionDataAllYears[0];

  if (!regionData) return null;

  const [aiReport, setAiReport] = useState<string>('');
  const [loadingAi, setLoadingAi] = useState<boolean>(false);
  const [errorAi, setErrorAi] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);

  // Reset states when period or region selection changes
  React.useEffect(() => {
    setAiReport('');
    setErrorAi('');
    setLoadingAi(false);
  }, [selectedRegion, selectedYear, selectedQuarter]);

  const handleCopyReport = () => {
    if (!aiReport) return;
    navigator.clipboard.writeText(aiReport);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleGenerateDiagnostic = async () => {
    if (!regionData) return;
    setLoadingAi(true);
    setErrorAi('');
    setAiReport('');
    try {
      const response = await fetch('/api/gemini/generate-diagnostic', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ regionData })
      });

      if (!response.ok) {
        let serverErrorMsg = 'Gagal berkomunikasi dengan server untuk membuat diagnosis AI.';
        try {
          const errData = await response.json();
          if (errData && errData.error) {
            serverErrorMsg = errData.error;
          }
        } catch (_) {}
        throw new Error(serverErrorMsg);
      }

      const resData = await response.json();
      setAiReport(resData.diagnostic || '');
    } catch (err: any) {
      console.error(err);
      setErrorAi(err.message || 'Terjadi kesalahan tidak terduga.');
    } finally {
      setLoadingAi(false);
    }
  };

  // Helper utility for compact rupiah formatting (e.g. Milyar, Triliun)
  function formatRupiah(value: number) {
    if (value === undefined || value === null) return "Rp 0";
    const absVal = Math.abs(value);
    if (absVal >= 1e12) {
      return `Rp ${(value / 1e12).toFixed(2)} T`;
    }
    if (absVal >= 1e9) {
      return `Rp ${(value / 1e9).toFixed(1)} M`;
    }
    if (absVal >= 1e6) {
      return `Rp ${(value / 1e6).toFixed(0)} Jt`;
    }
    return `Rp ${value.toLocaleString('id-ID')}`;
  }

  // Automated heuristic anomaly detector
  const computedAnomalies = useMemo(() => {
    const list: { type: 'danger' | 'warning' | 'info'; title: string; desc: string; threshold: string }[] = [];
    
    if (!regionData) return list;

    const personnelRatio = (regionData.Personnel_Spending / regionData.Expenditure) * 100;
    const capitalRatio = (regionData.Capital_Expenditure / regionData.Expenditure) * 100;
    const dependencyRatio = regionData.Transfer_Dependency || 0;
    const balanceRatio = regionData.Revenue > 0 ? (regionData.Fiscal_Balance / regionData.Revenue) * 100 : 0;
    const unemployment = regionData.Unemployment || 0;

    // Personnel spending anomaly
    if (personnelRatio > 45) {
      list.push({
        type: 'danger',
        title: 'Beban Belanja Pegawai Ekstrem (Overhead)',
        threshold: '45.0%',
        desc: `Alokasi belanja pegawai mencapai ${personnelRatio.toFixed(1)}% dari total belanja. Pemborosan struktural ini menyedot ruang fiskal pembangunan daerah secara signifikan.`
      });
    } else if (personnelRatio > 35) {
      list.push({
        type: 'warning',
        title: 'Beban Belanja Pegawai Tinggi',
        threshold: '35.0%',
        desc: `Alokasi belanja pegawai berada di level ${personnelRatio.toFixed(1)}%. Perlu penataan formasi pegawaian atau moratorium rekrutmen non-esensial.`
      });
    }

    // Capital expenditure underspending
    if (capitalRatio < 15) {
      list.push({
        type: 'danger',
        title: 'Infrastruktur Sempit (Underspending)',
        threshold: '15.0%',
        desc: `Belanja modal pembangunan hanya ${capitalRatio.toFixed(1)}% dari anggaran (di bawah anjuran UU HKPD sebesar 30%). Menghambat akselerasi ekonomi jangka panjang.`
      });
    } else if (capitalRatio < 20) {
      list.push({
        type: 'warning',
        title: 'Belanja Modal Minim',
        threshold: '20.0%',
        desc: `Belanja modal di kisaran ${capitalRatio.toFixed(1)}%. Akselerasi pembangunan proyek strategis berisiko melambat.`
      });
    }

    // High transfer dependency
    if (dependencyRatio > 80) {
      list.push({
        type: 'danger',
        title: 'Kerentanan Dana Transfer Ekstrem',
        threshold: '80.0%',
        desc: `${dependencyRatio.toFixed(1)}% pendapatan berasal dari Dana Transfer Pusat. Kebijakan fiskal lokal sangat sensitif terhadap shock kebijakan fiskal nasional.`
      });
    } else if (dependencyRatio > 70) {
      list.push({
        type: 'warning',
        title: 'Ketergantungan Transfer Tinggi',
        threshold: '70.0%',
        desc: `Ketergantungan transfer sebesar ${dependencyRatio.toFixed(1)}%. Upaya peningkatan kemandirian PAD harus digenjot.`
      });
    }

    // Budget Deficit
    if (regionData.Fiscal_Balance < 0) {
      const gdpCurrent = regionData.Regional_GDP_Current_Price || (regionData.Revenue * 6.5);
      const deficitRatio = (Math.abs(regionData.Fiscal_Balance) / gdpCurrent) * 100;
      if (deficitRatio > 3.0) {
        list.push({
          type: 'danger',
          title: 'Defisit Anggaran Melampaui Batas Aturan',
          threshold: '3.0% GDP',
          desc: `Defisit berjalan mencapai ${deficitRatio.toFixed(2)}% dari estimasi PDRB. Menabrak batas kritis regulasi nasional (3.00% dari PDRB).`
        });
      } else {
        list.push({
          type: 'warning',
          title: 'Keseimbangan Fiskal Defisit',
          threshold: 'Saldo < 0',
          desc: `APBD mengalami defisit sebesar ${formatRupiah(Math.abs(regionData.Fiscal_Balance))}. Perlu penggunaan SiLPA atau optimalisasi pembiayaan.`
        });
      }
    }

    // Socio-economic anomalies
    if (unemployment > 8.0) {
      list.push({
        type: 'warning',
        title: 'Tekanan Pengangguran Tinggi',
        threshold: '8.0%',
        desc: `Tingkat pengangguran terbuka sebesar ${unemployment.toFixed(2)}%. Belanja jaring pengaman sosial atau insentif investasi daerah perlu dioptimalkan.`
      });
    }

    return list;
  }, [regionData]);

  // Prepare chart data
  const revenueComposition = [
    { name: 'PAD', value: regionData.PAD },
    { name: 'Transfer', value: regionData.Transfer },
    { name: 'Lainnya', value: Math.max(0, regionData.Revenue - regionData.PAD - regionData.Transfer) }
  ].filter(d => d.value > 0);

  const expenditureComposition = [
    { name: 'Pegawai', value: regionData.Personnel_Spending },
    { name: 'Modal', value: regionData.Capital_Expenditure },
    { name: 'Sosial', value: regionData.Social_Spending },
    { name: 'Lainnya', value: Math.max(0, regionData.Expenditure - regionData.Personnel_Spending - regionData.Capital_Expenditure - regionData.Social_Spending) }
  ].filter(d => d.value > 0);

  // Trend data
  const trendData = regionDataAllYears.map(d => ({
    year: d.Year,
    period: d.Quarter ? `${d.Year} ${d.Quarter}` : `${d.Year}`,
    PAD: d.PAD,
    Transfer: d.Transfer,
    Belanja: d.Expenditure,
    KapasitasFiskal: d.Fiscal_Capacity_Index || 0,
    SkorStres: d.Fiscal_Stress_Score || 0
  }));

  const getRiskColor = (risk?: string) => {
    switch(risk) {
      case 'Stable': return 'text-emerald-600 bg-emerald-50/50 border-emerald-150';
      case 'Warning': return 'text-amber-600 bg-amber-50/50 border-amber-150';
      case 'High risk': return 'text-orange-600 bg-orange-50/50 border-orange-150';
      case 'Severe fiscal stress': return 'text-rose-600 bg-rose-50/50 border-rose-150';
      default: return 'text-slate-600 bg-slate-50 border-slate-200';
    }
  };

  const getRiskLabel = (risk?: string) => {
    switch(risk) {
      case 'Stable': return 'Stabil';
      case 'Warning': return 'Peringatan';
      case 'High risk': return 'Risiko Tinggi';
      case 'Severe fiscal stress': return 'Stres Berat';
      default: return 'Tidak Diketahui';
    }
  };

  // Safe Math ratios
  const taxRatioVal = regionData.Revenue > 0 ? (regionData.PAD / regionData.Revenue) * 100 : 0;
  const debtServiceVal = (regionData.Personnel_Spending / (regionData.Expenditure || 1)) * 100;
  const capitalRatioVal = (regionData.Capital_Expenditure / (regionData.Expenditure || 1)) * 100;

  return (
    <div className="space-y-8 pb-12">
      {/* Symmetrical Top Bar / Control Card matching the reference dashboard */}
      <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.01)] flex flex-col lg:flex-row justify-between lg:items-center gap-4">
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <span className="p-1 px-2.5 bg-indigo-50 text-indigo-700 rounded-full font-bold text-[10px] tracking-widest uppercase">
              ALAT AUDIT & DIAGNOSTIK
            </span>
          </div>
          <h2 className="text-xl font-black text-slate-800 tracking-tight flex items-center gap-2">
            Pilih Profil & Lacak Tren Daerah
          </h2>
          <p className="text-xs text-slate-400 font-medium">Lacak kesehatan anggaran murni, komparasi ketergantungan transfer daerah, dan bauran belanja pengikat.</p>
        </div>
        
        {/* Dynamic Period Dropdowns */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Quarter dropdown if quarterly data exists */}
          {availableQuarters.length > 0 && (
            <div className="relative">
              <select 
                className="appearance-none pl-3 pr-8 py-2 border border-slate-200 rounded-xl bg-slate-50 hover:bg-slate-100/50 text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs font-semibold"
                value={selectedQuarter}
                onChange={(e) => setSelectedQuarter(e.target.value)}
              >
                {availableQuarters.map(q => (
                  <option key={q} value={q}>{q}</option>
                ))}
              </select>
              <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            </div>
          )}

          {/* Region selector */}
          <div className="relative">
            <select 
              className="appearance-none pl-8 pr-8 py-2 border border-slate-200 rounded-xl bg-slate-50 hover:bg-slate-100/50 text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs font-semibold"
              value={selectedRegion}
              onChange={(e) => setSelectedRegion(e.target.value)}
            >
              {uniqueRegions.map(region => (
                <option key={region} value={region}>{region}</option>
              ))}
            </select>
            <Database size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          </div>

          {/* Year selector */}
          <div className="relative">
            <select 
              className="appearance-none pl-8 pr-8 py-2 border border-slate-200 rounded-xl bg-slate-50 hover:bg-slate-100/50 text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs font-semibold"
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
            >
              {availableYears.map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
            <Calendar size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          </div>

          <button 
            onClick={() => setIsRuleInfoOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 border border-slate-200 rounded-xl bg-white hover:bg-slate-50 text-slate-600 transition-all text-xs font-bold shadow-sm"
          >
            <HelpCircle size={14} className="text-slate-400" />
            <span>Info Aturan</span>
          </button>
        </div>
      </div>

      {/* Bento-style KPI cards with sub-lists inside exactly like the requested reference */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* KPI 1: Stres Fiskal */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200/60 shadow-[0_4px_24px_rgb(0,0,0,0.01)] flex flex-col justify-between hover:shadow-[0_8px_30px_rgb(0,0,0,0.03)] transition-all duration-300">
          <div>
            <div className="flex items-center justify-between text-xs font-semibold text-slate-400 mb-2">
              <span className="flex items-center gap-1.5">
                <ShieldAlert size={14} className="text-rose-500" />
                <span>Skor Stres Fiskal</span>
              </span>
              <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-md ${
                regionData.Fiscal_Risk === 'Stable' ? 'bg-emerald-50 text-emerald-600' :
                regionData.Fiscal_Risk === 'Warning' ? 'bg-amber-50 text-amber-600' :
                'bg-rose-50 text-rose-600'
              }`}>
                {getRiskLabel(regionData.Fiscal_Risk)}
              </span>
            </div>
            
            <h4 className="text-3xl font-black text-slate-800 tracking-tight mb-1">
              {regionData.Fiscal_Stress_Score?.toFixed(1)} <span className="text-xs text-slate-400 font-semibold">/ 100</span>
            </h4>
            
            <div className="flex items-center text-[10px] text-slate-400 font-semibold">
              <span>Risiko Kerawanan Pembayaran Beban</span>
            </div>
          </div>

          {/* Mini component progress slider bar */}
          <div className="mt-4">
            <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden mb-4">
              <div 
                className={`h-full rounded-full transition-all duration-500 ${
                  (regionData.Fiscal_Stress_Score || 0) > 60 ? 'bg-rose-500' :
                  (regionData.Fiscal_Stress_Score || 0) > 35 ? 'bg-amber-400' : 'bg-emerald-500'
                }`}
                style={{ width: `${Math.min(100, regionData.Fiscal_Stress_Score || 0)}%` }}
              />
            </div>

            {/* Structured details breakdown list inside cards matching the reference image format */}
            <div className="space-y-2 border-t border-slate-50 pt-3 text-[11px] text-slate-500 font-semibold">
              <div className="flex justify-between items-center">
                <span className="text-slate-450 text-slate-400">Total Pendapatan murni</span>
                <span className="font-mono text-slate-700">{formatRupiah(regionData.Revenue)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Keseimbangan Anggaran</span>
                <span className={`font-mono ${regionData.Fiscal_Balance >= 0 ? 'text-emerald-600' : 'text-rose-500'}`}>
                  {regionData.Fiscal_Balance >= 0 ? '+' : ''}{formatRupiah(regionData.Fiscal_Balance)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* KPI 2: Indeks Kapasitas Fiskal */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200/60 shadow-[0_4px_24px_rgb(0,0,0,0.01)] flex flex-col justify-between hover:shadow-[0_8px_30px_rgb(0,0,0,0.03)] transition-all duration-300">
          <div>
            <div className="flex items-center justify-between text-xs font-semibold text-slate-400 mb-2">
              <span className="flex items-center gap-1.5">
                <Award size={14} className="text-blue-500" />
                <span>Kapasitas Fiskal</span>
              </span>
              <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-md ${
                (regionData.Fiscal_Capacity_Index || 0) >= 60 ? 'bg-blue-50 text-blue-700' :
                (regionData.Fiscal_Capacity_Index || 0) >= 30 ? 'bg-indigo-50 text-indigo-700' :
                'bg-slate-100 text-slate-600'
              }`}>
                {(regionData.Fiscal_Capacity_Index || 0) >= 60 ? 'Tinggi' : 
                 (regionData.Fiscal_Capacity_Index || 0) >= 30 ? 'Sedang' : 'Rendah'}
              </span>
            </div>
            
            <h4 className="text-3xl font-black text-slate-800 tracking-tight mb-1">
              {regionData.Fiscal_Capacity_Index?.toFixed(1)}
            </h4>
            
            <div className="flex items-center text-[10px] text-slate-400 font-semibold">
              <span>Kemampuan Membiayai Urusan Otonom</span>
            </div>
          </div>

          <div className="mt-4">
            <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden mb-4">
              <div 
                className="h-full bg-blue-500 rounded-full transition-all duration-500"
                style={{ width: `${Math.min(100, ((regionData.Fiscal_Capacity_Index || 0) / 100) * 100)}%` }}
              />
            </div>

            {/* Detail metadata rows under cards */}
            <div className="space-y-2 border-t border-slate-50 pt-3 text-[11px] text-slate-500 font-semibold">
              <div className="flex justify-between items-center">
                <span className="text-slate-400">PDRB Riil (Harga Berlaku)</span>
                <span className="font-mono text-slate-700">{formatRupiah(regionData.Regional_GDP_Current_Price)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Rasio Kontribusi PAD</span>
                <span className="text-slate-700">{taxRatioVal.toFixed(1)}% dari Total</span>
              </div>
            </div>
          </div>
        </div>

        {/* KPI 3: Ketergantungan Transfer */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200/60 shadow-[0_4px_24px_rgb(0,0,0,0.01)] flex flex-col justify-between hover:shadow-[0_8px_30px_rgb(0,0,0,0.03)] transition-all duration-300">
          <div>
            <div className="flex items-center justify-between text-xs font-semibold text-slate-400 mb-2">
              <span className="flex items-center gap-1.5">
                <TrendingDown size={14} className="text-amber-500" />
                <span>Rasio Transfer Pusat</span>
              </span>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                (regionData.Transfer_Dependency || 0) > 75 ? 'bg-orange-50 text-orange-700' : 'bg-emerald-50 text-emerald-700'
              }`}>
                {(regionData.Transfer_Dependency || 0) > 75 ? 'Rentan' : 'Terkendali'}
              </span>
            </div>
            
            <h4 className="text-3xl font-black text-slate-800 tracking-tight mb-1">
              {regionData.Transfer_Dependency?.toFixed(1)}%
            </h4>
            
            <div className="flex items-center text-[10px] text-slate-400 font-semibold">
              <span>Kebergantungan pada TKD Nasional</span>
            </div>
          </div>

          <div className="mt-4">
            <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden mb-4">
              <div 
                className={`h-full rounded-full transition-all duration-500 ${
                  (regionData.Transfer_Dependency || 0) > 75 ? 'bg-amber-500' : 'bg-emerald-500'
                }`}
                style={{ width: `${Math.min(100, regionData.Transfer_Dependency || 0)}%` }}
              />
            </div>

            {/* Detail metadata rows under cards */}
            <div className="space-y-2 border-t border-slate-50 pt-3 text-[11px] text-slate-500 font-semibold">
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Total Penyaluran TKD</span>
                <span className="font-mono text-slate-700">{formatRupiah(regionData.Transfer)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Penerimaan Asli (PAD)</span>
                <span className="font-mono text-slate-700">{formatRupiah(regionData.PAD)}</span>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* Symmetrical Dual Chart Row - Structured visually to align perfectly with the dashboard style */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Structure 1: Revenue Structure */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200/60 shadow-[0_8px_30px_rgb(0,0,0,0.01)] flex flex-col justify-between">
          <div className="border-b border-slate-50 pb-4 mb-4">
            <h3 className="text-sm font-black text-slate-800 tracking-tight flex items-center gap-1.5">
              <Layers size={14} className="text-blue-500" />
              <span>Struktur & Bauran Pendapatan ({selectedYear})</span>
            </h3>
            <p className="text-[10px] text-slate-400 font-medium">Bauran murni pendapatan daerah terhadap proporsi kucuran pusat.</p>
          </div>

          {/* Flex layout combining Pie Chart and Structured Metadata List on the right */}
          <div className="flex flex-col sm:flex-row items-center justify-around gap-4 py-3">
            <div className="h-44 w-44 shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={revenueComposition}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={65}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {revenueComposition.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => formatRupiah(value)} />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* List side mimicking Electronics/Apparel metadata structure from the reference dashboard */}
            <div className="w-full sm:w-auto flex-1 space-y-3 font-semibold text-xs text-slate-500">
              {revenueComposition.map((entry, index) => {
                const total = revenueComposition.reduce((sum, item) => sum + item.value, 0) || 1;
                const percentage = (entry.value / total) * 100;
                return (
                  <div key={entry.name} className="flex justify-between items-center sm:grid sm:grid-cols-2 sm:gap-2 border-b border-slate-50 pb-1.5">
                    <span className="flex items-center text-slate-700">
                      <span className="w-2.5 h-2.5 rounded-full mr-2 shrink-0" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                      <span>{entry.name}</span>
                    </span>
                    <span className="font-mono text-right text-slate-800">
                      {formatRupiah(entry.value)} <span className="text-[10px] text-slate-400">({percentage.toFixed(0)}%)</span>
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Structure 2: Expenditure Structure */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200/60 shadow-[0_8px_30px_rgb(0,0,0,0.01)] flex flex-col justify-between">
          <div className="border-b border-slate-50 pb-4 mb-4">
            <h3 className="text-sm font-black text-slate-800 tracking-tight flex items-center gap-1.5">
              <Layers size={14} className="text-indigo-500" />
              <span>Struktur Belanja APBD & Investasi ({selectedYear})</span>
            </h3>
            <p className="text-[10px] text-slate-400 font-medium">Pengelompokan belanja operasional rutin berhadapan dengan infrastruktur modal.</p>
          </div>

          {/* Donut and metadata list inside */}
          <div className="flex flex-col sm:flex-row items-center justify-around gap-4 py-3">
            <div className="h-44 w-44 shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={expenditureComposition}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={65}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {expenditureComposition.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[(index + 3) % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => formatRupiah(value)} />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* List side mimicking reference card metadata */}
            <div className="w-full sm:w-auto flex-1 space-y-2.5 font-semibold text-xs text-slate-500">
              {expenditureComposition.map((entry, index) => {
                const total = expenditureComposition.reduce((sum, item) => sum + item.value, 0) || 1;
                const percentage = (entry.value / total) * 100;
                return (
                  <div key={entry.name} className="flex justify-between items-center sm:grid sm:grid-cols-2 sm:gap-2 border-b border-slate-50 pb-1">
                    <span className="flex items-center text-slate-700">
                      <span className="w-2.5 h-2.5 rounded-full mr-2 shrink-0" style={{ backgroundColor: COLORS[(index + 3) % COLORS.length] }} />
                      <span>{entry.name}</span>
                    </span>
                    <span className="font-mono text-right text-slate-800">
                      {formatRupiah(entry.value)} <span className="text-[10px] text-slate-400">({percentage.toFixed(0)}%)</span>
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

      </div>

      {/* Symmetrical Trend Section based on historic indicators */}
      {trendData.length > 1 && (
        <div className="bg-white p-6 rounded-3xl border border-slate-200/60 shadow-[0_8px_30px_rgb(0,0,0,0.01)] flex flex-col justify-between">
          <div className="border-b border-slate-50 pb-4 mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h3 className="text-sm font-black text-slate-800 tracking-tight flex items-center gap-1.5">
                <TrendUpIcon size={14} className="text-emerald-500" />
                <span>Tren Multiyear Kapasitas & Kerentanan Fiskal</span>
              </h3>
              <p className="text-[10px] text-slate-400 font-medium">Bagan perkembangan otonomi fiskas terhadap kurva stres anggaran murni regional.</p>
            </div>
            
            <span className="text-[10px] bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-md font-bold tracking-wide select-none self-start">
              {trendData[0].year} - {trendData[trendData.length - 1].year}
            </span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="period" stroke="#94a3b8" fontSize={9} tickLine={false} axisLine={false} />
                <YAxis yAxisId="left" stroke="#10b981" fontSize={9} tickLine={false} axisLine={false} />
                <YAxis yAxisId="right" orientation="right" stroke="#f97316" fontSize={9} tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ background: '#ffffff', borderRadius: '16px', border: '1px solid #f1f5f9', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.05)' }} 
                />
                <Legend iconType="circle" iconSize={6} wrapperStyle={{ fontSize: 10, paddingTop: 10 }} />
                <Line yAxisId="left" type="monotone" dataKey="KapasitasFiskal" stroke="#10b981" strokeWidth={3} activeDot={{ r: 6 }} name="Indeks Kapasitas Fiskal" />
                <Line yAxisId="right" type="monotone" dataKey="SkorStres" stroke="#f97316" strokeWidth={2.5} name="Skor Stres Fiskal" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Symmetrical Executive Analisys Breakdown & Automated Diagnostics */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Standard executive text breakdown */}
        <div className="lg:col-span-4 bg-white p-6 rounded-3xl border border-slate-200/60 shadow-[0_8px_30px_rgb(0,0,0,0.01)] flex flex-col justify-between">
          <div>
            <div className="border-b border-slate-50 pb-3 mb-4">
              <h3 className="text-sm font-black text-slate-800 flex items-center gap-1.5">
                <FileText size={15} className="text-indigo-600" />
                <span>Rangkuman Evaluasi Otonomi</span>
              </h3>
              <p className="text-[10px] text-slate-400 font-medium">Diagnosis cepat bauran pertanggungjawaban subnasional.</p>
            </div>

            <div className="space-y-4 text-xs">
              <div className="border-l-2 border-blue-500 pl-3 py-0.5">
                <h5 className="font-bold text-slate-800 text-[11px]">Kemandirian Anggaran</h5>
                <p className="text-[10px] text-slate-500 mt-0.5 leading-relaxed text-justify">
                  PAD menyumbang {taxRatioVal.toFixed(1)}% dari total penerimaan daerah. Dengan rasio kucuran dana transfer pusat sebesar {regionData.Transfer_Dependency?.toFixed(1)}%, daerah ini masuk dalam kategori {(regionData.Transfer_Dependency || 0) > 70 ? 'risiko ketergantungan sangat pekat' : 'skala otonomi moderat'}.
                </p>
              </div>

              <div className="border-l-2 border-emerald-500 pl-3 py-0.5">
                <h5 className="font-bold text-slate-800 text-[11px]">Investasi Pembangunan</h5>
                <p className="text-[10px] text-slate-500 mt-0.5 leading-relaxed text-justify">
                  Beban pegawai rutin rutin menyerap {debtServiceVal.toFixed(1)}% dari belanja total daerah, sedangkan investasi pembangunan jangka panjang (Belanja Modal) berada di level {capitalRatioVal.toFixed(1)}% dari kas mengalir.
                </p>
              </div>

              <div className="border-l-2 border-rose-500 pl-3 py-0.5">
                <h5 className="font-bold text-slate-800 text-[11px]">Kondisi Kesehatan Kas</h5>
                <p className="text-[10px] text-slate-500 mt-0.5 leading-relaxed text-justify">
                  Profil risiko berstatus '{getRiskLabel(regionData.Fiscal_Risk)}' dengan skor bahaya {regionData.Fiscal_Stress_Score?.toFixed(1)}/100 didorong oleh saldo kas murni bernilai {regionData.Fiscal_Balance >= 0 ? 'surplus' : 'defisit'} {formatRupiah(Math.abs(regionData.Fiscal_Balance))}.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 text-[9px] text-slate-400 font-bold flex items-center gap-1.5 justify-center mt-4 text-center">
            <Radio size={12} className="text-indigo-500 animate-pulse shrink-0" />
            <span>Formulasi sesuai dengan pedoman DJPb Kementerian Keuangan</span>
          </div>
        </div>

        {/* AI diagnostic sidebar panel resembling "Ai Features" perfectly */}
        <div className="lg:col-span-8 bg-slate-900 text-slate-100 p-6 rounded-3xl border border-slate-800 shadow-[0_8px_30px_rgb(0,0,0,0.1)] flex flex-col justify-between">
          <div className="space-y-4">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-800 pb-3 gap-2">
              <div className="flex items-center space-x-2">
                <div className="p-1.5 bg-indigo-500/10 rounded-lg text-indigo-400 border border-indigo-500/20 shrink-0">
                  <Cpu size={18} className="animate-pulse" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-white flex items-center gap-1.5">
                    <Sparkles size={14} className="text-yellow-400" />
                    <span>Real-time AI Audit & Diagnostics</span>
                  </h3>
                  <p className="text-[9px] text-slate-400 font-semibold tracking-wide">PENGUJI ANOMALI STRUKTUR ANGGARAN OTOMATIS</p>
                </div>
              </div>

              <button
                onClick={handleGenerateDiagnostic}
                disabled={loadingAi}
                className="w-full sm:w-auto px-4 py-2 bg-indigo-600 hover:bg-slate-50 text-white hover:text-indigo-900 active:scale-95 disabled:opacity-50 transition-all font-bold rounded-xl text-[10px] tracking-wide cursor-pointer flex items-center justify-center gap-1.5 shrink-0"
              >
                {loadingAi ? <Loader2 size={12} className="animate-spin text-white" /> : <Sparkles size={11} />}
                <span>Diagnosis Baru</span>
              </button>
            </div>

            {/* Simulated live alert list (exactly like the reference's recommendations & low stocks alerts) */}
            <div className="space-y-3">
              <h5 className="text-[9px] uppercase tracking-wider text-slate-400 font-black flex items-center gap-1">
                <AlertTriangle size={11} className="text-amber-500 animate-bounce" />
                <span>Anomali Terdeteksi ({computedAnomalies.length})</span>
              </h5>

              {computedAnomalies.length === 0 ? (
                <div className="flex items-center gap-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 p-3.5 rounded-2xl text-[10px]">
                  <CheckCircle2 size={14} className="shrink-0 text-emerald-400" />
                  <div>
                    <span className="font-bold block">Status Aman & Sehat</span>
                    <span className="text-slate-400">Tidak ada deviasi diluar toleransi batas kewajaran.</span>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {computedAnomalies.map((an, idx) => (
                    <div 
                      key={idx} 
                      className={`p-3 rounded-2xl border flex gap-2 text-[10px] leading-relaxed justify-between items-start ${
                        an.type === 'danger' 
                          ? 'bg-rose-500/10 border-rose-500/20 text-rose-200' 
                          : 'bg-amber-500/10 border-amber-500/20 text-amber-200'
                      }`}
                    >
                      <div className="space-y-1">
                        <span className="font-bold flex items-center gap-1 bg-black/10 px-1.5 py-0.5 rounded-md w-fit text-[9px]">
                          <span className={`w-1.5 h-1.5 rounded-full ${an.type === 'danger' ? 'bg-rose-500' : 'bg-amber-400'}`} />
                          <span>{an.title}</span>
                        </span>
                        <p className="text-slate-350 text-slate-400 leading-normal">{an.desc}</p>
                      </div>

                      <span className="text-[9px] font-mono font-bold bg-white/5 border border-white/10 px-1 rounded text-slate-300 self-start shrink-0">
                        {an.threshold}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* AI Custom findings text area */}
            {aiReport && !loadingAi && (
              <div className="bg-slate-950/80 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl transition-all duration-300 animate-fadeIn mt-3">
                <div className="bg-slate-900 border-b border-slate-800 px-4 py-2.5 flex items-center justify-between text-[10px]">
                  <span className="font-bold text-white tracking-wide uppercase flex items-center gap-1.5">
                    <CheckCircle2 size={12} className="text-emerald-400 animate-pulse" />
                    <span>Investigasi AI Generasi 3.5</span>
                  </span>
                  <button
                    onClick={handleCopyReport}
                    className="p-1 px-2 bg-slate-800 hover:bg-slate-700 text-slate-300 transition rounded-md text-[9px] font-bold border border-slate-700/50 flex items-center space-x-1 cursor-pointer"
                  >
                    {copied ? <CheckCircle2 size={11} className="text-emerald-400" /> : <Copy size={11} />}
                    <span>{copied ? "Tersalin" : "Copy"}</span>
                  </button>
                </div>

                <div className="p-5 text-slate-300 text-[10.5px] leading-relaxed space-y-3 max-h-[220px] overflow-y-auto prose prose-invert prose-xs max-w-none scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent">
                  <ReactMarkdown>{aiReport}</ReactMarkdown>
                </div>
              </div>
            )}

            {loadingAi && (
              <div className="bg-white/5 rounded-2xl p-5 border border-white/5 flex flex-col items-center justify-center space-y-2 mt-3 animate-pulse">
                <Loader2 size={24} className="animate-spin text-indigo-400" />
                <span className="text-[10px] text-slate-400 font-bold">Model AI sedang menghitung matriks & menyusun rujukan mitigasi...</span>
              </div>
            )}

            {errorAi && (
              <div className="bg-rose-500/10 border border-rose-500/25 rounded-2xl p-4 flex items-center text-rose-300 text-[10px] leading-relaxed gap-2 mt-3">
                <AlertTriangle size={14} className="shrink-0 text-rose-400" />
                <span className="font-medium">{errorAi}</span>
              </div>
            )}

          </div>

          <span className="text-[9px] text-slate-500 text-center block mt-4 border-t border-slate-800 pt-3">
            Analisis murni merupakan simulasi dinamis dari dataset DJPb Lampung yang diunggah.
          </span>
        </div>

      </div>

      {/* Rules Information Modal */}
      {isRuleInfoOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="bg-white rounded-3xl w-full max-w-xl max-h-[80vh] overflow-y-auto shadow-2xl relative border border-slate-100">
            <div className="p-5 border-b border-slate-100 flex justify-between items-center sticky top-0 bg-white/95 backdrop-blur-md z-10">
              <h3 className="text-sm font-black text-slate-800 flex items-center space-x-2">
                <Info className="text-indigo-600" size={16} />
                <span>Parameter & Aturan Buku Saku DJPb</span>
              </h3>
              <button 
                onClick={() => setIsRuleInfoOpen(false)}
                className="text-slate-400 hover:text-slate-600 bg-slate-50 hover:bg-slate-100 rounded-full p-1.5 transition-colors cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>
            
            <div className="p-5 space-y-4">
              
              <div className="bg-slate-50/50 border border-slate-150 rounded-2xl p-4">
                <h4 className="font-bold text-xs text-slate-800 mb-1">1. Indeks Kapasitas Fiskal</h4>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Kemampuan pemda mendanai belanja rutin murni tanpa bergantung bantuan luar. Diukur dari porsi PAD dibandingkan beban wajib belanja.
                </p>
                <ul className="mt-2 text-[10px] space-y-1 text-slate-400 font-semibold">
                  <li className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 bg-blue-500 rounded-full" /> Kapasitas Tinggi (&gt; 60) : Mandiri & beruang fiskal longgar.</li>
                  <li className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 bg-amber-400 rounded-full" /> Kapasitas Sedang (30 - 60) : Aman namun rawan gejolak TKD.</li>
                  <li className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 bg-rose-500 rounded-full" /> Kapasitas Rendah (&lt; 30) : Bergantung murni bantuan.</li>
                </ul>
              </div>

              <div className="bg-slate-50/50 border border-slate-150 rounded-2xl p-4">
                <h4 className="font-bold text-xs text-slate-800 mb-1">2. Ketergantungan Transfer</h4>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Komparasi dana transfer (TKD, Dana Desa) pemerintah pusat dibandingkan revenue pemda. Semakin tinggi rasio ini, kemandirian fiskal daerah dinilai semakin sensitif.
                </p>
                <ul className="mt-2 text-[10px] space-y-1 text-slate-400 font-semibold">
                  <li className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 bg-rose-500 rounded-full" /> Ketergantungan Tinggi (&gt; 70%) : Sensitif tinggi terhadap kucuran murni APBN.</li>
                  <li className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 bg-emerald-500 rounded-full" /> Ketergantungan Moderat (&lt; 70%) : Seimbang antara PAD & TKD.</li>
                </ul>
              </div>

              <div className="bg-slate-50/50 border border-slate-150 rounded-2xl p-4">
                <h4 className="font-bold text-xs text-slate-800 mb-1">3. Skor Stres Fiskal (Fiscal Stress Score)</h4>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Formula komposit menguji porsi belanja wajib tak dapat ditunda (misal belanja pegawai rutin) terhadap sisa kas dan defisit tahun berjalan.
                </p>
                <ul className="mt-2 text-[10px] space-y-1 text-slate-400 font-semibold">
                  <li className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 bg-emerald-500 rounded-full" /> Low Risk / Stabil (&lt; 25) : Ruang sirkulasi kas longgar.</li>
                  <li className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 bg-amber-400 rounded-full" /> Warning / Hati-hati (25 - 50) : Mulai mendapat penetrasi belanja mengikat.</li>
                  <li className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 bg-rose-500 rounded-full" /> High Risk / Stres Berat (&gt; 50) : APBD terperangkap defisit & overhead rutin.</li>
                </ul>
              </div>

            </div>
            
            <div className="p-4 border-t border-slate-100 bg-slate-50/50 rounded-b-3xl text-right">
              <button 
                onClick={() => setIsRuleInfoOpen(false)}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold py-2 px-6 rounded-xl text-xs transition duration-200 cursor-pointer"
              >
                Tutup Pedoman
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
