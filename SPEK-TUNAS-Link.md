# Spesifikasi Web — TUNAS-Link: Konsol Sidik Jari Ontogeni

**Tim Keycherry** · Gita Sherina Simanjuntak · Marun Mathea Harefa · Natasya Manurung
Health Hackathon (Healthon) · 'Pharmanova' ITB 2026/2027 · Universitas Indonesia

Dokumen ini adalah spesifikasi lengkap untuk membangun satu halaman web interaktif.
Seluruh angka, pita ambang, rumus, dan salinan teks sudah final — bangun persis seperti tertulis.

---

## 1. Apa yang dibangun

Satu halaman web (single-page) yang memperagakan alur **dari chip organoid hati pediatrik menjadi
prediksi paparan obat**. Pengguna mengisi konfigurasi bets, menekan tombol pembacaan, melihat
nilai efluen masuk satu per satu, lalu menilai bets terhadap enam kriteria rilis (**Sidik Jari
Ontogeni**). Jika bets lulus, pengguna mengisi profil anak dan memilih obat, lalu mesin
**TUNAS-Link** menghasilkan kurva konsentrasi, prediksi paparan, dan sinyal risiko cedera hati.

Seluruh perhitungan berjalan **di sisi klien**. Tidak ada server, tidak ada basis data,
tidak ada pemanggilan API. Satu berkas HTML mandiri sudah cukup.

---

## 2. Aturan keras — jangan dilanggar

Bagian ini lebih penting daripada tampilan. Melanggarnya membuat produk salah secara ilmiah.

| Aturan | Alasan |
|---|---|
| **Bukan alat diagnosis pasien.** Profil pada Bagian 4 adalah *subjek simulasi* untuk model farmakokinetika, bukan rekam medis. Halaman tidak boleh menyatakan seorang anak menderita penyakit hati. | TUNAS-Hati adalah platform uji keamanan obat *in vitro*, bukan uji klinis. |
| **Bukan penetapan dosis klinis.** Keluaran adalah prediksi paparan dan margin keamanan in vitro. Kata "dosis yang dianjurkan" dilarang muncul. | Penetapan dosis menuntut parameter di luar jangkauan model. |
| **Sidik Jari Ontogeni adalah kriteria rilis bets**, yaitu penilaian terhadap *chip*, bukan terhadap anak. Dua hal ini harus tampil sebagai dua bagian terpisah. | Ini inti gagasan tim: "kami menjual spesifikasi, bukan klaim". |
| **Setiap angka membawa penanda sumber.** Lihat §8. Jangan menampilkan angka tanpa penanda. | Ambang tempatan tidak boleh menyamar sebagai angka berujukan. |
| **Label "PROTOTIPE ANTARMUKA · DATA SIMULASI" selalu terlihat** di kepala halaman. | Seluruh angka dihasilkan mesin simulasi. |
| Rifampisin, pirazinamid, dan asam valproat **dinonaktifkan** dengan keterangan "menunggu kalibrasi". | Rencana tim: isoniazid tunggal lebih dahulu, lalu obat lain terpisah. |

---

## 3. Palet warna — putih dan hijau muda

Gunakan CSS custom properties. Jangan menulis hex langsung di badan halaman.

### 3.1 Mode terang (utama)

```css
:root{
  --plane:#f2f9f5;        /* latar halaman — hijau muda sangat tipis */
  --surface:#ffffff;      /* permukaan kartu — putih murni */
  --surface-2:#e9f5ee;    /* permukaan kedua — hijau muda */
  --ink:#15241d;          /* teks utama */
  --ink-2:#4a5b53;        /* teks sekunder */
  --muted:#68756f;        /* label, sumbu, keterangan */
  --rule:#dcebe3;         /* garis pemisah */
  --rule-2:#c2ddd0;       /* garis tepi kolom isian */
  --brand:#1f6b4a;        /* hijau utama — tombol, logo, aksen */
  --brand-2:#2a7d58;      /* hijau kedua — eyebrow, pranala */
  --brand-soft:#ddf0e6;   /* hijau muda — latar aksen */
  --amber:#8a5d12;        /* penanda tempatan dan peringatan */
  --amber-soft:#f7f0df;
  --good:#0ca30c;  --good-soft:#e4f5e5;
  --warn:#fab219;  --warn-soft:#fdf3dd;
  --serious:#ec835a; --serious-soft:#fbeae2;
  --critical:#d03b3b; --critical-soft:#fae8e8;
  --s1:#2a78d6;           /* seri grafik 1 — subjek */
  --s2:#eb6834;           /* seri grafik 2 — pembanding dewasa */
  --grid:#e4efe9;  --axis:#c2ddd0;
}
```

### 3.2 Mode gelap (tombol pengalih di kanan atas)

```css
:root[data-theme="dark"]{
  --plane:#0b1310; --surface:#151e19; --surface-2:#1d2922;
  --ink:#eaf3ee; --ink-2:#b9c8c0; --muted:#879590;
  --rule:#26332c; --rule-2:#35453c;
  --brand:#6fc49d; --brand-2:#8ad4b2; --brand-soft:#17291f;
  --amber:#d9a44f; --amber-soft:#251f12;
  --good-soft:#152a17; --warn-soft:#2b2310;
  --serious-soft:#2a1d16; --critical-soft:#2b1616;
  --s1:#3987e5; --s2:#d95926;
  --grid:#26332c; --axis:#35453c;
}
```

### 3.3 Aturan pemakaian warna

- Kartu **putih murni** di atas latar hijau muda. Inilah yang memberi kesan bersih.
- Hijau **tidak pernah** dipakai sebagai warna seri grafik — hijau sudah menjadi warna merek
  dan warna status "lulus". Seri grafik memakai biru dan jingga (`--s1`, `--s2`), yang sudah
  diuji aman untuk buta warna.
- Warna status **selalu** disertai ikon dan tulisan (`✓ LULUS`, `✕ TIDAK LULUS`), tidak pernah
  warna saja.
- Teks tidak pernah memakai warna seri. Identitas dibawa oleh kotak warna di sebelah teks.

---

## 4. Tipografi

```html
<link href="https://fonts.googleapis.com/css2?family=Newsreader:opsz,wght@6..72,400;6..72,500;6..72,600&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
```

| Peran | Huruf |
|---|---|
| Judul bagian (h1–h4) | `'Newsreader', Georgia, serif` — bobot 500–600 |
| Antarmuka, isian, tabel, angka | `'Inter', system-ui, sans-serif` |
| Kode bets, kode chip | `ui-monospace, 'SF Mono', Menlo, monospace` |
| Angka dalam kolom tabel dan sumbu | tambahkan `font-variant-numeric: tabular-nums` |

Angka besar berdiri sendiri (angka pahlawan, nilai kartu statistik) memakai angka proporsional
biasa, **bukan** `tabular-nums`.

Format angka: **gaya Indonesia** — koma sebagai pemisah desimal (`9,2` bukan `9.2`).
Gunakan `toLocaleString('id-ID')`.

---

## 5. Tata letak

```
┌──────────────────────────────────────────────────────────┐
│ Kepala tetap (sticky): logo · TUNAS-Link · lencana        │
│ "PROTOTIPE ANTARMUKA · DATA SIMULASI" · tombol tema        │
├────────────┬─────────────────────────────────────────────┤
│ Rel kiri   │ Kolom utama — kartu bertumpuk                │
│ (sticky)   │                                              │
│ 6 langkah  │ Bagian 0 … Bagian 8                          │
│ + kartu    │                                              │
│ bets aktif │                                              │
└────────────┴─────────────────────────────────────────────┘
```

- Lebar maksimum 1240 px, `grid-template-columns: 232px 1fr`, jarak 34 px.
- Di bawah 980 px: satu kolom, rel menjadi tidak lengket.
- Kartu: `background: var(--surface)`, `border: 1px solid var(--rule)`, `border-radius: 14px`,
  bayangan sangat halus.
- Setiap kartu punya kepala: *eyebrow* huruf kapital kecil berwarna `--brand-2`, judul serif,
  satu paragraf pengantar.

### Rel langkah (kiri)

Enam langkah, masing-masing dengan nomor bulat, judul, dan keterangan satu baris:

1. **Konfigurasi bets** — Chip, varian, lini iPSC
2. **Pembacaan chip** — Efluen dan metabolit
3. **Sidik Jari Ontogeni** — Kriteria rilis bets
4. **Profil subjek** — Usia, kelamin, genotipe
5. **Obat uji** — Zat dan dosis
6. **Luaran TUNAS-Link** — Paparan dan risiko hati

Langkah selesai: bulatan hijau `--good` dengan tanda centang. Langkah aktif: bulatan
`--brand`. Klik langkah → gulir ke bagiannya.

Di bawahnya kartu kecil **BETS AKTIF** berisi kode bets (monospace) dan baris
`TUNAS-I · KC-REF-01`.

---

## 6. Isi tiap bagian

### Bagian 0 — Peta alur

Judul: **Dari chip berperfusi menjadi prediksi paparan**

Lima kotak berderet mendatar (saling menempel, sudut membulat di ujung):

| | Tahap | Keterangan |
|---|---|---|
| 1 | Chip berperfusi | Organoid dalam hidrogel gelatin ikan–alginat |
| 2 | Efluen dan metabolit | Kolorimetri harian dan LC-MS/MS |
| 3 | Sidik Jari Ontogeni | Kriteria rilis — lulus atau ditolak |
| 4 | TUNAS-Link | Ekstrapolasi ke model farmakokinetika |
| 5 | Laporan bets | Paparan per usia dan genotipe |

Kotak yang sudah dilewati diberi latar `--brand-soft`.

Di bawahnya kotak peringatan ambar:

> **Status prototipe.** Seluruh angka pada halaman ini dihasilkan oleh mesin simulasi, bukan oleh
> pembacaan chip yang sesungguhnya. Keluaran berupa **prediksi paparan** dan **sinyal risiko hati
> in vitro** — bukan penetapan dosis klinis dan bukan diagnosis pasien. Lihat Bagian 7.

### Bagian 1 — Konfigurasi bets

Judul: **Chip, varian usia, dan lini iPSC**
Pengantar: *Satu lini iPSC diturunkan menjadi seluruh varian usia dari stok beku yang sama,
sehingga perbandingan antar-usia bersifat isogenik.*

Empat kolom isian:

| Kolom | Jenis | Nilai awal | Keterangan di bawah |
|---|---|---|---|
| Kode bets | teks | `KC-B-2026-014` | Menentukan benih acak simulasi — bets yang sama selalu memberi hasil yang sama. |
| Kode chip | teks | `CHIP-07` | — |
| Varian usia organoid | pilihan | `TUNAS-I` | Rentang usia yang dimodelkan: *(ikut varian)* |
| Lini iPSC (panel Indonesia) | pilihan | `KC-REF-01` | *(ikut lini)* |

Baris kedua:

| Kolom | Jenis | Nilai awal | Keterangan |
|---|---|---|---|
| Hari perfusi saat pembacaan | pilihan 3 / 5 / 7 / 10 / 14 | `7` | Kriteria rilis dibaca pada hari ke-7 setelah fungsi hepatoselular stabil. Pilih hari ke-3 atau ke-5 untuk memperagakan bets yang ditolak. |
| Matriks dan badan chip | empat label statis | — | `Hidrogel gelatin ikan–alginat` · `Badan termoplastik potong-rakit` · `Tanpa Matrigel` · `Tanpa PDMS` |

### Bagian 2 — Pembacaan efluen dan metabolit

Gambar skema chip dalam SVG: persegi panjang membulat, satu saluran mendatar, **tiga ruang
jaringan** berisi bulatan hijau (organoid), port **Masukan** di kiri (lingkaran bergaris
`--brand`) dan **Efluen** di kanan (bergaris `--amber`). Saat pembacaan berjalan, enam titik biru
bergerak di sepanjang saluran (`<animateMotion>` dengan `begin` bertahap 0,56 detik).

Tombol **▶ Mulai pembacaan chip** dan **Atur ulang**.

Saat ditekan, tampilkan tujuh pesan berurutan setiap ±480 ms, sambil memunculkan kartu nilai
satu per satu:

1. Menyeimbangkan laju alir pada 30 µL/jam…
2. Mengambil efluen ruang 1–3…
3. Uji kolorimetri albumin dan urea…
4. Menyuntikkan sampel ke kromatografi cair…
5. Menghitung rasio metabolit penanda…
6. Menghitung koefisien variasi lintas chip…
7. Pembacaan selesai.

Tujuh kartu nilai (sebelum terisi, angkanya `—` berwarna pudar):

| Kartu | Satuan | Desimal |
|---|---|---|
| Albumin efluen | µg/hari/10⁶ sel | 1 |
| Urea efluen | µg/hari/10⁶ sel | 1 |
| Pelepasan LDH | % dari kendali | 1 |
| ALT efluen | U/L | 1 |
| Rasio glukuronida : sulfat | parasetamol | 2 |
| Laju asetilasi isoniazid | rasio metabolit | 3 |
| Koefisien variasi urea | % lintas chip | 1 |

Setelah selesai, buka Bagian 3 dan gulir ke sana.
Jika konfigurasi bets diubah setelah pembacaan, kunci kembali Bagian 3 dan tampilkan
pesan *"Konfigurasi berubah — baca ulang chip untuk memperbarui."*

### Bagian 3 — Sidik Jari Ontogeni

Judul: **Sidik Jari Ontogeni**
Pengantar: *Tidak ada bets yang dipakai sebelum lulus seluruh butir. Ambang diumumkan di muka;
kolom sumber menyatakan mana yang terikat rujukan dan mana yang masih ambang tempatan yang akan
diisi pada Fase 1.*

Tabel lima kolom: **Parameter dan metode · Nilai terukur · Ambang terima · Dasar ambang · Status**

- Baris lulus: latar `--good-soft` (opasitas ±42%), lencana `✓ LULUS` hijau.
- Baris tidak lulus: latar `--critical-soft` (opasitas ±80%), lencana `✕ TIDAK LULUS` merah.

Di bawah tabel, spanduk putusan:

- **Lulus** (latar `--good-soft`): *"Bets {kode} lulus seluruh butir — Varian {kode varian} pada
  lini {lini} memenuhi keenam kriteria rilis pada hari perfusi ke-{hari}. Bets boleh dipakai
  untuk pengujian obat."*
- **Ditolak** (latar `--critical-soft`): *"Bets {kode} ditolak — {n} butir tidak memenuhi ambang:
  {daftar}. Bets tidak digunakan. Ubah hari perfusi, chip, atau kode bets untuk membaca bets
  lain."* → kunci Bagian 4, 5, dan 6.

Keterangan penanda sumber di bawahnya (tiga kotak warna kecil): Berujukan · Interpolasi · Tempatan.

### Bagian 4 — Profil subjek simulasi

Judul: **Anak yang hendak dimodelkan**
Pengantar: *Profil ini adalah subjek simulasi untuk model farmakokinetika, bukan rekam medis.
Gunakan kode tersamar; data genetik disimpan tersamar dengan izin etik tersendiri.*

| Kolom | Jenis | Awal | Keterangan |
|---|---|---|---|
| Nama / kode subjek | teks | `SBJ-001` | Dianjurkan kode, bukan nama sebenarnya. |
| Jenis kelamin | Perempuan / Laki-laki | Perempuan | Dipakai untuk batas atas normal ALT. |
| Usia | angka + satuan (tahun/bulan/hari) | 4 tahun | Varian yang sesuai usia ini: *(hitung)* |
| Berat badan | angka + tombol `auto` | 16 kg | kilogram |

Tombol `auto` mengisi perkiraan berat: usia < 28 hari → 3,3 kg; < 1 tahun → `3,3 + bulan × 0,6`;
≥ 1 tahun → `2 × tahun + 8`.

**Panel farmakogenetik** (empat kolom):

| Kolom | Pilihan | Awal | Keterangan |
|---|---|---|---|
| NAT2 — fenotipe asetilator | cepat / menengah / lambat | menengah | Pada populasi Melayu Indonesia: cepat 10%, menengah 52%, lambat 38% ⟨8⟩ |
| NAT2 rs1495741 | GG / GA / AA | GG | Penanda risiko cedera hati pada regimen antituberkulosis. |
| UGT1A1 | \*1/\*1 / \*1/\*6 / \*6/\*6 | \*1/\*1 | Memengaruhi glukuronidasi parasetamol. |
| CYP2C19 | normal / menengah / lambat | normal | Dicatat pada laporan; tidak memengaruhi obat yang tersedia saat ini. |

Dua kolom tambahan: **Ko-medikasi** (Tidak ada / Rifampisin / Lain-lain) dan
**Riwayat gangguan hati sebelumnya** (Tidak ada / Ada).

**Peringatan otomatis** yang harus muncul bila berlaku:

- Varian chip tidak sesuai usia subjek → *"Bets dibaca pada varian X, sedangkan usia subjek jatuh
  pada rentang Y. Prediksi tetap dihitung, tetapi kesesuaian ontogeninya tidak dapat diklaim."*
- Usia 13–17 tahun → *"Varian remaja belum tersedia. Deret usia saat ini berhenti pada varian
  anak; varian remaja direncanakan pada Fase 2."*
- Fenotipe NAT2 subjek berbeda dari lini bets → catatan penjelas.

### Bagian 5 — Obat uji

Judul: **Zat yang dipaparkan pada chip**
Pengantar: *Urutan kalibrasi mengikuti rencana tim: isoniazid tunggal lebih dahulu, lalu
rifampisin dan pirazinamid terpisah, baru kombinasi — agar perubahan respons dapat ditelusuri
sumbernya.*

Pilihan obat, dosis (mg/kg), dan **dosis total terhitung** (angka besar, `dosis × berat`).
Tombol **▶ Jalankan TUNAS-Link**.

### Bagian 6 — Luaran

Urutan isi dari atas ke bawah:

1. **Angka pahlawan** — margin keamanan terkoreksi, ukuran ±52 px, berwarna sesuai kategori, di
   dalam kotak berlatar lembut sesuai kategori. Di sebelahnya judul `{kategori} — {obat} {dosis} mg/kg`
   dan satu paragraf penjelas.
2. **Enam kartu statistik**: Cmax diprediksi · AUC₀₋₂₄ · Waktu paruh · Tmax · Tetapan eliminasi ·
   Volume distribusi semu.
3. **Kotak sasaran paparan** (hanya isoniazid): tercapai atau belum.
4. **Grafik kurva konsentrasi** (§9).
5. **Kaitan dengan cedera hati** — dua kotak bersebelahan: *Jalur metabolik* dan *Pengali risiko
   pada profil ini* (berisi daftar pengali + meter margin).
6. **Kotak interpretasi** — kalimat yang disusun menurut kategori risiko.
7. **Masukan untuk perancangan pemantauan** — termasuk batas atas normal ALT dan ambang DILI.
8. **Rantai perhitungan** — tabel tiga kolom: Langkah · Nilai · Asal. Inilah yang membuat
   perhitungan dapat ditelusuri; jangan dihilangkan.
9. **Tombol ekspor** (§10).

### Bagian 7 — Batasan

Enam butir, masing-masing dengan tanda seru ambar, judul tebal, dan penjelasan:

1. **Bukan penetapan dosis klinis** — Keluaran TUNAS-Link adalah prediksi paparan per kelompok usia dan genotipe.
2. **Bukan diagnosis pasien** — Subjek pada Bagian 4 adalah profil simulasi.
3. **Hanya memodelkan hati** — Chip modular untuk disambung ke modul usus dan ginjal.
4. **Fenotipe janin bukan neonatus sejati** — Kesesuaian dinyatakan hanya pada parameter Sidik Jari Ontogeni.
5. **Cedera hati idiosinkratik sulit ditangkap** — Makrofag mirip sel Kupffer direncanakan pada varian lanjutan.
6. **Jalur oksidatif belum masuk versi 1** — Tidak ada penanda CYP2E1, sehingga sinyal parasetamol dibaca lewat rasio konjugasi.

Lalu **tanya jawab dua kolom** (kiri `T`, kanan `J`), empat pasang — lihat §11.

### Bagian 8 — Rujukan

Daftar bernomor 1–12, persis seperti §12.

---

## 7. Data tetap

### 7.1 Varian usia

| Kode | Nama | Rentang usia | Faktor kematangan `mat` |
|---|---|---|---|
| TUNAS-N | Neonatus | 0–28 hari | 0,18 |
| TUNAS-I | Bayi–balita | 29 hari – 5 tahun | 0,72 |
| TUNAS-C | Anak | 6–12 tahun | 0,95 |
| TUNAS-D | Dewasa (pembanding) | ≥ 18 tahun | 1,00 |

Pemetaan usia → varian: `< 28 hari` → N · `< 6 tahun` → I · `< 18 tahun` → C · selebihnya D.

### 7.2 Lini iPSC

| Kode | Nama | NAT2 | CYP2C19 | UGT1A1 |
|---|---|---|---|---|
| KC-REF-01 | acuan | menengah | normal | \*1/\*1 |
| KC-NAT2S-02 | NAT2 lambat | lambat | normal | \*1/\*1 |
| KC-C19S-03 | CYP2C19 lambat | menengah | lambat | \*1/\*6 |

Keterangan lini: *"{kategori} · NAT2 {fenotipe} · turunan sel punca pluripoten terinduksi dari
urine anak Indonesia."*

### 7.3 Pita ambang Sidik Jari Ontogeni

| # | Parameter | Metode | TUNAS-N | TUNAS-I | TUNAS-C | TUNAS-D | Sumber |
|---|---|---|---|---|---|---|---|
| 1 | Rasio CYP3A7 : CYP3A4 | 16α-hidroksilasi DHEA vs 1′-hidroksilasi midazolam | 4,0–20 | 1,0–4,0 | 0,25–1,0 | 0,02–0,25 | ⟨T⟩ |
| 2 | Aktivitas CYP1A2 (pmol/menit/10⁶ sel) | O-deetilasi fenasetin | 0,5–4 | 3–12 | 8–25 | 18–45 | ⟨T⟩ |
| 3 | Rasio glukuronida : sulfat parasetamol | LC-MS/MS | 0,24–0,46 | 0,45–0,68 | 0,60–0,95 | 1,45–2,20 | ⟨4⟩ / ⟨i⟩ untuk I |
| 4 | Laju asetilasi isoniazid | Rasio asetilisoniazid : isoniazid | *lihat bawah* | | | | ⟨1⟩ |
| 5a | Albumin (µg/hari/10⁶ sel) | Kolorimetri harian efluen | 8–40 | 12–55 | 15–70 | 18–80 | ⟨6⟩ |
| 5b | Urea (µg/hari/10⁶ sel) | Kolorimetri harian efluen | 20–90 | 28–120 | 35–150 | 40–170 | ⟨6⟩ |
| 6 | Koefisien variasi urea | Pemantauan harian lintas chip | < 15 % | < 15 % | < 15 % | < 15 % | ⟨5⟩ |

**Acuan klinis baris 3** (tampilkan di bawah pita): N 0,34 · I 0,55 · C 0,75 · D 1,80.

**Pita baris 4** dihitung: pita dasar menurut fenotipe NAT2 **lini** — lambat `0,12–0,38`,
menengah `0,50–0,92`, cepat `0,70–1,15` — lalu **dikalikan faktor `mat` varian**.
Nisbah ini diturunkan dari perbandingan tetapan eliminasi lambat : cepat = 0,254 : 0,653 ≈ 0,39.

### 7.4 Obat

| Obat | Status | ka (/jam) | V/F (L/kg) | k dasar (/jam) | Dosis awal |
|---|---|---|---|---|---|
| **Isoniazid** | terkalibrasi | 2,0 | cepat 0,953 · menengah 0,891 · lambat 0,777 ⟨1⟩ | cepat 0,653 · menengah 0,513 · lambat 0,254 ⟨1⟩ | 10 mg/kg |
| **Parasetamol** | parameter tempatan | 2,5 | 0,95 ⟨T⟩ | 0,25 ⟨T⟩ | 15 mg/kg |
| **Kafein sitrat** | parameter tempatan | 3,0 | 0,60 ⟨T⟩ | 0,14 ⟨T⟩ | 5 mg/kg |
| Rifampisin · Pirazinamid · Asam valproat | **nonaktif** | — | — | — | — |

**Pengali kematangan `kMat` menurut varian** (hanya parasetamol dan kafein):

| Obat | N | I | C | D |
|---|---|---|---|---|
| Parasetamol | 0,45 | 0,80 | 0,95 | 1,00 |
| Kafein sitrat | 0,07 | 0,55 | 1,15 | 1,00 |

**Ambang toksik in vitro `TC` (mg/L) menurut varian** ⟨T⟩:

| Obat | N | I | C | D |
|---|---|---|---|---|
| Isoniazid | 26 | 34 | 42 | 55 |
| Parasetamol | 120 | 150 | 180 | 210 |
| Kafein sitrat | 60 | 80 | 110 | 140 |

**Sasaran paparan isoniazid** ⟨2⟩: Cmax ≥ 3,0 mg/L dan AUC₀₋₂₄ ≥ 10,52 mg·jam/L.

---

## 8. Penanda sumber

Setiap angka diikuti superskrip kecil yang dapat disorot untuk melihat keterangan lengkap:

| Penanda | Warna | Arti |
|---|---|---|
| `[1]`–`[12]` | latar `--brand-soft`, teks `--brand` | **Berujukan** — terikat pada pustaka terbit |
| `[i]` | latar `--surface-2`, teks `--muted` | **Interpolasi** — antara dua titik usia berujukan |
| `[T]` | latar `--amber-soft`, teks `--amber` | **Tempatan** — ambang ditetapkan tim, diisi data Fase 1 |

---

## 9. Grafik kurva konsentrasi

- SVG buatan sendiri, `viewBox="0 0 720 300"`, lebar penuh.
- **Dua seri**: subjek (`--s1`, biru) dan pembanding dewasa (`--s2`, jingga). Garis tebal 2 px,
  ujung dan sambungan membulat.
- **Garis ambang toksik**: mendatar, `--critical`, putus-putus `6 5`, tebal 2 px, berlabel
  "Ambang toksik" di ujung kanan.
- **Penanda Cmax**: bulatan r=5 pada puncak kurva subjek, bercincin warna permukaan 2 px, dengan
  label `Cmax 9,2` di sebelahnya.
- **Legenda wajib** di atas grafik, tiga butir.
- **Jangan** memberi label di ujung kanan kedua kurva — keduanya bertemu di sana dan labelnya akan
  bertumpuk. Identitas dibawa legenda dan keterangan sorot.
- **Sumbu Y**: pilih langkah terbulat dari `[0,1 0,2 0,25 0,5 1 2 2,5 5 10 20 25 50 100 …]`,
  dicoba untuk 3, 4, dan 5 selang, lalu ambil sumbu paling rapat yang masih menampung nilai
  tertinggi × 1,12. Sumbu X: 0, 4, 8, 12, 16, 20, 24 jam.
- **Garis kisi** mendatar saja, tipis 1 px, warna `--grid`, tidak putus-putus.
- **Sorot**: garis bidik tegak mengikuti penunjuk + kotak keterangan berisi jam, konsentrasi
  subjek, dan konsentrasi pembanding.
- **Satu sumbu Y saja.** Jangan pernah membuat grafik bersumbu ganda.

---

## 10. Mesin perhitungan

### 10.1 Pembacaan chip (simulasi)

```js
// Benih acak ditentukan kode bets + chip + varian + lini + hari,
// sehingga konfigurasi yang sama selalu memberi hasil yang sama.
const seed = hashFNV1a(`${kodeBets}|${kodeChip}|${varian}|${lini}|${hari}`);
const r = xorshift(seed);

// Fungsi hepatoselular baru stabil pada hari ke-7.
const pInside = hari >= 7 ? 0.9997 : (hari === 5 ? 0.80 : 0.42);

for (const kriteria of daftarKriteria) {
  if (kriteria.maxOnly) {                       // koefisien variasi urea
    const denda = hari < 5 ? 1.9 : hari < 7 ? 1.25 : 1.0;
    nilai = Math.max(2.4, 8.2 * denda * (1 + (r()*2-1) * 0.42));
  } else {
    const masuk = r() < pInside;
    nilai = masuk
      ? lo + (hi - lo) * (0.18 + r() * 0.64)                       // di dalam pita
      : (r() < 0.5 ? lo * (0.52 + r()*0.34) : hi * (1.12 + r()*0.4)); // meleset
    if (hari < 5) nilai *= 0.72 + r() * 0.18;
  }
}
// Nilai tambahan: LDH ≈ 7,5 (±30%), ALT ≈ 11 (±35%)
```

Bets **lulus** hanya bila seluruh butir masuk pita (dan CV urea < 15%).

### 10.2 Faktor aktivitas dari chip

```js
// Obat menentukan butir mana yang dipakai:
//   isoniazid  → laju asetilasi isoniazid
//   parasetamol→ rasio glukuronida : sulfat
//   kafein     → aktivitas CYP1A2
const titikTengah = (lo + hi) / 2;
let chipFactor = nilaiTerukur / titikTengah;
chipFactor = Math.min(1.8, Math.max(0.45, chipFactor));
```

### 10.3 Pematangan dan usia (hanya isoniazid)

```js
const usiaBulan = usiaTahun * 12;
let matF = Math.pow(usiaBulan, 2) / (Math.pow(3.0, 2) + Math.pow(usiaBulan, 2)); // TM50 = 3 bulan
matF = Math.max(0.12, matF);
// Tetapan pustaka berasal dari kohort anak bermedian 3,8 tahun,
// jadi faktor usia dinormalkan pada 4 tahun — bukan ditumpuk.
const sizeF = Math.max(0.86, Math.min(1.10, 1 + 0.02 * (4 - usiaTahun)));
matF *= sizeF;
```

Untuk parasetamol dan kafein, ganti `matF` dengan `kMat[varian]` dari tabel §7.4.

### 10.4 Tetapan eliminasi efektif

```js
const comedF = (koMedikasi === 'rifampisin' && obat !== 'isoniazid') ? 1.35 : 1.0;
const kEff = kDasar * matF * chipFactor * comedF;
```

### 10.5 Model satu kompartemen, pemberian oral

```js
const A = dosisMgPerKg / V;              // mg/L
const f = ka / (ka - kEff);
const tmax  = Math.log(ka / kEff) / (ka - kEff);
const cmax  = A * f * (Math.exp(-kEff*tmax) - Math.exp(-ka*tmax));
const auc24 = A * f * ((1 - Math.exp(-kEff*24)) / kEff - (1 - Math.exp(-ka*24)) / ka);
const thalf = Math.LN2 / kEff;
// Kurva: t dari 0 sampai 24 jam, langkah 0,25 jam
const C = t => A * f * (Math.exp(-kEff*t) - Math.exp(-ka*t));
```

**Pembanding dewasa** memakai `k = kDasar(genotipe sama) × 0,9` dan `V` yang sama — sehingga
grafik memperlihatkan bahwa pada dosis mg/kg yang sama anak membuang obat lebih cepat daripada
dewasa bergenotipe sama ⟨1⟩.

### 10.6 Ambang toksik dan margin

```js
let tc = TC[obat][varian];
if (obat === 'isoniazid' && fenotipNAT2 === 'lambat') tc *= 0.72;   // akumulasi metabolit
if (obat === 'parasetamol') {
  if (ugt === '*6/*6') tc *= 0.68; else if (ugt === '*1/*6') tc *= 0.84;
}
tc *= 1 + (altEfluen - 11) / 110;        // chip dengan ALT basal lebih tinggi lebih rentan

const marginMentah = tc / cmax;
```

### 10.7 Pengali risiko genetik

```js
// rs1495741 dan fenotipe asetilator menandai determinan yang sama,
// jadi DIAMBIL YANG TERBESAR — bukan dikalikan. Ini penting.
let nat2Risk = 1;
if (rs1495741 === 'AA')      nat2Risk = Math.max(nat2Risk, 2.6);  // ⟨7⟩ 7,29×
if (fenotipNAT2 === 'lambat')nat2Risk = Math.max(nat2Risk, 1.9);  // ⟨9⟩ OR 3,45
let riskScore = nat2Risk;
if (riwayatHati === 'ada') riskScore *= 1.4;

const marginTerkoreksi = marginMentah / riskScore;
```

Berlaku hanya untuk isoniazid, rifampisin, dan pirazinamid.

### 10.8 Kategori risiko

| Margin terkoreksi | Kategori | Warna |
|---|---|---|
| ≥ 10× | Risiko rendah | `--good` |
| 3 – 10× | Perlu perhatian | `--warn` |
| 1 – 3× | Risiko tinggi | `--critical` |
| < 1× | Melampaui ambang in vitro | `--critical` |

Meter margin: lebar `= (log₁₀(margin) + 1) / 2 × 100 %`, dibatasi 0–100.

### 10.9 Terjemahan klinis

Batas atas normal ALT ⟨10⟩: **laki-laki 30 U/L · perempuan 24 U/L**.
Ambang cedera hati ⟨11⟩: **ALT ≥ 5 × batas atas normal**.
Tampilkan keduanya di kotak "Masukan untuk perancangan pemantauan", selalu dengan kalimat
pembuka *"Bagian ini adalah masukan berbasis bukti untuk perancangan studi, bukan perintah terapi."*

---

## 11. Salinan teks yang harus persis

### Interpretasi menurut kategori

| Kategori | Kalimat |
|---|---|
| Melampaui ambang | Puncak konsentrasi yang diprediksi melampaui ambang toksik yang terbaca pada chip. Pada kombinasi usia dan genotipe ini, dosis {d} mg/kg menempatkan subjek di atas konsentrasi tempat organoid mulai menunjukkan gangguan fungsi hepatoselular. |
| Risiko tinggi | Margin antara paparan yang diprediksi dan ambang toksik in vitro sempit. Pada populasi dengan ketidakmatangan enzim seperti varian {v}, selisih sesempit ini layak diperlakukan sebagai sinyal, bukan sebagai kebetulan. |
| Perlu perhatian | Margin berada pada rentang yang menuntut perhatian. Model memperkirakan paparan masih di bawah ambang toksik, tetapi jarak amannya belum lapang untuk populasi yang kapasitas metabolismenya sedang berubah cepat. |
| Risiko rendah | Margin lapang pada parameter yang diukur. Kelapangan ini hanya berlaku untuk jalur yang termasuk dalam Sidik Jari Ontogeni versi 1; cedera hati idiosinkratik tidak tertangkap oleh pembacaan ini. |

Tambahan bila asetilator lambat + isoniazid:
*"Pada kohort anak, asetilator lambat ditemukan pada 64,52% kasus cedera hati versus 21,12%
kelompok tanpa cedera hati ⟨7⟩."*

Tambahan bila varian neonatus:
*"Perlu diingat bahwa proses pematangan NAT2 pada bayi berat lahir rendah dan prematur belum
diketahui ⟨3⟩, sehingga fungsi pematangan yang dipakai model ini bersifat asumsi."*

### Jalur metabolik dan mekanisme

| Obat | Jalur | Mekanisme |
|---|---|---|
| Isoniazid | Asetilasi NAT2 → asetilisoniazid → hidrolisis menjadi asetilhidrazin | Pada asetilator lambat, isoniazid bertahan lebih lama dan jalur hidrolisis langsung menjadi hidrazin menguat; hidrazin dan asetilhidrazin adalah metabolit yang dikaitkan dengan cedera hepatoselular. |
| Parasetamol | Sulfasi dan glukuronidasi bersaing; sisanya menempuh oksidasi menjadi metabolit reaktif | Pada neonatus sulfasi menyumbang bagian terbesar klirens sedangkan glukuronidasi belum matang, sehingga rasio glukuronida terhadap sulfat jauh lebih rendah daripada dewasa. |
| Kafein sitrat | Demetilasi oleh CYP1A2 | Aktivitas CYP1A2 sangat rendah pada neonatus sehingga klirens kafein melambat dan paruh waktunya memanjang; jendela terapinya menjadi sempit pada apnea prematuritas. |

### Tanya jawab Bagian 7 (dua kolom)

| T | J |
|---|---|
| Angka pada chip itu hasil pengukuran atau simulasi? | Simulasi, dan dinyatakan di kepala halaman. Yang nyata adalah struktur kriteria rilisnya, ambang yang berujukan, dan parameter farmakokinetika isoniazid per genotipe NAT2. |
| Mengapa sebagian ambang ditandai tempatan? | Karena belum ada data Fase 1. Menandainya lebih jujur daripada mengisi angka yang terdengar meyakinkan. |
| Apakah konsol ini bisa dipakai di bangsal? | Tidak. Ini perkakas riset praklinis. Keluarannya masukan untuk perancangan studi dan jadwal pemantauan, bukan perintah terapi. |
| Mengapa isoniazid yang dikalibrasi lebih dahulu? | Karena tersedia data farmakokinetika anak per genotipe NAT2 yang dapat dipakai menera model, dan karena di situlah ketiga pilar bertemu sekaligus. |

---

## 12. Rujukan

1. Schaaf dkk. (2005) — tetapan eliminasi isoniazid anak per genotipe NAT2
2. Kiser dkk. (2012) — sasaran Cmax ≥3 mg/L dan AUC₀₋₂₄ ≥10,52 mg·jam/L
3. Studi popPK bayi berat lahir rendah dan prematur — pematangan NAT2 belum diketahui; selisih AUC 5× antara metabolisme lambat dan cepat
4. Ladumor dkk. (2019); Jiang dkk. (2013) — rasio glukuronida:sulfat parasetamol menurut usia
5. Ewart dkk. (2022) — ambang reprodusibilitas koefisien variasi urea <15%
6. Baudy dkk. (2020) — panduan sistem mikrofisiologis hati; albumin dan urea sebagai fungsi dasar
7. Huang dkk. (2026) — rs1495741 AA, risiko cedera hati 7,29×; asetilator lambat 64,52% kasus vs 21,12% kontrol
8. Yuliwulandari dkk. (2017) — fenotipe asetilator Melayu Indonesia: cepat 10%, menengah 52%, lambat 38%
9. Yuliwulandari dkk. (2016) — asetilator lambat dan cedera hati akibat obat antituberkulosis di Indonesia, OR 3,45
10. Batas atas normal ALT anak — 30 U/L anak laki-laki, 24 U/L anak perempuan
11. Kriteria DILI kelompok kerja internasional (2011) — ALT ≥5× batas atas normal
12. Gracey dkk. (2026) — model hepatosit neonatus hHLC CYP3A7

---

## 13. Daftar periksa penerimaan

- [ ] Konfigurasi awal (bets `KC-B-2026-014`, chip `CHIP-07`, TUNAS-I, KC-REF-01, hari ke-7) **lulus** seluruh butir.
- [ ] Mengubah hari perfusi ke **ke-3** membuat bets **ditolak** dan mengunci Bagian 4–6.
- [ ] Varian TUNAS-I, usia 4 tahun, isoniazid 10 mg/kg: asetilator **cepat** → margin ±6× ("Perlu perhatian"); asetilator **lambat** → margin ±1× ("Risiko tinggi").
- [ ] Varian TUNAS-N, usia 10 hari, asetilator lambat → "Melampaui ambang in vitro", waktu paruh belasan jam.
- [ ] Nisbah AUC lambat : cepat berada di kisaran 3× (pustaka melaporkan hingga 5×).
- [ ] Waktu paruh isoniazid asetilator cepat pada anak ≈ 1 jam; asetilator lambat ≈ 2,3 jam.
- [ ] Rifampisin, pirazinamid, asam valproat tidak dapat dipilih.
- [ ] Setiap angka pada tabel kriteria dan rantai perhitungan membawa penanda sumber.
- [ ] Label "PROTOTIPE ANTARMUKA · DATA SIMULASI" terlihat pada setiap gulungan layar.
- [ ] Grafik: satu sumbu Y, angka sumbu bulat, legenda ada, tidak ada label bertumpuk di ujung kanan.
- [ ] Mode gelap berfungsi dan seluruh teks tetap terbaca.
- [ ] Tidak ada galat JavaScript di konsol peramban.
