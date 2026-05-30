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
    const { messages, currentRegionData, allRegionsCount } = req.body;

    if (!messages || !Array.isArray(messages)) {
      res.status(400).json({ error: "Kolom 'messages' kosong atau format tidak valid." });
      return;
    }

    // Sanitize messages to make sure it always starts with 'user' role
    let sanitizedMessages = [...messages];
    while (sanitizedMessages.length > 0 && sanitizedMessages[0].role === 'model') {
      sanitizedMessages.shift();
    }

    if (sanitizedMessages.length === 0) {
      res.status(400).json({ error: "Percakapan tidak memiliki pesan dari user." });
      return;
    }

    const ai = getGenAI();

    // We inject context about the current active region or loaded regions
    let regionContext = "";
    if (currentRegionData) {
      regionContext = `
=== KONTEKS DAERAH AKTIF SAAT INI ===
Nama Daerah: ${currentRegionData.Region}
Provinsi: ${currentRegionData.Province}
Tahun / Kuartal: ${currentRegionData.Year} ${currentRegionData.Quarter || ""}
PDRB Riil: Rp ${currentRegionData.Regional_GDP_Current_Price ? currentRegionData.Regional_GDP_Current_Price.toLocaleString("id-ID") : "N/A"}
Laju Pertumbuhan PDRB: ${currentRegionData.GDP_Growth?.toFixed(2)}%
PAD: Rp ${currentRegionData.PAD?.toLocaleString("id-ID")}
Dana Transfer: Rp ${currentRegionData.Transfer?.toLocaleString("id-ID")}
Total Pendapatan: Rp ${currentRegionData.Revenue?.toLocaleString("id-ID")}
Belanja Pegawai: Rp ${currentRegionData.Personnel_Spending?.toLocaleString("id-ID")}
Belanja Modal: Rp ${currentRegionData.Capital_Expenditure?.toLocaleString("id-ID")}
Belanja Sosial: Rp ${currentRegionData.Social_Spending?.toLocaleString("id-ID")}
Total Belanja: Rp ${currentRegionData.Expenditure?.toLocaleString("id-ID")}
Keseimbangan Fiskal: Rp ${currentRegionData.Fiscal_Balance?.toLocaleString("id-ID")}
Skor Stres Fiskal Baseline: ${currentRegionData.Fiscal_Stress_Score?.toFixed(1) || "N/A"}/100
Ketergantungan Dana Transfer: ${currentRegionData.Transfer_Dependency?.toFixed(1) || "N/A"}%
Kapasitas Fiskal: ${currentRegionData.Fiscal_Capacity_Index?.toFixed(1) || "N/A"}
`;
    }

    const systemInstruction = `
Anda adalah Asisten Sandbox AI Fiscalia (Fiscalia AI Sandbox Assistant) — seorang pakar virtual cerdas kebijakan fiskal regional dan perbendaharaan negara subnasional, yang dikembangkan khusus untuk Kantor Wilayah DJPb Provinsi Lampung.

Karakteristik Anda:
1. **Analitis & Berwibawa**: Jawaban Anda tajam, menggunakan terminologi anggaran formal Indonesia (seperti APBD, PAD, Belanja Modal, Belanja Pegawai, Belanja Sosial, Transfer Ke Daerah / TKD, SiLPA, dsb).
2. **Praktis & Solutif**: Anda selalu memberikan rekomendasi mitigasi atau program yang konkret bila ditanya tentang defisit, stress score tinggi, atau kemandirian fiskal rendah.
3. **Ramah & Edukatif**: Anda menjelaskan teori ekonomi dengan sederhana tapi mendalam (seperti konsep fiscal multiplier, regional leakage, dan ketahanan sosial daerah).
4. **Fokus pada Lampung**: Anda memiliki pemahaman yang mendalam tentang karakteristik ekonomi di kabupaten/kota di Lampung (misal: Bandar Lampung, Metro, Pringsewu, dsb).

Berikut adalah data total yang saat ini dimuat dalam aplikasi pengguna: ${allRegionsCount || 0} entitas daerah.
${regionContext}

Gunakan informasi konteks di atas untuk memberikan respons yang sangat relevan. Jika pengguna menanyakan analisis daerah aktif, gunakan data di atas untuk memberikan diagnosis instan. Jawablah menggunakan bahasa Indonesia yang santun, profesional, berbobot, dan ramah. Gunakan format markdown agar jawaban mudah dibaca.
`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: sanitizedMessages,
      config: {
        systemInstruction,
        temperature: 0.7,
      },
    });

    res.json({ reply: response.text });
  } catch (error: any) {
    console.error("Vercel Serverless Function Error /chat-assistant:", error);
    res.status(500).json({ error: formatGeminiError(error) });
  }
}
