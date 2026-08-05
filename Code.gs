/**
 * ============================================================================
 * QC AIM INSPECTION — BACKEND (Google Apps Script)
 * ============================================================================
 * Fungsi:
 *  1. Menerima submit dari form (JSON: field inspeksi + foto base64).
 *  2. Menyimpan foto ke Google Drive dengan struktur folder:
 *       ROOT_FOLDER_NAME / {Inspection Date, YYYY-MM-DD} / {Discipline} /
 *  3. Menulis 1 baris log ke Google Sheet (opsional, tapi disarankan)
 *     berisi semua field form + link foto yang tersimpan.
 *
 * CARA DEPLOY:
 *  1. Buka https://script.google.com -> New Project.
 *  2. Hapus isi default, paste seluruh isi file ini.
 *  3. Ganti SPREADSHEET_ID di bawah dengan ID Google Sheet log Anda
 *     (kosongkan "" saja kalau belum punya sheet — script akan skip logging sheet,
 *      foto tetap tersimpan ke Drive).
 *  4. Klik Deploy > New deployment > pilih tipe "Web app".
 *     - Execute as: Me
 *     - Who has access: Anyone  (supaya bisa diakses dari GitHub Pages)
 *  5. Copy URL Web App yang dihasilkan (formatnya https://script.google.com/macros/s/XXXX/exec)
 *     -> ini yang dipasang di APPS_SCRIPT_URL pada file frontend (photo-upload-integration.html).
 *  6. Setiap kali Anda EDIT script ini, wajib buat "New deployment" lagi (bukan cuma Save),
 *     supaya URL Web App menjalankan versi kode terbaru.
 * ============================================================================
 */

// ==================== KONFIGURASI — SESUAIKAN DI SINI ====================

// Nama folder induk di Google Drive tempat semua foto inspeksi disimpan.
// Kalau belum ada, script akan otomatis membuatkannya di My Drive.
const ROOT_FOLDER_NAME = "QC AIM Inspection Photos";

// (Opsional) ID Google Sheet untuk mencatat log setiap submit.
// Cara ambil ID: buka sheet-nya, lihat URL:
//   https://docs.google.com/spreadsheets/d/>>>ID_ADA_DISINI<<</edit
// Kosongkan "" kalau tidak mau logging ke Sheet (foto tetap tersimpan ke Drive).
const SPREADSHEET_ID = "";

// Nama tab/sheet di dalam spreadsheet tempat log ditulis.
const SHEET_NAME = "Inspection Log";

// ============================================================================

/**
 * Entry point utama — dipanggil saat frontend melakukan POST ke Web App URL.
 */
function doPost(e) {
  const result = { success: false };

  try {
    if (!e || !e.postData || !e.postData.contents) {
      throw new Error("Tidak ada data yang diterima (postData kosong).");
    }

    const payload = JSON.parse(e.postData.contents);

    // ---- 1. Validasi minimal field wajib ----
    const inspectionDate = (payload.inspectionDate || "").trim(); // format YYYY-MM-DD
    const discipline = (payload.discipline || "Unspecified").trim();

    if (!inspectionDate) {
      throw new Error("Field 'inspectionDate' wajib diisi (format YYYY-MM-DD).");
    }

    // ---- 2. Siapkan folder tujuan: ROOT / {tanggal} / {discipline} ----
    const targetFolder = getOrCreateFolderPath_([
      ROOT_FOLDER_NAME,
      inspectionDate,
      sanitizeFolderName_(discipline),
    ]);

    // ---- 3. Simpan semua foto yang dikirim (array base64) ----
    const savedFiles = [];
    const photos = Array.isArray(payload.photos) ? payload.photos : [];

    photos.forEach(function (photo, idx) {
      // photo = { base64: "...", mimeType: "image/jpeg", filename: "optional.jpg" }
      if (!photo || !photo.base64) return;

      const mimeType = photo.mimeType || "image/jpeg";
      const ext = mimeTypeToExt_(mimeType);
      const safeInspector = sanitizeFolderName_(payload.inspectorName || "Unknown");
      const timestamp = Utilities.formatDate(new Date(), "GMT+7", "yyyyMMdd_HHmmss");
      const filename =
        photo.filename && photo.filename.trim()
          ? photo.filename.trim()
          : `${inspectionDate}_${sanitizeFolderName_(discipline)}_${safeInspector}_${timestamp}_${idx + 1}.${ext}`;

      const blob = Utilities.newBlob(
        Utilities.base64Decode(cleanBase64_(photo.base64)),
        mimeType,
        filename
      );

      const file = targetFolder.createFile(blob);
      // Supaya link foto bisa dibuka langsung dari Google Sheet tanpa perlu login manual approve tiap file:
      file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);

      savedFiles.push({
        fileName: filename,
        fileUrl: file.getUrl(),
        fileId: file.getId(),
      });
    });

    // ---- 4. Tulis log ke Google Sheet (kalau SPREADSHEET_ID diisi) ----
    if (SPREADSHEET_ID) {
      appendLogRow_(payload, targetFolder.getUrl(), savedFiles);
    }

    result.success = true;
    result.folderUrl = targetFolder.getUrl();
    result.savedFiles = savedFiles;
  } catch (err) {
    result.success = false;
    result.error = err.message;
  }

  return ContentService.createTextOutput(JSON.stringify(result)).setMimeType(
    ContentService.MimeType.JSON
  );
}

/**
 * Dipanggil browser saat GET (mis. buka URL Web App langsung di browser).
 * Berguna untuk test cepat apakah deployment aktif.
 */
function doGet(e) {
  return ContentService.createTextOutput(
    JSON.stringify({ status: "QC AIM Inspection backend is running." })
  ).setMimeType(ContentService.MimeType.JSON);
}

// ============================== HELPER FUNCTIONS ==============================

/**
 * Membuat (atau mengambil kalau sudah ada) rangkaian folder bersarang di Drive.
 * pathParts = ["QC AIM Inspection Photos", "2026-08-03", "Civil"]
 * -> hasil: folder "Civil" di dalam "2026-08-03" di dalam "QC AIM Inspection Photos"
 */
function getOrCreateFolderPath_(pathParts) {
  let currentFolder = null;

  pathParts.forEach(function (name, i) {
    const parent = i === 0 ? DriveApp.getRootFolder() : currentFolder;
    currentFolder = getOrCreateSubFolder_(parent, name);
  });

  return currentFolder;
}

function getOrCreateSubFolder_(parentFolder, folderName) {
  const existing = parentFolder.getFoldersByName(folderName);
  if (existing.hasNext()) {
    return existing.next();
  }
  return parentFolder.createFolder(folderName);
}

/**
 * Membersihkan nama folder/file dari karakter yang tidak aman,
 * dan merapikan spasi (mis. "Civil Works" -> "Civil Works", "M/E" -> "M-E").
 */
function sanitizeFolderName_(name) {
  return String(name)
    .trim()
    .replace(/[\\/:*?"<>|]/g, "-")
    .replace(/\s+/g, " ")
    .slice(0, 100);
}

/**
 * Beberapa browser mengirim base64 dengan prefix "data:image/jpeg;base64,....".
 * Fungsi ini membuang prefix tersebut kalau ada.
 */
function cleanBase64_(base64String) {
  const commaIdx = base64String.indexOf(",");
  if (base64String.substring(0, 5) === "data:" && commaIdx !== -1) {
    return base64String.substring(commaIdx + 1);
  }
  return base64String;
}

function mimeTypeToExt_(mimeType) {
  const map = {
    "image/jpeg": "jpg",
    "image/jpg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
    "image/heic": "heic",
  };
  return map[mimeType] || "jpg";
}

/**
 * Menambahkan 1 baris ke Google Sheet log, termasuk kolom untuk semua
 * field form yang relevan + link folder Drive + link tiap foto.
 * Sesuaikan urutan kolom di HEADER_ROW sesuai kebutuhan Anda.
 */
function appendLogRow_(payload, folderUrl, savedFiles) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  let sheet = ss.getSheetByName(SHEET_NAME);

  const HEADER_ROW = [
    "Timestamp Submit",
    "Inspection Date",
    "Inspector Name",
    "Shift",
    "Plant Location",
    "WBS / Area Detail",
    "Discipline",
    "Activity Type / Scope",
    "Reference Document",
    "Foreman / Supervisor",
    "Contractor",
    "Result",
    "Duration",
    "Remarks",
    "Folder Drive",
    "Link Foto",
  ];

  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
    sheet.appendRow(HEADER_ROW);
    sheet.setFrozenRows(1);
  }

  const photoLinks = savedFiles.map((f) => f.fileUrl).join("\n");

  sheet.appendRow([
    new Date(),
    payload.inspectionDate || "",
    payload.inspectorName || "",
    payload.shift || "",
    payload.plantLocation || "",
    payload.wbsArea || "",
    payload.discipline || "",
    payload.activityType || "",
    payload.referenceDocument || "",
    payload.foremanName || "",
    payload.contractor || "",
    payload.inspectionResult || "",
    payload.duration || "",
    payload.remarks || "",
    folderUrl,
    photoLinks,
  ]);
}
