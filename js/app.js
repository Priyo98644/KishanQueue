const state = {
  selectedCentre: "Centre A",
  activeToken: JSON.parse(localStorage.getItem("kq_active_token")) || null,
  socket: null,
  queueData: { total: 0, waiting: 0, processing: 0, completed: 0, tokens: [], active_counters: 2 },
};

function initWebSocket() {
  const statusIndicator = document.getElementById("connection-status");
  const offlineBanner = document.getElementById("offline-banner");

  try {
    state.socket = new WebSocket(window.CONFIG.WS_BASE);

    state.socket.onopen = () => {
      if (statusIndicator) statusIndicator.textContent = "🟢 Live Connected";
      if (offlineBanner) offlineBanner.style.display = "none";
      fetchCentreData(state.selectedCentre);
    };

    state.socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      handleSocketEvent(data);
    };

    state.socket.onclose = () => {
      if (statusIndicator) statusIndicator.textContent = "🔴 Reconnecting...";
      if (offlineBanner) offlineBanner.style.display = "block";
      setTimeout(initWebSocket, window.CONFIG.RECONNECT_INTERVAL_MS);
    };

    state.socket.onerror = () => {
      state.socket.close();
    };
  } catch (err) {
    setTimeout(initWebSocket, window.CONFIG.RECONNECT_INTERVAL_MS);
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

async function fetchCentreData(centreId) {
  try {
    const res = await fetch(`${window.CONFIG.HTTP_BASE}/api/queue/${encodeURIComponent(centreId)}`);
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
    accumulatedMinutes += window.CONFIG.BASE_PROCESSING_MINS + (item.quantity_quintals * window.CONFIG.MINS_PER_QUINTAL);
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
    slot_time: form.slot_time.value
  };

  try {
    const res = await fetch(`${window.CONFIG.HTTP_BASE}/api/book`, {
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
    const res = await fetch(`${window.CONFIG.HTTP_BASE}/api/operator/call-next?centre_id=${encodeURIComponent(state.selectedCentre)}&counter_id=${counterId}`, {
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
    const res = await fetch(`${window.CONFIG.HTTP_BASE}/api/operator/complete-procurement?token_id=${tokenId}&verified_weight=${parseFloat(entered)}`, {
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

function setupNavigation() {
  const tabs = document.querySelectorAll(".nav-tab");
  tabs.forEach(tab => {
    tab.addEventListener("click", () => {
      tabs.forEach(t => t.classList.remove("active"));
      document.querySelectorAll(".view-panel").forEach(p => p.classList.remove("active"));
      
      tab.classList.add("active");
      const targetPanel = document.getElementById(tab.dataset.target);
      if (targetPanel) targetPanel.classList.add("active");
    });
  });
}

document.addEventListener("DOMContentLoaded", () => {
  setupNavigation();
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