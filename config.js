/* ====================================================================
   MMS QC Inspection Form — Configuration

   ⚠️  EDIT INI KALAU ADA PERUBAHAN MASTER LIST

   Setelah edit, commit & push ke GitHub → auto deploy ke GitHub Pages
==================================================================== */

// ==== APPS SCRIPT WEBHOOK URL ====
// Ganti dengan URL deploy Apps Script lo (dari deploy setup)
// Contoh: https://script.google.com/macros/s/AKfycb.../exec
const APPS_SCRIPT_URL = "REPLACE_WITH_YOUR_APPS_SCRIPT_URL";


// ==== MASTER LIST 1: INSPECTOR NAMES ====
const INSPECTORS = [
  "Aswin",
  "Mhd Bahri",
  "Khoirul Ikhsan",
  "Freddy Simanjuntak",
  "Dimas Subiantoro",
  "Moch. Ikhwan",
  "Sainuddin Arga",
  "Aden Shoif",
  "Teguh Wicaksana Putra",
  "Lili Afrilyani",
  "Intan Rahmani"
  // ✏️ Tambah/edit nama disini
];


// ==== MASTER LIST 2: PLANT LOCATIONS ====
const PLANT_LOCATIONS = [
  "Pyrite Plant",
  "Acid Plant",
  "Chloride Plant",
  "Copper Cathode Plant (CCP)",
  "Makarti Camp",
  "Labota Laydown",
  "Storage Facility Area (SFA)",
  "Waste Dump Facility (WDF)",
  "General / Common Area"
];


// ==== MASTER LIST 3: DISCIPLINES ====
const DISCIPLINES = [
  "Civil & Structure",
  "Mechanical",
  "Piping & Fabrication",
  "Electrical & Instrumentation",
  "Painting & Insulation",
  "Rigging & Scaffolding",
  "EarthWork",
  "Plant Maintenance",
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
  "WIM",
  "MJM",
  "BMS",
  "IMJ",
  "SJS",
  "Superkrane",
  "Transkon Jaya",
  "GAS",
  "Other"
];
