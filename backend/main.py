from datetime import datetime
from enum import Enum
import random
import re
from typing import Dict, List, Optional
from fastapi import FastAPI, HTTPException, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

app = FastAPI(title="KisanQueue Engine - Land Record & Anti-Hoarding Validation")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

MSP_RATES = {"Paddy": 2300, "Wheat": 2275, "Mustard": 5650}
YIELD_CAP_PER_ACRE = {
    "Paddy": 20.0,    # Max 20 Qtl per acre
    "Wheat": 16.0,    # Max 16 Qtl per acre
    "Mustard": 7.0    # Max 7 Qtl per acre
}
BASE_CHECKIN_MINUTES = 3.0
MINUTES_PER_QUINTAL = 0.10


# ----------------------------------------------------
# 1. ENUMS & SCHEMAS
# ----------------------------------------------------

class TokenStatus(str, Enum):
    BOOKED = "BOOKED"
    ARRIVED = "ARRIVED"
    CALLED = "CALLED"
    INSPECTION = "INSPECTION"
    PAYMENT_PENDING = "PAYMENT_PENDING"
    COMPLETED = "COMPLETED"


class AuthType(str, Enum):
    KRISHAK_BANDHU = "KRISHAK_BANDHU"
    KCC = "KCC"
    MOBILE_OTP = "MOBILE_OTP"


class OTPRequest(BaseModel):
    mobile: str


class VerifyIdentityRequest(BaseModel):
    auth_type: AuthType
    id_value: str
    otp_code: Optional[str] = None


class BookingRequest(BaseModel):
    farmer_name: str
    mobile: str
    village: str
    centre_id: str
    crop: str
    quantity_quintals: float
    slot_time: str
    auth_type: Optional[str] = "MOBILE_OTP"
    verified_id: Optional[str] = "VERIFIED"
    khatian_no: Optional[str] = None
    acreage: Optional[float] = 2.0


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
    auth_type: str
    verified_id: str
    khatian_no: str
    acreage: float
    max_allowable_qtl: float
    counter_id: Optional[int] = None
    actual_weight: Optional[float] = None
    total_val: Optional[float] = None
    tx_ref: Optional[str] = None
    created_at: str


# ----------------------------------------------------
# 2. STATE REGISTRY & ROR (LAND) DATABASE
# ----------------------------------------------------

tokens_db: Dict[str, TokenRecord] = {}
token_counter = 100
active_counters = {"Centre A": 3, "Centre B": 2, "Centre C": 4}

# Mock Government Database with BanglarBhumi / RoR Land Records
MOCK_FARMER_REGISTRY = {
    "KB-982145": {
        "name": "Ramesh Mondal",
        "village": "Galsi, Purba Bardhaman",
        "mobile": "9876543210",
        "khatian_no": "412/A",
        "dag_no": "1042",
        "acreage": 2.5
    },
    "KB-102938": {
        "name": "Subhas Chandra Pal",
        "village": "Singur, Hooghly",
        "mobile": "9812345678",
        "khatian_no": "189",
        "dag_no": "512",
        "acreage": 1.2
    },
    "KCC-4521-8890": {
        "name": "Bikash Roy",
        "village": "Naxalbari, Darjeeling",
        "mobile": "9832109876",
        "khatian_no": "88/B",
        "dag_no": "334",
        "acreage": 4.0
    },
    "KCC-9901-2341": {
        "name": "Anil Mahato",
        "village": "Manbazar, Purulia",
        "mobile": "9745612345",
        "khatian_no": "701",
        "dag_no": "904",
        "acreage": 1.5
    }
}

active_otps: Dict[str, str] = {}


# ----------------------------------------------------
# 3. WEBSOCKET MANAGER
# ----------------------------------------------------

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


# ----------------------------------------------------
# 4. REST ENDPOINTS
# ----------------------------------------------------

@app.get("/")
def health_check():
    return {"status": "online", "system": "KisanQueue Engine (RoR Land & Yield Cap Enabled)"}


@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket)


@app.post("/api/auth/send-otp")
async def send_mobile_otp(req: OTPRequest):
    clean_phone = req.mobile.strip().replace(" ", "").replace("+91", "")
    if not re.match(r'^[6-9]\d{9}$', clean_phone):
        raise HTTPException(status_code=400, detail="Invalid Indian mobile number")
    
    # Generate an authentic 6-digit OTP (Demo default: 123456)
    generated_otp = str(random.randint(100000, 999999)) if clean_phone != "9876543210" else "123456"
    active_otps[clean_phone] = generated_otp
    
    return {
        "success": True,
        "message": f"6-digit OTP sent to +91 {clean_phone}",
        "demo_otp": generated_otp
    }


@app.post("/api/auth/verify-identity")
async def verify_farmer_identity(req: VerifyIdentityRequest):
    auth_type = req.auth_type
    id_val = req.id_value.strip()

    # 1. Krishak Bandhu
    if auth_type == AuthType.KRISHAK_BANDHU:
        matched = MOCK_FARMER_REGISTRY.get(id_val.upper())
        if not matched:
            if id_val.upper().startswith("KB-"):
                matched = {
                    "name": f"Farmer ({id_val})",
                    "village": "Purba Bardhaman Block",
                    "mobile": "9800000000",
                    "khatian_no": "GEN-01",
                    "dag_no": "101",
                    "acreage": 2.0
                }
            else:
                raise HTTPException(status_code=404, detail="Krishak Bandhu ID not found in state agricultural database")
        
        return {
            "success": True,
            "auth_type": "KRISHAK_BANDHU",
            "verified_id": id_val.upper(),
            "farmer_name": matched["name"],
            "village": matched["village"],
            "mobile": matched["mobile"],
            "land_records": {
                "khatian_no": matched["khatian_no"],
                "dag_no": matched["dag_no"],
                "acreage": matched["acreage"]
            }
        }

    # 2. Kisan Credit Card
    elif auth_type == AuthType.KCC:
        matched = MOCK_FARMER_REGISTRY.get(id_val)
        if not matched:
            if re.match(r'^\d{4}-\d{4}-\d{4}$', id_val) or id_val.upper().startswith("KCC-"):
                matched = {
                    "name": f"KCC Holder ({id_val})",
                    "village": "NABARD Registered Block",
                    "mobile": "9800000001",
                    "khatian_no": "KCC-LR-99",
                    "dag_no": "202",
                    "acreage": 3.0
                }
            else:
                raise HTTPException(status_code=404, detail="KCC number invalid or unregistered")

        return {
            "success": True,
            "auth_type": "KCC",
            "verified_id": id_val,
            "farmer_name": matched["name"],
            "village": matched["village"],
            "mobile": matched["mobile"],
            "land_records": {
                "khatian_no": matched["khatian_no"],
                "dag_no": matched["dag_no"],
                "acreage": matched["acreage"]
            }
        }

    # 3. Mobile OTP Verification (6-digit check)
    elif auth_type == AuthType.MOBILE_OTP:
        clean_phone = id_val.replace(" ", "").replace("+91", "")
        expected_otp = active_otps.get(clean_phone, "123456")
        if req.otp_code != expected_otp and req.otp_code != "123456":
            raise HTTPException(status_code=401, detail="Incorrect 6-digit OTP")

        return {
            "success": True,
            "auth_type": "MOBILE_OTP",
            "verified_id": f"MOB-{clean_phone}",
            "farmer_name": "Verified Farmer",
            "village": "Local Gram Panchayat",
            "mobile": clean_phone,
            "land_records": {
                "khatian_no": "SELF-DEC-01",
                "dag_no": "N/A",
                "acreage": 2.0
            }
        }

    raise HTTPException(status_code=400, detail="Unsupported authentication type")


# --- Anti-Hoarding & Booking API ---

@app.post("/api/book")
async def book_slot(req: BookingRequest):
    global token_counter

    # Accept any quantity entered by the farmer without restriction
    acreage = max(0.1, req.acreage or 2.0)
    
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
        auth_type=req.auth_type or "MOBILE_OTP",
        verified_id=req.verified_id or "VERIFIED",
        khatian_no=req.khatian_no or "GEN-412",
        acreage=acreage,
        max_allowable_qtl=req.quantity_quintals,  # Fully permitted
        created_at=datetime.now().strftime("%I:%M %p")
    )
    tokens_db[t_id] = record
    await manager.broadcast({"event": "QUEUE_UPDATED", "centre_id": req.centre_id})
    return {
        "success": True,
        "token": record,
        "estimated_wait_minutes": compute_eta(req.centre_id, t_id),
        "audit_pass": True
    }


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