import React, { useState, useMemo } from 'react';
import { RegionalData } from '../types';
import ReactMarkdown from 'react-markdown';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, AreaChart, Area
} from 'recharts';
import { 
  Activity, AlertTriangle, TrendingDown, TrendingUp, ShieldAlert, Calendar, 
  HelpCircle, X, Info, Cpu, Sparkles, CheckCircle2, Loader2, Copy, Check 
} from 'lucide-react';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

export default function FiscalAnalysis({ data }: { data: RegionalData[] }) {
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
      <div className="flex flex-col items-center justify-center h-full text-slate-500 py-20">
        <Activity size={48} className="mb-4 text-slate-300" />
        <h3 className="text-xl font-medium text-slate-700">Tidak Ada Data</h3>
        <p className="mt-2">Silakan unggah data fiskal daerah untuk melihat analisis.</p>
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
        throw new Error('Gagal berkomunikasi dengan server untuk membuat diagnosis AI.');
      }

      const resData = await response.json();
      if (resData.error) {
        throw new Error(resData.error);
      }
      setAiReport(resData.diagnostic || '');
    } catch (err: any) {
      console.error(err);
      setErrorAi(err.message || 'Terjadi kesalahan tidak terduga.');
    } finally {
      setLoadingAi(false);
    }
  };

  // Automated heuristic anomaly detector
  const computedAnomalies = useMemo(() => {
    const list: { type: 'danger' | 'warning' | 'info'; title: string; desc: string }[] = [];
    
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
        desc: `Alokasi belanja pegawai mencapai ${personnelRatio.toFixed(1)}% dari total belanja. Pemborosan struktural ini menyedot ruang fiskal pembangunan daerah secara signifikan.`
      });
    } else if (personnelRatio > 35) {
      list.push({
        type: 'warning',
        title: 'Beban Belanja Pegawai Tinggi',
        desc: `Alokasi belanja pegawai berada di level ${personnelRatio.toFixed(1)}%. Perlu penataan formasi pegawaian atau moratorium rekrutmen non-esensial.`
      });
    }

    // Capital expenditure underspending
    if (capitalRatio < 15) {
      list.push({
        type: 'danger',
        title: 'Infrastruktur Sempit (Underspending)',
        desc: `Belanja modal pembangunan hanya ${capitalRatio.toFixed(1)}% dari anggaran (di bawah anjuran UU HKPD sebesar 30%). Menghambat akselerasi ekonomi jangka panjang.`
      });
    } else if (capitalRatio < 20) {
      list.push({
        type: 'warning',
        title: 'Belanja Modal Minim',
        desc: `Belanja modal di kisaran ${capitalRatio.toFixed(1)}%. Akselerasi pembangunan proyek strategis berisiko melambat.`
      });
    }

    // High transfer dependency
    if (dependencyRatio > 80) {
      list.push({
        type: 'danger',
        title: 'Kerentanan Dana Transfer Ekstrem',
        desc: `${dependencyRatio.toFixed(1)}% pendapatan berasal dari Dana Transfer Pusat. Kebijakan fiskal lokal sangat sensitif terhadap shock kebijakan fiskal nasional.`
      });
    } else if (dependencyRatio > 70) {
      list.push({
        type: 'warning',
        title: 'Ketergantungan Transfer Tinggi',
        desc: `Ketergantungan transfer sebesar ${dependencyRatio.toFixed(1)}%. Upaya peningkatan kemandirim PAD harus digenjot.`
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
          desc: `Defisit berjalan mencapai ${deficitRatio.toFixed(2)}% dari estimasi PDRB. Menabrak batas kritis regulasi nasional (3.00% dari PDRB).`
        });
      } else {
        list.push({
          type: 'warning',
          title: 'Keseimbangan Fiskal Defisit',
          desc: `APBD mengalami defisit sebesar Rp ${Math.abs(regionData.Fiscal_Balance).toLocaleString('id-ID')}. Perlu pembiayaan atau penggunaan SiLPA.`
        });
      }
    }

    // Socio-economic anomalies
    if (unemployment > 8.0) {
      list.push({
        type: 'warning',
        title: 'Tekanan Pengangguran Tinggi',
        desc: `Tingkat pengangguran terbuka sebesar ${unemployment.toFixed(2)}%. Belanja jaring pengaman sosial atau insentif investasi daerah perlu dioptimalkan.`
      });
    }

    return list;
  }, [regionData]);

  // Prepare chart data
  const revenueComposition = [
    { name: 'PAD', value: regionData.PAD },
    { name: 'Transfer', value: regionData.Transfer },
    { name: 'Lainnya', value: regionData.Revenue - regionData.PAD - regionData.Transfer }
  ].filter(d => d.value > 0);

  const expenditureComposition = [
    { name: 'Pegawai', value: regionData.Personnel_Spending },
    { name: 'Modal', value: regionData.Capital_Expenditure },
    { name: 'Sosial', value: regionData.Social_Spending },
    { name: 'Lainnya', value: regionData.Expenditure - regionData.Personnel_Spending - regionData.Capital_Expenditure - regionData.Social_Spending }
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
      case 'Stable': return 'text-emerald-600 bg-emerald-50 border-emerald-200';
      case 'Warning': return 'text-amber-600 bg-amber-50 border-amber-200';
      case 'High risk': return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'Severe fiscal stress': return 'text-rose-600 bg-rose-50 border-rose-200';
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

  return (
    <div className="space-y-6">
      {/* Region Selector */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold text-slate-800">Pilih Daerah untuk Analisis Mendalam</h3>
          <p className="text-sm text-slate-500">Menganalisis kapasitas fiskal, ketergantungan transfer, dan indikator stres secara spesifik.</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          {availableQuarters.length > 0 && (
            <select 
              className="px-4 py-2 border border-slate-300 rounded-lg bg-slate-50 text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              value={selectedQuarter}
              onChange={(e) => setSelectedQuarter(e.target.value)}
            >
              {availableQuarters.map(q => (
                <option key={q} value={q}>{q}</option>
              ))}
            </select>
          )}
          <select 
            className="px-4 py-2 border border-slate-300 rounded-lg bg-slate-50 text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            value={selectedRegion}
            onChange={(e) => setSelectedRegion(e.target.value)}
          >
            {uniqueRegions.map(region => (
              <option key={region} value={region}>{region}</option>
            ))}
          </select>
          <select 
            className="px-4 py-2 border border-slate-300 rounded-lg bg-slate-50 text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
          >
            {availableYears.map(year => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>
        </div>
      </div>
      
      {/* Information Button */}
      <div className="flex justify-end">
        <button 
          onClick={() => setIsRuleInfoOpen(true)}
          className="text-xs flex items-center space-x-1.5 text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-lg transition-colors border border-indigo-100 shadow-sm"
          title="Lihat parameter teknis"
        >
          <HelpCircle size={14} />
          <span className="font-medium">Parameter dan Aturan Fiskal</span>
        </button>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className={`p-6 rounded-xl border ${getRiskColor(regionData.Fiscal_Risk)}`}>
          <div className="flex items-center space-x-3 mb-2">
            <ShieldAlert size={24} />
            <h4 className="text-lg font-semibold">Skor Stres Fiskal</h4>
          </div>
          <p className="text-3xl font-bold mb-1">{regionData.Fiscal_Stress_Score?.toFixed(1)} <span className="text-sm font-normal">/ 100</span></p>
          <p className="text-sm font-medium uppercase tracking-wider">{getRiskLabel(regionData.Fiscal_Risk)}</p>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <h4 className="text-sm font-medium text-slate-500 mb-2">Indeks Kapasitas Fiskal</h4>
          <p className="text-3xl font-bold text-slate-800 mb-1">{regionData.Fiscal_Capacity_Index?.toFixed(1)}</p>
          <p className="text-sm text-slate-500">
            {regionData.Fiscal_Capacity_Index && regionData.Fiscal_Capacity_Index > 60 ? 'Kapasitas Tinggi' : 
             regionData.Fiscal_Capacity_Index && regionData.Fiscal_Capacity_Index > 30 ? 'Kapasitas Sedang' : 'Kapasitas Rendah'}
          </p>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <h4 className="text-sm font-medium text-slate-500 mb-2">Ketergantungan Transfer</h4>
          <p className="text-3xl font-bold text-slate-800 mb-1">{regionData.Transfer_Dependency?.toFixed(1)}%</p>
          <p className="text-sm text-slate-500">
            {regionData.Transfer_Dependency && regionData.Transfer_Dependency > 70 ? 'Ketergantungan Tinggi (Risiko)' : 'Terkendali'}
          </p>
        </div>
      </div>

      {/* Trend Charts (Only show if multiple years available) */}
      {trendData.length > 1 && (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <h3 className="text-lg font-semibold mb-4 text-slate-800">Tren Kapasitas & Stres Fiskal ({trendData[0].year} - {trendData[trendData.length - 1].year})</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="period" />
                <YAxis yAxisId="left" />
                <YAxis yAxisId="right" orientation="right" />
                <Tooltip />
                <Legend />
                <Line yAxisId="left" type="monotone" dataKey="KapasitasFiskal" stroke="#00C49F" activeDot={{ r: 8 }} name="Kapasitas Fiskal" />
                <Line yAxisId="right" type="monotone" dataKey="SkorStres" stroke="#FF8042" name="Skor Stres" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Structure */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <h3 className="text-lg font-semibold mb-4 text-slate-800">Struktur Pendapatan ({selectedYear})</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={revenueComposition}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  fill="#8884d8"
                  paddingAngle={5}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {revenueComposition.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(value)} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Expenditure Structure */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <h3 className="text-lg font-semibold mb-4 text-slate-800">Struktur Belanja ({selectedYear})</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={expenditureComposition}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  fill="#82ca9d"
                  paddingAngle={5}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {expenditureComposition.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[(index + 2) % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(value)} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Detailed Analysis Text */}
      <div className="bg-white p-8 rounded-xl shadow-sm border border-slate-200">
        <h3 className="text-xl font-semibold mb-6 text-slate-800">Laporan Fiscalia ({selectedYear})</h3>
        
        <div className="space-y-6">
          <AnalysisSection 
            title="Kinerja Pendapatan & Ketergantungan Transfer" 
            content={`PAD (Pendapatan Asli Daerah) menyumbang ${((regionData.PAD / regionData.Revenue) * 100).toFixed(1)}% dari total pendapatan daerah. Dengan rasio ketergantungan transfer sebesar ${regionData.Transfer_Dependency?.toFixed(1)}%, daerah ini bergantung secara ${regionData.Transfer_Dependency && regionData.Transfer_Dependency > 70 ? 'berat' : 'moderat'} pada transfer pemerintah pusat (DAU, DAK, DBH).`}
          />
          
          <AnalysisSection 
            title="Komposisi Belanja & Keberlanjutan Anggaran" 
            content={`Belanja pegawai menghabiskan ${((regionData.Personnel_Spending / regionData.Expenditure) * 100).toFixed(1)}% dari anggaran, sementara belanja modal untuk infrastruktur dan pembangunan berada di angka ${((regionData.Capital_Expenditure / regionData.Expenditure) * 100).toFixed(1)}%. ${((regionData.Personnel_Spending / regionData.Expenditure) * 100) > 50 ? 'Tingginya belanja pegawai membatasi ruang fiskal untuk pembangunan.' : 'Bauran pengeluaran menunjukkan pendekatan yang cukup seimbang.'}`}
          />
          
          <AnalysisSection 
            title="Stres Fiskal & Peringatan Dini" 
            content={`Skor stres fiskal adalah ${regionData.Fiscal_Stress_Score?.toFixed(1)}/100, mengklasifikasikan daerah ini dalam kategori '${getRiskLabel(regionData.Fiscal_Risk)}'. Keseimbangan fiskal menunjukkan ${regionData.Fiscal_Balance < 0 ? 'defisit' : 'surplus'} sebesar ${new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(Math.abs(regionData.Fiscal_Balance))}.`}
          />
        </div>
      </div>

      {/* Smart Baseline Diagnostic & Anomaly Finder */}
      <div className="bg-slate-900 text-slate-100 rounded-2xl p-8 border border-slate-800 shadow-xl relative overflow-hidden">
        {/* Decorative ambient background */}
        <div className="absolute right-0 bottom-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute left-1/3 top-0 w-60 h-60 bg-emerald-500/5 rounded-full blur-2xl pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 border-b border-slate-800 pb-6 mb-6">
          <div className="flex items-center space-x-3.5 w-full md:w-auto">
            <div className="bg-indigo-500/10 p-3 rounded-xl border border-indigo-500/20 text-indigo-400 shrink-0">
              <Cpu size={28} className="animate-pulse" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[10px] font-bold uppercase bg-indigo-500/20 text-indigo-300 px-2.5 py-0.5 rounded-full tracking-wider">AI Powered</span>
                <span className="text-[10px] font-bold uppercase bg-slate-800 text-emerald-400 px-2.5 py-0.5 rounded-full tracking-wider border border-slate-700">Real-time Diagnostic</span>
              </div>
              <h3 className="text-2xl font-extrabold text-white tracking-tight mt-1">Smart Baseline Diagnostic & Anomaly Finder</h3>
              <p className="text-xs text-slate-400 mt-1 font-medium">Sistem Peringatan Dini otomatis mengaudit struktur anggaran dan mendeteksi anomali regional.</p>
            </div>
          </div>
          <button
            onClick={handleGenerateDiagnostic}
            disabled={loadingAi}
            className="px-5 py-3 bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 disabled:bg-indigo-600/50 text-white font-bold rounded-xl text-xs transition duration-200 border border-indigo-500/30 shadow-lg shadow-indigo-900/30 flex items-center justify-center space-x-2 cursor-pointer shrink-0 w-full md:w-auto"
          >
            {loadingAi ? (
              <Loader2 size={16} className="animate-spin text-indigo-200" />
            ) : (
              <Sparkles size={16} className="text-indigo-200" />
            )}
            <span>{loadingAi ? "Menganalisis Anggaran..." : "Jalankan AI Audit & Diagnosis Baru"}</span>
          </button>
        </div>

        {/* Realtime Anomaly Board */}
        <div>
          <div className="mb-6">
            <h4 className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-4 flex items-center gap-2">
              <ShieldAlert size={14} className="text-amber-500" />
              <span>Automated Anomaly Detection Board (Hasil Evaluasi Sistem)</span>
            </h4>
            
            {computedAnomalies.length === 0 ? (
              <div className="flex items-center space-x-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 p-4.5 rounded-xl">
                <CheckCircle2 size={20} className="shrink-0" />
                <div>
                  <p className="text-xs font-bold">Struktur Anggaran Sehat</p>
                  <p className="text-[11px] text-emerald-400/80">Sistem tidak mendeteksi adanya anomali atau deviasi kritis pada data keuangan daerah untuk periode ini.</p>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {computedAnomalies.map((anomaly, idx) => (
                  <div 
                    key={idx} 
                    className={`p-4.5 rounded-xl border flex gap-3 text-xs ${
                      anomaly.type === 'danger' 
                        ? 'bg-rose-500/10 border-rose-500/20 text-rose-200' 
                        : 'bg-amber-500/10 border-amber-500/20 text-amber-200'
                    }`}
                  >
                    <AlertTriangle size={18} className={`shrink-0 ${anomaly.type === 'danger' ? 'text-rose-400' : 'text-amber-400'}`} />
                    <div>
                      <div className="flex items-center gap-1.5 font-bold">
                        <span>{anomaly.title}</span>
                        <span className={`text-[9px] px-1.5 py-0.2 rounded font-mono uppercase ${
                          anomaly.type === 'danger' ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        }`}>
                          {anomaly.type === 'danger' ? 'Danger' : 'Warning'}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-300 mt-1 leading-relaxed">{anomaly.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* AI Comprehensive Findings */}
          {loadingAi && (
            <div className="mt-6 bg-slate-850/40 rounded-xl p-8 border border-slate-800 flex flex-col items-center justify-center space-y-4">
              <Loader2 size={36} className="animate-spin text-indigo-500" />
              <div className="text-center">
                <p className="text-sm font-bold text-white">Gemini AI sedang mengaudit dan mengkalkulasi risiko fiskal...</p>
                <p className="text-xs text-slate-400 mt-1">Mendeteksi anomali sekuritas anggaran, menguji limit risiko, dan menyusun bauran mitigasi.</p>
              </div>
            </div>
          )}

          {errorAi && (
            <div className="mt-6 bg-rose-500/10 border border-rose-500/20 rounded-xl p-5 flex items-center space-x-3 text-rose-300 text-xs">
              <AlertTriangle size={18} className="shrink-0" />
              <p className="font-medium">{errorAi}</p>
            </div>
          )}

          {aiReport && !loadingAi && (
            <div className="mt-6 bg-slate-950/80 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl transition-all duration-300 animate-fadeIn">
              {/* Header Box */}
              <div className="bg-slate-900 border-b border-slate-800 px-6 py-4 flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-2.5 h-2.5 bg-indigo-500 rounded-full animate-bounce" />
                  <span className="text-xs font-bold text-white tracking-wide uppercase">Hasil Penyelidikan AI Generasi 3.5</span>
                </div>
                <button
                  onClick={handleCopyReport}
                  className="p-1 px-2.5 bg-slate-800 hover:bg-slate-700 active:bg-slate-900 text-slate-300 transition rounded-lg text-[10px] uppercase tracking-wider font-bold border border-slate-700/50 flex items-center space-x-1.5 cursor-pointer"
                >
                  {copied ? <CheckCircle2 size={12} className="text-emerald-400" /> : <Copy size={12} />}
                  <span>{copied ? "Tersalin" : "Salin Laporan"}</span>
                </button>
              </div>

              {/* Rendered Markdown Area */}
              <div className="p-8 text-slate-300 leading-relaxed text-xs space-y-4 max-h-[500px] overflow-y-auto prose prose-invert prose-xs max-w-none scrollbar-thin scrollbar-thumb-slate-800 scrollbar-track-transparent">
                <ReactMarkdown>{aiReport}</ReactMarkdown>
              </div>

              {/* Footer Banner */}
              <div className="bg-slate-900/50 border-t border-slate-900 px-6 py-3 text-[10px] text-slate-500 text-center">
                <span>Disusun berdasar model korelasi APBD Baseline {regionData.Region} oleh Fiscalia AI Engine.</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Rules Information Modal */}
      {isRuleInfoOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[85vh] overflow-y-auto shadow-xl relative">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center sticky top-0 bg-white/95 backdrop-blur z-10">
              <h3 className="text-lg font-bold text-slate-800 flex items-center space-x-2">
                <Info className="text-indigo-600" size={20} />
                <span>Parameter dan Aturan Fiskal</span>
              </h3>
              <button 
                onClick={() => setIsRuleInfoOpen(false)}
                className="text-slate-400 hover:text-slate-600 bg-slate-50 hover:bg-slate-100 rounded-full p-2 transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-5">
                <h4 className="font-bold text-sm text-slate-800 mb-2">1. Indeks Kapasitas Fiskal</h4>
                <p className="text-sm text-slate-600 leading-relaxed">
                  Mengukur kemampuan daerah dalam membiayai pengeluaran secara mandiri (terutama dari PAD terhadap total pengeluaran).
                </p>
                <ul className="mt-3 text-xs space-y-1 text-slate-500 font-medium">
                  <li>&bull; <span className="font-bold">Kapasitas Tinggi ({">"} 60)</span> : Mampu mandiri, tangguh terhadap gejolak transfer.</li>
                  <li>&bull; <span className="font-bold">Kapasitas Sedang (30 - 60)</span> : Cukup aman namun perlu terus dioptimalkan.</li>
                  <li>&bull; <span className="font-bold">Kapasitas Rendah ({"<"} 30)</span> : Rentan, basis pajak sangat terbatas.</li>
                </ul>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-xl p-5">
                <h4 className="font-bold text-sm text-slate-800 mb-2">2. Ketergantungan Transfer</h4>
                <p className="text-sm text-slate-600 leading-relaxed">
                  Rasio dana transfer (DAU, DAK, DBH) pusat terhadap total pendapatan. Ketergantungan yang berlebihan melemahkan insentif pemda untuk memungut PAD.
                </p>
                <ul className="mt-3 text-xs space-y-1 text-slate-500 font-medium">
                  <li>&bull; <span className="font-bold">Ketergantungan Berat ({">"} 70%)</span> : Risiko tinggi jika transfer dikurangi.</li>
                  <li>&bull; <span className="font-bold">Ketergantungan Moderat ({"<"} 70%)</span> : Relatif proporsional.</li>
                </ul>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-xl p-5">
                <h4 className="font-bold text-sm text-slate-800 mb-2">3. Stres Fiskal (Fiscal Stress Score)</h4>
                <p className="text-sm text-slate-600 leading-relaxed">
                  Indikator komposit yang mengukur tekanan anggaran dari besarnya porsi belanja operasional (terutama belanja pegawai) serta rasio defisit terhadap total pendapatan.
                </p>
                <ul className="mt-3 text-xs space-y-1 text-slate-500 font-medium">
                  <li>&bull; <span className="font-bold">Sehat / Low Risk (Skor {"<"} 25)</span> : Ruang fiskal longgar.</li>
                  <li>&bull; <span className="font-bold">Hati-hati / Moderate (Skor 25 - 50)</span> : Belanja mengikat mulai menekan.</li>
                  <li>&bull; <span className="font-bold">Risiko Tinggi / High Risk (Skor 50 - 75)</span> : Ruang fiskal untuk pembangunan sangat terbatas.</li>
                  <li>&bull; <span className="font-bold">Stres Berat / Severe (Skor {">"} 75)</span> : APBD terancam krisis likuiditas berlarut.</li>
                </ul>
              </div>

            </div>
            
            <div className="p-4 border-t border-slate-100 bg-slate-50 rounded-b-2xl text-right">
              <button 
                onClick={() => setIsRuleInfoOpen(false)}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-6 rounded-lg text-sm transition-colors cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function AnalysisSection({ title, content }: { title: string, content: string }) {
  return (
    <div className="border-l-4 border-indigo-500 pl-4 py-1">
      <h4 className="text-md font-semibold text-slate-800 mb-2">{title}</h4>
      <p className="text-slate-600 leading-relaxed">{content}</p>
    </div>
  );
}
