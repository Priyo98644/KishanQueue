from datetime import datetime
from enum import Enum
import re
from typing import Dict, List, Optional
from fastapi import FastAPI, HTTPException, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

app = FastAPI(title="KisanQueue Engine")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

MSP_RATES = {"Paddy": 2300, "Wheat": 2275, "Mustard": 5650}
BASE_CHECKIN_MINUTES = 3.0
MINUTES_PER_QUINTAL = 0.10


class TokenStatus(str, Enum):
    BOOKED = "BOOKED"
    ARRIVED = "ARRIVED"
    CALLED = "CALLED"
    INSPECTION = "INSPECTION"
    PAYMENT_PENDING = "PAYMENT_PENDING"
    COMPLETED = "COMPLETED"


class BookingRequest(BaseModel):
    farmer_name: str
    mobile: str
    village: str
    centre_id: str
    crop: str
    quantity_quintals: float
    slot_time: str


class VoiceQuery(BaseModel):
    speech_text: str
    lang: str


class TokenRecord(BaseModel):
    token_id: str
    farmer_name: str
    mobile: str
    village: str
    centre_id: str
    crop: str
    quantity_quintals: float
    slot_time: str
    status: TokenStatus
    counter_id: Optional[int] = None
    actual_weight: Optional[float] = None
    total_val: Optional[float] = None
    tx_ref: Optional[str] = None
    created_at: str


tokens_db: Dict[str, TokenRecord] = {}
token_counter = 100
active_counters = {"Centre A": 3, "Centre B": 2, "Centre C": 4}


class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)

    async def broadcast(self, message: dict):
        for conn in list(self.active_connections):
            try:
                await conn.send_json(message)
            except Exception:
                self.disconnect(conn)


manager = ConnectionManager()


def compute_eta(centre_id: str, target_token_id: str) -> int:
    queue = [
        t for t in tokens_db.values()
        if t.centre_id == centre_id and t.status in [TokenStatus.ARRIVED, TokenStatus.BOOKED]
    ]
    counters = max(1, active_counters.get(centre_id, 1))
    accumulated_minutes = 0.0

    for item in queue:
        if item.token_id == target_token_id:
            break
        accumulated_minutes += BASE_CHECKIN_MINUTES + (item.quantity_quintals * MINUTES_PER_QUINTAL)

    return int(accumulated_minutes / counters)


@app.get("/")
def health_check():
    return {"status": "online", "system": "KisanQueue Engine"}


@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket)


@app.post("/api/voice-assistant")
async def handle_voice_assistant(query: VoiceQuery):
    text = query.speech_text.lower()

    # 1. Pattern matching for quantity in quintals / kg
    numbers = re.findall(r'\d+', text)
    quantity = float(numbers[0]) if numbers else 40.0

    # 2. Identify crop
    crop = "Wheat"
    if any(word in text for word in ["ধান", "चावल", "paddy", "rice"]):
        crop = "Paddy"
    elif any(word in text for word in ["সর্ষে", "सरसों", "mustard"]):
        crop = "Mustard"
    elif any(word in text for word in ["আলু", "आलू", "potato"]):
        crop = "Potato"

    # 3. Formulate spoken reply based on dialect
    if "bn" in query.lang:
        reply = f"আমি {crop} ফসলের জন্য {quantity} কুইন্টালের টোকেন বুক করে দিচ্ছি।"
    else:
        reply = f"मैं {crop} फसल के लिए {quantity} क्विंटल की पर्ची बना रहा हूँ।"

    return {
        "action": "BOOK_PASS",
        "crop": crop,
        "quantity": quantity,
        "farmer_name": "কৃষক বন্ধু",
        "speech_reply": reply
    }


@app.post("/api/book")
async def book_slot(req: BookingRequest):
    global token_counter
    token_counter += 1
    t_id = f"KQ-{token_counter}"
    record = TokenRecord(
        token_id=t_id,
        farmer_name=req.farmer_name,
        mobile=req.mobile,
        village=req.village,
        centre_id=req.centre_id,
        crop=req.crop,
        quantity_quintals=req.quantity_quintals,
        slot_time=req.slot_time,
        status=TokenStatus.ARRIVED,
        created_at=datetime.now().strftime("%I:%M %p")
    )
    tokens_db[t_id] = record
    await manager.broadcast({"event": "QUEUE_UPDATED", "centre_id": req.centre_id})
    return {"success": True, "token": record, "estimated_wait_minutes": compute_eta(req.centre_id, t_id)}


@app.get("/api/queue/{centre_id}")
def get_centre_queue(centre_id: str):
    centre_tokens = [t for t in tokens_db.values() if t.centre_id == centre_id]
    return {
        "total": len(centre_tokens),
        "waiting": len([t for t in centre_tokens if t.status in [TokenStatus.BOOKED, TokenStatus.ARRIVED]]),
        "processing": len([t for t in centre_tokens if t.status in [TokenStatus.CALLED, TokenStatus.INSPECTION]]),
        "completed": len([t for t in centre_tokens if t.status == TokenStatus.COMPLETED]),
        "active_counters": active_counters.get(centre_id, 2),
        "tokens": centre_tokens
    }


@app.post("/api/operator/call-next")
async def call_next_farmer(centre_id: str, counter_id: int):
    candidates = [
        t for t in tokens_db.values()
        if t.centre_id == centre_id and t.status == TokenStatus.ARRIVED
    ]
    if not candidates:
        raise HTTPException(status_code=404, detail="No waiting farmers found")

    next_token = candidates[0]
    next_token.status = TokenStatus.CALLED
    next_token.counter_id = counter_id
    await manager.broadcast({"event": "FARMER_CALLED", "token_id": next_token.token_id, "counter_id": counter_id})
    return next_token


@app.post("/api/operator/complete-procurement")
async def complete_procurement(token_id: str, verified_weight: float):
    token = tokens_db.get(token_id)
    if not token:
        raise HTTPException(status_code=404, detail="Token not found")

    rate = MSP_RATES.get(token.crop, 2275)
    total_amount = verified_weight * rate
    token.actual_weight = verified_weight
    token.total_val = total_amount
    token.status = TokenStatus.COMPLETED
    token.tx_ref = f"DBT-PFMS-{datetime.now().strftime('%Y%m%d%H%M%S')}"

    await manager.broadcast({"event": "PROCUREMENT_COMPLETED", "token_id": token_id})
    return {"success": True, "token": token}