import React from 'react';
import { Library, ArrowRight, TrendingUp, AlertTriangle, Briefcase, Activity } from 'lucide-react';

export default function ScenarioLibrary({ onApplyScenario }: { onApplyScenario: (presetKey: string) => void }) {
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
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col items-start md:flex-row md:items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-800 flex items-center">
            <Library className="mr-3 text-indigo-600" size={28} />
            Pustaka Skenario Kebijakan
          </h1>
          <p className="text-slate-500 mt-2 max-w-2xl leading-relaxed">
            Katalog pre-set / template skenario makroekonomi dan rekomendasinya. 
            Gunakan panduan ini sebagai kerangka dasar sebelum menyimulasikan angka di menu Simulasi Kebijakan.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {scenarios.map((scenario) => (
          <div key={scenario.id} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-slate-50 rounded-lg border border-slate-100">
                  {scenario.icon}
                </div>
                <h2 className="text-lg font-semibold text-slate-800">{scenario.title}</h2>
              </div>
              <span className={`px-2.5 py-1 text-xs font-semibold rounded-full ${scenario.badgeColor}`}>
                {scenario.badge}
              </span>
            </div>
            
            <div className="space-y-4">
              <div>
                <h3 className="text-sm font-semibold text-slate-700 mb-1">Postur &amp; Instrumen</h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  {scenario.description}
                </p>
              </div>
              
              <div className="bg-slate-50 p-4 rounded-lg border border-slate-100">
                <h3 className="text-sm font-semibold text-slate-700 mb-1">Proyeksi Dampak (Trade-off)</h3>
                <p className="text-sm text-slate-600 leading-relaxed">
                  {scenario.impact}
                </p>
              </div>
            </div>

            <div className="mt-5 pt-4 border-t border-slate-100">
              <button 
                title="Gunakan ini di Simulasi"
                className="flex items-center text-sm font-medium text-indigo-600 hover:text-indigo-800 transition-colors cursor-pointer"
                onClick={() => onApplyScenario(scenario.presetKey)}
              >
                Coba Skenario Serupa <ArrowRight size={16} className="ml-1" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
