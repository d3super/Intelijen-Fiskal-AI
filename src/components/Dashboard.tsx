import React from 'react';
import { RegionalData } from '../types';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  LineChart, Line, ScatterChart, Scatter, ZAxis
} from 'recharts';
import { AlertTriangle, TrendingUp, DollarSign, Activity } from 'lucide-react';

export default function Dashboard({ data }: { data: RegionalData[] }) {
  if (data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-slate-500 py-20">
        <Activity size={48} className="mb-4 text-slate-300" />
        <h3 className="text-xl font-medium text-slate-700">Tidak Ada Data</h3>
        <p className="mt-2">Silakan unggah data fiskal daerah untuk melihat dasbor.</p>
      </div>
    );
  }

  // Calculate summary metrics
  const totalRegions = data.length;
  const avgFiscalCapacity = data.reduce((acc, curr) => acc + (curr.Fiscal_Capacity_Index || 0), 0) / totalRegions;
  const highRiskRegions = data.filter(d => d.Fiscal_Risk === 'High risk' || d.Fiscal_Risk === 'Severe fiscal stress').length;
  const avgTransferDependency = data.reduce((acc, curr) => acc + (curr.Transfer_Dependency || 0), 0) / totalRegions;

  // Prepare data for charts
  const topRegionsByGDP = [...data].sort((a, b) => b.GDP_Growth - a.GDP_Growth).slice(0, 5);
  
  const dependencyVsCapacity = data.map(d => ({
    name: d.Region,
    dependency: d.Transfer_Dependency || 0,
    capacity: d.Fiscal_Capacity_Index || 0,
    stress: d.Fiscal_Stress_Score || 0
  }));

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <SummaryCard 
          title="Total Daerah Dianalisis" 
          value={totalRegions.toString()} 
          icon={<Activity className="text-blue-500" />} 
          trend="Data yang dimuat"
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
          trend={`${((highRiskRegions/totalRegions)*100).toFixed(1)}% dari total`}
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
          <h3 className="text-lg font-semibold mb-4 text-slate-800">Top 5 Daerah Berdasarkan Pertumbuhan PDRB</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topRegionsByGDP} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                <XAxis type="number" />
                <YAxis dataKey="Region" type="category" width={100} />
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
                <th className="px-6 py-3">Kapasitas Fiskal</th>
                <th className="px-6 py-3">Skor Stres</th>
                <th className="px-6 py-3">Tingkat Risiko</th>
              </tr>
            </thead>
            <tbody>
              {data.slice(0, 10).map((row, i) => (
                <tr key={i} className="bg-white border-b hover:bg-slate-50">
                  <td className="px-6 py-4 font-medium text-slate-900">{row.Region}</td>
                  <td className="px-6 py-4">{row.Province}</td>
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
