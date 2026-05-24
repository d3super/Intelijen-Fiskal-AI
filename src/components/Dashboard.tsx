import React, { useState, useMemo } from 'react';
import { RegionalData } from '../types';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  LineChart, Line, ScatterChart, Scatter, ZAxis, Cell
} from 'recharts';
import { AlertTriangle, TrendingUp, DollarSign, Activity, Calendar } from 'lucide-react';

export default function Dashboard({ data }: { data: RegionalData[] }) {
  const COLORS = ['#ef4444', '#f97316', '#f59e0b', '#84cc16', '#22c55e', '#06b6d4', '#3b82f6', '#6366f1', '#a855f7', '#ec4899'];

  const availableYears = useMemo(() => {
    return Array.from(new Set(data.map(d => d.Year))).sort((a, b) => b - a);
  }, [data]);

  const availableQuarters = useMemo(() => {
    return Array.from(new Set(data.map(d => d.Quarter).filter(Boolean) as string[])).sort();
  }, [data]);

  const [selectedYear, setSelectedYear] = useState<number | 'all'>(availableYears[0] || 'all');
  const [selectedQuarter, setSelectedQuarter] = useState<string | 'all'>('all');
  const [selectedProvince, setSelectedProvince] = useState<string | 'all'>('all');
  const [selectedRegion, setSelectedRegion] = useState<string | 'all'>('all');
  const [viewMode, setViewMode] = useState<'single' | 'trend'>('single');

  const availableProvinces = useMemo(() => {
    return Array.from(new Set(data.map(d => d.Province).filter(Boolean) as string[])).sort();
  }, [data]);

  const availableRegions = useMemo(() => {
    const filteredSource = selectedProvince === 'all' 
      ? data 
      : data.filter(d => d.Province === selectedProvince);
    return Array.from(new Set(filteredSource.map(d => d.Region).filter(Boolean) as string[])).sort();
  }, [data, selectedProvince]);

  // Update selected year if data changes and current selection is invalid
  React.useEffect(() => {
    if (availableYears.length > 0 && selectedYear !== 'all' && !availableYears.includes(selectedYear)) {
      setSelectedYear(availableYears[0]);
    } else if (availableYears.length > 0 && selectedYear === 'all' && availableYears.length === 1) {
      setSelectedYear(availableYears[0]);
    }
  }, [availableYears, selectedYear]);

  // Update selected quarter if data changes and current selection is invalid
  React.useEffect(() => {
    if (availableQuarters.length > 0 && selectedQuarter !== 'all' && !availableQuarters.includes(selectedQuarter)) {
      setSelectedQuarter('all');
    }
  }, [availableQuarters, selectedQuarter]);

  // Reset selected region if no longer valid under selected province
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
      <div className="flex flex-col items-center justify-center h-full text-slate-500 py-20">
        <Activity size={48} className="mb-4 text-slate-300" />
        <h3 className="text-xl font-medium text-slate-700">Tidak Ada Data</h3>
        <p className="mt-2">Silakan unggah data fiskal daerah untuk melihat dasbor.</p>
      </div>
    );
  }

  const filteredData = data.filter(d => {
    const matchYear = selectedYear === 'all' || d.Year === selectedYear;
    const matchQuarter = selectedQuarter === 'all' || d.Quarter === selectedQuarter || (!d.Quarter && selectedQuarter === 'all');
    const matchProvince = selectedProvince === 'all' || d.Province === selectedProvince;
    const matchRegion = selectedRegion === 'all' || d.Region === selectedRegion;
    return matchYear && matchQuarter && matchProvince && matchRegion;
  });

  // Calculate summary metrics
  // If 'all' is selected, we might want to get unique regions or just average everything.
  // For unique regions count:
  const uniqueRegionsCount = new Set(filteredData.map(d => d.Region)).size;
  const totalRecords = filteredData.length;
  
  const avgFiscalCapacity = filteredData.reduce((acc, curr) => acc + (curr.Fiscal_Capacity_Index || 0), 0) / (totalRecords || 1);
  const highRiskRegions = filteredData.filter(d => d.Fiscal_Risk === 'High risk' || d.Fiscal_Risk === 'Severe fiscal stress').length;
  const avgTransferDependency = filteredData.reduce((acc, curr) => acc + (curr.Transfer_Dependency || 0), 0) / (totalRecords || 1);

  // Prepare data for charts
  const topRegionsByGDP = [...filteredData].sort((a, b) => b.GDP_Growth - a.GDP_Growth).slice(0, 5);
  
  const dependencyVsCapacity = filteredData.map(d => ({
    name: `${d.Region} (${d.Year})`,
    dependency: d.Transfer_Dependency || 0,
    capacity: d.Fiscal_Capacity_Index || 0,
    stress: d.Fiscal_Stress_Score || 0
  }));

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

  return (
    <div className="space-y-6">
      {/* Header with Filter */}
      <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center bg-white p-5 rounded-xl shadow-sm border border-slate-200 gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-800">Ringkasan Eksekutif</h2>
          <p className="text-xs text-slate-400 mt-0.5">Pantau ringkasan kapasitas dan risiko fiskal daerah.</p>
        </div>
        <div className="flex flex-wrap items-center gap-4">
          {/* Provinsi filter */}
          {availableProvinces.length > 0 && (
            <div className="flex items-center space-x-2">
              <span className="text-xs font-semibold text-slate-600">Provinsi:</span>
              <select 
                className="px-3 py-1.5 border border-slate-300 rounded-lg bg-slate-50 text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs font-medium"
                value={selectedProvince}
                onChange={(e) => setSelectedProvince(e.target.value)}
              >
                <option value="all">Semua Provinsi</option>
                {availableProvinces.map(prov => (
                  <option key={prov} value={prov}>{prov}</option>
                ))}
              </select>
            </div>
          )}

          {/* Daerah/Kabupaten filter */}
          {availableRegions.length > 0 && (
            <div className="flex items-center space-x-2">
              <span className="text-xs font-semibold text-slate-600">Daerah:</span>
              <select 
                className="px-3 py-1.5 border border-slate-300 rounded-lg bg-slate-50 text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs font-medium"
                value={selectedRegion}
                onChange={(e) => setSelectedRegion(e.target.value)}
              >
                <option value="all">Semua Daerah</option>
                {availableRegions.map(reg => (
                  <option key={reg} value={reg}>{reg}</option>
                ))}
              </select>
            </div>
          )}

          {availableQuarters.length > 0 && (
            <div className="flex items-center space-x-2">
              <span className="text-xs font-semibold text-slate-600">Triwulan:</span>
              <select 
                className="px-3 py-1.5 border border-slate-300 rounded-lg bg-slate-50 text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs font-medium"
                value={selectedQuarter}
                onChange={(e) => setSelectedQuarter(e.target.value)}
              >
                <option value="all">Semua Triwulan</option>
                {availableQuarters.map(q => (
                  <option key={q} value={q}>{q}</option>
                ))}
              </select>
            </div>
          )}

          <div className="flex items-center space-x-2">
            <Calendar size={14} className="text-slate-400" />
            <span className="text-xs font-semibold text-slate-600">Tahun:</span>
            <select 
              className="px-3 py-1.5 border border-slate-300 rounded-lg bg-slate-50 text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs font-medium"
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value === 'all' ? 'all' : Number(e.target.value))}
            >
              <option value="all">Semua Tahun</option>
              {availableYears.map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <SummaryCard 
          title="Total Daerah" 
          value={uniqueRegionsCount.toString()} 
          icon={<Activity className="text-blue-500" />} 
          trend={selectedYear === 'all' ? `${totalRecords} total data` : `Tahun ${selectedYear}`}
        />
        <SummaryCard 
          title="Rata-rata Kapasitas Fiskal" 
          value={avgFiscalCapacity.toFixed(1)} 
          icon={<TrendingUp className="text-emerald-500" />} 
          trend="Skala: 0-100"
        />
        <SummaryCard 
          title="Daerah Risiko Tinggi" 
          value={highRiskRegions.toString()} 
          icon={<AlertTriangle className="text-rose-500" />} 
          trend={`${((highRiskRegions/(totalRecords||1))*100).toFixed(1)}% dari data`}
        />
        <SummaryCard 
          title="Rata-rata Ketergantungan Transfer" 
          value={`${avgTransferDependency.toFixed(1)}%`} 
          icon={<DollarSign className="text-amber-500" />} 
          trend="Target ideal: < 50%"
        />
      </div>

      {/* Charts Header with Toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between bg-white p-5 rounded-xl shadow-sm border border-slate-200 gap-3">
        <div>
          <h3 className="text-base font-bold text-slate-800">Visualisasi & Sandbox Fiskal</h3>
          <p className="text-xs text-slate-400">Analisis sebaran daerah secara parsial atau pelajari perkembangan historis multi-tahun.</p>
        </div>
        <div className="flex items-center bg-slate-100 p-1 rounded-lg self-start sm:self-center border border-slate-200">
          <button
            onClick={() => setViewMode('single')}
            className={`px-4 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer ${
              viewMode === 'single'
                ? 'bg-white text-indigo-600 shadow-xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Single Year
          </button>
          <button
            onClick={() => setViewMode('trend')}
            className={`px-4 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer ${
              viewMode === 'trend'
                ? 'bg-white text-indigo-600 shadow-xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            Multi-Year Trend
          </button>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {viewMode === 'single' ? (
          <>
            {/* GDP Growth Chart */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
              <h3 className="text-lg font-semibold mb-4 text-slate-800">Top 5 Pertumbuhan PDRB {selectedYear !== 'all' ? `(${selectedYear})` : ''}</h3>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={topRegionsByGDP} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                    <XAxis type="number" />
                    <YAxis dataKey={selectedYear === 'all' || selectedQuarter === 'all' ? ((d: any) => `${d.Region} '${d.Year.toString().slice(2)}${d.Quarter ? ' ' + d.Quarter : ''}`) : "Region"} type="category" width={120} />
                    <Tooltip />
                    <Bar dataKey="GDP_Growth" fill="#4f46e5" radius={[0, 4, 4, 0]} name="Pertumbuhan PDRB (%)" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Transfer Dependency vs Fiscal Capacity */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
              <h3 className="text-lg font-semibold mb-4 text-slate-800">Ketergantungan Transfer vs Kapasitas Fiskal</h3>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" dataKey="dependency" name="Ketergantungan Transfer" unit="%" />
                    <YAxis type="number" dataKey="capacity" name="Kapasitas Fiskal" />
                    <ZAxis type="number" dataKey="stress" range={[50, 400]} name="Skor Stres" />
                    <Tooltip cursor={{ strokeDasharray: '3 3' }} />
                    <Legend />
                    {(() => {
                      const regionList = Array.from(new Set(dependencyVsCapacity.map(d => d.name.split(' (')[0])));
                      return regionList.map((region, index) => {
                        const regionData = dependencyVsCapacity.filter(d => d.name.split(' (')[0] === region);
                        return (
                          <Scatter 
                            key={region} 
                            name={region} 
                            data={regionData} 
                            fill={COLORS[index % COLORS.length]} 
                          />
                        );
                      });
                    })()}
                  </ScatterChart>
                </ResponsiveContainer>
              </div>
            </div>
          </>
        ) : (
          <>
            {/* GDP Growth Multi-Year Trend Chart */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
              <h3 className="text-lg font-semibold mb-4 text-slate-800">Tren Pertumbuhan PDRB Multi-Tahun (Rata-rata Subnasional)</h3>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={trendData} margin={{ top: 10, right: 30, left: 10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="label" stroke="#64748b" fontSize={11} />
                    <YAxis stroke="#64748b" fontSize={11} unit="%" />
                    <Tooltip formatter={(value: number) => [`${value}%`, "Rata-rata Pertumbuhan"]} />
                    <Legend />
                    <Line type="monotone" dataKey="avgGdpGrowth" stroke="#4f46e5" strokeWidth={3} activeDot={{ r: 8 }} name="Pertumbuhan PDRB Rata-rata" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Transfer Dependency vs Fiscal Capacity Multi-Year Trend Chart */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
              <h3 className="text-lg font-semibold mb-4 text-slate-800">Tren Makro-Fiskal: Ketergantungan vs Kapasitas Fiskal</h3>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={trendData} margin={{ top: 10, right: 30, left: 10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="label" stroke="#64748b" fontSize={11} />
                    <YAxis stroke="#64748b" fontSize={11} />
                    <Tooltip formatter={(value: number, name: string) => [name === "avgDependency" ? `${value}%` : value, name === "avgDependency" ? "Ketergantungan Transfer" : "Kapasitas Fiskal"]} />
                    <Legend />
                    <Line type="monotone" dataKey="avgDependency" stroke="#eab308" strokeWidth={2.5} name="Ketergantungan Transfer (%)" />
                    <Line type="monotone" dataKey="avgCapacity" stroke="#10b981" strokeWidth={2.5} name="Skor Kapasitas Fiskal" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Data Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-200">
          <h3 className="text-lg font-semibold text-slate-800">Ringkasan Fiskal Daerah</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left text-slate-500">
            <thead className="text-xs text-slate-700 uppercase bg-slate-50">
              <tr>
                <th className="px-6 py-3">Daerah</th>
                <th className="px-6 py-3">Provinsi</th>
                <th className="px-6 py-3">Tahun/Triwulan</th>
                <th className="px-6 py-3">Kapasitas Fiskal</th>
                <th className="px-6 py-3">Skor Stres</th>
                <th className="px-6 py-3">Tingkat Risiko</th>
              </tr>
            </thead>
            <tbody>
              {filteredData.slice(0, 10).map((row, i) => (
                <tr key={i} className="bg-white border-b hover:bg-slate-50">
                  <td className="px-6 py-4 font-medium text-slate-900">{row.Region}</td>
                  <td className="px-6 py-4">{row.Province}</td>
                  <td className="px-6 py-4">{row.Year}{row.Quarter ? ` ${row.Quarter}` : ''}</td>
                  <td className="px-6 py-4">{row.Fiscal_Capacity_Index?.toFixed(1) || 'N/A'}</td>
                  <td className="px-6 py-4">{row.Fiscal_Stress_Score?.toFixed(1) || 'N/A'}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      row.Fiscal_Risk === 'Stable' ? 'bg-emerald-100 text-emerald-800' :
                      row.Fiscal_Risk === 'Warning' ? 'bg-amber-100 text-amber-800' :
                      row.Fiscal_Risk === 'High risk' ? 'bg-orange-100 text-orange-800' :
                      'bg-rose-100 text-rose-800'
                    }`}>
                      {row.Fiscal_Risk === 'Stable' ? 'Stabil' :
                       row.Fiscal_Risk === 'Warning' ? 'Peringatan' :
                       row.Fiscal_Risk === 'High risk' ? 'Risiko Tinggi' :
                       'Stres Berat'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function SummaryCard({ title, value, icon, trend }: { title: string, value: string, icon: React.ReactNode, trend: string }) {
  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex items-start justify-between">
      <div>
        <p className="text-sm font-medium text-slate-500 mb-1">{title}</p>
        <h4 className="text-2xl font-bold text-slate-900">{value}</h4>
        <p className="text-xs text-slate-400 mt-2">{trend}</p>
      </div>
      <div className="p-3 bg-slate-50 rounded-lg">
        {icon}
      </div>
    </div>
  );
}
