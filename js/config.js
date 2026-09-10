const isLocal = window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";

const API_BASE_URL = isLocal 
  ? "http://127.0.0.1:8000" 
  : "https://kishanqueue-api.onrender.com";

const WS_BASE_URL = isLocal 
  ? "ws://127.0.0.1:8000/ws" 
  : "wss://kishanqueue-api.onrender.com/ws";