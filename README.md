# MMS QC Daily Inspection Log

Web form untuk record kegiatan inspeksi QC harian di MMS AIM Project. Data auto-append ke Google Sheet, deploy gratis di GitHub Pages.

## Preview

Form ini murni untuk **track quantity + coverage inspeksi harian** (Pass/Fail). Kalau Fail, follow-up SOR di-handle di form SOR terpisah.

## Struktur File

```
qc-inspection-form/
├── index.html          # Main form UI
├── styles.css          # MMS brand styling (mobile-first)
├── config.js           # ⚙️  Master lists (Inspector, WBS, dll)
├── script.js           # Form submission logic
├── apps-script.gs      # Google Apps Script backend
└── README.md           # File ini
```

---

## Setup Guide (30 menit)

Alur: **Google Sheet → Apps Script Webhook → GitHub Repo → GitHub Pages**

### STEP 1 — Setup Google Sheet + Apps Script

1. Buka https://sheets.new (bikin Google Sheet baru).
2. Kasih nama sheet: `MMS QC Inspection Log` (atau bebas).
3. Rename tab bawah dari "Sheet1" jadi **`Inspections`** (case-sensitive!).
4. Menu **Extensions → Apps Script**.
5. Delete semua default code, paste seluruh isi `apps-script.gs`.
6. Klik disk icon (Save), kasih nama project: `QC Inspection Webhook`.
7. Klik tombol **Deploy → New deployment**.
   - Icon gear (Select type) → **Web app**
   - Description: `QC Inspection Webhook v1`
   - Execute as: **Me** (email lo)
   - Who has access: **Anyone** (⚠️ ini biar form bisa POST tanpa login)
   - Klik **Deploy**
8. Authorize akses (klik Advanced → Go to project → Allow).
9. **Copy Web app URL** — bentuknya:
   ```
   https://script.google.com/macros/s/AKfycbxxxxxxxxxxxx/exec
   ```
10. **Test URL** — buka di browser, harusnya muncul "MMS QC Inspection Webhook is running."

### STEP 2 — Configure Frontend

1. Buka file `config.js`.
2. Replace baris:
   ```js
   const APPS_SCRIPT_URL = "REPLACE_WITH_YOUR_APPS_SCRIPT_URL";
   ```
   dengan URL yang lo copy tadi.
3. **Optional** — edit master lists (INSPECTORS, PLANT_LOCATIONS, dll) sesuai tim lo.

### STEP 3 — Push ke GitHub

1. Bikin repo baru di GitHub: https://github.com/new
   - Repo name: `qc-inspection-form` (atau bebas)
   - Public (biar bisa deploy ke Pages)
2. Upload semua file (`index.html`, `styles.css`, `config.js`, `script.js`, `apps-script.gs`, `README.md`).
   - Bisa via web upload (drag drop) atau git clone + push.

### STEP 4 — Enable GitHub Pages

1. Di repo GitHub, buka **Settings → Pages**.
2. Source: **Deploy from a branch**.
3. Branch: **main** (atau `master`), folder: **/ (root)**.
4. Klik **Save**.
5. Tunggu 1-2 menit, URL bakal muncul di atas — bentuknya:
   ```
   https://[username].github.io/qc-inspection-form/
   ```
6. **Test form** — buka URL, isi sample data, submit. Cek di Google Sheet apakah data masuk.

---

## Update Data / Master Lists

Kalau ada nama inspector baru atau perubahan WBS:

1. Edit `config.js` langsung di GitHub (klik file → pencil icon).
2. Commit — GitHub Pages auto re-deploy dalam 1-2 menit.

## Update Sheet Column

Kalau lo mau tambah/ganti field:

1. Update `apps-script.gs` — edit array `HEADERS` dan `row` di `doPost()`.
2. Update `index.html` — tambah field baru di form.
3. Redeploy Apps Script: **Deploy → Manage deployments → Edit (pencil) → New version → Deploy**.
4. Update `config.js` kalau perlu dropdown baru.

⚠️ **Jangan lupa** update version yang ada di URL kalau Apps Script deploy baru — biasanya URL-nya sama, jadi cuma perlu redeploy.

---

## Troubleshooting

### Form submit tapi data gak masuk sheet

- Cek URL Apps Script di `config.js` — pastikan match sama deployment URL.
- Cek Google Sheet — pastikan tab bernama `Inspections` (case-sensitive).
- Buka Apps Script → **Executions** untuk lihat log error.

### Submit button gak respond

- Buka browser DevTools (F12) → Console tab. Cek error message.
- Kemungkinan CORS issue — pastikan Apps Script deploy dengan **Who has access: Anyone**.

### Success tapi Result cell gak berwarna

- Warning aja, gak fatal. Data tetap masuk. Cek permission Apps Script di sheet.

### Auto-refresh kelamaan setelah edit

- GitHub Pages cache. Tunggu 2-5 menit, atau hard reload browser (Ctrl+F5).

---

## Fitur Yang Bisa Ditambah Nanti

- **Photo upload** (butuh Google Drive integration via Apps Script)
- **Offline mode** (Service Worker + IndexedDB — inspektor bisa isi tanpa signal, sync nanti)
- **Auto-generate inspection ID** (unique per submission)
- **Dashboard preview embed** (Looker Studio iframe di bawah form)
- **Multi-language** (English/Indonesian toggle)
- **Duplicate detection** (Apps Script check hash before append)

---

## Integrasi ke KPI Scoring System

Data dari Sheet ini nanti feed ke KPI QC:

1. **Inspection Volume** — `COUNT(submissions) per inspector per month` — target ≥60/inspektor/bulan
2. **Discipline Coverage** — `COUNT DISTINCT(discipline) per week` — target ≥1 inspeksi/discipline/week
3. **Pass Rate** — `COUNT(Pass) / COUNT(Total) × 100` — informational, bukan KPI langsung

Data yang perlu di-cross reference:
- Reference Document (CWO/WO/WR) → link ke Daily Work Plan / CWO PI Monitoring
- Discipline + Plant Location → cross-check dengan Daily Work Plan buat hitung coverage %

---

## Credits

Built for **MMS AIM Project 2026** — QAQC Department
Version 1.0 — Concept and design by Ariq M. Zulfikar

License: Internal use only
