import React, { useState, useMemo, useEffect, useRef } from 'react';
import { RegionalData, PolicyScenario, CustomScenario } from '../types';
import ReactMarkdown from 'react-markdown';
import jsPDF from 'jspdf';
import * as htmlToImage from 'html-to-image';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { 
  SlidersHorizontal, ArrowRight, TrendingUp, TrendingDown, Lightbulb, 
  AlertTriangle, CheckCircle2, ShieldAlert, BookOpen, Compass, Info, Award, HelpCircle, X,
  Save, Cloud, Loader2, Sparkles, FileText, Scale, Coins, Activity
} from 'lucide-react';
import { 
  runFiscalSimulation, 
  estimateRegionalGDP,
  INFRASTRUCTURE_MULTIPLIER,
  SOCIAL_SPENDING_MULTIPLIER,
  TAX_INCREASE_MULTIPLIER,
  PERSONNEL_MULTIPLIER,
  TRANSFER_DEPENDENCY_MULTIPLIER,
  SimulationResult,
  MAX_DEFICIT_RATIO
} from '../utils/fiscalMultiplierModel';
import { saveCustomScenarioToSheets } from '../services/googleSheets';

export default function PolicySimulation({ 
  data, 
  initialPreset, 
  onClearPreset,
  user,
  onLogin
}: { 
  data: RegionalData[], 
  initialPreset?: string | CustomScenario | null, 
  onClearPreset?: () => void,
  user?: any,
  onLogin?: () => void
}) {
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
    } else if (availableQuarters.length === 0 && selectedQuarter !== '') {
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
  const [isStructModalOpen, setIsStructModalOpen] = useState(false);

  // AI-Powered Policy Brief States
  const [generatedBrief, setGeneratedBrief] = useState<string | null>(null);
  const [isBriefLoading, setIsBriefLoading] = useState<boolean>(false);
  const [briefError, setBriefError] = useState<string | null>(null);

  const handleGenerateBrief = async () => {
    setIsBriefLoading(true);
    setBriefError(null);
    setGeneratedBrief(null);
    try {
      const response = await fetch("/api/gemini/generate-brief", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          regionData,
          scenario,
          simResult,
        }),
      });
      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || `Server responded with status ${response.status}`);
      }
      const data = await response.json();
      setGeneratedBrief(data.brief);
    } catch (error: any) {
      console.error("Gagal mendapatkan AI Policy Brief:", error);
      setBriefError(error.message || "Gagal menghubungi model AI atau server.");
    } finally {
      setIsBriefLoading(false);
    }
  };

  // AI-Powered Policy Brief States & Handlers
  const briefPdfRef = useRef<HTMLDivElement>(null);
  const [isBriefPdfDownloading, setIsBriefPdfDownloading] = useState(false);

  const [copied, setCopied] = useState(false);
  const handleCopyBrief = () => {
    if (!generatedBrief) return;
    navigator.clipboard.writeText(generatedBrief);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadBrief = async () => {
    if (!briefPdfRef.current || !generatedBrief) return;
    setIsBriefPdfDownloading(true);
    try {
      const dataUrl = await htmlToImage.toPng(briefPdfRef.current, { 
        quality: 1.0,
        pixelRatio: 2,
        backgroundColor: '#ffffff'
      });

      const a4Width = 210;
      const a4Height = 297;
      const marginX = 15; // 1.5 cm margin kiri/kanan
      const marginTop = 15; // 1.5 cm margin atas
      const marginBottom = 15; // 1.5 cm margin bawah

      const printableWidth = a4Width - (marginX * 2); // 180 mm
      const printableHeight = a4Height - marginTop - marginBottom; // 267 mm

      const container = briefPdfRef.current;
      const pdfHeight = (container.offsetHeight * printableWidth) / container.offsetWidth;
      const scale = printableWidth / container.offsetWidth; // mm height per element pixel
      const printableHeightPx = printableHeight / scale; // Max pixels height per PDF page

      // Collect all child elements inside container to find optimal page splitting lines
      const directChildren = Array.from(container.children) as HTMLElement[];
      const blocks: { top: number; height: number; el: HTMLElement }[] = [];
      const containerRect = container.getBoundingClientRect();

      directChildren.forEach((child) => {
        if (child.classList.contains('markdown-body')) {
          const mdChildren = Array.from(child.children) as HTMLElement[];
          mdChildren.forEach((mdChild) => {
            const rect = mdChild.getBoundingClientRect();
            const height = rect.height;
            if (height > 0) {
              blocks.push({
                top: rect.top - containerRect.top,
                height,
                el: mdChild
              });
            }
          });
        } else {
          const rect = child.getBoundingClientRect();
          const height = rect.height;
          if (height > 0) {
            blocks.push({
              top: rect.top - containerRect.top,
              height,
              el: child
            });
          }
        }
      });

      // Sort blocks sequentially by their top offset
      blocks.sort((a, b) => a.top - b.top);

      // Distribute blocks into pages
      const pages: { startY: number; endY: number }[] = [];
      
      if (blocks.length > 0) {
        let currentPageStart = 0;
        let pageStartIndex = 0;

        for (let i = 0; i < blocks.length; i++) {
          const block = blocks[i];
          const blockEnd = block.top + block.height;

          if (i === pageStartIndex) {
            continue;
          }

          if (blockEnd - currentPageStart > printableHeightPx) {
            // Split before this block to prevent it from getting cut off
            pages.push({
              startY: currentPageStart,
              endY: block.top
            });
            currentPageStart = block.top;
            pageStartIndex = i;
          }
        }

        if (currentPageStart < container.offsetHeight) {
          pages.push({
            startY: currentPageStart,
            endY: container.offsetHeight
          });
        }
      } else {
        // Fallback to simple continuous pagination if no child blocks found
        let heightLeft = pdfHeight;
        let index = 0;
        while (heightLeft > 0) {
          pages.push({
            startY: index * printableHeightPx,
            endY: (index + 1) * printableHeightPx
          });
          heightLeft -= printableHeight;
          index++;
        }
      }

      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      for (let p = 0; p < pages.length; p++) {
        if (p > 0) {
          pdf.addPage();
        }

        const { startY, endY } = pages[p];
        
        // Position full screenshot image so that startY maps to the top margin
        const position = marginTop - (startY * scale);
        pdf.addImage(dataUrl, 'PNG', marginX, position, printableWidth, pdfHeight);

        // Render borders/masks for clear 1.5cm margins
        pdf.setFillColor(255, 255, 255);
        // Top Mask
        pdf.rect(0, 0, a4Width, marginTop, 'F');
        // Bottom Mask
        pdf.rect(0, a4Height - marginBottom, a4Width, marginBottom, 'F');
        // Left Mask
        pdf.rect(0, 0, marginX, a4Height, 'F');
        // Right Mask
        pdf.rect(a4Width - marginX, 0, marginX, a4Height, 'F');
      }

      pdf.save(`AI_Nota_Kebijakan_${regionData.Region}_${regionData.Year}.pdf`);
    } catch (error) {
      console.error('Gagal mengekspor PDF policy brief:', error);
    } finally {
      setIsBriefPdfDownloading(false);
    }
  };

  // States for saving custom scenario to Google Sheets
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  const [saveTitle, setSaveTitle] = useState('');
  const [saveDescription, setSaveDescription] = useState('');
  const [isSavingScenario, setIsSavingScenario] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  const handleSaveScenario = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!saveTitle.trim()) {
      setSaveMessage({ type: 'error', text: 'Judul skenario wajib diisi.' });
      return;
    }
    
    setIsSavingScenario(true);
    setSaveMessage(null);
    try {
      const success = await saveCustomScenarioToSheets({
        title: saveTitle,
        description: saveDescription || 'Skenario kustom buatan pengguna',
        region: selectedRegion,
        year: selectedYear,
        quarter: selectedQuarter,
        padIncrease: scenario.padIncrease,
        capitalExpIncrease: scenario.capitalExpIncrease,
        personnelExpDecrease: scenario.personnelExpDecrease,
        socialExpIncrease: scenario.socialExpIncrease,
        transferDecrease: scenario.transferDecrease,
      });

      if (success) {
        setSaveMessage({ type: 'success', text: 'Skenario berhasil disimpan ke Google Sheets!' });
        setSaveTitle('');
        setSaveDescription('');
        setTimeout(() => {
          setIsSaveModalOpen(false);
          setSaveMessage(null);
        }, 2200);
      } else {
        setSaveMessage({ type: 'error', text: 'Gagal menyimpan ke Google Sheets secara langsung. Pastikan Anda sudah terhubung.' });
      }
    } catch (err) {
      console.error('Error saving scenario:', err);
      setSaveMessage({ type: 'error', text: 'Terjadi kesalahan sistem saat menyimpan.' });
    } finally {
      setIsSavingScenario(false);
    }
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
      case 'efficiency': // Reformasi Birokrasi (Efisiensi)
        setScenario({
          padIncrease: 0,
          capitalExpIncrease: 15,
          personnelExpDecrease: 15,
          socialExpIncrease: 0,
          transferDecrease: 0
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

  // Apply initial preset if passed from Scenario Library
  useEffect(() => {
    if (initialPreset) {
      if (typeof initialPreset === 'string') {
        applyPreset(initialPreset);
      } else {
        // It's a CustomScenario from Google Sheets
        setScenario({
          padIncrease: initialPreset.padIncrease,
          capitalExpIncrease: initialPreset.capitalExpIncrease,
          personnelExpDecrease: initialPreset.personnelExpDecrease,
          socialExpIncrease: initialPreset.socialExpIncrease,
          transferDecrease: initialPreset.transferDecrease
        });
        
        // Auto-select the region and year matching the scenario
        if (initialPreset.region && uniqueRegions.includes(initialPreset.region)) {
          setSelectedRegion(initialPreset.region);
        }
        if (initialPreset.year) {
          setSelectedYear(initialPreset.year);
        }
        if (initialPreset.quarter) {
          setSelectedQuarter(initialPreset.quarter);
        }
      }
      if (onClearPreset) {
        onClearPreset();
      }
    }
  }, [initialPreset, onClearPreset, uniqueRegions]);

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

  const baselineRiskScore = useMemo(() => {
    if (!regionData) return 15;
    const gdp = estimateRegionalGDP(regionData);
    const baseBalance = regionData.Fiscal_Balance;
    const baseDeficitRatio = baseBalance < 0 ? Math.abs(baseBalance) / gdp : 0;
    const stressBase = regionData.Fiscal_Stress_Score || 0;
    const score = 15 + (baseDeficitRatio * 100) * 10 + stressBase * 0.3;
    return Math.min(100, Math.max(0, score));
  }, [regionData]);

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>, field: keyof PolicyScenario) => {
    setScenario({ ...scenario, [field]: parseFloat(e.target.value) });
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
      {/* Symmetrical Top Bar / Control Card matching the reference dashboard */}
      <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-[0_8px_30px_rgb(0,0,0,0.01)] flex flex-col lg:flex-row justify-between lg:items-center gap-4">
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <span className="p-1 px-2.5 bg-indigo-50 text-indigo-700 rounded-full font-bold text-[10px] tracking-widest uppercase">
              STRUKTURAL SIMULATOR
            </span>
          </div>
          <h2 className="text-xl font-black text-slate-800 tracking-tight flex items-center gap-2">
            Simulasi Kebijakan Makro-Fiskal
          </h2>
          <p className="text-xs text-slate-400 font-medium">Sistem Pemodelan Pengganda Fiskal (Fiscal Multiplier Model) Dinamis berbasis PDRB Riil.</p>
        </div>
        
        {/* Dynamic Period Dropdowns */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button 
            type="button"
            onClick={() => setIsMethodologyOpen(!isMethodologyOpen)}
            className="flex items-center gap-1.5 px-3 py-2 border border-slate-200 rounded-xl bg-white hover:bg-slate-50 text-slate-600 transition-all text-xs font-bold shadow-sm"
          >
            <BookOpen size={14} className="text-slate-400" />
            <span>{isMethodologyOpen ? 'Sembunyikan' : 'Pedoman Model'}</span>
          </button>

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
            </div>
          )}

          {/* Region selector */}
          <div className="relative">
            <select 
              className="appearance-none pl-3 pr-8 py-2 border border-slate-200 rounded-xl bg-slate-50 hover:bg-slate-100/50 text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs font-semibold"
              value={selectedRegion}
              onChange={(e) => setSelectedRegion(e.target.value)}
            >
              {uniqueRegions.map(region => (
                <option key={region} value={region}>{region}</option>
              ))}
            </select>
          </div>

          {/* Year selector */}
          <div className="relative">
            <select 
              className="appearance-none pl-3 pr-8 py-2 border border-slate-200 rounded-xl bg-slate-50 hover:bg-slate-100/50 text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs font-semibold"
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
            >
              {availableYears.map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Methodology Panel is beautifully absolute or collapsable right under */}
      {isMethodologyOpen && (
        <div className="bg-slate-900 text-slate-200 p-6 rounded-3xl border border-slate-800 transition-all duration-300 shadow-xl space-y-4">
          <h4 className="text-sm font-black text-white flex items-center gap-1.5 border-b border-slate-800 pb-3">
            <Compass className="text-indigo-400" size={16} />
            <span>Static Partial Equilibrium Fiscal Multiplier with Structural Adjustment</span>
          </h4>
          <p className="text-xs text-slate-400 leading-relaxed max-w-5xl">
            Simulasi ini memodelkan dampak guncangan (shocks) pendapatan dan belanja daerah terhadap pertumbuhan Produk Domestik Regional Bruto (PDRB) riil berdasarkan formulasi empiris yang diadaptasi dari standard IMF & OECD untuk subnasional.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-6 pt-4 text-xs">
            <div>
              <p className="text-[10px] uppercase tracking-wider font-black text-indigo-400">1. Baseline Multipliers</p>
              <ul className="text-[11px] space-y-1.5 mt-2 text-slate-300 font-semibold">
                <li>• Infrastruktur: <span className="text-emerald-400 font-mono">+{INFRASTRUCTURE_MULTIPLIER}x</span></li>
                <li>• Proteksi Sosial: <span className="text-emerald-400 font-mono">+{SOCIAL_SPENDING_MULTIPLIER}x</span></li>
                <li>• Belanja Pegawai: <span className="text-rose-400 font-mono">{PERSONNEL_MULTIPLIER}x</span></li>
                <li>• Pajak/Levy PAD: <span className="text-rose-400 font-mono">{TAX_INCREASE_MULTIPLIER}x</span></li>
                <li>• Variasi Transfer: <span className="text-rose-400 font-mono">{TRANSFER_DEPENDENCY_MULTIPLIER}x</span></li>
              </ul>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wider font-black text-indigo-400">2. Lag Efisiensi Transmisi</p>
              <p className="text-[11px] text-slate-450 text-slate-400 mt-2 leading-relaxed">
                Kebijakan belanja modal membutuhkan rantai konstruksi panjang (<span className="text-slate-200">Lag 35% di tahun dasar</span>) sementara dana bantuan sosial langsung dibelanjakan masyarakat lokal (<span className="text-slate-200">Lag 85% langsung berputar</span>).
              </p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wider font-black text-indigo-400">3. Struktur Kebocoran Daerah</p>
              <p className="text-[11px] text-slate-450 text-slate-400 mt-2 leading-relaxed">
                Sebagian dana melorot keluar karena impor bahan konstruksi dari luar wilayah (<span className="text-slate-200">Leakage Index</span>). Kabupaten kecil memiliki resistensi multiplier lebih rendah dibanding kota besar.
              </p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wider font-black text-indigo-400">4. Penalti Tekanan Fiskal</p>
              <p className="text-[11px] text-slate-450 text-slate-400 mt-2 leading-relaxed">
                Jika tingkat defisit melebihi ambang batas risiko (<span className="text-slate-200">MAX 3% PDRB</span>), nilai multiplier dipotong secara otomatis untuk meniru crowding-out pinjaman daerah.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Bento-style KPI cards with segmented progress lines on top exactly like the requested Warehouse Inventory dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* KPI 1: Proyeksi Pertumbuhan Riil */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200/60 shadow-[0_4px_24px_rgb(0,0,0,0.01)] flex flex-col justify-between hover:shadow-[0_8px_30px_rgb(0,0,0,0.03)] transition-all duration-300">
          <div>
            <div className="flex items-center justify-between text-xs font-semibold text-slate-400 mb-2">
              <span className="flex items-center gap-1.5">
                <Activity size={14} className="text-indigo-500 animate-pulse" />
                <span>Proyeksi Pertumbuhan PDRB</span>
              </span>
              <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-600">
                Weekly Model
              </span>
            </div>
            
            <h4 className={`text-3xl font-black tracking-tight mb-1 ${
              simResult.simulated.gdpGrowth > simResult.baseline.gdpGrowth ? 'text-emerald-600' :
              simResult.simulated.gdpGrowth < simResult.baseline.gdpGrowth ? 'text-rose-600' :
              'text-slate-800'
            }`}>
              {simResult.simulated.gdpGrowth.toFixed(2)}%
            </h4>
            
            <div className={`flex items-center text-[10px] font-bold gap-1 mt-0.5 ${
              simResult.simulated.gdpGrowth >= simResult.baseline.gdpGrowth ? 'text-emerald-600' : 'text-rose-600'
            }`}>
              <span>{simResult.simulated.gdpGrowth >= simResult.baseline.gdpGrowth ? '↑' : '↓'} {(simResult.simulated.gdpGrowth - simResult.baseline.gdpGrowth).toFixed(2)}% Pergeseran Efek</span>
              <span className="text-slate-400 font-normal">vs Baseline</span>
            </div>
          </div>

          <div className="mt-4">
            {/* Segmented multiple-colored indicator bar mimicking the reference image */}
            <div className="flex gap-1.5 h-1.5 w-full my-3.5">
              <div className="h-full bg-blue-500 rounded-l-full" style={{ width: '45%' }} />
              <div className="h-full bg-orange-500" style={{ width: '25%' }} />
              <div className="h-full bg-emerald-500" style={{ width: '20%' }} />
              <div className="h-full bg-purple-500 rounded-r-full" style={{ width: '10%' }} />
            </div>

            {/* Detailed metadata list under card resembling the reference image (Electronics/Apparel/Raw Materials) */}
            <div className="space-y-2 border-t border-slate-50 pt-3 text-[11px] text-slate-500 font-bold">
              <div className="flex justify-between items-center">
                <span className="flex items-center text-slate-705">
                  <span className="w-2 h-2 rounded-full bg-blue-500 mr-2" />
                  <span>Pertumbuhan Dasar</span>
                </span>
                <span className="font-mono text-slate-700">{simResult.baseline.gdpGrowth.toFixed(2)}%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="flex items-center text-slate-705">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 mr-2" />
                  <span>Suhu Multiplier Netto</span>
                </span>
                <span className="font-mono text-slate-700">+{(simResult.simulated.gdpGrowth - simResult.baseline.gdpGrowth).toFixed(2)}% yoy</span>
              </div>
            </div>
          </div>
        </div>

        {/* KPI 2: Keseimbangan Anggaran APBD */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200/60 shadow-[0_4px_24px_rgb(0,0,0,0.01)] flex flex-col justify-between hover:shadow-[0_8px_30px_rgb(0,0,0,0.03)] transition-all duration-300">
          <div>
            <div className="flex items-center justify-between text-xs font-semibold text-slate-400 mb-2">
              <span className="flex items-center gap-1.5">
                <Coins size={14} className="text-orange-500" />
                <span>Keseimbangan Anggaran</span>
              </span>
              <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-md bg-orange-50 text-orange-600">
                Weekly Model
              </span>
            </div>
            
            <h4 className={`text-3xl font-black tracking-tight mb-1 ${
              simResult.simulated.balance > simResult.baseline.balance ? 'text-emerald-600' :
              simResult.simulated.balance < simResult.baseline.balance ? 'text-rose-600' :
              'text-slate-800'
            }`}>
              {formatIDR(simResult.simulated.balance)}
            </h4>
            
            <div className="flex items-center text-[10px] text-orange-600 font-bold gap-1 mt-0.5">
              <span>Defisit Rasio: {(simResult.simulated.deficitRatio * 100).toFixed(2)}% dari PDRB</span>
            </div>
          </div>

          <div className="mt-4">
            {/* Segmented multiple-colored indicator bar mimicking the reference image */}
            <div className="flex gap-1.5 h-1.5 w-full my-3.5">
              <div className="h-full bg-blue-500 rounded-l-full" style={{ width: '55%' }} />
              <div className="h-full bg-orange-500" style={{ width: '20%' }} />
              <div className="h-full bg-emerald-500" style={{ width: '15%' }} />
              <div className="h-full bg-purple-500 rounded-r-full" style={{ width: '10%' }} />
            </div>

            {/* Detailed metadata list under card */}
            <div className="space-y-2 border-t border-slate-50 pt-3 text-[11px] text-slate-500 font-bold">
              <div className="flex justify-between items-center">
                <span className="flex items-center text-slate-705">
                  <span className="w-2 h-2 rounded-full bg-blue-500 mr-2" />
                  <span>Total Belanja</span>
                </span>
                <span className="font-mono text-slate-700">{formatIDR(simResult.simulated.expenditure)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="flex items-center text-slate-705">
                  <span className="w-2 h-2 rounded-full bg-purple-500 mr-2" />
                  <span>Keseimbangan Baseline</span>
                </span>
                <span className="font-mono text-slate-700">{formatIDR(simResult.baseline.balance)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* KPI 3: Indeks Risiko Skenario */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200/60 shadow-[0_4px_24px_rgb(0,0,0,0.01)] flex flex-col justify-between hover:shadow-[0_8px_30px_rgb(0,0,0,0.03)] transition-all duration-300">
          <div>
            <div className="flex items-center justify-between text-xs font-semibold text-slate-400 mb-2">
              <span className="flex items-center gap-1.5">
                <ShieldAlert size={14} className="text-emerald-500" />
                <span>Indeks Risiko Skenario</span>
              </span>
              {(() => {
                const cat = simResult.riskCategory as string;
                let badgeClass = 'bg-rose-50 text-rose-600';
                if (simResult.riskScore < baselineRiskScore && cat === 'Rendah') {
                  badgeClass = 'bg-emerald-50 text-emerald-600';
                } else if (cat === 'Sedang') {
                  badgeClass = 'bg-orange-50 text-orange-600';
                } else if (simResult.riskScore > baselineRiskScore && (cat === 'Tinggi' || cat === 'Kritis')) {
                  badgeClass = 'bg-rose-50 text-rose-600';
                } else {
                  if (cat === 'Rendah') {
                    badgeClass = 'bg-emerald-50 text-emerald-600';
                  } else if (cat === 'Sedang') {
                    badgeClass = 'bg-orange-50 text-orange-600';
                  } else {
                    badgeClass = 'bg-rose-50 text-rose-600';
                  }
                }
                return (
                  <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-md ${badgeClass}`}>
                    {simResult.riskCategory}
                  </span>
                );
              })()}
            </div>
            
            {(() => {
              const cat = simResult.riskCategory as string;
              let scoreColorClass = 'text-slate-800';
              if (simResult.riskScore < baselineRiskScore && cat === 'Rendah') {
                scoreColorClass = 'text-emerald-600';
              } else if (cat === 'Sedang') {
                scoreColorClass = 'text-orange-500';
              } else if (simResult.riskScore > baselineRiskScore && (cat === 'Tinggi' || cat === 'Kritis')) {
                scoreColorClass = 'text-rose-600';
              } else {
                if (cat === 'Rendah') {
                  scoreColorClass = 'text-emerald-600';
                } else if (cat === 'Sedang') {
                  scoreColorClass = 'text-orange-500';
                } else {
                  scoreColorClass = 'text-rose-600';
                }
              }
              return (
                <h4 className={`text-3xl font-black tracking-tight mb-1 ${scoreColorClass}`}>
                  {simResult.riskScore.toFixed(0)} <span className="text-xs text-slate-400 font-bold">/ 100</span>
                </h4>
              );
            })()}
            
            <div className="flex items-center text-[10px] text-slate-400 font-bold mt-0.5">
              <span>Berdasarkan Stress-Test Model</span>
            </div>
          </div>

          <div className="mt-4">
            {/* Segmented multiple-colored indicator bar mimicking the reference image */}
            <div className="flex gap-1.5 h-1.5 w-full my-3.5">
              <div className="h-full bg-blue-500 rounded-l-full" style={{ width: '8%' }} />
              <div className="h-full bg-orange-500" style={{ width: '8%' }} />
              <div className="h-full bg-emerald-500" style={{ width: '4%' }} />
              <div className="h-full bg-purple-500 rounded-r-full" style={{ width: '80%' }} />
            </div>

            {/* Detailed metadata list under card */}
            <div className="space-y-2 border-t border-slate-50 pt-3 text-[11px] text-slate-500 font-bold">
              <div className="flex justify-between items-center">
                <span className="flex items-center text-slate-705">
                  <span className="w-2 h-2 rounded-full bg-purple-500 mr-2" />
                  <span>Kecepatan Leakage</span>
                </span>
                <span className="font-mono text-slate-700">{(simResult.metrics.regionalLeakage * 100).toFixed(0)}% Outflow</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="flex items-center text-slate-705">
                  <span className="w-2 h-2 rounded-full bg-blue-500 mr-2" />
                  <span>Koefisien Efisiensi</span>
                </span>
                <span className="font-mono text-slate-700">{(simResult.metrics.spendingEfficiency * 100).toFixed(0)}% Alokatif</span>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* Column structures: Left - Controls panel, Right - Diagnostics & Visualizations Row */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Column 1: Slider Instruments & Structural Characteristics (Col 4) */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Symmetrical Left Deck */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200/60 shadow-[0_4px_24px_rgb(0,0,0,0.01)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.02)] transition-all duration-300 space-y-6">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h4 className="text-sm font-black text-slate-850 text-slate-800 tracking-tight">Instrumen Skenario</h4>
              <button 
                onClick={() => applyPreset('custom')}
                className="text-[10px] font-bold text-indigo-600 hover:text-indigo-800 transition-colors uppercase tracking-wider"
              >
                Reset Sliders
              </button>
            </div>
            
            {/* Quick Presets Grid with beautiful buttons & Sheets Cloud sync */}
            <div className="space-y-4">
              <div className="space-y-2">
                <span className="text-[9px] font-extrabold text-slate-450 text-slate-400 uppercase tracking-widest">Simulasi Skenario Presets</span>
                <div className="grid grid-cols-2 gap-2">
                  <button 
                    onClick={() => applyPreset('infrashock')}
                    className="px-3 py-2 bg-emerald-50 hover:bg-emerald-100 border border-emerald-100 rounded-xl text-xs font-bold text-emerald-700 transition-all cursor-pointer active:scale-95"
                  >
                    Pro-Infrastruktur
                  </button>
                  <button 
                    onClick={() => applyPreset('socialcare')}
                    className="px-3 py-2 bg-amber-50 hover:bg-amber-100 border border-amber-100 rounded-xl text-xs font-bold text-amber-700 transition-all cursor-pointer active:scale-95"
                  >
                    Proteksi Sosial
                  </button>
                  <button 
                    onClick={() => applyPreset('independence')}
                    className="px-3 py-2 bg-indigo-50 hover:bg-indigo-100 border border-indigo-100 rounded-xl text-xs font-bold text-indigo-700 transition-all cursor-pointer active:scale-95"
                  >
                    Ekspansi PAD
                  </button>
                  <button 
                    onClick={() => applyPreset('austerity')}
                    className="px-3 py-2 bg-rose-50 hover:bg-rose-100 border border-rose-100 rounded-xl text-xs font-bold text-rose-700 transition-all cursor-pointer active:scale-95"
                  >
                    Austeritas Ketat
                  </button>
                </div>
              </div>

              {/* Sync to sheets action */}
              <div className="pt-2 border-t border-slate-50">
                <button
                  type="button"
                  onClick={() => {
                    setSaveTitle(`Skenario ${selectedRegion} - ${selectedYear}`);
                    setSaveDescription(`Skenario kustom untuk daerah ${selectedRegion} tahun anggaran ${selectedYear}${selectedQuarter ? ` ${selectedQuarter}` : ''}.`);
                    setIsSaveModalOpen(true);
                  }}
                  className="w-full flex items-center justify-center space-x-2 px-3 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-black rounded-xl text-xs shadow-sm transition-all hover:shadow-md cursor-pointer select-none active:scale-95"
                >
                  <Cloud size={14} className="flex-shrink-0" />
                  <span>Simpan ke Google Sheets</span>
                </button>
              </div>
            </div>

            {/* Custom optimized slider ranges */}
            <div className="space-y-4 pt-4 border-t border-slate-100">
              <SliderControl 
                label="Peningkatan Tarif PAD (Retribusi/Pajak)" 
                value={scenario.padIncrease} 
                onChange={(e: any) => handleSliderChange(e, 'padIncrease')} 
                min={0} max={50} unit="%" 
                color="indigo"
              />
              <SliderControl 
                label="Tambahan Belanja Pembangunan (Capital)" 
                value={scenario.capitalExpIncrease} 
                onChange={(e: any) => handleSliderChange(e, 'capitalExpIncrease')} 
                min={0} max={50} unit="%" 
                color="emerald"
              />
              <SliderControl 
                label="Pengurangan Belanja Pegawai (Efisiensi)" 
                value={scenario.personnelExpDecrease} 
                onChange={(e: any) => handleSliderChange(e, 'personnelExpDecrease')} 
                min={0} max={30} unit="%" 
                color="rose"
              />
              <SliderControl 
                label="Tambahan Bantuan Sosial Mandiri" 
                value={scenario.socialExpIncrease} 
                onChange={(e: any) => handleSliderChange(e, 'socialExpIncrease')} 
                min={0} max={50} unit="%" 
                color="amber"
              />
              <SliderControl 
                label="Pengurangan Dana Alokasi Pusat" 
                value={scenario.transferDecrease} 
                onChange={(e: any) => handleSliderChange(e, 'transferDecrease')} 
                min={0} max={30} unit="%" 
                color="blue"
              />
            </div>
          </div>

          {/* Regional Context Metrics Diagnostic Card Symmetrical */}
          <div className="bg-slate-50 p-5 rounded-3xl border border-slate-200/60 space-y-4">
            <div className="flex justify-between items-center">
              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-wider flex items-center space-x-1">
                <Info size={14} className="text-slate-400" />
                <span>Karakteristik Struktural ({regionData.Region})</span>
              </h4>
              <button 
                onClick={() => setIsStructModalOpen(true)}
                className="text-[10px] font-bold flex items-center gap-1 text-indigo-600 hover:text-indigo-800 bg-white hover:bg-slate-100 px-2.5 py-1 rounded-xl transition-all border border-slate-200"
              >
                <HelpCircle size={12} />
                <span>Intepretasi</span>
              </button>
            </div>
            
            <div className="grid grid-cols-2 gap-3 text-xs font-bold font-mono">
              <div className="bg-white p-3 rounded-2xl border border-slate-150">
                <span className="text-[9px] text-slate-400 block font-semibold font-sans mb-0.5">PDRB Riil:</span>
                <span className="text-slate-800">{formatIDR(simResult.metrics.regionalGDP)}</span>
              </div>
              <div className="bg-white p-3 rounded-2xl border border-slate-150">
                <span className="text-[9px] text-slate-400 block font-semibold font-sans mb-0.5">Pendapatan:</span>
                <span className="text-indigo-600">{(simResult.metrics.spendingEfficiency * 100).toFixed(0)}% Efisien</span>
              </div>
              <div className="bg-white p-3 rounded-2xl border border-slate-150">
                <span className="text-[9px] text-slate-400 block font-semibold font-sans mb-0.5">Regional Leakage:</span>
                <span className="text-rose-600">{(simResult.metrics.regionalLeakage * 100).toFixed(0)}% Bocor</span>
              </div>
              <div className="bg-white p-3 rounded-2xl border border-slate-150">
                <span className="text-[9px] text-slate-400 block font-semibold font-sans mb-0.5">Tk. Ketergantungan:</span>
                <span className="text-indigo-600">{(simResult.metrics.fiscalDependence * 100).toFixed(0)}% TKD</span>
              </div>
            </div>
          </div>

        </div>

        {/* Column 2: Analytical visualization charts & Recommendations (Col 8) */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Validation Risk Warnings List Panel (If Any) */}
          {simResult.warnings.length > 0 && (
            <div className="bg-rose-50 border border-rose-200 p-5 rounded-3xl space-y-3">
              <h4 className="text-xs font-black text-rose-850 flex items-center gap-1.5 uppercase tracking-wide">
                <ShieldAlert className="text-rose-600" size={16} />
                <span>Peringatan Kelayakan Makro-Fiskal ({simResult.warnings.length})</span>
              </h4>
              <div className="space-y-2">
                {simResult.warnings.map((w, idx) => (
                  <div key={idx} className={`p-3 rounded-2xl flex items-start gap-3 text-[11px] leading-relaxed bg-white border-l-4 ${
                    w.type === 'critical' ? 'border-rose-600 text-rose-900 shadow-sm' :
                    w.type === 'warning' ? 'border-amber-500 text-amber-900 shadow-sm' : 'border-blue-500 text-slate-900 shadow-sm'
                  }`}>
                    <AlertTriangle className="flex-shrink-0 mt-0.5 text-rose-500" size={14} />
                    <div>
                      <h5 className="font-extrabold">{w.title}</h5>
                      <p className="mt-0.5 opacity-90 text-slate-500 font-semibold">{w.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Symmetrical multiplier impact split display */}
          <div className="bg-slate-50 p-6 rounded-3xl border border-slate-150 space-y-4">
            <div className="flex items-center gap-1.5 mb-2 pb-2 border-b border-slate-200">
              <Lightbulb className="text-orange-500 animate-bounce" size={18} />
              <h3 className="text-sm font-black text-slate-800">Pembongkaran Efek Pengganda (Multiplier Impact Breakdown)</h3>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              <ImpactBadge label="Belanja Modal" impact={simResult.impactBreakdown.capitalImpact} />
              <ImpactBadge label="Belanja Sosial" impact={simResult.impactBreakdown.socialImpact} />
              <ImpactBadge label="Administrasi Pegawai" impact={simResult.impactBreakdown.personnelImpact} />
              <ImpactBadge label="Instrik Pajak/PAD" impact={simResult.impactBreakdown.taxImpact} />
              <ImpactBadge label="Dana Pusat" impact={simResult.impactBreakdown.transferImpact} />
            </div>

            <p className="text-[11px] text-slate-500 leading-relaxed bg-white p-4 rounded-2xl border border-slate-150 font-medium">
              Pertumbuhan riil disimulasikan dari baseline <span className="font-bold text-slate-800">{simResult.baseline.gdpGrowth.toFixed(2)}%</span> bergeser sebesar <span className={`font-bold ${simResult.simulated.gdpGrowth >= simResult.baseline.gdpGrowth ? 'text-emerald-600' : 'text-rose-600'}`}>{(simResult.simulated.gdpGrowth - simResult.baseline.gdpGrowth).toFixed(2)}%</span> menuju <span className="font-bold text-slate-800">{simResult.simulated.gdpGrowth.toFixed(2)}%</span>. Model ini memperhitungkan <span className="font-semibold text-indigo-600">Lag Transmisi</span> dan kebocoran ekonomi wilayah (<span className="font-semibold">Regional Leakage</span>).
            </p>
          </div>

          {/* Symmetrical Recharts Bar Chart */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200/60 shadow-[0_8px_30px_rgb(0,0,0,0.01)]">
            <div className="flex items-center justify-between border-b border-slate-50 pb-4 mb-4">
              <div>
                <h3 className="text-sm font-black text-slate-800 tracking-tight">Visualisasi Perbandingan Anggaran Murni</h3>
                <p className="text-[10px] text-slate-400 font-medium">Komparasi postur anggaran awal sirkulasi regional terhadap bauran simulasi baru.</p>
              </div>
              <span className="text-[10px] font-bold text-slate-400 uppercase">Juta / Miliar Rupiah (IDR)</span>
            </div>
            
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={comparisonData} margin={{ top: 20, right: 10, left: -20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" stroke="#94a3b8" fontSize={10} tickLine={false} axisLine={false} />
                  <YAxis tickFormatter={(val: any) => formatIDR(val).replace('Rp', '')} stroke="#94a3b8" fontSize={9} tickLine={false} axisLine={false} />
                  <Tooltip 
                    contentStyle={{ background: '#ffffff', borderRadius: '16px', border: '1px solid #f1f5f9', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.05)' }} 
                    formatter={(value: number) => [formatIDR(value), '']}
                  />
                  <Legend iconType="circle" iconSize={6} wrapperStyle={{ fontSize: 10, paddingTop: 10 }} />
                  <Bar dataKey="Awal" fill="#94a3b8" radius={[4, 4, 0, 0]} barSize={32} />
                  <Bar dataKey="Simulasi" fill="#4f46e5" radius={[4, 4, 0, 0]} barSize={32} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* AI Advisor Recommendations ( IMF / OECD standards ) */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200/60 shadow-[0_8px_30px_rgb(0,0,0,0.01)] space-y-4">
            <h3 className="text-sm font-black text-slate-800 flex items-center gap-1.5 border-b border-slate-50 pb-3">
              <Award className="text-indigo-600" size={16} />
              <span>Rekomendasi Kebijakan Penyeimbang (Macro-Fiscal Consultations)</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {simResult.recommendations.map((rec, ind) => (
                <div key={ind} className="bg-slate-50/50 p-4 rounded-2xl border border-slate-150 space-y-2 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between">
                      <span className={`text-[9px] px-2 py-0.5 rounded-md font-bold uppercase ${
                        rec.priority === 'high' ? 'bg-rose-50 text-rose-600' :
                        rec.priority === 'medium' ? 'bg-amber-50 text-amber-600' : 'bg-slate-100 text-slate-600'
                      }`}>
                        Prioritas {rec.priority === 'high' ? 'Tinggi' : rec.priority === 'medium' ? 'Sedang' : 'Opsional'}
                      </span>
                    </div>
                    <h4 className="text-xs font-black text-slate-800 mt-2 uppercase">{rec.title}</h4>
                    <p className="text-[11px] text-slate-500 font-semibold leading-relaxed mt-1">{rec.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* AI-Powered Unified Policy Brief & Socioeconomic Impact Analysis Panel */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2">
                <Sparkles className="text-indigo-600 animate-pulse" size={20} />
                <h3 className="text-md font-bold text-slate-800">AI-Powered Policy Brief & Socioeconomic Impact Analysis</h3>
              </div>
              <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-bold">GEMINI 3.5 FLASH</span>
            </div>

            <p className="text-xs text-slate-500 leading-relaxed">
              Formulasikan nota penjelasan kebijakan eksekutif berstandar formal Kementerian Keuangan RI secara instan, terintegrasi penuh dengan analisis kompromi/dampak kesejahteraan sosial ekonomi daerah, indeks resiliensi, dan jaring pengaman mikro-fiskal.
            </p>

            {briefError && (
              <div className="p-3 bg-rose-50 text-rose-800 border-l-4 border-rose-500 rounded text-xs flex items-start space-x-2">
                <AlertTriangle size={16} className="mt-0.5 flex-shrink-0" />
                <span>{briefError}</span>
              </div>
            )}

            {!generatedBrief && !isBriefLoading && (
              <button
                onClick={handleGenerateBrief}
                className="w-full py-3 px-4 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white font-bold rounded-xl shadow-md transition-all duration-200 flex items-center justify-center space-x-2 cursor-pointer select-none"
              >
                <Sparkles size={16} />
                <span>Formulasikan Nota Kebijakan & Kompromi Sosial Ekonomi (AI Brief)</span>
              </button>
            )}

            {isBriefLoading && (
              <div className="p-8 bg-slate-50 border border-slate-200 rounded-xl space-y-4 flex flex-col items-center justify-center text-center">
                <Loader2 className="animate-spin text-indigo-600" size={32} />
                <div className="space-y-1">
                  <p className="text-xs font-bold text-slate-700 animate-pulse">Menghubungkan ke Gemini API...</p>
                  <p className="text-[10px] text-slate-400 max-w-sm mx-auto">
                    Mengevaluasi parameter multi-efek anggaran, limit defisit fisik rill 3%, kebocoran ekonomi, resiliensi tingkat konsumsi lokal, tekanan dunia usaha, serta menyusun jaring pengaman sosial.
                  </p>
                </div>
              </div>
            )}

            {generatedBrief && (
              <div className="space-y-4">
                {/* Formal Paper Presentation Sheet */}
                <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 md:p-8 font-sans text-slate-800 relative shadow-inner max-h-[500px] overflow-y-auto">
                  {/* Watermark/Emblem look */}
                  <div className="border-b border-double border-slate-400 pb-4 mb-5 flex justify-between items-end">
                    <div>
                      <h4 className="text-xs font-extrabold uppercase tracking-widest text-indigo-600 flex items-center gap-1">
                        <Sparkles size={12} className="text-amber-500" /> FISCALIA INTEL & IMPACT REPORT
                      </h4>
                      <p className="text-[10px] text-slate-400 font-bold">NOTA PENJELASAN FISKAL & TIMBAL BALIK SOSIAL (AI-ANALYZED)</p>
                    </div>
                    <div className="text-right text-[10px] text-slate-400">
                      <p>Kategori Risiko: <span className="font-bold text-slate-600">{simResult.riskCategory}</span></p>
                      <p>Waktu Analisis: {new Date().toLocaleDateString('id-ID', { year: 'numeric', month: 'short', day: 'numeric' })}</p>
                    </div>
                  </div>

                  {/* Document Content */}
                  <div className="prose prose-sm max-w-none text-xs text-justify leading-relaxed text-slate-700 space-y-4 markdown-body">
                    <ReactMarkdown>{generatedBrief}</ReactMarkdown>
                  </div>
                </div>

                {/* Simulated Metrics Card Badges */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 bg-slate-50 p-4 border border-slate-200 rounded-xl">
                  <div className="bg-white p-3 rounded-lg border border-slate-100 flex flex-col justify-between">
                    <div>
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Resiliensi Sosial</span>
                      <span className="text-xs font-bold block text-slate-800 mt-1">Social Resilience Index</span>
                    </div>
                    <div className="flex items-baseline space-x-1.5 mt-2">
                      <span className="text-xl font-bold text-emerald-600">
                        {scenario.socialExpIncrease > 15 ? '75 - 90' : scenario.socialExpIncrease > 5 ? '55 - 74' : '35 - 54'}
                      </span>
                      <span className="text-[10px] text-slate-400">/100</span>
                    </div>
                  </div>
                  <div className="bg-white p-3 rounded-lg border border-slate-100 flex flex-col justify-between">
                    <div>
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Tekanan Usaha</span>
                      <span className="text-xs font-bold block text-slate-800 mt-1">Business Stress Index</span>
                    </div>
                    <div className="flex items-baseline space-x-1.5 mt-2">
                      <span className={`text-xl font-bold ${scenario.padIncrease > 20 ? 'text-rose-600' : scenario.padIncrease > 5 ? 'text-amber-500' : 'text-emerald-500'}`}>
                        {scenario.padIncrease > 25 ? '75 - 95' : scenario.padIncrease > 10 ? '50 - 74' : '15 - 49'}
                      </span>
                      <span className="text-[10px] text-slate-400 font-medium">Stress</span>
                    </div>
                  </div>
                  <div className="bg-white p-3 rounded-lg border border-slate-100 flex flex-col justify-between">
                    <div>
                      <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Kualitas Pelayanan</span>
                      <span className="text-xs font-bold block text-slate-800 mt-1">Public Service Potential</span>
                    </div>
                    <div className="flex items-baseline space-x-1.5 mt-2">
                      <span className={`text-xl font-bold ${scenario.personnelExpDecrease > 15 ? 'text-amber-500' : 'text-emerald-600'}`}>
                        {scenario.personnelExpDecrease > 15 ? '60 - 72' : '80 - 95'}
                      </span>
                      <span className="text-[10px] text-slate-400">/100</span>
                    </div>
                  </div>
                </div>

                {/* Document Control Actions */}
                <div className="flex flex-col sm:flex-row gap-2 pt-2">
                  <button
                    onClick={handleCopyBrief}
                    className="flex-1 py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg text-xs transition-colors flex items-center justify-center space-x-1.5 cursor-pointer"
                  >
                    <CheckCircle2 size={14} className={copied ? "text-emerald-600" : "text-slate-400"} />
                    <span>{copied ? "Berhasil Disalin!" : "Salin ke Clipboard"}</span>
                  </button>
                  <button
                    onClick={handleDownloadBrief}
                    disabled={isBriefPdfDownloading}
                    className="flex-1 py-2.5 px-4 bg-indigo-50 hover:bg-indigo-100 disabled:bg-indigo-50/50 disabled:text-indigo-400 text-indigo-700 font-bold rounded-lg text-xs transition-colors flex items-center justify-center space-x-1.5 cursor-pointer"
                  >
                    {isBriefPdfDownloading ? (
                      <Loader2 size={14} className="animate-spin text-indigo-500" />
                    ) : (
                      <FileText size={14} className="text-indigo-400" />
                    )}
                    <span>{isBriefPdfDownloading ? "Memproses PDF..." : "Unduh Lapor Lengkap (PDF)"}</span>
                  </button>
                  <button
                    onClick={handleGenerateBrief}
                    className="py-2.5 px-4 bg-white hover:bg-slate-50 border border-slate-200 text-slate-500 hover:text-slate-700 font-medium rounded-lg text-xs transition-colors flex items-center justify-center space-x-1 cursor-pointer"
                    title="Formulasikan Ulang"
                  >
                    <Sparkles size={12} />
                    <span>Formulasikan Ulang</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Structure Interpretation Modal */}
      {isStructModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[85vh] overflow-y-auto shadow-xl relative">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center sticky top-0 bg-white/95 backdrop-blur z-10">
              <h3 className="text-lg font-bold text-slate-800 flex items-center space-x-2">
                <Info className="text-indigo-600" size={20} />
                <span>Interpretasi Karakteristik Struktural Daerah</span>
              </h3>
              <button 
                onClick={() => setIsStructModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 bg-slate-50 hover:bg-slate-100 rounded-full p-2 transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-5">
                <h4 className="font-bold text-sm text-slate-800 mb-2">1. Estimasi PDRB Riil</h4>
                <p className="text-sm text-slate-600 leading-relaxed">
                  Total nilai tambah ekonomi daerah yang digunakan sebagai basis kalkulasi beban fiskal dan rasio efek multiplier. Nilai ini sangat menentukan seberapa besar perubahan nominal belanja atau pendapatan dari APBD akan berdampak proporsional terhadap ukuran ekonomi daerah riil (elastisitas basis).
                </p>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-xl p-5">
                <h4 className="font-bold text-sm text-slate-800 mb-2">2. Koefisien Efisiensi</h4>
                <p className="text-sm text-slate-600 leading-relaxed">
                  Tingkat efektivitas penyerapan dan konversi belanja daerah menjadi output ekonomi rill. Koefisien di bawah 100% menandakan adanya red tape, lambatnya eksekusi proyek (lag time), atau inefisiensi alokatif. Koefisien rendah akan melemahkan daya gedor (multiplier) belanja modal.
                </p>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-xl p-5">
                <h4 className="font-bold text-sm text-slate-800 mb-2">3. Regional Leakage (Tingkat Kebocoran Wilayah)</h4>
                <p className="text-sm text-slate-600 leading-relaxed">
                  Persentase injeksi fiskal (belanja pemda) yang tidak berputar di daerah itu sendiri, melainkan "bocor" terserap impor dari wilayah lain (misal: bahan pengerjaan konstruksi didatangkan dari luar provinsi). Tingkat leakage tinggi akan menetralisir dampak positif stimulus ekonomi lokal.
                </p>
              </div>

              <div className="bg-slate-50 border border-slate-200 rounded-xl p-5">
                <h4 className="font-bold text-sm text-slate-800 mb-2">4. Ketergantungan Transfer</h4>
                <p className="text-sm text-slate-600 leading-relaxed">
                  Proporsi pendapatan daerah yang disokong dari dana pusat (Dana Perimbangan). Tingginya angka ini menandakan kapasitas fiskal rendah dan merugikan sensitivitas PAD. Daerah dengan ketergantungan sangat tinggi lebih rentan terhadap goncangan saat pusat memotong transfer (misal: sanksi over-defisit).
                </p>
              </div>

            </div>
            
            <div className="p-4 border-t border-slate-100 bg-slate-50 rounded-b-2xl text-right">
              <button 
                onClick={() => setIsStructModalOpen(false)}
                className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-6 rounded-lg text-sm transition-colors cursor-pointer"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Save Custom Scenario Modal */}
      {isSaveModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-xl overflow-hidden relative">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-white">
              <h3 className="text-lg font-bold text-slate-800 flex items-center space-x-2">
                <Cloud className="text-indigo-600 animate-pulse" size={20} />
                <span>Simpan Skenario ke Google Sheets</span>
              </h3>
              <button 
                type="button"
                onClick={() => {
                  setIsSaveModalOpen(false);
                  setSaveMessage(null);
                }}
                className="text-slate-400 hover:text-slate-600 bg-slate-50 hover:bg-slate-100 rounded-full p-2 transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveScenario} className="p-6 space-y-4 bg-white">
              {!user ? (
                <div className="space-y-4 py-4 text-center">
                  <div className="mx-auto w-12 h-12 bg-indigo-50 rounded-full flex items-center justify-center border border-indigo-100 text-indigo-600 text-xl font-bold">
                    !
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-800 text-sm">Google Sheets Belum Terhubung</h4>
                    <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
                      Hubungkan akun Google Anda dengan perizinan yang aman untuk menyimpan skenario kustom Anda langsung ke Spreadsheet.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      if (onLogin) onLogin();
                    }}
                    className="mx-auto bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold px-4 py-2.5 rounded-lg flex items-center justify-center space-x-2 transition-colors cursor-pointer text-xs shadow-xs"
                  >
                     <svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" className="w-4 h-4 mr-1" xmlnsXlink="http://www.w3.org/1999/xlink">
                      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"></path>
                      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"></path>
                      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"></path>
                      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"></path>
                      <path fill="none" d="M0 0h48v48H0z"></path>
                     </svg>
                     <span>Hubungkan Google Sheets</span>
                  </button>
                </div>
              ) : (
                <>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase">Judul Skenario</label>
                    <input 
                      type="text"
                      className="w-full p-2.5 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800 font-medium"
                      placeholder="Masukkan judul skenario..."
                      value={saveTitle}
                      onChange={(e) => setSaveTitle(e.target.value)}
                      required
                      disabled={isSavingScenario}
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-500 uppercase">Deskripsi Postur Skenario</label>
                    <textarea 
                      className="w-full p-2.5 border border-slate-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-800 leading-normal"
                      rows={3}
                      placeholder="Masukkan rincian perubahan kebijakan..."
                      value={saveDescription}
                      onChange={(e) => setSaveDescription(e.target.value)}
                      disabled={isSavingScenario}
                    />
                  </div>

                  <div className="bg-indigo-50/50 p-3 mt-1 rounded-lg border border-indigo-100 text-[11px] text-indigo-950 space-y-1">
                    <p className="font-bold flex items-center"><Cloud size={12} className="mr-1 text-indigo-600" /> Parameter yang akan disimpan:</p>
                    <div className="grid grid-cols-2 gap-x-2 gap-y-0.5 mt-1 font-mono text-slate-700">
                      <span>• PAD: {scenario.padIncrease > 0 ? `+${scenario.padIncrease}` : scenario.padIncrease}%</span>
                      <span>• Modal: {scenario.capitalExpIncrease > 0 ? `+${scenario.capitalExpIncrease}` : scenario.capitalExpIncrease}%</span>
                      <span>• Pegawai: -{scenario.personnelExpDecrease}%</span>
                      <span>• Bansos: {scenario.socialExpIncrease > 0 ? `+${scenario.socialExpIncrease}` : scenario.socialExpIncrease}%</span>
                      <span>• Dana Pusat: -{scenario.transferDecrease}%</span>
                    </div>
                  </div>

                  {saveMessage && (
                    <div className={`p-3 rounded-lg text-xs font-medium text-center ${
                      saveMessage.type === 'success' 
                        ? 'bg-emerald-50 text-emerald-800 border border-emerald-100' 
                        : 'bg-rose-50 text-rose-800 border border-rose-100'
                    }`}>
                      {saveMessage.text}
                    </div>
                  )}

                  <div className="pt-2 flex space-x-3">
                    <button 
                      type="button"
                      onClick={() => {
                        setIsSaveModalOpen(false);
                        setSaveMessage(null);
                      }}
                      className="flex-1 bg-slate-50 hover:bg-slate-100 text-slate-700 font-bold py-2.5 rounded-lg text-xs border border-slate-200 cursor-pointer select-none"
                      disabled={isSavingScenario}
                    >
                      Batal
                    </button>
                    <button 
                      type="submit"
                      className="flex-1 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white font-bold py-2.5 rounded-lg text-xs shadow-xs flex items-center justify-center space-x-2 cursor-pointer select-none"
                      disabled={isSavingScenario}
                    >
                      {isSavingScenario ? (
                        <>
                          <Loader2 size={14} className="animate-spin" />
                          <span>Menyimpan...</span>
                        </>
                      ) : (
                        <>
                          <Save size={14} />
                          <span>Simpan ke Sheets</span>
                        </>
                      )}
                    </button>
                  </div>
                </>
              )}
            </form>
          </div>
        </div>
      )}

      {/* Hidden layout for Policy Brief PDF Snapshot rendering */}
      <div className="absolute left-[-9999px] top-[-9999px]">
        <div ref={briefPdfRef} className="bg-white p-12 w-[800px] text-slate-800 font-sans">
          {/* Header */}
          <div className="border-b-4 border-indigo-600 pb-6 mb-8 flex justify-between items-end">
            <div>
              <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
                <Sparkles className="text-indigo-600 animate-pulse" size={28} />
                <span>AI-Powered Policy Brief</span>
              </h1>
              <p className="text-sm text-slate-500 mt-1">Laporan Nota Kebijakan Resmi Regional - Kerja Sama Fiscalia & Gemini AI</p>
            </div>
            <div className="text-right">
              <p className="text-xs font-semibold uppercase tracking-wider text-indigo-600">Dokumen Analisis Cerdas</p>
              <p className="text-xs text-slate-500">{new Date().toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
            </div>
          </div>

          {/* Metadata Grid */}
          <div className="bg-slate-50 p-5 rounded-xl border border-slate-200 mb-8 grid grid-cols-2 gap-4 text-xs">
            <div>
              <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider mb-1">Entitas Regional</p>
              <p className="text-lg font-extrabold text-slate-800">{regionData.Region}</p>
              <p className="text-xs text-slate-500">{regionData.Province}</p>
            </div>
            <div>
              <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wider mb-1">Periode & Kategori Risiko</p>
              <p className="text-lg font-extrabold text-slate-800">{regionData.Year} {regionData.Quarter || ''}</p>
              <p className="text-xs text-slate-500 text-rose-600">Risiko Skenario: <span className="font-bold">{simResult.riskCategory}</span></p>
            </div>
          </div>

          {/* Parameter Shock & Simulation Highlights */}
          <div className="grid grid-cols-2 gap-6 mb-8 text-xs border-b border-slate-100 pb-5">
            <div>
              <p className="font-bold text-slate-800 mb-2 uppercase tracking-wide text-[10px]">Parameter Simulasi yang Diuji:</p>
              <ul className="text-slate-600 space-y-1 list-disc pl-4">
                <li>Peningkatan PAD: +{scenario.padIncrease}%</li>
                <li>Pengurangan Transfer: -{scenario.transferDecrease}%</li>
                <li>Belanja Modal: +{scenario.capitalExpIncrease}%</li>
                <li>Belanja Pegawai: -{scenario.personnelExpDecrease}%</li>
                <li>Belanja Sosial: +{scenario.socialExpIncrease}%</li>
              </ul>
            </div>
            <div>
              <p className="font-bold text-slate-800 mb-2 uppercase tracking-wide text-[10px]">Hasil Proyeksi Utama:</p>
              <ul className="text-slate-600 space-y-1 list-disc pl-4">
                <li>Proyeksi Pertumbuhan PDRB: <span className="font-bold text-indigo-600">{simResult.simulated?.gdpGrowth?.toFixed(2)}%</span> (Baseline: {simResult.baseline?.gdpGrowth?.toFixed(2)}%)</li>
                <li>Keseimbangan Fiskal Baru: <span className="font-bold text-slate-800">Rp {simResult.simulated?.balance?.toLocaleString("id-ID")}</span></li>
                <li>Indeks Efisiensi Belanja: {(simResult.metrics?.spendingEfficiency * 100).toFixed(1)}%</li>
                <li>Kebocoran Keluar Wilayah: {(simResult.metrics?.regionalLeakage * 100).toFixed(1)}%</li>
              </ul>
            </div>
          </div>

          {/* Main Brief Content (Markdown) */}
          <div className="prose prose-sm max-w-none text-xs text-justify leading-relaxed text-slate-800 space-y-4 markdown-body">
            <ReactMarkdown>{generatedBrief || ""}</ReactMarkdown>
          </div>

          {/* Footer */}
          <div className="mt-12 pt-4 border-t border-slate-200 text-center text-[10px] text-slate-400">
            <p>Laporan ini digenerasikan secara otomatis oleh mesin analitik kecerdasan buatan Fiscalia menggunakan Gemini 3.5 Flash.</p>
            <p className="mt-0.5">Seluruh proyeksi bersifat indikatif berdasarkan elastisitas model pengganda fiskal daerah.</p>
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
