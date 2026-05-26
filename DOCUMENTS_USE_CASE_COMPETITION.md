# DOKUMEN USE CASE & PROPOSAL INOVASI DATA STORYTELLING: FISCALIA

**Sandi Kebijakan Masa Depan: Pemodelan Terpadu Dinamika Fiskal & Simulasi Makroekonomi Regional**

---

## 1. Latar Belakang (Background)

Kebijakan fiskal di tingkat subnasional (pemerintah daerah) memegang peranan krusial dalam mempercepat pembangunan ekonomi, mengurangi kemiskinan, dan menciptakan kesejahteraan masyarakat setempat. Sejak diimplementasikannya era Otonomi Daerah di Indonesia, pemerintah daerah diberikan wewenang besar untuk mengelola Pendapatan Asli Daerah (PAD) serta mengalokasikan Belanja Daerah. 

Namun, perumusan kebijakan fiskal daerah sering kali menghadapi tantangan berat berupa **"Austeritas Buta" (Blind Austerity)** atau **"Ekspansi Tanpa Arah" (Expansive Disconnect)**. Pengambil keputusan, seperti Kepala Daerah (Gubernur/Bupati/Wali Kota), Bappeda, dan Badan Pengelola Keuangan Daerah (BPKAD), kerap kali merancang struktur APBD tanpa visibilitas kuantitatif terhadap dampaknya pada Produk Domestik Regional Bruto (PDRB) riil di jangka pendek maupun menengah. Penghematan pengeluaran atau penggenjotan pajak/retribusi daerah sering diambil secara instinktif tanpa memodelkan efek multiplier ekonomi riil. 

Selain itu, dokumen penganggaran yang tebal dan rumit membuat data keuangan menjadi "dingin" dan tidak ramah bagi pimpinan daerah yang membutuhkan kesimpulan cepat yang kredibel. **Fiscalia** hadir sebagai jembatan inovatif berbentuk platform *Executive Policy Sandbox* yang mengemas rumitnya rumus-rumus ekonometrika makro ke dalam narasi visual interaktif (*interactive data storytelling*), menyelamatkan pengambil keputusan dari kegelapan formulasi kebijakan publik.

---

## 2. Gambaran Umum Aplikasi (General Overview)

**Fiscalia** adalah aplikasi analisis keuangan subnasional terintegrasi yang menggabungkan kemampuan pemantauan kondisi fiskal historis (*Historical Executive Monitoring*) dengan simulasi skenario kebijakan masa depan (*Interactive Partial Equilibrium Policy Sandbox*). Built-in dengan kerangka kerja ekonometrika yang teruji secara global (IMF & OECD Subnational Guidelines), Fiscalia menyederhanakan data APBD dan PDRB menjadi cerita kebijakan yang berorientasi pada hasil tindakan (*actionable insights*).

Aplikasi ini memiliki pilar fungsi utama:
1.  **Eksekutif Dashboard:** Menyajikan metrik utama kesehatan keuangan daerah berbasis data historis yang diunggah.
2.  **Upload & Sinkronisasi Cloud:** Pengguna dapat mengunggah file excel/spreadsheet APBD makro secara instan, dan menyimpannya secara aman ke struktur Google Sheets pribadi yang terkoneksi langsung via integrasi Google OAuth dan Firebase Authentication.
3.  **Analisis Diagnostik Otomatis:** Menghasilkan narasi evaluasi cerdas yang mengevaluasi struktur PAD, rasio ketergantungan transfer pusat, efisiensi belanja pegawai, dan kelayakan utang daerah.
4.  **Sandbox Simulasi Skenario Kebijakan:** Memungkinkan pengguna mensimulasikan perubahan instrumen fiskal daerah (misal: akselerasi infrastruktur, stimulasi bantuan sosial, moratorium belanja pegawai, dan penyesuaian PAD) secara langsung menggunakan slider interaktif.
5.  **Ekspor Laporan PDF Eksekutif:** Memformulasikan dokumen ringkasan kebijakan (*policy brief*) 1-2 halaman yang rapi dan siap cetak untuk bahan sidang anggaran Kepala Daerah.

---

## 3. Jumlah dan Jenis Data (Data Volume & Typology)

Fiscalia mendukung pengolahan data *multi-regional* berskala dinamis, mulai dari tingkat Kabupaten/Kota tunggal, agregat Provinsi, hingga komparasi deret waktu historis lintas tahun atau kuartal (temporal series).

### A. Jumlah / Volume Data
*   **Kapasitas Pengolahan:** Mendukung ratusan baris data regional yang terstruktur rapi untuk pelacakan dinamis sepanjang tahun/kuartal (misal: analisis serial triwulanan dari `2020Q1` hingga `2025Q4`).
*   **Metode Masukan Data:** Dukungan pengunggahan berkas digital (Excel/CSV drag-and-drop), serta integrasi database cloud personal menggunakan Google Sheets API untuk menjamin persistensi jangka panjang.

### B. Jenis Data & Variabel (Typology)
Variabel yang diproses oleh Fiscalia meliputi tiga domain utama yang saling berkaitan erat secara spasial dan temporal:

| Kategori Variabel | Nama Variabel | Unit/Format | Deskripsi Operasional |
| :--- | :--- | :---: | :--- |
| **Identitas & Demografi** | Wilayah (Region) <br>Provinsi (Province) <br>Tahun (Year) <br>Kuartal (Quarter) <br>Penduduk (Population) | Teks <br>Teks <br>YYYY <br>YYYYQX <br>Jiwa | Identifikasi wilayah administrasi serta struktur demografi dasar daerah yang dianalisis. |
| **Keuangan Daerah (APBD)** | Revenue <br>PAD <br>Transfer <br>Expenditure <br>Capital Expenditure <br>Personnel Spending <br>Social Spending <br>Fiscal Balance <br>Debt | Nilai Nominal Rupiah | **Revenue:** Pendapatan total daerah. <br>**PAD:** Pendapatan asli (pajak/retribusi lokal). <br>**Transfer:** Dana bagi hasil/alokasi pusat (DAU/DAK). <br>**Expenditure:** Belanja total APBD. <br>**Capital Exp:** Belanja modal infrastruktur fisik. <br>**Personnel Spending:** Belanja gaji/tunjangan pegawai. <br>**Social Spending:** Belanja bantuan sosial & subsidi. <br>**Fiscal Balance:** Defisit/surplus (Pendapatan - Belanja). <br>**Debt:** Outstanding akumulasi utang daerah. |
| **Makroekonomi & Output** | GDP Growth <br>Unemployment <br>Regional GDP Current Price | Persentase (%) <br>Persentase (%) <br>Nilai Nominal Rupiah | **GDP Growth:** Laju pertumbuhan PDRB riil regional. <br>**Unemployment:** Tingkat Pengangguran Terbuka daerah. <br>**Regional GDP:** Nominal PDRB harga berlaku regional (fitur estimasi otomatis `Revenue * 6.5` jika kosong). |

---

## 4. Teknik Pengolahan Data (Advanced Data Processing & Calculations)

Data mentah APBD diolah menggunakan serangkaian algoritma statistik keuangan daerah untuk mengkristalkannya menjadi indeks analisis yang kredibel serta pemodelan simulasi dampak ekonomi.

### A. Kalibrasi Sinyal & Rekayasa Fitur (Feature Engineering)
Jika data PDRB Nominal tidak disediakan pengguna dalam lembar kerja, sistem melakukan estimasi menggunakan metode ekstrapolasi regional berbasis sirkulasi fiskal keuangan daerah:
$$\text{Estimated PDRB Regional} = \text{Revenue} \times 6.5$$

### B. Rumusan Indikator Analisis Keuangan Daerah

#### 1. Indeks Kapasitas Fiskal (Fiscal Capacity Index)
Mengukur kekuatan kemandirian anggaran daerah dalam mendanai kegiatannya sendiri tanpa tergantung dana transfer luar, diekspresikan dalam skala 0 - 100:
$$\text{Capacity Score} = \left( \frac{\text{PAD}}{\text{Revenue}} \times 100 \times 1.5 \right) + \left( \left(100 - \frac{\text{Transfer}}{\text{Revenue}} \times 100\right) \times 0.5 \right)$$

#### 2. Skor Stres Fiskal & Klasifikasi Risiko (Fiscal Stress Score)
Menaksir tingkat kerapuhan struktural keuangan daerah berdasarkan ambang batas peringatan dini keuangan negara. Nilai akhir (0 - 100) diklasifikasikan menjadi empat zona risiko (*Stable, Warning, High Risk, Severe Stress*). Setiap indikator berkontribusi maksimal 25 poin:
*   **Belanja Pegawai berlebih:** Jika $\frac{\text{Belanja Pegawai}}{\text{Total Belanja}} > 50\%$ (+25 poin); Jika antara $40\% - 50\%$ (+15 poin).
*   **Kelemahan Basis Pajak:** Jika $\frac{\text{PAD}}{\text{Total Pendapatan}} < 10\%$ (+25 poin); Jika antara $10\% - 20\%$ (+15 poin).
*   **Kandungan Ketergantungan:** Jika $\frac{\text{Transfer}}{\text{Total Pendapatan}} > 75\%$ (+25 poin); Jika antara $60\% - 75\%$ (+15 poin).
*   **Tekanan Defisit:** Jika Rasio Defisit terhadap Pendapatan $> 5\%$ (+25 poin); Jika antara $3\% - 5\%$ (+15 poin).

#### 3. Indeks Kesenjangan Pembangunan (Development Gap Index)
Mengukur tingkat disparitas infrastruktur sosialekonomi lokal berdasarkan rasio belanja pembangunan jaring sosial ekonomi:
$$\text{Development Gap} = 100 - \left( \frac{\text{Belanja Modal}}{\text{Total Belanja}} \times 100 \times 2 \right) - \left( \frac{\text{Belanja Sosial}}{\text{Populasi}} \times 0.01 \right)$$

### C. Pemodelan Simulasi Ekonometrika: Partial Equilibrium Multiplier Model
Model di balik simulasi sandbox Fiscalia menggunakan paradigma multiplier fiskal dinamis ber-lag (*Time-lagged Subnational Fiscal Multiplier*) disesuaikan dengan kontributor struktural daerah.

#### 1. Koefisien Multiplier Baseline & Lag Transmisi (Ekonometrika APBD)
*   **Belanja Modal (Infrastruktur):** Multiplier `+1.4`, Lag `0.35` (Proyek fisik konstruksi membutuhkan waktu konstruksi multi-tahun, berdampak perlahan di tahun dasar).
*   **Belanja Sosial:** Multiplier `+1.2`, Lag `0.85` (Masyarakat berpendapatan rendah memiliki *Marginal Propensity to Consume (MPC)* tinggi; bantuan langsung meningkatkan konsumsi domestik instan).
*   **PAD (Pajak Daerah):** Multiplier `-0.6`, Lag `0.70` (Penaikan tarif pajak/retribusi menyedot likuiditas pasar mikro).
*   **Belanja Pegawai (Gaji/Upah):** Multiplier `-0.3`, Lag `0.50` (Penghematan belanja operasional pegawai menekan daya beli aparatur namun memperluas ruang fiskal modal).
*   **Dana Transfer Pusat:** Multiplier `-0.2`, Lag `0.40`.

#### 2. Formula Estimasi Dampak Pertumbuhan PDRB (GDP Shock Impact)
Setiap perubahan guncangan instrumen belanja/pendapatan ($c$) dihitung secara proporsional terhadap PDRB regional nominal dengan mengalibrasi koefisien **Efisiensi Belanja (Efficiency)** dan **Kebocoran Wilayah (Leakage)**:
$$\text{GDP Impact}_c = \left( \frac{\Delta \text{Fiscal Shock}_c}{\text{PDRB Regional}} \times 100 \right) \times \text{Multiplier}_c \times \text{Lag}_c \times \text{Efficiency} \times (1 - \text{Leakage}) \times \text{Stress Penalty}$$

*   **Spending Efficiency Index (Koefisien Efisiensi):** Dihitung dinamis (40% - 95%) berdasarkan porsi belanja pegawai dan tingkat pengangguran daerah.
*   **Regional Leakage Index (Indeks Kebocoran Wilayah):** Ditentukan (15% - 55%) berdasarkan skala demografi penduduk (semakin besar daerah, semakin kecil kebocorannya).
*   **Stress Penalty:** Jika defisit hasil simulasi melampaui batas regulasi regional **5% dari PDRB**, daya guna multiplier pembangunan dipotong secara otomatis sebesar up to 60% sebagai representasi ketidakpastian iklim ekonomi lokal.

---

## 5. Jenis dan Komposisi Informasi (Information Architecture)

Fiscalia mengomposisikan data numerik menjadi empat lapis informasi yang disajikan secara hirarkis, kohesif, dan logis:

```
  [ LAYER 1: EXECUTIVE KPIs ]
  - Pertumbuhan PDRB Baseline vs Simulasi (%)
  - Total PAD, Transfer & Pendapatan Daerah (Rupiah)
  - Desain Anggaran APBD Aktual (Surplus/Defisit)
             |
             v
  [ LAYER 2: DIAGNOSTIC REPORT CARD ]
  - Evaluasi Struktur Pajak & Retribusi Daerah
  - Analisis Tingkat Kerawanan Stres Kas Daerah
  - Analisis Keberlanjutan Risiko Utang Daerah
             |
             v
  [ LAYER 3: DYNAMIC COMPARISON MATRIX ]
  - Visualisasi "Sebelum vs Sesudah" Intervensi Kebijakan
  - Skor Risiko Skenario & Indeks Peringatan Bahaya Defisit
             |
             v
  [ LAYER 4: PRIORITY POLICY RECOMMENDATIONS ]
  - Matriks Rekomendasi Pintar Lengkap dengan Tingkat Prioritas (High/Medium/Low)
```

1.  **Metrik Utama Eksekutif (Executive KPIs):** Informasi level tinggi mengenai pertumbuhan ekonomi baseline, realisasi APBD keseluruhan, rasio defisit saat ini, penduduk, dan pengangguran.
2.  **Laporan Diagnostik Analitis (Analyst Insights):** Narasi interpretatif bahasa manusia (dalam bahasa Indonesia) yang menerangkan kesehatan keuangan daerah, efisiensi alokasi, serta tingkat ketergantungan transfer.
3.  **Matriks Dinamis Komparatif (Comparative Matrix):** Rincian data perubahan angka fiskal pasca simulasi kebijakan (misal: proyeksi surplus/defisit baru, guncangan PDRB bersih, persentase dampak instrumen mikro).
4.  **Rekomendasi Kebijakan Pintar (Policy Brief Advisors):** Rekomendasi spesifik atas lima aspek pengelolaan anggaran (Kapasitas Fiskal, Belanja Pegawai, Belanja Modal, Manajemen Kas Defisit, Efisiensi Penyerapan SiLPA) dilengkapi dengan tag prioritas beresolusi tinggi.

---

## 6. Teknik Visualisasi (Visualization Mechanics)

Dalam dunia data storytelling, visualisasi adalah media pengantar cerita terbaik. Fiscalia menggunakan pendekatan modern dengan mengadopsi palet warna berkelas (*high-contrast slate-indigo-emerald*) serta grafik responsif interaktif yang tidak menyulitkan mata pengguna:

*   **Visualisasi KPI Ringkasan Eksklusif (Insight Overview Cards):** Menampilkan metrik moneter penting dengan porsi font berukuran besar, label humanis, serta tag indikator arah (panah tren positif/negatif).
*   **Visualisasi Proporsi Pie Chart (Recharts):** Memetakan fragmentasi penerimaan daerah (PAD vs Transfer) dan pengeluaran daerah (Belanja Pegawai, Modal, Sosial, dll.) secara visual untuk mendeteksi inefisiensi alokasi dengan cepat.
*   **Visualisasi Grafik Batang Berkelompok (Stacked/Grouped Bar Charts):** Membandingkan secara langsung nilai anggaran ril histori dengan komponen estimasi hasil simulasi kebijakan masa depan.
*   **Panel Peringatan Masalah Fiskal (Alert & Warning Badges):** Indikator visual bertenaga warna dinamis (Merah/Kuning/Hijau) yang berubah real-time saat pengguna menggeser slider kebijakan di layar kebijakan, merepresentasikan pergerakan batas defisit atau guncangan ekonomi kritis.
*   **Speedometer Indeks Risiko (Scenario Risk Gauge):** Penunjuk tingkat kerentanan skenario yang disimulasikan dari nilai 0 hingga 100 dengan status predikat lugas (Rendah, Sedang, Tinggi, Kritis).

---

## 7. Jenis Output yang Dihasilkan (Actionable Deliverables)

Fiscalia memproduksi tiga representasi luaran nyata (*clear artifacts*) yang menjadi andalan pengambil kebijakan dalam ruang konferensi eksekutif:

### A. Live Policy Simulation Sandbox
Media bermain interaktif real-time di UI perangkat yang langsung menghitung dampak makro secara elastis. Pengguna dapat memilih Preset Skenario populer dengan satu klik cepat:
1.  **Pro-Infrastruktur:** Menggenjot belanja modal (+25%) dengan membagi beban efisiensi belanja pegawai.
2.  **Proteksi Sosial:** Meningkatkan asupan jaringan pengaman sosial jaminan perlindungan daerah (+30%).
3.  **Ekspansi PAD:** Fokus optimalisasi retribusi dan pajak daerah (+15%).
4.  **Austeritas Ketat:** Melakukan pengetatan masif dan penghematan ketat untuk penyelamatan kas dari ancaman stres defisit berat.

### B. Google Sheets Cloud Synchronizer
Penyimpanan data yang tangguh dan terorganisir di cloud. Platform secara dinamis membuat spreadsheet baru di Google Drive pengguna, melabeli kolom secara rapi, melakukan transfer data bulk, dan menarik kembali data tersebut ke antarmuka aplikasi dengan sangat cepat secara real-time.

### C. Laporan Briefing Eksekutif PDF Formal (Executive Briefing PDF)
Dokumen resmi lapor-cetak (*print-ready*) terformat yang diproduksi secara instan melalui klik tombol. Berbeda dari cetak layar mentah (*raw screenshot*), laporan PDF Fiscalia diformulasikan cerdas menggunakan skema kalkulasi multi-page fleksibel yang secara otomatis melakukan pemisahan seimbang (*page-breaking*) apabila konten melebihi batas tinggi kertas A4 standar. Sehingga, dokumen tidak akan terpotong secara kasar (*unformatted cropping*).

Laporan PDF memuat secara komprehensif:
*   **Nama Daerah & Provinsi resmi.**
*   **Periode Analisis** yang dipilih (misal: Tahun 2025Q1).
*   **Metrik Status Indeks Utama** (Skor Stres Fiskal, Indeks Kapasitas Fiskal, Ketergantungan Transfer).
*   **Narasi Diagnostik Lengkap** Fiscalia yang menyajikan analisis keterpaduan APBD-PDRB berbobot tinggi.
*   **Hasil Simulasi Kebijakan Mendalam** sesuai opsi Skenario yang sedang dipilih di aplikasi (dilengkapi rincian persentase shock instrumen, parameter efisiensi belanja/kebocoran daerah, proyeksi PDRB, status defisit, peringkat risiko baru, serta rekomendasi penyeimbang fiskal berskala prioritas tinggi/rendah).

---

*Fiscalia membuktikan bahwa data fiskal daerah tidak harus dingin dan membosankan. Melalui pengawinan ekonometrika IMF yang kokoh dengan kemudahan platform sandbox, Fiscalia merupakan langkah emas menuju masa depan perumusan kebijakan subnasional berbasis data riil di Indonesia.*
