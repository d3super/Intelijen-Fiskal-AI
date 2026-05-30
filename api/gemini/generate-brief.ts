import { GoogleGenAI } from "@google/genai";
import type { Request, Response } from "express";

let aiClient: GoogleGenAI | null = null;

function getGenAI() {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY tidak ditemukan di environment. Sila konfigurasi kunci API Anda di Vercel Environment Variables.");
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
    console.error("Vercel Serverless Function Error /generate-brief:", error);
    res.status(500).json({ error: formatGeminiError(error) });
  }
}
