import { GoogleGenAI } from "@google/genai";
import type { Request, Response } from "express";

let aiClient: GoogleGenAI | null = null;

function getGenAI() {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY tidak ditemukan di environment. Silakan konfigurasi kunci API Anda di Settings.");
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

function formatGeminiError(error: any): string {
  const errMsg = error?.message || "";
  const errStr = typeof error === 'object' ? JSON.stringify(error) : String(error);

  if (
    errMsg.includes("quota") || 
    errMsg.includes("RESOURCE_EXHAUSTED") || 
    errMsg.includes("429") ||
    errStr.includes("quota") ||
    errStr.includes("RESOURCE_EXHAUSTED") ||
    errStr.includes("429")
  ) {
    return "⚠️ **Batas Kuota Layanan Tercapai (Quota Exceeded)**\n\nMaaf, batas kuota harian dari layanan cerdas Google Gemini API (Free Tier) untuk aplikasi ini telah tercapai (maksimum 20 permintaan per hari).\n\n**Solusi:**\n1. Harap tunggu beberapa beberapa saat agar kuota direset oleh sistem.\n2. Jika Anda memasang aplikasi ini secara mandiri, masukkan `GEMINI_API_KEY` berbayar Anda pada pengaturan Environment Variables.";
  }

  return errMsg || "Terjadi kegagalan komunikasi dengan model AI Gemini.";
}

export default async function handler(req: Request, res: Response) {
  // Enable CORS
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,OPTIONS,PATCH,DELETE,POST,PUT");
  res.setHeader(
    "Access-Control-Allow-Headers",
    "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version"
  );

  if (req.method === "OPTIONS") {
    res.status(200).end();
    return;
  }

  if (req.method !== "POST") {
    res.status(405).json({ error: "Method Not Allowed" });
    return;
  }

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
    console.error("Vercel Serverless Function Error /generate-tradeoff:", error);
    res.status(500).json({ error: formatGeminiError(error) });
  }
}
