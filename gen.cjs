const fs = require('fs');
const docx = require('docx');
const { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } = docx;

function createHeading(text, level) {
    return new Paragraph({
        heading: level,
        spacing: { before: 240, after: 120 },
        children: [new TextRun({ text: text })]
    });
}

function createText(text) {
    return new Paragraph({
        spacing: { after: 120 },
        children: [new TextRun({ text: text })]
    });
}

function createBullet(text) {
    return new Paragraph({
        bullet: { level: 0 },
        spacing: { after: 60 },
        children: [new TextRun({ text: text })]
    });
}

const doc = new Document({
    creator: "Fiscalia",
    title: "Use Case Aplikasi Fiscalia",
    sections: [{
        properties: {},
        children: [
            new Paragraph({
                heading: HeadingLevel.TITLE,
                alignment: AlignmentType.CENTER,
                children: [
                    new TextRun({
                        text: "USE CASE APLIKASI FISCALIA",
                        bold: true,
                    })
                ]
            }),
            new Paragraph({
                alignment: AlignmentType.CENTER,
                spacing: { after: 400 },
                children: [
                    new TextRun({
                        text: "Sandi Kebijakan Masa Depan: Pemodelan Terpadu Dinamika Fiskal & Simulasi Makroekonomi Regional"
                    })
                ]
            }),
            
            createHeading("1. Latar Belakang", HeadingLevel.HEADING_1),
            createText("Kebijakan fiskal di tingkat subnasional (pemerintah daerah) memegang peranan krusial dalam mempercepat pembangunan ekonomi, mengurangi kemiskinan, dan menciptakan kesejahteraan masyarakat. Sejak otonomi daerah, pemda memiliki wewenang mengelola Pendapatan Asli Daerah (PAD) dan Belanja Daerah. Namun, perumusan kebijakan fiskal daerah sering kali masih bersifat telat dan intuitif tanpa landasan kuantitatif yang mengukur dampak multiplier terhadap Produk Domestik Regional Bruto (PDRB)."),
            
            createHeading("2. Permasalahan", HeadingLevel.HEADING_1),
            createText("1. Austeritas Buta atau Ekspansi Tanpa Arah: Keputusan pemotongan anggaran atau penggenjotan pajak kerap diambil tanpa memodelkan efek pada ekonomi riil."),
            createText("2. Data Silo dan Dingin: Dokumen penganggaran yang masif membuat data sulit dipahami secara cepat oleh pengambil keputusan tingkat atas."),
            createText("3. Kurangnya Tools Simulasi Aktif: Tidak ada instrumen 'sandbox' interaktif untuk mensimulasikan skenario 'what-if' ekonomi secara mandiri tanpa tenaga ahli statistik."),

            createHeading("3. Tujuan", HeadingLevel.HEADING_1),
            createText("Membangun sebuah 'Executive Policy Sandbox' bernama Fiscalia yang menyederhanakan rumitnya data APBD dan PDRB menjadi narasi visual interaktif, mengemas pemodelan ekonometrika ke dalam UI responsif agar perumusan kebijakan pemerintah daerah lebih adaptif, dapat dievaluasi langsung, dan berbasis bukti (evidence-based)."),

            createHeading("4. Target Pengguna", HeadingLevel.HEADING_1),
            createBullet("Kepala Daerah (Gubernur/Bupati/Wali Kota): Top eksekutif pegambil keputusan strategis APBD."),
            createBullet("Bappeda (Badan Perencanaan Pembangunan Daerah): Merancang arah pembangunan makroekonomi daerah."),
            createBullet("BPKAD (Badan Pengelola Keuangan dan Aset Daerah): Manajerial arus kas, kapasitas fiskal, pelacakan defisit/surplus."),
            createBullet("Analis Kebijakan / Peneliti Publik: Evaluator pergerakan kebijakan regional."),

            createHeading("5. Sumber Data", HeadingLevel.HEADING_1),
            createBullet("Sistem Informasi Pemerintahan Daerah (SIPD) Kemendagri / SIKD Kementerian Keuangan."),
            createBullet("Badan Pusat Statistik (BPS) sebagai proksi metrik pertumbuhan ekonomi, demografi populasi, dan pengangguran."),
            createBullet("Database historis pemda internal (format Spreadsheet/CSV)."),

            createHeading("6. Jenis dan Jumlah Data", HeadingLevel.HEADING_1),
            createText("Jumlah Data: Mendukung ratusan baris data panel antar wilayah/kuartal (time series dari beberapa tahun ke belakang)."),
            createText("Jenis / Komposisi Data:"),
            createBullet("Identitas: Region/Wilayah, Provinsi, Kuartal, Tahun."),
            createBullet("Finansial Regional (Rupiah): Pendapatan Total, PAD, Dana Transfer Pusat, Belanja Total, Belanja Modal, Belanja Pegawai, Belanja Sosial, Utang (Debt), dan Keseimbangan (Fiscal Balance)."),
            createBullet("Makroekonomi & Demografi: Pertumbuhan PDRB (%), PDRB Harga Berlaku aktual, Populasi, Tingkat Pengangguran Terbuka (%)."),

            createHeading("7. Teknik Pengolahan Data", HeadingLevel.HEADING_1),
            createBullet("Estimasi & Interpolasi (Feature Engineering): Sistem otomatis menghitung variabel tersembunyi (misalnya Estimasi PDRB berbasis asumsi konstan rasio pendapatan jika data BPS kosong)."),
            createBullet("Transformasi Deret Waktu: Mengelompokkan dan mengurutkan data mentah multiregional berdasarkan rentang waktu yang terstruktur."),
            createBullet("Agregasi Penimbangan (Weighted Aggregation): Proses algoritma untuk menghitung Rasio Ketergantungan Transfer dan Beban Gaji terhadap postur besar anggaran."),

            createHeading("8. Metode Analisis", HeadingLevel.HEADING_1),
            createBullet("Fiscal Stress Scoring: Algoritma peringatan dini (Early Warning System) 4 kuadran risiko bersumber dari parameter rasio utang, rasio PAD, dll."),
            createBullet("Partial Equilibrium Fiscal Multiplier Model: Mengkalkulasi shock instrumen fiskal. Contoh: Belanja Modal diasumsikan multiplier positif (+1.4) dengan response lag, sedangkan Penaikan Pajak (PAD) berefek kontraksioner (-0.6)."),
            createBullet("Adjustment Factors: Modifikasi dampak menggunakan Efficiency Spending Index dan Regional Leakage Rate."),

            createHeading("9. Teknik Visualisasi", HeadingLevel.HEADING_1),
            createBullet("Insight Overview Cards: Dashboard metriks level tinggi dengan komponen tipografi tebal dan penanda pertumbuhan (hijau/merah)."),
            createBullet("Proportional Charts (Pie/Donut): Proporsi visual komposisi PAD, Transfer, Belanja Modal, dan Beban Pegawai."),
            createBullet("Comparative Metric Blocks: Tampilan grid komparatif antara Baseline Historis vs Simulated Result untuk menunjukan perbedaan proyeksi Defisit atau Surge PDRB."),
            createBullet("Risk Categorization Badges & Gauges: Label warna cerdas (Emerald, Amber, Rose) yang memvisualisasikan zonasi bahaya stres defisit."),

            createHeading("10. Storytelling Flow", HeadingLevel.HEADING_1),
            createText("Overview (Where are we now?): Mengenali diagnosis kelemahan fundamental struktur fiskal dari indikator historis di Dashboard Utama -> Exploration (What-if Scenario): Bermain dengan simulator instrumen pembentuk ekonomi (Pro-Infrastruktur, dll.) -> Resolution: Pemaparan hasil, skor bahaya dan saran kebijakan kompensasi yang di-generate via laporan komprehensif."),

            createHeading("11. Fitur Utama", HeadingLevel.HEADING_1),
            createBullet("Executive Monitoring Dashboard: Menyajikan KPI fundamental keuangan daerah (Sehat/Tidak Sehat)."),
            createBullet("Scenario Simulation Sandbox: Ruang main slider konfigurasi untuk memandu kebijakan."),
            createBullet("Google Sheets Sync (Cloud Storage Backup): Sinkronisasi dengan infrastruktur lembar kerja eksternal."),
            createBullet("Automated Executive Report Exporter: Meng-ekspor ringkasan analisis dalam rupa PDF (Print-ready)."),

            createHeading("12. Output Sistem", HeadingLevel.HEADING_1),
            createBullet("Real-time Simulated Projection Matrix: Proyeksi angka instan di layar komputer atas kondisi post-policy adjustment."),
            createBullet("Executive Briefing Report (PDF): Dokumen multipage resmi yang memuat profil pemda, skor diagnosis, analisis naratif dinamis yang dibuat komputer, dan metrik hasil simulasi beserta set prioritas tindakan."),

            createHeading("13. Teknologi", HeadingLevel.HEADING_1),
            createBullet("Front-End Layer: React.js, TypeScript (Struktur Tipe Kuat), Vite."),
            createBullet("Styling & UX: Tailwind CSS, modern dashboard design rules, animasi dari Lucide Icons."),
            createBullet("Autentikasi & Database Lapis 1: Firebase Auth (Identity)."),
            createBullet("Persistence Storage & Reporting: OAuth Google Sheets API (Data), jsPDF & html-to-image (Mesin Pembuat Snapshot PDF)."),

            createHeading("14. KPI Keberhasilan", HeadingLevel.HEADING_1),
            createBullet("Persentase Akurasi Prediksi Arah (Directional Simulation Match): Berapa kali simulasi arah (positif/negatif) selaras dengan evaluasi triwulan berjalan."),
            createBullet("Session Engagement: Waktu rata-rata pengguna berinteraksi di layer Sandbox."),
            createBullet("Productivity Turnaround: Mempersingkat waktu pemrosesan laporan Policy Brief dari beberapa hari kerja menjadi < 1 menit pembuatan otomatis."),

            createHeading("15. Keunggulan Inovasi", HeadingLevel.HEADING_1),
            createText("Platform pertama yang mengawinkan prinsip Ekonometrika Multiplier Anggaran Publik dengan prinsip Data Storytelling. Menyelesaikan masalah krusial di instansi pemerintahan dengan tidak memaksa pemimpin untuk menjadi analis data terlebih dahulu, melainkan mengubah data menjadi cerita (report PDF) siap guna."),

            createHeading("16. Dampak dan Pengembangan", HeadingLevel.HEADING_1),
            createText("Dampak Jangka Pendek: Mitigasi risiko kolapsnya APBD daerah karena belanja konsumtif; mendorong efisiensi PDRB."),
            createText("Rencana Pengembangan: Ekspansi dengan Large Language Models (LLM) untuk generatif narasi yang lebih dinamis melampaui rule-based generation, serta transisi penambahan modul Computable General Equilibrium (CGE) untuk memetakan dampak per-sektor (misal: Sektor Pertanian, Industri, dan Jasa).")
        ]
    }]
});

Packer.toBuffer(doc).then((buffer) => {
    fs.writeFileSync("public/Use_Case_Fiscalia_Update.docx", buffer);
    console.log("Written successfully");
}).catch(console.error);
