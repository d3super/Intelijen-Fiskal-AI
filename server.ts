import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";

let aiClient: GoogleGenAI | null = null;

function getGenAI() {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY tidak ditemukan di environment. Sila konfigurasi kunci API Anda di Settings.");
    }
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': "aistudio-build",
        },
      },
    });
  }
  return aiClient;
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: "10mb" }));

  // API: Generate AI-Powered Policy Brief
  app.post("/api/gemini/generate-brief", async (req, res) => {
    try {
      const { regionData, scenario, simResult } = req.body;

      if (!regionData || !scenario || !simResult) {
        res.status(400).json({ error: "Missing required simulation data inside request body." });
        return;
      }

      const ai = getGenAI();

      const promptString = `
Anda adalah seorang Analis Kebijakan Fiskal Senior Kementerian Keuangan Indonesia (Kanwil Ditjen Perbendaharaan / Kanwil DJPb dan Direktorat Jenderal Perimbangan Keuangan / DJPK). 
Tugas Anda adalah memformulasikan nota singkat atau "AI-Powered Policy Brief" resmi daerah berdasar pada simulasi kebijakan fiskal daerah berikut:

=== DATA BASELINE DAERAH ===
Nama Daerah: ${regionData.Region}
Provinsi: ${regionData.Province}
Tahun / Kuartal: ${regionData.Year} ${regionData.Quarter || ""}
PDRB Riil Baru (Estimasi/Input): Rp ${regionData.Regional_GDP_Current_Price ? regionData.Regional_GDP_Current_Price.toLocaleString("id-ID") : "Tidak ditentukan"}
Pendapatan Asli Daerah (PAD) Baseline: Rp ${regionData.PAD.toLocaleString("id-ID")}
Dana Transfer Baseline: Rp ${regionData.Transfer.toLocaleString("id-ID")}
Total Pendapatan Baseline: Rp ${regionData.Revenue.toLocaleString("id-ID")}
Belanja Pegawai Baseline: Rp ${regionData.Personnel_Spending.toLocaleString("id-ID")}
Belanja Modal Baseline: Rp ${regionData.Capital_Expenditure.toLocaleString("id-ID")}
Belanja Sosial Baseline: Rp ${regionData.Social_Spending.toLocaleString("id-ID")}
Total Belanja Baseline: Rp ${regionData.Expenditure.toLocaleString("id-ID")}
Keseimbangan Fiskal Baseline: Rp ${regionData.Fiscal_Balance.toLocaleString("id-ID")}
Skor Stres Fiskal Baseline: ${regionData.Fiscal_Stress_Score?.toFixed(1) || "N/A"}/100

=== SHOCK SKENARIO KEBIJAKAN (SIMULASI) ===
- Kenaikan PAD Skenario: +${scenario.padIncrease}%
- Penurunan Dana Transfer Skenario: -${scenario.transferDecrease}%
- Kenaikan Belanja Modal Skenario: +${scenario.capitalExpIncrease}%
- Penurunan Belanja Pegawai Skenario: -${scenario.personnelExpDecrease}%
- Kenaikan Belanja Sosial Skenario: +${scenario.socialExpIncrease}%

=== HASIL PROYEKSI SIMULASI FISCALIA ===
- Proyeksi Pertumbuhan Riil (PDRB): ${simResult.simulated?.gdpGrowth?.toFixed(2)}% (mengalami pergeseran dari baseline ${simResult.baseline?.gdpGrowth?.toFixed(2)}%)
- Keseimbangan Fiskal Baru (Simulated Balance): Rp ${simResult.simulated?.balance?.toLocaleString("id-ID")}
- Rasio Defisit Terhadap PDRB Baru: ${((Math.abs(Math.min(0, simResult.simulated?.balance)) / (regionData.Regional_GDP_Current_Price || (regionData.Revenue * 6.5))) * 100).toFixed(4)}%
- Batas Risiko Maksimal Defisit: 3,00% dari PDRB (Sesuai reformasi batas fiskal 3% PDRB)
- Karakteristik Struktural Daerah:
  * Indeks Efisiensi Belanja: ${(simResult.metrics?.spendingEfficiency * 100).toFixed(1)}%
  * Indeks Kebocoran Keluar Wilayah (Regional Leakage): ${(simResult.metrics?.regionalLeakage * 100).toFixed(1)}%
  * Indeks Ketergantungan Transfer Pusat: ${(simResult.metrics?.fiscalDependence * 100).toFixed(1)}%
- Rekomendasi Algoritmis Bawaan:
${simResult.recommendations?.map((r: any, idx: number) => `  ${idx + 1}. [Prioritas: ${r.priority.toUpperCase()}] ${r.title} - ${r.description}`).join("\n")}

Formatlah Policy Brief Anda ke dalam format markdown yang sangat representatif, elegan, formal, berbobot ekonomis tinggi, tanpa basa-basi klise. Gunakan bahasa Indonesia baku profesional (misalnya pergunakan terminologi resmi APBD seperti PAD, SiLPA, Dana Transfer, Belanja Pegawai, Belanja Modal, dll).

PENTING DAN KHUSUS: Jangan sertakan header administratif internal, kofigurasi disposisi, atau memo dinas seperti "Kepada:", "Dari:", "Tanggal:", "Perihal:", "Yth:", atau pasangan metadata administratif sejenis di bagian awal brief. Laporan harus langsung dimulai dengan judul Policy Brief yang elegan dan representatif sebagai Heading utama (Heading 1).

Nota Kebijakan (Policy Brief) WAJIB mengikuti sistematika terstruktur dan runtut berikut dengan menyertakan penulisan judul komponen secara jelas:
1. **JUDUL** (Tuliskan judul laporan nota singkat kebijaksanaan daerah yang taktis, padat, dan memuat nama daerah serta tahun simulasi secara formal).
2. **EXECUTIVE SUMMARY** (Ringkasan eksekutif padat maksimal 1-2 paragraf mengenai urgensi penyesuaian fiskal dan proyeksi hasil akhir simulasi ini bagi pimpinan daerah).
3. **LATAR BELAKANG** (Deskripsi konteks postur anggaran baseline daerah saat ini, ketergantungan transfer pusat, dan mengapa simulasi penyesuaian anggaran ini dilakukan).
4. **PERMASALAHAN** (Uraian tantangan fiskal nyata seperti inefisiensi pengadaan belanja, risiko kebocoran regional, atau keterbatasan ruang fiskal subnasional untuk ekspansi).
5. **TEMUAN UTAMA** (Pemaparan metrik diagnostik inti seperti Indeks Efisiensi Belanja: ${(simResult.metrics?.spendingEfficiency * 100).toFixed(1)}%, Indeks Kebocoran Keluar Wilayah: ${(simResult.metrics?.regionalLeakage * 100).toFixed(1)}%, skor stres fiskal baseline, serta elastisitas multiplier aslinya sebelum shock).
6. **OPSI KEBIJAKAN** (Pilihan-pilihan skenario instrumen penyeimbang yang diuji, misalnya realokasi belanja pegawai ke belanja produktif atau optimalisasi PAD).
7. **SIMULASI DAMPAK MAKRO** (Analisis mendalam mengenai dampak kuantitatif dari shock skenario terpilih terhadap tingkat pertumbuhan PDRB riil regional: ${simResult.simulated?.gdpGrowth?.toFixed(2)}% vs baseline ${simResult.baseline?.gdpGrowth?.toFixed(2)}%, dan proyeksi nominal sisa anggaran atau defisit daerah baru).
8. **MATRIKS KOMPROMI KEBIJAKAN & SOSIAL-EKONOMI (SOCIOECONOMIC TRADE-OFFS)** (Uraikan secara analitis kompromi/pengorbanan langsung demi mendapatkan stimulasi pertumbuhan ekonomi tersebut:
   - Jika Belanja Pembangunan (Modal) naik pesat, analisislah komprominya seperti pengorbanan jaring pengaman sosial, beban utang, atau likuiditas kas daerah jangka pendek.
   - Jika Belanja Pegawai diturunkan drastis demi efisiensi, ulas komprominya secara jujur seperti demotivasi ASN daerah, penyesuaian kualitas layanan gawat darurat/publik, atau sirkulasi konsumsi lokal.
   - Jika PAD dinaikkan tinggi via intensifikasi pajak/retribusi daerah, ulas komprominya bagi beban usaha/UMKM dan gairah investasi regional).
9. **INDEKS ESTIMASI SOSIAL-EKONOMI (AI-SCORECARD)** (Berikan taksiran indeks kuantitatif pro-rata skala 0-100 untuk parameter:
   - **Indeks Ketahanan Sosial (Social Resilience Index)**: Tingkat jaring pengaman sosial.
   - **Indeks Tekanan Dunia Usaha (Business Stress Index)**: Tingkat hambatan usaha dari kontribusi PAD.
   - **Indeks Kualitas Pelayanan Publik (Public Service Potential)**: Efektivitas operasional layanan publik per-kapita).
10. **REKOMENDASI PENGAMAN SOSIAL-EKONOMI (SOCIOECONOMIC SAFEGUARDS)** (Butir-butir penyeimbang/offset strategis konkret operasional untuk meminimalisir kompromi negatif yang teridentifikasi).
11. **ANALISIS RISIKO ATURAN DEFISIT** (Analisis stres-test terhadap risiko pelanggaran ambang batas aturan defisit 3,00% PDRB, potensi crowding-out multiplier jika defisit terlampaui, serta langkah mitigasinya menggunakan instrumen seperti SiLPA atau penataan ulang belanja).
12. **KESIMPULAN** (Sari akhir keputusan taktis apakah opsi kebijakan atau skenario simulasi ini layak direkomendasikan langsung untuk diadopsi menjadi produk hukum APBD atau kebijakan strategis kepala daerah).

Hindari kata-kata generik. Tuliskan analisis dengan nada tajam, tegas, dan berbobot akademis.
`;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: promptString,
        config: {
          temperature: 0.7,
        },
      });

      res.json({ brief: response.text });
    } catch (error: any) {
      console.error("Gemini API Error in server.ts:", error);
      res.status(500).json({ error: error.message || "Terjadi kegagalan komunikasi dengan model AI Gemini." });
    }
  });

  // API: Generate AI Diagnostic and Anomaly Finder
  app.post("/api/gemini/generate-diagnostic", async (req, res) => {
    try {
      const { regionData } = req.body;

      if (!regionData) {
        res.status(400).json({ error: "Missing required region data inside request body." });
        return;
      }

      const ai = getGenAI();

      const promptString = `
Anda adalah seorang Auditor Utama Keuangan Negara dan Ahli Sistem Peringatan Dini Kebijakan Fiskal (DJPK / Kemenkeu).
Tugas Anda adalah memformulasikan laporan analisis profesional bertajuk "AI Diagnostik Kerentanan Fiskal Otomatis & Temuan Anomali (Smart Baseline Diagnostic & Anomaly Finder)" untuk daerah berikut berdasarkan data rill APBD Baseline-nya.

=== DATA ENTITAS REGIONAL ===
Nama Daerah: ${regionData.Region}
Provinsi: ${regionData.Province}
Tahun / Kuartal: ${regionData.Year} ${regionData.Quarter || ""}
PDRB Riil Baru (Nominal/Input): Rp ${regionData.Regional_GDP_Current_Price ? regionData.Regional_GDP_Current_Price.toLocaleString("id-ID") : "Tidak ditentukan"}
Laju Pertumbuhan PDRB: ${regionData.GDP_Growth?.toFixed(2)}%
Pendapatan Asli Daerah (PAD): Rp ${regionData.PAD.toLocaleString("id-ID")}
Dana Transfer: Rp ${regionData.Transfer.toLocaleString("id-ID")}
Total Pendapatan: Rp ${regionData.Revenue.toLocaleString("id-ID")}
Belanja Pegawai: Rp ${regionData.Personnel_Spending.toLocaleString("id-ID")}
Belanja Modal: Rp ${regionData.Capital_Expenditure.toLocaleString("id-ID")}
Belanja Sosial: Rp ${regionData.Social_Spending.toLocaleString("id-ID")}
Total Belanja: Rp ${regionData.Expenditure.toLocaleString("id-ID")}
Keseimbangan Fiskal: Rp ${regionData.Fiscal_Balance.toLocaleString("id-ID")}
Skor Stres Fiskal Baseline: ${regionData.Fiscal_Stress_Score?.toFixed(1) || "N/A"}/100
Indeks Kapasitas Fiskal: ${regionData.Fiscal_Capacity_Index?.toFixed(1) || "N/A"}
Ketergantungan Dana Transfer: ${regionData.Transfer_Dependency?.toFixed(1) || "N/A"}%
Tingkat Pengangguran Terbuka: ${regionData.Unemployment?.toFixed(2) || "N/A"}%
Jumlah Populasi: ${regionData.Population?.toLocaleString("id-ID") || "N/A"} jiwa

Lakukan audit dan diagnosis kerentanan kritis, temukan anomali struktur anggaran secara cerdas, dan analisis risiko fiskal komprehensif.

Formatlah Laporan Diagnostik Anda ke dalam format markdown yang formal, sistematis, tajam, dan memiliki nilai taktis tinggi untuk Kepala Daerah serta Tim Anggaran Pemerintah Daerah (TAPD). Gunakan Bahasa Indonesia baku ilmiah ekonomi pembangunan.

PENTING DAN KHUSUS: Jangan sertakan header administratif internal, disposisi dinas, atau memo dinas formal di bagian awal laporan seperti "Kepada Yth:", "Dari:", "Tanggal:", "Perihal:", "Yth:", "Nomor:", atau pasangan metadata administratif sejenis di bagian awal laporan. Laporan harus langsung dimulai dengan judul Laporan Laporan Analisis atau Judul Temuan Utama sebagai Heading utama (Heading 1).

Laporan WAJIB mengikuti sistematika terstruktur berikut:
1. **DAFTAR TEMUAN ANOMALI FISKAL (DETECTION BOARD)**: Berikan daftar anomali kritis (misalnya: belanja pegawai melampaui batas psikologis 30-40%, belanja modal infrastruktur di bawah syarat UU HKPD 20-30%, ketergantungan transfer di atas 70%, atau defisit struktural yang memakan SiLPA).
2. **DIAGNOSIS DETAIL KERENTANAN (VULNERABILITY INDEX ANALYSIS)**: Ulas indeks kapasitas fiskal, indeks transfer dependency, serta analisis tingkat elastisitas pertumbuhan ekonomi daerah tersebut terhadap belanja daerah.
3. **RISIKO MAKROSEKTORAL**: Evaluasi korelasi laju PDRB dengan tingkat pengangguran terbuka dan apakah belanja jaring pengaman sosial saat ini proporsional.
4. **REKOMENDASI STRATEGIS & FORMULA MITIGASI (ANOMALY FIXER)**: Berikan rekomendasi langkah darurat pembenahan regulasi daerah, penataan ulang belanja sisa anggaran (SiLPA), serta diversifikasi pajak/retribusi daerah untuk pemulihan ruang fiskal.

Gunakan bahasa yang tegas, kritis, solutif, dan objektif tanpa basa-basi pemasaran.
`;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: promptString,
        config: {
          temperature: 0.5,
        },
      });

      res.json({ diagnostic: response.text });
    } catch (error: any) {
      console.error("Gemini Diagnostic API Error in server.ts:", error);
      res.status(500).json({ error: error.message || "Terjadi kegagalan komunikasi dengan model AI Gemini." });
    }
  });

  // API: AI Socioeconomic Trade-off Predictor
  app.post("/api/gemini/generate-tradeoff", async (req, res) => {
    try {
      const { regionData, scenario, simResult } = req.body;

      if (!regionData || !scenario || !simResult) {
        res.status(400).json({ error: "Missing required simulation data inside request body." });
        return;
      }

      const ai = getGenAI();

      const promptString = `
Anda adalah seorang Ahli Ekonom Senior Ekonomi Pembangunan PBB (UNDP) dan Spesialis Analisis Kebijakan Publik Berkelanjutan.
Tugas Anda adalah melakukan kajian riset mendalam bertajuk "AI Prediksi Dampak & Kompromi Kebijakan (Socioeconomic Trade-off Predictor)" berdasarkan perubahan postur APBD hasil simulasi kebijakan makro-fiskal daerah berikut:

=== DATA BASELINE DAERAH ===
Nama Daerah: ${regionData.Region}
Provinsi: ${regionData.Province}
Tahun / Kuartal: ${regionData.Year} ${regionData.Quarter || ""}
PDRB Riil Baru (Estimasi/Input): Rp ${regionData.Regional_GDP_Current_Price ? regionData.Regional_GDP_Current_Price.toLocaleString("id-ID") : "Tidak ditentukan"}
PAD Baseline: Rp ${regionData.PAD.toLocaleString("id-ID")}
Dana Transfer Baseline: Rp ${regionData.Transfer.toLocaleString("id-ID")}
Total Pendapatan Baseline: Rp ${regionData.Revenue.toLocaleString("id-ID")}
Belanja Pegawai Baseline: Rp ${regionData.Personnel_Spending.toLocaleString("id-ID")}
Belanja Modal Baseline: Rp ${regionData.Capital_Expenditure.toLocaleString("id-ID")}
Belanja Sosial Baseline: Rp ${regionData.Social_Spending.toLocaleString("id-ID")}
Total Belanja Baseline: Rp ${regionData.Value_Expenditure || regionData.Expenditure ? regionData.Expenditure.toLocaleString("id-ID") : "N/A"}
Keseimbangan Fiskal Baseline: Rp ${regionData.Fiscal_Balance.toLocaleString("id-ID")}

=== SHOCK SKENARIO KEBIJAKAN (SIMULASI) ===
- Kenaikan PAD Skenario: +${scenario.padIncrease}%
- Penurunan Dana Transfer Skenario: -${scenario.transferDecrease}%
- Kenaikan Belanja Modal Skenario: +${scenario.capitalExpIncrease}%
- Penurunan Belanja Pegawai Skenario: -${scenario.personnelExpDecrease}%
- Kenaikan Belanja Sosial Skenario: +${scenario.socialExpIncrease}%

=== HASIL PROYEKSI SIMULASI FISCALIA ===
- Proyeksi Pertumbuhan Riil (PDRB): ${simResult.simulated?.gdpGrowth?.toFixed(2)}% (mengalami pergeseran dari baseline ${simResult.baseline?.gdpGrowth?.toFixed(2)}%)
- Keseimbangan Fiskal Baru (Simulated Balance): Rp ${simResult.simulated?.balance?.toLocaleString("id-ID")}
- Rasio Defisit Terhadap PDRB Baru: ${((Math.abs(Math.min(0, simResult.simulated?.balance)) / (regionData.Regional_GDP_Current_Price || (regionData.Revenue * 6.5))) * 100).toFixed(4)}%
- Indeks Efisiensi Belanja: ${(simResult.metrics?.spendingEfficiency * 100).toFixed(1)}%
- Indeks Kebocoran Keluar Wilayah (Regional Leakage): ${(simResult.metrics?.regionalLeakage * 100).toFixed(1)}%
- Indeks Ketergantungan Transfer Pusat: ${(simResult.metrics?.fiscalDependence * 100).toFixed(1)}%

Formulasikan Laporan Prediksi Dampak & Kompromi Kebijakan (Socioeconomic Trade-off Analysis) ini secara terstruktur, komprehensif, tajam, dan memiliki nilai taktis tingkat tinggi untuk Kepala Daerah (Bupati/Walikota/Gubernur) serta Kepala Badan Perencanaan Pembangunan Daerah (Bappeda). Gunakan Bahasa Indonesia akademis-analitis ekonomi pembangunan yang elegan, objektif, tanpa basa-basi klise.

PENTING DAN KHUSUS: Jangan sertakan header administratif internal, kofigurasi disposisi, atau memo dinas seperti "Kepada:", "Dari:", "Tanggal:", "Perihal:", "Yth:", atau pasangan metadata administratif sejenis di bagian awal laporan. Laporan harus langsung dimulai dengan judul Laporan yang elegan dan representatif sebagai Heading utama (Heading 1).

Laporan WAJIB mengikuti sistematika terstruktur dan runtut berikut dengan menyertakan penulisan judul komponen secara jelas:

1. **MATRIKS KOMPROMI KEBIJAKAN (TRADE-OFF ANALYSIS)**:
   Uraikan secara analitis kompromi/pengorbanan (trade-off) langsung demi mendapatkan hasil stimulasi pertumbuhan ekonomi tersebut berdasarkan postur guncangan yang disimulasikan:
   - Jika Belanja Pembangunan (Modal) naik pesat, analisislah komprominya (misal: pengorbanan jaring pengaman sosial jika anggarannya terbatas, peningkatan beban utang jika defisit melebar, atau krisis likuiditas kas daerah jangka pendek).
   - Jika Belanja Pegawai diturunkan drastis demi efisiensi, ulas komprominya secara jujur (misal: demotivasi aparatur sipil daerah, penurunan kualitas pelayanan publik di garis depan, potensi resistensi serikat pekerja asn, atau penurunan sirkulasi uang mikro lokal akibat berkurangnya belanja konsumsi PNS regional).
   - Jika PAD dinaikkan tinggi via pajak/retribusi intensif, ulas komprominya (misal: beban tambahan bagi UMKM, penurunan gairah investasi, atau peningkatan harga-harga kebutuhan publik lokal).
   - Jika Dana Alokasi Pusat (Transfer) ditarik/turun, ulas komprominya bagi fleksibilitas fiskal daerah.

2. **DAMPAK SOSIAL: EKSTERNALITAS & RISIKO KESEJAHTERAAN**:
   Ulas saksama proyeksi dampak spasial kebijakan ini ke beberapa klaster masyarakat:
   - **Tingkat Kemiskinan & Gini Ratio (Ketimpangan)**: Apakah terjadi perluasan jaring pengaman kemandirian jika bansos dinaikkan? Sebaliknya, jika belanja modal mendominasi sedangkan bansos stagnan, apakah ketimpangan melebar karena pengerjaan konstruksi padat modal kurang menyentuh kelompol akar rumput dalam jangka pendek?
   - **Daya Beli Riil Rumah Tangga (Local Consumption Power)**: Bagaimana guncangan kombinasi PAD, transfer, atau pengeluaran ASN ini mendestabilisasi konsumsi rumah tangga regional.
   - **Layanan Dasar Publik (Public Service Delivery)**: Sejauh mana efisiensi administrasi birokrasi ini mereduksi atau mengoptimalkan akses dan kenyamanan masyarakat di puskesmas, perizinan terpadu, sanitas, dan sekolah dasar setempat.

3. **INDEKS MULTIDIMENSIONAL DAMPAK SOSIAL-EKONOMI**:
   Tuliskan estimasi skor indeks kuantitatif pro-rata (skala 0-100) yang dinilai model AI untuk parameter-parameter berikut disertai penjelasan latar belakang kalkulasinya:
   - **Indeks Ketahanan Sosial (Social Resilience Index)**: Mengukur kesiapan jaring pengaman sosial dalam menyangga kerentanan masyarakat atas inflasi lokal atau pemangkasan pengeluaran birokrasi.
   - **Indeks Tekanan Dunia Usaha (Business Stress Index)**: Mengukur tingkat hambatan atau tekanan pajak/retribusi baru terhadap profitabilitas pelaku usaha, kemudahan izin, dan investasi.
   - **Indeks Kualitas Pelayanan Publik (Public Service Quality Potential)**: Mengukur potensi efektivitas birokrasi setelah diefisienkan. Apakah birokrasi berjalan lebih lincah (agile) atau menjadi rentan lumpuh layu?
   *(Gunakan format tabel markdown atau visualisasi poin yang rapi untuk bagian ini).*

4. **REKOMENDASI PENGAMAN SOSIAL-EKONOMI (SOCIOECONOMIC SAFEGUARDS)**:
   Berikan 3-4 butir rekomendasi program perlindungan sosial-ekonomi (safety nets) operasional-konkret untuk menyeimbangkan (offset) kompromi negatif yang teridentifikasi di atas (misal: Skema padat karya infrastruktur berskala kelurahan/desa untuk menyerap pengangguran, penerapan insentif pajak mikro spesifik demi meredam gejolak PAD komersial, asuransi kesehatan mandiri, dll).

Gunakan bahasa ekonomi pembangunan mikro dan makro yang meyakinkan, padat, berbobot, ilmiah, dan solutif.
`;

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: promptString,
        config: {
          temperature: 0.65,
        },
      });

      res.json({ tradeoff: response.text });
    } catch (error: any) {
      console.error("Gemini Trade-off API Error in server.ts:", error);
      res.status(500).json({ error: error.message || "Terjadi kegagalan komunikasi dengan model AI Gemini." });
    }
  });

  // Vite development middleware OR static static folder in production
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server is running at http://0.0.0.0:${PORT}`);
  });
}

startServer();
