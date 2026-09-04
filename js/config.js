/*window.CONFIG = {
  HTTP_BASE: window.location.hostname.includes("github.io")
    ? "https://your-backend-service.onrender.com"
    : "http://127.0.0.1:8000",
  WS_BASE: window.location.hostname.includes("github.io")
    ? "wss://your-backend-service.onrender.com/ws"
    : "ws://127.0.0.1:8000/ws",
  RECONNECT_INTERVAL_MS: 3000,
  BASE_PROCESSING_MINS: 3.0,
  MINS_PER_QUINTAL: 0.10,
};*/
const host = window.location.hostname || "127.0.0.1";
const isProd = host.includes("github.io");

window.CONFIG = {
  HTTP_BASE: isProd
    ? "https://your-backend-service.onrender.com"
    : `http://${host}:8000`,
  WS_BASE: isProd
    ? "wss://your-backend-service.onrender.com/ws"
    : `ws://${host}:8000/ws`,
  RECONNECT_INTERVAL_MS: 3000,
  BASE_PROCESSING_MINS: 3.0,
  MINS_PER_QUINTAL: 0.10,
};