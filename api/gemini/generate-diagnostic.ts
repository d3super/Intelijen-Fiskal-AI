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
    console.error("Vercel Serverless Function Error /generate-diagnostic:", error);
    res.status(500).json({ error: formatGeminiError(error) });
  }
}
