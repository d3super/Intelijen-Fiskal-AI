import React, { useState, useEffect } from 'react';
import { Library, ArrowRight, TrendingUp, AlertTriangle, Briefcase, Activity, Loader2, Sparkles } from 'lucide-react';
import { CustomScenario } from '../types';
import { getCustomScenariosFromSheets } from '../services/googleSheets';

export default function ScenarioLibrary({ 
  onApplyScenario,
  user,
  onLogin
}: { 
  onApplyScenario: (scenario: string | CustomScenario) => void;
  user?: any;
  onLogin?: () => void;
}) {
  const [customScenarios, setCustomScenarios] = useState<CustomScenario[]>([]);
  const [isLoadingCustoms, setIsLoadingCustoms] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    if (user) {
      setIsLoadingCustoms(true);
      setLoadError(null);
      getCustomScenariosFromSheets()
        .then((data) => {
          if (active) {
            setCustomScenarios(data || []);
          }
        })
        .catch((err) => {
          console.error("Failed to load custom scenarios:", err);
          if (active) {
            setLoadError("Gagal mengambil skenario kustom Anda dari Google Sheets.");
          }
        })
        .finally(() => {
          if (active) {
            setIsLoadingCustoms(false);
          }
        });
    } else {
      setCustomScenarios([]);
    }
    return () => {
      active = false;
    };
  }, [user]);

  const scenarios = [
    {
      id: 1,
      title: 'Ekspansi Infrastruktur Agresif',
      icon: <TrendingUp className="text-emerald-500" size={24} />,
      badge: 'Pro-Growth',
      badgeColor: 'bg-emerald-100 text-emerald-700',
      description: 'Skenario ini mensimulasikan peningkatan besar pada Belanja Modal (+25%) dengan memotong Belanja Pegawai ringan (-5%). Fokus pada efek multiplier jangka panjang dari pembangunan fisik.',
      impact: 'PDRB berpotensi naik signifikan pada siklus tahun berikutnya, namun rasio defisit akan melebar tajam di tahun berjalan.',
      presetKey: 'infrashock'
    },
    {
      id: 2,
      title: 'Austeritas Fiskal (Pengereman Defisit)',
      icon: <AlertTriangle className="text-amber-500" size={24} />,
      badge: 'Deficit Control',
      badgeColor: 'bg-amber-100 text-amber-700',
      description: 'Pemotongan rata pada Belanja Modal (-15%) dan Belanja Sosial (-10%), dikombinasikan dengan penggenjotan PAD (+10%) untuk menyehatkan arus kas.',
      impact: 'Menurunkan drastis defisit berjalan dan menyehatkan rasio utang, namun berisiko memicu kontraksi ekonomi (perlambatan PDRB).',
      presetKey: 'austerity'
    },
    {
      id: 3,
      title: 'Jaring Pengaman Sosial Ekstra',
      icon: <Briefcase className="text-blue-500" size={24} />,
      badge: 'Social Safety',
      badgeColor: 'bg-blue-100 text-blue-700',
      description: 'Peningkatan Belanja Sosial (+20%) untuk menjaga daya beli masyarakat di tengah guncangan ekonomi, dibiayai dari realokasi Belanja Modal (-10%).',
      impact: 'Menjaga bantalan konsumsi rumah tangga (efek multiplier instan tinggi), namun mengorbankan kapasitas pembentukan modal tetap bruto.',
      presetKey: 'socialcare'
    },
    {
      id: 4,
      title: 'Reformasi Birokrasi (Efisiensi)',
      icon: <Activity className="text-purple-500" size={24} />,
      badge: 'Efficiency',
      badgeColor: 'bg-purple-100 text-purple-700',
      description: 'Pemangkasan drastis Belanja Pegawai (-15%) yang dialihkan sepenuhnya menjadi dorongan tambahan untuk Belanja Modal (+15%).',
      impact: 'Ruang fiskal melebar untuk pendanaan produktif. Efek multiplier gabungan sangat positif meskipun menghadapi hambatan politik/birokrasi nyata.',
      presetKey: 'efficiency'
    }
  ];

  return (
    <div className="space-y-8">
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col items-start md:flex-row md:items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-800 flex items-center">
            <Library className="mr-3 text-indigo-600" size={28} />
            Pustaka Skenario Kebijakan
          </h1>
          <p className="text-slate-500 mt-2 max-w-2xl leading-relaxed text-sm">
            Katalog preset skenario makroekonomi bawaan serta skenario simulasi kustom yang Anda simpan di Google Sheets Anda sendiri. Gunakan katalog panduan ini untuk memasukkan angka estimasi fungsional secara instan.
          </p>
        </div>
      </div>

      {/* Built-in Presets Section */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-slate-800 flex items-center">
          <Sparkles className="text-indigo-600 mr-2" size={18} />
          Skenario Kebijakan Pokok (Presets Bawaan)
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {scenarios.map((scenario) => (
            <div key={scenario.id} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow flex flex-col justify-between">
              <div>
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 bg-slate-50 rounded-lg border border-slate-100">
                      {scenario.icon}
                    </div>
                    <h2 className="text-md font-bold text-slate-800">{scenario.title}</h2>
                  </div>
                  <span className={`px-2.5 py-1 text-xs font-semibold rounded-full ${scenario.badgeColor}`}>
                    {scenario.badge}
                  </span>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <h3 className="text-xs font-bold text-slate-505 uppercase mb-1">Postur &amp; Instrumen</h3>
                    <p className="text-sm text-slate-600 leading-relaxed">
                      {scenario.description}
                    </p>
                  </div>
                  
                  <div className="bg-slate-50 p-4 rounded-lg border border-slate-100">
                    <h3 className="text-xs font-bold text-slate-505 uppercase mb-1">Proyeksi Dampak (Trade-off)</h3>
                    <p className="text-sm text-slate-600 leading-relaxed text-[13px] italic">
                      {scenario.impact}
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-5 pt-4 border-t border-slate-100">
                <button 
                  title="Gunakan ini di Simulasi"
                  className="flex items-center text-xs font-bold text-indigo-600 hover:text-indigo-800 transition-colors cursor-pointer"
                  onClick={() => onApplyScenario(scenario.presetKey)}
                >
                  Coba Skenario Serupa <ArrowRight size={14} className="ml-1" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Custom Scenarios (Google Sheets) Section */}
      <div className="space-y-4 pt-4 border-t border-slate-200">
        <h2 className="text-lg font-bold text-slate-800 flex items-center">
          <Library className="text-indigo-600 mr-2" size={18} />
          Skenario Kustom Saya (Google Sheets)
        </h2>

        {!user ? (
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-8 text-center max-w-xl mx-auto space-y-4 shadow-sm">
            <div className="mx-auto w-12 h-12 bg-indigo-50 rounded-full flex items-center justify-center border border-indigo-100 text-indigo-600">
              <Library size={22} />
            </div>
            <div>
              <h3 className="text-md font-bold text-slate-800">Lihat Skenario Kustom Anda</h3>
              <p className="text-xs text-slate-500 mt-1.5 leading-relaxed max-w-md mx-auto">
                Hubungkan akun Google Sheets Anda untuk melihat, memanggil kembali, dan menguji skenario-skenario simulasi kustom yang Anda simpan sebelumnya.
              </p>
            </div>
            <button
              onClick={onLogin}
              className="mx-auto bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold px-4 py-2 rounded-lg flex items-center justify-center space-x-2 transition-all cursor-pointer text-xs shadow-xs"
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
        ) : isLoadingCustoms ? (
          <div className="flex flex-col items-center justify-center py-12 text-center text-slate-500 space-y-3">
            <Loader2 className="animate-spin text-indigo-600" size={32} />
            <p className="text-xs font-semibold">Memuat skenario kustom dari Google Sheets...</p>
          </div>
        ) : loadError ? (
          <div className="bg-rose-50 border border-rose-100 text-rose-800 rounded-xl p-6 text-center max-w-xl mx-auto text-xs font-medium space-y-3 shadow-xs">
            <p>{loadError}</p>
          </div>
        ) : customScenarios.length === 0 ? (
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-8 text-center max-w-xl mx-auto space-y-3 shadow-sm">
            <p className="text-sm font-bold text-slate-700">Belum Ada Skenario Kustom Tersimpan</p>
            <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
              Anda belum menyimpan skenario buatan sendiri. Buka menu <strong className="text-indigo-600 font-bold">Simulasi Kebijakan</strong>, atur slider postur anggaran sesuai keinginan Anda, kemudian klik tombol <strong className="text-slate-700">"Simpan Skenario Kustom ke Sheets"</strong>.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {customScenarios.map((scenario, index) => (
              <div key={index} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden flex flex-col justify-between">
                <div className="absolute top-0 right-0 pt-2 pr-3 text-[9px] font-bold text-slate-400 font-mono tracking-wider uppercase">
                  {scenario.region || 'Nasional'}
                </div>
                
                <div className="space-y-4">
                  <div className="flex items-start space-x-3 pr-14">
                    <div className="p-2.5 bg-indigo-50/70 rounded-lg text-indigo-600 border border-indigo-100 flex-shrink-0">
                      <Library size={18} />
                    </div>
                    <div>
                      <h2 className="text-md font-bold text-slate-800 leading-snug">{scenario.title}</h2>
                      <p className="text-[10px] font-bold text-indigo-600 mt-1 font-mono uppercase bg-indigo-50/50 px-2 py-0.5 rounded inline-block">
                        TA {scenario.year || '2026'}{scenario.quarter ? ` - ${scenario.quarter}` : ''}
                      </p>
                    </div>
                  </div>

                  <p className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-lg border border-slate-100 italic min-h-[44px]">
                    "{scenario.description}"
                  </p>

                  <div className="grid grid-cols-3 gap-x-2 gap-y-1 font-mono text-[10px] bg-slate-50/40 border border-slate-100 p-2.5 rounded-lg text-slate-600">
                    <div className="flex flex-col">
                      <span className="text-slate-400 font-sans uppercase font-bold text-[8px]">PAD:</span>
                      <span className="font-semibold text-slate-800 mt-0.5">{scenario.padIncrease > 0 ? `+${scenario.padIncrease}` : scenario.padIncrease}%</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-slate-400 font-sans uppercase font-bold text-[8px]">Modal:</span>
                      <span className="font-semibold text-slate-800 mt-0.5">{scenario.capitalExpIncrease > 0 ? `+${scenario.capitalExpIncrease}` : scenario.capitalExpIncrease}%</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="text-slate-400 font-sans uppercase font-bold text-[8px]">Pegawai:</span>
                      <span className="font-semibold text-slate-800 mt-0.5">-{scenario.personnelExpDecrease}%</span>
                    </div>
                    <div className="flex flex-col mt-1">
                      <span className="text-slate-400 font-sans uppercase font-bold text-[8px]">Sosial:</span>
                      <span className="font-semibold text-slate-800 mt-0.5">{scenario.socialExpIncrease > 0 ? `+${scenario.socialExpIncrease}` : scenario.socialExpIncrease}%</span>
                    </div>
                    <div className="flex flex-col mt-1">
                      <span className="text-slate-400 font-sans uppercase font-bold text-[8px]">Transfer:</span>
                      <span className="font-semibold text-slate-805 mt-0.5">-{scenario.transferDecrease}%</span>
                    </div>
                  </div>
                </div>

                <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between">
                  <button 
                    title="Muat parameter ini di Simulasi"
                    onClick={() => onApplyScenario(scenario)}
                    className="flex items-center text-xs font-bold text-indigo-600 hover:text-indigo-800 transition-colors cursor-pointer"
                  >
                    Terapkan Skenario Kustom <ArrowRight size={14} className="ml-1" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
