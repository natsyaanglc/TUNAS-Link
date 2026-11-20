# TUNAS-Link — Prototipe Antarmuka · Data Simulasi

Project ini menggabungkan spesifikasi `SPEK-TUNAS-Link.md` dengan mesin perhitungan `tunasLinkEngine.js`.

## Cara menjalankan di Windows

1. Ekstrak folder project.
2. Buka folder `tunaslink_project` di Antigravity.
3. Buka Terminal → New Terminal.
4. Pastikan terminal berada di folder yang berisi `server.js`.
5. Jalankan:

   ```powershell
   node server.js
   ```

6. Buka browser ke `http://localhost:8000`.
7. Untuk menghentikan server, tekan `Ctrl+C` di terminal.

Server lokal hanya menyajikan file statis agar browser dapat memuat JavaScript ES Modules. Seluruh simulasi dan perhitungan tetap berjalan di browser (client-side); tidak ada database atau pemanggilan API.

## Isi project

- `index.html` — kerangka halaman web.
- `style.css` — desain responsif, tema terang dan gelap.
- `app.js` — antarmuka, navigasi, pembacaan chip, formulir, grafik, dan ekspor.
- `tunasLinkEngine.js` — data tetap, simulasi pembacaan chip, dan mesin prediksi paparan.
- `server.js` — server file statis lokal berbasis Node.js.
- `SPEK-TUNAS-Link.md` — spesifikasi acuan tim.

## Status implementasi

Versi ini sudah memiliki alur konfigurasi bets → pembacaan chip → rilis Sidik Jari Ontogeni → profil subjek → obat uji → prediksi paparan dan ekspor JSON. Tetap perlakukan semua angka sebagai simulasi riset praklinis, bukan hasil pembacaan chip nyata, diagnosis, atau rekomendasi dosis klinis.

## Catatan ketelitian model

- Ambang dan parameter yang ditandai `[T]` adalah parameter tempatan/simulasi dan memerlukan kalibrasi eksperimental.
- Spesifikasi menyebut rentang neonatal 0–28 hari dan varian berikutnya mulai 29 hari; pemetaan usia di mesin mengikuti rentang tabel tersebut.
- Hasil `Cmax`, `AUC`, waktu paruh, dan margin adalah keluaran persamaan model yang tercantum pada spesifikasi, bukan validasi klinis.

## Pemeriksaan awal yang sudah dilakukan

- Sintaks `app.js`, `tunasLinkEngine.js`, dan `server.js` lolos pemeriksaan Node.js.
- Server lokal mengirim `index.html`, `app.js`, dan `tunasLinkEngine.js` dengan respons HTTP 200.
- Bets awal `KC-B-2026-014` / `CHIP-07` / `TUNAS-I` / `KC-REF-01` / hari ke-7 lulus.
- Mengubah hari pembacaan ke-3 menghasilkan bets ditolak.
- Skenario isoniazid usia 4 tahun memberi margin sekitar 5,66× untuk asetilator cepat dan 1,35× untuk asetilator lambat pada konfigurasi uji yang dipakai.

## Catatan yang perlu diputuskan tim

1. Tabel varian usia menyebut TUNAS-N 0–28 hari dan TUNAS-I mulai 29 hari, sedangkan kalimat pemetaan usia pada spesifikasi menulis `< 28 hari`. Implementasi mengikuti tabel rentang usia (28 hari masih TUNAS-N).
2. Daftar periksa penerimaan menyebut waktu paruh neonatus “belasan jam”. Dengan persamaan pematangan §10.3, faktor kematangan minimum 0,12, dan parameter eliminasi asetilator lambat, pengujian seed tertentu menghasilkan sekitar 20–24 jam. Rumus tidak diubah untuk memaksakan angka lolos; tim perlu menyelaraskan rumus atau target penerimaan.
3. Tabel kriteria memecah albumin dan urea menjadi butir 5a dan 5b, sehingga antarmuka menampilkan tujuh baris parameter untuk enam kelompok bernomor.
