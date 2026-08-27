/* ====================================================================
   MMS QC Daily Inspection Log — Form Logic

   - Mengisi dropdown dari config.js
   - Kompres foto di sisi ponsel sebelum dikirim (hemat kuota & cepat)
   - Kirim via form-urlencoded agar tidak kena CORS preflight
==================================================================== */

// ==== PENGATURAN FOTO ====
const MAX_PHOTOS = 10;          // jumlah maksimum foto per submit
const PHOTO_MAX_DIM = 1600;    // sisi terpanjang setelah dikompres (px)
const PHOTO_QUALITY = 0.72;    // kualitas JPEG 0-1
const PAYLOAD_LIMIT_MB = 9;    // ambang aman total kiriman

let selectedPhotos = [];       // [{ dataUrl, name, size }]

// ==== INISIALISASI ====
document.addEventListener("DOMContentLoaded", () => {
  const dateEl = document.getElementById("date");
  dateEl.value = new Date().toISOString().split("T")[0];

  populateSelect("inspector", INSPECTORS);
  populateSelect("plantLocation", PLANT_LOCATIONS);
  populateSelect("discipline", DISCIPLINES);
  populateSelect("activityType", ACTIVITY_TYPES);
  populateSelect("contractor", CONTRACTORS);

  document.getElementById("inspection-form").addEventListener("submit", handleSubmit);

  // Dua input terpisah: kamera memakai capture, galeri tidak.
  // Kalau digabung jadi satu input ber-capture, Android tidak menawarkan galeri.
  ["photos-camera", "photos-gallery"].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.addEventListener("change", handlePhotoSelect);
  });
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

// ==== FOTO: PILIH, KOMPRES, PRATINJAU ====
async function handlePhotoSelect(event) {
  const files = Array.from(event.target.files || []);
  event.target.value = ""; // supaya file yang sama bisa dipilih lagi
  if (!files.length) return;

  const slot = MAX_PHOTOS - selectedPhotos.length;
  if (slot <= 0) {
    showPhotoNote(`Maksimum ${MAX_PHOTOS} foto per inspeksi.`, true);
    return;
  }

  const batch = files.slice(0, slot);
  if (files.length > slot) {
    showPhotoNote(`Hanya ${slot} foto pertama yang ditambahkan (batas ${MAX_PHOTOS} foto).`, true);
  } else {
    showPhotoNote("Memproses foto...");
  }

  for (const file of batch) {
    if (!file.type.startsWith("image/")) continue;
    try {
      const dataUrl = await compressImage(file, PHOTO_MAX_DIM, PHOTO_QUALITY);
      selectedPhotos.push({
        dataUrl,
        name: file.name,
        size: Math.round((dataUrl.length * 3) / 4)
      });
    } catch (err) {
      console.error("Gagal memproses foto:", file.name, err);
      showPhotoNote(`Foto "${file.name}" tidak dapat dibaca. Coba format JPG atau PNG.`, true);
    }
  }

  renderPhotoPreview();
}

/**
 * Foto dari ponsel biasanya 3-8 MB. Dikecilkan dulu supaya upload
 * tetap jalan di sinyal lemah dan tidak menembus batas Apps Script.
 */
function compressImage(file, maxDim, quality) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();

    img.onload = () => {
      URL.revokeObjectURL(url);
      let w = img.naturalWidth;
      let h = img.naturalHeight;

      if (w > h && w > maxDim) {
        h = Math.round((h * maxDim) / w);
        w = maxDim;
      } else if (h >= w && h > maxDim) {
        w = Math.round((w * maxDim) / h);
        h = maxDim;
      }

      const canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d");
      ctx.fillStyle = "#FFFFFF";
      ctx.fillRect(0, 0, w, h);
      ctx.drawImage(img, 0, 0, w, h);

      try {
        resolve(canvas.toDataURL("image/jpeg", quality));
      } catch (err) {
        reject(err);
      }
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Format gambar tidak didukung browser"));
    };

    img.src = url;
  });
}

function renderPhotoPreview() {
  const wrap = document.getElementById("photo-preview");
  const counter = document.getElementById("photo-count");
  if (!wrap) return;

  wrap.innerHTML = "";

  selectedPhotos.forEach((photo, idx) => {
    const item = document.createElement("div");
    item.className = "photo-item";

    const img = document.createElement("img");
    img.src = photo.dataUrl;
    img.alt = `Foto inspeksi ${idx + 1}`;
    item.appendChild(img);

    const del = document.createElement("button");
    del.type = "button";
    del.className = "photo-remove";
    del.innerHTML = "&times;";
    del.setAttribute("aria-label", `Hapus foto ${idx + 1}`);
    del.addEventListener("click", () => {
      selectedPhotos.splice(idx, 1);
      renderPhotoPreview();
      showPhotoNote("");
    });
    item.appendChild(del);

    const size = document.createElement("span");
    size.className = "photo-size";
    size.textContent = formatBytes(photo.size);
    item.appendChild(size);

    wrap.appendChild(item);
  });

  if (counter) {
    counter.textContent = selectedPhotos.length
      ? `${selectedPhotos.length} / ${MAX_PHOTOS} foto — total ${formatBytes(totalPhotoBytes())}`
      : `Belum ada foto (maksimum ${MAX_PHOTOS})`;
  }
}

function totalPhotoBytes() {
  return selectedPhotos.reduce((sum, p) => sum + p.size, 0);
}

function formatBytes(b) {
  if (b < 1024) return b + " B";
  if (b < 1024 * 1024) return (b / 1024).toFixed(0) + " KB";
  return (b / 1024 / 1024).toFixed(1) + " MB";
}

function showPhotoNote(text, isWarn) {
  const el = document.getElementById("photo-note");
  if (!el) return;
  el.textContent = text || "";
  el.className = "photo-note" + (isWarn ? " warn" : "");
  el.style.display = text ? "block" : "none";
}

// ==== SUBMIT ====
async function handleSubmit(event) {
  event.preventDefault();

  if (!APPS_SCRIPT_URL || APPS_SCRIPT_URL === "REPLACE_WITH_YOUR_APPS_SCRIPT_URL") {
    showError("Apps Script URL belum di-setup. Cek config.js.");
    return;
  }

  const form = event.target;
  if (!form.checkValidity()) {
    form.reportValidity();
    return;
  }

  const totalMb = totalPhotoBytes() / 1024 / 1024;
  if (totalMb > PAYLOAD_LIMIT_MB) {
    showError(`Total foto ${totalMb.toFixed(1)} MB melebihi batas ${PAYLOAD_LIMIT_MB} MB. Kurangi jumlah foto.`);
    return;
  }

  const params = new URLSearchParams();
  params.append("submittedAt", new Date().toISOString());

  for (const [key, value] of new FormData(form).entries()) {
    if (key === "photos") continue; // file mentah tidak ikut dikirim
    params.append(key, value);
  }

  // Foto dikirim sebagai satu field JSON berisi base64
  const photoPayload = selectedPhotos.map((p, i) => ({
    base64: p.dataUrl,
    mimeType: "image/jpeg",
    filename: ""
  }));
  params.append("photosJson", JSON.stringify(photoPayload));

  const submitBtn = document.getElementById("submit-btn");
  const btnText = submitBtn.querySelector(".btn-text");
  const btnLoader = submitBtn.querySelector(".btn-loader");
  submitBtn.disabled = true;
  btnText.style.display = "none";
  btnLoader.style.display = "inline";
  btnLoader.textContent = selectedPhotos.length
    ? `Mengunggah ${selectedPhotos.length} foto...`
    : "Submitting...";

  try {
    const response = await fetch(APPS_SCRIPT_URL, {
      method: "POST",
      body: params
      // Tanpa header Content-Type — browser memakai
      // application/x-www-form-urlencoded sehingga tidak kena preflight.
    });

    if (!response.ok) {
      throw new Error(`Server merespons ${response.status}`);
    }

    const text = await response.text();
    let result = null;
    try {
      result = JSON.parse(text);
    } catch (err) {
      // Backend lama membalas teks biasa "OK"
      result = text.trim().startsWith("OK") ? { success: true } : null;
    }

    if (result && result.success) {
      showSuccess(result);
      form.reset();
      selectedPhotos = [];
      renderPhotoPreview();
      showPhotoNote("");
      document.getElementById("date").value = new Date().toISOString().split("T")[0];
    } else {
      throw new Error((result && result.error) || text || "Respons tidak dikenali");
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
function showSuccess(result) {
  const body = document.getElementById("success-detail");
  if (body) {
    if (result && result.photoCount) {
      body.innerHTML =
        `Data masuk ke sistem beserta ${result.photoCount} foto. ` +
        (result.folderUrl
          ? `<a href="${result.folderUrl}" target="_blank" rel="noopener">Buka folder Drive</a>`
          : "");
    } else {
      body.textContent = "Data sudah masuk ke sistem. Terima kasih!";
    }
  }
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
  selectedPhotos = [];
  renderPhotoPreview();
  showPhotoNote("");
  document.getElementById("date").value = new Date().toISOString().split("T")[0];
  document.getElementById("inspection-form").scrollIntoView({ behavior: "smooth", block: "start" });
}
