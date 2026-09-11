// Detect if running locally (handles localhost, 127.0.0.1, Live Server, and file:// protocol)
const isLocal = 
  window.location.hostname === "localhost" || 
  window.location.hostname === "127.0.0.1" || 
  window.location.protocol === "file:" ||
  window.location.port === "5500" ||
  window.location.port === "3000";

const HTTP_BASE = isLocal 
  ? "http://127.0.0.1:8000" 
  : "https://kishanqueue-api.onrender.com";

const WS_BASE = isLocal 
  ? "ws://127.0.0.1:8000/ws" 
  : "wss://kishanqueue-api.onrender.com/ws";

// Attach explicitly to window so both app.js and voice-assistant.js can access it
window.CONFIG = {
  HTTP_BASE: HTTP_BASE,
  WS_BASE: WS_BASE,
  RECONNECT_INTERVAL_MS: 3000,
  BASE_PROCESSING_MINS: 3.0,
  MINS_PER_QUINTAL: 0.10
};

// Backwards-compatible global variables
window.API_BASE_URL = HTTP_BASE;
window.WS_BASE_URL = WS_BASE;