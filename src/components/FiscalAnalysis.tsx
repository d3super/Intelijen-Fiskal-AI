import React, { useState, useMemo } from 'react';
import { RegionalData } from '../types';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, AreaChart, Area
} from 'recharts';
import { Activity, AlertTriangle, TrendingDown, TrendingUp, ShieldAlert, Calendar } from 'lucide-react';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

export default function FiscalAnalysis({ data }: { data: RegionalData[] }) {
  const uniqueRegions = useMemo(() => Array.from(new Set(data.map(d => d.Region))).sort(), [data]);
  const [selectedRegion, setSelectedRegion] = useState<string>(uniqueRegions[0] || '');

  const regionDataAllYears = useMemo(() => {
    return data.filter(d => d.Region === selectedRegion).sort((a, b) => a.Year - b.Year);
  }, [data, selectedRegion]);

  const availableYears = useMemo(() => {
    return regionDataAllYears.map(d => d.Year).sort((a, b) => b - a);
  }, [regionDataAllYears]);

  const [selectedYear, setSelectedYear] = useState<number>(availableYears[0] || new Date().getFullYear());

  // Update selected year if region changes
  React.useEffect(() => {
    if (availableYears.length > 0 && !availableYears.includes(selectedYear)) {
      setSelectedYear(availableYears[0]);
    }
  }, [availableYears, selectedYear]);

  if (data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-slate-500 py-20">
        <Activity size={48} className="mb-4 text-slate-300" />
        <h3 className="text-xl font-medium text-slate-700">Tidak Ada Data</h3>
        <p className="mt-2">Silakan unggah data fiskal daerah untuk melihat analisis.</p>
      </div>
    );
  }

  const regionData = regionDataAllYears.find(d => d.Year === selectedYear) || regionDataAllYears[0];

  if (!regionData) return null;

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
                <XAxis dataKey="year" />
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
        <h3 className="text-xl font-semibold mb-6 text-slate-800">Laporan Analisis Fiskal AI ({selectedYear})</h3>
        
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
