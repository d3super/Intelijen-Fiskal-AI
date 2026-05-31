import React, { useState, useMemo } from 'react';
import { RegionalData } from '../types';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  LineChart, Line, ScatterChart, Scatter, ZAxis, Cell
} from 'recharts';
import { 
  AlertTriangle, TrendingUp, DollarSign, Activity, Calendar, Search, 
  Sparkles, Download, ArrowUpRight, ArrowDownRight, SlidersHorizontal, 
  FileText, Coins, Percent, PiggyBank, Briefcase, Users, LayoutGrid, ChevronDown, RefreshCw
} from 'lucide-react';

interface DashboardProps {
  data: RegionalData[];
  setActiveTab?: (tab: string) => void;
}

export default function Dashboard({ data, setActiveTab }: DashboardProps) {
  // Theme colors matching premium modern SaaS
  const COLORS = ['#3b82f6', '#f97316', '#10b981', '#6366f1', '#ec4899', '#f59e0b', '#06b6d4', '#84cc16'];

  const availableYears = useMemo(() => {
    return Array.from(new Set(data.map(d => d.Year))).sort((a, b) => b - a);
  }, [data]);

  const availableQuarters = useMemo(() => {
    return Array.from(new Set(data.map(d => d.Quarter).filter(Boolean) as string[])).sort();
  }, [data]);

  // Filters State
  const [selectedYear, setSelectedYear] = useState<number | 'all'>(availableYears[0] || 'all');
  const [selectedQuarter, setSelectedQuarter] = useState<string | 'all'>('all');
  const [selectedProvince, setSelectedProvince] = useState<string | 'all'>('all');
  const [selectedRegion, setSelectedRegion] = useState<string | 'all'>('all');
  const [viewMode, setViewMode] = useState<'single' | 'trend'>('single');
  const [chartMetric, setChartMetric] = useState<'budget' | 'growth'>('budget');

  // Bottom table search & sort states
  const [leftSearch, setLeftSearch] = useState('');
  const [leftSort, setLeftSort] = useState<'region' | 'revenue' | 'expenditure' | 'balance'>('region');
  const [rightSearch, setRightSearch] = useState('');
  const [rightSort, setRightSort] = useState<'region' | 'capacity' | 'stress' | 'unemployment'>('region');

  const availableProvinces = useMemo(() => {
    return Array.from(new Set(data.map(d => d.Province).filter(Boolean) as string[])).sort();
  }, [data]);

  const availableRegions = useMemo(() => {
    const filteredSource = selectedProvince === 'all' 
      ? data 
      : data.filter(d => d.Province === selectedProvince);
    return Array.from(new Set(filteredSource.map(d => d.Region).filter(Boolean) as string[])).sort();
  }, [data, selectedProvince]);

  // Reset filter selections if invalid on data changes
  React.useEffect(() => {
    if (availableYears.length > 0 && selectedYear !== 'all' && !availableYears.includes(selectedYear)) {
      setSelectedYear(availableYears[0]);
    }
  }, [availableYears, selectedYear]);

  React.useEffect(() => {
    if (availableQuarters.length > 0 && selectedQuarter !== 'all' && !availableQuarters.includes(selectedQuarter)) {
      setSelectedQuarter('all');
    }
  }, [availableQuarters, selectedQuarter]);

  React.useEffect(() => {
    if (selectedRegion !== 'all') {
      const isValid = data.some(d => d.Region === selectedRegion && (selectedProvince === 'all' || d.Province === selectedProvince));
      if (!isValid) {
        setSelectedRegion('all');
      }
    }
  }, [selectedProvince, selectedRegion, data]);

  if (data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-slate-500 py-20 bg-slate-50/50 rounded-3xl border border-slate-100">
        <Activity size={48} className="mb-4 text-slate-300 animate-pulse" />
        <h3 className="text-xl font-bold text-slate-700">Tidak Ada Data Fiskal</h3>
        <p className="mt-2 text-sm text-slate-400 max-w-sm text-center">Silakan unggah data fiskal daerah melalui menu unggah di sebelah kiri untuk melihat dasbor interaktif Anda.</p>
      </div>
    );
  }

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

  // Base filtration
  const filteredData = data.filter(d => {
    const matchYear = selectedYear === 'all' || d.Year === selectedYear;
    const matchQuarter = selectedQuarter === 'all' || d.Quarter === selectedQuarter || (!d.Quarter && selectedQuarter === 'all');
    const matchProvince = selectedProvince === 'all' || d.Province === selectedProvince;
    const matchRegion = selectedRegion === 'all' || d.Region === selectedRegion;
    return matchYear && matchQuarter && matchProvince && matchRegion;
  });

  const totalRecords = filteredData.length;
  const uniqueRegionsCount = new Set(filteredData.map(d => d.Region)).size;

  // Calculation metrics
  const avgFiscalCapacity = filteredData.reduce((acc, curr) => acc + (curr.Fiscal_Capacity_Index || 0), 0) / (totalRecords || 1);
  const avgTransferDependency = filteredData.reduce((acc, curr) => acc + (curr.Transfer_Dependency || 0), 0) / (totalRecords || 1);
  const highRiskRegions = filteredData.filter(d => d.Fiscal_Risk === 'High risk' || d.Fiscal_Risk === 'Severe fiscal stress').length;

  const totalRevenue = filteredData.reduce((acc, curr) => acc + (curr.Revenue || 0), 0);
  const totalPAD = filteredData.reduce((acc, curr) => acc + (curr.PAD || 0), 0);
  const totalTransfer = filteredData.reduce((acc, curr) => acc + (curr.Transfer || 0), 0);
  const totalOtherRev = Math.max(0, totalRevenue - totalPAD - totalTransfer);

  const totalExpenditure = filteredData.reduce((acc, curr) => acc + (curr.Expenditure || 0), 0);
  const totalPersonnel = filteredData.reduce((acc, curr) => acc + (curr.Personnel_Spending || 0), 0);
  const totalCapital = filteredData.reduce((acc, curr) => acc + (curr.Capital_Expenditure || 0), 0);
  const totalSocial = filteredData.reduce((acc, curr) => acc + (curr.Social_Spending || 0), 0);
  const totalOtherExp = Math.max(0, totalExpenditure - totalPersonnel - totalCapital - totalSocial);

  // Top regions by metric or size for charts (sorted by PDRB or growth to avoid clutter)
  const topRegionsChartData = [...filteredData]
    .sort((a, b) => b.Revenue - a.Revenue)
    .slice(0, 6);

  const topRegionsByGDPGrowth = [...filteredData]
    .sort((a, b) => b.GDP_Growth - a.GDP_Growth)
    .slice(0, 6);

  // Multiyear Trend calculations
  const trendData = useMemo(() => {
    const points = data.map(d => ({
      year: d.Year,
      quarter: d.Quarter || '',
      label: d.Quarter ? `${d.Year} ${d.Quarter}` : `${d.Year}`,
      key: d.Quarter ? `${d.Year}-${d.Quarter}` : `${d.Year}`
    }));

    const uniqueKeys: string[] = [];
    const uniquePoints: typeof points = [];
    points.forEach(p => {
      if (!uniqueKeys.includes(p.key)) {
        uniqueKeys.push(p.key);
        uniquePoints.push(p);
      }
    });

    uniquePoints.sort((a, b) => {
      if (a.year !== b.year) return a.year - b.year;
      return a.quarter.localeCompare(b.quarter);
    });

    return uniquePoints.map(pt => {
      const ptData = data.filter(d => d.Year === pt.year && (!pt.quarter || d.Quarter === pt.quarter));
      const count = ptData.length || 1;
      const avgGdp = ptData.reduce((acc, curr) => acc + (curr.GDP_Growth || 0), 0) / count;
      const avgDep = ptData.reduce((acc, curr) => acc + (curr.Transfer_Dependency || 0), 0) / count;
      const avgCap = ptData.reduce((acc, curr) => acc + (curr.Fiscal_Capacity_Index || 0), 0) / count;
      return {
        label: pt.label,
        avgGdpGrowth: Number(avgGdp.toFixed(2)),
        avgDependency: Number(avgDep.toFixed(2)),
        avgCapacity: Number(avgCap.toFixed(2)),
      };
    });
  }, [data]);

  // Smart Advice Component (heuristics, totally zero token AI-like insights matching current selections)
  const smartAdvice = useMemo(() => {
    const highStressRegions = filteredData.filter(d => (d.Fiscal_Stress_Score || 0) >= 65);
    const dependentRegions = filteredData.filter(d => (d.Transfer_Dependency || 0) >= 75);
    
    if (highStressRegions.length > 0) {
      const worst = [...highStressRegions].sort((a,b) => (b.Fiscal_Stress_Score || 0) - (a.Fiscal_Stress_Score || 0))[0];
      return {
        title: "Mitigasi Stres & Disiplin Belanja",
        description: `Sistem mendeteksi resentralisasi risiko fiskal di wilayah Anda. Salah satu indikator stres tertinggi berada di ${worst.Region} (${worst.Fiscal_Stress_Score?.toFixed(1)}/100). Prioritaskan rasionalisasi belanja rutin pegawai (saat ini rata-rata ${((worst.Personnel_Spending / (worst.Expenditure || 1)) * 100).toFixed(1)}%) dan tingkatkan Belanja Modal.`,
        item: `${worst.Region} STRES-HIGH`
      };
    } else if (dependentRegions.length > 0) {
      const worst = [...dependentRegions].sort((a,b) => (b.Transfer_Dependency || 0) - (a.Transfer_Dependency || 0))[0];
      return {
        title: "Intensifikasi Penerimaan Murni (PAD)",
        description: `Rasio ketergantungan dana transfer (TKD) subnasional tergolong tinggi (${avgTransferDependency.toFixed(1)}%). Wilayah ${worst.Region} mencatat ketergantungan tertinggi (${worst.Transfer_Dependency?.toFixed(1)}%). Diperlukan akselerasi digitalisasi retribusi dan perpajakan kreatif daerah.`,
        item: `${worst.Region} TKD-DEP`
      };
    }
    return {
      title: "Kebijakan Berjalan Stabil & Optimal",
      description: "Profil fiskal terpantau seimbang dengan risiko terkendali. Direkomendasikan untuk mempertahankan rasio investasi modal infrastruktur publik guna menyerap tenaga kerja regional Lampung di tahun berjalan.",
      item: "Kinerja Positif Umum"
    };
  }, [filteredData, avgTransferDependency]);

  // Export CSV Action
  const handleExportCSV = () => {
    if (filteredData.length === 0) return;
    const headers = ["Region", "Province", "Year", "Quarter", "Revenue", "Expenditure", "Transfer", "PAD", "Capital_Expenditure", "Personnel_Spending", "Social_Spending", "Fiscal_Balance", "Fiscal_Capacity_Index", "Fiscal_Stress_Score", "Fiscal_Risk"];
    const rows = filteredData.map(d => [
      d.Region, d.Province, d.Year, d.Quarter || '', d.Revenue, d.Expenditure, d.Transfer, d.PAD, d.Capital_Expenditure, d.Personnel_Spending, d.Social_Spending, d.Fiscal_Balance, d.Fiscal_Capacity_Index || '', d.Fiscal_Stress_Score || '', d.Fiscal_Risk || ''
    ]);
    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(","), ...rows.map(e => e.map(val => `"${String(val).replace(/"/g, '""')}"`).join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `fiscalia_analisis_${selectedYear || 'all'}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Sub-metrics counts for KPI Card 1 (Fiscal Capacity)
  const capacityCategories = useMemo(() => {
    const high = filteredData.filter(d => (d.Fiscal_Capacity_Index || 0) >= 70).length;
    const mid = filteredData.filter(d => (d.Fiscal_Capacity_Index || 0) >= 40 && (d.Fiscal_Capacity_Index || 0) < 70).length;
    const low = filteredData.filter(d => (d.Fiscal_Capacity_Index || 0) < 40).length;
    const total = totalRecords || 1;
    return {
      high, mid, low,
      pHigh: (high / total) * 100,
      pMid: (mid / total) * 100,
      pLow: (low / total) * 100,
    };
  }, [filteredData, totalRecords]);

  // Sub-metrics ratios for KPI Card 2 (Transfer Dependency)
  const revenueComposition = useMemo(() => {
    const total = totalRevenue || 1;
    return {
      pPAD: (totalPAD / total) * 100,
      pTKD: (totalTransfer / total) * 100,
      pOther: (totalOtherRev / total) * 100,
    };
  }, [totalRevenue, totalPAD, totalTransfer, totalOtherRev]);

  // Sub-metrics ratios for KPI Card 3 (Spending composition)
  const spendingComposition = useMemo(() => {
    const total = totalExpenditure || 1;
    return {
      pPersonnel: (totalPersonnel / total) * 100,
      pCapital: (totalCapital / total) * 100,
      pSocial: (totalSocial / total) * 100,
      pOther: (totalOtherExp / total) * 100,
    };
  }, [totalExpenditure, totalPersonnel, totalCapital, totalSocial, totalOtherExp]);

  // Sub-metrics risk counts for KPI Card 4 (Fiscal Stress counts)
  const riskComposition = useMemo(() => {
    const stable = filteredData.filter(d => d.Fiscal_Risk === 'Stable').length;
    const warning = filteredData.filter(d => d.Fiscal_Risk === 'Warning').length;
    const high = filteredData.filter(d => d.Fiscal_Risk === 'High risk').length;
    const severe = filteredData.filter(d => d.Fiscal_Risk === 'Severe fiscal stress').length;
    const total = totalRecords || 1;
    return {
      stable, warning, high, severe,
      pStable: (stable / total) * 100,
      pWarning: (warning / total) * 100,
      pHigh: (high / total) * 100,
      pSevere: (severe / total) * 100,
    };
  }, [filteredData, totalRecords]);

  // Bottom tables data calculation based on search and local sorting
  const leftTableData = useMemo(() => {
    let filtered = filteredData.filter(d => d.Region.toLowerCase().includes(leftSearch.toLowerCase()));
    if (leftSort === 'region') {
      filtered.sort((a,b) => a.Region.localeCompare(b.Region));
    } else if (leftSort === 'revenue') {
      filtered.sort((a,b) => b.Revenue - a.Revenue);
    } else if (leftSort === 'expenditure') {
      filtered.sort((a,b) => b.Expenditure - a.Expenditure);
    } else if (leftSort === 'balance') {
      filtered.sort((a,b) => b.Fiscal_Balance - a.Fiscal_Balance);
    }
    return filtered;
  }, [filteredData, leftSearch, leftSort]);

  const rightTableData = useMemo(() => {
    let filtered = filteredData.filter(d => d.Region.toLowerCase().includes(rightSearch.toLowerCase()));
    if (rightSort === 'region') {
      filtered.sort((a,b) => a.Region.localeCompare(b.Region));
    } else if (rightSort === 'capacity') {
      filtered.sort((a,b) => (b.Fiscal_Capacity_Index || 0) - (a.Fiscal_Capacity_Index || 0));
    } else if (rightSort === 'stress') {
      filtered.sort((a,b) => (b.Fiscal_Stress_Score || 0) - (a.Fiscal_Stress_Score || 0));
    } else if (rightSort === 'unemployment') {
      filtered.sort((a,b) => (b.Unemployment || 0) - (a.Unemployment || 0));
    }
    return filtered;
  }, [filteredData, rightSearch, rightSort]);

  return (
    <div className="space-y-8 pb-12">
      {/* Search Header and Dynamic Filters */}
      <div className="flex flex-col lg:flex-row justify-between lg:items-center bg-white p-6 rounded-3xl border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.02)] gap-4">
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <span className="p-1 px-2.5 bg-indigo-50 text-indigo-600 rounded-full font-bold text-[10px] tracking-widest uppercase">
              LAMPUNG FISCAL INTELLIGENT AND ANALYTICS
            </span>
          </div>
          <h2 className="text-xl font-black text-slate-800 tracking-tight flex items-center gap-2">
            Ringkasan Eksekutif & Intelijen Fiskal
          </h2>
          <p className="text-xs text-slate-400 font-medium">Memantau ketahanan, kapasitas, dan kerentanan keuangan daerah lintas periode beralih.</p>
        </div>
        
        {/* Advanced Filters Toolbar */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Provinsi filter */}
          {availableProvinces.length > 0 && (
            <div className="relative">
              <select 
                className="appearance-none pl-3 pr-8 py-2 border border-slate-150 rounded-xl bg-slate-50 hover:bg-slate-100/50 text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs font-semibold"
                value={selectedProvince}
                onChange={(e) => setSelectedProvince(e.target.value)}
              >
                <option value="all">Semua Provinsi</option>
                {availableProvinces.map(prov => (
                  <option key={prov} value={prov}>{prov}</option>
                ))}
              </select>
              <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            </div>
          )}

          {/* Daerah/Kabupaten filter */}
          {availableRegions.length > 0 && (
            <div className="relative">
              <select 
                className="appearance-none pl-3 pr-8 py-2 border border-slate-150 rounded-xl bg-slate-50 hover:bg-slate-100/50 text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs font-semibold"
                value={selectedRegion}
                onChange={(e) => setSelectedRegion(e.target.value)}
              >
                <option value="all">Semua Daerah</option>
                {availableRegions.map(reg => (
                  <option key={reg} value={reg}>{reg}</option>
                ))}
              </select>
              <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            </div>
          )}

          {/* Triwulan filter */}
          {availableQuarters.length > 0 && (
            <div className="relative">
              <select 
                className="appearance-none pl-3 pr-8 py-2 border border-slate-150 rounded-xl bg-slate-50 hover:bg-slate-100/50 text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs font-semibold"
                value={selectedQuarter}
                onChange={(e) => setSelectedQuarter(e.target.value)}
              >
                <option value="all">Semua Triwulan</option>
                {availableQuarters.map(q => (
                  <option key={q} value={q}>{q}</option>
                ))}
              </select>
              <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            </div>
          )}

          {/* Tahun filter */}
          <div className="relative">
            <select 
              className="appearance-none pl-8 pr-8 py-2 border border-slate-150 rounded-xl bg-slate-50 hover:bg-slate-100/50 text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs font-semibold"
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value === 'all' ? 'all' : Number(e.target.value))}
            >
              <option value="all">Semua Tahun</option>
              {availableYears.map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
            <Calendar size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Bento Summary Cards - Premium 4 Columns with Segmented Composition Bars */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* Card 1: Kapasitas Fiskal */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200/60 shadow-[0_4px_24px_rgb(0,0,0,0.02)] flex flex-col justify-between hover:shadow-[0_8px_30px_rgb(0,0,0,0.04)] transition-all duration-300">
          <div>
            <div className="flex items-center justify-between text-xs font-semibold text-slate-400 mb-2">
              <span className="flex items-center gap-1.5"><Activity size={14} className="text-blue-500" /> Indeks Kapasitas</span>
              <span className="text-[10px] bg-blue-50 text-blue-600 px-2 py-0.5 rounded-md">Skala 0-100</span>
            </div>
            <h4 className="text-3xl font-black text-slate-800 tracking-tight mb-1">
              {avgFiscalCapacity.toFixed(1)}
            </h4>
            <div className="flex items-center text-[10px] text-emerald-600 font-bold">
              <ArrowUpRight size={12} className="mr-0.5" />
              <span>+3.4% Baseline</span>
            </div>
          </div>
          
          <div className="mt-4">
            {/* Segmented composition bar */}
            <div className="flex h-2 w-full rounded-full overflow-hidden bg-slate-100">
              <div className="bg-indigo-500" style={{ width: `${Math.max(5, capacityCategories.pHigh)}%` }} title={`Kapasitas Tinggi: ${capacityCategories.high} daerah`} />
              <div className="bg-amber-400" style={{ width: `${Math.max(5, capacityCategories.pMid)}%` }} title={`Kapasitas Sedang: ${capacityCategories.mid} daerah`} />
              <div className="bg-rose-400" style={{ width: `${Math.max(5, capacityCategories.pLow)}%` }} title={`Kapasitas Rendah: ${capacityCategories.low} daerah`} />
            </div>
            
            {/* Legend breakdown table */}
            <div className="grid grid-cols-3 gap-1 mt-3 pt-3 border-t border-slate-50 text-[10px] text-slate-500 font-medium">
              <div className="flex flex-col">
                <span className="flex items-center text-slate-700 font-bold"><span className="w-1.5 h-1.5 bg-indigo-500 rounded-full mr-1" />Tinggi</span>
                <span className="pl-2.5 text-slate-400">{capacityCategories.pHigh.toFixed(0)}%</span>
              </div>
              <div className="flex flex-col">
                <span className="flex items-center text-slate-700 font-bold"><span className="w-1.5 h-1.5 bg-amber-400 rounded-full mr-1" />Sedang</span>
                <span className="pl-2.5 text-slate-400">{capacityCategories.pMid.toFixed(0)}%</span>
              </div>
              <div className="flex flex-col">
                <span className="flex items-center text-slate-700 font-bold"><span className="w-1.5 h-1.5 bg-rose-400 rounded-full mr-1" />Rendah</span>
                <span className="pl-2.5 text-slate-400">{capacityCategories.pLow.toFixed(0)}%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Card 2: Ketergantungan Transfer */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200/60 shadow-[0_4px_24px_rgb(0,0,0,0.02)] flex flex-col justify-between hover:shadow-[0_8px_30px_rgb(0,0,0,0.04)] transition-all duration-300">
          <div>
            <div className="flex items-center justify-between text-xs font-semibold text-slate-400 mb-2">
              <span className="flex items-center gap-1.5"><DollarSign size={14} className="text-amber-500" /> Ketergantungan TKD</span>
              <span className="text-[10px] bg-amber-50 text-amber-700 px-2 py-0.5 rounded-md">Sangat Tinggi</span>
            </div>
            <h4 className="text-3xl font-black text-slate-800 tracking-tight mb-1">
              {avgTransferDependency.toFixed(1)}%
            </h4>
            <div className="flex items-center text-[10px] text-rose-500 font-bold">
              <ArrowUpRight size={12} className="mr-0.5" />
              <span>Target Ideal &lt; 50%</span>
            </div>
          </div>
          
          <div className="mt-4">
            {/* Segmented composition bar */}
            <div className="flex h-2 w-full rounded-full overflow-hidden bg-slate-100">
              <div className="bg-emerald-500" style={{ width: `${Math.max(5, revenueComposition.pPAD)}%` }} title="Kemandirian Terpilih (PAD)" />
              <div className="bg-amber-500" style={{ width: `${Math.max(5, revenueComposition.pTKD)}%` }} title="Dana Transfer Pusat (TKD)" />
              <div className="bg-indigo-400" style={{ width: `${Math.max(5, revenueComposition.pOther)}%` }} title="Pendapatan Lain" />
            </div>
            
            {/* Legend breakdown table */}
            <div className="grid grid-cols-3 gap-1 mt-3 pt-3 border-t border-slate-50 text-[10px] text-slate-500 font-medium">
              <div className="flex flex-col">
                <span className="flex items-center text-slate-700 font-bold truncate"><span className="w-1.5 h-1.5 bg-emerald-500 rounded-full mr-1" />PAD</span>
                <span className="pl-2.5 text-slate-400">{revenueComposition.pPAD.toFixed(0)}%</span>
              </div>
              <div className="flex flex-col">
                <span className="flex items-center text-slate-700 font-bold truncate"><span className="w-1.5 h-1.5 bg-amber-500 rounded-full mr-1" />TKD</span>
                <span className="pl-2.5 text-slate-400">{revenueComposition.pTKD.toFixed(0)}%</span>
              </div>
              <div className="flex flex-col">
                <span className="flex items-center text-slate-700 font-bold truncate"><span className="w-1.5 h-1.5 bg-indigo-400 rounded-full mr-1" />Lainnya</span>
                <span className="pl-2.5 text-slate-400">{revenueComposition.pOther.toFixed(0)}%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Card 3: Rata-rata Pembelanjaan */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200/60 shadow-[0_4px_24px_rgb(0,0,0,0.02)] flex flex-col justify-between hover:shadow-[0_8px_30px_rgb(0,0,0,0.04)] transition-all duration-300">
          <div>
            <div className="flex items-center justify-between text-xs font-semibold text-slate-400 mb-2">
              <span className="flex items-center gap-1.5"><Coins size={14} className="text-emerald-500" /> Rata-rata Belanja</span>
              <span className="text-[10px] bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-md">Volume Total</span>
            </div>
            <h4 className="text-3xl font-black text-slate-800 tracking-tight mb-1 truncate">
              {formatRupiah(totalExpenditure / (uniqueRegionsCount || 1))}
            </h4>
            <div className="flex items-center text-[10px] text-teal-600 font-bold">
              <span>Per Daerah Terpilih</span>
            </div>
          </div>
          
          <div className="mt-4">
            {/* Segmented composition bar */}
            <div className="flex h-2 w-full rounded-full overflow-hidden bg-slate-100">
              <div className="bg-rose-450 bg-rose-400" style={{ width: `${Math.max(5, spendingComposition.pPersonnel)}%` }} title="Belanja Pegawai" />
              <div className="bg-blue-500" style={{ width: `${Math.max(5, spendingComposition.pCapital)}%` }} title="Belanja Modal" />
              <div className="bg-yellow-400" style={{ width: `${Math.max(5, spendingComposition.pSocial)}%` }} title="Belanja Sosial" />
              <div className="bg-slate-400" style={{ width: `${Math.max(5, spendingComposition.pOther)}%` }} title="Belanja Lainnya" />
            </div>
            
            {/* Legend breakdown table */}
            <div className="grid grid-cols-4 gap-0.5 mt-3 pt-3 border-t border-slate-50 text-[9px] text-slate-500 font-medium">
              <div className="flex flex-col">
                <span className="text-slate-700 font-bold truncate"><span className="inline-block w-1 h-1 bg-rose-400 rounded-full mr-0.5" />Pegawai</span>
                <span className="pl-1.5 text-slate-400">{spendingComposition.pPersonnel.toFixed(0)}%</span>
              </div>
              <div className="flex flex-col">
                <span className="text-slate-700 font-bold truncate"><span className="inline-block w-1 h-1 bg-blue-500 rounded-full mr-0.5" />Modal</span>
                <span className="pl-1.5 text-slate-400">{spendingComposition.pCapital.toFixed(0)}%</span>
              </div>
              <div className="flex flex-col">
                <span className="text-slate-700 font-bold truncate"><span className="inline-block w-1 h-1 bg-yellow-400 rounded-full mr-0.5" />Sosial</span>
                <span className="pl-1.5 text-slate-400">{spendingComposition.pSocial.toFixed(0)}%</span>
              </div>
              <div className="flex flex-col">
                <span className="text-slate-700 font-bold truncate"><span className="inline-block w-1 h-1 bg-slate-400 rounded-full mr-0.5" />Lain</span>
                <span className="pl-1.5 text-slate-400">{spendingComposition.pOther.toFixed(0)}%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Card 4: Wilayah Menengah / Risiko Tinggi */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200/60 shadow-[0_4px_24px_rgb(0,0,0,0.02)] flex flex-col justify-between hover:shadow-[0_8px_30px_rgb(0,0,0,0.04)] transition-all duration-300">
          <div>
            <div className="flex items-center justify-between text-xs font-semibold text-slate-400 mb-2">
              <span className="flex items-center gap-1.5"><AlertTriangle size={14} className="text-rose-500" /> Profil Risiko Fiskal</span>
              <span className="text-[10px] bg-rose-50 text-rose-700 px-2 py-0.5 rounded-md">Restrained</span>
            </div>
            <h4 className="text-3xl font-black text-slate-800 tracking-tight mb-1">
              {highRiskRegions} <span className="text-xs font-semibold text-slate-400">Daerah</span>
            </h4>
            <div className="flex items-center text-[10px] text-rose-500 font-bold">
              <span>{((highRiskRegions / (totalRecords || 1)) * 100).toFixed(0)}% Kategori Kritis & Tinggi</span>
            </div>
          </div>
          
          <div className="mt-4">
            {/* Segmented composition bar */}
            <div className="flex h-2 w-full rounded-full overflow-hidden bg-slate-100">
              <div className="bg-emerald-450 bg-emerald-500" style={{ width: `${Math.max(5, riskComposition.pStable)}%` }} title="Stabil" />
              <div className="bg-amber-400" style={{ width: `${Math.max(5, riskComposition.pWarning)}%` }} title="Peringatan" />
              <div className="bg-orange-500" style={{ width: `${Math.max(5, riskComposition.pHigh)}%` }} title="Risiko Tinggi" />
              <div className="bg-rose-600" style={{ width: `${Math.max(5, riskComposition.pSevere)}%` }} title="Stres Berat" />
            </div>
            
            {/* Legend breakdown table */}
            <div className="grid grid-cols-4 gap-0.5 mt-3 pt-3 border-t border-slate-50 text-[9px] text-slate-500 font-medium">
              <div className="flex flex-col">
                <span className="text-emerald-600 font-bold truncate"><span className="inline-block w-1.5 h-1.5 bg-emerald-500 rounded-full mr-0.5" />Stabil</span>
                <span className="pl-2 text-slate-400">{riskComposition.stable} daerah</span>
              </div>
              <div className="flex flex-col">
                <span className="text-amber-500 font-bold truncate"><span className="inline-block w-1.5 h-1.5 bg-amber-400 rounded-full mr-0.5" />Warning</span>
                <span className="pl-2 text-slate-400">{riskComposition.warning} daerah</span>
              </div>
              <div className="flex flex-col">
                <span className="text-orange-500 font-bold truncate"><span className="inline-block w-1.5 h-1.5 bg-orange-500 rounded-full mr-0.5" />Tinggi</span>
                <span className="pl-2 text-slate-400">{riskComposition.high} daerah</span>
              </div>
              <div className="flex flex-col">
                <span className="text-rose-600 font-bold truncate"><span className="inline-block w-1.5 h-1.5 bg-rose-600 rounded-full mr-0.5" />Berat</span>
                <span className="pl-2 text-slate-400">{riskComposition.severe} daerah</span>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* Main Row: Central Interactive Chart (Left) + Smart Policies/Recommendations Widget (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Premium Multi-Sectored Chart */}
        <div className="lg:col-span-8 bg-white p-6 rounded-3xl border border-slate-200/60 shadow-[0_8px_30px_rgb(0,0,0,0.02)] flex flex-col justify-between">
          <div className="flex flex-col sm:flex-row justify-between sm:items-center border-b border-slate-50 pb-4 mb-4 gap-3">
            <div>
              <div className="flex items-center bg-slate-50 p-1 rounded-xl self-start mb-1 select-none w-fit border border-slate-100">
                <button
                  onClick={() => setViewMode('single')}
                  className={`px-3 py-1 rounded-lg text-[10px] font-bold transition-all ${
                    viewMode === 'single'
                      ? 'bg-white text-indigo-600 shadow-sm'
                      : 'text-slate-400 hover:text-slate-600'
                  }`}
                >
                  Regional Single Mode
                </button>
                <button
                  onClick={() => setViewMode('trend')}
                  className={`px-3 py-1 rounded-lg text-[10px] font-bold transition-all ${
                    viewMode === 'trend'
                      ? 'bg-white text-indigo-600 shadow-sm'
                      : 'text-slate-400 hover:text-slate-600'
                  }`}
                >
                  Multi-Year Trend
                </button>
              </div>
              <h3 className="text-md font-bold text-slate-800 tracking-tight">Kinerja Anggaran & Distribusi Dana Daerah</h3>
              <p className="text-[11px] text-slate-400 font-medium">Membandingkan korelasi penyaluran belanja terhadap penyerapan PDRB di daerah aktif.</p>
            </div>
            
            {/* Chart toggle controls */}
            {viewMode === 'single' && (
              <div className="flex items-center space-x-1.5 bg-slate-100 p-1 rounded-xl text-[10px] font-bold select-none border border-slate-200">
                <button 
                  onClick={() => setChartMetric('budget')}
                  className={`px-3 py-1 rounded-lg transition-all ${chartMetric === 'budget' ? 'bg-white text-slate-700 shadow-xs' : 'text-slate-400'}`}
                >
                  Pendapatan vs Belanja
                </button>
                <button 
                  onClick={() => setChartMetric('growth')}
                  className={`px-3 py-1 rounded-lg transition-all ${chartMetric === 'growth' ? 'bg-white text-slate-700 shadow-xs' : 'text-slate-400'}`}
                >
                  Laju PDRB (%)
                </button>
              </div>
            )}
          </div>

          {/* Interactive Chart stage */}
          <div className="h-80 w-full">
            {viewMode === 'single' ? (
              chartMetric === 'budget' ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={topRegionsChartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="Region" stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} />
                    <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(v) => formatRupiah(v).replace("Rp ", "")} />
                    <Tooltip 
                      cursor={{ fill: '#f8fafc' }}
                      contentStyle={{ background: '#ffffff', borderRadius: '16px', border: '1px solid #f1f5f9', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.05)' }} 
                      formatter={(v: number) => [formatRupiah(v), ""]}
                    />
                    <Legend iconType="circle" iconSize={6} wrapperStyle={{ fontSize: 10, paddingTop: 10 }} />
                    <Bar dataKey="Revenue" fill="#3b82f6" name="Total Pendapatan" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="Expenditure" fill="#f97316" name="Total Belanja" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="Transfer" fill="#c084fc" name="TKD (Transfer Pusat)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={topRegionsByGDPGrowth} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="Region" stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} />
                    <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} unit="%" />
                    <Tooltip 
                      cursor={{ fill: '#f8fafc' }}
                      contentStyle={{ background: '#ffffff', borderRadius: '16px', border: '1px solid #f1f5f9', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.05)' }} 
                      formatter={(v: number) => [`${v.toFixed(2)}%`, "Pertumbuhan PDRB"]}
                    />
                    <Bar dataKey="GDP_Growth" fill="#4f46e5" name="Laju Pertumbuhan PDRB" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="label" stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} />
                  <Tooltip 
                    contentStyle={{ background: '#ffffff', borderRadius: '16px', border: '1px solid #f1f5f9', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.05)' }} 
                  />
                  <Legend iconType="circle" iconSize={6} wrapperStyle={{ fontSize: 10, paddingTop: 10 }} />
                  <Line type="monotone" dataKey="avgGdpGrowth" stroke="#4f46e5" strokeWidth={3} name="Rata-rata Pertumbuhan PDRB (%)" activeDot={{ r: 6 }} />
                  <Line type="monotone" dataKey="avgDependency" stroke="#f59e0b" strokeWidth={2.5} name="Rasio Ketergantungan Transfer (%)" />
                  <Line type="monotone" dataKey="avgCapacity" stroke="#10b981" strokeWidth={2.5} name="Indeks Kapasitas Fiskal Rata-rata" />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Download Bar at the bottom matching the reference dashboard */}
          <div className="flex flex-wrap items-center justify-between border-t border-slate-50 pt-4 mt-4 text-xs font-semibold text-slate-500 gap-2">
            <div className="flex items-center space-x-2">
              <button 
                onClick={handleExportCSV}
                className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 rounded-xl bg-white hover:bg-slate-50 font-bold text-slate-600 transition-all active:scale-95 cursor-pointer text-[11px]"
              >
                <Download size={13} className="text-slate-400" />
                <span>CSV</span>
              </button>
              {setActiveTab && (
                <button 
                  onClick={() => setActiveTab('scenarioLibrary')}
                  className="flex items-center gap-1.5 px-3 py-1.5 border border-slate-200 rounded-xl bg-white hover:bg-slate-50 font-bold text-slate-600 transition-all active:scale-95 cursor-pointer text-[11px]"
                >
                  <FileText size={13} className="text-slate-400" />
                  <span>PRESETS</span>
                </button>
              )}
            </div>
            
            <div className="flex items-center text-slate-400 gap-1 text-[11px] font-bold">
              <span className="w-2 h-2 bg-indigo-500 rounded-full animate-ping" />
              <span>Diupdate berkala berdasarkan baseline DJPb</span>
            </div>
          </div>
        </div>

        {/* Right Column: AI / Intelligent Policies and Warnings Widget (resembling "Ai Features") */}
        <div className="lg:col-span-4 bg-white p-6 rounded-3xl border border-slate-200/60 shadow-[0_8px_30px_rgb(0,0,0,0.02)] flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-slate-50 pb-3 mb-4">
              <h3 className="text-sm font-black text-slate-800 flex items-center gap-1.5">
                <Sparkles size={16} className="text-yellow-500" />
                <span>Rekomendasi Kebijakan AI</span>
              </h3>
              <span className="text-[10px] bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full font-bold">Otomatis Terbit</span>
            </div>

            {/* Smart Advice Box */}
            <div className="bg-gradient-to-br from-slate-50 to-indigo-50/20 p-5 rounded-2xl border border-slate-100 mb-5 relative overflow-hidden">
              <div className="relative z-10 space-y-2">
                <span className="inline-block text-[9px] bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded-full font-bold tracking-wider">
                  INSTRUMEN REKOMENDASI: {smartAdvice.item}
                </span>
                <h4 className="text-xs font-bold text-slate-800">{smartAdvice.title}</h4>
                <p className="text-[11px] text-slate-500 leading-relaxed text-justify">
                  {smartAdvice.description}
                </p>
                {setActiveTab && (
                  <button 
                    onClick={() => setActiveTab('simulation')}
                    className="w-full mt-3 bg-indigo-600 hover:bg-indigo-750 text-white font-bold py-2 px-4 rounded-xl text-xs transition-all tracking-wide shadow-sm hover:shadow-indigo-100 active:scale-95 cursor-pointer flex items-center justify-center gap-1"
                  >
                    <span>Simulasikan Kebijakan Sekarang</span>
                    <ArrowUpRight size={13} />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Active Risk Indicators */}
          <div className="space-y-4">
            <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Gauges Aliran Belanja Daerah</h4>
            
            {/* Risk Indicator 1: Belanja Pegawai */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-[11px] font-bold text-slate-600">
                <span className="flex items-center gap-1"><Users size={12} className="text-slate-400" /> Rasio Belanja Pegawai Rata-rata</span>
                <span className={`${(totalPersonnel / (totalExpenditure || 1)) * 100 > 30 ? 'text-amber-500 font-black' : 'text-slate-500'}`}>
                  {((totalPersonnel / (totalExpenditure || 1)) * 100).toFixed(1)}% / Batas 30%
                </span>
              </div>
              <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                <div 
                  className={`h-full transition-all duration-500 ${
                    (totalPersonnel / (totalExpenditure || 1)) * 100 > 30 ? 'bg-amber-500' : 'bg-emerald-500'
                  }`} 
                  style={{ width: `${Math.min(100, ((totalPersonnel / (totalExpenditure || 1)) * 100))}%` }} 
                />
              </div>
            </div>

            {/* Risk Indicator 2: Belanja Modal */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-[11px] font-bold text-slate-600">
                <span className="flex items-center gap-1"><Briefcase size={12} className="text-slate-400" /> Rasio Belanja Modal Utama</span>
                <span className={`${(totalCapital / (totalExpenditure || 1)) * 100 < 20 ? 'text-rose-500 font-black' : 'text-emerald-500 font-black'}`}>
                  {((totalCapital / (totalExpenditure || 1)) * 100).toFixed(1)}% / Target 20%
                </span>
              </div>
              <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                <div 
                  className={`h-full transition-all duration-500 ${
                    (totalCapital / (totalExpenditure || 1)) * 100 < 20 ? 'bg-rose-500' : 'bg-emerald-500'
                  }`} 
                  style={{ width: `${Math.min(100, ((totalCapital / (totalExpenditure || 1)) * 100))}%` }} 
                />
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* Symmetrical Bottom Lists / Tables matching Movement & Search and Tracking */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Table 1: Posisi Anggaran & Arus Kas Regional (resembling Movement & Transaction) */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200/60 shadow-[0_8px_30px_rgb(0,0,0,0.02)] flex flex-col justify-between">
          <div className="flex flex-col sm:flex-row justify-between sm:items-center border-b border-slate-50 pb-4 mb-4 gap-3">
            <div>
              <h3 className="text-sm font-black text-slate-800 tracking-tight flex items-center gap-1.5">
                <Coins size={14} className="text-indigo-500" />
                <span>Posisi Anggaran & Arus Kas Regional</span>
              </h3>
              <p className="text-[10px] text-slate-400 font-medium">Laporan kas murni pendapatan daerah terhadap beban transaksi ril.</p>
            </div>
            
            {/* Table Search & Sort Controls inside header */}
            <div className="flex items-center gap-2">
              <div className="relative">
                <input 
                  type="text" 
                  placeholder="Cari daerah..." 
                  value={leftSearch}
                  onChange={(e) => setLeftSearch(e.target.value)}
                  className="pl-7 pr-3 py-1.5 border border-slate-200 rounded-xl text-[10px] font-bold bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-700 w-32"
                />
                <Search size={11} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
              </div>
              
              <div className="relative flex-shrink-0">
                <select
                  value={leftSort}
                  onChange={(e) => setLeftSort(e.target.value as any)}
                  className="appearance-none pl-2.5 pr-6 py-1.5 border border-slate-200 rounded-xl text-[10px] font-bold bg-slate-50 text-slate-600 focus:outline-none"
                >
                  <option value="region">Sort: Nama</option>
                  <option value="revenue">Sort: Pendapatan</option>
                  <option value="expenditure">Sort: Belanja</option>
                  <option value="balance">Sort: Surplus</option>
                </select>
                <ChevronDown size={11} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse table-auto">
              <thead>
                <tr className="border-b border-slate-100 text-[10px] text-slate-400 font-black uppercase tracking-wider">
                  <th className="pb-3 font-extrabold">Nama Daerah</th>
                  <th className="pb-3 text-right font-extrabold">Total Pendapatan</th>
                  <th className="pb-3 text-right font-extrabold">Total Belanja</th>
                  <th className="pb-3 text-right font-extrabold">Status / Kas</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100/50 text-[11px] font-bold text-slate-600">
                {leftTableData.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-6 text-center text-[10px] text-slate-400 font-medium">Tidak ada rincian daerah cocok kata kunci.</td>
                  </tr>
                ) : (
                  leftTableData.slice(0, 7).map((row, i) => {
                    const absBal = Math.abs(row.Fiscal_Balance);
                    const isSurplus = row.Fiscal_Balance >= 0;
                    return (
                      <tr key={i} className="hover:bg-slate-50/50 group transition duration-300">
                        <td className="py-2.5 font-black text-slate-800">{row.Region}</td>
                        <td className="py-2.5 text-right font-mono text-slate-600">{formatRupiah(row.Revenue)}</td>
                        <td className="py-2.5 text-right font-mono text-slate-600">{formatRupiah(row.Expenditure)}</td>
                        <td className="py-2.5 text-right">
                          <span className={`inline-block px-2 py-0.5 rounded-md text-[10px] font-bold ${
                            isSurplus 
                              ? 'bg-emerald-50 text-emerald-600' 
                              : (absBal >= 5e10 ? 'bg-rose-50 text-rose-600' : 'bg-amber-50 text-amber-600')
                          }`}>
                            {isSurplus ? 'Surplus' : (absBal >= 5e10 ? 'Defisit Kritis' : 'Defisit Ringan')}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
          {leftTableData.length > 7 && (
            <div className="text-center pt-3 mt-3 border-t border-slate-50 text-[10px] text-slate-400 font-semibold">
              Menampilkan 7 dari {leftTableData.length} daerah muatan.
            </div>
          )}
        </div>

        {/* Table 2: Diagnosis Kapasitas & Evaluasi Risiko (resembling Search & Tracking) */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200/60 shadow-[0_8px_30px_rgb(0,0,0,0.02)] flex flex-col justify-between">
          <div className="flex flex-col sm:flex-row justify-between sm:items-center border-b border-slate-50 pb-4 mb-4 gap-3">
            <div>
              <h3 className="text-sm font-black text-slate-800 tracking-tight flex items-center gap-1.5">
                <SlidersHorizontal size={14} className="text-amber-500" />
                <span>Diagnosis Kapasitas & Risiko Fiskal</span>
              </h3>
              <p className="text-[10px] text-slate-400 font-medium">Beban stres serta kapasitas menyerap tantangan ketenagakerjaan daerah.</p>
            </div>
            
            {/* Table Search & Sort Controls inside header */}
            <div className="flex items-center gap-2">
              <div className="relative">
                <input 
                  type="text" 
                  placeholder="Cari daerah..." 
                  value={rightSearch}
                  onChange={(e) => setRightSearch(e.target.value)}
                  className="pl-7 pr-3 py-1.5 border border-slate-200 rounded-xl text-[10px] font-bold bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-700 w-32"
                />
                <Search size={11} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
              </div>
              
              <div className="relative flex-shrink-0">
                <select
                  value={rightSort}
                  onChange={(e) => setRightSort(e.target.value as any)}
                  className="appearance-none pl-2.5 pr-6 py-1.5 border border-slate-200 rounded-xl text-[10px] font-bold bg-slate-50 text-slate-600 focus:outline-none"
                >
                  <option value="region">Sort: Nama</option>
                  <option value="capacity">Sort: Kapasitas</option>
                  <option value="stress">Sort: Skr Stres</option>
                  <option value="unemployment">Sort: Pengangguran</option>
                </select>
                <ChevronDown size={11} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse table-auto">
              <thead>
                <tr className="border-b border-slate-100 text-[10px] text-slate-400 font-black uppercase tracking-wider">
                  <th className="pb-3 font-extrabold">Nama Daerah</th>
                  <th className="pb-3 text-center font-extrabold">Skor Kapasitas</th>
                  <th className="pb-3 text-center font-extrabold">Skor Stres (0-100)</th>
                  <th className="pb-3 text-right font-extrabold">Tingkat Risiko</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100/50 text-[11px] font-bold text-slate-600">
                {rightTableData.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-6 text-center text-[10px] text-slate-400 font-medium">Tidak ada rincian daerah cocok kata kunci.</td>
                  </tr>
                ) : (
                  rightTableData.slice(0, 7).map((row, i) => {
                    const isSevere = row.Fiscal_Risk === 'Severe fiscal stress';
                    const isHigh = row.Fiscal_Risk === 'High risk';
                    const isWarning = row.Fiscal_Risk === 'Warning';
                    return (
                      <tr key={i} className="hover:bg-slate-50/50 group transition duration-300">
                        <td className="py-2.5 font-black text-slate-800">{row.Region}</td>
                        <td className="py-2.5 text-center font-mono text-slate-600">{row.Fiscal_Capacity_Index?.toFixed(1) || 'N/A'}</td>
                        <td className="py-2.5 text-center font-mono text-slate-600">{row.Fiscal_Stress_Score?.toFixed(1) || 'N/A'}</td>
                        <td className="py-2.5 text-right">
                          <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-black tracking-wide ${
                            isSevere ? 'bg-rose-100 text-rose-700' :
                            isHigh ? 'bg-orange-100 text-orange-700' :
                            isWarning ? 'bg-amber-100 text-amber-700' :
                            'bg-emerald-100 text-emerald-700'
                          }`}>
                            {isSevere ? 'Stres Berat' :
                             isHigh ? 'Risiko Tinggi' :
                             isWarning ? 'Peringatan' : 'Stabil'}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
          {rightTableData.length > 7 && (
            <div className="text-center pt-3 mt-3 border-t border-slate-50 text-[10px] text-slate-400 font-semibold">
              Menampilkan 7 dari {rightTableData.length} daerah muatan.
            </div>
          )}
        </div>

      </div>

    </div>
  );
}
