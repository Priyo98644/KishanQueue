# KisanQueue

KisanQueue — Smart APMC Yard Logistics & Settlement PlatformSmart India Hackathon 2026Problem Statement ID: SIH26032Team Name: CODE_RANGERSCore Focus: Automated Procurement, Weighbridge Telemetry, ICAR Quality Assessment & Direct Financial SettlementExecutive SummaryKisanQueue is an enterprise-grade digital operating infrastructure designed for Agricultural Produce Market Committee (APMC) mandis across India. Built to eliminate multi-kilometer vehicular gridlocks, illicit lot under-weighing, and delayed farmer payouts, KisanQueue unifies gate registration, RS-232 IoT scale telemetry, ICAR Fair Average Quality (FAQ) grading, Direct Benefit Transfer (DBT) clearance, and state e-NAM synchronization into an offline-first, multilingual platform.System Architecture[ Rural Farmer Entry ] ──► [ Multilingual Voice Copilot (DSP Filtered) ] ──► [ Token Pass Generated ]
                                                                                      │
                                                                                      ▼
[ Big-Screen LED Yard Display ] ◄── [ Hybrid SJF Queue Engine ] ◄── [ Gate Dispatch Console ]
               │                                                              │
               ▼                                                              ▼
[ IoT Serial Indicator (Avery/Essae) ] ──► [ Two-Stage Net Tare Math ] ──► [ Scale Bay Clearance ]
                                                                                      │
                                                                                      ▼
[ FCI Mill Dispatch Challan ] ◄── [ ICAR FAQ Quality Assayer ] ◄───────── [ Quality Inspection ]
                                           │
                                           ▼
[ Bank Penny-Drop Match ] ──► [ PFMS / DBT Multi-Party e-Parcha (Form J) ] ──► [ SHA-256 Audit Chain ]
Complete 52-Feature Implementation SpectrumPhase 1: Dual-Portal Core, RBAC & Yard LogisticsDual-Faced Gateway: Dedicated workflows separating citizen farmer passes from restricted departmental consoles.Multi-Identity Registration: Unified onboarding supporting Mobile OTP, Krishak Bandhu IDs, and landholding registries.Perishable Green-Channel Routing: Priority lane routing (EXP-XXX) bypassing long grain queues for time-sensitive lots.Transit Breakdown Grace Window: Voice- and button-activated 45-minute standby window for road delays.Dynamic Bay Load-Balancing: Instant bay-to-bay queue diversion upon mechanical weighbridge breakdown.High-Contrast Public LED Screen (/display): Dedicated ultra-high contrast yard signboard display for outdoor LED displays.Granular Role-Based Access Control (RBAC): Distinct interfaces for Gate Guards, Weighbridge Operators, Assayers, and Mandi Secretaries.Hamali Labor Management: Allocation tracking and gang rostering for registered mandi unloading labor.Phase 2: Hardware IoT Telemetry & Quality AssayingRS-232 IoT Serial Telemetry Bridge: Live continuous stream parsing from Avery Weigh-Tronix and Essae-Teraoka indicators.Two-Stage Tare & Gross Math: Automated computation of certified net weight:$$\text{Net Weight} = \text{Gross Weight} - \text{Vehicle Tare} - (\text{Bag Count} \times \text{Packaging Standard Tare})$$Gunny Bag Standardization: Deductions calibrated for Jute 50kg bags (580g) and HDPE woven sacks (120g).ICAR FAQ Evaluator: Standardized deduction formulas for moisture ($>14\%$), foreign matter ($>1\%$), and damaged grains ($>2\%$), enforcing hard lot rejection above $17\%$ moisture.Mill & FCI Warehouse Dispatch: Automated generation of outward delivery challans directing accepted grain lots to Food Corporation of India railhead silos.Phase 3: Multilingual Voice AI CopilotVoice Booking Engine: Hands-free voice interface parsing commodity names, traditional unit measurements, and quantities.120Hz Ambient Noise Filter: DSP-based Web Audio filter suppressing diesel tractor rumbles and ambient yard shouting.Multi-Dialect Normalization: Recognition of regional expressions (e.g., gehun, dhan, mon, bori) into standardized metric quintals.Neural Regional TTS: Spoken responses generated in regional Indian languages via Edge-TTS and native speech synthesis.Spoken Status & Price Quotes: Spoken status readouts of queue position, current MSP rates, and moisture allowances.Voice Grievance Dictation: Spoken dispute transcription recorded into the tamper-evident arbitration log.Phase 4: Financial Clearance & Cryptographic AuditingMSP Valuation Multiplier: Automated computation multiplying certified net quintals by active Minimum Support Price rates.Hamali Subsidy Reconciliation: Transparent crediting of government unloading subsidies back to farmer payouts.Statutory APMC Cess Ledger: Accounting for market development fees and weighing cesses.Penny-Drop Bank Verification: Name-matching and active beneficiary verification via banking gateways.Direct Benefit Transfer (DBT) Payloads: Direct payment compilation for PFMS and the Aadhaar-seeded NPCI APBS switch.Joint Landholding Split Payment: Share-percentage distribution across multiple co-owner accounts.Signed e-Parcha Voucher (Form J): Generation of electronic settlement pay slips complete with three digital verification blocks.SHA-256 Chained Audit Trail: Tamper-evident hash-chained logging of all manual weight overrides, lot cancellations, and official actions.Phase 5: Resilient Enterprise Cloud & Edge ArchitectureShortest-Job-First (SJF) Optimization: Dynamic queue re-indexing balancing arrival wait times with vehicle payload sizes.Resilient WebSocket Hub: Reconnecting telemetry layer with exponential backoff and 15-second heartbeat pings.PWA Offline Service Worker: Client-side caching enabling access in regional cellular dead zones.Anti-Bot Rate Limiting: Token-bucket rate limiter defending public booking APIs against automated script attacks.Edge-Node Deployment Ready: Docker compose configuration designed for on-premise Raspberry Pi micro-servers.Standardized e-NAM API: Tokenized REST and GraphQL endpoints for synchronization with national agriculture portals.

## Directory Structure

```text
KishanQueue/
│
├── backend/
│   ├── __init__.py                 # Python package identifier
│   ├── main.py                     # FastAPI REST API, WebSockets, Serial Parser & AI
│   ├── queue_engine.py             # SJF Optimization Engine, Rate Limiter & Memory Cache
│   ├── requirements.txt            # Production backend dependencies
│   └── run.py                      # Production server bootstrapper
│
├── css/
│   ├── main.css                    # Core structural layout & typography
│   ├── style.css                   # High-contrast UI theme & big-screen yard styles
│   └── ticket.css                  # Print-ready Form J e-Parcha styling & digital seals
│
├── js/
│   ├── app.js                      # UI business logic, ICAR deductions & settlement math
│   ├── config.js                   # Mandi environment constants & API configurations
│   ├── socket-hub.js               # Resilient WebSocket hub with auto-reconnect
│   └── voice-assistant.js          # Web Audio DSP engine, speech intent & Edge-TTS bridge
│
├── assets/                         # Vector icons, branding emblems & imagery
│   └── favicon.ico
│
├── docker-compose.edge.yml         # Raspberry Pi & local mandi edge deployment
├── index.html                      # Single-page interface across all roles
├── manifest.json                   # Progressive Web App (PWA) configuration
├── README.md                       # Comprehensive system documentation
└── sw.js                           # Offline caching Service Worker
```

## Installation & Setup

### 1. Prerequisites

- Python: 3.10 to 3.14
- Node/Browser: Any modern Chromium-based browser (Chrome, Edge) supporting Web Speech and Web Audio APIs

### 2. Environment Configuration

Clone the repository and create an environment file at the project root:

```bash
git clone https://github.com/Priyo98644/KishanQueue.git
cd KishanQueue
```

Create a `.env` file in the root folder:

```env
GEMINI_API_KEY=your_gemini_api_key_here
DEPLOYMENT_ENV=production
MANDI_CODE=APMC_WB_2401
```

### 3. Backend Dependency Installation

```powershell
# Create and activate virtual environment
python -m venv .venv
.\.venv\Scripts\Activate.ps1

# Install core requirements
python -m pip install --upgrade pip
python -m pip install fastapi "uvicorn[standard]" edge-tts google-generativeai python-dotenv pydantic
```

### 4. Running the Application

Run the backend with your environment path set:

```powershell
$env:PYTHONPATH="backend"; python -m uvicorn backend.main:app --reload --port 8000
```

Once initialized, navigate to:

- Mandi Web Portal: <http://127.0.0.1:8000>
- Swagger API Documentation: <http://127.0.0.1:8000/docs>
- Public Yard LED Board: <http://127.0.0.1:8000> (Switch to Big-Screen Display mode)

## Smart India Hackathon (SIH) Jury Demo Walkthrough

Follow this 5-stage script during evaluation:

| Step | Action | Feature Validated | Expected Output |
| --- | --- | --- | --- |
| 1 | Click ⚡ Run 12-Farmer Jury Simulation in the header. | Multi-State Batch Simulation & Voice Notification | Queue populates with 12 multi-state farmers, yard workload shifts to 78%, and gate audio announces Token KQ-DEL-001. |
| 2 | Open the Floating Agro AI Assistant on the bottom right. | 120Hz DSP Filter & Voice Intent Parsing | Speak "80 quintal gehun" or type in Hindi/Bengali. The system populates the booking form and responds in speech. |
| 3 | Navigate to Weighbridge Bay 01. Click Gross ($142.80\text{ Qtl}$), Tare ($42.50\text{ Qtl}$), and choose 180 Jute Bags. | IoT Telemetry & Two-Stage Net Math | Certified Net Weight calculates to $99.26\text{ Qtl}$ after bag tare deduction. |
| 4 | Open Quality Assayer. Set moisture to $15.2\%$, then slide past $17.0\%$. | ICAR FAQ Statutory Deduction Engine | Payout reflects a $-₹48.20/\text{Qtl}$ refuse deduction at $15.2\%$, and triggers an instant lot rejection banner at $>17\%$. |
| 5 | Open Financial Valuation & e-Parcha Desk, select KQ-DEL-001, and click Generate Multi-Party Signed e-Parcha. | PFMS / DBT Clearance & Form J Voucher | A printable Form J opens showing the gross value, Hamali reimbursement, and three cryptographic signature blocks. |

## Technical Specifications

| Parameter | Specification |
| --- | --- |
| Backend Framework | FastAPI (Asynchronous ASGI) |
| Telemetry Transport | Native WebSockets with continuous Heartbeat Pings & Backoff |
| Audio Processing | Web Audio API (BiquadFilterNode @ 120Hz High-Pass + DynamicsCompressorNode) |
| Speech Generation | Asynchronous Microsoft Edge Neural TTS + SpeechSynthesis API |
| Security & Auditing | SHA-256 Merkle-style Hash Chaining for all manual state overrides |
| Standards Compliance | ICAR Grain Standards, APMC Model Act Rule 24-B (Form J), Agmarknet Integration Formats |

- Team: CODE_RANGERS
- Project: KisanQueue (SIH26032)
- Target APMC Clusters: National Agriculture Market (e-NAM), State Agricultural Marketing Boards
- Repository: [GitHub: Priyo98644/KishanQueue](https://github.com/Priyo98644/KishanQueue)
- License: MIT License — Free and Open-Source for National APMC Mandi Modernization.
