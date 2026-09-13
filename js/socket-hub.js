// ============================================================
// POINT 46: RESILIENT AUTO-RECONNECTING WEBSOCKET CLIENT
// ============================================================
class ResilientSocketHub {
  constructor(endpoint) {
    this.endpoint = endpoint;
    this.reconnectAttempts = 0;
    this.maxDelay = 30000;
    this.socket = null;
    this.heartbeatTimer = null;
    this.initConnection();
  }

  initConnection() {
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const host = window.location.host || "127.0.0.1:8000";
    this.socket = new WebSocket(`${protocol}//${host}${this.endpoint}`);

    this.socket.onopen = () => {
      this.reconnectAttempts = 0;
      this.updateIndicator(true);
      this.startHeartbeat();
    };

    this.socket.onmessage = (event) => {
      if (event.data === "pong") return;
      try {
        const payload = JSON.parse(event.data);
        if (window.onQueueTelemetryUpdate) {
          window.onQueueTelemetryUpdate(payload);
        }
      } catch (err) {}
    };

    this.socket.onclose = () => {
      this.updateIndicator(false);
      this.stopHeartbeat();
      this.scheduleReconnect();
    };

    this.socket.onerror = () => {
      this.socket.close();
    };
  }

  startHeartbeat() {
    this.heartbeatTimer = setInterval(() => {
      if (this.socket && this.socket.readyState === WebSocket.OPEN) {
        this.socket.send("ping");
      }
    }, 15000);
  }

  stopHeartbeat() {
    if (this.heartbeatTimer) clearInterval(this.heartbeatTimer);
  }

  scheduleReconnect() {
    // Exponential backoff: 2^n * 1000ms up to 30 seconds
    const delay = Math.min(this.maxDelay, Math.pow(2, this.reconnectAttempts) * 1000);
    this.reconnectAttempts++;
    setTimeout(() => this.initConnection(), delay);
  }

  updateIndicator(isConnected) {
    const statusEl = document.getElementById("connection-status");
    if (!statusEl) return;
    statusEl.innerText = isConnected ? "● Live Yard Sync" : "○ Offline (Reconnecting...)";
    statusEl.className = isConnected ? "status-pill status-connected" : "status-pill status-connecting";
  }
}

document.addEventListener("DOMContentLoaded", () => {
  window.apmcSocket = new ResilientSocketHub("/ws/telemetry/queue");
});