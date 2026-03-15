import React, { useState, useMemo } from 'react';
import { RegionalData } from '../types';
import { AlertTriangle, ShieldAlert, ShieldCheck, Activity, TrendingDown, TrendingUp } from 'lucide-react';
import { 
  ScatterChart, 
  Scatter, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip as RechartsTooltip, 
  ResponsiveContainer,
  ZAxis,
  Cell
} from 'recharts';

interface FiscalRiskMonitorProps {
  data: RegionalData[];
}

export default function FiscalRiskMonitor({ data }: FiscalRiskMonitorProps) {
  const [selectedYear, setSelectedYear] = useState<number | 'all'>('all');

  const years = useMemo(() => {
    const uniqueYears = Array.from(new Set(data.map(d => d.Year))).sort((a, b) => b - a);
    return uniqueYears;
  }, [data]);

  const filteredData = useMemo(() => {
    if (selectedYear === 'all') {
      // If 'all', get the latest year for each region to show current risk
      const latestDataMap = new Map<string, RegionalData>();
      data.forEach(d => {
        const existing = latestDataMap.get(d.Region);
        if (!existing || existing.Year < d.Year) {
          latestDataMap.set(d.Region, d);
        }
      });
      return Array.from(latestDataMap.values());
    }
    return data.filter(d => d.Year === selectedYear);
  }, [data, selectedYear]);

  // Calculate Risk Metrics
  const riskMetrics = useMemo(() => {
    return filteredData.map(d => {
      const debtRatio = (d.Debt / d.Revenue) * 100;
      const padRatio = (d.PAD / d.Revenue) * 100;
      const deficitRatio = d.Fiscal_Balance < 0 ? (Math.abs(d.Fiscal_Balance) / d.Expenditure) * 100 : 0;
      const personnelRatio = (d.Personnel_Spending / d.Expenditure) * 100;

      const flags = [];
      if (debtRatio > 30) flags.push('Beban Utang Tinggi');
      if (padRatio < 20) flags.push('Kemandirian Fiskal Rendah');
      if (deficitRatio > 5) flags.push('Defisit Melebar');
      if (personnelRatio > 40) flags.push('Belanja Pegawai Mendominasi');

      return {
        ...d,
        debtRatio,
        padRatio,
        deficitRatio,
        personnelRatio,
        flags
      };
    }).sort((a, b) => b.Fiscal_Stress_Score - a.Fiscal_Stress_Score);
  }, [filteredData]);

  const highRiskCount = riskMetrics.filter(d => d.Fiscal_Risk === 'Tinggi').length;
  const moderateRiskCount = riskMetrics.filter(d => d.Fiscal_Risk === 'Sedang').length;
  const lowRiskCount = riskMetrics.filter(d => d.Fiscal_Risk === 'Rendah').length;

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'Tinggi': return '#ef4444'; // red-500
      case 'Sedang': return '#f59e0b'; // amber-500
      case 'Rendah': return '#10b981'; // emerald-500
      default: return '#94a3b8';
    }
  };

  const getRiskBadge = (risk: string) => {
    switch (risk) {
      case 'Tinggi':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800"><ShieldAlert size={12} className="mr-1" /> Tinggi</span>;
      case 'Sedang':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800"><AlertTriangle size={12} className="mr-1" /> Sedang</span>;
      case 'Rendah':
        return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800"><ShieldCheck size={12} className="mr-1" /> Rendah</span>;
      default:
        return null;
    }
  };

  if (data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-slate-500">
        <Activity size={48} className="mb-4 text-slate-300" />
        <p className="text-lg">Belum ada data yang diunggah.</p>
        <p className="text-sm">Silakan unggah data fiskal terlebih dahulu untuk melihat monitor risiko.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header & Filters */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 rounded-xl shadow-sm border border-slate-200">
        <div>
          <h2 className="text-lg font-semibold text-slate-800">Monitor Risiko Fiskal</h2>
          <p className="text-sm text-slate-500">Pemantauan indikator kerentanan dan stres fiskal daerah</p>
        </div>
        <div className="flex items-center space-x-2">
          <label className="text-sm font-medium text-slate-700">Tahun:</label>
          <select 
            className="border-slate-300 rounded-md text-sm focus:ring-indigo-500 focus:border-indigo-500"
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value === 'all' ? 'all' : Number(e.target.value))}
          >
            <option value="all">Terbaru (Semua Daerah)</option>
            {years.map(year => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex items-center space-x-4">
          <div className="p-3 bg-red-100 text-red-600 rounded-lg">
            <ShieldAlert size={24} />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">Risiko Tinggi</p>
            <h3 className="text-2xl font-bold text-slate-800">{highRiskCount} <span className="text-sm font-normal text-slate-500">Daerah</span></h3>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex items-center space-x-4">
          <div className="p-3 bg-amber-100 text-amber-600 rounded-lg">
            <AlertTriangle size={24} />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">Risiko Sedang</p>
            <h3 className="text-2xl font-bold text-slate-800">{moderateRiskCount} <span className="text-sm font-normal text-slate-500">Daerah</span></h3>
          </div>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex items-center space-x-4">
          <div className="p-3 bg-emerald-100 text-emerald-600 rounded-lg">
            <ShieldCheck size={24} />
          </div>
          <div>
            <p className="text-sm font-medium text-slate-500">Risiko Rendah</p>
            <h3 className="text-2xl font-bold text-slate-800">{lowRiskCount} <span className="text-sm font-normal text-slate-500">Daerah</span></h3>
          </div>
        </div>
      </div>

      {/* Risk Matrix Chart */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
        <h3 className="text-lg font-semibold mb-1 text-slate-800">Matriks Risiko Fiskal</h3>
        <p className="text-sm text-slate-500 mb-6">Hubungan antara Skor Stres Fiskal dan Rasio Utang terhadap Pendapatan</p>
        
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
              <CartesianGrid strokeDasharray="3 3" opacity={0.5} />
              <XAxis 
                type="number" 
                dataKey="Fiscal_Stress_Score" 
                name="Skor Stres" 
                domain={[0, 100]} 
                label={{ value: 'Skor Stres Fiskal (0-100)', position: 'insideBottom', offset: -10 }} 
              />
              <YAxis 
                type="number" 
                dataKey="debtRatio" 
                name="Rasio Utang" 
                label={{ value: 'Rasio Utang thd Pendapatan (%)', angle: -90, position: 'insideLeft' }} 
              />
              <ZAxis type="number" dataKey="Population" range={[50, 400]} name="Populasi" />
              <RechartsTooltip 
                cursor={{ strokeDasharray: '3 3' }}
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="bg-white p-3 border border-slate-200 shadow-md rounded-lg">
                        <p className="font-semibold text-slate-800">{data.Region}</p>
                        <p className="text-sm text-slate-600">Skor Stres: <span className="font-medium">{data.Fiscal_Stress_Score.toFixed(1)}</span></p>
                        <p className="text-sm text-slate-600">Rasio Utang: <span className="font-medium">{data.debtRatio.toFixed(1)}%</span></p>
                        <p className="text-sm text-slate-600 mt-1">Risiko: {getRiskBadge(data.Fiscal_Risk)}</p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Scatter name="Daerah" data={riskMetrics}>
                {riskMetrics.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={getRiskColor(entry.Fiscal_Risk)} />
                ))}
              </Scatter>
            </ScatterChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Risk Table */}
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-6 border-b border-slate-200">
          <h3 className="text-lg font-semibold text-slate-800">Daftar Peringatan Dini Daerah</h3>
          <p className="text-sm text-slate-500">Identifikasi faktor risiko spesifik untuk setiap daerah</p>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Daerah</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Tahun</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Tingkat Risiko</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Skor Stres</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Faktor Risiko (Peringatan)</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-200">
              {riskMetrics.map((region) => (
                <tr key={`${region.id}-${region.Year}`} className="hover:bg-slate-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="font-medium text-slate-900">{region.Region}</div>
                    <div className="text-xs text-slate-500">{region.Province}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                    {region.Year}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {getRiskBadge(region.Fiscal_Risk)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <span className="text-sm font-medium text-slate-900 mr-2">{region.Fiscal_Stress_Score.toFixed(1)}</span>
                      <div className="w-16 h-2 bg-slate-200 rounded-full overflow-hidden">
                        <div 
                          className="h-full rounded-full" 
                          style={{ 
                            width: `${region.Fiscal_Stress_Score}%`,
                            backgroundColor: getRiskColor(region.Fiscal_Risk)
                          }}
                        />
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap gap-1">
                      {region.flags.length > 0 ? (
                        region.flags.map((flag, idx) => (
                          <span key={idx} className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200">
                            {flag}
                          </span>
                        ))
                      ) : (
                        <span className="text-sm text-slate-400 italic">Tidak ada peringatan khusus</span>
                      )}
                    </div>
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
