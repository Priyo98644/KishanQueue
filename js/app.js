// ============================================================
// KISANQUEUE ENGINE - CORE APPLICATION LOGIC
// ============================================================

const getHttpBase = () => {
  if (window.CONFIG && window.CONFIG.HTTP_BASE) return window.CONFIG.HTTP_BASE;
  if (typeof API_BASE_URL !== "undefined") return API_BASE_URL;
  return (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1")
    ? "http://127.0.0.1:8000"
    : "https://kishanqueue-api.onrender.com";
};

const getWsBase = () => {
  if (window.CONFIG && window.CONFIG.WS_BASE) return window.CONFIG.WS_BASE;
  if (typeof WS_BASE_URL !== "undefined") return WS_BASE_URL;
  return (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1")
    ? "ws://127.0.0.1:8000/ws"
    : "wss://kishanqueue-api.onrender.com/ws";
};

const RECONNECT_INTERVAL = (window.CONFIG && window.CONFIG.RECONNECT_INTERVAL_MS) || 3000;
const BASE_PROCESSING_MINS = (window.CONFIG && window.CONFIG.BASE_PROCESSING_MINS) || 3.0;
const MINS_PER_QUINTAL = (window.CONFIG && window.CONFIG.MINS_PER_QUINTAL) || 0.10;

const state = {
  selectedCentre: "Centre A",
  activeToken: JSON.parse(localStorage.getItem("kq_active_token")) || null,
  socket: null,
  queueData: { total: 0, waiting: 0, processing: 0, completed: 0, tokens: [], active_counters: 2 },
  authenticatedFarmer: null
};

let currentAuthType = "KRISHAK_BANDHU";
let verifiedFarmerData = null;

// ============================================================
// 1. GATEWAY & VIEW ROUTER (WITH APPLICANT LOGIN SCREEN)
// ============================================================
function initGatewayNavigation() {
  const panelGateway = document.getElementById("panel-gateway");
  const panelFarmerLogin = document.getElementById("panel-farmer-login");
  const panelFarmer = document.getElementById("panel-farmer");
  const panelOperator = document.getElementById("panel-operator");
  const btnReturnGateway = document.getElementById("btn-back-gateway");

  function switchDoorway(activePanel, contextName) {
    [panelGateway, panelFarmerLogin, panelFarmer, panelOperator].forEach(p => {
      if (p) p.classList.remove("active");
    });

    if (activePanel) {
      activePanel.classList.add("active");
    }

    if (btnReturnGateway) {
      btnReturnGateway.style.display = (activePanel === panelGateway) ? "none" : "inline-flex";
    }

    // Trigger floating AI widget morphing
    if (window.updateFloatingWidgetContext) {
      window.updateFloatingWidgetContext(contextName);
    }

    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  // 1. Enter Citizen Login Screen (Reference Screen)
  const btnEnterFarmer = document.getElementById("btn-enter-farmer");
  if (btnEnterFarmer) {
    btnEnterFarmer.addEventListener("click", () => switchDoorway(panelFarmerLogin, "GATEWAY"));
  }

  // 2. Enter Operator Screen
  const btnEnterOperator = document.getElementById("btn-enter-operator");
  if (btnEnterOperator) {
    btnEnterOperator.addEventListener("click", () => switchDoorway(panelOperator, "OPERATOR"));
  }

  const btnWeighbridge = document.getElementById("btn-enter-operator-weighbridge");
  if (btnWeighbridge) {
    btnWeighbridge.addEventListener("click", () => switchDoorway(panelOperator, "OPERATOR"));
  }

  const btnAssayer = document.getElementById("btn-enter-operator-assayer");
  if (btnAssayer) {
    btnAssayer.addEventListener("click", () => switchDoorway(panelOperator, "OPERATOR"));
  }

  // 3. Return to Gateway
  if (btnReturnGateway) {
    btnReturnGateway.addEventListener("click", () => switchDoorway(panelGateway, "GATEWAY"));
  }

  document.querySelectorAll(".breadcrumb-back-btn").forEach(btn => {
    btn.addEventListener("click", () => switchDoorway(panelGateway, "GATEWAY"));
  });

  // Export switch helper to window
  window.navigateToFarmerDashboard = () => switchDoorway(panelFarmer, "FARMER");
}

// ============================================================
// 2. APPLICANT LOGIN HANDLER (MATCHES REFERENCE CARD ACTIONS)
// ============================================================
function initApplicantLogin() {
  const districtSelect = document.getElementById("applicantDistrict");
  const mobileInput = document.getElementById("applicantMobile");
  const otpRow = document.getElementById("applicantOtpRow");
  const otpCodeInput = document.getElementById("applicantOtpCode");
  const otpStatus = document.getElementById("applicantOtpStatus");
  const submitBtn = document.getElementById("btn-applicant-submit");
  const btnText = document.getElementById("applicantBtnText");

  let otpRequested = false;

  if (!submitBtn) return;

  submitBtn.addEventListener("click", async () => {
    const district = districtSelect.value;
    const mobile = mobileInput.value.trim();

    if (!district) {
      alert("District selection is mandatory before login.");
      districtSelect.focus();
      return;
    }

    if (!mobile || mobile.length !== 10) {
      alert("Please enter a valid 10-digit registered mobile number.");
      mobileInput.focus();
      return;
    }

    // Step 1: Request OTP
    if (!otpRequested) {
      btnText.innerText = "Requesting OTP...";
      submitBtn.disabled = true;

      try {
        const res = await fetch(`${getHttpBase()}/api/auth/send-otp`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ mobile })
        });
        const data = await res.json();

        otpRequested = true;
        otpRow.style.display = "block";
        otpCodeInput.value = data.demo_otp || "123456";
        btnText.innerText = "Verify OTP & Enter Portal →";
        submitBtn.style.background = "#059669"; // Turn green for verification

        otpStatus.style.color = "#047857";
        otpStatus.innerText = `Demo OTP dispatched: ${data.demo_otp || "123456"}`;
      } catch (err) {
        // Fallback for offline demo
        otpRequested = true;
        otpRow.style.display = "block";
        otpCodeInput.value = "123456";
        btnText.innerText = "Verify OTP & Enter Portal →";
        submitBtn.style.background = "#059669";
        otpStatus.style.color = "#b45309";
        otpStatus.innerText = "Demo OTP: 123456 (Ready to verify)";
      } finally {
        submitBtn.disabled = false;
      }
    } 
    // Step 2: Verify OTP & Log In
    else {
      const code = otpCodeInput.value.trim();
      if (!code) {
        alert("Please enter the OTP sent to your phone.");
        return;
      }

      submitBtn.innerText = "Authenticating...";
      submitBtn.disabled = true;

      setTimeout(() => {
        // Populate Farmer Portal form with login credentials
        state.authenticatedFarmer = { district, mobile };
        const mobileTarget = document.getElementById("mobile");
        const villageTarget = document.getElementById("village");
        if (mobileTarget) mobileTarget.value = mobile;
        if (villageTarget) villageTarget.value = `${district} Block`;

        // Switch smoothly to the Farmer Dashboard & Pass View
        window.navigateToFarmerDashboard();

        // Reset login form for next session
        submitBtn.disabled = false;
        btnText.innerText = "Request OTP →";
        submitBtn.style.background = "#d4a373";
        otpRow.style.display = "none";
        otpRequested = false;
      }, 600);
    }
  });
}

// ============================================================
// 3. WEBSOCKET REAL-TIME ENGINE
// ============================================================
function initWebSocket() {
  const statusIndicator = document.getElementById("connection-status");
  const offlineBanner = document.getElementById("offline-banner");

  try {
    state.socket = new WebSocket(getWsBase());

    state.socket.onopen = () => {
      if (statusIndicator) {
        statusIndicator.textContent = "🟢 Live Connected";
        statusIndicator.classList.add("connected");
      }
      if (offlineBanner) offlineBanner.style.display = "none";
      fetchCentreData(state.selectedCentre);
    };

    state.socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      handleSocketEvent(data);
    };

    state.socket.onclose = () => {
      if (statusIndicator) {
        statusIndicator.textContent = "🔴 Reconnecting...";
        statusIndicator.classList.remove("connected");
      }
      if (offlineBanner) offlineBanner.style.display = "block";
      setTimeout(initWebSocket, RECONNECT_INTERVAL);
    };

    state.socket.onerror = () => {
      state.socket.close();
    };
  } catch (err) {
    setTimeout(initWebSocket, RECONNECT_INTERVAL);
  }
}

function handleSocketEvent(payload) {
  if (payload.event === "QUEUE_UPDATED" || payload.centre_id === state.selectedCentre) {
    fetchCentreData(state.selectedCentre);
  }

  if (payload.event === "FARMER_CALLED") {
    if (state.activeToken && state.activeToken.token_id === payload.token_id) {
      state.activeToken.status = "CALLED";
      state.activeToken.counter_id = payload.counter_id;
      localStorage.setItem("kq_active_token", JSON.stringify(state.activeToken));
      triggerArrivalAlert(payload.counter_id);
    }
    fetchCentreData(state.selectedCentre);
  }

  if (payload.event === "PROCUREMENT_COMPLETED") {
    if (state.activeToken && state.activeToken.token_id === payload.token_id) {
      state.activeToken.status = "COMPLETED";
      localStorage.setItem("kq_active_token", JSON.stringify(state.activeToken));
    }
    fetchCentreData(state.selectedCentre);
  }
}

// ============================================================
// 4. QUEUE TELEMETRY & ETA COMPUTATION
// ============================================================
async function fetchCentreData(centreId) {
  try {
    const res = await fetch(`${getHttpBase()}/api/queue/${encodeURIComponent(centreId)}`);
    if (!res.ok) throw new Error("Failed to pull queue");
    state.queueData = await res.json();
    renderOperatorDashboard();
    renderFarmerTracking();
  } catch (err) {
    console.error("Queue sync error:", err);
  }
}

function computeDynamicETA(targetTokenId) {
  const tokens = state.queueData.tokens || [];
  const waitingTokens = tokens.filter(t => t.status === "ARRIVED" || t.status === "BOOKED");
  const counters = Math.max(1, state.queueData.active_counters || 1);

  let accumulatedMinutes = 0;
  let farmersAhead = 0;

  for (const item of waitingTokens) {
    if (item.token_id === targetTokenId) break;
    accumulatedMinutes += BASE_PROCESSING_MINS + (item.quantity_quintals * MINS_PER_QUINTAL);
    farmersAhead++;
  }

  const estimatedMinutes = Math.ceil(accumulatedMinutes / counters);
  return { farmersAhead, estimatedMinutes };
}

function renderOperatorDashboard() {
  const d = state.queueData;
  updateText("metric-total", d.total);
  updateText("metric-waiting", d.waiting);
  updateText("metric-processing", d.processing);
  updateText("metric-completed", d.completed);

  const workloadPct = Math.min(100, Math.round((d.waiting / 50) * 100));
  const bar = document.getElementById("workload-bar");
  if (bar) bar.style.width = `${workloadPct}%`;
  updateText("workload-percent", `${workloadPct}%`);

  const processingList = d.tokens.filter(t => t.status === "CALLED" || t.status === "INSPECTION");
  const waitingList = d.tokens.filter(t => t.status === "ARRIVED" || t.status === "BOOKED");

  renderCounterCards(processingList);
  renderQueueTable(waitingList);
}

function renderCounterCards(activeTokens) {
  const container = document.getElementById("active-counters-container");
  if (!container) return;

  container.innerHTML = [1, 2, 3].map(counterNum => {
    const assigned = activeTokens.find(t => t.counter_id === counterNum);
    return `
      <div class="counter-card ${assigned ? "busy" : "idle"}">
        <h4>Counter ${counterNum}</h4>
        ${assigned ? `
          <div class="token-badge">${assigned.token_id}</div>
          <p>${assigned.farmer_name} (${assigned.quantity_quintals} Qtl ${assigned.crop})</p>
          <button onclick="promptProcurementCompletion('${assigned.token_id}', ${assigned.quantity_quintals})">
            Complete & Pay
          </button>
        ` : `
          <p class="idle-text">Ready for Farmer</p>
          <button onclick="handleCallNext(${counterNum})">Call Next</button>
        `}
      </div>
    `;
  }).join("");
}

function renderQueueTable(waitingList) {
  const tbody = document.getElementById("operator-queue-tbody");
  if (!tbody) return;

  if (waitingList.length === 0) {
    tbody.innerHTML = `<tr><td colspan="5" style="text-align:center; color:#64748b;">No farmers currently waiting in line.</td></tr>`;
    return;
  }

  tbody.innerHTML = waitingList.map((t, idx) => `
    <tr>
      <td>#${idx + 1}</td>
      <td><strong>${t.token_id}</strong></td>
      <td>${t.farmer_name}</td>
      <td>${t.crop} (${t.quantity_quintals} Qtl)</td>
      <td><span class="status-tag ${t.status.toLowerCase()}">${t.status}</span></td>
    </tr>
  `).join("");
}

function renderFarmerTracking() {
  const card = document.getElementById("farmer-ticket-display");
  if (!card) return;

  if (!state.activeToken) {
    card.innerHTML = `<p style="text-align:center; color:#64748b; padding:2rem 0;">No active booking. Fill the form to get a token.</p>`;
    return;
  }

  const currentToken = state.queueData.tokens.find(t => t.token_id === state.activeToken.token_id) || state.activeToken;
  const { farmersAhead, estimatedMinutes } = computeDynamicETA(currentToken.token_id);

  let statusHtml = "";
  if (currentToken.status === "CALLED") {
    statusHtml = `<div class="alert-box pulse">📢 Please proceed immediately to <strong>Counter ${currentToken.counter_id}</strong>!</div>`;
  } else if (currentToken.status === "COMPLETED") {
    statusHtml = `
      <div class="alert-box success">
        ✅ Procurement Completed: ₹${currentToken.total_val ? currentToken.total_val.toLocaleString("en-IN") : "Settled"}<br>
        <small>Ref: ${currentToken.tx_ref || "DBT-PFMS-SUCCESS"}</small>
      </div>`;
  } else {
    statusHtml = `
      <div class="eta-metrics">
        <div><span>Ahead of you</span><strong>${farmersAhead}</strong></div>
        <div><span>Estimated Wait</span><strong>~${estimatedMinutes} mins</strong></div>
      </div>
    `;
  }

  card.innerHTML = `
    <div class="digital-token-ticket">
      <div class="ticket-header">
        <span>DIGITAL APMC PASS</span>
        <span class="centre-badge">${currentToken.centre_id}</span>
      </div>
      <h2>${currentToken.token_id}</h2>
      <p class="farmer-meta">${currentToken.farmer_name} • ${currentToken.crop} (${currentToken.quantity_quintals} Qtl)</p>
      ${statusHtml}
    </div>
  `;
}

function triggerArrivalAlert(counterId) {
  if ("Notification" in window && Notification.permission === "granted") {
    new Notification("KisanQueue: Turn Approaching!", {
      body: `Token ${state.activeToken.token_id}: Please proceed to Counter ${counterId}.`
    });
  }
}

// ============================================================
// 5. BOOKING DISPATCH & IDENTITY VERIFICATION
// ============================================================
async function handleBookingSubmit(event) {
  event.preventDefault();
  const form = event.target;

  const payload = {
    farmer_name: form.farmer_name.value,
    mobile: form.mobile.value,
    village: form.village.value,
    centre_id: form.centre_id.value,
    crop: form.crop.value,
    quantity_quintals: parseFloat(form.quantity.value),
    slot_time: form.slot_time.value,
    auth_type: verifiedFarmerData ? verifiedFarmerData.auth_type : "MOBILE_OTP",
    verified_id: verifiedFarmerData ? verifiedFarmerData.verified_id : "UNVERIFIED"
  };

  try {
    const res = await fetch(`${getHttpBase()}/api/book`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (data.success) {
      state.activeToken = data.token;
      state.selectedCentre = payload.centre_id;
      localStorage.setItem("kq_active_token", JSON.stringify(data.token));
      alert(`Token Issued: ${data.token.token_id}`);
      fetchCentreData(state.selectedCentre);
    }
  } catch (err) {
    alert("Backend unreachable. Please verify python server status.");
  }
}

window.handleCallNext = async function(counterId) {
  try {
    const res = await fetch(`${getHttpBase()}/api/operator/call-next?centre_id=${encodeURIComponent(state.selectedCentre)}&counter_id=${counterId}`, {
      method: "POST"
    });
    if (!res.ok) {
      const err = await res.json();
      alert(err.detail || "No waiting farmers.");
    }
  } catch (err) {
    console.error("Call next failed:", err);
  }
};

window.promptProcurementCompletion = async function(tokenId, expectedWeight) {
  const entered = prompt(`Enter weighbridge scale reading (Quintals):`, expectedWeight);
  if (!entered) return;

  try {
    const res = await fetch(`${getHttpBase()}/api/operator/complete-procurement?token_id=${tokenId}&verified_weight=${parseFloat(entered)}`, {
      method: "POST"
    });
    const result = await res.json();
    if (result.success) {
      alert(`Procurement Settled: ₹${result.token.total_val.toLocaleString("en-IN")}`);
    }
  } catch (err) {
    console.error("Completion failed:", err);
  }
};

function updateText(elementId, value) {
  const el = document.getElementById(elementId);
  if (el) el.textContent = value;
}

function initAuthModule() {
  document.querySelectorAll(".auth-tab-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".auth-tab-btn").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");

      currentAuthType = btn.getAttribute("data-type");
      const directGroup = document.getElementById("directIdInputGroup");
      const otpGroup = document.getElementById("otpInputGroup");
      const idInput = document.getElementById("farmerIdValue");

      if (currentAuthType === "KRISHAK_BANDHU") {
        directGroup.style.display = "flex";
        otpGroup.style.display = "none";
        idInput.placeholder = "Enter Krishak Bandhu ID (e.g. KB-982145)";
        idInput.value = "KB-982145";
      } else if (currentAuthType === "KCC") {
        directGroup.style.display = "flex";
        otpGroup.style.display = "none";
        idInput.placeholder = "Enter KCC Number (e.g. KCC-4521-8890)";
        idInput.value = "KCC-4521-8890";
      } else if (currentAuthType === "MOBILE_OTP") {
        directGroup.style.display = "none";
        otpGroup.style.display = "flex";
      }
    });
  });

  const verifyBtn = document.getElementById("verifyIdBtn");
  if (verifyBtn) {
    verifyBtn.addEventListener("click", async () => {
      const idVal = document.getElementById("farmerIdValue").value.trim();
      if (!idVal) return alert("Please enter an ID number");

      verifyBtn.disabled = true;
      verifyBtn.innerText = "Checking...";

      try {
        const res = await fetch(`${getHttpBase()}/api/auth/verify-identity`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ auth_type: currentAuthType, id_value: idVal })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.detail || "Verification failed");

        applyAuthSuccess(data);
      } catch (err) {
        applyAuthFailure(err.message);
      } finally {
        verifyBtn.disabled = false;
        verifyBtn.innerText = "Verify ID";
      }
    });
  }

  const sendOtp = document.getElementById("sendOtpBtn");
  if (sendOtp) {
    sendOtp.addEventListener("click", async () => {
      const mobile = document.getElementById("otpMobileNumber").value.trim();
      if (!mobile || mobile.length < 10) return alert("Enter a valid 10-digit mobile number");

      sendOtp.disabled = true;
      sendOtp.innerText = "Sending...";

      try {
        const res = await fetch(`${getHttpBase()}/api/auth/send-otp`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ mobile })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.detail || "Failed to send OTP");

        document.getElementById("otpCodeRow").style.display = "flex";
        document.getElementById("otpCodeInput").value = data.demo_otp || "1234";
        alert(`Demo Notice: ${data.message}. Verification OTP is: ${data.demo_otp}`);
      } catch (err) {
        alert(err.message);
      } finally {
        sendOtp.disabled = false;
        sendOtp.innerText = "Send OTP";
      }
    });
  }

  const confirmOtp = document.getElementById("submitOtpBtn");
  if (confirmOtp) {
    confirmOtp.addEventListener("click", async () => {
      const mobile = document.getElementById("otpMobileNumber").value.trim();
      const otp = document.getElementById("otpCodeInput").value.trim();

      try {
        const res = await fetch(`${getHttpBase()}/api/auth/verify-identity`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ auth_type: "MOBILE_OTP", id_value: mobile, otp_code: otp })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.detail || "Incorrect OTP");

        applyAuthSuccess(data);
      } catch (err) {
        applyAuthFailure(err.message);
      }
    });
  }
}

function applyAuthSuccess(data) {
  verifiedFarmerData = data;
  const banner = document.getElementById("authStatusBanner");
  banner.style.display = "flex";
  banner.style.background = "#dcfce7";
  banner.style.color = "#15803d";
  banner.style.border = "1px solid #86efac";
  banner.innerHTML = `<span>✅ Verified: <strong>${data.farmer_name}</strong> (${data.verified_id})</span>`;

  const nameEl = document.querySelector('input[name="farmer_name"], #farmer_name');
  const villageEl = document.querySelector('input[name="village"], #village');
  const mobileEl = document.querySelector('input[name="mobile"], #mobile');

  if (nameEl && data.farmer_name) nameEl.value = data.farmer_name;
  if (villageEl && data.village) villageEl.value = data.village;
  if (mobileEl && data.mobile) mobileEl.value = data.mobile;
}

function applyAuthFailure(msg) {
  const banner = document.getElementById("authStatusBanner");
  banner.style.display = "flex";
  banner.style.background = "#fee2e2";
  banner.style.color = "#b91c1c";
  banner.style.border = "1px solid #fca5a5";
  banner.innerHTML = `⚠️ ${msg}`;
}

// ============================================================
// 6. INITIALIZATION LIFECYCLE
// ============================================================
document.addEventListener("DOMContentLoaded", () => {
  initGatewayNavigation();
  initApplicantLogin();
  initAuthModule();
  initWebSocket();

  const bookingForm = document.getElementById("booking-form");
  if (bookingForm) bookingForm.addEventListener("submit", handleBookingSubmit);

  const centreSelectors = document.querySelectorAll(".centre-dropdown");
  centreSelectors.forEach(select => {
    select.addEventListener("change", (e) => {
      state.selectedCentre = e.target.value;
      centreSelectors.forEach(s => s.value = state.selectedCentre);
      fetchCentreData(state.selectedCentre);
    });
  });

  if ("Notification" in window && Notification.permission !== "denied") {
    Notification.requestPermission();
  }
});