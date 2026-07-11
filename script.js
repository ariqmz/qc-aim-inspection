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
