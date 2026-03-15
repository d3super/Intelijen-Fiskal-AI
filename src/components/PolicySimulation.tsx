import React, { useState } from 'react';
import { RegionalData, PolicyScenario } from '../types';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { SlidersHorizontal, ArrowRight, TrendingUp, TrendingDown, Lightbulb } from 'lucide-react';

export default function PolicySimulation({ data }: { data: RegionalData[] }) {
  const [selectedRegion, setSelectedRegion] = useState<string>(data[0]?.Region || '');
  const [scenario, setScenario] = useState<PolicyScenario>({
    padIncrease: 0,
    capitalExpIncrease: 0,
    personnelExpDecrease: 0,
    socialExpIncrease: 0,
    transferDecrease: 0
  });

  if (data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-slate-500 py-20">
        <SlidersHorizontal size={48} className="mb-4 text-slate-300" />
        <h3 className="text-xl font-medium text-slate-700">Tidak Ada Data Tersedia</h3>
        <p className="mt-2">Silakan unggah data fiskal daerah untuk menjalankan simulasi kebijakan.</p>
      </div>
    );
  }

  const regionData = data.find(d => d.Region === selectedRegion) || data[0];

  // Simulation Logic
  // Multipliers
  const INFRASTRUCTURE_MULTIPLIER = 1.4;
  const SOCIAL_SPENDING_MULTIPLIER = 1.2;
  const TAX_INCREASE_MULTIPLIER = -0.6;

  // Baseline
  const baselineGDP = regionData.GDP_Growth;
  const baselineBalance = regionData.Fiscal_Balance;
  const baselineRevenue = regionData.Revenue;
  const baselineExpenditure = regionData.Expenditure;

  // Simulated Changes
  const padChange = regionData.PAD * (scenario.padIncrease / 100);
  const transferChange = regionData.Transfer * (scenario.transferDecrease / 100) * -1; // Decrease
  const capitalChange = regionData.Capital_Expenditure * (scenario.capitalExpIncrease / 100);
  const personnelChange = regionData.Personnel_Spending * (scenario.personnelExpDecrease / 100) * -1; // Decrease
  const socialChange = regionData.Social_Spending * (scenario.socialExpIncrease / 100);

  // Simulated Outcomes
  const simulatedRevenue = baselineRevenue + padChange + transferChange;
  const simulatedExpenditure = baselineExpenditure + capitalChange + personnelChange + socialChange;
  const simulatedBalance = simulatedRevenue - simulatedExpenditure;

  // GDP Impact Calculation (Simplified)
  // GDP Growth = Baseline + (Capital Change * 1.4) + (Social Change * 1.2) + (PAD Change * -0.6)
  // Note: Changes are normalized to a percentage of total revenue to scale the impact
  const gdpImpactCapital = (capitalChange / baselineRevenue) * 100 * INFRASTRUCTURE_MULTIPLIER;
  const gdpImpactSocial = (socialChange / baselineRevenue) * 100 * SOCIAL_SPENDING_MULTIPLIER;
  const gdpImpactTax = (padChange / baselineRevenue) * 100 * TAX_INCREASE_MULTIPLIER;
  
  const simulatedGDP = baselineGDP + gdpImpactCapital + gdpImpactSocial + gdpImpactTax;

  // Chart Data
  const comparisonData = [
    {
      name: 'Pendapatan',
      Awal: baselineRevenue,
      Simulasi: simulatedRevenue,
    },
    {
      name: 'Belanja',
      Awal: baselineExpenditure,
      Simulasi: simulatedExpenditure,
    },
    {
      name: 'Keseimbangan Fiskal',
      Awal: baselineBalance,
      Simulasi: simulatedBalance,
    }
  ];

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>, field: keyof PolicyScenario) => {
    setScenario({ ...scenario, [field]: parseFloat(e.target.value) });
  };

  const generateInsight = () => {
    let insights = [];
    
    if (simulatedGDP > baselineGDP) {
      insights.push(`Skenario ini diproyeksikan akan meningkatkan pertumbuhan ekonomi daerah sebesar ${(simulatedGDP - baselineGDP).toFixed(2)}%. Peningkatan ini didorong oleh efek pengganda (multiplier effect) dari kebijakan yang diambil.`);
    } else if (simulatedGDP < baselineGDP) {
      insights.push(`Skenario ini diproyeksikan akan menurunkan pertumbuhan ekonomi daerah sebesar ${Math.abs(simulatedGDP - baselineGDP).toFixed(2)}%. Hal ini mungkin disebabkan oleh kontraksi akibat peningkatan pajak atau penurunan belanja produktif.`);
    } else {
      insights.push(`Skenario ini diproyeksikan tidak memberikan dampak signifikan terhadap pertumbuhan ekonomi daerah.`);
    }

    if (simulatedBalance > baselineBalance) {
      insights.push(`Keseimbangan fiskal menunjukkan perbaikan, dengan surplus (atau pengurangan defisit) sebesar ${new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', notation: 'compact' }).format(simulatedBalance - baselineBalance)}. Ini mengindikasikan ruang fiskal yang lebih sehat.`);
    } else if (simulatedBalance < baselineBalance) {
      insights.push(`Keseimbangan fiskal menunjukkan pemburukan, dengan peningkatan defisit (atau penurunan surplus) sebesar ${new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', notation: 'compact' }).format(Math.abs(simulatedBalance - baselineBalance))}. Perlu kehati-hatian dalam pembiayaan defisit ini.`);
    }

    if (scenario.padIncrease > 0 && simulatedGDP < baselineGDP) {
      insights.push(`Catatan: Peningkatan PAD (Pajak/Retribusi) memberikan tekanan pada pertumbuhan ekonomi jangka pendek. Pastikan peningkatan PAD diimbangi dengan perbaikan layanan publik.`);
    }

    if (scenario.capitalExpIncrease > 0) {
      insights.push(`Peningkatan Belanja Modal diharapkan dapat menciptakan aset produktif jangka panjang yang mendukung investasi swasta.`);
    }

    if (scenario.personnelExpDecrease > 0) {
      insights.push(`Efisiensi Belanja Pegawai memberikan tambahan ruang fiskal yang dapat dialihkan untuk belanja produktif atau perlindungan sosial.`);
    }

    return insights;
  };

  const insights = generateInsight();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-slate-800">Simulasi Kebijakan Daerah</h3>
          <p className="text-sm text-slate-500">Sesuaikan instrumen fiskal untuk mensimulasikan dampak terhadap pertumbuhan PDRB dan keseimbangan fiskal.</p>
        </div>
        <select 
          className="px-4 py-2 border border-slate-300 rounded-lg bg-slate-50 text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          value={selectedRegion}
          onChange={(e) => setSelectedRegion(e.target.value)}
        >
          {data.map(d => (
            <option key={d.id} value={d.Region}>{d.Region} ({d.Year})</option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Controls Panel */}
        <div className="lg:col-span-4 bg-white p-6 rounded-xl shadow-sm border border-slate-200 space-y-6">
          <h4 className="text-md font-semibold text-slate-800 border-b border-slate-100 pb-2">Instrumen Kebijakan</h4>
          
          <SliderControl 
            label="Peningkatan PAD (Pajak/Retribusi)" 
            value={scenario.padIncrease} 
            onChange={(e) => handleSliderChange(e, 'padIncrease')} 
            min={0} max={50} unit="%" 
            color="indigo"
          />
          <SliderControl 
            label="Peningkatan Belanja Modal" 
            value={scenario.capitalExpIncrease} 
            onChange={(e) => handleSliderChange(e, 'capitalExpIncrease')} 
            min={0} max={50} unit="%" 
            color="emerald"
          />
          <SliderControl 
            label="Penurunan Belanja Pegawai" 
            value={scenario.personnelExpDecrease} 
            onChange={(e) => handleSliderChange(e, 'personnelExpDecrease')} 
            min={0} max={30} unit="%" 
            color="rose"
          />
          <SliderControl 
            label="Peningkatan Belanja Sosial" 
            value={scenario.socialExpIncrease} 
            onChange={(e) => handleSliderChange(e, 'socialExpIncrease')} 
            min={0} max={50} unit="%" 
            color="amber"
          />
          <SliderControl 
            label="Penurunan Ketergantungan Transfer" 
            value={scenario.transferDecrease} 
            onChange={(e) => handleSliderChange(e, 'transferDecrease')} 
            min={0} max={30} unit="%" 
            color="blue"
          />

          <button 
            onClick={() => setScenario({ padIncrease: 0, capitalExpIncrease: 0, personnelExpDecrease: 0, socialExpIncrease: 0, transferDecrease: 0 })}
            className="w-full py-2 px-4 border border-slate-300 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
          >
            Atur Ulang Skenario
          </button>
        </div>

        {/* Results Panel */}
        <div className="lg:col-span-8 space-y-6">
          {/* Impact Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
              <h4 className="text-sm font-medium text-slate-500 mb-4">Dampak Pertumbuhan PDRB</h4>
              <div className="flex items-end space-x-4">
                <div>
                  <p className="text-sm text-slate-400 mb-1">Awal</p>
                  <p className="text-2xl font-semibold text-slate-700">{baselineGDP.toFixed(2)}%</p>
                </div>
                <ArrowRight className="text-slate-300 mb-2" />
                <div>
                  <p className="text-sm text-indigo-500 font-medium mb-1">Simulasi</p>
                  <div className="flex items-center space-x-2">
                    <p className={`text-3xl font-bold ${simulatedGDP > baselineGDP ? 'text-emerald-600' : simulatedGDP < baselineGDP ? 'text-rose-600' : 'text-slate-800'}`}>
                      {simulatedGDP.toFixed(2)}%
                    </p>
                    {simulatedGDP > baselineGDP ? <TrendingUp className="text-emerald-500" size={20} /> : simulatedGDP < baselineGDP ? <TrendingDown className="text-rose-500" size={20} /> : null}
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
              <h4 className="text-sm font-medium text-slate-500 mb-4">Dampak Keseimbangan Fiskal</h4>
              <div className="flex items-end space-x-4">
                <div>
                  <p className="text-sm text-slate-400 mb-1">Awal</p>
                  <p className="text-xl font-semibold text-slate-700">{new Intl.NumberFormat('id-ID', { notation: 'compact', maximumFractionDigits: 1 }).format(baselineBalance)}</p>
                </div>
                <ArrowRight className="text-slate-300 mb-2" />
                <div>
                  <p className="text-sm text-indigo-500 font-medium mb-1">Simulasi</p>
                  <div className="flex items-center space-x-2">
                    <p className={`text-2xl font-bold ${simulatedBalance > baselineBalance ? 'text-emerald-600' : simulatedBalance < baselineBalance ? 'text-rose-600' : 'text-slate-800'}`}>
                      {new Intl.NumberFormat('id-ID', { notation: 'compact', maximumFractionDigits: 1 }).format(simulatedBalance)}
                    </p>
                    {simulatedBalance > baselineBalance ? <TrendingUp className="text-emerald-500" size={20} /> : simulatedBalance < baselineBalance ? <TrendingDown className="text-rose-500" size={20} /> : null}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Narrative Insights */}
          <div className="bg-indigo-50 p-6 rounded-xl border border-indigo-100">
            <div className="flex items-center space-x-2 mb-4">
              <Lightbulb className="text-indigo-600" size={24} />
              <h3 className="text-lg font-semibold text-indigo-900">Kesimpulan & Insight</h3>
            </div>
            <ul className="space-y-3">
              {insights.map((insight, index) => (
                <li key={index} className="flex items-start">
                  <span className="text-indigo-500 mr-2">•</span>
                  <span className="text-slate-700 text-sm leading-relaxed">{insight}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Comparison Chart */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <h3 className="text-lg font-semibold mb-6 text-slate-800">Anggaran Awal vs Simulasi</h3>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={comparisonData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="name" />
                  <YAxis tickFormatter={(value) => new Intl.NumberFormat('id-ID', { notation: 'compact' }).format(value)} />
                  <Tooltip formatter={(value: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(value)} />
                  <Legend />
                  <Bar dataKey="Awal" fill="#94a3b8" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="Simulasi" fill="#4f46e5" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function SliderControl({ label, value, onChange, min, max, unit, color }: any) {
  const colorMap: Record<string, string> = {
    indigo: 'accent-indigo-600',
    emerald: 'accent-emerald-600',
    rose: 'accent-rose-600',
    amber: 'accent-amber-600',
    blue: 'accent-blue-600',
  };

  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <label className="text-sm font-medium text-slate-700">{label}</label>
        <span className="text-sm font-bold text-slate-900">{value}{unit}</span>
      </div>
      <input 
        type="range" 
        min={min} 
        max={max} 
        value={value} 
        onChange={onChange}
        className={`w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer ${colorMap[color]}`}
      />
    </div>
  );
}

