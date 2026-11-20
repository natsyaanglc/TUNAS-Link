/**
 * TUNAS-Link: Konsol Sidik Jari Ontogeni — Mesin Data & Perhitungan Klien
 * Sesuai spesifikasi SPEK-TUNAS-Link.md (Tim Keycherry)
 */

// ============================================================================
// 1. UTILITAS FORMAT & PRNG DETERMINISTIK (§4, §10.1)
// ============================================================================

export function formatID(value, decimals = null) {
    if (typeof value !== "number" || Number.isNaN(value)) return "—";
    const opts =
        typeof decimals === "number"
            ? { minimumFractionDigits: decimals, maximumFractionDigits: decimals }
            : { maximumFractionDigits: 4 };
    return value.toLocaleString("id-ID", opts);
}

export function hashFNV1a(str) {
    let h = 0x811c9dc5;
    for (let i = 0; i < str.length; i++) {
        h ^= str.charCodeAt(i);
        h = Math.imul(h, 0x01000193);
    }
    return h >>> 0;
}

export function xorshift(seed) {
    let state = seed >>> 0 || 0x9e3779b9;
    return function next() {
        state ^= state << 13;
        state >>>= 0;
        state ^= state >>> 17;
        state >>>= 0;
        state ^= state << 5;
        state >>>= 0;
        return state / 4294967296;
    };
}

// ============================================================================
// 2. DATA TETAP (§4, §6, §7, §8, §10.9, §11, §12)
// ============================================================================

export const HEADER_BADGE_TEXT = "PROTOTIPE ANTARMUKA · DATA SIMULASI";

export const HARD_RULES = [
    {
        id: "no-diagnosis",
        title: "Bukan alat diagnosis pasien",
        reason: "TUNAS-Hati adalah platform uji keamanan obat in vitro, bukan uji klinis."
    },
    {
        id: "no-dose-prescription",
        title: "Bukan penetapan dosis klinis",
        reason: "Penetapan dosis menuntut parameter di luar jangkauan model."
    },
    {
        id: "batch-release-not-patient",
        title: "Sidik Jari Ontogeni adalah kriteria rilis bets",
        reason: 'Ini inti gagasan tim: "kami menjual spesifikasi, bukan klaim".'
    },
    {
        id: "source-markers-required",
        title: "Setiap angka membawa penanda sumber",
        reason: "Ambang tempatan tidak boleh menyamar sebagai angka berujukan."
    },
    {
        id: "prototype-label-visible",
        title: 'Label "PROTOTIPE ANTARMUKA · DATA SIMULASI" selalu terlihat',
        reason: "Seluruh angka dihasilkan mesin simulasi."
    },
    {
        id: "disabled-drugs",
        title: "Rifampisin, pirazinamid, dan asam valproat dinonaktifkan",
        reason: "Rencana tim: isoniazid tunggal lebih dahulu, lalu obat lain terpisah."
    }
];

export const VARIAN_USIA = {
    "TUNAS-N": {
        kode: "TUNAS-N",
        nama: "Neonatus",
        rentangLabel: "0–28 hari",
        mat: 0.18
    },
    "TUNAS-I": {
        kode: "TUNAS-I",
        nama: "Bayi–balita",
        rentangLabel: "29 hari – 5 tahun",
        mat: 0.72
    },
    "TUNAS-C": {
        kode: "TUNAS-C",
        nama: "Anak",
        rentangLabel: "6–12 tahun",
        mat: 0.95
    },
    "TUNAS-D": {
        kode: "TUNAS-D",
        nama: "Dewasa (pembanding)",
        rentangLabel: "≥ 18 tahun",
        mat: 1.0
    }
};

export const LINI_IPSC = {
    "KC-REF-01": {
        kode: "KC-REF-01",
        kategori: "acuan",
        nat2: "menengah",
        cyp2c19: "normal",
        ugt1a1: "*1/*1"
    },
    "KC-NAT2S-02": {
        kode: "KC-NAT2S-02",
        kategori: "NAT2 lambat",
        nat2: "lambat",
        cyp2c19: "normal",
        ugt1a1: "*1/*1"
    },
    "KC-C19S-03": {
        kode: "KC-C19S-03",
        kategori: "CYP2C19 lambat",
        nat2: "menengah",
        cyp2c19: "lambat",
        ugt1a1: "*1/*6"
    }
};

export function deskripsiLiniIPSC(kodeLini) {
    const lini = LINI_IPSC[kodeLini];
    if (!lini) return "";
    return `${lini.kategori} · NAT2 ${lini.nat2} · turunan sel punca pluripoten terinduksi dari urine anak Indonesia.`;
}

export const PITA_NAT2_DASAR = {
    lambat: [0.12, 0.38],
    menengah: [0.5, 0.92],
    cepat: [0.7, 1.15]
};

export const ACUAN_KLINIS_PARASETAMOL_GLUC_SULF = {
    "TUNAS-N": 0.34,
    "TUNAS-I": 0.55,
    "TUNAS-C": 0.75,
    "TUNAS-D": 1.8
};

export const OBAT_KATALOG = {
    isoniazid: {
        id: "isoniazid",
        nama: "Isoniazid",
        aktif: true,
        statusLabel: "terkalibrasi",
        ka: 2.0,
        vPerFenotip: {
            cepat: { nilai: 0.953, sumber: "1" },
            menengah: { nilai: 0.891, sumber: "1" },
            lambat: { nilai: 0.777, sumber: "1" }
        },
        kDasarPerFenotip: {
            cepat: { nilai: 0.653, sumber: "1" },
            menengah: { nilai: 0.513, sumber: "1" },
            lambat: { nilai: 0.254, sumber: "1" }
        },
        dosisAwalMgKg: 10,
        tc: {
            "TUNAS-N": 26,
            "TUNAS-I": 34,
            "TUNAS-C": 42,
            "TUNAS-D": 55
        },
        tcSumber: "T",
        sasaranPaparan: {
            cmaxMin: 3.0,
            auc24Min: 10.52,
            sumber: "2"
        },
        jalur: "Asetilasi NAT2 → asetilisoniazid → hidrolisis menjadi asetilhidrazin",
        mekanisme:
            "Pada asetilator lambat, isoniazid bertahan lebih lama dan jalur hidrolisis langsung menjadi hidrazin menguat; hidrazin dan asetilhidrazin adalah metabolit yang dikaitkan dengan cedera hepatoselular."
    },
    parasetamol: {
        id: "parasetamol",
        nama: "Parasetamol",
        aktif: true,
        statusLabel: "parameter tempatan",
        ka: 2.5,
        v: { nilai: 0.95, sumber: "T" },
        kDasar: { nilai: 0.25, sumber: "T" },
        dosisAwalMgKg: 15,
        kMat: {
            "TUNAS-N": 0.45,
            "TUNAS-I": 0.8,
            "TUNAS-C": 0.95,
            "TUNAS-D": 1.0
        },
        tc: {
            "TUNAS-N": 120,
            "TUNAS-I": 150,
            "TUNAS-C": 180,
            "TUNAS-D": 210
        },
        tcSumber: "T",
        jalur: "Sulfasi dan glukuronidasi bersaing; sisanya menempuh oksidasi menjadi metabolit reaktif",
        mekanisme:
            "Pada neonatus sulfasi menyumbang bagian terbesar klirens sedangkan glukuronidasi belum matang, sehingga rasio glukuronida terhadap sulfat jauh lebih rendah daripada dewasa."
    },
    kafein: {
        id: "kafein",
        nama: "Kafein sitrat",
        aktif: true,
        statusLabel: "parameter tempatan",
        ka: 3.0,
        v: { nilai: 0.6, sumber: "T" },
        kDasar: { nilai: 0.14, sumber: "T" },
        dosisAwalMgKg: 5,
        kMat: {
            "TUNAS-N": 0.07,
            "TUNAS-I": 0.55,
            "TUNAS-C": 1.15,
            "TUNAS-D": 1.0
        },
        tc: {
            "TUNAS-N": 60,
            "TUNAS-I": 80,
            "TUNAS-C": 110,
            "TUNAS-D": 140
        },
        tcSumber: "T",
        jalur: "Demetilasi oleh CYP1A2",
        mekanisme:
            "Aktivitas CYP1A2 sangat rendah pada neonatus sehingga klirens kafein melambat dan paruh waktunya memanjang; jendela terapinya menjadi sempit pada apnea prematuritas."
    },
    rifampisin: {
        id: "rifampisin",
        nama: "Rifampisin",
        aktif: false,
        statusLabel: "menunggu kalibrasi"
    },
    pirazinamid: {
        id: "pirazinamid",
        nama: "Pirazinamid",
        aktif: false,
        statusLabel: "menunggu kalibrasi"
    },
    asam_valproat: {
        id: "asam_valproat",
        nama: "Asam valproat",
        aktif: false,
        statusLabel: "menunggu kalibrasi"
    }
};

export const PENANDA_SUMBER = {
    "1": { label: "[1]", jenis: "Berujukan", tokenBg: "--brand-soft", tokenFg: "--brand" },
    "2": { label: "[2]", jenis: "Berujukan", tokenBg: "--brand-soft", tokenFg: "--brand" },
    "3": { label: "[3]", jenis: "Berujukan", tokenBg: "--brand-soft", tokenFg: "--brand" },
    "4": { label: "[4]", jenis: "Berujukan", tokenBg: "--brand-soft", tokenFg: "--brand" },
    "5": { label: "[5]", jenis: "Berujukan", tokenBg: "--brand-soft", tokenFg: "--brand" },
    "6": { label: "[6]", jenis: "Berujukan", tokenBg: "--brand-soft", tokenFg: "--brand" },
    "7": { label: "[7]", jenis: "Berujukan", tokenBg: "--brand-soft", tokenFg: "--brand" },
    "8": { label: "[8]", jenis: "Berujukan", tokenBg: "--brand-soft", tokenFg: "--brand" },
    "9": { label: "[9]", jenis: "Berujukan", tokenBg: "--brand-soft", tokenFg: "--brand" },
    "10": { label: "[10]", jenis: "Berujukan", tokenBg: "--brand-soft", tokenFg: "--brand" },
    "11": { label: "[11]", jenis: "Berujukan", tokenBg: "--brand-soft", tokenFg: "--brand" },
    "12": { label: "[12]", jenis: "Berujukan", tokenBg: "--brand-soft", tokenFg: "--brand" },
    i: { label: "[i]", jenis: "Interpolasi", tokenBg: "--surface-2", tokenFg: "--muted" },
    T: { label: "[T]", jenis: "Tempatan", tokenBg: "--amber-soft", tokenFg: "--amber" }
};

export const RUJUKAN = [
    { no: 1, teks: "Schaaf dkk. (2005) — tetapan eliminasi isoniazid anak per genotipe NAT2" },
    { no: 2, teks: "Kiser dkk. (2012) — sasaran Cmax ≥3 mg/L dan AUC₀₋₂₄ ≥10,52 mg·jam/L" },
    { no: 3, teks: "Studi popPK bayi berat lahir rendah dan prematur — pematangan NAT2 belum diketahui; selisih AUC 5× antara metabolisme lambat dan cepat" },
    { no: 4, teks: "Ladumor dkk. (2019); Jiang dkk. (2013) — rasio glukuronida:sulfat parasetamol menurut usia" },
    { no: 5, teks: "Ewart dkk. (2022) — ambang reprodusibilitas koefisien variasi urea <15%" },
    { no: 6, teks: "Baudy dkk. (2020) — panduan sistem mikrofisiologis hati; albumin dan urea sebagai fungsi dasar" },
    { no: 7, teks: "Huang dkk. (2026) — rs1495741 AA, risiko cedera hati 7,29×; asetilator lambat 64,52% kasus vs 21,12% kontrol" },
    { no: 8, teks: "Yuliwulandari dkk. (2017) — fenotipe asetilator Melayu Indonesia: cepat 10%, menengah 52%, lambat 38%" },
    { no: 9, teks: "Yuliwulandari dkk. (2016) — asetilator lambat dan cedera hati akibat obat antituberkulosis di Indonesia, OR 3,45" },
    { no: 10, teks: "Batas atas normal ALT anak — 30 U/L anak laki-laki, 24 U/L anak perempuan" },
    { no: 11, teks: "Kriteria DILI kelompok kerja internasional (2011) — ALT ≥5× batas atas normal" },
    { no: 12, teks: "Gracey dkk. (2026) — model hepatosit neonatus hHLC CYP3A7" }
];

export const FAQ_BAGIAN_7 = [
    {
        t: "Angka pada chip itu hasil pengukuran atau simulasi?",
        j: "Simulasi, dan dinyatakan di kepala halaman. Yang nyata adalah struktur kriteria rilisnya, ambang yang berujukan, dan parameter farmakokinetika isoniazid per genotipe NAT2."
    },
    {
        t: "Mengapa sebagian ambang ditandai tempatan?",
        j: "Karena belum ada data Fase 1. Menandainya lebih jujur daripada mengisi angka yang terdengar meyakinkan."
    },
    {
        t: "Apakah konsol ini bisa dipakai di bangsal?",
        j: "Tidak. Ini perkakas riset praklinis. Keluarannya masukan untuk perancangan studi dan jadwal pemantauan, bukan perintah terapi."
    },
    {
        t: "Mengapa isoniazid yang dikalibrasi lebih dahulu?",
        j: "Karena tersedia data farmakokinetika anak per genotipe NAT2 yang dapat dipakai menera model, dan karena di situlah ketiga pilar bertemu sekaligus."
    }
];

export const PESAN_PEMBACAAN_CHIP = [
    "Menyeimbangkan laju alir pada 30 µL/jam…",
    "Mengambil efluen ruang 1–3…",
    "Uji kolorimetri albumin dan urea…",
    "Menyuntikkan sampel ke kromatografi cair…",
    "Menghitung rasio metabolit penanda…",
    "Menghitung koefisien variasi lintas chip…",
    "Pembacaan selesai."
];

// ============================================================================
// 3. PEMETAAN USIA, VARIAN & BERAT OTOMATIS (§4, §7.1)
// ============================================================================

export function usiaKeTahunDanHari(nilai, satuan) {
    const n = Number(nilai) || 0;
    if (satuan === "hari") {
        return { tahun: n / 365.25, bulan: n / 30.4375, hari: n };
    }
    if (satuan === "bulan") {
        return { tahun: n / 12, bulan: n, hari: n * 30.4375 };
    }
    return { tahun: n, bulan: n * 12, hari: n * 365.25 };
}

export function petaUsiaKeVarian(nilai, satuan = "tahun") {
    const { tahun, hari } = usiaKeTahunDanHari(nilai, satuan);
    if (hari <= 28) return "TUNAS-N";
    if (tahun < 6) return "TUNAS-I";
    if (tahun < 18) return "TUNAS-C";
    return "TUNAS-D";
}

export function hitungBeratOtomatis(nilai, satuan = "tahun") {
    const { tahun, bulan, hari } = usiaKeTahunDanHari(nilai, satuan);
    if (hari < 28) return 3.3;
    if (tahun < 1) return 3.3 + bulan * 0.6;
    return 2 * tahun + 8;
}

// ============================================================================
// 4. SIDIK JARI ONTOGENI & SIMULASI PEMBACAAN CHIP (§7.3, §10.1)
// ============================================================================

function getDaftarKriteria(varian, kodeLini) {
    const lini = LINI_IPSC[kodeLini] || LINI_IPSC["KC-REF-01"];
    const vObj = VARIAN_USIA[varian] || VARIAN_USIA["TUNAS-I"];
    const [nat2Lo, nat2Hi] = PITA_NAT2_DASAR[lini.nat2] || PITA_NAT2_DASAR.menengah;

    const pitaByVarian = {
        cyp3a: {
            "TUNAS-N": [4.0, 20.0],
            "TUNAS-I": [1.0, 4.0],
            "TUNAS-C": [0.25, 1.0],
            "TUNAS-D": [0.02, 0.25]
        },
        cyp1a2: {
            "TUNAS-N": [0.5, 4.0],
            "TUNAS-I": [3.0, 12.0],
            "TUNAS-C": [8.0, 25.0],
            "TUNAS-D": [18.0, 45.0]
        },
        parasetamolRatio: {
            "TUNAS-N": [0.24, 0.46],
            "TUNAS-I": [0.45, 0.68],
            "TUNAS-C": [0.6, 0.95],
            "TUNAS-D": [1.45, 2.2]
        },
        albumin: {
            "TUNAS-N": [8.0, 40.0],
            "TUNAS-I": [12.0, 55.0],
            "TUNAS-C": [15.0, 70.0],
            "TUNAS-D": [18.0, 80.0]
        },
        urea: {
            "TUNAS-N": [20.0, 90.0],
            "TUNAS-I": [28.0, 120.0],
            "TUNAS-C": [35.0, 150.0],
            "TUNAS-D": [40.0, 170.0]
        }
    };

    return [
        {
            id: "cyp3a_ratio",
            nama: "Rasio CYP3A7 : CYP3A4",
            metode: "16α-hidroksilasi DHEA vs 1′-hidroksilasi midazolam",
            satuan: "",
            desimal: 2,
            lo: pitaByVarian.cyp3a[varian][0],
            hi: pitaByVarian.cyp3a[varian][1],
            sumber: "T"
        },
        {
            id: "cyp1a2_activity",
            nama: "Aktivitas CYP1A2",
            metode: "O-deetilasi fenasetin",
            satuan: "pmol/menit/10⁶ sel",
            desimal: 1,
            lo: pitaByVarian.cyp1a2[varian][0],
            hi: pitaByVarian.cyp1a2[varian][1],
            sumber: "T"
        },
        {
            id: "paracetamol_ratio",
            nama: "Rasio glukuronida : sulfat parasetamol",
            metode: "LC-MS/MS",
            satuan: "parasetamol",
            desimal: 2,
            lo: pitaByVarian.parasetamolRatio[varian][0],
            hi: pitaByVarian.parasetamolRatio[varian][1],
            sumber: varian === "TUNAS-I" ? "i" : "4"
        },
        {
            id: "isoniazid_acetylation",
            nama: "Laju asetilasi isoniazid",
            metode: "Rasio asetilisoniazid : isoniazid",
            satuan: "rasio metabolit",
            desimal: 3,
            lo: nat2Lo * vObj.mat,
            hi: nat2Hi * vObj.mat,
            sumber: "1"
        },
        {
            id: "albumin",
            nama: "Albumin",
            metode: "Kolorimetri harian efluen",
            satuan: "µg/hari/10⁶ sel",
            desimal: 1,
            lo: pitaByVarian.albumin[varian][0],
            hi: pitaByVarian.albumin[varian][1],
            sumber: "6"
        },
        {
            id: "urea",
            nama: "Urea",
            metode: "Kolorimetri harian efluen",
            satuan: "µg/hari/10⁶ sel",
            desimal: 1,
            lo: pitaByVarian.urea[varian][0],
            hi: pitaByVarian.urea[varian][1],
            sumber: "6"
        },
        {
            id: "urea_cv",
            nama: "Koefisien variasi urea",
            metode: "Pemantauan harian lintas chip",
            satuan: "% lintas chip",
            desimal: 1,
            maxOnly: true,
            maxAmbang: 15,
            sumber: "5"
        }
    ];
}

export function simulasiPembacaanChip({
    kodeBets,
    kodeChip,
    varian,
    lini,
    hari
}) {
    const hariNum = Number(hari);
    const seed = hashFNV1a(`${kodeBets}|${kodeChip}|${varian}|${lini}|${hariNum}`);
    const r = xorshift(seed);

    const pInside = hariNum >= 7 ? 0.9997 : hariNum === 5 ? 0.8 : 0.42;
    const daftarKriteria = getDaftarKriteria(varian, lini);

    const hasilKriteria = daftarKriteria.map((kriteria) => {
        let nilai;
        let lulus;

        if (kriteria.maxOnly) {
            const denda = hariNum < 5 ? 1.9 : hariNum < 7 ? 1.25 : 1.0;
            nilai = Math.max(2.4, 8.2 * denda * (1 + (r() * 2 - 1) * 0.42));
            lulus = nilai < kriteria.maxAmbang;
        } else {
            const { lo, hi } = kriteria;
            const masuk = r() < pInside;
            nilai = masuk
                ? lo + (hi - lo) * (0.18 + r() * 0.64)
                : r() < 0.5
                    ? lo * (0.52 + r() * 0.34)
                    : hi * (1.12 + r() * 0.4);
            if (hariNum < 5) {
                nilai *= 0.72 + r() * 0.18;
            }
            lulus = nilai >= lo && nilai <= hi;
        }

        return { ...kriteria, nilai, lulus };
    });

    // Nilai tambahan: LDH ≈ 7,5 (±30%), ALT ≈ 11 (±35%)
    const ldh = 7.5 * (1 + (r() * 2 - 1) * 0.3);
    const altEfluen = 11 * (1 + (r() * 2 - 1) * 0.35);

    const byId = Object.fromEntries(hasilKriteria.map((item) => [item.id, item]));
    const kartuEfluen = [
        {
            id: "albumin",
            label: "Albumin efluen",
            nilai: byId.albumin.nilai,
            satuan: "µg/hari/10⁶ sel",
            desimal: 1,
            sumber: "6"
        },
        {
            id: "urea",
            label: "Urea efluen",
            nilai: byId.urea.nilai,
            satuan: "µg/hari/10⁶ sel",
            desimal: 1,
            sumber: "6"
        },
        {
            id: "ldh",
            label: "Pelepasan LDH",
            nilai: ldh,
            satuan: "% dari kendali",
            desimal: 1,
            sumber: "T"
        },
        {
            id: "alt",
            label: "ALT efluen",
            nilai: altEfluen,
            satuan: "U/L",
            desimal: 1,
            sumber: "T"
        },
        {
            id: "paracetamol_ratio",
            label: "Rasio glukuronida : sulfat",
            nilai: byId.paracetamol_ratio.nilai,
            satuan: "parasetamol",
            desimal: 2,
            sumber: byId.paracetamol_ratio.sumber
        },
        {
            id: "isoniazid_acetylation",
            label: "Laju asetilasi isoniazid",
            nilai: byId.isoniazid_acetylation.nilai,
            satuan: "rasio metabolit",
            desimal: 3,
            sumber: "1"
        },
        {
            id: "urea_cv",
            label: "Koefisien variasi urea",
            nilai: byId.urea_cv.nilai,
            satuan: "% lintas chip",
            desimal: 1,
            sumber: "5"
        }
    ];

    const gagal = hasilKriteria.filter((item) => !item.lulus);
    const lulus = gagal.length === 0;
    const daftarGagal = gagal.map((item) => item.nama).join(", ");

    const spanduk = lulus
        ? `Bets ${kodeBets} lulus seluruh butir — Varian ${varian} pada lini ${lini} memenuhi seluruh kriteria rilis pada hari perfusi ke-${hariNum}. Bets boleh dipakai untuk pengujian obat.`
        : `Bets ${kodeBets} ditolak — ${gagal.length} butir tidak memenuhi ambang: ${daftarGagal}. Bets tidak digunakan. Ubah hari perfusi, chip, atau kode bets untuk membaca bets lain.`;

    return {
        seed,
        kodeBets,
        kodeChip,
        varian,
        lini,
        hari: hariNum,
        lulus,
        gagal,
        spanduk,
        kriteria: hasilKriteria,
        kartuEfluen,
        ldh,
        altEfluen
    };
}
// ============================================================================
// 5. PREDIKSI PAPARAN & MARGIN KEAMANAN (§10.2–§10.9)
// ============================================================================

/**
 * Menghitung prediksi paparan simulasi berdasarkan spesifikasi TUNAS-Link.
 * CATATAN: hasil ini hanya simulasi riset in vitro, bukan rekomendasi dosis klinis.
 */
export function prediksiPaparan({
    obatId,
    dosisMgKg,
    beratKg,
    usiaNilai,
    usiaSatuan,
    varian,
    fenotipNAT2,
    rs1495741,
    ugt1a1,
    riwayatHati,
    koMedikasi,
    jenisKelamin,
    pembacaanChip
}) {
    const obat = OBAT_KATALOG[obatId];
    if (!obat || !obat.aktif) throw new Error("Obat tidak tersedia atau masih menunggu kalibrasi.");
    if (!pembacaanChip?.lulus) throw new Error("Bets chip harus lulus sebelum prediksi dijalankan.");
    if (!(Number(dosisMgKg) > 0) || !(Number(beratKg) > 0)) {
        throw new Error("Dosis simulasi dan berat badan harus lebih besar dari nol.");
    }

    const dosis = Number(dosisMgKg);
    const bb = Number(beratKg);
    const usia = usiaKeTahunDanHari(usiaNilai, usiaSatuan);
    const usiaTahun = usia.tahun;
    const usiaBulan = usia.bulan;
    const liniNat2 = LINI_IPSC[pembacaanChip.lini]?.nat2 || "menengah";

    // §10.2 — faktor aktivitas yang dibaca dari chip, sesuai obat.
    const kriteriaId = {
        isoniazid: "isoniazid_acetylation",
        parasetamol: "paracetamol_ratio",
        kafein: "cyp1a2_activity"
    }[obatId];
    const hasilChip = pembacaanChip.kriteria.find((item) => item.id === kriteriaId);
    if (!hasilChip) throw new Error("Parameter aktivitas obat tidak ditemukan pada hasil pembacaan chip.");
    const titikTengah = (hasilChip.lo + hasilChip.hi) / 2;
    const chipFactorMentah = hasilChip.nilai / titikTengah;
    const chipFactor = Math.min(1.8, Math.max(0.45, chipFactorMentah));

    // §10.3 — faktor pematangan/usia.
    let matF;
    let matRincian;
    if (obatId === "isoniazid") {
        const fungsiMaturasi = (usiaBulan ** 2) / (3 ** 2 + usiaBulan ** 2); // TM50 = 3 bulan
        const sebelumBatas = Math.max(0.12, fungsiMaturasi);
        const sizeF = Math.max(0.86, Math.min(1.10, 1 + 0.02 * (4 - usiaTahun)));
        matF = sebelumBatas * sizeF;
        matRincian = { fungsiMaturasi, sebelumBatas, sizeF, formula: "Isoniazid: fungsi pematangan TM50 3 bulan × faktor ukuran ternormalisasi pada usia 4 tahun" };
    } else {
        matF = obat.kMat[varian];
        matRincian = { kMat: matF, formula: `kMat ${obat.nama} untuk ${varian}` };
    }

    // §10.4 — parameter dasar menurut obat dan fenotipe NAT2.
    const fenotipe = fenotipNAT2 || "menengah";
    const vData = obatId === "isoniazid" ? obat.vPerFenotip[fenotipe] : obat.v;
    const kData = obatId === "isoniazid" ? obat.kDasarPerFenotip[fenotipe] : obat.kDasar;
    if (!vData || !kData) throw new Error("Parameter V/F atau eliminasi untuk fenotipe ini tidak tersedia.");
    const V = vData.nilai;
    const kDasar = kData.nilai;
    const comedF = koMedikasi === "rifampisin" && obatId !== "isoniazid" ? 1.35 : 1.0;
    const kEff = kDasar * matF * chipFactor * comedF;
    const ka = obat.ka;
    if (!(kEff > 0) || !(ka > kEff)) {
        throw new Error("Parameter model tidak valid: pastikan ka lebih besar dari tetapan eliminasi efektif.");
    }

    // §10.5 — model satu kompartemen, pemberian oral.
    const A = dosis / V;
    const f = ka / (ka - kEff);
    const tmax = Math.log(ka / kEff) / (ka - kEff);
    const konsentrasi = (t) => Math.max(0, A * f * (Math.exp(-kEff * t) - Math.exp(-ka * t)));
    const cmax = konsentrasi(tmax);
    const auc24 = A * f * (
        (1 - Math.exp(-kEff * 24)) / kEff -
        (1 - Math.exp(-ka * 24)) / ka
    );
    const thalf = Math.LN2 / kEff;

    // Pembanding dewasa: k = k dasar genotipe sama × 0,9; V sama.
    const kDewasa = kDasar * 0.9;
    const fDewasa = ka / (ka - kDewasa);
    const tmaxDewasa = Math.log(ka / kDewasa) / (ka - kDewasa);
    const konsentrasiDewasa = (t) => Math.max(0, A * fDewasa * (Math.exp(-kDewasa * t) - Math.exp(-ka * t)));

    // §10.6 — ambang toksik in vitro dan margin mentah.
    let tc = obat.tc[varian];
    const tcSebelumKoreksi = tc;
    if (obatId === "isoniazid" && fenotipe === "lambat") tc *= 0.72;
    if (obatId === "parasetamol") {
        if (ugt1a1 === "*6/*6") tc *= 0.68;
        else if (ugt1a1 === "*1/*6") tc *= 0.84;
    }
    const altEfluen = pembacaanChip.altEfluen;
    const altChipF = 1 + (altEfluen - 11) / 110;
    tc *= altChipF;
    const marginMentah = tc / cmax;

    // §10.7 — pengali risiko genetik. NAT2 dan rs1495741 tidak dikalikan satu sama lain.
    let nat2Risk = 1;
    const faktorRisiko = [];
    if (obatId === "isoniazid" || obatId === "rifampisin" || obatId === "pirazinamid") {
        if (rs1495741 === "AA") {
            nat2Risk = Math.max(nat2Risk, 2.6);
            faktorRisiko.push({ label: "NAT2 rs1495741 AA", nilai: 2.6, sumber: "7" });
        }
        if (fenotipe === "lambat") {
            nat2Risk = Math.max(nat2Risk, 1.9);
            faktorRisiko.push({ label: "Fenotipe NAT2 lambat", nilai: 1.9, sumber: "9" });
        }
    }
    const riskApplicable = obatId === "isoniazid" || obatId === "rifampisin" || obatId === "pirazinamid";
    let riskScore = riskApplicable ? nat2Risk : 1;
    if (riskApplicable && riwayatHati === "ada") {
        riskScore *= 1.4;
        faktorRisiko.push({ label: "Riwayat gangguan hati", nilai: 1.4, sumber: "T" });
    }
    const marginTerkoreksi = marginMentah / riskScore;

    // §10.8 — kategori risiko dan meter logaritmik.
    let kategori;
    let kategoriKunci;
    if (marginTerkoreksi >= 10) {
        kategori = "Risiko rendah";
        kategoriKunci = "low";
    } else if (marginTerkoreksi >= 3) {
        kategori = "Perlu perhatian";
        kategoriKunci = "attention";
    } else if (marginTerkoreksi >= 1) {
        kategori = "Risiko tinggi";
        kategoriKunci = "high";
    } else {
        kategori = "Melampaui ambang in vitro";
        kategoriKunci = "critical";
    }
    const meterMargin = Math.max(0, Math.min(100, ((Math.log10(Math.max(marginTerkoreksi, 0.0001)) + 1) / 2) * 100));

    // §10.9 — nilai ALT untuk rancangan pemantauan, bukan instruksi klinis.
    const altULN = jenisKelamin === "laki-laki" ? 30 : 24;
    const ambangDILI = 5 * altULN;

    // Kurva tiap 0,25 jam hingga 24 jam.
    const kurva = [];
    for (let t = 0; t <= 24.0001; t += 0.25) {
        kurva.push({
            jam: Number(t.toFixed(2)),
            subjek: konsentrasi(t),
            dewasa: konsentrasiDewasa(t)
        });
    }

    const rantai = [
        { langkah: "Dosis simulasi", nilai: `${formatID(dosis, 2)} mg/kg (${formatID(dosis * bb, 2)} mg total)`, asal: "Input pengguna" },
        { langkah: "Volume distribusi semu (V/F)", nilai: `${formatID(V, 3)} L/kg`, asal: vData.sumber || "T" },
        { langkah: "Tetapan absorpsi (ka)", nilai: `${formatID(ka, 3)} /jam`, asal: "§7.4" },
        { langkah: "Tetapan eliminasi dasar", nilai: `${formatID(kDasar, 3)} /jam`, asal: kData.sumber || "T" },
        { langkah: "Faktor pematangan (matF)", nilai: formatID(matF, 4), asal: obatId === "isoniazid" ? "§10.3" : "§7.4 [T]" },
        { langkah: "Faktor aktivitas chip", nilai: `${formatID(chipFactor, 4)} (mentah ${formatID(chipFactorMentah, 4)})`, asal: "§10.2" },
        { langkah: "Faktor ko-medikasi", nilai: formatID(comedF, 2), asal: "§10.4" },
        { langkah: "Eliminasi efektif (kEff)", nilai: `${formatID(kEff, 4)} /jam`, asal: "k dasar × matF × chipFactor × comedF" },
        { langkah: "Konsentrasi puncak (Cmax)", nilai: `${formatID(cmax, 3)} mg/L`, asal: "Model satu kompartemen oral [§10.5]" },
        { langkah: "AUC₀₋₂₄", nilai: `${formatID(auc24, 3)} mg·jam/L`, asal: "Integrasi model 0–24 jam [§10.5]" },
        { langkah: "Ambang toksik setelah koreksi", nilai: `${formatID(tc, 3)} mg/L`, asal: `TC ${obat.tcSumber || "T"} × koreksi genetik/ALT` },
        { langkah: "Margin mentah", nilai: `${formatID(marginMentah, 3)}×`, asal: "TC terkoreksi ÷ Cmax" },
        { langkah: "Skor pengali risiko", nilai: `${formatID(riskScore, 3)}×`, asal: "§10.7" },
        { langkah: "Margin keamanan terkoreksi", nilai: `${formatID(marginTerkoreksi, 3)}×`, asal: "Margin mentah ÷ skor risiko" }
    ];

    return {
        obatId,
        obatNama: obat.nama,
        dosisMgKg: dosis,
        dosisTotalMg: dosis * bb,
        beratKg: bb,
        varian,
        usiaTahun,
        fenotipNAT2: fenotipe,
        liniNat2,
        ka,
        V,
        kDasar,
        matF,
        matRincian,
        chipFactor,
        chipFactorMentah,
        comedF,
        kEff,
        A,
        f,
        tmax,
        cmax,
        auc24,
        thalf,
        kDewasa,
        tmaxDewasa,
        tc,
        tcSebelumKoreksi,
        altEfluen,
        altChipF,
        marginMentah,
        nat2Risk,
        riskApplicable,
        riskScore,
        faktorRisiko,
        marginTerkoreksi,
        kategori,
        kategoriKunci,
        meterMargin,
        altULN,
        ambangDILI,
        sasaranPaparan: obatId === "isoniazid" ? {
            cmaxMin: obat.sasaranPaparan.cmaxMin,
            auc24Min: obat.sasaranPaparan.auc24Min,
            cmaxTercapai: cmax >= obat.sasaranPaparan.cmaxMin,
            auc24Tercapai: auc24 >= obat.sasaranPaparan.auc24Min
        } : null,
        jalur: obat.jalur,
        mekanisme: obat.mekanisme,
        kurva,
        rantai
    };
}
