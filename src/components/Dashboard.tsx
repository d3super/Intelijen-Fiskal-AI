import React, { useState, useMemo } from 'react';
import { RegionalData } from '../types';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  LineChart, Line, ScatterChart, Scatter, ZAxis
} from 'recharts';
import { AlertTriangle, TrendingUp, DollarSign, Activity, Calendar } from 'lucide-react';

export default function Dashboard({ data }: { data: RegionalData[] }) {
  const availableYears = useMemo(() => {
    return Array.from(new Set(data.map(d => d.Year))).sort((a, b) => b - a);
  }, [data]);

  const availableQuarters = useMemo(() => {
    return Array.from(new Set(data.map(d => d.Quarter).filter(Boolean) as string[])).sort();
  }, [data]);

  const [selectedYear, setSelectedYear] = useState<number | 'all'>(availableYears[0] || 'all');
  const [selectedQuarter, setSelectedQuarter] = useState<string | 'all'>('all');

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
    return matchYear && matchQuarter;
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

  return (
    <div className="space-y-6">
      {/* Header with Filter */}
      <div className="flex justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-slate-200">
        <h2 className="text-lg font-semibold text-slate-800">Ringkasan Eksekutif</h2>
        <div className="flex items-center space-x-2">
          {availableQuarters.length > 0 && (
            <>
              <span className="text-sm font-medium text-slate-700 ml-4">Triwulan:</span>
              <select 
                className="px-3 py-1.5 border border-slate-300 rounded-lg bg-slate-50 text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
                value={selectedQuarter}
                onChange={(e) => setSelectedQuarter(e.target.value)}
              >
                <option value="all">Semua Triwulan</option>
                {availableQuarters.map(q => (
                  <option key={q} value={q}>{q}</option>
                ))}
              </select>
            </>
          )}
          <Calendar size={18} className="text-slate-500 ml-4" />
          <span className="text-sm font-medium text-slate-700">Tahun:</span>
          <select 
            className="px-3 py-1.5 border border-slate-300 rounded-lg bg-slate-50 text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm"
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

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
                <Scatter name="Daerah" data={dependencyVsCapacity} fill="#f43f5e" />
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        </div>
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
