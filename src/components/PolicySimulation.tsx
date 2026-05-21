import React, { useState, useMemo, useEffect } from 'react';
import { RegionalData, PolicyScenario } from '../types';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { 
  SlidersHorizontal, ArrowRight, TrendingUp, TrendingDown, Lightbulb, 
  AlertTriangle, CheckCircle2, ShieldAlert, BookOpen, Compass, Info, Award
} from 'lucide-react';
import { 
  runFiscalSimulation, 
  estimateRegionalGDP,
  INFRASTRUCTURE_MULTIPLIER,
  SOCIAL_SPENDING_MULTIPLIER,
  TAX_INCREASE_MULTIPLIER,
  PERSONNEL_MULTIPLIER,
  TRANSFER_DEPENDENCY_MULTIPLIER,
  SimulationResult
} from '../utils/fiscalMultiplierModel';

export default function PolicySimulation({ data }: { data: RegionalData[] }) {
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

  // Update selected year if region changes
  useEffect(() => {
    if (availableYears.length > 0 && !availableYears.includes(selectedYear)) {
      setSelectedYear(availableYears[0]);
    }
  }, [availableYears, selectedYear]);

  // Update selected quarter if year or region changes
  useEffect(() => {
    if (availableQuarters.length > 0 && !availableQuarters.includes(selectedQuarter)) {
      setSelectedQuarter(availableQuarters[0]);
    } else if (availableQuarters.length === 0) {
      setSelectedQuarter('');
    }
  }, [availableQuarters, selectedQuarter]);

  const [scenario, setScenario] = useState<PolicyScenario>({
    padIncrease: 0,
    capitalExpIncrease: 0,
    personnelExpDecrease: 0,
    socialExpIncrease: 0,
    transferDecrease: 0
  });

  const [isMethodologyOpen, setIsMethodologyOpen] = useState(false);

  if (data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-slate-500 py-20">
        <SlidersHorizontal size={48} className="mb-4 text-slate-300" />
        <h3 className="text-xl font-medium text-slate-700">Tidak Ada Data Tersedia</h3>
        <p className="mt-2">Silakan unggah data fiskal daerah untuk menjalankan simulasi kebijakan.</p>
      </div>
    );
  }

  // Find baseline region record
  const regionData = regionDataAllYears.find(d => d.Year === selectedYear && (d.Quarter === selectedQuarter || (!d.Quarter && !selectedQuarter))) || regionDataAllYears.find(d => d.Year === selectedYear) || regionDataAllYears[0];

  if (!regionData) return null;

  // Run economic simulator
  const simResult: SimulationResult = runFiscalSimulation(regionData, scenario);

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>, field: keyof PolicyScenario) => {
    setScenario({ ...scenario, [field]: parseFloat(e.target.value) });
  };

  // Pre-configured policy presets (scenarios)
  const applyPreset = (presetType: string) => {
    switch (presetType) {
      case 'infrashock': // Pro-growth expansion (Capital Expenditure focus)
        setScenario({
          padIncrease: 5,
          capitalExpIncrease: 25,
          personnelExpDecrease: 10,
          socialExpIncrease: 5,
          transferDecrease: 0
        });
        break;
      case 'austerity': // Harsh economic austerity
        setScenario({
          padIncrease: 20,
          capitalExpIncrease: 0,
          personnelExpDecrease: 15,
          socialExpIncrease: 0,
          transferDecrease: 15
        });
        break;
      case 'socialcare': // Balanced social security cushion
        setScenario({
          padIncrease: 3,
          capitalExpIncrease: 5,
          personnelExpDecrease: 5,
          socialExpIncrease: 30,
          transferDecrease: 0
        });
        break;
      case 'independence': // Fiscal sovereignty focus
        setScenario({
          padIncrease: 15,
          capitalExpIncrease: 10,
          personnelExpDecrease: 8,
          socialExpIncrease: 0,
          transferDecrease: 15
        });
        break;
      default:
        setScenario({
          padIncrease: 0,
          capitalExpIncrease: 0,
          personnelExpDecrease: 0,
          socialExpIncrease: 0,
          transferDecrease: 0
        });
    }
  };

  // Interactive charting format variables
  const comparisonData = [
    {
      name: 'Pendapatan',
      Awal: simResult.baseline.revenue,
      Simulasi: simResult.simulated.revenue,
    },
    {
      name: 'Belanja',
      Awal: simResult.baseline.expenditure,
      Simulasi: simResult.simulated.expenditure,
    },
    {
      name: 'Defisit / Surplus',
      Awal: simResult.baseline.balance,
      Simulasi: simResult.simulated.balance,
    }
  ];

  const formatIDR = (num: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      notation: 'compact',
      maximumFractionDigits: 1
    }).format(num);
  };

  return (
    <div className="space-y-6">
      {/* Header Container */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <SlidersHorizontal className="text-indigo-600" size={24} />
            <h3 className="text-xl font-bold text-slate-800">Simulasi Kebijakan Makro-Fiskal</h3>
          </div>
          <p className="text-sm text-slate-500 mt-1">Sistem Pemodelan Pengganda Fiskal (Fiscal Multiplier Model) Dinamis berbasis PDRB Riil.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button 
            onClick={() => setIsMethodologyOpen(!isMethodologyOpen)}
            className="flex items-center space-x-2 px-4 py-2 border border-slate-200 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50 transition-colors"
          >
            <BookOpen size={16} />
            <span>{isMethodologyOpen ? 'Tutup Metodologi' : 'Metodologi & Parameter'}</span>
          </button>
          
          {availableQuarters.length > 0 && (
            <select 
              className="px-4 py-2 border border-slate-300 rounded-lg bg-slate-50 text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
              value={selectedQuarter}
              onChange={(e) => setSelectedQuarter(e.target.value)}
            >
              {availableQuarters.map(q => (
                <option key={q} value={q}>{q}</option>
              ))}
            </select>
          )}

          <select 
            className="px-4 py-2 border border-slate-300 rounded-lg bg-slate-50 text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
            value={selectedRegion}
            onChange={(e) => setSelectedRegion(e.target.value)}
          >
            {uniqueRegions.map(region => (
              <option key={region} value={region}>{region}</option>
            ))}
          </select>

          <select 
            className="px-4 py-2 border border-slate-300 rounded-lg bg-slate-50 text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
            value={selectedYear}
            onChange={(e) => setSelectedYear(Number(e.target.value))}
          >
            {availableYears.map(year => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Methodology and Explanations Popup/Panel */}
      {isMethodologyOpen && (
        <div className="bg-slate-900 text-slate-200 p-6 rounded-xl border border-slate-700 slide-down">
          <h4 className="text-md font-bold text-white mb-4 flex items-center space-x-2">
            <Compass className="text-indigo-400" size={18} />
            <span>Metodologi Estimasi Model: Static Partial Equilibrium Fiscal Multiplier with Structural Adjustment</span>
          </h4>
          <p className="text-sm text-slate-400 leading-relaxed max-w-5xl">
            Simulasi ini memodelkan dampak guncangan (shocks) pendapatan dan belanja daerah terhadap pertumbuhan Produk Domestik Regional Bruto (PDRB) riil berdasarkan formulasi empiris yang diadaptasi dari standard IMF & OECD untuk subnasional.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-6 pt-6 border-t border-slate-800">
            <div>
              <p className="text-xs uppercase tracking-wider font-bold text-indigo-400">1. Baseline Multipliers</p>
              <ul className="text-xs space-y-1.5 mt-2 text-slate-300">
                <li>• Infrastruktur: <span className="text-emerald-400 font-mono">+{INFRASTRUCTURE_MULTIPLIER}x</span></li>
                <li>• Proteksi Sosial: <span className="text-emerald-400 font-mono">+{SOCIAL_SPENDING_MULTIPLIER}x</span></li>
                <li>• Belanja Pegawai: <span className="text-rose-400 font-mono">{PERSONNEL_MULTIPLIER}x</span></li>
                <li>• Pajak/Levy PAD: <span className="text-rose-400 font-mono">{TAX_INCREASE_MULTIPLIER}x</span></li>
                <li>• Variasi Transfer: <span className="text-rose-400 font-mono">{TRANSFER_DEPENDENCY_MULTIPLIER}x</span></li>
              </ul>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wider font-bold text-indigo-400">2. Lag Efisiensi Transmisi</p>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                Kebijakan belanja modal membutuhkan rantai konstruksi panjang (<span className="text-slate-200">Lag 35% di tahun dasar</span>) sementara dana bantuan sosial langsung dibelanjakan masyarakat lokal (<span className="text-slate-200">Lag 85% langsung berputar</span>).
              </p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wider font-bold text-indigo-400">3. Struktur Kebocoran Daerah</p>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                Sebagian dana melorot keluar karena impor bahan konstruksi dari luar wilayah (<span className="text-slate-200">Leakage Index</span>). Kabupaten kecil memiliki resistensi multiplier lebih rendah dibanding kota besar.
              </p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wider font-bold text-indigo-400">4. Penalti Tekanan Fiskal</p>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                Jika tingkat defisit melebihi ambang batas risiko (<span className="text-slate-200">MAX 5% PDRB</span>), nilai multiplier dipotong secara otomatis untuk meniru crowding-out pinjaman daerah.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Main Grid View */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Side: Controls & Scenario Presets (Col 4) */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h4 className="text-md font-bold text-slate-800">Instrumen Skenario</h4>
              <button 
                onClick={() => applyPreset('custom')}
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition-colors"
              >
                Reset Sliders
              </button>
            </div>
            
            {/* Quick Presets Section */}
            <div className="space-y-2">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Simulasi Skenario Presets</span>
              <div className="grid grid-cols-2 gap-2">
                <button 
                  onClick={() => applyPreset('infrashock')}
                  className="px-3 py-2 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-lg text-xs font-bold hover:bg-emerald-100/70 transition-colors"
                >
                  Pro-Infrastruktur
                </button>
                <button 
                  onClick={() => applyPreset('socialcare')}
                  className="px-3 py-2 bg-amber-50 text-amber-700 border border-amber-100 rounded-lg text-xs font-bold hover:bg-amber-100/70 transition-colors"
                >
                  Proteksi Sosial
                </button>
                <button 
                  onClick={() => applyPreset('independence')}
                  className="px-3 py-2 bg-indigo-50 text-indigo-700 border border-indigo-100 rounded-lg text-xs font-bold hover:bg-indigo-100/70 transition-colors"
                >
                  Ekspansi PAD
                </button>
                <button 
                  onClick={() => applyPreset('austerity')}
                  className="px-3 py-2 bg-rose-50 text-rose-700 border border-rose-100 rounded-lg text-xs font-bold hover:bg-rose-100/70 transition-colors"
                >
                  Austeritas Ketat
                </button>
              </div>
            </div>

            <div className="space-y-5 pt-3 border-t border-slate-100">
              <SliderControl 
                label="Peningkatan Tarif PAD (Retribusi/Pajak)" 
                value={scenario.padIncrease} 
                onChange={(e) => handleSliderChange(e, 'padIncrease')} 
                min={0} max={50} unit="%" 
                color="indigo"
              />
              <SliderControl 
                label="Tambahan Belanja Pembangunan (Capital)" 
                value={scenario.capitalExpIncrease} 
                onChange={(e) => handleSliderChange(e, 'capitalExpIncrease')} 
                min={0} max={50} unit="%" 
                color="emerald"
              />
              <SliderControl 
                label="Pengurangan Belanja Pegawai (Efisiensi)" 
                value={scenario.personnelExpDecrease} 
                onChange={(e) => handleSliderChange(e, 'personnelExpDecrease')} 
                min={0} max={30} unit="%" 
                color="rose"
              />
              <SliderControl 
                label="Tambahan Bantuan Sosial Mandiri" 
                value={scenario.socialExpIncrease} 
                onChange={(e) => handleSliderChange(e, 'socialExpIncrease')} 
                min={0} max={50} unit="%" 
                color="amber"
              />
              <SliderControl 
                label="Pengurangan Dana Alokasi Pusat" 
                value={scenario.transferDecrease} 
                onChange={(e) => handleSliderChange(e, 'transferDecrease')} 
                min={0} max={30} unit="%" 
                color="blue"
              />
            </div>
          </div>

          {/* Regional Context Metrics Diagnostic Card */}
          <div className="bg-slate-50 p-5 rounded-xl border border-slate-200 space-y-4">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center space-x-1">
              <Info size={14} />
              <span>Karakteristik Struktural Daerah ({regionData.Region})</span>
            </h4>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white p-3 rounded-lg border border-slate-200">
                <span className="text-[10px] text-slate-400 block font-medium">Estimasi PDRB Riil:</span>
                <span className="text-sm font-mono font-bold text-slate-800">{formatIDR(simResult.metrics.regionalGDP)}</span>
              </div>
              <div className="bg-white p-3 rounded-lg border border-slate-200">
                <span className="text-[10px] text-slate-400 block font-medium">Koefisien Efisiensi:</span>
                <span className="text-sm font-mono font-bold text-indigo-600">{(simResult.metrics.spendingEfficiency * 100).toFixed(0)}%</span>
              </div>
              <div className="bg-white p-3 rounded-lg border border-slate-200">
                <span className="text-[10px] text-slate-400 block font-medium">Regional Leakage:</span>
                <span className="text-sm font-mono font-bold text-rose-600">{(simResult.metrics.regionalLeakage * 100).toFixed(0)}%</span>
              </div>
              <div className="bg-white p-3 rounded-lg border border-slate-200">
                <span className="text-[10px] text-slate-400 block font-medium">Ketergantungan Transfer:</span>
                <span className="text-sm font-mono font-bold text-indigo-600">{(simResult.metrics.fiscalDependence * 100).toFixed(0)}%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Simulation Analytical Outputs (Col 8) */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Main Headline Indicators */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Impact 1: GDP Economic Growth */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex flex-col justify-between">
              <div>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Proyeksi Pertumbuhan Riil</span>
                <div className="flex items-center space-x-1.5 mt-2">
                  <span className="text-sm font-semibold text-slate-400">Baseline:</span>
                  <span className="text-sm font-medium text-slate-700">{simResult.baseline.gdpGrowth.toFixed(2)}%</span>
                </div>
              </div>
              <div className="mt-4 flex items-end justify-between">
                <div>
                  <span className="text-[10px] font-semibold text-indigo-500 block uppercase">Simulasi Model</span>
                  <div className="flex items-baseline space-x-1">
                    <p className={`text-3xl font-extrabold ${simResult.simulated.gdpGrowth > simResult.baseline.gdpGrowth ? 'text-emerald-600' : simResult.simulated.gdpGrowth < simResult.baseline.gdpGrowth ? 'text-rose-600' : 'text-slate-800'}`}>
                      {simResult.simulated.gdpGrowth.toFixed(2)}%
                    </p>
                    <span className="text-xs text-slate-400">yoy</span>
                  </div>
                </div>
                {simResult.simulated.gdpGrowth !== simResult.baseline.gdpGrowth && (
                  <div className={`p-1.5 rounded-full ${simResult.simulated.gdpGrowth > simResult.baseline.gdpGrowth ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                    {simResult.simulated.gdpGrowth > simResult.baseline.gdpGrowth ? <TrendingUp size={20} /> : <TrendingDown size={20} />}
                  </div>
                )}
              </div>
              <div className="mt-2 pt-2 border-t border-slate-100">
                <span className="text-[10px] text-slate-400 block">
                  Net Impact: <span className={simResult.simulated.gdpGrowth >= simResult.baseline.gdpGrowth ? 'text-emerald-600 font-bold' : 'text-rose-600 font-bold'}>{(simResult.simulated.gdpGrowth - simResult.baseline.gdpGrowth).toFixed(2)}%</span>
                </span>
              </div>
            </div>

            {/* Impact 2: Fiscal Balance & Deficit Scale */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex flex-col justify-between">
              <div>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Keseimbangan Anggaran</span>
                <div className="flex items-center space-x-1.5 mt-2">
                  <span className="text-sm font-semibold text-slate-400">Awal:</span>
                  <span className="text-sm font-medium text-slate-700">{formatIDR(simResult.baseline.balance)}</span>
                </div>
              </div>
              <div className="mt-4 flex items-end justify-between">
                <div>
                  <span className="text-[10px] font-semibold text-indigo-500 block uppercase">Simulasi Saldo</span>
                  <p className={`text-xl font-extrabold ${simResult.simulated.balance >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                    {formatIDR(simResult.simulated.balance)}
                  </p>
                </div>
                {simResult.simulated.balance > simResult.baseline.balance ? (
                  <span className="text-xs text-emerald-600 font-bold bg-emerald-50 px-2 py-1 rounded">Perbaikan</span>
                ) : simResult.simulated.balance < simResult.baseline.balance ? (
                  <span className="text-xs text-rose-600 font-bold bg-rose-50 px-2 py-1 rounded">Pelebaran</span>
                ) : null}
              </div>
              <div className="mt-2 pt-2 border-t border-slate-100 flex justify-between text-[10px] text-slate-400">
                <span>Rasio Defisit/PDRB:</span>
                <span className={`font-mono font-bold ${simResult.simulated.deficitRatio > 0.05 ? 'text-rose-600' : 'text-slate-700'}`}>{(simResult.simulated.deficitRatio * 100).toFixed(2)}%</span>
              </div>
            </div>

            {/* Impact 3: Risk Assessment Index */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex flex-col justify-between">
              <div>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Indeks Risiko Skenario</span>
                <div className="mt-3 flex items-baseline justify-between">
                  <span className={`text-2xl font-extrabold ${simResult.riskScore > 75 ? 'text-rose-600' : simResult.riskScore > 50 ? 'text-amber-500' : 'text-emerald-600'}`}>
                    {simResult.riskScore.toFixed(0)}
                  </span>
                  <span className={`text-xs px-2.5 py-1 rounded-full font-bold ${
                    simResult.riskCategory === 'Kritis' ? 'bg-rose-100 text-rose-800' :
                    simResult.riskCategory === 'Tinggi' ? 'bg-amber-100 text-amber-800' :
                    simResult.riskCategory === 'Sedang' ? 'bg-blue-100 text-blue-800' : 'bg-emerald-100 text-emerald-800'
                  }`}>
                    {simResult.riskCategory}
                  </span>
                </div>
              </div>
              <div className="space-y-1.5 mt-2">
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div 
                    className={`h-full rounded-full ${
                      simResult.riskScore > 75 ? 'bg-rose-500' : simResult.riskScore > 50 ? 'bg-amber-500' : 'bg-emerald-500'
                    }`}
                    style={{ width: `${simResult.riskScore}%` }}
                  />
                </div>
                <p className="text-[9px] text-slate-400 block leading-tight">Diuji berdasarkan defisit maksimum, guncangan sirkulasi, dan margin likuiditas.</p>
              </div>
            </div>

          </div>

          {/* Validation Risk Warnings List Panel (If Any) */}
          {simResult.warnings.length > 0 && (
            <div className="bg-white p-5 rounded-xl border border-rose-100 shadow-sm space-y-3">
              <h4 className="text-sm font-extrabold text-slate-800 flex items-center space-x-2">
                <ShieldAlert className="text-rose-600" size={18} />
                <span>Peringatan Kelayakan Makro-Fiskal ({simResult.warnings.length})</span>
              </h4>
              <div className="space-y-2">
                {simResult.warnings.map((w, idx) => (
                  <div key={idx} className={`p-3 rounded-lg flex items-start space-x-3 text-xs leading-relaxed ${
                    w.type === 'critical' ? 'bg-rose-50 text-rose-800 border-l-4 border-rose-600' :
                    w.type === 'warning' ? 'bg-amber-50 text-amber-800 border-l-4 border-amber-500' : 'bg-blue-50 text-blue-800 border-l-4 border-blue-500'
                  }`}>
                    <AlertTriangle className="flex-shrink-0 mt-0.5" size={16} />
                    <div>
                      <h5 className="font-bold">{w.title}</h5>
                      <p className="mt-0.5 text-[11px] opacity-90">{w.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Narrative & Multiplier Shock Impact Breakdown Panel */}
          <div className="bg-indigo-50/80 p-6 rounded-xl border border-indigo-100 shadow-sm">
            <div className="flex items-center space-x-2 mb-4 border-b border-indigo-100 pb-2">
              <Lightbulb className="text-indigo-600" size={24} />
              <h3 className="text-md font-bold text-indigo-900">Pembongkaran Efek Pengganda (Multiplier Impact Breakdown)</h3>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-4">
              <ImpactBadge label="Belanja Modal" impact={simResult.impactBreakdown.capitalImpact} />
              <ImpactBadge label="Belanja Sosial" impact={simResult.impactBreakdown.socialImpact} />
              <ImpactBadge label="Administrasi Pegawai" impact={simResult.impactBreakdown.personnelImpact} />
              <ImpactBadge label="Instrik Pajak/PAD" impact={simResult.impactBreakdown.taxImpact} />
              <ImpactBadge label="Dana Pusat" impact={simResult.impactBreakdown.transferImpact} />
            </div>

            <p className="text-xs text-slate-700 leading-relaxed bg-white p-3.5 rounded-lg border border-slate-100">
              Pertumbuhan riil disimulasikan dari baseline <span className="font-bold">{simResult.baseline.gdpGrowth.toFixed(2)}%</span> bergeser sebesar <span className={`font-bold ${simResult.simulated.gdpGrowth >= simResult.baseline.gdpGrowth ? 'text-emerald-600' : 'text-rose-600'}`}>{(simResult.simulated.gdpGrowth - simResult.baseline.gdpGrowth).toFixed(2)}%</span> menuju <span className="font-bold">{simResult.simulated.gdpGrowth.toFixed(2)}%</span>. Model ini memperhitungkan <span className="font-semibold text-indigo-600">Lag Transmisi</span> dan kebocoran ekonomi wilayah (<span className="font-semibold">Regional Leakage</span>).
            </p>
          </div>

          {/* Budget Comparison Bar Chart */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-md font-bold text-slate-800">Visualisasi Perbandingan Anggaran</h3>
              <span className="text-xs text-slate-400">Dalam juta/miliar Rupiah (IDR)</span>
            </div>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={comparisonData} margin={{ top: 20, right: 30, left: 10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="name" stroke="#64748b" fontSize={12} />
                  <YAxis tickFormatter={(val) => formatIDR(val).replace('Rp', '')} stroke="#64748b" fontSize={11} />
                  <Tooltip formatter={(value: number) => formatIDR(value)} />
                  <Legend />
                  <Bar dataKey="Awal" fill="#94a3b8" radius={[4, 4, 0, 0]} barSize={40} />
                  <Bar dataKey="Simulasi" fill="#4f46e5" radius={[4, 4, 0, 0]} barSize={40} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* AI Advisor Recommendations ( IMF / OECD standards ) */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 space-y-4">
            <h3 className="text-md font-bold text-slate-800 flex items-center space-x-2 border-b border-slate-100 pb-3">
              <Award className="text-indigo-600" size={18} />
              <span>Rekomendasi Kebijakan Penyeimbang (Macro-Fiscal Consultations)</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {simResult.recommendations.map((rec, ind) => (
                <div key={ind} className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between">
                      <span className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${
                        rec.priority === 'high' ? 'bg-rose-100 text-rose-800' :
                        rec.priority === 'medium' ? 'bg-amber-100 text-amber-800' : 'bg-slate-200 text-slate-700'
                      }`}>
                        Prioritas {rec.priority}
                      </span>
                    </div>
                    <h4 className="text-xs font-bold text-slate-800 mt-2 uppercase">{rec.title}</h4>
                    <p className="text-xs text-slate-600 leading-tight mt-1">{rec.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}

// Subordinate micro-components for structural readability
function ImpactBadge({ label, impact }: { label: string, impact: number }) {
  const isPositive = impact >= 0;
  return (
    <div className="bg-white p-2.5 rounded-lg border border-slate-200 flex flex-col justify-between text-center shadow-xs">
      <span className="text-[9px] font-semibold text-slate-500 truncate leading-none">{label}</span>
      <span className={`text-xs mt-1.5 font-bold font-mono ${isPositive ? 'text-emerald-600' : 'text-rose-600'}`}>
        {isPositive ? '+' : ''}{impact.toFixed(3)}%
      </span>
    </div>
  );
}

function SliderControl({ label, value, onChange, min, max, unit, color }: any) {
  const colorMap: Record<string, string> = {
    indigo: 'accent-indigo-600',
    emerald: 'accent-emerald-600',
    rose: 'accent-rose-600',
    amber: 'accent-amber-500',
    blue: 'accent-blue-600',
  };

  return (
    <div className="space-y-1.5">
      <div className="flex justify-between items-center text-xs">
        <label className="font-semibold text-slate-700">{label}</label>
        <span className="font-bold text-slate-900 border border-slate-200 rounded px-1.5 py-0.5 bg-slate-50">{value}{unit}</span>
      </div>
      <input 
        type="range" 
        min={min} 
        max={max} 
        value={value} 
        onChange={onChange}
        className={`w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer ${colorMap[color]}`}
      />
    </div>
  );
}
