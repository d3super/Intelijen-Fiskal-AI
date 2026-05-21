# PROPOSAL INOVASI DATA STORYTELLING: FISCAL RADAR
**Sandi Kebijakan Masa Depan: Pemodelan Terpadu Dinamika Fiskal & Simulasi Makroekonomi Regional**

---

## 1. Identitas Proyek & Abstrak

*   **Nama Aplikasi:** Fiscal Radar
*   **Platform Utama:** Dashboard Policy Sandbox & Executive Monitoring System
*   **Tema Inovasi:** *Subnational Macro-Fiscal Storytelling through Interactive Partial Equilibrium Sandbox*
*   **Target Audiens Juri / Kompetisi:** Kementerian Keuangan (DJPb), Kementerian PPN/Bappenas, Bappeda Provinsi/Kabupaten/Kota, Akademisi, dan Analis Kebijakan Publik.

### Abstrak
Kebijakan fiskal di tingkat subnasional sering kali dirumuskan tanpa visibilitas dampak ekonomi riil jangka pendek dan menengah. Model-model yang ada umumnya bersifat "historis-statistis"—menunjukkan apa yang terjadi tanpa memprediksi sirkulasi dampak sisa (residual impact). **Fiscal Radar** hadir sebagai solusi inovasi *data storytelling* interaktif yang menjembatani kesenjangan tersebut melalui pendekatan **Static Partial Equilibrium Fiscal Multiplier Model** yang telah disesuaikan dengan parameter struktural regional (efisiensi belanja, kebocoran wilayah, ketergantungan transfer, dan kapasitas stres kas). Proposal use case ini menguraikan bagaimana Fiscal Radar merajut angka-angka penganggaran kering menjadi narasi kebijakan yang intuitif, menyelamatkan pengambil keputusan dari "austeritas buta" dan mempercepat pertumbuhan PDRB yang kredibel.

---

## 2. Urgensi Masalah (The Visual Narrative Problem)

### Masalah 1: "Policy in the Dark" (Kebutaan Multiplier)
Pemerintah Daerah sering kali dipaksa melakukan kalkulasi belanja belanja modal (infrastruktur), pegawai, dan sosial tanpa mengetahui secara pasti nilai *multiplier* riilnya terhadap Produk Domestik Regional Bruto (PDRB). Akibatnya, penghematan anggaran (austeritas) atau ekspansi pajak (PAD) sering kali memicu kontraksi ekonomi mendalam tanpa diprediksi sebelumnya.

### Masalah 2: Data Makroekonomi yang Menjemukan
Laporan APBD dan data PDRB disajikan dalam format spreadsheet ratusan halaman atau bagan statis. Angka-angka ini kehilangan jiwanya karena tidak ada hubungan dinamis di antara mereka. Seorang Bupati atau Kepala Bappeda tidak dapat melihat dampak waktu nyata (*real-time link*) antara keputusan memotong anggaran perjalanan dinas sebesar 10% dengan peningkatan stimulus daya beli masyarakat lokal.

### Masalah 3: Pengingat Keberlanjutan yang Terlambat
Peringatan defisit anggaran atau potensi sanksi kas sering kali baru disadari setelah tahun anggaran berakhir ketika Laporan Hasil Pemeriksaan (LHP) terbit. Sistem simulasi dini sangat minim di tingkat lokal.

---

## 3. Komponen Inovasi Solusi: "Fiscal Radar"

Fiscal Radar mengemas rumitnya rumus-rumus ekonometrika makro ke dalam antarmuka interaktif yang dipisahkan menjadi 3 komponen besar visual storytelling:

```
  [ INPUT DATA FISKAL ] ---> [ MODEL ENGINES (IMF/OECD Multipliers) ] ---> [ LIVE VISUAL STORYTELLING ]
  - APBD Realisasi           - Lag structure (Capital vs Social)            - Real GDP Growth Impact %
  - PDRB Harga Berlaku       - Spending Efficiency Index                    - Deficit Debt Ratio Warning
  - Target PAD/Belanja       - Regional Leakage & Stress Penalty            - Interactive Policy Presets
```

### Parameter Utama Regional yang Dimodelkan:
1.  **Spending Efficiency Index (Koefisien Efisiensi):** Mengukur seberapa optimal daerah mentransmisikan anggaran belanja menjadi pembangunan fisik tanpa korupsi atau inefisiensi administrasi.
2.  **Regional Leakage Index (Indeks Kebocoran Wilayah):** Menganalisis seberapa banyak sirkulasi uang belanja lokal yang mengalir keluar ("bocor") untuk mengimpor barang konstruksi dari luar daerah.
3.  **Fiscal Stress Penalty:** Algoritma penalti otomatis yang memotong daya multiplier jika rasio defisit melampaui batas aman undang-undang fiskal daerah (5% dari PDRB).

---

## 4. Kasus Penggunaan Mendalam (Detailed Use Case Scenarios)

Mari bedah skenario storytelling interaktif yang dipresentasikan selama kompetisi:

### Skenario 1: Jebakan Austeritas Daerah (The Austerity Trap)
*   **Latar Belakang Narasi:** Kabupaten Jayakarta tertatih-tatih di kurva pemulihan ekonomi dengan pertumbuhan baseline rendah sebesar **4.5%**. Daerah ini memiliki tingkat ketergantungan transfer pusat yang amat tinggi (**70%**). Bappeda mengusulkan pengetatan moneter internal: menaikkan rasio PAD sebesar **20%** secara drastis melalui simplifikasi tarif retribusi tanpa menambah alokasi Belanja Modal (Infrastruktur).
*   **Interaksi Storytelling pada Fiscal Radar:**
    1.  User memilih daerah "Jayakarta" dan menggeser slider **PAD Increase ke +20%**, dan menggeser **Capital Expenditure Increase ke 0%**.
    2.  **Efek Visual Seketika:** Warna panel Growth meluncur turun dari hijau stabil menuju merah menyala di angka **1.1%** pertumbuhan ekonomi.
    3.  Sistem secara dinamis mendeteksi kondisi ini dan meluncurkan alert bertajuk: **"Austeritas Fiskal Berbahaya"** di layar diagnostik.
    4.  *The Data Story:* Fiscal Radar menceritakan kepada Kepala Dinas bahwa penarikan pajak berlebihan di tengah ketiadaan suntikan belanja infrastruktur menyedot likuiditas dari kantong rumah tangga mikro, mematikan roda ekonomi lokal dalam waktu singkat.

### Skenario 2: Alokasi Pro-Growth Seimbang (The Balanced Accelerator)
*   **Latar Belakang Narasi:** Provinsi Surabaya Barat ingin mendorong percepatan PDRB melompat di atas tingkat pertumbuhan saat ini. Mereka memiliki cadangan efisiensi belanja menengah (**65%**). Ada perdebatan antara memotong anggaran pegawai yang tidak produktif untuk dipindahkan ke belanja modal vs bantuan sosial.
*   **Interaksi Storytelling pada Fiscal Radar:**
    1.  User mengaktifkan Preset **"Pro-Infrastruktur / Pro-Growth"**.
    2.  Sistem otomatis memposisikan penambahan Belanja Modal **+25%**, melakukan perampingan Belanja Pegawai **-10%**, dan memberikan stimulus minor Bantuan Sosial **+5%**.
    3.  **Efek Transmisi Model:** Meskipun pemotongan belanja pegawai menahan konsumsi bruto aparatur sipil secara sementara (kontraksi minor **-0.05%**), suntikan masif ke infrastruktur dengan multiplier tinggi (**1.4x**) berhasil melontarkan total pertumbuhan PDRB Jayakarta naik hingga **+1.25%** net positif.
    4.  *The Data Story:* Grafik batang perbandingan di layar menunjukkan peningkatan ruang fiskal yang sehat, sementara daftar rekomendasi otomatis menyarankan: *"Porsi Belanja Pegawai kini sudah di bawah ambang waspada (30% total APBD), sisa anggaran diproyeksikan aman dialihkan ke konstruksi jangka panjang"*

---

## 5. Nilai Tambah Teknis & Ekonometrika Model (Methodology Backbone)

Untuk memenangkan kompetisi inovasi, model matematika di balik storytelling harus teruji secara akademis dan empiris. Fiscal Radar menerapkan **Static Partial Equilibrium Fiscal Multiplier Model** dengan detail berikut:

### Rumus Perhitungan Guncangan Pertumbuhan (GDP Shock Impact)
$$\text{GDP Impact}_c = \left( \frac{\Delta \text{Fiscal Shock}_c}{\text{PDRB Regional}} \times 100 \right) \times \text{Multiplier}_c \times \text{Lag}_c \times \text{Efficiency} \times (1 - \text{Leakage}) \times \text{Stress Penalty}$$

*Dimana $c$ merepresentasikan kategori instrumen fiskal (Belanja Modal, Sosial, Pegawai, PAD, atau Transfer).*

### Tabel Parameter Rigor Keuangan:

| Instrumen | Multiplier Baseline | Lag Tahun Dasar | Justifikasi Makroekonomi |
| :--- | :---: | :---: | :--- |
| **Belanja Modal (Infrastruktur)** | `+1.4` | `0.35` (35%) | Kontrak sipil berjalan multi-tahun, dampak di tahun dasar tertahan lag logistik panjang. |
| **Belanja Sosial (Transfer Langsung)** | `+1.2` | `0.85` (85%) | Rumah tangga berpendapatan rendah memiliki *Marginal Propensity to Consume (MPC)* tinggi. Dana langsung dibelanjakan untuk komoditas dasar daerah. |
| **Kenaikan PAD (Pajak Daerah)** | `-0.6` | `0.70` (70%) | Mengurangi daya beli masyarakat lokal dan membatasi sisa kas sirkulasi mikro. |
| **Belanja Pegawai (Wage Bill)** | `-0.3` | `0.50` (50%) | Efisiensi birokrasi memperbaiki ruang fiskal, namun pemotongan upah menahan konsumsi sekunder dalam wilayah. |
| **Dana Alokasi Pusat (Transfer)** | `-0.2` | `0.40` (40%) | Variabilitas transfer pusat berdampak langsung pada kelancaran program andalan daerah. |

---

## 6. Skenario Diagnostik & Indikator Risiko Otomatis

Aplikasi ini menyajikan visual storytelling melalui indikator risiko real-time:
*   **Defisit Anggaran terhadap PDRB:** Undang-Undang membatasi defisit daerah. Fiscal Radar secara dinamis mendeteksi hal ini. Jika simulasi proyeksi defisit melampaui **5.0%**, model secara otomatis mengaktifkan penalti multiplier makro karena adanya ketidakpastian iklim investasi lokal.
*   **Indeks Penyeimbang Kebijakan (Priority Advisor recommendations):** Menggunakan basis prioritas pintar (*smart priority framework*) untuk menghasilkan arahan kebijakan spesifik yang dapat langsung dipresentasikan pengguna kepala daerah dalam sidang anggaran daerah.

---

## 7. Keunggulan Desain untuk Kompetisi (Storytelling Advantage)

Dalam kompetisi *Data Storytelling*, aspek penyajian visual dinamis adalah faktor utama kemenangan. Fiscal Radar dirancang khusus dengan fitur storytelling berikut:

1.  **Immersive Presets Buttons:** Satu klik mengubah seluruh narasi. Juri kompetisi dapat langsung beralih dari skenario krisis (*austeritas ekstrim*) ke skenario optimis (*Balanced Accelerator*) tanpa perlu memikirkan parameter di belakang layar.
2.  **Immediate Micro-Metrics Breakdown (Impact Badges):** Menampilkan perombakan persentase pertumbuhan spesifik untuk masing-masing instrumen belanja secara komparatif. Juri dapat langsung memahami pemicu utama kenaikan atau penurunan PDRB.
3.  **Clean, High-Contrast UI Layout:** Dibangun menggunakan palet warna professional (slate, indigo, emerald) serta visualisasi grafik responsif Recharts yang modern, menjamin daya tarik visual maksimal saat presentasi langsung di depan dewan juri/auditor.

---

*Fiscal Radar merupakan inovasi yang meyakinkan bahwa data fiskal daerah tidak harus dingin dan membosankan. Melalui perpaduan matematika IMF yang solid dan kemudahan interaksi sandbox, Fiscal Radar adalah jembatan emas bagi masa depan data storytelling kebijakan fiskal subnasional di Indonesia.*
