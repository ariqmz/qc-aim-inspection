/* ====================================================================
   MMS QC Inspection Form — Configuration

   ⚠️  EDIT INI KALAU ADA PERUBAHAN MASTER LIST

   Setelah edit, commit & push ke GitHub → auto deploy ke GitHub Pages
==================================================================== */

// ==== APPS SCRIPT WEBHOOK URL ====
// Ganti dengan URL deploy Apps Script lo (dari deploy setup)
// Contoh: https://script.google.com/macros/s/AKfycb.../exec
const APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbz0aMYjPk8jiayj-fmDet-cqoQDLOl-EaCtq8y1oYkFskG81POyExR06ZEJZ8T90Va7wA/exec";

// ==== MASTER LIST 1: INSPECTOR NAMES ====
const INSPECTORS = [
  "Sainuddin Arga",
  "Abdi Ihlas",
  "Teguh Wicaksana Putra",
  "Revy Maghriza",
  "Akhmad Mappuji",
  "Soko Adjie",
  "Tommy Adrian"
  // ✏️ Tambah/edit nama disini
];


// ==== MASTER LIST 2: PLANT LOCATIONS ====
const PLANT_LOCATIONS = [
  "Pyrite Plant",
  "Acid Plant",
  "Chloride Plant",
  "Copper Cathode Plant",
  "Makarti Camp",
  "Labota Laydown",
  "Storage Facility Area",
  "Waste Dump Facility",
  "General / Common Area"
];


// ==== MASTER LIST 3: DISCIPLINES ====
const DISCIPLINES = [
  "Civil Infrastructure",
  "Mechanical",
  "Piping Fabrication",
  "Electrical Plumbing",
  "Painting Insulation",
  "RISCA",
  "Earthwork",
  "Plant",
  "Engineering"
];


// ==== MASTER LIST 4: ACTIVITY TYPES ====
const ACTIVITY_TYPES = [
  "Welding – Structural",
  "Welding – Piping",
  "Concrete Pour",
  "Rebar Installation",
  "Steel Erection",
  "Painting / Coating",
  "Insulation Application",
  "Electrical Panel Installation",
  "Cable Termination / Pulling",
  "Scaffolding Erection / Dismantle",
  "Equipment Installation",
  "Piping Pressure Test",
  "NDT / QC Test",
  "Housekeeping / 5R",
  "Other (specify in Remarks)"
];


// ==== MASTER LIST 5: CONTRACTORS ====
const CONTRACTORS = [
  "MMS",
  "AGI",
  "HAM",
  "RGD",
  "MJM",
  "BMS",
  "Other"
];
