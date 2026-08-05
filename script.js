/* ====================================================================
   MMS QC Daily Inspection Log — Form Logic

   - Populates dropdowns from config.js
   - Handles form submission via Apps Script webhook → Google Sheet
   - Uses form-urlencoded to avoid CORS preflight
==================================================================== */

// ==== POPULATE DROPDOWNS ON PAGE LOAD ====
document.addEventListener("DOMContentLoaded", () => {
  // Set default date to today
  const dateEl = document.getElementById("date");
  const today = new Date().toISOString().split("T")[0];
  dateEl.value = today;

  // Populate dropdowns from config
  populateSelect("inspector", INSPECTORS);
  populateSelect("plantLocation", PLANT_LOCATIONS);
  populateSelect("discipline", DISCIPLINES);
  populateSelect("activityType", ACTIVITY_TYPES);
  populateSelect("contractor", CONTRACTORS);

  // Attach submit handler
  document.getElementById("inspection-form").addEventListener("submit", handleSubmit);
});

function populateSelect(elementId, options) {
  const select = document.getElementById(elementId);
  if (!select) return;
  options.forEach(opt => {
    const option = document.createElement("option");
    option.value = opt;
    option.textContent = opt;
    select.appendChild(option);
  });
}

// ==== FORM SUBMISSION ====
async function handleSubmit(event) {
  event.preventDefault();

  // Validate config
  if (!APPS_SCRIPT_URL || APPS_SCRIPT_URL === "REPLACE_WITH_YOUR_APPS_SCRIPT_URL") {
    showError("Apps Script URL belum di-setup. Cek config.js.");
    return;
  }

  // Collect form data
  const form = event.target;
  const formData = new FormData(form);
  const params = new URLSearchParams();

  // Add submission timestamp (client-side)
  params.append("submittedAt", new Date().toISOString());

  // Append all form fields
  for (const [key, value] of formData.entries()) {
    params.append(key, value);
  }

  // Disable button, show loader
  const submitBtn = document.getElementById("submit-btn");
  const btnText = submitBtn.querySelector(".btn-text");
  const btnLoader = submitBtn.querySelector(".btn-loader");
  submitBtn.disabled = true;
  btnText.style.display = "none";
  btnLoader.style.display = "inline";

  try {
    // ---- Upload foto ke Google Drive dulu (kalau ada foto dipilih) ----
    const inspectionDateVal = document.getElementById("date").value;
    const disciplineVal = document.getElementById("discipline").value;
    const inspectorVal = document.getElementById("inspector").value;

    if (selectedPhotos.length > 0) {
      const photoResult = await uploadPhotosToDrive(inspectionDateVal, disciplineVal, inspectorVal);
      if (!photoResult.success) {
        throw new Error("Upload foto gagal: " + (photoResult.error || "unknown error"));
      }
    }

    // Send POST to Apps Script webhook (form-urlencoded avoids preflight)
    const response = await fetch(APPS_SCRIPT_URL, {
      method: "POST",
      body: params,
      // Note: no Content-Type header — browser sets to application/x-www-form-urlencoded
    });

    if (!response.ok) {
      throw new Error(`Server responded ${response.status}`);
    }

    const result = await response.text();

    // Apps Script returns "OK" on success
    if (result.trim().startsWith("OK") || result.includes("success")) {
      showSuccess();
      form.reset();
      selectedPhotos = [];
      renderPhotoGrid();
      // Restore default date after reset
      document.getElementById("date").value = new Date().toISOString().split("T")[0];
    } else {
      throw new Error(result || "Unknown error");
    }
  } catch (err) {
    console.error("Submission error:", err);
    showError(`Detail: ${err.message}`);
  } finally {
    submitBtn.disabled = false;
    btnText.style.display = "inline";
    btnLoader.style.display = "none";
  }
}

// ==== STATUS UI ====
function showSuccess() {
  document.getElementById("status-success").style.display = "flex";
  document.getElementById("status-error").style.display = "none";
  document.getElementById("inspection-form").scrollIntoView({ behavior: "smooth", block: "start" });
}

function showError(detail) {
  document.getElementById("error-detail").textContent = detail || "Cek koneksi internet dan coba lagi.";
  document.getElementById("status-error").style.display = "flex";
  document.getElementById("status-success").style.display = "none";
}

function hideError() {
  document.getElementById("status-error").style.display = "none";
}

function resetForm() {
  document.getElementById("status-success").style.display = "none";
  document.getElementById("inspection-form").reset();
  document.getElementById("date").value = new Date().toISOString().split("T")[0];
  document.getElementById("inspection-form").scrollIntoView({ behavior: "smooth", block: "start" });
}
// ====================================================================
// PHOTO UPLOAD — kirim foto ke Google Drive (backend terpisah)
// ====================================================================
let selectedPhotos = []; // { base64, previewUrl }
const MAX_PHOTO_DIM = 1600;
const PHOTO_JPEG_QUALITY = 0.75;

document.addEventListener("DOMContentLoaded", () => {
  const photoInput = document.getElementById("photoInput");
  const btnTakePhoto = document.getElementById("btnTakePhoto");

  if (btnTakePhoto && photoInput) {
    btnTakePhoto.addEventListener("click", () => photoInput.click());

    photoInput.addEventListener("change", (e) => {
      Array.from(e.target.files || []).forEach((file) => {
        compressPhoto(file, MAX_PHOTO_DIM, PHOTO_JPEG_QUALITY).then((res) => {
          selectedPhotos.push(res);
          renderPhotoGrid();
        });
      });
      photoInput.value = "";
    });
  }
});

function renderPhotoGrid() {
  const grid = document.getElementById("photoGrid");
  const count = document.getElementById("photoCount");
  if (!grid) return;

  grid.innerHTML = "";
  selectedPhotos.forEach((p, idx) => {
    const thumb = document.createElement("div");
    thumb.style.cssText =
      "position:relative;aspect-ratio:1/1;border-radius:8px;overflow:hidden;border:1px solid #e5e7eb;";
    thumb.innerHTML =
      `<img src="${p.previewUrl}" style="width:100%;height:100%;object-fit:cover;display:block;">` +
      `<button type="button" style="position:absolute;top:2px;right:2px;background:rgba(0,0,0,.6);color:#fff;border:none;border-radius:50%;width:22px;height:22px;font-size:12px;cursor:pointer;">✕</button>`;
    thumb.querySelector("button").addEventListener("click", () => {
      selectedPhotos.splice(idx, 1);
      renderPhotoGrid();
    });
    grid.appendChild(thumb);
  });

  if (count) {
    count.textContent = selectedPhotos.length ? `${selectedPhotos.length} foto siap dikirim` : "";
  }
}

function compressPhoto(file, maxDim, quality) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        let w = img.width, h = img.height;
        if (w > h && w > maxDim) { h = Math.round((h * maxDim) / w); w = maxDim; }
        else if (h > maxDim) { w = Math.round((w * maxDim) / h); h = maxDim; }
        const canvas = document.createElement("canvas");
        canvas.width = w; canvas.height = h;
        canvas.getContext("2d").drawImage(img, 0, 0, w, h);
        const dataUrl = canvas.toDataURL("image/jpeg", quality);
        resolve({ base64: dataUrl.split(",")[1], previewUrl: dataUrl });
      };
      img.onerror = reject;
      img.src = e.target.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

async function uploadPhotosToDrive(inspectionDate, discipline, inspectorName) {
  if (selectedPhotos.length === 0) return { success: true, skipped: true };

  if (!PHOTO_UPLOAD_URL || PHOTO_UPLOAD_URL === "REPLACE_WITH_YOUR_PHOTO_UPLOAD_APPS_SCRIPT_URL") {
    throw new Error("PHOTO_UPLOAD_URL belum di-setup di config.js");
  }

  const payload = {
    inspectionDate,
    discipline,
    inspectorName,
    photos: selectedPhotos.map((p) => ({ base64: p.base64, mimeType: "image/jpeg", filename: "" })),
  };

  const res = await fetch(PHOTO_UPLOAD_URL, {
    method: "POST",
    headers: { "Content-Type": "text/plain;charset=utf-8" },
    body: JSON.stringify(payload),
  });

  return res.json();
}
