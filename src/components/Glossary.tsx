import React from 'react';
import { BookOpen, Calculator, Info, Target, GitMerge, FileText } from 'lucide-react';

export default function Glossary() {
  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col items-center text-center">
        <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mb-4 border border-indigo-100">
          <BookOpen size={32} />
        </div>
        <h1 className="text-2xl font-semibold tracking-tight text-slate-800">
          Glosarium Formulasi &amp; Metodologi
        </h1>
        <p className="text-slate-500 max-w-2xl mt-2 leading-relaxed">
          Dokumen ini memaparkan penjelasan parameter, variabel perhitungan matematis (ekonometrika), 
          serta dasar teoritis dari multiplier fiskal parsial yang digunakan di dalam simulasi dan diagnosis Fiscalia.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Section 1: Multiplier Coefficients */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center space-x-3 mb-4">
            <Calculator className="text-blue-500" size={24} />
            <h2 className="text-lg font-semibold text-slate-800">Koefisien Multiplier Fiskal</h2>
          </div>
          <p className="text-sm text-slate-600 mb-4 pb-4 border-b border-slate-100">
            Multiplier Fiskal mengukur efek berantai dari penambahan atau pengurangan pos anggaran (belanja/pajak) terhadap agregat ekonomi (PDRB) daerah.
          </p>
          <ul className="space-y-4">
            <li className="flex justify-between items-start">
              <div>
                <span className="font-medium text-slate-800 block">Belanja Modal (Infrastruktur)</span>
                <span className="text-xs text-slate-500">Menciptakan stimulus jangka panjang (konstruksi, material lokal).</span>
              </div>
              <span className="bg-emerald-100 text-emerald-700 px-2 py-1 rounded text-sm font-mono font-medium tracking-tight">+1.4</span>
            </li>
            <li className="flex justify-between items-start">
              <div>
                <span className="font-medium text-slate-800 block">Belanja Sosial &amp; Bantuan</span>
                <span className="text-xs text-slate-500">Stimulus langsung ke masyarakat yang dihabiskan untuk konsumsi (Marginal Propensity to Consume).</span>
              </div>
              <span className="bg-emerald-100 text-emerald-700 px-2 py-1 rounded text-sm font-mono font-medium tracking-tight">+1.2</span>
            </li>
            <li className="flex justify-between items-start">
              <div>
                <span className="font-medium text-slate-800 block">Penyesuaian Transfer Pusat</span>
                <span className="text-xs text-slate-500">Goncangan pendapatan daerah akibat pemotongan TKDD/DAU.</span>
              </div>
              <span className="bg-rose-100 text-rose-700 px-2 py-1 rounded text-sm font-mono font-medium tracking-tight">-0.2</span>
            </li>
            <li className="flex justify-between items-start">
              <div>
                <span className="font-medium text-slate-800 block">Belanja Pegawai (Birokrasi)</span>
                <span className="text-xs text-slate-500">Beban kaku (inflexible) yang kontraksi penambahannya membatasi ruang fiskal tanpa perputaran nilai tambah produk.</span>
              </div>
              <span className="bg-rose-100 text-rose-700 px-2 py-1 rounded text-sm font-mono font-medium tracking-tight">-0.3</span>
            </li>
            <li className="flex justify-between items-start">
              <div>
                <span className="font-medium text-slate-800 block">Kenaikan Tarif Pajak (PAD)</span>
                <span className="text-xs text-slate-500">Menyerap likuiditas konsumen, memperlambat kecepatan sirkulasi uang di tingkat rumah tangga.</span>
              </div>
              <span className="bg-rose-100 text-rose-700 px-2 py-1 rounded text-sm font-mono font-medium tracking-tight">-0.6</span>
            </li>
          </ul>
        </div>

        {/* Section 2: Lag Variables */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center space-x-3 mb-4">
            <Target className="text-amber-500" size={24} />
            <h2 className="text-lg font-semibold text-slate-800">Efek Jeda (Lag Effect)</h2>
          </div>
          <p className="text-sm text-slate-600 mb-4 pb-4 border-b border-slate-100">
            Jeda Serapan (Lag) mengestimasikan persentase shock instrumen yang secara riil terealisasi terserap memengaruhi PDRB dalam tahun berjalan (Siklus 1 Tahun).
          </p>
          <ul className="space-y-4">
            <li className="flex justify-between items-center">
              <span className="font-medium text-slate-800">Bantuan Sosial Transmisi Riil</span>
              <span className="text-slate-500 font-mono text-sm">85% (0.85)</span>
            </li>
            <li className="flex justify-between items-center">
              <span className="font-medium text-slate-800">Dampak Kenaikan PAD</span>
              <span className="text-slate-500 font-mono text-sm">70% (0.70)</span>
            </li>
            <li className="flex justify-between items-center">
              <span className="font-medium text-slate-800">Dampak Belanja Pegawai</span>
              <span className="text-slate-500 font-mono text-sm">50% (0.50)</span>
            </li>
            <li className="flex justify-between items-center">
              <span className="font-medium text-slate-800">Efek Deviasi Transfer Pusat</span>
              <span className="text-slate-500 font-mono text-sm">40% (0.40)</span>
            </li>
            <li className="flex justify-between items-center">
              <span className="font-medium text-slate-800">Efek Serapan Proyek Modal</span>
              <span className="text-slate-500 font-mono text-sm">35% (0.35)</span>
            </li>
          </ul>
          <div className="mt-6 bg-amber-50 p-3 rounded-lg flex items-start space-x-2 border border-amber-100">
            <Info className="text-amber-600 flex-shrink-0 mt-0.5" size={16} />
            <p className="text-xs text-amber-800 leading-relaxed">
              <strong>Contoh:</strong> Proyek infrastruktur membutuhkan waktu pembangunan multi-years. Akibatnya, dalam periode fiskal bersangkutan, efek riil pada harga pasar hanya terterjemahkan sekitar 35%. Transmisi sisa efek terjadi pada masa manfaat aset.
            </p>
          </div>
        </div>

        {/* Section 3: System Variables & Formulation */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm md:col-span-2">
          <div className="flex items-center space-x-3 mb-6">
            <GitMerge className="text-purple-500" size={24} />
            <h2 className="text-lg font-semibold text-slate-800">Formulasi Kompleks (Partial Equilibrium)</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <h3 className="font-medium text-slate-800 text-sm flex items-center"><FileText size={16} className="mr-2 text-slate-400"/> Persamaan Dampak Kebijakan</h3>
              <div className="bg-slate-50 p-4 rounded-lg font-mono text-xs text-slate-700 overflow-x-auto border border-slate-200 italic tracking-tight">
                Impact = (Δ Anggaran / PDRB) × Multiplier × Lag × Efiisien × (1 - Leakage) × Stress Penalties
              </div>
              <p className="text-xs text-slate-500 leading-relaxed">
                Persamaan simulasi menghitung proyeksi dengan menimbang inefisiensi pengadaan daerah (Spending Efficiency) dan faktor kebocoran likuiditas uang ke luar batas provinsi (Regional Leakage Index).
              </p>
            </div>

            <div className="space-y-3">
              <h3 className="font-medium text-slate-800 text-sm flex items-center"><FileText size={16} className="mr-2 text-slate-400"/> Estimasi Index Efisiensi</h3>
              <div className="bg-slate-50 p-4 rounded-lg font-mono text-xs text-slate-700 overflow-x-auto border border-slate-200 italic tracking-tight">
                Idx = 0.85 - [ max(0, Rasio Gaji - 0.3) × 0.6 + Pengangguran Faktor ]
              </div>
              <p className="text-xs text-slate-500 leading-relaxed">
                Model secara otomatis menjatuhkan tingkat kemanjuran belanja jika sebuah daerah menghabiskan lebih dari 30% anggaran mereka untuk belanja kepegawaian (karena bersifat Rigid).
              </p>
            </div>
            
            <div className="space-y-3">
              <h3 className="font-medium text-slate-800 text-sm flex items-center"><FileText size={16} className="mr-2 text-slate-400"/> Koreksi Stress Fiskal</h3>
              <div className="bg-slate-50 p-4 rounded-lg font-mono text-xs text-slate-700 overflow-x-auto border border-slate-200 italic tracking-tight">
                Penalty Drop = Max(0.40, 1.0 - (Defisit Rasio - 0.03) × 6.0)
              </div>
              <p className="text-xs text-slate-500 leading-relaxed">
                Sebagai rem darurat rasional ekonomi, multiplier akan didiskon bertahap hingga rontok sebesar maksimum 60% jika rasio defisit menabrak perbatasan aman hukum di atas batas konstitusional 3%.
              </p>
            </div>

            <div className="space-y-3">
              <h3 className="font-medium text-slate-800 text-sm flex items-center"><FileText size={16} className="mr-2 text-slate-400"/> Parameter Threshold Batas Sistem</h3>
              <ul className="text-xs text-slate-600 space-y-2 mt-2 list-disc list-inside">
                <li><strong className="text-slate-800">Growth Ceiling (12%):</strong> Batas atas realistis (dibatasi demi akurasi prediksi komputasi agar tidak meledak eksponensial).</li>
                <li><strong className="text-slate-800">Growth Floor (-5%):</strong> Batas zona resesi ekstrim pemicu peringatan kritis merah.</li>
                <li><strong className="text-slate-800">Max Deficit (3%):</strong> Toleransi ambang batas standar defisit subnasional dari produk harga berlaku agregat PDRB.</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Section 4: Alur Simulasi dan Penggunaan */}
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm md:col-span-2 space-y-4">
          <div className="flex items-center space-x-3 mb-2">
            <BookOpen className="text-emerald-500" size={24} />
            <h2 className="text-lg font-semibold text-slate-800">Alur Kerja Penggunaan Aplikasi (Workflow Use Case)</h2>
          </div>
          <p className="text-sm text-slate-600 leading-relaxed">
            Berikut adalah tahapan fungsional pengoperasian Fiscalia dari fase persiapan data mentah hingga penyerahan rekomendasi taktis berkualifikasi kebijakan kepada pimpinan eksekutif daerah:
          </p>
          <div className="overflow-x-auto border border-slate-100 rounded-lg">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="p-3 font-semibold text-slate-700 text-center w-12">Tahap</th>
                  <th className="p-3 font-semibold text-slate-700">Aktivitas Pengguna</th>
                  <th className="p-3 font-semibold text-slate-700">Proses / Reaksi Sistem</th>
                  <th className="p-3 font-semibold text-slate-700">Keluaran (Output) Riil</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-600">
                <tr className="hover:bg-slate-50/50">
                  <td className="p-3 font-bold text-center text-slate-800 bg-slate-50/30">1</td>
                  <td className="p-3">
                    <strong className="text-slate-800 block mb-0.5">Persiapan &amp; Unduh Template</strong>
                    Mengunduh berkas standardisasi APBD di menu "Unggah Data".
                  </td>
                  <td className="p-3">Menghasilkan berkas Excel terstruktur (`template_fiskal.xlsx`) dengan format baris input yang tervalidasi lengkap dengan opsional PDRB Riil Baru.</td>
                  <td className="p-3 font-mono text-indigo-600">template_fiskal.xlsx</td>
                </tr>
                <tr className="hover:bg-slate-50/50">
                  <td className="p-3 font-bold text-center text-slate-800 bg-slate-50/30">2</td>
                  <td className="p-3">
                    <strong className="text-slate-800 block mb-0.5">Unggah &amp; Validasi</strong>
                    Mengunggah APBD atau PDRB wilayah (drag-and-drop / klik manual).
                  </td>
                  <td className="p-3">Mengekstrak data, mencocokkan field, dan jika PDRB Riil kosong, mengaktivasi estimasi otomatis <code>PDRB = Revenue × 6.5</code>.</td>
                  <td className="p-3 font-semibold text-emerald-600">Realisasi Baseline Masuk</td>
                </tr>
                <tr className="hover:bg-slate-50/50">
                  <td className="p-3 font-bold text-center text-slate-800 bg-slate-50/30">3</td>
                  <td className="p-3">
                    <strong className="text-slate-800 block mb-0.5">Kombinasi Cloud (OAuth)</strong>
                    Otentikasi dengan Google Account &amp; Firebase.
                  </td>
                  <td className="p-3">Membuat dan menyinkronkan data APBD secara instan ke dalam struktur Google Sheets privat milik pengguna.</td>
                  <td className="p-3 font-semibold text-indigo-600">Real-time Cloud Sync</td>
                </tr>
                <tr className="hover:bg-slate-50/50">
                  <td className="p-3 font-bold text-center text-slate-800 bg-slate-50/30">4</td>
                  <td className="p-3">
                    <strong className="text-slate-800 block mb-0.5">Monitoring Diagnostik</strong>
                    Menelaah kesehatan finansial daerah pada dasbor analitis.
                  </td>
                  <td className="p-3">Menghitung Indeks Kapasitas Fiskal, Indeks Kesenjangan Pembangunan, dan Skor Stres Fiskal (toleransi defisit 3%).</td>
                  <td className="p-3">Status Risiko &amp; Analisis Naratif</td>
                </tr>
                <tr className="hover:bg-slate-50/50">
                  <td className="p-3 font-bold text-center text-slate-800 bg-slate-50/30">5</td>
                  <td className="p-3">
                    <strong className="text-slate-800 block mb-0.5">Simulasi Sandbox Skenario</strong>
                    Menyesuaikan slider belanja/pendapatan APBD atau klik Preset Kebijakan.
                  </td>
                  <td className="p-3">Menghitung elastisitas dampak makro terhadap PDRB secara real-time via Partial Equilibrium Multiplier Model terlag.</td>
                  <td className="p-3 font-semibold text-slate-800">Proyeksi PDRB &amp; Defisit Baru</td>
                </tr>
                <tr className="hover:bg-slate-50/50">
                  <td className="p-3 font-bold text-center text-slate-800 bg-slate-50/30">6</td>
                  <td className="p-3">
                    <strong className="text-slate-800 block mb-0.5">Rekomendasi Cerdas</strong>
                    Menginspeksi modul penyeimbang keuangan dan rincian risiko.
                  </td>
                  <td className="p-3">Mendeteksi tabrakan batas aturan (defisit &gt; 3%), memberikan penalti diskon multiplier, serta meregenerasi 5 saran prioritas.</td>
                  <td className="p-3 text-amber-600 font-semibold">Priority Strategy Matrix</td>
                </tr>
                <tr className="hover:bg-slate-50/50">
                  <td className="p-3 font-bold text-center text-slate-800 bg-slate-50/30">7</td>
                  <td className="p-3">
                    <strong className="text-slate-800 block mb-0.5">Penyimpanan Otomatis</strong>
                    Menyimpan skenario hasil temuan simulasi pimpinan ke Sheets.
                  </td>
                  <td className="p-3">Mencatat data parameter slider kustom langsung ke awan Google Sheets secara dinamis.</td>
                  <td className="p-3 font-semibold text-indigo-600">Daftar Pustaka Skenario Kustom</td>
                </tr>
                <tr className="hover:bg-slate-50/50">
                  <td className="p-3 font-bold text-center text-slate-800 bg-slate-50/30">8</td>
                  <td className="p-3">
                    <strong className="text-slate-800 block mb-0.5">Ekspor Policy Brief PDF</strong>
                    Mengeklik tombol simulasikan cetak dokumen eksekutif.
                  </td>
                  <td className="p-3">Menghasilkan draf Policy Brief 1-2 halaman yang rapi dengan sistem page-break cerdas antarkertas A4 (antiterpotong acak).</td>
                  <td className="p-3 text-red-600 font-bold font-mono">Formal Briefing PDF</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
