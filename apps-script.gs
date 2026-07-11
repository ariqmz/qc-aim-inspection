/* ====================================================================
   MMS QC Daily Inspection Log — Google Apps Script Backend

   INSTRUKSI DEPLOY:
   1. Buka Google Sheet baru (kasih nama misal "MMS QC Inspection Log")
   2. Buat sheet dengan nama tab "Inspections"
   3. Menu: Extensions → Apps Script
   4. Delete default code, paste seluruh isi file ini
   5. Save (Ctrl+S), kasih nama project misal "QC Inspection Webhook"
   6. Deploy → New deployment → Type: Web app
   7. Description: "QC Inspection Form Webhook v1"
   8. Execute as: Me (email lo)
   9. Who has access: Anyone
   10. Deploy → Authorize akses (klik Advanced → Go to project)
   11. Copy Web app URL, paste ke config.js di frontend
==================================================================== */

// ==== KONFIGURASI ====
const SHEET_NAME = "Inspections";  // Nama tab di Google Sheet

// Header columns (harus match urutan sama isi form)
const HEADERS = [
  "Submitted At",
  "Inspection Date",
  "Inspector Name",
  "Shift",
  "Plant Location",
  "WBS / Area",
  "Discipline",
  "Activity Type",
  "Reference Document",
  "Foreman / Supervisor",
  "Contractor Company",
  "Inspection Result",
  "Inspection Duration",
  "Remarks"
];

// ==== MAIN HANDLER ====
function doPost(e) {
  try {
    const sheet = getOrCreateSheet();
    const params = e.parameter;

    // Initialize header row if empty
    if (sheet.getLastRow() === 0) {
      sheet.appendRow(HEADERS);
      formatHeaderRow(sheet);
    }

    // Build row in same order as HEADERS
    const row = [
      params.submittedAt || new Date().toISOString(),
      params.date || "",
      params.inspector || "",
      params.shift || "",
      params.plantLocation || "",
      params.wbs || "",
      params.discipline || "",
      params.activityType || "",
      params.referenceDoc || "",
      params.foreman || "",
      params.contractor || "",
      params.result || "",
      params.duration || "",
      params.remarks || ""
    ];

    sheet.appendRow(row);

    // Auto-color the Result cell (Pass = green, Fail = red)
    const lastRow = sheet.getLastRow();
    const resultCol = HEADERS.indexOf("Inspection Result") + 1;
    const resultCell = sheet.getRange(lastRow, resultCol);
    if (params.result === "Pass") {
      resultCell.setBackground("#C8E6C9").setFontColor("#16A34A").setFontWeight("bold");
    } else if (params.result === "Fail") {
      resultCell.setBackground("#FFCDD2").setFontColor("#DC2626").setFontWeight("bold");
    }

    return ContentService.createTextOutput("OK")
      .setMimeType(ContentService.MimeType.TEXT);
  } catch (err) {
    return ContentService.createTextOutput("ERROR: " + err.message)
      .setMimeType(ContentService.MimeType.TEXT);
  }
}

// ==== HELPER: GET OR CREATE SHEET ====
function getOrCreateSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
  }
  return sheet;
}

// ==== HELPER: FORMAT HEADER ROW ====
function formatHeaderRow(sheet) {
  const range = sheet.getRange(1, 1, 1, HEADERS.length);
  range
    .setBackground("#8C4824")
    .setFontColor("#FFFFFF")
    .setFontWeight("bold")
    .setFontSize(11)
    .setVerticalAlignment("middle")
    .setHorizontalAlignment("center");
  sheet.setRowHeight(1, 32);
  sheet.setFrozenRows(1);

  // Auto-size columns
  for (let i = 1; i <= HEADERS.length; i++) {
    sheet.autoResizeColumn(i);
  }
}

// ==== OPTIONAL: GET HANDLER (untuk test URL di browser) ====
function doGet(e) {
  return ContentService.createTextOutput(
    "MMS QC Inspection Webhook is running.\n" +
    "This endpoint accepts POST requests only.\n" +
    "Deployment time: " + new Date().toISOString()
  ).setMimeType(ContentService.MimeType.TEXT);
}
