import {
  HEADER_BADGE_TEXT, VARIAN_USIA, LINI_IPSC, OBAT_KATALOG, PENANDA_SUMBER,
  RUJUKAN, FAQ_BAGIAN_7, PESAN_PEMBACAAN_CHIP,
  formatID, deskripsiLiniIPSC, petaUsiaKeVarian, hitungBeratOtomatis,
  simulasiPembacaanChip, prediksiPaparan
} from "./tunasLinkEngine.js";

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
const app = document.getElementById("app");

const state = {
  theme: "light",
  activeStep: 1,
  config: {
    kodeBets: "KC-B-2026-014",
    kodeChip: "CHIP-07",
    varian: "TUNAS-I",
    lini: "KC-REF-01",
    hari: "7"
  },
  profile: {
    kodeSubjek: "SBJ-001",
    jenisKelamin: "perempuan",
    usia: "4",
    satuanUsia: "tahun",
    berat: "16",
    nat2: "menengah",
    rs1495741: "GG",
    ugt1a1: "*1/*1",
    cyp2c19: "normal",
    koMedikasi: "tidak",
    riwayatHati: "tidak"
  },
  obatId: "isoniazid",
  dosisMgKg: "10",
  reading: null,
  configDirty: false,
  readingStage: -1,
  readingBusy: false,
  lastResult: null,
  exportReady: false
};

const STEP_LINKS = [
  ["01", "Konfigurasi bets", "Chip, varian, lini iPSC", "#section-config"],
  ["02", "Pembacaan chip", "Efluen dan metabolit", "#section-reading"],
  ["03", "Sidik Jari Ontogeni", "Kriteria rilis bets", "#section-release"],
  ["04", "Profil subjek", "Usia, kelamin, genotipe", "#section-profile"],
  ["05", "Obat uji", "Zat dan paparan simulasi", "#section-drug"],
  ["06", "Luaran TUNAS-Link", "Paparan dan sinyal risiko", "#section-output"]
];

const escapeHTML = (value = "") => String(value).replace(/[&<>"']/g, (ch) => ({
  "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
}[ch]));
const fmt = (n, d = 2) => formatID(Number(n), d);
const sourceBadge = (source) => {
  const info = PENANDA_SUMBER[source] || { label: `[${source}]`, jenis: "Berujukan" };
  const cls = source === "T" ? "local" : source === "i" ? "interp" : "";
  return `<span class="source ${cls}" title="${escapeHTML(info.jenis)}">${escapeHTML(info.label)}</span>`;
};
const disabledLock = (title, message) => `
  <div class="locked-panel"><strong>▣ ${escapeHTML(title)}</strong>${escapeHTML(message)}</div>`;
const isBatchReady = () => Boolean(state.reading?.lulus);
const isReadingComplete = () => Boolean(state.reading);

function currentWarnings() {
  const warnings = [];
  const actualVariant = petaUsiaKeVarian(state.profile.usia, state.profile.satuanUsia);
  const age = Number(state.profile.usia) || 0;
  const ageYears = state.profile.satuanUsia === "tahun" ? age : state.profile.satuanUsia === "bulan" ? age / 12 : age / 365.25;
  if (actualVariant !== state.config.varian) {
    warnings.push(`Bets dibaca pada varian ${state.config.varian}, sedangkan usia subjek jatuh pada rentang ${actualVariant} (${VARIAN_USIA[actualVariant].rentangLabel}). Prediksi tetap dihitung, tetapi kesesuaian ontogeninya tidak dapat diklaim.`);
  }
  if (ageYears >= 13 && ageYears < 18) {
    warnings.push("Varian remaja belum tersedia. Deret usia saat ini berhenti pada varian anak; varian remaja direncanakan pada Fase 2.");
  }
  const lineNat2 = LINI_IPSC[state.config.lini]?.nat2;
  if (lineNat2 && lineNat2 !== state.profile.nat2) {
    warnings.push(`Fenotipe NAT2 subjek (${state.profile.nat2}) berbeda dari fenotipe lini bets (${lineNat2}). Perbedaan ini dicatat dalam interpretasi model.`);
  }
  return warnings;
}

function renderHeader() {
  return `
    <header class="topbar">
      <div class="brand-lockup">
        <div class="logo-mark">T</div>
        <div><div class="brand-name">TUNAS-Link</div><div class="brand-sub">Konsol Sidik Jari Ontogeni</div></div>
      </div>
      <div class="header-right">
        <span class="prototype-badge">${escapeHTML(HEADER_BADGE_TEXT)}</span>
        <button class="theme-btn" id="theme-toggle" type="button" aria-label="Ganti tema">${state.theme === "light" ? "◐ Mode gelap" : "☼ Mode terang"}</button>
      </div>
    </header>`;
}

function renderRail() {
  return `
    <aside class="rail">
      <div class="rail-card">
        <div class="rail-title">Alur kerja</div>
        <ol class="steps">
          ${STEP_LINKS.map(([num, title, desc, target], index) => {
            const done = index === 0 ? isReadingComplete() : index === 1 ? isReadingComplete() : index === 2 ? isBatchReady() : index === 3 ? Boolean(state.lastResult) : index === 4 ? Boolean(state.lastResult) : false;
            const active = state.activeStep === index + 1;
            return `<li><button type="button" class="step-link ${active ? "active" : ""} ${done ? "done" : ""}" data-nav="${target}">
              <span class="step-num">${done ? "✓" : num}</span><span class="step-text"><strong>${title}</strong><small>${desc}</small></span>
            </button></li>`;
          }).join("")}
        </ol>
        <div class="batch-mini">
          <div class="rail-title">Bets aktif</div>
          <div class="mono">${escapeHTML(state.config.kodeBets)}</div>
          <small>${escapeHTML(state.config.varian)} · ${escapeHTML(state.config.lini)}</small>
        </div>
      </div>
      <div class="rail-card"><p class="rail-note">Konsol simulasi riset praklinis. Seluruh hasil adalah data simulasi, bukan pembacaan chip nyata.</p></div>
    </aside>`;
}

function renderWorkflow() {
  const items = [
    ["1", "Chip berperfusi", "Organoid dalam hidrogel gelatin ikan–alginat"],
    ["2", "Efluen dan metabolit", "Kolorimetri harian dan LC-MS/MS"],
    ["3", "Sidik Jari Ontogeni", "Kriteria rilis — lulus atau ditolak"],
    ["4", "TUNAS-Link", "Ekstrapolasi ke model farmakokinetika"],
    ["5", "Laporan bets", "Paparan per usia dan genotipe"]
  ];
  return `<div class="grid-flow">${items.map(([n, title, desc], i) => `
    <div class="flow-box" data-flow="${i}"><span class="flow-number">TAHAP ${n}</span><strong>${title}</strong><small>${desc}</small></div>`).join("")}</div>`;
}

function renderConfig() {
  const c = state.config;
  const locked = state.readingBusy ? "disabled" : "";
  return `
    <section class="card" id="section-config">
      <div class="card-head"><div><div class="section-tag">Bagian 1 · konfigurasi bets</div><h2>Chip, varian usia, dan lini iPSC</h2><p class="lead">Satu lini iPSC diturunkan menjadi seluruh varian usia dari stok beku yang sama, sehingga perbandingan antar-usia bersifat isogenik.</p></div><span class="status ${isReadingComplete() ? "pass" : ""}">${isReadingComplete() ? "Konfigurasi dibaca" : "Belum dibaca"}</span></div>
      <div class="form-grid">
        <div class="field"><label for="kode-bets">Kode bets</label><input id="kode-bets" data-config="kodeBets" value="${escapeHTML(c.kodeBets)}" ${locked}><span class="hint">Menentukan benih acak simulasi — bets yang sama selalu memberi hasil yang sama.</span></div>
        <div class="field"><label for="kode-chip">Kode chip</label><input id="kode-chip" data-config="kodeChip" value="${escapeHTML(c.kodeChip)}" ${locked}></div>
        <div class="field"><label for="varian">Varian usia organoid</label><select id="varian" data-config="varian" ${locked}>${Object.values(VARIAN_USIA).map(v => `<option value="${v.kode}" ${c.varian === v.kode ? "selected" : ""}>${v.kode} — ${v.nama}</option>`).join("")}</select><span class="hint">Rentang: ${VARIAN_USIA[c.varian].rentangLabel}</span></div>
        <div class="field"><label for="lini">Lini iPSC (panel Indonesia)</label><select id="lini" data-config="lini" ${locked}>${Object.values(LINI_IPSC).map(v => `<option value="${v.kode}" ${c.lini === v.kode ? "selected" : ""}>${v.kode} — ${v.kategori}</option>`).join("")}</select><span class="hint">${escapeHTML(deskripsiLiniIPSC(c.lini))}</span></div>
        <div class="field"><label for="hari">Hari perfusi saat pembacaan</label><select id="hari" data-config="hari" ${locked}>${[3,5,7,10,14].map(n => `<option value="${n}" ${String(n) === c.hari ? "selected" : ""}>Hari ke-${n}</option>`).join("")}</select><span class="hint">Kriteria rilis dibaca pada hari ke-7 setelah fungsi hepatoselular stabil. Hari ke-3 atau ke-5 dapat memperagakan bets yang ditolak.</span></div>
      </div>
      <div class="static-tags"><span class="static-tag">Hidrogel gelatin ikan–alginat</span><span class="static-tag">Badan termoplastik potong-rakit</span><span class="static-tag">Tanpa Matrigel</span><span class="static-tag">Tanpa PDMS</span></div>
      <div class="btn-row"><button class="btn secondary" type="button" id="reset-config">Kembalikan konfigurasi awal</button><span class="small muted" id="config-dirty-note">${isReadingComplete() ? "Perubahan konfigurasi akan mengunci kembali hasil rilis." : "Konfigurasikan bets sebelum memulai pembacaan."}</span></div>
    </section>`;
}

function renderChipDiagram() {
  return `<div class="chip-diagram ${state.readingBusy ? "running" : ""}" id="chip-diagram">
    <svg class="chip-svg" viewBox="0 0 720 170" role="img" aria-label="Skema chip dengan tiga ruang jaringan dan aliran efluen">
      <rect x="70" y="39" width="580" height="92" rx="20" fill="var(--surface)" stroke="var(--rule-2)" stroke-width="2"/>
      <path d="M94 85 H626" stroke="var(--brand)" stroke-width="7" stroke-linecap="round" opacity=".28"/>
      ${[200,360,520].map(x => `<rect x="${x-56}" y="51" width="112" height="68" rx="12" fill="var(--brand-soft)" stroke="var(--rule-2)"/><g fill="var(--brand)">${Array.from({length:7},(_,i)=>`<circle cx="${x-34+(i%4)*22}" cy="${68+Math.floor(i/4)*27}" r="6" opacity="${.55+(i%3)*.15}"/>`).join("")}</g>`).join("")}
      <circle cx="46" cy="85" r="17" fill="var(--surface)" stroke="var(--brand)" stroke-width="3"/><circle cx="674" cy="85" r="17" fill="var(--surface)" stroke="var(--amber)" stroke-width="3"/>
      <path d="M63 85 H91 M650 85 H657" stroke="var(--axis)" stroke-width="3" stroke-linecap="round"/>
      <text x="46" y="23" text-anchor="middle" fill="var(--brand-2)" font-size="11" font-weight="700">MASUKAN</text>
      <text x="674" y="23" text-anchor="middle" fill="var(--amber)" font-size="11" font-weight="700">EFLUEN</text>
      <text x="360" y="153" text-anchor="middle" fill="var(--muted)" font-size="10">TIGA RUANG JARINGAN · ORGANOID DALAM HIDROGEL</text>
      ${Array.from({length:6},(_,i)=>`<circle class="flow-particle" cx="95" cy="85" r="5" style="animation-delay:${i*.48}s"/>`).join("")}
    </svg>
  </div>`;
}

function renderReadingMetrics() {
  const cards = state.reading?.kartuEfluen || [];
  const definitions = [
    ["albumin","Albumin efluen","µg/hari/10⁶ sel",1],
    ["urea","Urea efluen","µg/hari/10⁶ sel",1],
    ["ldh","Pelepasan LDH","% dari kendali",1],
    ["alt","ALT efluen","U/L",1],
    ["paracetamol_ratio","Rasio glukuronida : sulfat","parasetamol",2],
    ["isoniazid_acetylation","Laju asetilasi isoniazid","rasio metabolit",3],
    ["urea_cv","Koefisien variasi urea","% lintas chip",1]
  ];
  return `<div class="metric-grid">${definitions.map(([id,label,unit,dec]) => {
    const item = cards.find(x => x.id === id);
    const stageShown = state.readingBusy ? state.readingStage >= definitions.findIndex(x => x[0] === id) : Boolean(state.reading);
    return `<div class="metric-card ${stageShown && item ? "" : "pending"}"><div class="metric-label">${label}</div><div class="metric-value">${stageShown && item ? fmt(item.nilai, dec) : "—"}</div><div class="metric-unit">${unit} ${item ? sourceBadge(item.sumber) : ""}</div></div>`;
  }).join("")}</div>`;
}

function renderReading() {
  return `
    <section class="card" id="section-reading">
      <div class="card-head"><div><div class="section-tag">Bagian 2 · pembacaan chip</div><h2>Pembacaan efluen dan metabolit</h2><p class="lead">Jalankan simulasi alur perfusi, pengambilan efluen, kolorimetri, dan analisis metabolit. Nilai yang muncul merupakan data simulasi deterministik.</p></div><span class="status ${state.reading ? (state.reading.lulus ? "pass" : "fail") : ""}">${state.reading ? (state.reading.lulus ? "Pembacaan selesai" : "Pembacaan selesai") : "Menunggu"}</span></div>
      ${renderChipDiagram()}
      <div class="btn-row"><button class="btn" id="start-reading" type="button" ${state.readingBusy ? "disabled" : ""}>▶ ${state.reading ? "Baca ulang chip" : "Mulai pembacaan chip"}</button><button class="btn secondary" id="reset-reading" type="button" ${state.readingBusy ? "disabled" : ""}>Atur ulang</button></div>
      <div class="divider"></div>
      <div class="reading-status" id="reading-status">${state.readingBusy ? "Simulasi pembacaan sedang berlangsung…" : state.reading ? "Pembacaan selesai. Hasil simulasi tersedia di bawah." : "Belum ada pembacaan. Tekan ‘Mulai pembacaan chip’ untuk memulai."}</div>
      <div class="reading-log">${PESAN_PEMBACAAN_CHIP.map((msg,i)=>`<div class="log-line ${state.readingStage > i ? "done" : state.readingStage === i ? "current" : ""}"><span class="log-dot"></span><span>${escapeHTML(msg)}</span></div>`).join("")}</div>
      ${renderReadingMetrics()}
    </section>`;
}

function renderRelease() {
  if (!state.reading) {
    const msg = state.configDirty
      ? "Konfigurasi berubah — baca ulang chip untuk memperbarui."
      : "Selesaikan pembacaan chip terlebih dahulu untuk menilai kriteria rilis bets.";
    return `<section class="card" id="section-release"><div class="section-tag">Bagian 3 · kriteria rilis bets</div><h2>Sidik Jari Ontogeni</h2>${disabledLock(state.configDirty ? "Hasil rilis dikunci" : "Belum ada hasil pembacaan", msg)}</section>`;
  }
  const r = state.reading;
  const failed = r.kriteria.filter(x => !x.lulus);
  return `<section class="card" id="section-release">
    <div class="card-head"><div><div class="section-tag">Bagian 3 · kriteria rilis bets</div><h2>Sidik Jari Ontogeni</h2><p class="lead">Tidak ada bets yang dipakai sebelum lulus seluruh butir. Ambang diumumkan di muka; kolom sumber menyatakan mana yang terikat rujukan dan mana yang masih ambang tempatan.</p></div><span class="status ${r.lulus ? "pass" : "fail"}">${r.lulus ? "✓ LULUS" : "✕ DITOLAK"}</span></div>
    <div class="table-wrap"><table><thead><tr><th>Parameter dan metode</th><th>Nilai terukur</th><th>Ambang terima</th><th>Dasar ambang</th><th>Status</th></tr></thead><tbody>
      ${r.kriteria.map(k=>`<tr class="${k.lulus ? "pass-row" : "fail-row"}"><td><strong>${escapeHTML(k.nama)}</strong><br><span class="muted">${escapeHTML(k.metode)}</span></td><td>${fmt(k.nilai,k.desimal)} ${escapeHTML(k.satuan)}</td><td>${k.maxOnly ? `< ${fmt(k.maxAmbang,0)}` : `${fmt(k.lo,k.desimal)} – ${fmt(k.hi,k.desimal)}`}</td><td>${sourceBadge(k.sumber)} <span class="muted">${k.sumber === "T" ? "Ambang tempatan" : k.sumber === "i" ? "Interpolasi" : "Rujukan pustaka"}</span></td><td><span class="status ${k.lulus ? "pass" : "fail"}">${k.lulus ? "✓ LULUS" : "✕ TIDAK LULUS"}</span></td></tr>`).join("")}
    </tbody></table></div>
    <div class="verdict ${r.lulus ? "pass" : "fail"}"><strong>${r.lulus ? "Bets lulus" : "Bets ditolak"}</strong><br>${escapeHTML(r.spanduk)}</div>
    <div class="legend"><span>${sourceBadge("1")} Berujukan</span><span>${sourceBadge("i")} Interpolasi</span><span>${sourceBadge("T")} Tempatan</span></div>
    ${!r.lulus ? `<div class="warning-list"><div class="warning-item">Bagian Profil Subjek, Obat Uji, dan Luaran dikunci karena bets tidak memenuhi seluruh kriteria rilis.</div><div class="btn-row"><button class="btn secondary" id="jump-config">Ubah konfigurasi bets</button></div></div>` : ""}
  </section>`;
}

function renderProfile() {
  if (!isBatchReady()) {
    return `<section class="card" id="section-profile"><div class="section-tag">Bagian 4 · profil subjek simulasi</div><h2>Anak yang hendak dimodelkan</h2>${disabledLock("Bagian terkunci", "Bagian ini baru dapat digunakan setelah bets lulus Sidik Jari Ontogeni.")}</section>`;
  }
  const p = state.profile;
  const warnings = currentWarnings();
  const line = LINI_IPSC[state.config.lini];
  return `<section class="card" id="section-profile">
    <div class="card-head"><div><div class="section-tag">Bagian 4 · profil subjek simulasi</div><h2>Anak yang hendak dimodelkan</h2><p class="lead">Profil ini adalah subjek simulasi untuk model farmakokinetika, bukan rekam medis. Gunakan kode tersamar; data genetik disimpan tersamar dengan izin etik tersendiri.</p></div></div>
    <div class="form-grid cols-4">
      <div class="field"><label for="subj-code">Nama / kode subjek</label><input id="subj-code" data-profile="kodeSubjek" value="${escapeHTML(p.kodeSubjek)}"><span class="hint">Dianjurkan kode, bukan nama sebenarnya.</span></div>
      <div class="field"><label for="sex">Jenis kelamin</label><select id="sex" data-profile="jenisKelamin"><option value="perempuan" ${p.jenisKelamin === "perempuan" ? "selected" : ""}>Perempuan</option><option value="laki-laki" ${p.jenisKelamin === "laki-laki" ? "selected" : ""}>Laki-laki</option></select><span class="hint">Dipakai untuk batas atas normal ALT.</span></div>
      <div class="field"><label for="age">Usia</label><div class="field-row"><input id="age" type="number" min="0" step="any" data-profile="usia" value="${escapeHTML(p.usia)}"><select id="age-unit" data-profile="satuanUsia"><option value="tahun" ${p.satuanUsia === "tahun" ? "selected" : ""}>tahun</option><option value="bulan" ${p.satuanUsia === "bulan" ? "selected" : ""}>bulan</option><option value="hari" ${p.satuanUsia === "hari" ? "selected" : ""}>hari</option></select></div><span class="hint">Varian berdasarkan usia: <strong>${p.usia ? petaUsiaKeVarian(p.usia,p.satuanUsia) : "—"}</strong></span></div>
      <div class="field"><label for="weight">Berat badan (kg)</label><div class="field-row"><input id="weight" type="number" min="0.1" step="0.1" data-profile="berat" value="${escapeHTML(p.berat)}"><button class="btn secondary" id="auto-weight" type="button">Auto</button></div><span class="hint">Perkiraan berat berdasarkan rumus pada spesifikasi.</span></div>
    </div>
    <div class="divider"></div><div class="section-tag">Panel farmakogenetik</div>
    <div class="form-grid cols-4" style="margin-top:12px">
      <div class="field"><label for="nat2">NAT2 — fenotipe asetilator</label><select id="nat2" data-profile="nat2"><option value="cepat" ${p.nat2 === "cepat" ? "selected" : ""}>Cepat</option><option value="menengah" ${p.nat2 === "menengah" ? "selected" : ""}>Menengah</option><option value="lambat" ${p.nat2 === "lambat" ? "selected" : ""}>Lambat</option></select><span class="hint">Populasi Melayu Indonesia: cepat 10%, menengah 52%, lambat 38% ${sourceBadge("8")}</span></div>
      <div class="field"><label for="rs">NAT2 rs1495741</label><select id="rs" data-profile="rs1495741"><option>GG</option><option ${p.rs1495741 === "GA" ? "selected" : ""}>GA</option><option ${p.rs1495741 === "AA" ? "selected" : ""}>AA</option></select><span class="hint">Penanda risiko cedera hati pada regimen antituberkulosis.</span></div>
      <div class="field"><label for="ugt">UGT1A1</label><select id="ugt" data-profile="ugt1a1"><option>*1/*1</option><option ${p.ugt1a1 === "*1/*6" ? "selected" : ""}>*1/*6</option><option ${p.ugt1a1 === "*6/*6" ? "selected" : ""}>*6/*6</option></select><span class="hint">Memengaruhi glukuronidasi parasetamol.</span></div>
      <div class="field"><label for="cyp">CYP2C19</label><select id="cyp" data-profile="cyp2c19"><option value="normal">Normal</option><option value="menengah" ${p.cyp2c19 === "menengah" ? "selected" : ""}>Menengah</option><option value="lambat" ${p.cyp2c19 === "lambat" ? "selected" : ""}>Lambat</option></select><span class="hint">Dicatat pada laporan; belum memengaruhi obat versi ini.</span></div>
      <div class="field"><label for="comed">Ko-medikasi</label><select id="comed" data-profile="koMedikasi"><option value="tidak">Tidak ada</option><option value="rifampisin" ${p.koMedikasi === "rifampisin" ? "selected" : ""}>Rifampisin</option><option value="lain-lain" ${p.koMedikasi === "lain-lain" ? "selected" : ""}>Lain-lain</option></select></div>
      <div class="field"><label for="liver-history">Riwayat gangguan hati sebelumnya</label><select id="liver-history" data-profile="riwayatHati"><option value="tidak">Tidak ada</option><option value="ada" ${p.riwayatHati === "ada" ? "selected" : ""}>Ada</option></select></div>
      <div class="field"><label>Lini iPSC pada bets</label><input value="${escapeHTML(state.config.lini)} · NAT2 ${escapeHTML(line.nat2)}" disabled></div>
    </div>
    ${warnings.length ? `<div class="warning-list">${warnings.map(w=>`<div class="warning-item">${escapeHTML(w)}</div>`).join("")}</div>` : ""}
    <div class="btn-row"><button class="btn secondary" id="reset-profile" type="button">Pulihkan profil awal</button><span class="small muted">Perubahan profil akan digunakan saat TUNAS-Link dijalankan.</span></div>
  </section>`;
}

function renderDrug() {
  if (!isBatchReady()) return `<section class="card" id="section-drug"><div class="section-tag">Bagian 5 · obat uji</div><h2>Zat yang dipaparkan pada chip</h2>${disabledLock("Bagian terkunci", "Obat uji baru dapat dipilih setelah bets lulus.")}</section>`;
  const obat = OBAT_KATALOG[state.obatId];
  return `<section class="card" id="section-drug">
    <div class="section-tag">Bagian 5 · obat uji</div><h2>Zat yang dipaparkan pada chip</h2>
    <p class="lead">Urutan kalibrasi mengikuti rencana tim: isoniazid tunggal lebih dahulu, lalu rifampisin dan pirazinamid terpisah, baru kombinasi — agar perubahan respons dapat ditelusuri sumbernya.</p>
    <div class="form-grid cols-3" style="margin-top:16px">
      <div class="field"><label for="drug-select">Obat simulasi</label><select id="drug-select">
        <option value="isoniazid" ${state.obatId === "isoniazid" ? "selected" : ""}>Isoniazid — terkalibrasi</option>
        <option value="parasetamol" ${state.obatId === "parasetamol" ? "selected" : ""}>Parasetamol — parameter tempatan</option>
        <option value="kafein" ${state.obatId === "kafein" ? "selected" : ""}>Kafein sitrat — parameter tempatan</option>
        <option value="rifampisin" disabled>Rifampisin — menunggu kalibrasi</option>
        <option value="pirazinamid" disabled>Pirazinamid — menunggu kalibrasi</option>
        <option value="asam_valproat" disabled>Asam valproat — menunggu kalibrasi</option>
      </select><span class="hint">Rifampisin, pirazinamid, dan asam valproat dinonaktifkan.</span></div>
      <div class="field"><label for="dose">Dosis simulasi (mg/kg)</label><input id="dose" type="number" min="0.1" step="0.1" value="${escapeHTML(state.dosisMgKg)}"><span class="hint">Nilai awal katalog: ${fmt(obat.dosisAwalMgKg,1)} mg/kg ${sourceBadge(obatIdSource(state.obatId))}</span></div>
      <div class="field"><label>Dosis total terhitung</label><input id="dose-total" value="${fmt((Number(state.dosisMgKg)||0)*(Number(state.profile.berat)||0),2)} mg" disabled><span class="hint">Dosis simulasi × berat badan ${fmt(Number(state.profile.berat)||0,1)} kg.</span></div>
    </div>
    <div class="notice" style="margin-top:16px"><strong>Catatan keselamatan:</strong> nilai dosis hanya parameter masukan model simulasi. Platform tidak menghasilkan dosis yang dianjurkan untuk pasien.</div>
    <div class="btn-row"><button class="btn" id="run-prediction" type="button">▶ Jalankan TUNAS-Link</button><button class="btn secondary" id="clear-prediction" type="button">Hapus luaran</button></div>
  </section>`;
}

function obatIdSource(id) { return id === "isoniazid" ? "1" : "T"; }

function interpretationText(result) {
  const d = fmt(result.dosisMgKg,1);
  const v = VARIAN_USIA[result.varian]?.nama || result.varian;
  if (result.kategoriKunci === "critical") {
    return `Puncak konsentrasi yang diprediksi melampaui ambang toksik yang terbaca pada chip. Pada kombinasi usia dan genotipe ini, dosis ${d} mg/kg menempatkan subjek di atas konsentrasi tempat organoid mulai menunjukkan gangguan fungsi hepatoselular.`;
  }
  if (result.kategoriKunci === "high") {
    return `Margin antara paparan yang diprediksi dan ambang toksik in vitro sempit. Pada populasi dengan ketidakmatangan enzim seperti varian ${v}, selisih sesempit ini layak diperlakukan sebagai sinyal, bukan sebagai kebetulan.`;
  }
  if (result.kategoriKunci === "attention") {
    return `Margin berada pada rentang yang menuntut perhatian. Model memperkirakan paparan masih di bawah ambang toksik, tetapi jarak amannya belum lapang untuk populasi yang kapasitas metabolismenya sedang berubah cepat.`;
  }
  return `Margin lapang pada parameter yang diukur. Kelapangan ini hanya berlaku untuk jalur yang termasuk dalam Sidik Jari Ontogeni versi 1; cedera hati idiosinkratik tidak tertangkap oleh pembacaan ini.`;
}

function chartY(value, maxY, top, height) { return top + height - (value / maxY) * height; }
function getChartScale(result) {
  const maxObserved = Math.max(result.cmax, ...result.kurva.map(d => d.dewasa), result.tc) * 1.12;
  const steps = [0.1,0.2,0.25,0.5,1,2,2.5,5,10,20,25,50,100,200,500,1000];
  const candidates = [3,4,5].map(divisions => {
    const raw = maxObserved / divisions;
    const step = steps.find(value => value >= raw) || Math.ceil(raw);
    return { step, max: Math.ceil(maxObserved / step) * step };
  });
  return candidates.sort((a,b) => a.max - b.max || a.step - b.step)[0];
}
function renderChart(result) {
  const data = result.kurva;
  const {step,max} = getChartScale(result);
  const x0=62, y0=18, w=590, h=216;
  const x = t => x0 + (t/24)*w;
  const y = c => chartY(c,max,y0,h);
  const path = key => data.map((d,i)=>`${i===0?"M":"L"}${x(d.jam).toFixed(2)},${y(d[key]).toFixed(2)}`).join(" ");
  const grid = [];
  for(let val=0;val<=max+1e-8;val+=step){
    grid.push(`<line x1="${x0}" y1="${y(val)}" x2="${x0+w}" y2="${y(val)}" stroke="var(--grid)"/><text x="${x0-10}" y="${y(val)+4}" text-anchor="end" fill="var(--muted)" font-size="10">${formatID(val, Number.isInteger(val) ? 0 : 2)}</text>`);
  }
  const ticks=[0,4,8,12,16,20,24].map(t=>`<line x1="${x(t)}" y1="${y0+h}" x2="${x(t)}" y2="${y0+h+5}" stroke="var(--axis)"/><text x="${x(t)}" y="${y0+h+20}" text-anchor="middle" fill="var(--muted)" font-size="10">${t}</text>`).join("");
  return `<div class="chart-shell">
    <div class="chart-legend"><span class="legend-key"><i class="key-dot" style="background:var(--s1)"></i> Subjek simulasi</span><span class="legend-key"><i class="key-dot" style="background:var(--s2)"></i> Pembanding dewasa</span><span class="legend-key"><i class="key-dot" style="background:var(--critical)"></i> Ambang toksik ${sourceBadge("T")}</span></div>
    <svg class="chart-svg" id="pk-chart" viewBox="0 0 720 300" role="img" aria-label="Grafik prediksi konsentrasi obat terhadap waktu">
      ${grid.join("")}
      <line x1="${x0}" y1="${y0+h}" x2="${x0+w}" y2="${y0+h}" stroke="var(--axis)"/>
      ${ticks}
      <line x1="${x0}" y1="${y(result.tc)}" x2="${x0+w}" y2="${y(result.tc)}" stroke="var(--critical)" stroke-width="2" stroke-dasharray="6 5"/>
      <text x="${x0+w-4}" y="${Math.max(12,y(result.tc)-7)}" text-anchor="end" fill="var(--critical)" font-size="10">Ambang toksik</text>
      <path d="${path("subjek")}" fill="none" stroke="var(--s1)" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"/>
      <path d="${path("dewasa")}" fill="none" stroke="var(--s2)" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round"/>
      <circle cx="${x(result.tmax)}" cy="${y(result.cmax)}" r="5" fill="var(--s1)" stroke="var(--surface)" stroke-width="2"/>
      <text x="${Math.min(x(result.tmax)+9,x0+w-74)}" y="${Math.max(12,y(result.cmax)-11)}" fill="var(--s1)" font-size="11" font-weight="700">Cmax ${fmt(result.cmax,2)}</text>
      <text x="${x0+w/2}" y="286" text-anchor="middle" fill="var(--muted)" font-size="11">Waktu setelah pemberian (jam)</text>
      <text x="15" y="${y0+h/2}" transform="rotate(-90 15 ${y0+h/2})" text-anchor="middle" fill="var(--muted)" font-size="11">Konsentrasi (mg/L)</text>
      <g id="chart-hover" opacity="0"><line id="chart-crosshair" class="chart-hover" y1="${y0}" y2="${y0+h}"/><circle id="chart-subject-dot" r="4" fill="var(--s1)"/><circle id="chart-adult-dot" r="4" fill="var(--s2)"/><rect id="chart-tip-bg" rx="6" width="142" height="47" fill="var(--surface)" stroke="var(--rule-2)"/><text id="chart-tip-time" class="chart-tooltip" x="0" y="0"></text><text id="chart-tip-subject" class="chart-tooltip" x="0" y="0"></text><text id="chart-tip-adult" class="chart-tooltip" x="0" y="0"></text></g>
      <rect x="${x0}" y="${y0}" width="${w}" height="${h}" fill="transparent" data-chart-hit="true"/>
    </svg>
    <p class="annotation">Arahkan penunjuk pada grafik untuk melihat konsentrasi subjek dan pembanding pada jam tertentu. Satu sumbu Y digunakan untuk kedua seri.</p>
  </div>`;
}

function renderOutput() {
  const result = state.lastResult;
  if (!result) {
    const message = isBatchReady() ? "Lengkapi profil dan pilih obat uji, kemudian tekan ‘Jalankan TUNAS-Link’ untuk menghasilkan prediksi paparan." : "Luaran akan tersedia setelah bets lulus Sidik Jari Ontogeni.";
    return `<section class="card" id="section-output"><div class="section-tag">Bagian 6 · luaran</div><h2>Luaran TUNAS-Link</h2><div class="empty-note">${escapeHTML(message)}</div></section>`;
  }
  const warning = currentWarnings();
  const interpretation = interpretationText(result);
  const isInh = result.obatId === "isoniazid";
  const extras = [];
  if (isInh && result.fenotipNAT2 === "lambat") extras.push("Pada kohort anak, asetilator lambat ditemukan pada 64,52% kasus cedera hati versus 21,12% kelompok tanpa cedera hati [7].");
  if (isInh && result.varian === "TUNAS-N") extras.push("Perlu diingat bahwa proses pematangan NAT2 pada bayi berat lahir rendah dan prematur belum diketahui [3], sehingga fungsi pematangan yang dipakai model ini bersifat asumsi.");
  const riskFactors = result.faktorRisiko.length ? result.faktorRisiko : [{label:"Tidak ada pengali genetik spesifik yang diterapkan pada obat ini",nilai:1,sumber:"T"}];
  return `<section class="card" id="section-output">
    <div class="card-head"><div><div class="section-tag">Bagian 6 · luaran</div><h2>Prediksi paparan dan sinyal risiko hati</h2><p class="lead">Hasil model untuk bets ${escapeHTML(state.config.kodeBets)} dan subjek simulasi ${escapeHTML(state.profile.kodeSubjek)}.</p></div><span class="status">Data simulasi</span></div>
    <div class="hero-result ${result.kategoriKunci}"><div><div class="hero-number">${fmt(result.marginTerkoreksi,2)}×</div><div class="hero-unit">Margin keamanan terkoreksi</div></div><div class="hero-copy"><h3>${escapeHTML(result.kategori)} — ${escapeHTML(result.obatNama)} ${fmt(result.dosisMgKg,1)} mg/kg</h3><p>${escapeHTML(interpretation)}</p></div></div>
    <div class="stat-grid">
      <div class="stat"><span>Cmax diprediksi ${sourceBadge(result.obatId === "isoniazid" ? "1" : "T")}</span><strong>${fmt(result.cmax,2)}</strong><small>mg/L · model oral</small></div>
      <div class="stat"><span>AUC₀₋₂₄ ${sourceBadge(result.obatId === "isoniazid" ? "1" : "T")}</span><strong>${fmt(result.auc24,2)}</strong><small>mg·jam/L</small></div>
      <div class="stat"><span>Waktu paruh ${sourceBadge(result.obatId === "isoniazid" ? "1" : "T")}</span><strong>${fmt(result.thalf,2)}</strong><small>jam</small></div>
      <div class="stat"><span>Tmax ${sourceBadge(result.obatId === "isoniazid" ? "1" : "T")}</span><strong>${fmt(result.tmax,2)}</strong><small>jam</small></div>
      <div class="stat"><span>Tetapan eliminasi efektif</span><strong>${fmt(result.kEff,4)}</strong><small>/jam · hasil turunan model</small></div>
      <div class="stat"><span>Volume distribusi semu</span><strong>${fmt(result.V,3)}</strong><small>L/kg ${sourceBadge(result.obatId === "isoniazid" ? "1" : "T")}</small></div>
    </div>
    ${isInh ? `<div class="verdict ${result.sasaranPaparan.cmaxTercapai && result.sasaranPaparan.auc24Tercapai ? "pass" : "fail"}"><strong>Sasaran paparan isoniazid ${sourceBadge("2")}</strong><br>Cmax ≥ ${fmt(result.sasaranPaparan.cmaxMin,1)} mg/L: <strong>${result.sasaranPaparan.cmaxTercapai ? "tercapai" : "belum tercapai"}</strong> · AUC₀₋₂₄ ≥ ${fmt(result.sasaranPaparan.auc24Min,2)} mg·jam/L: <strong>${result.sasaranPaparan.auc24Tercapai ? "tercapai" : "belum tercapai"}</strong>.</div>` : ""}
    <h3 style="margin-top:20px">Kurva konsentrasi</h3>${renderChart(result)}
    <div class="two-col">
      <div class="subcard"><div class="section-tag">Jalur metabolik</div><h3>${escapeHTML(result.obatNama)}</h3><p><strong>${escapeHTML(result.jalur)}</strong></p><p>${escapeHTML(result.mekanisme)}</p></div>
      <div class="subcard"><div class="section-tag">Pengali risiko pada profil ini</div><h3>Faktor koreksi margin</h3><ul class="factor-list">${riskFactors.map(f=>`<li><span>${escapeHTML(f.label)} ${sourceBadge(f.sumber)}</span><strong>${fmt(f.nilai,2)}×</strong></li>`).join("")}</ul>${result.riskApplicable ? `<p class="small muted">Penanda rs1495741 dan fenotipe NAT2 diperlakukan sebagai determinan yang sama: model mengambil nilai terbesar, bukan mengalikannya. Riwayat gangguan hati diterapkan setelahnya bila ada.</p>` : ""}<div class="risk-meter"><span style="width:${result.meterMargin.toFixed(1)}%"></span></div><div class="small muted">Meter margin logaritmik · ${fmt(result.marginTerkoreksi,2)}×</div></div>
    </div>
    <div class="verdict ${result.kategoriKunci === "low" ? "pass" : result.kategoriKunci === "critical" ? "fail" : ""}"><strong>Interpretasi model</strong><br>${escapeHTML(interpretation)}${extras.length ? `<p style="margin:9px 0 0">${extras.map(escapeHTML).join(" ")}</p>` : ""}</div>
    ${warning.length ? `<div class="warning-list">${warning.map(w=>`<div class="warning-item">${escapeHTML(w)}</div>`).join("")}</div>` : ""}
    <div class="subcard" style="margin-top:14px"><div class="section-tag">Masukan untuk perancangan pemantauan</div><p><strong>Bagian ini adalah masukan berbasis bukti untuk perancangan studi, bukan perintah terapi.</strong></p><div class="result-grid"><div><span class="small muted">Batas atas normal ALT ${sourceBadge("10")}</span><br><strong>${fmt(result.altULN,0)} U/L</strong></div><div><span class="small muted">Ambang DILI (ALT ≥ 5× ULN) ${sourceBadge("11")}</span><br><strong>${fmt(result.ambangDILI,0)} U/L</strong></div><div><span class="small muted">ALT efluen chip ${sourceBadge("T")}</span><br><strong>${fmt(result.altEfluen,1)} U/L</strong></div></div></div>
    <h3 style="margin-top:20px">Rantai perhitungan</h3><p class="small muted">Setiap nilai penting ditampilkan bersama asal parameter atau rumusnya.</p>
    <div class="table-wrap"><table><thead><tr><th>Langkah</th><th>Nilai</th><th>Asal</th></tr></thead><tbody>${result.rantai.map(row=>`<tr><td>${escapeHTML(row.langkah)}</td><td><strong>${escapeHTML(row.nilai)}</strong></td><td>${escapeHTML(row.asal)}</td></tr>`).join("")}</tbody></table></div>
    <div class="btn-row"><button class="btn" id="export-json">↓ Ekspor laporan JSON</button><button class="btn secondary" id="print-report">Cetak / Simpan PDF</button></div>
    <p class="annotation">Laporan memuat data profil simulasi dan parameter yang digunakan. Pastikan tidak memasukkan identitas atau data pasien nyata.</p>
  </section>`;
}

function renderLimitations() {
  const limits = [
    ["Bukan penetapan dosis klinis", "Keluaran TUNAS-Link adalah prediksi paparan per kelompok usia dan genotipe."],
    ["Bukan diagnosis pasien", "Subjek pada Bagian 4 adalah profil simulasi."],
    ["Hanya memodelkan hati", "Chip modular untuk disambung ke modul usus dan ginjal."],
    ["Fenotipe janin bukan neonatus sejati", "Kesesuaian dinyatakan hanya pada parameter Sidik Jari Ontogeni."],
    ["Cedera hati idiosinkratik sulit ditangkap", "Makrofag mirip sel Kupffer direncanakan pada varian lanjutan."],
    ["Jalur oksidatif belum masuk versi 1", "Tidak ada penanda CYP2E1, sehingga sinyal parasetamol dibaca lewat rasio konjugasi."]
  ];
  return `<section class="card" id="section-limitations"><div class="section-tag">Bagian 7 · batasan</div><h2>Batasan penggunaan</h2><p class="lead">Keluaran konsol adalah masukan untuk perancangan riset praklinis. Batasan berikut melekat pada semua hasil simulasi.</p><div class="two-col">${limits.map(([title,desc])=>`<div class="subcard"><div class="section-tag">! Batasan</div><h3>${escapeHTML(title)}</h3><p>${escapeHTML(desc)}</p></div>`).join("")}</div><h3>Tanya jawab</h3>${FAQ_BAGIAN_7.map(item=>`<details class="accordion"><summary>${escapeHTML(item.t)}</summary><p>${escapeHTML(item.j)}</p></details>`).join("")}</section>`;
}

function renderReferences() {
  return `<section class="card" id="section-references"><div class="section-tag">Bagian 8 · rujukan</div><h2>Rujukan</h2><ol class="references">${RUJUKAN.map(item=>`<li>${escapeHTML(item.teks)}</li>`).join("")}</ol><div class="notice"><strong>Penanda sumber:</strong> [1]–[12] berujukan; [i] interpolasi; [T] ambang atau parameter tempatan yang memerlukan pengisian data Fase 1.</div></section>`;
}

function renderApp() {
  document.documentElement.dataset.theme = state.theme;
  app.innerHTML = `${renderHeader()}<div class="page-shell">${renderRail()}<main class="content">
    <section class="card" id="section-overview"><div class="card-head"><div><div class="section-tag">Tim Keycherry · Health Hackathon Pharmanova ITB 2026/2027</div><h1>Dari chip berperfusi menjadi prediksi paparan</h1><p class="lead">Konsol simulasi yang menghubungkan pembacaan chip organoid hati pediatrik dengan prediksi paparan obat berdasarkan usia dan profil farmakogenetik.</p></div></div>
      ${renderWorkflow()}
      <div class="notice"><strong>Status prototipe.</strong> Seluruh angka pada halaman ini dihasilkan oleh mesin simulasi, bukan oleh pembacaan chip yang sesungguhnya. Keluaran berupa <strong>prediksi paparan</strong> dan <strong>sinyal risiko hati in vitro</strong> — bukan penetapan dosis klinis dan bukan diagnosis pasien.</div>
    </section>
    ${renderConfig()}
    ${renderReading()}
    ${renderRelease()}
    ${renderProfile()}
    ${renderDrug()}
    ${renderOutput()}
    ${renderLimitations()}
    ${renderReferences()}
    <div class="footer-note">TUNAS-Link · Konsol Sidik Jari Ontogeni · PROTOTIPE ANTARMUKA · DATA SIMULASI</div>
  </main></div>`;
  attachChartInteractions();
}

function resetDownstream({ keepReading = false } = {}) {
  if (!keepReading) state.reading = null;
  state.configDirty = false;
  state.lastResult = null;
  state.readingStage = -1;
  state.exportReady = false;
}

function setActiveByTarget(target) {
  const idx = STEP_LINKS.findIndex(step => step[3] === target);
  if (idx >= 0) state.activeStep = idx + 1;
}

function sleep(ms) { return new Promise(resolve => setTimeout(resolve, ms)); }

async function startReading() {
  if (state.readingBusy) return;
  state.readingBusy = true;
  state.reading = null;
  state.lastResult = null;
  state.readingStage = -1;
  renderApp();
  for (let i = 0; i < PESAN_PEMBACAAN_CHIP.length; i++) {
    state.readingStage = i;
    renderApp();
    await sleep(480);
  }
  const result = simulasiPembacaanChip({
    kodeBets: state.config.kodeBets,
    kodeChip: state.config.kodeChip,
    varian: state.config.varian,
    lini: state.config.lini,
    hari: Number(state.config.hari)
  });
  state.reading = result;
  state.configDirty = false;
  state.readingBusy = false;
  state.readingStage = PESAN_PEMBACAAN_CHIP.length;
  state.activeStep = 3;
  renderApp();
  document.getElementById("section-release")?.scrollIntoView({ behavior: "smooth", block: "start" });
}

function getProfilePayload() {
  return {
    kodeSubjek: state.profile.kodeSubjek,
    jenisKelamin: state.profile.jenisKelamin,
    usia: Number(state.profile.usia),
    satuanUsia: state.profile.satuanUsia,
    berat: Number(state.profile.berat),
    nat2: state.profile.nat2,
    rs1495741: state.profile.rs1495741,
    ugt1a1: state.profile.ugt1a1,
    cyp2c19: state.profile.cyp2c19,
    koMedikasi: state.profile.koMedikasi,
    riwayatHati: state.profile.riwayatHati
  };
}

function runPrediction() {
  if (!isBatchReady()) {
    alert("Bets harus lulus Sidik Jari Ontogeni sebelum prediksi dijalankan.");
    return;
  }
  const payload = getProfilePayload();
  if (!payload.kodeSubjek.trim() || state.profile.usia.trim() === "" || !Number.isFinite(payload.usia) || !(payload.usia >= 0) || !(payload.berat > 0)) {
    alert("Periksa kode subjek, usia, dan berat badan. Semua harus diisi dengan nilai yang valid.");
    return;
  }
  const dose = Number(state.dosisMgKg);
  if (!(dose > 0)) {
    alert("Dosis simulasi harus lebih besar dari nol.");
    return;
  }
  try {
    state.lastResult = prediksiPaparan({
      obatId: state.obatId,
      dosisMgKg: dose,
      beratKg: payload.berat,
      usiaNilai: payload.usia,
      usiaSatuan: payload.satuanUsia,
      varian: state.config.varian,
      fenotipNAT2: payload.nat2,
      rs1495741: payload.rs1495741,
      ugt1a1: payload.ugt1a1,
      riwayatHati: payload.riwayatHati,
      koMedikasi: payload.koMedikasi,
      jenisKelamin: payload.jenisKelamin,
      pembacaanChip: state.reading
    });
    state.activeStep = 6;
    renderApp();
    document.getElementById("section-output")?.scrollIntoView({ behavior: "smooth", block: "start" });
  } catch (error) {
    alert(`Prediksi belum dapat dihitung: ${error.message}`);
  }
}

function downloadJSON() {
  if (!state.lastResult) return;
  const payload = {
    metadata: {
      platform: "TUNAS-Link",
      label: HEADER_BADGE_TEXT,
      generatedAt: new Date().toISOString(),
      note: "Data simulasi riset praklinis; bukan diagnosis dan bukan penetapan dosis klinis."
    },
    konfigurasiBets: state.config,
    hasilPembacaanChip: state.reading,
    profilSubjekSimulasi: state.profile,
    hasilPrediksi: state.lastResult
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `TUNAS-Link-${state.config.kodeBets}-${state.profile.kodeSubjek}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

function attachChartInteractions() {
  const svg = document.getElementById("pk-chart");
  if (!svg || !state.lastResult) return;
  const hover = $("#chart-hover", svg);
  const cross = $("#chart-crosshair", svg);
  const subjectDot = $("#chart-subject-dot", svg);
  const adultDot = $("#chart-adult-dot", svg);
  const tipBg = $("#chart-tip-bg", svg);
  const tipTime = $("#chart-tip-time", svg);
  const tipSubject = $("#chart-tip-subject", svg);
  const tipAdult = $("#chart-tip-adult", svg);
  const x0=62,y0=18,w=590,h=216;
  const { max } = getChartScale(state.lastResult);
  const y = value => y0+h-(value/max)*h;
  svg.addEventListener("pointermove", event => {
    const rect = svg.getBoundingClientRect();
    const viewX = ((event.clientX-rect.left)/rect.width)*720;
    const t = Math.max(0,Math.min(24,((viewX-x0)/w)*24));
    const index = Math.min(state.lastResult.kurva.length-1,Math.round(t/0.25));
    const point = state.lastResult.kurva[index];
    const px = x0 + (point.jam/24)*w;
    const py1 = y(point.subjek);
    const py2 = y(point.dewasa);
    cross.setAttribute("x1",px);cross.setAttribute("x2",px);cross.setAttribute("opacity","1");
    subjectDot.setAttribute("cx",px);subjectDot.setAttribute("cy",py1);
    adultDot.setAttribute("cx",px);adultDot.setAttribute("cy",py2);
    const boxX = px > 500 ? px-150 : px+10;
    const boxY = 24;
    tipBg.setAttribute("x",boxX);tipBg.setAttribute("y",boxY);
    tipTime.setAttribute("x",boxX+8);tipTime.setAttribute("y",boxY+13);
    tipSubject.setAttribute("x",boxX+8);tipSubject.setAttribute("y",boxY+27);
    tipAdult.setAttribute("x",boxX+8);tipAdult.setAttribute("y",boxY+40);
    tipTime.textContent = `Jam ${fmt(point.jam,2)}`;
    tipSubject.textContent = `Subjek: ${fmt(point.subjek,2)} mg/L`;
    tipAdult.textContent = `Dewasa: ${fmt(point.dewasa,2)} mg/L`;
    hover.setAttribute("opacity","1");
  });
  svg.addEventListener("pointerleave",()=>hover.setAttribute("opacity","0"));
}

// Event delegation keeps controls functional after a section is re-rendered.
app.addEventListener("click", async event => {
  const nav = event.target.closest("[data-nav]");
  if (nav) {
    const target = nav.dataset.nav;
    setActiveByTarget(target);
    renderApp();
    document.querySelector(target)?.scrollIntoView({ behavior: "smooth", block: "start" });
    return;
  }
  if (event.target.closest("#theme-toggle")) {
    state.theme = state.theme === "light" ? "dark" : "light";
    renderApp();
    return;
  }
  if (event.target.closest("#start-reading")) { await startReading(); return; }
  if (event.target.closest("#reset-reading")) {
    state.reading = null;state.configDirty = false;state.readingStage = -1;state.lastResult = null;state.activeStep = 2;renderApp();return;
  }
  if (event.target.closest("#reset-config")) {
    state.config = { kodeBets:"KC-B-2026-014",kodeChip:"CHIP-07",varian:"TUNAS-I",lini:"KC-REF-01",hari:"7" };
    resetDownstream();renderApp();return;
  }
  if (event.target.closest("#jump-config")) { document.getElementById("section-config")?.scrollIntoView({behavior:"smooth"});return; }
  if (event.target.closest("#auto-weight")) {
    state.profile.berat = String(Number(hitungBeratOtomatis(state.profile.usia,state.profile.satuanUsia).toFixed(1)));
    renderApp();return;
  }
  if (event.target.closest("#reset-profile")) {
    state.profile = { kodeSubjek:"SBJ-001",jenisKelamin:"perempuan",usia:"4",satuanUsia:"tahun",berat:"16",nat2:"menengah",rs1495741:"GG",ugt1a1:"*1/*1",cyp2c19:"normal",koMedikasi:"tidak",riwayatHati:"tidak" };
    state.lastResult=null;renderApp();return;
  }
  if (event.target.closest("#run-prediction")) { runPrediction();return; }
  if (event.target.closest("#clear-prediction")) { state.lastResult=null;renderApp();return; }
  if (event.target.closest("#export-json")) { downloadJSON();return; }
  if (event.target.closest("#print-report")) { window.print();return; }
});

app.addEventListener("change", event => {
  const target = event.target;
  if (target.dataset.config) {
    const key = target.dataset.config;
    const value = target.value;
    if (state.config[key] !== value) {
      const hadReading = Boolean(state.reading) || state.configDirty;
      state.config[key] = value;
      resetDownstream();
      state.configDirty = hadReading;
    }
    renderApp();
    return;
  }
  if (target.dataset.profile) {
    state.profile[target.dataset.profile] = target.value;
    state.lastResult = null;
    renderApp();
    return;
  }
  if (target.id === "drug-select") {
    state.obatId = target.value;
    state.dosisMgKg = String(OBAT_KATALOG[state.obatId].dosisAwalMgKg);
    state.lastResult = null;
    renderApp();
    return;
  }
  if (target.id === "dose") {
    state.dosisMgKg = target.value;
    state.lastResult = null;
    const total = document.getElementById("dose-total");
    if (total) total.value = `${fmt((Number(state.dosisMgKg)||0)*(Number(state.profile.berat)||0),2)} mg`;
  }
});

// Keep the calculated total dose responsive while the user types.
app.addEventListener("input", event => {
  if (event.target.id === "dose") {
    state.dosisMgKg = event.target.value;
    const total = document.getElementById("dose-total");
    if (total) total.value = `${fmt((Number(state.dosisMgKg)||0)*(Number(state.profile.berat)||0),2)} mg`;
  }
});

renderApp();
