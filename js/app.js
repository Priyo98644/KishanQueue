// ============================================================
// KISANQUEUE PAN-INDIA CORE ENGINE
// COMPLETE 15-LANGUAGE INDIGENOUS & SCHEDULED TRANSLATION MATRIX
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

const state = {
  selectedCentre: "Centre A",
  activeToken: JSON.parse(localStorage.getItem("kq_active_token")) || null,
  socket: null,
  queueData: { total: 0, waiting: 0, processing: 0, completed: 0, tokens: [], active_counters: 2 },
  authenticatedUser: null,
  currentCaptcha: "",
  currentLang: localStorage.getItem("kq_lang") || "en"
};

let currentAuthType = "KRISHAK_BANDHU";
let verifiedFarmerData = null;

// ============================================================
// 1. ALL-INDIA STATE, DISTRICT & RURAL APMC YARD HIERARCHY
// (28 STATES & 8 UNION TERRITORIES)
// ============================================================
const INDIA_LOCATIONS = {
  // --- 28 STATES ---
  "Andhra Pradesh": {
    "Guntur": ["Guntur Mirchi Yard (Asia's Largest)", "Tenali Agro Hub", "Narasaraopet Yard", "Sattenapalle Mandi"],
    "Krishna": ["Gudivada Grain Terminal", "Machilipatnam Coastal Hub", "Nuzvid Mango/Paddy Yard", "Vijayawada Rural"],
    "East Godavari": ["Rajahmundry Agro Hub", "Kakinada Grain Terminal", "Mandapeta Rice Belt", "Amalapuram Yard"],
    "Kurnool": ["Adoni Cotton Yard", "Nandyal Grain Hub", "Yemmiganur Market", "Dhone Pulses Mandi"]
  },
  "Arunachal Pradesh": {
    "Papum Pare": ["Naharlagun Agri-Market Hub", "Doimukh Farmer Depot", "Sagalee Collection Centre"],
    "East Siang": ["Pasighat Organic Agro Terminal", "Ruksin Border Yard", "Mebo Grain Depot"],
    "West Kameng": ["Bomdila Apple/Kiwi Hub", "Dirang Valley Depot", "Rupa Rural Yard"]
  },
  "Assam": {
    "Kamrup": ["Rangia Rural APMC", "Boko Tribal Produce Hub", "Chaygaon Grain Cluster", "Hajo Yard"],
    "Nagaon": ["Dhing Vegetable/Paddy Hub", "Raha Rural Yard", "Kampur Cluster", "Samaguri Mandi"],
    "Barpeta": ["Howly APMC Yard", "Sarthebari Cluster", "Barpeta Road Grain Terminal", "Kalgachia Hub"],
    "Cachar": ["Silchar Valley Depot", "Sonai Agro Hub", "Dholai Rural Terminal"]
  },
  "Bihar": {
    "Patna": ["Bakhtiyarpur Grain Yard", "Mokama Tal Pulse Hub", "Bihta Agro Terminal", "Fatuha Depot"],
    "Muzaffarpur": ["Musahari Shahi Litchi/Grain Hub", "Kanti Rural Yard", "Motipur Agro Centre", "Sakra Mandi"],
    "Purnia": ["Gulabbagh Maize Yard (Asia's Top Hub)", "Banmankhi Yard", "Kasba Grain Depot", "Dhamdaha Hub"],
    "Rohtas": ["Sasaram Paddy Rice Bowl", "Nokha Grain Market", "Bikramganj Agro Terminal", "Dehri Depot"]
  },
  "Chhattisgarh": {
    "Raipur": ["Dharsiwa Agro Yard", "Abhanpur Grain Terminal", "Tilda Rice Depot", "Arang Mandi"],
    "Rajnandgaon": ["Dongargarh Paddy Hub", "Khairagarh Yard", "Chhuikhadan Market", "Mohla Depot"],
    "Dhamtari": ["Kurud Rice Bowl Yard", "Nagari Tribal Agro Hub", "Magarlod Collection Centre"]
  },
  "Goa": {
    "North Goa": ["Sanquelim Cashew/Paddy Yard", "Mapusa Sub-Mandi", "Pernem Village Depot"],
    "South Goa": ["Margao APMC Yard", "Ponda Spice Terminal", "Curchorem Rural Depot"]
  },
  "Gujarat": {
    "Ahmedabad": ["Bawla Rice & Wheat Hub", "Sanand Grain Mandi", "Viramgam Cotton Yard", "Dholka Depot"],
    "Rajkot": ["Bedi APMC Yard (Major Groundnut Hub)", "Gondal Chilli/Grain Mandi", "Jetpur Agro Terminal"],
    "Surat": ["Bardoli Sugarcane & Paddy Yard", "Mahuva Agro Depot", "Mandvi Rural Centre"],
    "Mehsana": ["Unjha Cumin Yard (World's Largest Spices Hub)", "Kadi Cotton Yard", "Visnagar Mandi"]
  },
  "Haryana": {
    "Karnal": ["Taraori Basmati Hub", "Gharaunda Yard", "Indri Rural Cluster", "Nilokheri Mandi"],
    "Sirsa": ["Dabwali Cotton/Wheat Hub", "Ellenabad Yard", "Kalanwali Mandi", "Rania Block Depot"],
    "Kurukshetra": ["Shahbad Markanda Grain Yard", "Thanesar Terminal", "Pehowa Hub", "Ladwa Mandi"],
    "Hisar": ["Hansi Grain Yard", "Uklana Mandi", "Barwala Agro Hub", "Narnaund Depot"]
  },
  "Himachal Pradesh": {
    "Shimla": ["Dhalli Apple Terminal", "Rohru Fruit & Potato Yard", "Theog Highland Market", "Rampur Depot"],
    "Kullu": ["Bhuntar Agro Terminal", "Anni Apple Collection Centre", "Nirmand Sub-Yard"],
    "Kangra": ["Kangra Valley Grain Mandi", "Palampur Tea & Grain Hub", "Nurpur Rural Terminal"]
  },
  "Jharkhand": {
    "Ranchi": ["Itki Organic Agro Cluster", "Ormanjhi Grain Depot", "Kanke Vegetable Terminal", "Bero Yard"],
    "Dumka": ["Santhal Pargana Rice Hub", "Sarath Paddy Depot", "Jarmundi Collection Centre"],
    "Hazaribagh": ["Barhi Agro Terminal", "Bishnugarh Rural Yard", "Ichak Pulse/Paddy Hub"]
  },
  "Karnataka": {
    "Belagavi": ["Bailhongal Cotton Yard", "Sankeshwar Sugarcane Hub", "Gokak Agro Mandi", "Athani Depot"],
    "Dharwad": ["Hubballi APMC (Major Cotton/Chilli Hub)", "Kundgol Yard", "Alnavar Tribal Depot"],
    "Ballari": ["Kotturu Grain Yard", "Siruguppa Rice Bowl Mandi", "Kampli Agro Terminal"],
    "Mysuru": ["Nanjangud Banana & Paddy Hub", "Hunsur Tobacco/Grain Yard", "T. Narasipura Depot"]
  },
  "Kerala": {
    "Palakkad": ["Alathur Rice Bowl Hub", "Chittur Paddy Terminal", "Mannarkkad Spices/Paddy Yard"],
    "Wayanad": ["Sulthan Bathery Pepper & Coffee Yard", "Mananthavady Tribal Produce Hub", "Kalpetta Depot"],
    "Idukki": ["Nedumkandam Cardamom Yard", "Adimali Spices Terminal", "Kattappana Market"]
  },
  "Madhya Pradesh": {
    "Ujjain": ["Badnagar Wheat Hub", "Khachrod Rural Mandi", "Mahidpur Cluster", "Tarana Grain Yard"],
    "Indore": ["Sanwer Rural APMC", "Depalpur Soybean Cluster", "Mhow Village Depot", "Hatod Mandi"],
    "Hoshangabad": ["Itarsi Express Wheat Yard", "Pipariya Mandi", "Babai Gramin Hub", "Seoni Malwa Belt"],
    "Sehore": ["Shyampur Sharbati Wheat Terminal", "Ashta Grain Hub", "Ichhawar Depot", "Nasrullaganj Mandi"]
  },
  "Maharashtra": {
    "Nashik": ["Lasalgaon APMC (Asia's Largest Onion Bowl)", "Pimpalgaon Baswant", "Yeola Yard", "Niphad Mandi"],
    "Pune": ["Baramati Agro Cluster", "Junnar Tomato & Grain Terminal", "Manchar Rural Yard", "Shirur Depot"],
    "Nagpur": ["Kalmeshwar Orange/Grain Yard", "Katol Agro Mandi", "Saoner Cotton/Paddy Depot", "Umred Hub"],
    "Kolhapur": ["Shahuwadi Jaggery Yard", "Jaysingpur Agro Cluster", "Gadhinglaj Mandi", "Shirol Terminal"]
  },
  "Manipur": {
    "Imphal West": ["Lamphelpat Agri-Market Terminal", "Wangoi Paddy Depot", "Lamsang Rural Yard"],
    "Bishnupur": ["Moirang Loktak Agro Hub", "Nambol Grain Depot", "Kwasiphai Market"],
    "Thoubal": ["Kakching Rice Bowl Yard", "Thoubal Market Terminal", "Yairipok Agro Centre"]
  },
  "Meghalaya": {
    "West Garo Hills": ["Tura Agro-Produce Terminal", "Tikrikilla Cashew Yard", "Dalu Border Mandi"],
    "East Khasi Hills": ["Shillong Iewduh Sub-Mandi", "Mawryngkneng Vegetable Yard", "Sohra Depot"],
    "Ri-Bhoi": ["Nongpoh Ginger/Pineapple Hub", "Umsning Agro Terminal", "Byrnihat Border Depot"]
  },
  "Mizoram": {
    "Aizawl": ["Durtlang Organic Produce Depot", "Sairang Agro Terminal", "Aibawk Village Hub"],
    "Kolasib": ["Vairengte Border Produce Yard", "Bilkhawthlir Fruit/Grain Depot", "Bairabi Rail Depot"],
    "Champhai": ["Champhai Rice Valley Hub", "Zokhawthar Border Mandi", "Khawbung Depot"]
  },
  "Nagaland": {
    "Dimapur": ["Purana Bazar Agri-Terminal", "Medziphema Organic Yard", "Chumoukedima Depot"],
    "Kohima": ["Tsiephyo Vegetable Hub", "Jakhama Valley Depot", "Zubza Railhead Yard"],
    "Mokokchung": ["Changtongya Agro Terminal", "Tuli Paper/Agro Hub", "Mangkolemba Yard"]
  },
  "Odisha": {
    "Bargarh": ["Attabira Paddy Belt", "Godbhaga Rural Yard", "Bheden Collection Center", "Sohela Mandi"],
    "Sambalpur": ["Rengali Grain Hub", "Kuchinda Chilli & Paddy Yard", "Dhankauda Cluster", "Jujumura Block"],
    "Kalahandi": ["Bhawanipatna Rice Bowl Terminal", "Dharamgarh Cotton/Paddy Yard", "Junagarh Depot"],
    "Ganjam": ["Aska Sugar & Grain Yard", "Hinjilicut Rural Yard", "Digapahandi Mandi", "Bhanjanagar Hub"]
  },
  "Punjab": {
    "Ludhiana": ["Khanna APMC (Asia's Largest Grain Terminal)", "Jagraon Grain Yard", "Samrala Sub-Yard", "Raikot Hub"],
    "Bathinda": ["Bhucho Mandi", "Rampura Phul Cotton/Wheat Yard", "Talwandi Sabo Hub", "Maur Yard"],
    "Sangrur": ["Sunam Rural Yard", "Dhuri Agro Cluster", "Malerkotla Vegetable Hub", "Moonak Yard"],
    "Amritsar": ["Bhagtanwala Grain Terminal", "Rayya APMC Yard", "Ajnala Border Hub", "Mehta Mandi"]
  },
  "Rajasthan": {
    "Sri Ganganagar": ["Ganganagar Wheat/Mustard Terminal", "Padampur Mandi", "Suratgarh Yard", "Raisinghnagar Hub"],
    "Kota": ["Bhamashah Mandi (Asia's Major Grain Yard)", "Ramganj Mandi (Coriander Capital)", "Itawa Depot"],
    "Bikaner": ["Nokha Moth/Pulse Mandi", "Sri Dungargarh Peanut Yard", "Loonkaransar Depot"],
    "Alwar": ["Khairthal Mustard Hub", "Kherli Grain Mandi", "Ramgarh Yard", "Tijara Village Depot"]
  },
  "Sikkim": {
    "East Sikkim": ["Singtam Organic Agricultural Terminal", "Rangpo Checkpost Hub", "Pakyong Depot"],
    "West Sikkim": ["Gyalshing Cardamom Yard", "Soreng Farmer Market", "Dentan Village Hub"],
    "South Sikkim": ["Namchi Agro-Produce Hub", "Jorethang Regional Mandi", "Ravangla Yard"]
  },
  "Tamil Nadu": {
    "Thanjavur": ["Kumbakonam Delta Rice Hub", "Papanasam Paddy Yard", "Pattukkottai Coconut/Paddy Mandi"],
    "Erode": ["Perundurai Turmeric Terminal", "Sathyamangalam Agro Hub", "Gobichettipalayam Yard"],
    "Coimbatore": ["Pollachi Coconut/Grain Hub", "Annur Agro Mandi", "Thondamuthur Vegetable Yard"],
    "Madurai": ["Mattuthavani APMC Terminal", "Usilampatti Rural Yard", "Melur Rice Hub", "Vadipatti Depot"]
  },
  "Telangana": {
    "Warangal": ["Enumamula APMC (Asia's Second Largest Grain Yard)", "Narsampet Yard", "Wardhannapet Hub"],
    "Nizamabad": ["Nizamabad Turmeric & Paddy Terminal", "Armoor Agro Hub", "Bodhan Sugarcane/Rice Yard"],
    "Karimnagar": ["Jammikunta Cotton/Paddy Yard", "Huzurabad Mandi", "Choppadandi Depot"],
    "Khammam": ["Khammam Mirchi/Cotton Yard", "Madhira Grain Mandi", "Sathupalli Agro Hub"]
  },
  "Tripura": {
    "West Tripura": ["Agartala Battala Agri-Market", "Sadar Rural Depot", "Bishalgarh Agro Terminal"],
    "South Tripura": ["Belonia Border Produce Hub", "Santirbazar Agro Mandi", "Sabroom Port Yard"],
    "Khowai": ["Teliamura Vegetable Yard", "Khowai Paddy Terminal", "Padmabil Cluster"]
  },
  "Uttar Pradesh": {
    "Varanasi": ["Raja Talab Agro Terminal", "Pindra Grain Yard", "Chandauli Border Rice Hub"],
    "Aligarh": ["Dhanipur Grain Yard", "Khair Bajra & Wheat Mandi", "Atrauli Depot", "Iglas Potato Hub"],
    "Bareilly": ["Baheri Sugarcane & Paddy Terminal", "Aonla Mustard Yard", "Nawabganj Agro Depot"],
    "Gorakhpur": ["Sahjanwa Grain Yard", "Chauri Chaura Agro Hub", "Campierganj Rice Depot"],
    "Agra": ["Khandauli Potato Capital Hub", "Fatehabad Grain Mandi", "Shamsabad Mustard Yard"]
  },
  "Uttarakhand": {
    "Udham Singh Nagar": ["Kashipur Grain Terminal", "Rudrapur Terai Agro Hub", "Kichha Mandi", "Bazpur Yard"],
    "Haridwar": ["Jwalapur Grain Mandi", "Roorkee Sugarcane/Paddy Depot", "Laksar Agro Terminal"],
    "Dehradun": ["Rishikesh Hill Produce Hub", "Vikasnagar Basmati & Fruit Yard", "Doiwala Depot"]
  },
  "West Bengal": {
    "Purba Bardhaman": ["Galsi Paddy Yard", "Memari Agro Hub", "Kalna River Basin", "Katwa Rural Mandi", "Raina Depot"],
    "Paschim Bardhaman": ["Durgapur Agro Depot", "Andal Rural Hub", "Raniganj Grain Terminal"],
    "Hooghly": ["Singur Agricultural Hub", "Tarakeswar Cold/Grain Yard", "Dhaniakhali Cluster", "Pandua Mandi"],
    "Nadia": ["Ranaghat Agro Hub", "Nakashipara Rural Yard", "Karimpur Border Hub", "Tehatta Mandi"],
    "Murshidabad": ["Baharampur Grain Depot", "Kandi Rice Bowl Hub", "Jalangi River Cluster", "Beldanga Mandi"]
  },

  // --- 8 UNION TERRITORIES ---
  "Andaman and Nicobar Islands": {
    "South Andaman": ["Port Blair Central APMC Depot", "Ferrargunj Coconut & Arecanut Hub"],
    "North and Middle Andaman": ["Diglipur Organic Agro Terminal", "Rangat Paddy Depot", "Mayabunder Yard"]
  },
  "Chandigarh": {
    "Chandigarh": ["Sector 26 APMC Grain & Fruit Terminal", "Manimajra Sub-Yard"]
  },
  "Dadra and Nagar Haveli and Daman and Diu": {
    "Dadra and Nagar Haveli": ["Silvassa Agro Depot", "Khanvel Tribal Agriculture Hub"],
    "Daman": ["Daman Coastal Agro Depot"],
    "Diu": ["Diu Farmer Collection Centre"]
  },
  "Delhi (NCT)": {
    "North Delhi": ["Narela Grain Mandi (Asia's Top Wheat Terminal)", "Azadpur APMC (Largest Fruit/Veg Hub)"],
    "East Delhi": ["Ghazipur APMC Terminal"],
    "South West Delhi": ["Najafgarh Grain Mandi"]
  },
  "Jammu and Kashmir": {
    "Sopore (Baramulla)": ["Sopore Fruit Mandi (Asia's 2nd Largest Apple Yard)", "Pattan Grain Hub"],
    "Anantnag": ["Ashajipora Agri-Market Yard", "Bijbehara Apple Depot"],
    "Jammu": ["Narwal Mandi Terminal", "R.S. Pura Basmati Rice Bowl Hub", "Bishnah Yard"]
  },
  "Ladakh": {
    "Leh": ["Leh Organic Seabuckthorn & Apricot Hub", "Chuchot Agro Depot", "Khaltse Valley Terminal"],
    "Kargil": ["Kargil Fruit Terminal", "Drass Barley Collection Depot", "Sankoo Agro Centre"]
  },
  "Lakshadweep": {
    "Lakshadweep": ["Kavaratti Coconut Produce Hub", "Andrott Island Agro Depot", "Minicoy Coir/Copra Centre"]
  },
  "Puducherry": {
    "Puducherry": ["Thattanchavady Market Committee Yard", "Madagadipet Grain Market", "Bahour Rice Bowl Hub"],
    "Karaikal": ["Karaikal APMC Yard", "Nedungadu Paddy Terminal"]
  }
};

// ============================================================
// 2. COMPLETE ALL-INDIA 16-LANGUAGE TRANSLATION MATRIX
// ============================================================
const I18N_DICTIONARY = {
  // 1. ENGLISH
  en: {
    tagline: "National Unified APMC Procurement Gateway",
    btn_home: "Gateway Home",
    gov_badge: "MINISTRY OF AGRICULTURE & FARMERS WELFARE • APMC SYSTEM",
    hero_title: "Unified National Mandi Gateway & Dispatch Terminal",
    hero_sub: "Digital procurement, capacity-regulated tokens, and direct bank settlement for Indian farmers",
    pill_public: "PUBLIC ACCESS",
    title_citizen: "Citizen / Farmer Portal",
    desc_citizen: "Pan-India applicant verification, capacity-calibrated arrival passes, live weighbridge queue telemetry, and direct DBT MSP settlement.",
    btn_enter_citizen: "Access Citizen Portal →",
    pill_officer: "RESTRICTED — OFFICIAL ACCESS",
    title_officer: "Department Officer Login",
    desc_officer: "For authorized APMC mandi superintendents, weighbridge telemetry operators, and quality assaying officers.",
    btn_enter_officer: "Access Officer Console →",
    login_heading: "Applicant Login (Farmer Portal)",
    lbl_state: "Select Your State / UT",
    lbl_district: "Select Your District",
    district_subtext: "District selection is mandatory for APMC routing.",
    lbl_mobile: "Registered Mobile Number",
    mobile_subtext: "An authentic 6-digit OTP will be dispatched to this number.",
    lbl_captcha: "Security Verification (Captcha)",
    btn_get_otp: "Get OTP →",
    otp_title: "Enter One Time Password",
    otp_sent_to: "OTP dispatched to:",
    otp_validity: "Valid for:",
    lbl_enter_6digit: "Enter 6-Digit OTP",
    btn_verify_continue: "Verify & Continue →",
    btn_change_mobile: "← Change Mobile Number",
    not_received: "Didn't receive code?",
    hub_breadcrumb: "Farmer Services & Verification Dashboard",
    welcome_user: "Welcome, Verified Farmer",
    tile_track_title: "Track Application / Pass Status",
    tile_track_desc: "Inspect your existing appointments, active tokens, live weighbridge bay queue numbers, and completed DBT payment receipts.",
    btn_track_status: "Track Status & Telemetry →",
    tile_book_title: "New Booking & Identity KYC",
    tile_book_desc: "Declare agricultural produce, verify document credentials, enter land records, and generate a new dynamic arrival token.",
    btn_new_booking: "New Appointment & KYC →",
    booking_breadcrumb: "APMC Slot Booking & Produce Declaration",
    form_title: "Book Procurement Slot",
    form_sub: "Register produce to get a dynamic capacity-calibrated queue token.",
    kyc_step: "Step 1: Farmer Identity Verification",
    kyc_desc: "Provide government IDs to auto-populate registry details and clear compliance checks.",
    btn_verify_id: "Verify ID",
    lbl_name: "1. Farmer Full Name",
    lbl_phone: "2. Verified Mobile Number",
    lbl_village: "3. Village / Tehsil / Block",
    lbl_centre: "4. Procurement Centre",
    lbl_crop: "5. Crop Type",
    lbl_qty: "6. Harvest Produce Quantity (Quintals)",
    lbl_slot: "7. Preferred Arrival Slot",
    btn_generate_pass: "Generate Pass",
    pass_title: "Active Digital Pass",
    pass_sub: "Live position synchronized with weighbridge counters.",
    officer_title: "Procurement Centre Dashboard",
    officer_sub: "Manage queues, weighbridge throughput, and MSP disbursements.",
    metric_total: "Total Today",
    metric_line: "In Line",
    metric_bridge: "At Weighbridge",
    metric_done: "Completed",
    yard_cap: "Yard Utilization Capacity",
    weigh_counters: "Live Weighbridge Counters",
    arrival_queue: "Arrival Queue",
    brand_tagline: "Integrated e-Governance & Direct MSP Settlement across all 28 States & 8 UTs",
    login_note: "<strong>National APMC Advisory:</strong> Farmers can claim appointments, check status, and audit DBT bank transfers via <strong>ONLINE</strong> portal mode or <strong>OFFLINE</strong> Mandi Helpdesks.",
    btn_weighbridge_bay: "Weighbridge Bay",
    btn_quality_assayer: "Quality Assayer",
    btn_helpdesk: "Mandi Helpdesk"
  },

  // 2. HINDI
  hi: {
    tagline: "राष्ट्रीय एकीकृत कृषि उपज मंडी खरीद पोर्टल",
    btn_home: "गेटवे मुख्य पृष्ठ",
    gov_badge: "कृषि एवं किसान कल्याण मंत्रालय • भारत सरकार",
    hero_title: "एकीकृत राष्ट्रीय कृषि मंडी गेटवे एवं नियंत्रण केंद्र",
    hero_sub: "भारतीय किसानों के लिए डिजिटल खरीद, पारदर्शी कतार प्रबंधन एवं प्रत्यक्ष DBT बैंक भुगतान",
    pill_public: "सार्वजनिक प्रवेश",
    title_citizen: "नागरिक / किसान पोर्टल",
    desc_citizen: "अखिल भारतीय किसान सत्यापन, क्षमता-आधारित टोकन, डिजिटल तौलकांटा कतार और प्रत्यक्ष MSP भुगतान।",
    btn_enter_citizen: "किसान पोर्टल खोलें →",
    pill_officer: "प्रतिबंधित — अधिकारी लॉगिन",
    title_officer: "मंडी अधिकारी लॉगिन",
    desc_officer: "अधिकृत APMC मंडी सचिव, तौलकांटा संचालक एवं गुणवत्ता जांच अधिकारियों के लिए।",
    btn_enter_officer: "अधिकारी कंसोल खोलें →",
    login_heading: "आवेदक लॉगिन (किसान सेवा केंद्र)",
    lbl_state: "अपना राज्य चुनें",
    lbl_district: "अपना ज़िला चुनें",
    district_subtext: "मंडी निर्धारण के लिए ज़िले का चयन अनिवार्य है।",
    lbl_mobile: "पंजीकृत मोबाइल नंबर",
    mobile_subtext: "इस नंबर पर 6-अंकों का आधिकारिक सत्यापन OTP भेजा जाएगा।",
    lbl_captcha: "सुरक्षा सत्यापन (कैप्चा कोड)",
    btn_get_otp: "OTP प्राप्त करें →",
    otp_title: "वन टाइम पासवर्ड दर्ज करें",
    otp_sent_to: "OTP भेजा गया नंबर:",
    otp_validity: "वैधता समय:",
    lbl_enter_6digit: "6-अंकों का OTP दर्ज करें",
    btn_verify_continue: "सत्यापित करें और आगे बढ़ें →",
    btn_change_mobile: "← मोबाइल नंबर बदलें",
    not_received: "कोड नहीं मिला?",
    hub_breadcrumb: "किसान सेवा एवं सत्यापन डैशबोर्ड",
    welcome_user: "स्वागत है, सत्यापित किसान",
    tile_track_title: "आवेदन / पास स्थिति ट्रैक करें",
    tile_track_desc: "अपनी पूर्व बुकिंग, सक्रिय टोकन, लाइव तौलकांटा कतार स्थिति एवं बैंक भुगतान रसीद देखें।",
    btn_track_status: "स्थिति एवं कतार देखें →",
    tile_book_title: "नई बुकिंग एवं किसान KYC",
    tile_book_desc: "फसल विवरण दर्ज करें, पहचान पत्र सत्यापित करें एवं नया डिजिटल मंडी पास प्राप्त करें।",
    btn_new_booking: "नया स्लॉट बुक करें →",
    booking_breadcrumb: "APMC स्लॉट बुकिंग एवं उपज घोषणा",
    form_title: "खरीद स्लॉट बुक करें",
    form_sub: "डिजिटल कतार टोकन प्राप्त करने के लिए अपनी उपज दर्ज करें।",
    kyc_step: "चरण 1: किसान पहचान सत्यापन",
    kyc_desc: "सरकारी डेटाबेस से विवरण भरने के लिए मान्य किसान आईडी प्रदान करें।",
    btn_verify_id: "आईडी सत्यापित करें",
    lbl_name: "1. किसान का पूरा नाम",
    lbl_phone: "2. सत्यापित मोबाइल नंबर",
    lbl_village: "3. गाँव / तहसील / ब्लॉक",
    lbl_centre: "4. खरीद केंद्र (मंडी यार्ड)",
    lbl_crop: "5. फसल का प्रकार",
    lbl_qty: "6. अनुमानित उपज मात्रा (क्विंटल)",
    lbl_slot: "7. आगमन का पसंदीदा समय",
    btn_generate_pass: "मंडी पास जारी करें",
    pass_title: "सक्रिय डिजिटल पास",
    pass_sub: "तौलकांटा कतार से सीधे जुड़ा लाइव टोकन।",
    officer_title: "प्रोक्योरमेंट सेंटर डैशबोर्ड",
    officer_sub: "कतारें, तौलकांटा थ्रूपुट और एमएसपी संवितरण प्रबंधित करें।",
    metric_total: "आज कुल किसान",
    metric_line: "कतार में प्रतीक्षारत",
    metric_bridge: "तौलकांटे पर",
    metric_done: "खरीद पूर्ण",
    yard_cap: "मंडी यार्ड उपयोग क्षमता",
    weigh_counters: "लाइव तौलकांटा काउंटर्स",
    arrival_queue: "आगमन कतार",
    brand_tagline: "सभी 28 राज्यों और 8 केंद्र शासित प्रदेशों में पारदर्शी खरीद और तत्काल भुगतान",
    login_note: "<strong>राष्ट्रीय परामर्श:</strong> किसान ऑनलाइन पोर्टल या मंडी हेल्पडेस्क से टोकन बुक कर सकते हैं।",
    btn_weighbridge_bay: "तौलकांटा यार्ड",
    btn_quality_assayer: "गुणवत्ता निरीक्षक",
    btn_helpdesk: "मंडी सहायता केंद्र"
  },

  // 3. BENGALI
  bn: {
    tagline: "জাতীয় সমন্বিত কৃষি মান্ডি প্রকিউরমেন্ট গেটওয়ে",
    btn_home: "হোম পেজ",
    gov_badge: "কৃষি ও কৃষক কল্যাণ মন্ত্রক • ভারত সরকার",
    hero_title: "সমন্বিত জাতীয় কৃষি মান্ডি টার্মিনাল",
    hero_sub: "ভারতীয় কৃষকদের জন্য ডিজিটাল ফসল বিক্রি, টোকেন ও সরাসরি ব্যাঙ্ক অ্যাকাউন্টে MSP টাকা প্রদান",
    pill_public: "সাধারণ নাগরিক প্রবেশ",
    title_citizen: "কৃষক ও নাগরিক পোর্টাল",
    desc_citizen: "অনলাইন পরিচয় যাচাইকরণ, ডিজিটাল আগমন পাস ও সরাসরি অ্যাকাউন্টে MSP টাকা প্রদান।",
    btn_enter_citizen: "কৃষক পোর্টাল খুলুন →",
    pill_officer: "সুরক্ষিত — আধিকারিক লগইন",
    title_officer: "মান্ডি আধিকারিক পোর্টাল",
    desc_officer: "অনুমোদিত APMC মান্ডি আধিকারিক ও ওয়েব্রিজ অপারেটরদের কাজের জন্য।",
    btn_enter_officer: "আধিকারিক ডেস্ক খুলুন →",
    login_heading: "আবেদনকারী লগইন (কৃষক পোর্টাল)",
    lbl_state: "আপনার রাজ্য নির্বাচন করুন",
    lbl_district: "আপনার জেলা নির্বাচন করুন",
    district_subtext: "মান্ডি নির্বাচনের জন্য জেলা নির্বাচন বাধ্যতামূলক।",
    lbl_mobile: "নথিভুক্ত মোবাইল নম্বর",
    mobile_subtext: "এই নম্বরে ৬ সংখ্যার সরকারি OTP কোড পাঠানো হবে।",
    lbl_captcha: "সুরক্ষা ক্যাপচা যাচাই",
    btn_get_otp: "OTP পান →",
    otp_title: "OTP কোড প্রদান করুন",
    otp_sent_to: "কোড পাঠানো হয়েছে:",
    otp_validity: "মেয়াদ:",
    lbl_enter_6digit: "৬ সংখ্যার OTP কোড লিখুন",
    btn_verify_continue: "যাচাই করুন এবং এগিয়ে যান →",
    btn_change_mobile: "← মোবাইল নম্বর পরিবর্তন করুন",
    not_received: "কোড পাননি?",
    hub_breadcrumb: "কৃষক পরিষেবা কেন্দ্র",
    welcome_user: "স্বাগতম, কৃষক বন্ধু",
    tile_track_title: "আবেদন ও টোকেন ট্র্যাক করুন",
    tile_track_desc: "বর্তমান টোকেন, লাইভ ওয়েব্রিজ কিউ নম্বর এবং ব্যাঙ্ক পেমেন্ট স্লিপ দেখুন।",
    btn_track_status: "স্ট্যাটাস দেখুন →",
    tile_book_title: "নতুন বুকিং ও KYC যাচাই",
    tile_book_desc: "ফসলের পরিমাণ জানান, পরিচয় নথি দিন এবং ডিজিটাল মান্ডি পাস তৈরি করুন।",
    btn_new_booking: "নতুন স্লট বুক করুন →",
    booking_breadcrumb: "APMC স্লট বুকিং ও ফসলের তথ্য",
    form_title: "ফসল বিক্রির স্লট বুক করুন",
    form_sub: "ডিজিটাল টোকেন পাওয়ার জন্য ফসলের বিবরণ দিন।",
    kyc_step: "ধাপ ১: কৃষক পরিচয় যাচাই",
    kyc_desc: "সরকারি নথি যাচাই করে অগ্রাধিকার ভিত্তিক টোকেন নিন।",
    btn_verify_id: "যাচাই করুন",
    lbl_name: "১. কৃষকের সম্পূর্ণ নাম",
    lbl_phone: "২. যাচাইকৃত মোবাইল নম্বর",
    lbl_village: "৩. গ্রাম / ব্লক / পঞ্চায়েত",
    lbl_centre: "৪. ফসল ক্রয় কেন্দ্র",
    lbl_crop: "৫. ফসলের ধরন",
    lbl_qty: "৬. ফসলের পরিমাণ (কুইন্টাল)",
    lbl_slot: "৭. মান্ডিতে আসার সময়",
    btn_generate_pass: "ডিজিটাল পাস বানান",
    pass_title: "সক্রিয় ডিজিটাল পাস",
    pass_sub: "লাইভ ওয়েব্রিজ কাউন্টারের সাথে যুক্ত।",
    officer_title: "প্রকিউরমেন্ট সেন্টার ড্যাশবোর্ড",
    officer_sub: "কিউ লাইন, ওয়েব্রিজ স্কেল ও পেমেন্ট পরিচালনা করুন।",
    metric_total: "আজকের মোট",
    metric_line: "লাইনে অপেক্ষারত",
    metric_bridge: "ওয়েব্রিজ কাঁটায়",
    metric_done: "সম্পন্ন",
    yard_cap: "ম্যান্ডির ধারণক্ষমতা",
    weigh_counters: "সক্রিয় ওয়েব্রিজ কাউন্টার",
    arrival_queue: "আগমন কিউ",
    brand_tagline: "সমগ্র ভারতে স্বচ্ছ ক্রয় প্রক্রিয়া এবং কৃষকদের অ্যাকাউন্টে সরাসরি অর্থপ্রদান",
    login_note: "<strong>পরামর্শ:</strong> কৃষক বন্ধু আইডি বা কেসিসি দিয়ে লগইন করে ঝামেলামুক্ত স্লট বুক করুন।",
    btn_weighbridge_bay: "ওয়েব্রিজ বে",
    btn_quality_assayer: "গুণমান পরীক্ষক",
    btn_helpdesk: "মাণ্ডী সহায়তা কেন্দ্ৰ"
  },

  // 4. ODIA
  or: {
    tagline: "ଜାତୀୟ ଏକୀକୃତ APMC କୃଷି କ୍ରୟ ପୋର୍ଟାଲ",
    btn_home: "ମୁଖ୍ୟ ପୃଷ୍ଠା",
    gov_badge: "କୃଷି ଓ କୃଷକ କଲ୍ୟାଣ ମନ୍ତ୍ରଣାଳୟ • ଭାରତ ସରକାର",
    hero_title: "ଏକୀକୃତ ଜାତୀୟ ମଣ୍ଡି ଗେଟୱେ ଏବଂ ନିୟନ୍ତ୍ରଣ କେନ୍ଦ୍ର",
    hero_sub: "ଭାରତୀୟ କୃଷକଙ୍କ ପାଇଁ ଡିଜିଟାଲ୍ କ୍ରୟ, ସ୍ୱଚ୍ଛ ଧାଡ଼ି ଏବଂ ସିଧାସଳଖ ବ୍ୟାଙ୍କ ଖାତାରେ MSP ପ୍ରଦାନ",
    pill_public: "ସାଧାରଣ ପ୍ରବେଶ",
    title_citizen: "ନାଗରିକ / କୃଷକ ପୋର୍ଟାଲ",
    desc_citizen: "କୃଷକ ପରିଚୟ ଯାଞ୍ଚ, ଡିଜିଟାଲ୍ ୱେବ୍ରିଜ୍ ପାସ୍, ଲାଇଭ୍ ଧାଡ଼ି ଏବଂ ପ୍ରତ୍ୟକ୍ଷ DBT ବ୍ୟାଙ୍କ୍ ଜମା।",
    btn_enter_citizen: "କୃଷକ ପୋର୍ଟାଲ୍ ଖୋଲନ୍ତୁ →",
    pill_officer: "ଅଧିକାରୀ ଲଗଇନ୍",
    title_officer: "ମଣ୍ଡି ଅଧିକାରୀ ଲଗଇନ୍",
    desc_officer: "ଅଧିକୃତ APMC ସମ୍ପାଦକ, ୱେବ୍ରିଜ୍ କର୍ମଚାରୀ ଓ ଗୁଣବତ୍ତା ଯାଞ୍ଚ ଅଧିକାରୀଙ୍କ ପାଇଁ।",
    btn_enter_officer: "ଅଧିକାରୀ କନସୋଲ୍ →",
    login_heading: "ଆବେଦନକାରୀ ଲଗଇନ୍ (କୃଷକ ସେବା)",
    lbl_state: "ଆପଣଙ୍କ ରାଜ୍ୟ ଚୟନ କରନ୍ତୁ",
    lbl_district: "ଆପଣଙ୍କ ଜିଲ୍ଲା ଚୟନ କରନ୍ତୁ",
    district_subtext: "ମଣ୍ଡି ନିର୍ଦ୍ଧାରଣ ପାଇଁ ଜିଲ୍ଲା ଚୟନ ବାଧ୍ୟତାମୂଳକ।",
    lbl_mobile: "ପଞ୍ଜୀକୃତ ମୋବାଇଲ୍ ନମ୍ବର",
    mobile_subtext: "ଏହି ନମ୍ବରକୁ ୬-ଅଙ୍କ ବିଶିଷ୍ଟ ସରକାରୀ OTP ପଠାଯିବ।",
    lbl_captcha: "ସୁରକ୍ଷା କୋଡ୍ (କ୍ୟାପ୍‌ଚା)",
    btn_get_otp: "OTP ପାଆନ୍ତୁ →",
    otp_title: "OTP କୋଡ୍ ପ୍ରବେଶ କରନ୍ତୁ",
    otp_sent_to: "ପଠାଯାଇଥିବା ନମ୍ବର:",
    otp_validity: "ବୈଧତା ସମୟ:",
    lbl_enter_6digit: "୬-ଅଙ୍କ ବିଶିଷ୍ଟ OTP ଲେଖନ୍ତୁ",
    btn_verify_continue: "ଯାଞ୍ଚ କରି ଆଗକୁ ବଢ଼ନ୍ତୁ →",
    btn_change_mobile: "← ମୋବାଇଲ୍ ନମ୍ବର ବଦଳାନ୍ତୁ",
    not_received: "କୋଡ୍ ମିଳିନାହିଁ କି?",
    hub_breadcrumb: "କୃଷକ ସେବା କେନ୍ଦ୍ର ଡ୍ୟାସବୋର୍ଡ",
    welcome_user: "ସ୍ୱାଗତ, ପଞ୍ଜୀକୃତ କୃଷକ ବନ୍ଧୁ",
    tile_track_title: "ପାସ୍ ଏବଂ ଧାଡ଼ି ସ୍ଥିତି ଯାଞ୍ଚ କରନ୍ତୁ",
    tile_track_desc: "ଆପଣଙ୍କର ଚାଲୁଥିବା ଟୋକନ୍, ଲାଇଭ୍ ୱେବ୍ରିଜ୍ ଧାଡ଼ି ନମ୍ବର ଏବଂ ବ୍ୟାଙ୍କ୍ ପୈଠ ରସିଦ ଦେଖନ୍ତୁ।",
    btn_track_status: "ସ୍ଥିତି ଦେଖନ୍ତୁ →",
    tile_book_title: "ନୂତନ ବୁକିଂ ଏବଂ କୃଷକ KYC",
    tile_book_desc: "ଫସଲ ବିବରଣୀ ପ୍ରଦାନ କରନ୍ତୁ, ପରିଚୟ ଯାଞ୍ଚ କରନ୍ତୁ ଏବଂ ନୂତନ ଡିଜିଟାଲ୍ ମଣ୍ଡି ପାସ୍ ପାଆନ୍ତୁ।",
    btn_new_booking: "ନୂତନ ସ୍ଲଟ୍ ବୁକ୍ କରନ୍ତୁ →",
    booking_breadcrumb: "ମଣ୍ଡି ସ୍ଲଟ୍ ବୁକିଂ ଏବଂ ଫସଲ ଘୋଷଣା",
    form_title: "ଫସଲ ବିକ୍ରୟ ସ୍ଲଟ୍ ବୁକ୍ କରନ୍ତୁ",
    form_sub: "ଡିଜିଟାଲ୍ ଧାଡ଼ି ଟୋକନ୍ ପାଇବା ପାଇଁ ଫସଲର ବିବରଣୀ ପ୍ରବେଶ କରନ୍ତୁ।",
    kyc_step: "ପଦକ୍ଷେପ ୧: କୃଷକ ପରିଚୟ ଯାଞ୍ଚ",
    kyc_desc: "ସରକାରୀ ଡାଟାବେସରୁ ବିବରଣୀ ପାଇବା ପାଇଁ କୃଷକ ଆଇଡି ପ୍ରଦାନ କରନ୍ତୁ।",
    btn_verify_id: "ଆଇଡି ଯାଞ୍ଚ କରନ୍ତୁ",
    lbl_name: "୧. କୃଷକଙ୍କ ପୂରା ନାମ",
    lbl_phone: "୨. ଯାଞ୍ଚ ହୋଇଥିବା ମୋବାଇଲ୍ ନମ୍ବର",
    lbl_village: "୩. ଗ୍ରାମ / ବ୍ଲକ୍ / ପଞ୍ଚାୟତ",
    lbl_centre: "୪. କ୍ରୟ କେନ୍ଦ୍ର (ମଣ୍ଡି)",
    lbl_crop: "୫. ଫସଲ ପ୍ରକାର",
    lbl_qty: "୬. ଫସଲ ପରିମାଣ (କ୍ୱିଣ୍ଟାଲ୍)",
    lbl_slot: "୭. ମଣ୍ଡି ଆସିବାର ସମୟ",
    btn_generate_pass: "ମଣ୍ଡି ପାସ୍ ପ୍ରସ୍ତୁତ କରନ୍ତୁ",
    pass_title: "ସକ୍ରିୟ ଡିଜିଟାଲ୍ ପାସ୍",
    pass_sub: "ଲାଇଭ୍ ୱେବ୍ରିଜ୍ କାଉଣ୍ଟର ସହିତ ସଂଯୁକ୍ତ।",
    officer_title: "କ୍ରୟ କେନ୍ଦ୍ର ଡ୍ୟାସବୋର୍ଡ",
    officer_sub: "ଧାଡ଼ି, ୱେବ୍ରିଜ୍ ତଥା ଅର୍ଥ ପ୍ରଦାନ ପରିଚାଳନା କରନ୍ତୁ।",
    metric_total: "ଆଜିର ମୋଟ କୃଷକ",
    metric_line: "ଧାଡ଼ିରେ ଅପେକ୍ଷାରତ",
    metric_bridge: "ୱେବ୍ରିଜ୍ କଣ୍ଟାରେ",
    metric_done: "ସମ୍ପୂର୍ଣ୍ଣ ହୋଇଛି",
    yard_cap: "ମଣ୍ଡି ଧାରଣ କ୍ଷମତା",
    weigh_counters: "ସକ୍ରିୟ ୱେବ୍ରିଜ୍ କାଉଣ୍ଟର",
    arrival_queue: "ଆଗମନ ଧାଡ଼ି",
    brand_tagline: "ସମଗ୍ର ଭାରତରେ ସ୍ୱଚ୍ଛ କ୍ରୟ ଏବଂ ସିଧାସଳଖ ବ୍ୟାଙ୍କ ଖାତାକୁ ଅର୍ଥ ପ୍ରଦାନ",
    login_note: "<strong>ସୂଚନା:</strong> କୃଷକମାନେ ଘରେ ବସି ନିଜ ଫସଲ ବିକ୍ରୟ ପାଇଁ ଡିଜିଟାଲ୍ ଟୋକନ୍ ବୁକ୍ କରିପାରିବେ।",
    btn_weighbridge_bay: "ୱେବ୍ରିଜ୍ କଣ୍ଟା",
    btn_quality_assayer: "ଗୁଣବତ୍ତା ନିରୀକ୍ଷକ",
    btn_helpdesk: "ମାଣ୍ଡୀ ସହାୟତା କେନ୍ଦ୍ର"
  },

  // 5. ASSAMESE
  as: {
    tagline: "ৰাষ্ট্ৰীয় একীকৃত কৃষি ক্ৰয় গেটৱে'",
    btn_home: "মুখ্য পৃষ্ঠা",
    gov_badge: "কৃষি আৰু কৃষক কল্যাণ মন্ত্ৰালয় • ভাৰত চৰকাৰ",
    hero_title: "একীকৃত ৰাষ্ট্ৰীয় কৃষি মাণ্ডী ক্ৰয় টাৰ্মিনেল",
    hero_sub: "ভাৰতীয় কৃষকৰ বাবে ডিজিটেল ক্ৰয়, পাৰদৰ্শী শাৰী ব্যৱস্থাপনা আৰু বেংক একাউণ্টত প্ৰত্যক্ষ MSP ধন প্ৰদান",
    pill_public: "ৰাজহুৱা প্ৰৱেশ",
    title_citizen: "কৃষক আৰু নাগৰিক সেৱা প'ৰ্টেল",
    desc_citizen: "কৃষক পৰিচয় পৰীক্ষণ, ডিজিটেল মাণ্ডী পাছ, লাইভ ওজন শাৰী আৰু প্ৰত্যক্ষ DBT বেংক ধন হস্তান্তৰ।",
    btn_enter_citizen: "কৃষক প'ৰ্টেললৈ যাওক →",
    pill_officer: "সুৰক্ষিত বিষয়া প্ৰৱেশ",
    title_officer: "মাণ্ডী বিষয়া প'ৰ্টেল",
    desc_officer: "অনুমোদিত APMC বিষয়া আৰু ওজন মাপক অপাৰেটৰসকলৰ বাবে।",
    btn_enter_officer: "বিষয়া ডেস্কলৈ যাওক →",
    login_heading: "আবেদনকাৰী প্ৰৱেশ (কৃষক সেৱা)",
    lbl_state: "আপোনাৰ ৰাজ্য বাছনি কৰক",
    lbl_district: "আপোনাৰ জিলা বাছনি কৰক",
    district_subtext: "মাণ্ডী নিৰ্ধাৰণৰ বাবে জিলা বাছনি কৰাটো বাধ্যতামূলক।",
    lbl_mobile: "পঞ্জীভুক্ত ম'বাইল নম্বৰ",
    mobile_subtext: "এই নম্বৰত ৬টা সংখ্যাৰ চৰকাৰী OTP প্ৰেৰণ কৰা হ'ব।",
    lbl_captcha: "সুৰক্ষা সংকেত (কেপচা)",
    btn_get_otp: "OTP লাভ কৰক →",
    otp_title: "OTP ক'ড প্ৰদান কৰক",
    otp_sent_to: "প্ৰেৰণ কৰা নম্বৰ:",
    otp_validity: "সময়সীমা:",
    lbl_enter_6digit: "৬টা সংখ্যাৰ OTP লিখক",
    btn_verify_continue: "পৰীক্ষা কৰি আগবাঢ়ক →",
    btn_change_mobile: "← নম্বৰ সলনি কৰক",
    not_received: "ক'ড পোৱা নাইনে?",
    hub_breadcrumb: "কৃষক সেৱা কেন্দ্ৰ",
    welcome_user: "স্বাগতম, পঞ্জীভুক্ত কৃষক বন্ধু",
    tile_track_title: "আবেদন আৰু পাছ পৰীক্ষা কৰক",
    tile_track_desc: "বৰ্তমানৰ টোকেন, ওজন শাৰীৰ নম্বৰ আৰু বেংক ধন পৰিশোধৰ ৰচিদ চাওক।",
    btn_track_status: "স্থিতি পৰীক্ষা কৰক →",
    tile_book_title: "নতুন বুকিং আৰু KYC পৰীক্ষা",
    tile_book_desc: "শস্যৰ পৰিমাণ উল্লেখ কৰক, নথি পৰীক্ষা কৰক আৰু ডিজিটেল পাছ লাভ কৰক।",
    btn_new_booking: "নতুন স্লট বুক কৰক →",
    booking_breadcrumb: "মাণ্ডী স্লট বুকিং আৰু শস্য ঘোষণা",
    form_title: "শস্য বিক্ৰীৰ স্লট বুক কৰক",
    form_sub: "ডিজিটেল টোকেন লাভৰ বাবে শস্যৰ বিৱৰণ দিয়ক।",
    kyc_step: "১ম স্তৰ: কৃষক পৰিচয় পৰীক্ষা",
    kyc_desc: "চৰকাৰী ৰেকৰ্ডৰ সৈতে মিলাবলৈ কৃষক আই-ডি প্ৰদান কৰক।",
    btn_verify_id: "আই-ডি পৰীক্ষা কৰক",
    lbl_name: "১. কৃষকৰ সম্পূৰ্ণ নাম",
    lbl_phone: "২. ম'বাইল নম্বৰ",
    lbl_village: "৩. গাঁও / ব্লক / তহচিল",
    lbl_centre: "৪. শস্য ক্ৰয় কেন্দ্ৰ",
    lbl_crop: "৫. শস্যৰ প্ৰকাৰ",
    lbl_qty: "৬. মুঠ শস্য (কুইণ্টল)",
    lbl_slot: "৭. মাণ্ডীলৈ অহাৰ সময়",
    btn_generate_pass: "মাণ্ডী পাছ প্ৰস্তুত কৰক",
    pass_title: "সক্ৰিয় ডিজিটেল পাছ",
    pass_sub: "লাইভ ওজন স্কেলৰ সৈতে সংযুক্ত।",
    officer_title: "মাণ্ডী পৰিচালনা কেন্দ্ৰ",
    officer_sub: "শাৰী, ওজন মাপ আৰু ধন হস্তান্তৰ নিয়ন্ত্ৰণ কৰক।",
    metric_total: "আজিৰ মুঠ কৃষক",
    metric_line: "শাৰীত ৰৈ থকা",
    metric_bridge: "ওজন চকীত থকা",
    metric_done: "ক্ৰয় সমাপ্ত",
    yard_cap: "মাণ্ডীৰ ক্ষমতা",
    weigh_counters: "সক্ৰিয় ওজন কেন্দ্ৰ",
    arrival_queue: "আগমন শাৰী",
    brand_tagline: "কৃষকৰ একাউণ্টত পোনে পোনে ন্যূনতম সমৰ্থন মূল্য হস্তান্তৰ",
    login_note: "<strong>পৰামৰ্শ:</strong> কৃষকে ঘৰতে বহি নিজৰ শস্য বিক্ৰীৰ বাবে ডিজিটেল টোকেন ল'ব পাৰে।",
    btn_weighbridge_bay: "ওজন মাপক চকী",
    btn_quality_assayer: "গুণমান পৰীক্ষক",
    btn_helpdesk: "মাণ্ডী সহায়তা কেন্দ্ৰ"
  },

  // 6. GARO (A·chik)
  grt: {
    tagline: "Songsalni Game-ge·e Cha·giparangni APMC Procurement Portal",
    btn_home: "Mongsonggipa Page",
    gov_badge: "MINISTRY OF AGRICULTURE • INDIA SARKAR",
    hero_title: "A·dokni APMC Mandi Procurement Terminal",
    hero_sub: "Game-ge·giparangna digital gate pass, weighbridge line aro direct bank-ona tangka chipe on·ani",
    pill_public: "JINMANA",
    title_citizen: "Game-ge·giparangni Portal",
    desc_citizen: "Pangchakani leka porikha ka·ani, digital mandi pass aro bank-ona direct MSP tangka man·ani.",
    btn_enter_citizen: "Game-ge·giparang Napbo →",
    pill_officer: "OFFICER-RANGNASAN",
    title_officer: "Mandi Officer Login",
    desc_officer: "Authorized APMC Secretary, weighbridge operator aro quality check officer-rangna.",
    btn_enter_officer: "Officer Console Napbo →",
    login_heading: "Applicant Login (Game-ge·gipa)",
    lbl_state: "Nang·ni State-ko Seokbo",
    lbl_district: "Nang·ni District-ko Seokbo",
    district_subtext: "Mandi-ko tik ka·na district seokna nangchongmota.",
    lbl_mobile: "Registered Mobile Number",
    mobile_subtext: "Ia number-ona 6-digit OTP re·anggen.",
    lbl_captcha: "Security Verification Code",
    btn_get_otp: "OTP Man·bo →",
    otp_title: "OTP Code-ko Sedokbo",
    otp_sent_to: "Mobile Number:",
    otp_validity: "Sal/Somoi:",
    lbl_enter_6digit: "6-Digit OTP-ko Sedokbo",
    btn_verify_continue: "Porikha Ka·e Re·angbo →",
    btn_change_mobile: "← Mobile Number Sregrikbo",
    not_received: "OTP man·jawaia?",
    hub_breadcrumb: "Game-ge·gipani Service Dashboard",
    welcome_user: "Namgipa Sal, Verified Farmer",
    tile_track_title: "Pass aro Token Status Nibo",
    tile_track_desc: "Nang·ni active token, weighbridge line number aro bank receipt-ko nibo.",
    btn_track_status: "Status Nibo →",
    tile_book_title: "Gital Slot Booking & KYC",
    tile_book_desc: "Me·su sam·jak, mi-misi ba crop-ko parakbo aro gital arrival pass man·bo.",
    btn_new_booking: "Gital Slot Book Ka·bo →",
    booking_breadcrumb: "APMC Slot Booking & Produce Declaration",
    form_title: "Mandi Arrival Slot Book Ka·bo",
    form_sub: "Digital line token man·na gita produce details sedokbo.",
    kyc_step: "Step 1: Farmer Identity Verification",
    kyc_desc: "Government registry baksa tosusana gita farmer ID sedokbo.",
    btn_verify_id: "ID Porikha Ka·bo",
    lbl_name: "1. Farmer-ni Biming",
    lbl_phone: "2. Mobile Number",
    lbl_village: "3. Song / Block / Tehsil",
    lbl_centre: "4. Procurement Mandi Centre",
    lbl_crop: "5. Mi/Crop-ni Jat",
    lbl_qty: "6. Quantity (Quintals)",
    lbl_slot: "7. Mandi-ona Re·bana Somoi",
    btn_generate_pass: "Digital Pass Man·bo",
    pass_title: "Active Digital Pass",
    pass_sub: "Weighbridge machine baksa live connect ka·aha.",
    officer_title: "Mandi Procurement Control Desk",
    officer_sub: "Weighbridge scale aro farmer line-ko manage ka·bo.",
    metric_total: "Da·alni Gimik",
    metric_line: "Line-o Seng·giparang",
    metric_bridge: "Weighbridge-o",
    metric_done: "Matchotaha",
    yard_cap: "Mandi Capacity",
    weigh_counters: "Live Weighbridge Counter",
    arrival_queue: "Arrival Line",
    brand_tagline: "India a·song gimiko game-ge·giparangna direct account-ona MSP tangka on·ani",
    login_note: "<strong>U·iatani:</strong> Game-ge·giparang online ba Mandi Helpdesk gita digital token man·gen.",
    btn_weighbridge_bay: "Weighbridge Bay",
    btn_quality_assayer: "Quality Natsokgipa",
    btn_helpdesk: "ᱛᱩᱞᱟᱹ ᱢᱟᱥᱤᱱ"
  },

  // 7. SANTALI (Ol Chiki)
  sat: {
    tagline: "ᱫᱤᱥᱚᱢ ᱨᱮᱱᱟᱜ ᱢᱤᱫᱚᱱ APMC ᱪᱟᱥ ᱟᱨᱡᱚᱣ ᱯᱚᱨᱚ ᱴᱚ ᱠᱚ",
    btn_home: "ᱚ ᱠᱚ",
    gov_badge: "ᱚ ᱠᱚ ᱟ ᱪᱚ ᱵᱚ ᱵᱚ ᱵᱚ",
    title_citizen: "ᱪᱟᱹᱥᱤ ᱯᱳᱨᱴᱟᱞ",
    desc_citizen: "ᱪᱟᱹᱥᱤ ᱩᱯᱨᱩᱢ ᱯᱚᱨᱠᱷᱟᱣ, ᱰᱤᱡᱤᱴᱟᱞ ᱯᱟᱥ, ᱞᱟᱭᱤᱵᱽ ᱛᱩᱞᱟᱹ ᱫᱷᱟᱹᱲ ᱟᱨ ᱥᱚᱡᱷᱮ DBT ᱴᱟᱠᱟ ᱧᱟᱢ।",
    btn_enter_citizen: "ᱪᱟᱹᱥᱤ ᱯᱳᱨᱴᱟᱞ ᱠᱷᱩᱞᱟᱹᱭ ᱢᱮ →",
    pill_officer: "ᱚᱯᱷᱤᱥᱟᱨ ᱞᱚᱜᱤᱱ",
    title_officer: "ᱢᱟᱱᱰᱤ ᱚᱯᱷᱤᱥᱟᱨ ᱞᱚᱜᱤᱱ",
    desc_officer: "APMC ᱥᱩᱯᱚᱨᱤᱱᱴᱮᱱᱰᱮᱱᱴ ᱟᱨ ᱛᱩᱞᱟᱹ ᱚᱯᱟᱨᱮᱴᱟᱨ ᱠᱚ ᱞᱟᱹᱜᱤᱫ।",
    btn_enter_officer: "ᱚᱯᱷᱤᱥᱟᱨ ᱠᱚᱱᱥᱳᱞ →",
    login_heading: "ᱪᱟᱹᱥᱤ ᱞᱚᱜᱤᱱ (ᱪᱟᱥ ᱥᱮᱵᱟ)",
    lbl_state: "ᱟᱢᱟᱜ ᱯᱚᱱᱚᱛ ᱵᱟᱪᱷᱟᱣ ᱢᱮ",
    lbl_district: "ᱟᱢᱟᱜ ᱡᱤᱞᱟᱹ ᱵᱟᱪᱷᱟᱣ ᱢᱮ",
    district_subtext: "ᱢᱟᱱᱰᱤ ᱵᱟᱪᱷᱟᱣ ᱞᱟᱹᱜᱤᱫ ᱡᱤᱞᱟᱹ ᱵᱟᱪᱷᱟᱣ ᱞᱟᱹᱠᱛᱤᱭᱟᱱ ᱜᱮᱭᱟ।",
    lbl_mobile: "ᱨᱮᱡᱤᱥᱴᱟᱨ ᱢᱳᱵᱟᱭᱤᱞ ᱱᱚᱢᱵᱚᱨ",
    mobile_subtext: "ᱱᱚᱶᱟ ᱱᱚᱢᱵᱚᱨ ᱨᱮ ᱖-ᱮᱞᱟᱱ OTP ᱵᱷᱮᱡᱟᱜ-ᱟ।",
    lbl_captcha: "ᱥᱩᱨᱚᱠᱷᱟ ᱠᱳᱰ (Captcha)",
    btn_get_otp: "OTP ᱧᱟᱢ ᱢᱮ →",
    otp_title: "OTP ᱠᱳᱰ ᱮᱢ ᱢᱮ",
    otp_sent_to: "ᱵᱷᱮᱡᱟᱣ ᱟᱠᱟᱱ ᱱᱚᱢᱵᱚᱨ:",
    otp_validity: "ᱚᱠᱛᱚ:",
    lbl_enter_6digit: "᱖-ᱮᱞᱟᱱ OTP ᱚᱞ ᱢᱮ",
    btn_verify_continue: "ᱯᱚᱨᱠᱷᱟᱣ ᱠᱟᱛᱮ ᱞᱟᱦᱟᱜ ᱢᱮ →",
    btn_change_mobile: "← ᱢᱳᱵᱟᱭᱤᱞ ᱱᱚᱢᱵᱚᱨ ᱵᱚᱫᱚᱞ",
    not_received: "ᱠᱳᱰ ᱵᱟᱝ ᱧᱟᱢ ᱞᱮᱱᱟ?",
    hub_breadcrumb: "ᱪᱟᱹᱥᱤ ᱥᱮᱵᱟ ᱰᱮᱥᱵᱳᱨᱰ",
    welcome_user: "ᱡᱚᱦᱟᱨ, ᱯᱚᱨᱠᱷᱟᱣ ᱪᱟᱹᱥᱤ",
    tile_track_title: "ᱯᱟᱥ ᱟᱨ ᱫᱷᱟᱹᱲ ᱨᱮᱱᱟᱜ ᱦᱟᱞᱚᱛ",
    tile_track_desc: "ᱟᱢᱟᱜ ᱴᱳᱠᱮᱱ, ᱛᱩᱞᱟᱹ ᱫᱷᱟᱹᱲ ᱱᱚᱢᱵᱚᱨ ᱟᱨ ᱵᱮᱸᱠ ᱯᱮᱢᱮᱱᱴ ᱨᱟᱥᱤᱫ ᱧᱮᱞ ᱢᱮ।",
    btn_track_status: "ᱦᱟᱞᱚᱛ ᱧᱮᱞ ᱢᱮ →",
    tile_book_title: "ᱱᱟᱶᱟ ᱵᱩᱠᱤᱝ ᱟᱨ KYC",
    tile_book_desc: "ᱪᱟᱥ ᱟᱨᱡᱟᱣ ᱞᱟᱹᱭ ᱢᱮ, ᱩᱯᱨᱩᱢ ᱯᱚᱨᱠᱷᱟᱣ ᱢᱮ ᱟᱨ ᱰᱤᱡᱤᱴᱟᱞ ᱯᱟᱥ ᱦᱟᱛᱟᱣ ᱢᱮ।",
    btn_new_booking: "ᱱᱟᱶᱟ ᱥᱞᱳᱴ ᱵᱩᱠ ᱢᱮ →",
    booking_breadcrumb: "APMC ᱥᱞᱳᱴ ᱵᱩᱠᱤᱝ ᱟᱨ ᱪᱟᱥ ᱜᱷᱳᱥᱬᱟ",
    form_title: "ᱪᱟᱥ ᱟᱹᱠᱷᱨᱤᱧ ᱥᱞᱳᱴ ᱵᱩᱠ ᱢᱮ",
    form_sub: "ᱰᱤᱡᱤᱴᱟᱞ ᱴᱳᱠᱮᱱ ᱧᱟᱢ ᱞᱟᱹᱜᱤᱫ ᱪᱟᱥ ᱵᱤᱵᱚᱨᱚᱱ ᱮᱢ ᱢᱮ।",
    kyc_step: "ᱫᱷᱟᱯ ᱑: ᱪᱟᱹᱥᱤ ᱩᱯᱨᱩᱢ ᱯᱚᱨᱠᱷᱟᱣ",
    kyc_desc: "ᱥᱚᱨᱠᱟᱨᱤ ᱨᱮᱠᱚᱨᱰ ᱥᱟᱶ ᱢᱤᱞᱟᱹᱣ ᱞᱟᱹᱜᱤᱫ ᱪᱟᱹᱥᱤ ID ᱮᱢ ᱢᱮ।",
    btn_verify_id: "ID ᱯᱚᱨᱠᱷᱟᱣ ᱢᱮ",
    lbl_name: "᱑. ᱪᱟᱹᱥᱤᱭᱟᱜ ᱯᱩᱨᱟᱹ ᱧᱩᱛᱩᱢ",
    lbl_phone: "᱒. ᱢᱳᱵᱟᱭᱤᱞ ᱱᱚᱢᱵᱚᱨ",
    lbl_village: "᱓. ᱟᱹᱛᱩ / ᱵᱞᱚᱠ",
    lbl_centre: "᱔. ᱪᱟᱥ ᱠᱤᱨᱤᱧ ᱛᱟᱞᱢᱟ",
    lbl_crop: "᱕. ᱪᱟᱥ ᱨᱮᱱᱟᱜ ᱞᱮᱠᱟᱱ",
    lbl_qty: "᱖. ᱪᱟᱥ ᱯᱚᱨᱤᱢᱟᱬ (ᱠᱩᱣᱤᱱᱴᱟᱞ)",
    lbl_slot: "᱗. ᱢᱟᱱᱰᱤ ᱦᱤᱡᱩᱜ ᱚᱠᱛᱚ",
    btn_generate_pass: "ᱰᱤᱡᱤᱴᱟᱞ ᱯᱟᱥ ᱵᱮᱱᱟᱣ ᱢᱮ",
    pass_title: "ᱥᱟᱹᱛ ᱟᱠᱟᱱ ᱰᱤᱡᱤᱴᱟᱞ ᱯᱟᱥ",
    pass_sub: "ᱛᱩᱞᱟᱹ ᱢᱟᱥᱤᱱ ᱥᱟᱶ ᱡᱚᱲᱟᱣ ᱢᱮᱱᱟᱜ-ᱟ।",
    officer_title: "ᱠᱤᱨᱤᱧ ᱛᱟᱞᱢᱟ ᱰᱮᱥᱵᱳᱨᱰ",
    officer_sub: "ᱫᱷᱟᱹᱲ, ᱛᱩᱞᱟᱹ ᱟᱨ ᱴᱟᱠᱟ ᱵᱷᱮᱡᱟᱣ ᱪᱟᱪᱞᱟᱣ ᱢᱮ।",
    metric_total: "ᱛᱮᱦᱮᱧ ᱨᱤᱱ ᱡᱚᱛᱚ",
    metric_line: "ᱫᱷᱟᱹᱲ ᱨᱮ ᱢᱮᱱᱟᱜ ᱠᱚ",
    metric_bridge: "ᱛᱩᱞᱟᱹ ᱨᱮ",
    metric_done: "ᱯᱩᱨᱟᱹᱣ ᱮᱱᱟ",
    yard_cap: "ᱢᱟᱱᱰᱤ ᱥᱟᱢᱵᱽᱲᱟᱣ ᱫᱟᱲᱮ",
    weigh_counters: "ᱛᱩᱞᱟᱹ ᱠᱟᱣᱩᱱᱴᱟᱨ",
    arrival_queue: "ᱦᱤᱡᱩᱜ ᱫᱷᱟᱹᱲ",
    brand_tagline: "ᱵᱷᱟᱨᱚᱛ ᱡᱟᱠᱟᱛ ᱨᱮ ᱪᱟᱹᱥᱤ ᱠᱚ ᱞᱟᱹᱜᱤᱫ ᱥᱚᱡᱷᱮ ᱵᱮᱸᱠ ᱠᱷᱟᱛᱟ ᱨᱮ MSP ᱴᱟᱠᱟ",
    login_note: "<strong>ᱩᱪᱷᱟᱹᱱ:</strong> ᱪᱟᱹᱥᱤ ᱠᱚ ᱚᱲᱟᱜ ᱨᱮ ᱫᱩᱲᱩᱵ ᱠᱟᱛᱮ ᱰᱤᱡᱤᱴᱟᱞ ᱴᱳᱠᱮᱱ ᱠᱚ ᱵᱮᱱᱟᱣ ᱫᱟᱲᱮᱭᱟᱜ-ᱟ।",
    btn_weighbridge_bay: "ᱛᱩᱞᱟᱹ ᱢᱟᱥᱤᱱ",
    btn_quality_assayer: "ᱜᱩᱱ ᱯᱚᱨᱠᱷᱟᱣᱤᱡ",
    btn_helpdesk: "ᱛᱩᱞᱟᱹ ᱢᱟᱥᱤᱱ"
  },

  // 8. BODO
  brx: {
    tagline: "गाहाय खौसेथि APMC आबाद फाननाय पर्टेल",
    btn_home: "गाहाय बिलाइ",
    gov_badge: "आबाद आरो आबादारि मोजां मोनथाय मन्त्रालय • भारत सरकार",
    hero_title: "गाहाय खौसेथि आबाद मन्डि गेटवे आरो कन्ट्रोल टार्मिनियेल",
    hero_sub: "आबादारिफोरनि थाखाय दिजितेल फाननाय, रोखा सारि आरो थोंजों बेङ्क खाथायाव MSP रां",
    pill_public: "गासैबो सुबुंनि थाखाय",
    title_citizen: "आबादारि पर्टेल",
    desc_citizen: "आबादारि सिनायथि नायबिजिरनाय, दिजितेल पास आरो थोंजों DBT बेङ्क पेमेन्ट।",
    btn_enter_citizen: "आबादारि पर्टेल हाबनो →",
    pill_officer: "अफिसार लगइन",
    title_officer: "मन्डि अफिसार लगइन",
    desc_officer: "थिसनजानाय APMC अफिसार आरो वजन मेसिन सालायग्राफोरनि थाखाय।",
    btn_enter_officer: "अफिसार देस्क हाबनो →",
    login_heading: "गाहाय लगइन (आबादारि सेन्टर)",
    lbl_state: "गावनि राज्यो सायख'",
    lbl_district: "गावनि जिल्ला सायख'",
    district_subtext: "मन्डि सायख'नो थाखाय जिल्ला सायख'नाया गोनांथार।",
    lbl_mobile: "रेजिस्टार खालामनाय मबाइल नम्बर",
    mobile_subtext: "बे नम्बरआव ६ अनजिमानि सरकारी OTP थांगोन।",
    lbl_captcha: "रैखाथि अनजिमा (Captcha)",
    btn_get_otp: "OTP मोननो →",
    otp_title: "OTP कोड सोनाव",
    otp_sent_to: "थाय हरनाय नम्बर:",
    otp_validity: "सम सीमा:",
    lbl_enter_6digit: "६ अनजिमानि OTP लिर",
    btn_verify_continue: "नायबिजिरना साखोन खालाम →",
    btn_change_mobile: "← मबाइल नम्बर सोलाय",
    not_received: "कोड मोनामोन ना?",
    hub_breadcrumb: "आबादारि सुबिदा देसबर्ड",
    welcome_user: "बरायबाय, आबादारि लोगो",
    tile_track_title: "पास आरो सारिनि थासारि",
    tile_track_desc: "गावनि टोकन नम्बर, वजन सारि आरो बेङ्क पेमेन्ट रसिद नाय।",
    btn_track_status: "थासारि नायनो →",
    tile_book_title: "गोदान बुकिं आरो KYC",
    tile_book_desc: "फसलनि बिबरन हो, सिनायथि फोरमान खालाम आरो दिजितेल पास ला।",
    btn_new_booking: "गोदान स्ल'ट बुक खालाम →",
    booking_breadcrumb: "मन्डि स्ल'ट बुकिं आरो फसल फोसावनाय",
    form_title: "फसल फाननाय स्ल'ट बुक खालाम",
    form_sub: "दिजितेल टोकन मोननो थाखाय फसलनि बिबरन सोनाव।",
    kyc_step: "खोन्दो १: आबादारि सिनायथि नायबिजिरनाय",
    kyc_desc: "सरकारी रेकर्डजों मिलायनो आबादारि ID हो।",
    btn_verify_id: "ID नायबिजिर",
    lbl_name: "१. आबादारिनि आबुं मुं",
    lbl_phone: "२. मबाइल नम्बर",
    lbl_village: "३. गामि / ब्लक",
    lbl_centre: "४. फसल बायग्रा मन्डि",
    lbl_crop: "५. फसलनि रोखोम",
    lbl_qty: "६. फसलनि बिबां (कुइन्टल)",
    lbl_slot: "७. मन्डिसिम फैनाय सम",
    btn_generate_pass: "दिजितेल पास बानाय",
    pass_title: "सक्रिय दिजितेल पास",
    pass_sub: "वजन मेसिनजों थोंजों फोनांजाबनाय।",
    officer_title: "मन्डि मेनेजमेन्ट देसबर्ड",
    officer_sub: "सारि, वजन आरो पेमेन्ट सालाय।",
    metric_total: "दिनैनि गासै",
    metric_line: "सारियाव नेनाय",
    metric_bridge: "वजन मेसिनाव",
    metric_done: "फोजोबबाय",
    yard_cap: "मन्डिनि गोहो",
    weigh_counters: "वजन काउन्टार",
    arrival_queue: "फैनाय सारि",
    brand_tagline: "गासै भारताव रोखा खायदाजों आबादारिफोरनो थोंजों बेङ्क खाथायाव रां होसिंलांनाय",
    login_note: "<strong>फोसावनाय:</strong> आबादारिफोरा न'आव थानि थानिनो दिजितेल टोकन बुकिं खालामनो हागोन।",
    btn_weighbridge_bay: "वजन मेसिन",
    btn_quality_assayer: "गुण नायबिजिरग्रा",
    btn_helpdesk: "मन्डि सुबिदा देसबर्ड",
  },

  // 9. MAITHILI
  mai: {
    tagline: "राष्ट्रीय एकीकृत कृषि उपज मंडी खरीद पोर्टल",
    btn_home: "मुख्य पृष्ठ",
    gov_badge: "कृषि एवं किसान कल्याण मंत्रालय • भारत सरकार",
    hero_title: "एकीकृत राष्ट्रीय कृषि मंडी गेटवे एवं नियंत्रण टर्मिनल",
    hero_sub: "मिथिलांचल सहित संपूर्ण भारतक किसानक लेल डिजिटल खरीद, पारदर्शी कतार एवं सोझे बैंक खाता मे MSP",
    pill_public: "सार्वजनिक प्रवेश",
    title_citizen: "किसान सेवा पोर्टल",
    desc_citizen: "किसान पहचान सत्यापन, डिजिटल वजनकाँटा टोकन, लाइव कतार एवं प्रत्यक्ष DBT बैंक भुगतान।",
    btn_enter_citizen: "किसान पोर्टल खोलू →",
    pill_officer: "अधिकारी लॉगिन",
    title_officer: "मंडी अधिकारी लॉगिन",
    desc_officer: "अधिकृत APMC सचिव, वजनकाँटा ऑपरेटर एवं गुणवत्ता निरीक्षकक लेल।",
    btn_enter_officer: "अधिकारी कंसोल खोलू →",
    login_heading: "आवेदक लॉगिन (किसान सेवा)",
    lbl_state: "अपन राज्य चुनू",
    lbl_district: "अपन जिला चुनू",
    district_subtext: "मंडी चयनक लेल जिला चुनब आवश्यक अछि।",
    lbl_mobile: "पंजीकृत मोबाइल नंबर",
    mobile_subtext: "एहि नंबर पर ६-अंकक सरकारी OTP पठायल जायत।",
    lbl_captcha: "सुरक्षा कोड (कैप्चा)",
    btn_get_otp: "OTP प्राप्त करू →",
    otp_title: "OTP कोड दर्ज करू",
    otp_sent_to: "पठायल नंबर:",
    otp_validity: "समय सीमा:",
    lbl_enter_6digit: "६-अंकक OTP लिखू",
    btn_verify_continue: "सत्यापित कऽ आगू बढ़ू →",
    btn_change_mobile: "← मोबाइल नंबर बदलू",
    not_received: "कोड नहि भेटल?",
    hub_breadcrumb: "किसान सेवा केंद्र",
    welcome_user: "स्वागत अछि, सत्यापित किसान बंधु",
    tile_track_title: "टोकन एवं कतार स्थिति देखू",
    tile_track_desc: "अपन टोकन नंबर, वजनकाँटा कतार एवं बैंक भुगतान रसीदक स्थिति देखू।",
    btn_track_status: "स्थिति देखू →",
    tile_book_title: "नव बुकिंग एवं किसान KYC",
    tile_book_desc: "फसलक विवरण दर्ज करू, पहचान पत्र सत्यापित करू एवं नव डिजिटल मंडी पास प्राप्त करू।",
    btn_new_booking: "नव स्लॉट बुक करू →",
    booking_breadcrumb: "मंडी स्लॉट बुकिंग एवं फसल घोषणा",
    form_title: "फसल बिक्री लेल स्लॉट बुक करू",
    form_sub: "डिजिटल कतार टोकन लेल फसलक विवरण भरू।",
    kyc_step: "चरण १: किसान पहचान सत्यापन",
    kyc_desc: "सरकारी डेटाबेस सं विवरण भरय लेल किसान आईडी भरू।",
    btn_verify_id: "आईडी सत्यापित करू",
    lbl_name: "१. किसानक पूरा नाम",
    lbl_phone: "२. मोबाइल नंबर",
    lbl_village: "३. गाम / प्रखंड / ब्लॉक",
    lbl_centre: "४. खरीद केंद्र (मंडी)",
    lbl_crop: "५. फसलक प्रकार",
    lbl_qty: "६. फसलक मात्रा (क्विंटल)",
    lbl_slot: "७. मंडी अएबाक समय",
    btn_generate_pass: "डिजिटल पास बनाउ",
    pass_title: "सक्रिय डिजिटल पास",
    pass_sub: "लाइव वजनकाँटा संग सीधे जुड़ल।",
    officer_title: "मंडी प्रबंधन कंसोल",
    officer_sub: "कतार, वजनकाँटा एवं भुगतानक प्रबंधन करू।",
    metric_total: "आइक कुल किसान",
    metric_line: "कतार मे प्रतीक्षारत",
    metric_bridge: "काँटा पर",
    metric_done: "खरीद पूर्ण",
    yard_cap: "मंडीक क्षमता",
    weigh_counters: "सक्रिय वजनकाँटा",
    arrival_queue: "आगमन कतार",
    brand_tagline: "संपूर्ण भारत मे किसानक बैंक खाता मे सोझे समर्थन मूल्यक अंतरण",
    login_note: "<strong>सूचना:</strong> किसान घर बैसि अपन फसलक लेल डिजिटल टोकन बुक कऽ सकैत छथि।",
    btn_weighbridge_bay: "वजनकाँटा यार्ड",
    btn_quality_assayer: "गुणवत्ता निरीक्षक",
    btn_helpdesk: "मंडी सहायता केंद्र"
  },

  // 10. PUNJABI
  pa: {
    tagline: "ਕੌਮੀ ਏਕੀਕ੍ਰਿਤ ਖੇਤੀਬਾੜੀ ਮੰਡੀ (APMC) ਖਰੀਦ ਪੋਰਟਲ",
    btn_home: "ਮੁੱਖ ਸਫ਼ਾ",
    gov_badge: "ਖੇਤੀਬਾੜੀ ਅਤੇ ਕਿਸਾਨ ਭਲਾਈ ਮੰਤਰਾਲਾ • ਭਾਰਤ ਸਰਕਾਰ",
    hero_title: "ਕੌਮੀ ਅਨਾਜ ਮੰਡੀ ਗੇਟਵੇਅ ਅਤੇ ਕੰਟਰੋਲ ਟਰਮੀਨਲ",
    hero_sub: "ਕਿਸਾਨਾਂ ਲਈ ਡਿਜੀਟਲ ਖਰੀਦ, ਪਾਰਦਰਸ਼ੀ ਤੋਲ ਕਤਾਰ ਅਤੇ ਸਿੱਧੀ ਐੱਮ.ਐੱਸ.ਪੀ. ਬੈਂਕ ਅਦਾਇਗੀ",
    pill_public: "ਆਮ ਜਨਤਕ ਪਹੁੰਚ",
    title_citizen: "ਕਿਸਾਨ ਸੇਵਾ ਪੋਰਟਲ",
    desc_citizen: "ਪਛਾਣ ਤਸਦੀਕ, ਡਿਜੀਟਲ ਮੰਡੀ ਪਰਚੀ, ਲਾਈਵ ਕੰਡਾ ਕਤਾਰ ਅਤੇ ਸਿੱਧੀ ਖਾਤਾ ਅਦਾਇਗੀ।",
    btn_enter_citizen: "ਕਿਸਾਨ ਪੋਰਟਲ ਦਾਖਲ ਹੋਵੋ →",
    pill_officer: "ਅਧਿਕਾਰਤ ਅਫ਼ਸਰ ਲਾਗਇਨ",
    title_officer: "ਮੰਡੀ ਅਫ਼ਸਰ ਲਾਗਇਨ",
    desc_officer: "ਮਾਰਕੀਟ ਕਮੇਟੀ ਸਕੱਤਰ, ਕੰਡਾ ਓਪਰੇਟਰ ਅਤੇ ਕੁਆਲਿਟੀ ਇੰਸਪੈਕਟਰਾਂ ਲਈ।",
    btn_enter_officer: "ਅਫ਼ਸਰ ਡੈਸਕ ਖੋਲ੍ਹੋ →",
    login_heading: "ਕਿਸਾਨ ਲਾਗਇਨ (ਅਨਾਜ ਖਰੀਦ)",
    lbl_state: "ਆਪਣਾ ਸੂਬਾ ਚੁਣੋ",
    lbl_district: "ਆਪਣਾ ਜ਼ਿਲ੍ਹਾ ਚੁਣੋ",
    district_subtext: "ਮੰਡੀ ਨਿਰਧਾਰਨ ਲਈ ਜ਼ਿਲ੍ਹਾ ਚੁਣਨਾ ਲਾਜ਼ਮੀ ਹੈ।",
    lbl_mobile: "ਰਜਿਸਟਰਡ ਮੋਬਾਈਲ ਨੰਬਰ",
    mobile_subtext: "ਇਸ ਨੰਬਰ ਉੱਤੇ 6 ਅੰਕਾਂ ਦਾ ਅਧਿਕਾਰਤ OTP ਭੇਜਿਆ ਜਾਵੇਗਾ।",
    lbl_captcha: "ਸੁਰੱਖਿਆ ਕੋਡ (ਕੈਪਚਾ)",
    btn_get_otp: "OTP ਪ੍ਰਾਪਤ ਕਰੋ →",
    otp_title: "OTP ਕੋਡ ਦਰਜ ਕਰੋ",
    otp_sent_to: "ਭੇਜਿਆ ਗਿਆ ਮੋਬਾਈਲ:",
    otp_validity: "ਮਿਆਦ:",
    lbl_enter_6digit: "6 ਅੰਕਾਂ ਵਾਲਾ OTP ਦਰਜ ਕਰੋ",
    btn_verify_continue: "ਤਸਦੀਕ ਕਰੋ ਅਤੇ ਅੱਗੇ ਵਧੋ →",
    btn_change_mobile: "← ਮੋਬਾਈਲ ਨੰਬਰ ਬਦਲੋ",
    not_received: "ਕੋਡ ਨਹੀਂ ਮਿਲਿਆ?",
    hub_breadcrumb: "ਕਿਸਾਨ ਸੁਵਿਧਾ ਕੇਂਦਰ",
    welcome_user: "ਜੀ ਆਇਆਂ ਨੂੰ, ਤਸਦੀਕਸ਼ੁਦਾ ਕਿਸਾਨ",
    tile_track_title: "ਪਰਚੀ ਅਤੇ ਕਤਾਰ ਸਥਿਤੀ ਦੇਖੋ",
    tile_track_desc: "ਆਪਣੀ ਮੌਜੂਦਾ ਬੁਕਿੰਗ, ਕੰਡਾ ਨੰਬਰ ਅਤੇ ਬੈਂਕ ਅਦਾਇਗੀ ਰਸੀਦ ਦੀ ਜਾਂਚ ਕਰੋ।",
    btn_track_status: "ਸਥਿਤੀ ਜਾਂਚੋ →",
    tile_book_title: "ਨਵੀਂ ਬੁਕਿੰਗ ਅਤੇ ਕੇ.ਵਾਈ.ਸੀ.",
    tile_book_desc: "ਫ਼ਸਲ ਦਾ ਵੇਰਵਾ ਦਰਜ ਕਰੋ, ਦਸਤਾਵੇਜ਼ ਤਸਦੀਕ ਕਰੋ ਅਤੇ ਨਵੀਂ ਮੰਡੀ ਪਰਚੀ ਲਵੋ।",
    btn_new_booking: "ਨਵਾਂ ਸਲਾਟ ਬੁੱਕ ਕਰੋ →",
    booking_breadcrumb: "ਮੰਡੀ ਸਲਾਟ ਬੁਕਿੰਗ ਅਤੇ ਫ਼ਸਲ ਘੋਸ਼ਣਾ",
    form_title: "ਫ਼ਸਲ ਵਿਕਰੀ ਸਲਾਟ ਬੁੱਕ ਕਰੋ",
    form_sub: "ਤੋਲ ਕਤਾਰ ਵਿੱਚ ਸ਼ਾਮਲ ਹੋਣ ਲਈ ਫ਼ਸਲ ਵੇਰਵੇ ਦਰਜ ਕਰੋ।",
    kyc_step: "ਪੜਾਅ 1: ਕਿਸਾਨ ਪਛਾਣ ਤਸਦੀਕ",
    kyc_desc: "ਸਰਕਾਰੀ ਰਿਕਾਰਡ ਨਾਲ ਮੇਲ ਕਰਨ ਲਈ ਕਿਸਾਨ ਆਈਡੀ ਦਰਜ ਕਰੋ।",
    btn_verify_id: "ਆਈਡੀ ਤਸਦੀਕ ਕਰੋ",
    lbl_name: "1. ਕਿਸਾਨ ਦਾ ਪੂਰਾ ਨਾਂ",
    lbl_phone: "2. ਮੋਬਾਈਲ ਨੰਬਰ",
    lbl_village: "3. ਪਿੰਡ / ਬਲਾਕ / ਤਹਿਸੀਲ",
    lbl_centre: "4. ਖਰੀਦ ਕੇਂਦਰ (ਮੰਡੀ ਯਾਰਡ)",
    lbl_crop: "5. ਫ਼ਸਲ ਦੀ ਕਿਸਮ",
    lbl_qty: "6. ਕੁੱਲ ਅਨਾਜ (ਕੁਇੰਟਲ)",
    lbl_slot: "7. ਮੰਡੀ ਪਹੁੰਚਣ ਦਾ ਸਮਾਂ",
    btn_generate_pass: "ਮੰਡੀ ਪਰਚੀ ਬਣਾਓ",
    pass_title: "ਡਿਜੀਟਲ ਮੰਡੀ ਪਰਚੀ",
    pass_sub: "ਲਾਈਵ ਕੰਡਾ ਕਾਊਂਟਰ ਨਾਲ ਜੁੜਿਆ ਹੋਇਆ।",
    officer_title: "ਮੰਡੀ ਪ੍ਰਬੰਧਕੀ ਕੰਸੋਲ",
    officer_sub: "ਕਤਾਰਾਂ, ਕੰਡਾ ਰਿਕਾਰਡ ਅਤੇ ਅਦਾਇਗੀਆਂ ਦੀ ਨਿਗਰਾਨੀ ਕਰੋ।",
    metric_total: "ਕੁੱਲ ਕਿਸਾਨ",
    metric_line: "ਕਤਾਰ ਵਿੱਚ",
    metric_bridge: "ਕੰਡੇ ਉੱਤੇ",
    metric_done: "ਖਰੀਦ ਮੁਕੰਮਲ",
    yard_cap: "ਮੰਡੀ ਸਮਰੱਥਾ",
    weigh_counters: "ਲਾਈਵ ਕੰਡਾ ਕਾਊਂਟਰ",
    arrival_queue: "ਆਮਦ ਕਤਾਰ",
    brand_tagline: "ਦੇਸ਼ ਭਰ ਦੀਆਂ ਮੰਡੀਆਂ ਵਿੱਚ ਪਾਰਦਰਸ਼ੀ ਖਰੀਦ ਅਤੇ ਕਿਸਾਨਾਂ ਦੇ ਖਾਤੇ ਵਿੱਚ ਸਿੱਧੀ ਅਦਾਇਗੀ",
    login_note: "<strong>ਸਲਾਹ:</strong> ਕਿਸਾਨ ਆਪਣੀ ਫ਼ਸਲ ਲਿਆਉਣ ਤੋਂ ਪਹਿਲਾਂ ਇੱਥੇ ਡਿਜੀਟਲ ਟੋਕਨ ਬੁੱਕ ਕਰ ਸਕਦੇ ਹਨ।",
    btn_weighbridge_bay: "ਕੰਡਾ ਯਾਰਡ",
    btn_quality_assayer: "ਗੁਣਵੱਤਾ ਪਰਖ ਅਫ਼ਸਰ",
    btn_helpdesk: "ਮੰਡੀ ਸਹਾਯ ਕੇਂਦਰ"
  },

  // 11. MARATHI
  mr: {
    tagline: "राष्ट्रीय एकात्मिक कृषी उत्पन्न बाजार समिती (APMC) खरेदी पोर्टल",
    btn_home: "मुख्य पृष्ठ",
    gov_badge: "कृषी व शेतकरी कल्याण मंत्रालय • भारत सरकार",
    hero_title: "एकात्मिक राष्ट्रीय कृषी बाजारपेठ नियंत्रण कक्ष",
    hero_sub: "शेतकऱ्यांसाठी डिजिटल शेतमाल खरेदी, पारदर्शक वजनकाटा रांग व थेट बँक खात्यात हमीभाव जमा",
    pill_public: "सार्वजनिक प्रवेश",
    title_citizen: "शेतकरी सेवा पोर्टल",
    desc_citizen: "शेतकरी ओळख पडताळणी, डिजिटल वजनकाटा पास, थेट रांग ट्रॅकिंग आणि हमीभाव (MSP) बँक जमा.",
    btn_enter_citizen: "शेतकरी पोर्टल उघडा →",
    pill_officer: "अधिकृत अधिकारी लॉगिन",
    title_officer: "बाजार समिती अधिकारी लॉगिन",
    desc_officer: "अधिकृत APMC सचिव, वजनकाटा ऑपरेटर व प्रतवारी तपासणी अधिकाऱ्यांसाठी.",
    btn_enter_officer: "अधिकारी डेस्क उघडा →",
    login_heading: "शेतकरी नोंदणी व लॉगिन",
    lbl_state: "आपले राज्य निवडा",
    lbl_district: "आपला जिल्हा निवडा",
    district_subtext: "मार्केट यार्ड निवडीसाठी जिल्ह्याची निवड आवश्यक आहे.",
    lbl_mobile: "नोंदणीकृत मोबाईल नंबर",
    mobile_subtext: "या नंबरवर ६-अंकी अधिकृत पडताळणी OTP पाठवला जाईल.",
    lbl_captcha: "सुरक्षा कोड (कॅप्चा)",
    btn_get_otp: "OTP मिळवा →",
    otp_title: "OTP कोड प्रविष्ट करा",
    otp_sent_to: "पाठवलेला नंबर:",
    otp_validity: "कालावधी:",
    lbl_enter_6digit: "६-अंकी OTP टाका",
    btn_verify_continue: "पडताळणी करा आणि पुढे जा →",
    btn_change_mobile: "← मोबाईल नंबर बदला",
    not_received: "कोड आला नाही?",
    hub_breadcrumb: "शेतकरी सेवा केंद्र",
    welcome_user: "स्वागत आहे, शेतकरी बांधव",
    tile_track_title: "नोंदणी व पास स्थिती तपासा",
    tile_track_desc: "आपला चालू टोकन क्रमांक, वजनकाटा रांग आणि हमीभाव बँक जमा पावती तपासा.",
    btn_track_status: "स्थिती तपासा →",
    tile_book_title: "नवीन शेतमाल नोंदणी व KYC",
    tile_book_desc: "पिकाचा तपशील नोंदवा, ओळख पडताळा व नवीन डिजिटल वजन पावती मिळवा.",
    btn_new_booking: "नवीन स्लॉट बुक करा →",
    booking_breadcrumb: "APMC शेतमाल नोंदणी व स्लॉट बुकिंग",
    form_title: "शेतमाल विक्री स्लॉट बुक करा",
    form_sub: "वजनकाटा रांगेत नंबर लावण्यासाठी पिकाचा तपशील नोंदवा.",
    kyc_step: "टप्पा १: शेतकरी ओळख पडताळणी",
    kyc_desc: "सरकारी नोंदीनुसार तपशील भरण्यासाठी किसान आयडी प्रविष्ट करा.",
    btn_verify_id: "आयडी तपासा",
    lbl_name: "१. शेतकऱ्याचे संपूर्ण नाव",
    lbl_phone: "२. मोबाईल नंबर",
    lbl_village: "३. गाव / तालुका / ब्लॉक",
    lbl_centre: "४. खरेदी केंद्र (बाजार समिती)",
    lbl_crop: "५. पिकाचा प्रकार",
    lbl_qty: "६. अंदाजे प्रमाण (क्विंटल)",
    lbl_slot: "७. येण्याची वेळ",
    btn_generate_pass: "डिजिटल पास तयार करा",
    pass_title: "सक्रिय डिजिटल पास",
    pass_sub: "थेट वजनकाटा प्रणालीशी जोडलेला टोकन.",
    officer_title: "बाजार समिती व्यवस्थापन कक्ष",
    officer_sub: "रांगांचे व्यवस्थापन, वजन नोंद आणि हमीभाव हस्तांतरण.",
    metric_total: "आज एकूण शेतकरी",
    metric_line: "रांगेत प्रतीक्षेत",
    metric_bridge: "काट्यावर चालू",
    metric_done: "खरेदी पूर्ण",
    yard_cap: "मार्केट यार्ड क्षमता",
    weigh_counters: "सक्रिय वजनकाटे",
    arrival_queue: "आवक रांग",
    brand_tagline: "सर्व बाजार समित्यांमध्ये पारदर्शक व्यवहार आणि थेट बँक खात्यात मोबदला",
    login_note: "<strong>सूचना:</strong> शेतकरी घरबसल्या आपल्या शेतमालासाठी डिजिटल टोकन नोंदवू शकतात.",
    btn_weighbridge_bay: "वजनकाटा कक्ष",
    btn_quality_assayer: "प्रतवारी तपासणी",
    btn_helpdesk: "बाजार समिती मदत कक्ष"
  },

  // 12. GUJARATI
  gu: {
    tagline: "રાષ્ટ્રીય સંકલિત ખેતીવાડી ઉત્પન્ન બજાર સમિતિ (APMC) ખરીદ પોર્ટલ",
    btn_home: "મુખ્ય પૃષ્ઠ",
    gov_badge: "કૃષિ અને ખેડૂત કલ્યાણ મંત્રાલય • ભારત સરકાર",
    hero_title: "રાષ્ટ્રીય કૃષિ માર્કેટિંગ યાર્ડ નિયંત્રણ કેન્દ્ર",
    hero_sub: "ખેડૂતો માટે ડિજિટલ ખરીદી, પારદર્શક વજનકાંટો કતાર અને સીધા બેંક ખાતામાં ટેકાના ભાવની ચૂકવણી",
    pill_public: "ખેડૂત પ્રવેશ",
    title_citizen: "ખેડૂત સેવા પોર્ટલ",
    desc_citizen: "ખેડૂત ઓળખ ચકાસણી, ડિજિટલ મંડી પાસ, લાઈવ વજનકાંટો કતાર અને સીધા ખાતામાં MSP જમા.",
    btn_enter_citizen: "ખેડૂત પોર્ટલ ખોલો →",
    pill_officer: "અધિકારી લૉગિન",
    title_officer: "માર્કેટ યાર્ડ અધિકારી લૉગિન",
    desc_officer: "અધિકૃત APMC સેક્રેટરી, વજનકાંટો ઓપરેટર અને ગુણવત્તા નિરીક્ષકો માટે.",
    btn_enter_officer: "અધિકારી ડેસ્ક ખોલો →",
    login_heading: "ખેડૂત લૉગિન (મંડી સેવા)",
    lbl_state: "તમારું રાજ્ય પસંદ કરો",
    lbl_district: "તમારો જિલ્લો પસંદ કરો",
    district_subtext: "માર્કેટ યાર્ડ નિર્ધારણ માટે જિલ્લો પસંદ કરવો ફરજિયાત છે.",
    lbl_mobile: "નોંધાયેલ મોબાઈલ નંબર",
    mobile_subtext: "આ નંબર પર 6-અંકનો સત્તાવાર ચકાસણી OTP મોકલવામાં આવશે.",
    lbl_captcha: "સુરક્ષા કોડ (કેપ્ચા)",
    btn_get_otp: "OTP મેળવો →",
    otp_title: "OTP કોડ દાખલ કરો",
    otp_sent_to: "મોકલેલ નંબર:",
    otp_validity: "સમયગાળો:",
    lbl_enter_6digit: "6-અંકનો OTP લખો",
    btn_verify_continue: "ચકાસો અને આગળ વધો →",
    btn_change_mobile: "← મોબાઈલ નંબર બદલો",
    not_received: "કોડ નથી મળ્યો?",
    hub_breadcrumb: "ખેડૂત સેવા કેન્દ્ર",
    welcome_user: "સ્વાગત છે, ખેડૂત મિત્ર",
    tile_track_title: "પાસ અને કતાર સ્થિતિ તપાસો",
    tile_track_desc: "તમારું વર્તમાન ટોકન, વજનકાંટો નંબર અને બેંક ચુકવણીની રસીદ જુઓ.",
    btn_track_status: "સ્થિતિ જુઓ →",
    tile_book_title: "નવી નોંધણી અને KYC",
    tile_book_desc: "પાકની વિગત નોંધો, ઓળખપત્ર ચકાસો અને નવી ડિજિટલ મંડી પહોંચ મેળવો.",
    btn_new_booking: "નવો સ્લોટ બુક કરો →",
    booking_breadcrumb: "APMC સ્લોટ બુકિંગ અને પાક નોંધણી",
    form_title: "પાક વેચાણ સ્લોટ બુક કરો",
    form_sub: "વજનકાંટો કતારમાં નંબર મેળવવા માટે પાકની વિગત નોંધો.",
    kyc_step: "પગલું ૧: ખેડૂત ઓળખ ચકાસણી",
    kyc_desc: "સરકારી વિગતો મેળવવા માટે માન્ય કિસાન આઈડી દાખલ કરો.",
    btn_verify_id: "આઈડી ચકાસો",
    lbl_name: "૧. ખેડૂતનું પૂરું નામ",
    lbl_phone: "૨. મોબાઈલ નંબર",
    lbl_village: "૩. ગામ / તાલુકો / બ્લોક",
    lbl_centre: "૪. ખરીદ કેન્દ્ર (માર્કેટ યાર્ડ)",
    lbl_crop: "૫. પાકનો પ્રકાર",
    lbl_qty: "૬. પાકનો જથ્થો (ક્વિન્ટલ)",
    lbl_slot: "૭. આવવાનો સમય",
    btn_generate_pass: "ડિજિટલ પાસ બનાવો",
    pass_title: "સક્રિય ડિજિટલ પાસ",
    pass_sub: "લાઈવ વજનકાંટો સિસ્ટમ સાથે જોડાયેલ.",
    officer_title: "યાર્ડ સંચાલન કન્સોલ",
    officer_sub: "કતાર વ્યવસ્થાપન, વજન નોંધણી અને ટેકાના ભાવની ચુકવણીનું સંચાલન.",
    metric_total: "આજના કુલ ખેડૂતો",
    metric_line: "કતારમાં રાહ જોઈ રહ્યા છે",
    metric_bridge: "વજનકાંટા પર",
    metric_done: "ખરીદી સંપન્ન",
    yard_cap: "યાર્ડ ક્ષમતા",
    weigh_counters: "સક્રિય વજનકાંટા",
    arrival_queue: "આવક કતાર",
    brand_tagline: "તમામ માર્કેટિંગ યાર્ડમાં પારદર્શક વહીવટ અને ખેડૂતોને ત્વરિત ચૂકવણી",
    login_note: "<strong>સલાહ:</strong> ખેડૂતો મુશ્કેલી વિના વેચાણ કરવા માટે અગાઉથી ડિજિટલ સ્લોટ બુક કરી શકે છે.",
    btn_weighbridge_bay: "વજનકાંટો યાર્ડ",
    btn_quality_assayer: "ગુણવત્તા નિરીક્ષક",
    btn_helpdesk: "માર્કેટ યાર્ડ હેલ્પડેસ્ક"
  },

  // 13. TELUGU
  te: {
    tagline: "జాతీయ సమగ్ర వ్యవసాయ మార్కెట్ కమిటీ (APMC) కొనుగోలు పోర్టల్",
    btn_home: "హోమ్ పేజీ",
    gov_badge: "వ్యవసాయ & రైతు సంక్షేమ మంత్రిత్వ శాఖ • భారత ప్రభుత్వం",
    hero_title: "జాతీయ వ్యవసాయ మార్కెట్ గేట్‌వే & నియంత్రణ కేంద్రం",
    hero_sub: "రైతులకు డిజిటల్ కొనుగోళ్లు, పారదర్శక వేబ్రిడ్జ్ క్యూ మరియు నేరుగా బ్యాంక్ ఖాతాలో MSP జమ",
    pill_public: "రైతు ప్రవేశం",
    title_citizen: "రైతు సేవా పోర్టల్",
    desc_citizen: "రైతు గుర్తింపు ధృవీకరణ, డిజిటల్ టోకెన్, ప్రత్యక్ష వేబ్రిడ్జ్ క్యూ మరియు బ్యాంకులో మద్దతు ధర జమ.",
    btn_enter_citizen: "రైతు పోర్టల్‌లోకి వెళ్ళండి →",
    pill_officer: "అధికారిక లాగిన్",
    title_officer: "మార్కెట్ అధికారి లాగిన్",
    desc_officer: "అధీకృత APMC కార్యదర్శులు, వేబ్రిడ్జ్ ఆపరేటర్లు మరియు నాణ్యత పరిశీలన అధికారుల కోసం.",
    btn_enter_officer: "అధికారి డెస్క్ తెరవండి →",
    login_heading: "రైతు లాగిన్ (మార్కెట్ సేవలు)",
    lbl_state: "మీ రాష్ట్రాన్ని ఎంచుకోండి",
    lbl_district: "మీ జిల్లాను ఎంచుకోండి",
    district_subtext: "మార్కెట్ కేటాయింపు కోసం జిల్లా ఎంపిక తప్పనిసరి.",
    lbl_mobile: "నమోదిత మొబైల్ నంబర్",
    mobile_subtext: "ఈ నంబర్‌కు 6-అంకెల అధికారిక OTP పంపబడుతుంది.",
    lbl_captcha: "భద్రతా కోడ్ (క్యాప్చా)",
    btn_get_otp: "OTP పొందండి →",
    otp_title: "OTP కోడ్‌ను నమోదు చేయండి",
    otp_sent_to: "పంపబడిన నంబర్:",
    otp_validity: "వ్యవధి:",
    lbl_enter_6digit: "6-అంకెల OTP రాయండి",
    btn_verify_continue: "ధృవీకరించి ముందుకు సాగండి →",
    btn_change_mobile: "← మొబైల్ నంబర్ మార్చండి",
    not_received: "కోడ్ రాలేదా?",
    hub_breadcrumb: "రైతు సేవా కేంద్రం",
    welcome_user: "స్వాగతం, ధృవీకరించబడిన రైతు మిత్రమా",
    tile_track_title: "టోకెన్ స్థితిని తనిఖీ చేయండి",
    tile_track_desc: "మీ ప్రస్తుత టోకెన్, ప్రత్యక్ష వేబ్రిడ్జ్ క్యూ నంబర్ మరియు బ్యాంక్ రసీదు వివరాలు చూడండి.",
    btn_track_status: "స్థితిని చూడండి →",
    tile_book_title: "కొత్త బుకింగ్ & KYC నమోదు",
    tile_book_desc: "పంట వివరాలను నమోదు చేయండి, పత్రాలను ధృవీకరించండి మరియు డిజిటల్ పాస్ పొందండి.",
    btn_new_booking: "కొత్త స్లాట్ బుక్ చేయండి →",
    booking_breadcrumb: "మార్కెట్ స్లాట్ బుకింగ్ & పంట వివరాలు",
    form_title: "పంట విక్రయ స్లాట్‌ను బుక్ చేయండి",
    form_sub: "వేబ్రిడ్జ్ క్యూ టోకెన్ పొందడానికి పంట వివరాలను నమోదు చేయండి.",
    kyc_step: "దశ 1: రైతు గుర్తింపు ధృవీకరణ",
    kyc_desc: "ప్రభుత్వ రికార్డులను పొందడానికి మీ రైతు ఐడీని నమోదు చేయండి.",
    btn_verify_id: "ధృవీకరించండి",
    lbl_name: "1. రైతు పూర్తి పేరు",
    lbl_phone: "2. మొబైల్ నంబర్",
    lbl_village: "3. గ్రామం / మండలం / బ్లాక్",
    lbl_centre: "4. కొనుగోలు కేంద్రం (మార్కెట్)",
    lbl_crop: "5. పంట రకం",
    lbl_qty: "6. అంచనా పరిమాణం (క్వింటాళ్ళు)",
    lbl_slot: "7. మార్కెట్‌కు వచ్చే సమయం",
    btn_generate_pass: "డిజిటల్ పాస్ జారీ చేయండి",
    pass_title: "ప్రస్తుత డిజిటల్ పాస్",
    pass_sub: "లైవ్ వేబ్రిడ్జ్ కౌంటర్‌తో అనుసంధానించబడింది.",
    officer_title: "మార్కెట్ నిర్వహణ డ్యాష్‌బోర్డ్",
    officer_sub: "క్యూలు, వేబ్రిడ్జ్ తూకాలు మరియు నిధుల బదిలీని నిర్వహించండి.",
    metric_total: "నేటి మొత్తం రైతులు",
    metric_line: "క్యూలో వేచి ఉన్నారు",
    metric_bridge: "వేబ్రిడ్జ్ వద్ద",
    metric_done: "పూర్తయింది",
    yard_cap: "యార్డ్ సామర్థ్యం",
    weigh_counters: "యాక్టివ్ వేబ్రిడ్జ్ కౌంటర్లు",
    arrival_queue: "రాక క్యూ",
    brand_tagline: "రైతుల ఖాతాల్లోకి నేరుగా కనీస మద్దతు ధర బదిలీ",
    login_note: "<strong>గమనిక:</strong> రైతులు ముందుగానే డిజిటల్ స్లాట్ బుక్ చేసుకుని విక్రయించవచ్చు.",
    btn_weighbridge_bay: "వేబ్రిడ్జ్ బే",
    btn_quality_assayer: "నాణ్యత తనిఖీ అధికారి",
    btn_helpdesk: "మార్కెట్ సహాయ కేంద్రం"
  },

  // 14. TAMIL
  ta: {
    tagline: "தேசிய ஒருங்கிணைந்த வேளாண்மை விற்பனை கூடம் (APMC) கொள்முதல் தளம்",
    btn_home: "முகப்பு",
    gov_badge: "வேளாண்மை மற்றும் உழவர் நல அமைச்சகம் • இந்திய அரசு",
    hero_title: "ஒருங்கிணைந்த தேசிய வேளாண் ஒழுங்குமுறை விற்பனை கூடம்",
    hero_sub: "விவசாயிகளுக்கான டிஜிட்டல் கொள்முதல், எடைமேடை வரிசை மேலாண்மை மற்றும் நேரடி வங்கி பணப்பரிமாற்றம்",
    pill_public: "விவசாயிகள் தளம்",
    title_citizen: "விவசாயி சேவை தளம்",
    desc_citizen: "விவசாயி அடையாள சரிபார்ப்பு, டிஜிட்டல் நுழைவுச் சீட்டு, நேரடி எடைமேடை கண்காணிப்பு மற்றும் MSP வங்கி வரவு.",
    btn_enter_citizen: "விவசாயி தளம் செல்ல →",
    pill_officer: "அலுவலர் உள்நுழைவு",
    title_officer: "மண்டி அலுவலர் தளம்",
    desc_officer: "அங்கீகரிக்கப்பட்ட APMC செயலாளர்கள், எடைமேடை பணியாளர்கள் மற்றும் ஆய்வு அலுவலர்களுக்கானது.",
    btn_enter_officer: "அலுவலர் தளம் திறக்க →",
    login_heading: "விவசாயி உள்நுழைவு",
    lbl_state: "உங்கள் மாநிலத்தைத் தேர்ந்தெடுக்கவும்",
    lbl_district: "உங்கள் மாவட்டத்தைத் தேர்ந்தெடுக்கவும்",
    district_subtext: "சரியான கொள்முதல் நிலையத்தைத் தேர்ந்தெடுக்க மாவட்டம் அவசியம்.",
    lbl_mobile: "பதிவுசெய்த கைபேசி எண்",
    mobile_subtext: "இந்த எண்ணிற்கு 6 இலக்க அதிகாரப்பூர்வ OTP அனுப்பப்படும்.",
    lbl_captcha: "பாதுகாப்பு குறியீடு (Captcha)",
    btn_get_otp: "OTP பெறுக →",
    otp_title: "OTP குறியீட்டை உள்ளிடவும்",
    otp_sent_to: "அனுப்பப்பட்ட எண்:",
    otp_validity: "செல்லுபடியாகும் நேரம்:",
    lbl_enter_6digit: "6 இலக்க OTP ஐ உள்ளிடவும்",
    btn_verify_continue: "சரிபார்த்து தொடரவும் →",
    btn_change_mobile: "← கைபேசி எண்ணை மாற்ற",
    not_received: "குறியீடு வரவில்லையா?",
    hub_breadcrumb: "விவசாயி சேவை மையம்",
    welcome_user: "வணக்கம், சரிபார்க்கப்பட்ட விவசாயி",
    tile_track_title: "டோக்கன் நிலையை அறிய",
    tile_track_desc: "உங்கள் முன்பதிவு, எடைமேடை வரிசை எண் மற்றும் வங்கி பணவரவு ரசீதை சரிபார்க்கவும்.",
    btn_track_status: "நிலையை பார்க்க →",
    tile_book_title: "புதிய முன்பதிவு & KYC",
    tile_book_desc: "விளைபொருள் விவரங்களை பதிவிட்டு, ஆவணங்களை சரிபார்த்து புதிய டோக்கன் பெறவும்.",
    btn_new_booking: "புதிய முன்பதிவு செய்ய →",
    booking_breadcrumb: "கொள்முதல் முன்பதிவு மற்றும் பயிர் அறிவிப்பு",
    form_title: "விற்பனைக்கான முன்பதிவு",
    form_sub: "எடைமேடை டோக்கன் பெற விளைபொருள் விவரங்களை நிரப்பவும்.",
    kyc_step: "படி 1: விவசாயி அடையாள சரிபார்ப்பு",
    kyc_desc: "அரசு ஆவணங்களுடன் சரிபார்க்க உழவர் அடையாள எண்ணை உள்ளிடவும்.",
    btn_verify_id: "சரிபார்க்க",
    lbl_name: "1. விவசாயியின் முழு பெயர்",
    lbl_phone: "2. கைபேசி எண்",
    lbl_village: "3. கிராமம் / தாலுகா",
    lbl_centre: "4. கொள்முதல் நிலையம் (மண்டி)",
    lbl_crop: "5. பயிர் வகை",
    lbl_qty: "6. விளைச்சல் அளவு (குவிண்டால்)",
    lbl_slot: "7. வருகை நேரம்",
    btn_generate_pass: "டிஜிட்டல் டோக்கன் பெற",
    pass_title: "செயலில் உள்ள டோக்கன்",
    pass_sub: "நேரடி எடைமேடை அமைப்போடு இணைக்கப்பட்டுள்ளது.",
    officer_title: "கொள்முதல் நிலைய மேலாண்மை",
    officer_sub: "வரிசை, எடை அளவீடு மற்றும் பணப்பரிமாற்றத்தை கண்காணிக்கவும்.",
    metric_total: "இன்றைய மொத்த விவசாயிகள்",
    metric_line: "வரிசையில் காத்திருப்போர்",
    metric_bridge: "எடைமேடையில்",
    metric_done: "கொள்முதல் முடிந்தது",
    yard_cap: "நிலைய கொள்ளளவு",
    weigh_counters: "செயலில் உள்ள எடைமேடைகள்",
    arrival_queue: "வருகை வரிசை",
    brand_tagline: "விவசாயிகளின் வங்கிக் கணக்கில் நேரடியாக குறைந்தபட்ச ஆதரவு விலை வரவு",
    login_note: "<strong>அறிவுரை:</strong> விவசாயிகள் முன்கூட்டியே டோக்கன் பெற்று சிரமமின்றி விற்பனை செய்யலாம்.",
    btn_weighbridge_bay: "எடைமேடை பிரிவு",
    btn_quality_assayer: "தர பரிசோதகர்",
    btn_helpdesk: "மண்டி உதவி மையம்"
  },

  // 15. KANNADA
  kn: {
    tagline: "ರಾಷ್ಟ್ರೀಯ ಸಂಯೋಜಿತ APMC ಕೃಷಿ ಖರೀದಿ ಪೋರ್ಟಲ್",
    btn_home: "ಮುಖಪುಟ",
    gov_badge: "ಕೃಷಿ ಮತ್ತು ರೈತರ ಕಲ್ಯಾಣ ಸಚಿವಾಲಯ • ಭಾರತ ಸರ್ಕಾರ",
    hero_title: "ರಾಷ್ಟ್ರೀಯ ಕೃಷಿ ಮಾರುಕಟ್ಟೆ ಗೇಟ್‌ವೇ ಮತ್ತು ನಿಯಂತ್ರಣ ಕೇಂದ್ರ",
    hero_sub: "ರೈತರಿಗೆ ಡಿಜಿಟಲ್ ಖರೀದಿ, ಪಾರದರ್ಶಕ ತೂಕದ ಕ್ಯೂ ಮತ್ತು ಬ್ಯಾಂಕ್ ಖಾತೆಗೆ ನೇರ ಎಂಎಸ್‌ಪಿ ಪಾವತಿ",
    pill_public: "ರೈತರ ಪ್ರವೇಶ",
    title_citizen: "ರೈತ ಸೇವಾ ಪೋರ್ಟಲ್",
    desc_citizen: "ರೈತರ ಗುರುತು ಪರಿಶೀಲನೆ, ಡಿಜಿಟಲ್ ಮಂಡಿ ಪಾಸ್, ಲೈವ್ ತೂಕದ ಕ್ಯೂ ಮತ್ತು ನೇರ ಬ್ಯಾಂಕ್ ಜಮೆ.",
    btn_enter_citizen: "ರೈತ ಪೋರ್ಟಲ್ ಪ್ರವೇಶಿಸಿ →",
    pill_officer: "ಅಧಿಕಾರಿ ಲಾಗಿನ್",
    title_officer: "ಮಂಡಿ ಅಧಿಕಾರಿ ಲಾಗಿನ್",
    desc_officer: "ಅಧಿಕೃತ APMC ಕಾರ್ಯದರ್ಶಿಗಳು, ತೂಕದ ಆಪರೇಟರ್‌ಗಳು ಮತ್ತು ತಪಾಸಣಾ ಅಧಿಕಾರಿಗಳಿಗಾಗಿ.",
    btn_enter_officer: "ಅಧಿಕಾರಿ ಕನ್ಸೋಲ್ →",
    login_heading: "ಅರ್ಜಿದಾರರ ಲಾಗಿನ್ (ರೈತ ಸೇವೆ)",
    lbl_state: "ನಿಮ್ಮ ರಾಜ್ಯವನ್ನು ಆಯ್ಕೆಮಾಡಿ",
    lbl_district: "ನಿಮ್ಮ ಜಿಲ್ಲೆಯನ್ನು ಆಯ್ಕೆಮಾಡಿ",
    district_subtext: "ಮಂಡಿ ಹಂಚಿಕೆಗಾಗಿ ಜಿಲ್ಲೆಯ ಆಯ್ಕೆ ಕಡ್ಡಾಯವಾಗಿದೆ.",
    lbl_mobile: "ನೋಂದಾಯಿತ ಮೊಬೈಲ್ ಸಂಖ್ಯೆ",
    mobile_subtext: "ಈ ಸಂಖ್ಯೆಗೆ 6-ಅಂಕಿಯ ಅಧಿಕೃತ ಪರಿಶೀಲನಾ OTP ಕಳುಹಿಸಲಾಗುತ್ತದೆ.",
    lbl_captcha: "ಭದ್ರತಾ ಕೋಡ್ (ಕ್ಯಾಪ್ಚಾ)",
    btn_get_otp: "OTP ಪಡೆಯಿರಿ →",
    otp_title: "OTP ಕೋಡ್ ನಮೂದಿಸಿ",
    otp_sent_to: "ಕಳುಹಿಸಲಾದ ಸಂಖ್ಯೆ:",
    otp_validity: "ಅವಧಿ:",
    lbl_enter_6digit: "6-ಅಂಕಿಯ OTP ಬರೆಯಿರಿ",
    btn_verify_continue: "ಪರಿಶೀಲಿಸಿ ಮತ್ತು ಮುಂದುವರಿಯಿರಿ →",
    btn_change_mobile: "← ಮೊಬೈಲ್ ಸಂಖ್ಯೆ ಬದಲಾಯಿಸಿ",
    not_received: "ಕೋಡ್ ಬಂದಿಲ್ಲವೇ?",
    hub_breadcrumb: "ರೈತ ಸೇವಾ ಡ್ಯಾಶ್‌ಬೋರ್ಡ್",
    welcome_user: "ಸ್ವಾಗತ, ಪರಿಶೀಲಿಸಿದ ರೈತ ಮಿತ್ರರೇ",
    tile_track_title: "ಟೋಕನ್ ಮತ್ತು ಕ್ಯೂ ಸ್ಥಿತಿ",
    tile_track_desc: "ನಿಮ್ಮ ಸಕ್ರಿಯ ಟೋಕನ್, ತೂಕದ ಕ್ಯೂ ಸಂಖ್ಯೆ ಮತ್ತು ಬ್ಯಾಂಕ್ ರಸೀದಿಯನ್ನು ಪರಿಶೀಲಿಸಿ.",
    btn_track_status: "ಸ್ಥಿತಿಯನ್ನು ಪರಿಶೀಲಿಸಿ →",
    tile_book_title: "ಹೊಸ ಬುಕಿಂಗ್ ಮತ್ತು KYC",
    tile_book_desc: "ಬೆಳೆ ವಿವರಗಳನ್ನು ನಮೂದಿಸಿ, ದಾಖಲೆಗಳನ್ನು ಪರಿಶೀಲಿಸಿ ಮತ್ತು ಹೊಸ ಡಿಜಿಟಲ್ ಪಾಸ್ ಪಡೆಯಿರಿ.",
    btn_new_booking: "ಹೊಸ ಸ್ಲಾಟ್ ಕಾಯ್ದಿರಿಸಿ →",
    booking_breadcrumb: "ಮಂಡಿ ಸ್ಲಾಟ್ ಬುಕಿಂಗ್ ಮತ್ತು ಬೆಳೆ ಘೋಷಣೆ",
    form_title: "ಬೆಳೆ ಮಾರಾಟ ಸ್ಲಾಟ್ ಕಾಯ್ದಿರಿಸಿ",
    form_sub: "ತೂಕದ ಕ್ಯೂ ಟೋಕನ್ ಪಡೆಯಲು ಬೆಳೆಯ ವಿವರಗಳನ್ನು ಭರ್ತಿ ಮಾಡಿ.",
    kyc_step: "ಹಂತ 1: ರೈತರ ಗುರುತು ಪರಿಶೀಲನೆ",
    kyc_desc: "ಸರ್ಕಾರಿ ದಾಖಲೆಗಳೊಂದಿಗೆ ಹೊಂದಿಸಲು ರೈತರ ಐಡಿ ನಮೂದಿಸಿ.",
    btn_verify_id: "ಐಡಿ ಪರಿಶೀಲಿಸಿ",
    lbl_name: "1. ರೈತರ ಪೂರ್ಣ ಹೆಸರು",
    lbl_phone: "2. ಮೊಬೈಲ್ ಸಂಖ್ಯೆ",
    lbl_village: "3. ಗ್ರಾಮ / ತಾಲ್ಲೂಕು",
    lbl_centre: "4. ಖರೀದಿ ಕೇಂದ್ರ (ಮಂಡಿ)",
    lbl_crop: "5. ಬೆಳೆ ಪ್ರಕಾರ",
    lbl_qty: "6. ಬೆಳೆ ಪ್ರಮಾಣ (ಕ್ವಿಂಟಾಲ್)",
    lbl_slot: "7. ಮಂಡಿಗೆ ಬರುವ ಸಮಯ",
    btn_generate_pass: "ಡಿಜಿಟಲ್ ಪಾಸ್ ಪಡೆಯಿರಿ",
    pass_title: "ಸಕ್ರಿಯ ಡಿಜಿಟಲ್ ಪಾಸ್",
    pass_sub: "ಲೈವ್ ತೂಕದ ಮಾಪಕಕ್ಕೆ ಸಂಪರ್ಕಗೊಂಡಿದೆ.",
    officer_title: "ಮಂಡಿ ನಿರ್ವಹಣಾ ಕನ್ಸೋಲ್",
    officer_sub: "ಕ್ಯೂಗಳು, ತೂಕ ಮತ್ತು ಹಣ ವರ್ಗಾವಣೆಯನ್ನು ನಿರ್ವಹಿಸಿ.",
    metric_total: "ಇಂದಿನ ಒಟ್ಟು ರೈತರು",
    metric_line: "ಸಾಲಿನಲ್ಲಿ ಕಾಯುತ್ತಿರುವವರು",
    metric_bridge: "ತೂಕದ ಕೌಂಟರ್‌ನಲ್ಲಿ",
    metric_done: "ಪೂರ್ಣಗೊಂಡಿದೆ",
    yard_cap: "ಯಾರ್ಡ್ ಸಾಮರ್ಥ್ಯ",
    weigh_counters: "ಸಕ್ರಿಯ ತೂಕದ ಕೌಂಟರ್‌ಗಳು",
    arrival_queue: "ಆಗಮನ ಕ್ಯೂ",
    brand_tagline: "ರೈತರ ಖಾತೆಗೆ ನೇರವಾಗಿ ಕನಿಷ್ಠ ಬೆಂಬಲ ಬೆಲೆ ಪಾವತಿ",
    login_note: "<strong>ಸೂಚನೆ:</strong> ರೈತರು ಮನೆಯಿಂದಲೇ ಆನ್‌ಲೈನ್ ಮೂಲಕ ಡಿಜಿಟಲ್ ಟೋಕನ್ ಪಡೆಯಬಹುದು.",
    btn_weighbridge_bay: "ತೂಕದ ಕೌಂಟರ್",
    btn_quality_assayer: "ಗುಣಮಟ್ಟ ಪರೀಕ್ಷಕ",
    btn_helpdesk: "ಮಂಡಿ ಸಹಾಯವಾಣಿ"
  },

  // 16. MALAYALAM
  ml: {
    tagline: "ദേശീയ ഏകീകൃത കാർഷിക മാർക്കറ്റ് (APMC) സംഭരണ പോർട്ടൽ",
    btn_home: "ഹോം പേജ്",
    gov_badge: "കൃഷി, കർഷക ക്ഷേമ മന്ത്രാലയം • ഭാരത സർക്കാർ",
    hero_title: "ദേശീയ കാർഷിക വിപണന ഗേറ്റ്‌വേയും നിയന്ത്രണ കേന്ദ്രവും",
    hero_sub: "കർഷകർക്കായി ഡിജിറ്റൽ സംഭരണം, സുതാര്യമായ വെയ്ബ്രിഡ്ജ് ക്യൂ, ബാങ്ക് അക്കൗണ്ടിലേക്ക് നേരിട്ട് MSP കൈമാറ്റം",
    pill_public: "കർഷക പ്രവേശനം",
    title_citizen: "കർഷക സേവന പോർട്ടൽ",
    desc_citizen: "കർഷക ഐഡന്റിറ്റി പരിശോധന, ഡിജിറ്റൽ മണ്ടി പാസ്, ലൈവ് ക്യൂ ട്രാക്കിംഗ്, ബാങ്ക് അക്കൗണ്ടിലേക്ക് നേരിട്ട് പണം.",
    btn_enter_citizen: "കർഷക പോർട്ടൽ തുറക്കുക →",
    pill_officer: "ഓഫീസർ ലോഗിൻ",
    title_officer: "മണ്ടി ഓഫീസർ ലോഗിൻ",
    desc_officer: "അംഗീകൃത APMC സെക്രട്ടറിമാർ, വെയ്ബ്രിഡ്ജ് ഓപ്പറേറ്റർമാർ, ഗുണനിലവാര പരിശോധകർ എന്നിവർക്കായി.",
    btn_enter_officer: "ഓഫീസർ കൺസോൾ →",
    login_heading: "അപേക്ഷക ലോഗിൻ (കർഷക സേവനം)",
    lbl_state: "സംസ്ഥാനം തിരഞ്ഞെടുക്കുക",
    lbl_district: "ജില്ല തിരഞ്ഞെടുക്കുക",
    district_subtext: "മാർക്കറ്റ് നിശ്ചയിക്കുന്നതിന് ജില്ല തിരഞ്ഞെടുക്കൽ നിർബന്ധമാണ്.",
    lbl_mobile: "രജിസ്റ്റർ ചെയ്ത മൊബൈൽ നമ്പർ",
    mobile_subtext: "ഈ നമ്പറിലേക്ക് 6 അക്ക ഔദ്യോഗിക OTP അയക്കും.",
    lbl_captcha: "സുരക്ഷാ കോഡ് (Captcha)",
    btn_get_otp: "OTP നേടുക →",
    otp_title: "OTP കോഡ് നൽകുക",
    otp_sent_to: "അയച്ച മൊബൈൽ:",
    otp_validity: "കാലാവധി:",
    lbl_enter_6digit: "6 അക്ക OTP രേഖപ്പെടുത്തുക",
    btn_verify_continue: "പരിശോധിച്ച് മുന്നോട്ട് പോകുക →",
    btn_change_mobile: "← മൊബൈൽ നമ്പർ മാറ്റുക",
    not_received: "കോഡ് ലഭിച്ചില്ലേ?",
    hub_breadcrumb: "കർഷക സേവന കേന്ദ്രം",
    welcome_user: "സ്വാഗതം, രജിസ്റ്റർ ചെയ്ത കർഷക മിത്രമേ",
    tile_track_title: "ടോക്കൺ, ക്യൂ വിവരങ്ങൾ",
    tile_track_desc: "നിങ്ങളുടെ ടോക്കൺ നമ്പർ, വെയ്ബ്രിഡ്ജ് ക്യൂ നില, ബാങ്ക് പേയ്മെന്റ് രസീത് എന്നിവ കാണുക.",
    btn_track_status: "വിവരങ്ങൾ അറിയുക →",
    tile_book_title: "പുതിയ ബുക്കിംഗും KYC യും",
    tile_book_desc: "വിള വിവരങ്ങൾ നൽകുക, രേഖകൾ പരിശോധിക്കുക, പുതിയ ഡിജിറ്റൽ പാസ് എടുക്കുക.",
    btn_new_booking: "പുതിയ സ്ലോട്ട് ബുക്ക് ചെയ്യുക →",
    booking_breadcrumb: "മാർക്കറ്റ് സ്ലോട്ട് ബുക്കിംഗും വിള പ്രഖ്യാപനവും",
    form_title: "വിള വിൽപ്പന സ്ലോട്ട് ബുക്ക് ചെയ്യുക",
    form_sub: "ക്യൂ ടോക്കൺ ലഭിക്കുന്നതിന് കാർഷിക വിളയുടെ വിവരങ്ങൾ നൽകുക.",
    kyc_step: "ഘട്ടം 1: കർഷക തിരിച്ചറിയൽ പരിശോധന",
    kyc_desc: "സർക്കാർ രേഖകളുമായി ഒത്തുനോക്കാൻ ഫാർമർ ഐഡി നൽകുക.",
    btn_verify_id: "ഐഡി പരിശോധിക്കുക",
    lbl_name: "1. കർഷകന്റെ പൂർണ്ണമായ പേര്",
    lbl_phone: "2. മൊബൈൽ നമ്പർ",
    lbl_village: "3. വില്ലേജ് / ബ്ലോക്ക്",
    lbl_centre: "4. സംഭരണ കേന്ദ്രം (മണ്ടി)",
    lbl_crop: "5. വിളയുടെ ഇനം",
    lbl_qty: "6. വിളവിന്റെ അളവ് (ക്വിന്റൽ)",
    lbl_slot: "7. മാർക്കറ്റിൽ എത്തുന്ന സമയം",
    btn_generate_pass: "ഡിജിറ്റൽ പാസ് നൽകുക",
    pass_title: "സജീവ ഡിജിറ്റൽ പാസ്",
    pass_sub: "തത്സമയ വെയ്ബ്രിഡ്ജുമായി ബന്ധിപ്പിച്ചിരിക്കുന്നു.",
    officer_title: "മാർക്കറ്റ് കൺട്രോൾ ഡെസ്ക്",
    officer_sub: "ക്യൂ, വെയ്ബ്രിഡ്ജ് കണക്കുകൾ, ബാങ്ക് ട്രാൻസ്ഫർ എന്നിവ നിയന്ത്രിക്കുക.",
    metric_total: "ഇന്നത്തെ ആകെ കർഷകർ",
    metric_line: "വരിയിൽ കാത്തിരിക്കുന്നവർ",
    metric_bridge: "വെയ്ബ്രിഡ്ജിൽ",
    metric_done: "പൂർത്തിയായി",
    yard_cap: "സംഭരണ ശേഷി",
    weigh_counters: "സജീവ വെയ്ബ്രിഡ്ജ് കൗണ്ടറുകൾ",
    arrival_queue: "വരവ് ക്യൂ",
    brand_tagline: "കർഷകരുടെ അക്കൗണ്ടിലേക്ക് നേരിട്ട് താങ്ങുവില കൈമാറുന്നു",
    login_note: "<strong>അറിയിപ്പ്:</strong> കർഷകർക്ക് മുൻകൂട്ടി ഡിജിറ്റൽ ടോക്കൺ എടുത്ത് ഉൽപ്പന്നങ്ങൾ വിൽക്കാം.",
    btn_weighbridge_bay: "വെയ്ബ്രിഡ്ജ് കൗണ്ടർ",
    btn_quality_assayer: "ഗുണനിലവാര പരിശോധകൻ",
    btn_helpdesk: "മണ്ടി സഹായ കേന്ദ്രം"
  }
};

// Complete 16-language speech recognition mapping
const SPEECH_LANG_MAP = {
  en: "en-IN",
  hi: "hi-IN",
  bn: "bn-IN",
  or: "or-IN",
  as: "as-IN",
  grt: "en-IN",
  sat: "hi-IN",
  brx: "as-IN",
  mai: "hi-IN",
  pa: "pa-IN",
  mr: "mr-IN",
  gu: "gu-IN",
  te: "te-IN",
  ta: "ta-IN",
  kn: "kn-IN",
  ml: "ml-IN"
};

function applyLanguage(langCode) {
  const dict = I18N_DICTIONARY[langCode] || I18N_DICTIONARY.en;
  const enDict = I18N_DICTIONARY.en;
  state.currentLang = langCode;
  localStorage.setItem("kq_lang", langCode);

  // 1. Text elements with fallback
  document.querySelectorAll("[data-i18n]").forEach(el => {
    const key = el.getAttribute("data-i18n");
    el.innerHTML = dict[key] || enDict[key] || "";
  });

  // 2. Input placeholders for all 16 languages
  const placeholders = {
    en: { name: "e.g. Ramesh Kumar", mobile: "Enter 10-digit mobile number", village: "e.g. Rampur", qty: "e.g. 45", captcha: "Type characters" },
    hi: { name: "उदा. रमेश कुमार", mobile: "10-अंकों का मोबाइल नंबर दर्ज करें", village: "उदा. रामपुर", qty: "उदा. 45", captcha: "कोड दर्ज करें" },
    bn: { name: "উদাঃ রমেশ কুমার", mobile: "১০ সংখ্যার মোবাইল নম্বর লিখুন", village: "উদাঃ রামপুর", qty: "উদাঃ ৪৫", captcha: "কোড লিখুন" },
    or: { name: "ଉଦାହରଣ: ରମେଶ କୁମାର", mobile: "୧୦-ଅଙ୍କ ବିଶିଷ୍ଟ ମୋବାଇଲ୍ ନମ୍ବର", village: "ଉଦାହରଣ: ରାମପୁର", qty: "ଉଦାହରଣ: ୪୫", captcha: "କୋଡ୍ ଲେଖନ୍ତୁ" },
    as: { name: "যেনে: ৰমেশ কুমাৰ", mobile: "১০টা সংখ্যাৰ ম'বাইল নম্বৰ", village: "যেনে: ৰামপুৰ", qty: "যেনে: ৪৫", captcha: "ক'ড লিখক" },
    grt: { name: "Jensalo: Ramesh Kumar", mobile: "10-digit mobile number", village: "Jensalo: Rampur", qty: "Jensalo: 45", captcha: "Code sedokbo" },
    sat: { name: "ᱡᱮᱞᱮᱠᱟ: ᱨᱚᱢᱮᱥ ᱠᱩᱢᱟᱨ", mobile: "᱑᱐-ᱮᱞᱟᱱ ᱢᱳᱵᱟᱭᱤᱞ ᱱᱚᱢᱵᱚᱨ", village: "ᱡᱮᱞᱮᱠᱟ: ᱨᱟᱢᱯᱩᱨ", qty: "ᱡᱮᱞᱮᱠᱟ: ᱔᱕", captcha: "ᱠᱳᱰ ᱚᱞ ᱢᱮ" },
    brx: { name: "उदा: रमेश कुमार", mobile: "१० अनजिमानि मबाइल नम्बर", village: "उदा: रामपुर", qty: "उदा: ४५", captcha: "अनजिमा सोनाव" },
    mai: { name: "उदा. रमेश कुमार", mobile: "१०-अंकक मोबाइल नंबर", village: "उदा. रामपुर", qty: "उदा. ४५", captcha: "कोड लिखू" },
    pa: { name: "ਜਿਵੇਂ ਕਿ ਰਮੇਸ਼ ਕੁਮਾਰ", mobile: "10 ਅੰਕਾਂ ਦਾ ਮੋਬਾਈਲ ਨੰਬਰ ਭਰੋ", village: "ਜਿਵੇਂ ਕਿ ਰਾਮਪੁਰ", qty: "ਜਿਵੇਂ ਕਿ 45", captcha: "ਕੋਡ ਭਰੋ" },
    mr: { name: "उदा. रमेश कुमार", mobile: "१० अंकी मोबाईल नंबर टाका", village: "उदा. रामपूर", qty: "उदा. ४५", captcha: "कोड टाका" },
    gu: { name: "દા.ત. રમેશ કુમાર", mobile: "૧૦ અંકનો મોબાઈલ નંબર", village: "દા.ત. રામપુર", qty: "દા.ત. 45", captcha: "કોડ લખો" },
    te: { name: "ఉదా. రమేష్ కుమార్", mobile: "10 అంకెల మొబైల్ నంబర్ రాయండి", village: "ఉదా. రాంపూర్", qty: "ఉదా. 45", captcha: "కోడ్ రాయండి" },
    ta: { name: "எ.கா. ரமேஷ் குமார்", mobile: "10 இலக்க கைபேசி எண்", village: "எ.கா. ராம்பூர்", qty: "எ.கா. 45", captcha: "குறியீடு" },
    kn: { name: "ಉದಾ: ರಮೇಶ್ ಕುಮಾರ್", mobile: "10-ಅಂಕಿಯ ಮೊಬೈಲ್ ಸಂಖ್ಯೆ", village: "ಉದಾ: ರಾಂಪುರ", qty: "ಉದಾ: 45", captcha: "ಕೋಡ್ ಬರೆಯಿರಿ" },
    ml: { name: "ഉദാ: രമേഷ് കുമാർ", mobile: "10 അക്ക മൊബൈൽ നമ്പർ", village: "ഉദാ: രാംപുർ", qty: "ഉദാ: 45", captcha: "കോഡ് നൽകുക" }
  };

  const p = placeholders[langCode] || placeholders.en;
  const nameEl = document.getElementById("farmer_name");
  const mobEl = document.getElementById("applicantMobile");
  const villEl = document.getElementById("village");
  const qtyEl = document.getElementById("quantity");
  const capEl = document.getElementById("captchaInput");

  if (nameEl) nameEl.placeholder = p.name;
  if (mobEl) mobEl.placeholder = p.mobile;
  if (villEl) villEl.placeholder = p.village;
  if (qtyEl) qtyEl.placeholder = p.qty;
  if (capEl) capEl.placeholder = p.captcha;

  // 3. Speech recognition language sync
  const regionalSpeech = SPEECH_LANG_MAP[langCode] || "en-IN";
  const assistantLangSelect = document.getElementById("ai-language-select");
  if (assistantLangSelect) {
    assistantLangSelect.value = regionalSpeech;
  }
}

// ============================================================
// 3. CAPTCHA GENERATOR
// ============================================================
function generateCaptcha() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let result = "";
  for (let i = 0; i < 5; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  state.currentCaptcha = result;
  const display = document.getElementById("captchaDisplay");
  if (display) display.innerText = result;
}

// ============================================================
// 4. PAN-INDIA APPLICANT LOGIN LOGIC (FIXED & SAFEGUARDED)
// ============================================================
function initPanIndiaApplicantLogin() {
  // DOM element references
  const stateSelect = document.getElementById("applicantState");
  const districtSelect = document.getElementById("applicantDistrict");
  const blockSelect = document.getElementById("applicantBlock");
  const mobileInput = document.getElementById("applicantMobile");
  const mobileValidTick = document.getElementById("mobileValidTick");
  const captchaInput = document.getElementById("captchaInput");
  const btnRefreshCaptcha = document.getElementById("btnRefreshCaptcha");
  const btnRequestOtp = document.getElementById("btn-request-otp");

  // 1. Populate States
  if (stateSelect) {
    stateSelect.innerHTML = '<option value="" disabled selected>-- Choose State / UT --</option>';
    Object.keys(INDIA_LOCATIONS).sort().forEach(st => {
      const opt = document.createElement("option");
      opt.value = st;
      opt.textContent = st;
      stateSelect.appendChild(opt);
    });

    stateSelect.addEventListener("change", () => {
      const selectedState = stateSelect.value;
      if (districtSelect) {
        districtSelect.innerHTML = '<option value="" disabled selected>-- Select District --</option>';
        districtSelect.disabled = false;
      }
      if (blockSelect) {
        blockSelect.innerHTML = '<option value="" disabled selected>-- First Select District --</option>';
        blockSelect.disabled = true;
      }

      if (INDIA_LOCATIONS[selectedState] && districtSelect) {
        const districts = Array.isArray(INDIA_LOCATIONS[selectedState])
          ? INDIA_LOCATIONS[selectedState]
          : Object.keys(INDIA_LOCATIONS[selectedState]);

        districts.forEach(dist => {
          const opt = document.createElement("option");
          opt.value = dist;
          opt.textContent = dist;
          districtSelect.appendChild(opt);
        });
      }
    });
  }

  // 2. Populate Rural Blocks / APMC Hubs on District Change
  if (districtSelect && blockSelect) {
    districtSelect.addEventListener("change", () => {
      const selectedState = stateSelect ? stateSelect.value : "";
      const selectedDistrict = districtSelect.value;
      blockSelect.innerHTML = '<option value="" disabled selected>-- Select Rural Block / APMC Hub --</option>';

      if (INDIA_LOCATIONS[selectedState] && !Array.isArray(INDIA_LOCATIONS[selectedState])) {
        const blocks = INDIA_LOCATIONS[selectedState][selectedDistrict] || [];
        blocks.forEach(b => {
          const opt = document.createElement("option");
          opt.value = b;
          opt.textContent = b;
          blockSelect.appendChild(opt);
        });
        blockSelect.disabled = false;
      }
    });
  }

  // 3. Live Green Checkmark on Mobile Input (10 Digits Validation)
  if (mobileInput) {
    mobileInput.addEventListener("input", () => {
      const clean = mobileInput.value.replace(/\D/g, "");
      mobileInput.value = clean;
      const isValid = /^[6-9]\d{9}$/.test(clean);
      if (mobileValidTick) {
        mobileValidTick.style.display = isValid ? "flex" : "none";
      }
      mobileInput.style.borderColor = isValid ? "#16a34a" : "#cbd5e1";
    });
  }

  // 4. Captcha Refresh & Initial Generation
  if (btnRefreshCaptcha) {
    btnRefreshCaptcha.addEventListener("click", generateCaptcha);
  }
  generateCaptcha();

  // 5. OTP Countdown Timer Management
  let timerInterval = null;

  function startOtpTimer() {
    let secondsLeft = 600; // 10 minutes
    const timerDisplay = document.getElementById("otpCountdown");
    if (timerInterval) clearInterval(timerInterval);

    timerInterval = setInterval(() => {
      secondsLeft--;
      if (secondsLeft <= 0) {
        clearInterval(timerInterval);
        if (timerDisplay) timerDisplay.innerText = "Expired";
        return;
      }
      const m = Math.floor(secondsLeft / 60);
      const s = secondsLeft % 60;
      if (timerDisplay) timerDisplay.innerText = `${m}:${s < 10 ? "0" : ""}${s}`;
    }, 1000);
  }

  // 6. Request OTP Button Handshake (Updated with Rural Block & 6-Digit Fallback)
  if (btnRequestOtp) {
    btnRequestOtp.addEventListener("click", async () => {
      const st = stateSelect ? stateSelect.value : "";
      const dist = districtSelect ? districtSelect.value : "";
      const blk = blockSelect ? blockSelect.value : "";
      const phone = mobileInput ? mobileInput.value.trim() : "";
      const enteredCaptcha = captchaInput ? captchaInput.value.trim().toUpperCase() : "";

      if (!st) return alert("Please select your State / UT.");
      if (!dist) return alert("Please select your District.");
      if (!/^[6-9]\d{9}$/.test(phone)) return alert("Please enter a valid 10-digit Indian mobile number.");
      if (enteredCaptcha !== state.currentCaptcha) {
        alert("Incorrect Captcha. Please verify characters and try again.");
        generateCaptcha();
        if (captchaInput) {
          captchaInput.value = "";
          captchaInput.focus();
        }
        return;
      }

      state.authenticatedUser = { state: st, district: dist, block: blk, mobile: phone };

      const dispMasked = document.getElementById("dispMaskedMobile");
      if (dispMasked) {
        dispMasked.innerText = `+91 ${phone.slice(0, 5)} ${phone.slice(5)}`;
      }

      window.switchPanel("panel-farmer-otp", "GATEWAY");
      startOtpTimer();

      try {
        const res = await fetch(`${getHttpBase()}/api/auth/send-otp`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ mobile: phone })
        });
        const data = await res.json();
        const otpField = document.getElementById("otpCodeEntry");
        if (otpField && data.demo_otp) {
          otpField.value = data.demo_otp;
        }
      } catch (err) {
        const otpField = document.getElementById("otpCodeEntry");
        if (otpField) otpField.value = "123456"; // 6-digit fallback
      }
    });
  }

  // 7. Verify & Continue Button (Enforces strict 6 digits)
  const btnVerifyContinue = document.getElementById("btn-verify-continue");
  if (btnVerifyContinue) {
    btnVerifyContinue.addEventListener("click", () => {
      const otpInput = document.getElementById("otpCodeEntry");
      const code = otpInput ? otpInput.value.trim() : "";
      
      // Strict 6-digit numeric validation
      if (!code || !/^\d{6}$/.test(code)) {
        alert("Please enter the complete 6-digit OTP received on your mobile.");
        if (otpInput) otpInput.focus();
        return;
      }

      const meta = document.getElementById("userSessionMeta");
      if (meta && state.authenticatedUser) {
        const locationPrefix = state.authenticatedUser.block 
          ? `${state.authenticatedUser.block}, ${state.authenticatedUser.district}` 
          : `${state.authenticatedUser.district}`;
        meta.innerText = `${locationPrefix}, ${state.authenticatedUser.state} • Mobile: +91 ${state.authenticatedUser.mobile}`;
      }

      window.switchPanel("panel-farmer-choice", "FARMER");
    });
  }

  // 8. Change Mobile Number Button
  const btnChangeMobile = document.getElementById("btn-change-mobile");
  if (btnChangeMobile) {
    btnChangeMobile.addEventListener("click", () => {
      if (timerInterval) clearInterval(timerInterval);
      window.switchPanel("panel-farmer-login", "GATEWAY");
      generateCaptcha();
    });
  }

  // 9. Choice Hub Navigation (Pre-populates selected block into village input)
  const btnGoToBooking = document.getElementById("btnGoToBooking");
  if (btnGoToBooking) {
    btnGoToBooking.addEventListener("click", () => {
      if (state.authenticatedUser) {
        const m = document.getElementById("mobile");
        const v = document.getElementById("village");
        if (m) m.value = state.authenticatedUser.mobile;
        if (v) v.value = state.authenticatedUser.block || `${state.authenticatedUser.district} Hub`;
      }
      window.switchPanel("panel-farmer", "FARMER");
    });
  }

  const btnGoToTracking = document.getElementById("btnGoToTracking");
  if (btnGoToTracking) {
    btnGoToTracking.addEventListener("click", () => {
      window.switchPanel("panel-farmer", "FARMER");
      const ticketSection = document.getElementById("farmer-ticket-display");
      if (ticketSection) ticketSection.scrollIntoView({ behavior: "smooth" });
    });
  }

  const btnHubLogout = document.getElementById("btnHubLogout");
  if (btnHubLogout) {
    btnHubLogout.addEventListener("click", () => {
      state.authenticatedUser = null;
      window.switchPanel("panel-gateway", "GATEWAY");
    });
  }

  const btnBackToChoice = document.getElementById("btnBackToChoice");
  if (btnBackToChoice) {
    btnBackToChoice.addEventListener("click", () => {
      window.switchPanel("panel-farmer-choice", "FARMER");
    });
  }
}

// ============================================================
// 5. VIEW ROUTER & NAVIGATION CONTROLLER
// ============================================================
window.switchPanel = function(panelId, contextName) {
  const panels = [
    "panel-gateway",
    "panel-farmer-login",
    "panel-farmer-otp",
    "panel-farmer-choice",
    "panel-farmer",
    "panel-operator",
    "panel-weighbridge",
    "panel-assayer"
  ];

  panels.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.classList.remove("active");
  });

  const target = document.getElementById(panelId);
  if (target) target.classList.add("active");

  const btnReturn = document.getElementById("btn-back-gateway");
  if (btnReturn) {
    btnReturn.style.display = (panelId === "panel-gateway") ? "none" : "inline-flex";
  }

  if (window.updateFloatingWidgetContext) {
    window.updateFloatingWidgetContext(contextName);
  }

  window.scrollTo({ top: 0, behavior: "smooth" });
};

function initRouter() {
  const btnEnterFarmer = document.getElementById("btn-enter-farmer");
  if (btnEnterFarmer) {
    btnEnterFarmer.addEventListener("click", () => window.switchPanel("panel-farmer-login", "GATEWAY"));
  }

  const btnEnterOperator = document.getElementById("btn-enter-operator");
  if (btnEnterOperator) {
    btnEnterOperator.addEventListener("click", () => window.switchPanel("panel-operator", "OPERATOR"));
  }

  // Routes directly to the specialized Weighbridge Bay Terminal
  const btnWeighbridge = document.getElementById("btn-enter-operator-weighbridge");
  if (btnWeighbridge) {
    btnWeighbridge.addEventListener("click", () => window.switchPanel("panel-weighbridge", "OPERATOR"));
  }

  // Routes directly to the specialized Quality Assaying Lab Terminal
  const btnAssayer = document.getElementById("btn-enter-operator-assayer");
  if (btnAssayer) {
    btnAssayer.addEventListener("click", () => window.switchPanel("panel-assayer", "OPERATOR"));
  }

  const btnReturn = document.getElementById("btn-back-gateway");
  if (btnReturn) {
    btnReturn.addEventListener("click", () => window.switchPanel("panel-gateway", "GATEWAY"));
  }

  document.querySelectorAll(".breadcrumb-back-btn").forEach(btn => {
    btn.addEventListener("click", () => window.switchPanel("panel-gateway", "GATEWAY"));
  });
}

// ============================================================
// 6. BOOKING DISPATCH & IDENTITY REGISTRY MODULE
// ============================================================
function initBookingModule() {
  document.querySelectorAll(".auth-tab-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      document.querySelectorAll(".auth-tab-btn").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      currentAuthType = btn.getAttribute("data-type");
      const idInput = document.getElementById("farmerIdValue");
      if (currentAuthType === "KRISHAK_BANDHU") {
        idInput.placeholder = "Enter Farmer Registry ID (e.g. KB-982145)";
        idInput.value = "KB-982145";
      } else if (currentAuthType === "KCC") {
        idInput.placeholder = "Enter Kisan Credit Card No (e.g. KCC-4521-8890)";
        idInput.value = "KCC-4521-8890";
      } else if (currentAuthType === "PAN_CARD") {
        idInput.placeholder = "Enter 10-Digit Income PAN (e.g. ABCDE1234F)";
        idInput.value = "ABCDE1234F";
      }
    });
  });

  const verifyBtn = document.getElementById("verifyIdBtn");
  if (verifyBtn) {
    verifyBtn.addEventListener("click", async () => {
      const idVal = document.getElementById("farmerIdValue").value.trim();
      if (!idVal) return alert("Please enter your identity registration number");

      verifyBtn.disabled = true;
      verifyBtn.innerText = "Checking...";

      try {
        const res = await fetch(`${getHttpBase()}/api/auth/verify-identity`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ auth_type: currentAuthType === "PAN_CARD" ? "KRISHAK_BANDHU" : currentAuthType, id_value: idVal })
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.detail || "Verification failed");

        verifiedFarmerData = data;
        const banner = document.getElementById("authStatusBanner");
        banner.style.display = "flex";
        banner.style.background = "#dcfce7";
        banner.style.color = "#15803d";
        banner.style.border = "1px solid #86efac";
        banner.innerHTML = `<span>✅ Verified: <strong>${data.farmer_name}</strong> (${data.verified_id})</span>`;

        const nameEl = document.getElementById("farmer_name");
        const villageEl = document.getElementById("village");
        const mobileEl = document.getElementById("mobile");
        if (nameEl && data.farmer_name) nameEl.value = data.farmer_name;
        if (villageEl && data.village) villageEl.value = data.village;
        if (mobileEl && data.mobile) mobileEl.value = data.mobile;
      } catch (err) {
        alert(err.message);
      } finally {
        verifyBtn.disabled = false;
        verifyBtn.innerText = "Verify ID";
      }
    });
  }

  const bookingForm = document.getElementById("booking-form");
  if (bookingForm) {
    bookingForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const form = e.target;
      const payload = {
        farmer_name: form.farmer_name.value,
        mobile: form.mobile.value,
        village: form.village.value,
        centre_id: form.centre_id.value,
        crop: form.crop.value,
        quantity_quintals: parseFloat(form.quantity.value),
        slot_time: form.slot_time.value,
        auth_type: verifiedFarmerData ? verifiedFarmerData.auth_type : "MOBILE_OTP",
        verified_id: verifiedFarmerData ? verifiedFarmerData.verified_id : "VERIFIED",
        pan_no: document.getElementById("farmerPanNumber")?.value || "ABCDE1234F"
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
          alert(`✅ Digital Pass Issued: ${data.token.token_id}`);
          fetchCentreData(state.selectedCentre);
        }
      } catch (err) {
        alert("Backend server offline. Please verify Uvicorn status.");
      }
    });
  }
}

// ============================================================
// CONNECTION STATUS SIGNAL MANAGER (GREEN / YELLOW / RED)
// ============================================================
function setSignalStatus(status) {
  const pill = document.getElementById("connection-status");
  const offlineBanner = document.getElementById("offline-banner");
  if (!pill) return;

  // Reset existing classes while retaining base styling
  pill.className = "status-pill";

  if (status === "connected") {
    pill.classList.add("status-connected");
    pill.innerHTML = '<span class="status-dot"></span> 🟢 Live Connected';
    if (offlineBanner) offlineBanner.style.display = "none";
  } else if (status === "connecting") {
    pill.classList.add("status-connecting");
    pill.innerHTML = '<span class="status-dot"></span> 🟡 Connecting...';
  } else {
    pill.classList.add("status-reconnecting");
    pill.innerHTML = '<span class="status-dot"></span> 🔴 Reconnecting...';
    if (offlineBanner) offlineBanner.style.display = "block";
  }
}

// Attach to window so other scripts can access it safely if needed
window.setSignalStatus = setSignalStatus;

// ============================================================
// 7. WEBSOCKET REAL-TIME ENGINE
// ============================================================
function initWebSocket() {

  function initWebSocket() {
  setSignalStatus("connecting");

  const wsUrl = (window.CONFIG && window.CONFIG.WS_BASE) 
    ? window.CONFIG.WS_BASE 
    : "ws://127.0.0.1:8000/ws";

  let socket = null;

  try {
    socket = new WebSocket(wsUrl);

    socket.onopen = () => {
      console.log("WebSocket connected successfully.");
      setSignalStatus("connected");
    };

    socket.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data);
        if (typeof handleSocketMessage === "function") {
          handleSocketMessage(payload);
        }
      } catch (err) {
        console.warn("Incoming WS message parse failed:", err);
      }
    };

    socket.onclose = () => {
      setSignalStatus("reconnecting");
      setTimeout(initWebSocket, 3000);
    };

    socket.onerror = (err) => {
      console.error("WebSocket encountered error:", err);
      setSignalStatus("reconnecting");
      socket.close();
    };
  } catch (err) {
    console.error("Socket instantiation failed:", err);
    setSignalStatus("reconnecting");
    setTimeout(initWebSocket, 3000);
  }
}


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
      if (data.event === "QUEUE_UPDATED" || data.centre_id === state.selectedCentre) {
        fetchCentreData(state.selectedCentre);
      }
    };
    state.socket.onclose = () => {
      if (statusIndicator) {
        statusIndicator.textContent = "🔴 Reconnecting...";
        statusIndicator.classList.remove("connected");
      }
      if (offlineBanner) offlineBanner.style.display = "block";
      setTimeout(initWebSocket, 3000);
    };
  } catch (err) {
    setTimeout(initWebSocket, 3000);
  }
}

async function fetchCentreData(centreId) {
  try {
    const res = await fetch(`${getHttpBase()}/api/queue/${encodeURIComponent(centreId)}`);
    if (!res.ok) return;
    state.queueData = await res.json();
    renderOperatorDashboard();
    renderFarmerTracking();
  } catch (err) {}
}

function renderOperatorDashboard() {
  const d = state.queueData;
  const setTxt = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
  setTxt("metric-total", d.total);
  setTxt("metric-waiting", d.waiting);
  setTxt("metric-processing", d.processing);
  setTxt("metric-completed", d.completed);

  const pct = Math.min(100, Math.round((d.waiting / 50) * 100));
  const bar = document.getElementById("workload-bar");
  if (bar) bar.style.width = `${pct}%`;
  setTxt("workload-percent", `${pct}%`);
}

function renderFarmerTracking() {
  const card = document.getElementById("farmer-ticket-display");
  if (!card) return;
  if (!state.activeToken) {
    card.innerHTML = `<p style="text-align:center; color:#52796f; padding:2rem 0;">No active booking. Fill the form to get a token.</p>`;
    return;
  }
  card.innerHTML = `
    <div class="digital-token-ticket">
      <div class="ticket-header">
        <span>NATIONAL APMC PASS</span>
        <span class="centre-badge">${state.activeToken.centre_id}</span>
      </div>
      <h2>${state.activeToken.token_id}</h2>
      <p class="farmer-meta">${state.activeToken.farmer_name} • ${state.activeToken.crop} (${state.activeToken.quantity_quintals} Qtl)</p>
      <div class="alert-box success">Verified & Queued for Weighbridge Bay Arrival</div>
    </div>
  `;
}

// ============================================================
// 8. INITIALIZATION LIFECYCLE
// ============================================================
document.addEventListener("DOMContentLoaded", () => {
  initWebSocket();
  initRouter();
  initPanIndiaApplicantLogin();
  initOtpResend(); // <-- Add this line

  // Start cleanly on the Gateway
  window.switchPanel("panel-gateway", "GATEWAY");

  initRouter();
  initPanIndiaApplicantLogin();
  initBookingModule();
  initWebSocket();
  initHelpdeskDrawer();

  // Bind Global Regional Language Switcher
  const langSelect = document.getElementById("globalLanguageSelect");
  if (langSelect) {
    langSelect.value = state.currentLang;
    applyLanguage(state.currentLang);

    langSelect.addEventListener("change", (e) => {
      applyLanguage(e.target.value);
    });
  }

  // Bind Centre Dropdowns
  document.querySelectorAll(".centre-dropdown").forEach(sel => {
    sel.addEventListener("change", (e) => {
      state.selectedCentre = e.target.value;
      fetchCentreData(state.selectedCentre);
    });
  });
});

// ============================================================
// MANDI HELPDESK SLIDING DRAWER LOGIC
// ============================================================
function initHelpdeskDrawer() {
  const btnOpen = document.getElementById("btn-open-helpdesk");
  const btnClose = document.getElementById("btn-close-helpdesk");
  const drawer = document.getElementById("helpdesk-drawer");
  const backdrop = document.getElementById("helpdesk-backdrop");

  function openDrawer() {
    if (drawer) drawer.classList.add("active");
    if (backdrop) backdrop.classList.add("active");
  }

  function closeDrawer() {
    if (drawer) drawer.classList.remove("active");
    if (backdrop) backdrop.classList.remove("active");
  }

  if (btnOpen) btnOpen.addEventListener("click", openDrawer);
  if (btnClose) btnClose.addEventListener("click", closeDrawer);
  if (backdrop) backdrop.addEventListener("click", closeDrawer);

  // Allow closing with Escape key
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && drawer?.classList.contains("active")) {
      closeDrawer();
    }
  });
}

// ============================================================
// RESEND OTP HANDLER & COOLDOWN CONTROLLER
// ============================================================
function initOtpResend() {
  const btnResend = document.getElementById("btnResendOtp");
  const otpInput = document.getElementById("otpCodeEntry");
  const errorBanner = document.getElementById("otpErrorBanner");
  const mobileInput = document.getElementById("applicantMobile");
  const countdownDisplay = document.getElementById("otpCountdown");

  if (!btnResend) return;

  btnResend.addEventListener("click", async (e) => {
    e.preventDefault();
    if (btnResend.disabled) return;

    // 1. Clear input field and error state
    if (otpInput) {
      otpInput.value = "";
      otpInput.focus();
    }
    if (errorBanner) {
      errorBanner.classList.add("hidden-inline");
      errorBanner.innerText = "";
    }

    // 2. Reset the 10-minute validity timer display
    if (countdownDisplay) {
      countdownDisplay.innerText = "10:00";
    }

    // 3. Start a 30-second anti-spam cooldown
    let cooldown = 30;
    btnResend.disabled = true;
    btnResend.style.opacity = "0.5";
    btnResend.style.cursor = "not-allowed";
    btnResend.innerText = `Resend in ${cooldown}s`;

    const cooldownTimer = setInterval(() => {
      cooldown--;
      if (cooldown > 0) {
        btnResend.innerText = `Resend in ${cooldown}s`;
      } else {
        clearInterval(cooldownTimer);
        btnResend.disabled = false;
        btnResend.style.opacity = "1";
        btnResend.style.cursor = "pointer";
        btnResend.innerText = "Resend OTP";
      }
    }, 1000);

    // 4. Request new OTP from backend (with demo fallback)
    const mobile = mobileInput ? mobileInput.value.trim() : "";
    const httpBase = window.CONFIG?.HTTP_BASE || "http://127.0.0.1:8000";

    try {
      const response = await fetch(`${httpBase}/api/farmer/otp/request`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mobile })
      });

      if (response.ok) {
        const result = await response.json();
        alert(`✅ New OTP generated: ${result.otp || "Dispatched successfully"}`);
      } else {
        // Fallback for local simulation mode
        const generatedMockOtp = Math.floor(100000 + Math.random() * 900000);
        console.log("Mock Resent OTP:", generatedMockOtp);
        alert(`✅ A new 6-digit OTP has been dispatched to your mobile.`);
      }
    } catch (err) {
      // Offline fallback simulation
      const generatedMockOtp = Math.floor(100000 + Math.random() * 900000);
      console.log("Local Simulated Resend OTP:", generatedMockOtp);
      alert(`✅ A new 6-digit OTP has been dispatched to your mobile.`);
    }
  });
}

// ============================================================
// CRYPTO HASH GENERATOR (HMAC SIMULATION VIA BROWSER CRYPTO)
// ============================================================
async function generatePassSignature(payload) {
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    enc.encode("MANDI_SECRET_APMC_2026"),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", keyMaterial, enc.encode(payload));
  return Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")
    .substring(0, 16)
    .toUpperCase();
}

// ============================================================
// DIGITAL PASS COMPONENT: RADIAL GAUGE & BREAKDOWN TOGGLE
// ============================================================
window.renderFarmerPass = async function (data) {
  const container = document.getElementById("farmer-ticket-display");
  if (!container) return;

  const isPerishable = data.crop === "Tomato" || data.crop === "Green Chilli";
  const priorityClass = isPerishable ? "priority-pass" : "standard-pass";
  const tokenPrefix = isPerishable ? "EXP" : "KQ";
  const randomSeq = Math.floor(100 + Math.random() * 900);
  const tokenNumber = `${tokenPrefix}-${randomSeq}`;
  
  // Cryptographic Signature
  const rawString = `${tokenNumber}|${data.farmer_name}|${data.mobile}|${data.quantity}|${data.slot_time}`;
  const cryptoHash = await generatePassSignature(rawString);

  // Cache in Browser localStorage for Offline Operation (Point 05)
  const passRecord = { ...data, tokenNumber, cryptoHash, generatedAt: new Date().toISOString() };
  localStorage.setItem("KISAN_ACTIVE_PASS", JSON.stringify(passRecord));

  container.innerHTML = `
    <div class="active-pass-card ${priorityClass}">
      <div class="pass-header-strip">
        <span class="pass-badge">${isPerishable ? "⚡ EXPRESS PERISHABLE LANE" : "STANDARD GRAIN APMC ENTRY"}</span>
        <span class="pass-hash">SIG: ${cryptoHash}</span>
      </div>

      <div class="radial-gauge-wrapper">
        <svg viewBox="0 0 120 120" class="radial-svg">
          <circle class="radial-bg" cx="60" cy="60" r="50"></circle>
          <circle class="radial-progress" id="queueRadialRing" cx="60" cy="60" r="50"></circle>
        </svg>
        <div class="radial-text-content">
          <span class="radial-token-num">${tokenNumber}</span>
          <span class="radial-token-lbl">YOUR TOKEN</span>
        </div>
      </div>

      <div class="queue-telemetry-stats">
        <div class="stat-cell">
          <span>Vehicles Ahead</span>
          <strong id="passVehiclesAhead">${isPerishable ? "2 (Express)" : "7"}</strong>
        </div>
        <div class="stat-cell">
          <span>Est. Gate Entry</span>
          <strong id="passEstWait">${isPerishable ? "12 Mins" : "38 Mins"}</strong>
        </div>
        <div class="stat-cell">
          <span>Scale Bay</span>
          <strong>Bay 01</strong>
        </div>
      </div>

      <!-- Point 08: Transit Delay Grace Button -->
      <div class="breakdown-control-row">
        <button type="button" id="btnReportDelay" class="btn-breakdown-hold" onclick="handleTransitDelay('${tokenNumber}')">
          🚜 Report Transit Delay (+45m Grace Hold)
        </button>
        <p id="delayStatusText" class="delay-text hidden-inline">
          ⏱️ <strong>Grace Extended:</strong> Position reserved until 45 mins past slot time.
        </p>
      </div>
    </div>
  `;

  // Trigger Point 04 Audio Dispatch automatically
  announceQueueStatus(tokenNumber, isPerishable ? "Scale Bay 1 Express" : "Scale Bay 1");
};

// Transit Breakdown Toggle Logic (Point 08)
window.handleTransitDelay = function (token) {
  const btn = document.getElementById("btnReportDelay");
  const msg = document.getElementById("delayStatusText");
  if (!btn || !msg) return;

  btn.disabled = true;
  btn.style.opacity = "0.6";
  btn.innerText = "Transit Grace Active (45m)";
  msg.classList.remove("hidden-inline");
  alert(`Pass ${token}: 45-minute breakdown grace applied. Token will not be cancelled by the APMC Gate.`);
};

// ============================================================
// NATIVE MULTILINGUAL SPEECH SYNTHESIZER
// ============================================================
window.announceQueueStatus = function (token, scaleBay) {
  if (!("speechSynthesis" in window)) return;

  const currentLang = document.getElementById("globalLanguageSelect")?.value || "en";
  let utteranceText = "";
  let voiceLang = "en-IN";

  if (currentLang === "hi") {
    utteranceText = `टोकन संख्या ${token}, कृपया तौल कांटा ${scaleBay} पर आगे बढ़ें।`;
    voiceLang = "hi-IN";
  } else if (currentLang === "bn") {
    utteranceText = `টোকেন নম্বর ${token}, অনুগ্রহ করে ওয়েটব্রিজ ${scaleBay} এ আসুন।`;
    voiceLang = "bn-IN";
  } else {
    utteranceText = `Attention Token ${token}, please advance to weighbridge ${scaleBay}.`;
    voiceLang = "en-IN";
  }

  const speakInst = new SpeechSynthesisUtterance(utteranceText);
  speakInst.lang = voiceLang;
  speakInst.rate = 0.95;
  
  // Cancel previous speech queues before announcing
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(speakInst);
};

window.addVehicleRow = function() {
  const container = document.getElementById("vehicleRepeaterContainer");
  if (!container) return;
  const count = container.children.length + 1;
  const div = document.createElement("div");
  div.className = "vehicle-row";
  div.style.marginTop = "6px";
  div.innerHTML = `<input type="text" class="applicant-input" placeholder="Sub-Lot Vehicle #${count} Plate Number" />`;
  container.appendChild(div);
};

window.disputeQualityGrade = function() {
  const reason = prompt("Enter specific reason for re-assaying dispute (e.g. Moisture calibration error):");
  if (reason) {
    alert(`⚖️ Grievance Dispatched to District Mandi Board. An APMC neutral arbiter has been assigned to Bay 01.`);
  }
};

// ============================================================
// 1. TWO-STAGE TARE & GUNNY BAG STANDARDIZATION (Points 17 & 18)
// ============================================================
window.runTwoStageMathEngine = function () {
  const gross = parseFloat(document.getElementById("wbGross")?.innerText || 0);
  const tare = parseFloat(document.getElementById("wbTare")?.innerText || 0);
  const bagTareUnit = parseFloat(document.getElementById("bagTypeSelect")?.value || 0);
  const bagCount = parseInt(document.getElementById("bagCountInput")?.value || 0);

  const totalBagTare = parseFloat((bagTareUnit * bagCount).toFixed(2));
  const netWeight = parseFloat((gross - tare - totalBagTare).toFixed(2));

  const wbBagTare = document.getElementById("wbBagTare");
  const wbNet = document.getElementById("wbNet");

  if (wbBagTare) wbBagTare.innerText = totalBagTare.toFixed(2);
  if (wbNet) wbNet.innerText = Math.max(0, netWeight).toFixed(2);
};

window.simulateSerialCapture = function (weightVal) {
  const liveReading = document.getElementById("liveScaleReading");
  if (liveReading) liveReading.innerText = weightVal.toFixed(2);

  if (weightVal > 80) {
    document.getElementById("wbGross").innerText = weightVal.toFixed(2);
  } else {
    document.getElementById("wbTare").innerText = weightVal.toFixed(2);
  }
  runTwoStageMathEngine();
};

// ============================================================
// 2. ICAR FAQ FORMULA DEDUCTION CALCULATOR (Point 19)
// ============================================================
window.runICAREvaluator = function () {
  const moisture = parseFloat(document.getElementById("qaMoisture")?.value || 0);
  const foreign = parseFloat(document.getElementById("qaForeign")?.value || 0);
  const damaged = parseFloat(document.getElementById("qaDamaged")?.value || 0);
  const baseMsp = 2275.0;

  const banner = document.getElementById("gradeBanner");
  const deductionSpan = document.getElementById("icarDeductionAmt");
  const finalMspSpan = document.getElementById("icarFinalMsp");

  if (moisture > 17.0) {
    banner.style.background = "#fee2e2";
    banner.style.color = "#991b1b";
    banner.innerText = "REJECTED: MOISTURE EXCEEDS 17.0% MANDI CAP";
    deductionSpan.innerText = "N/A";
    finalMspSpan.innerText = "₹0.00";
    return;
  }

  let deduction = 0.0;
  if (moisture > 14.0) deduction += (moisture - 14.0) * 0.01 * baseMsp;
  if (foreign > 1.0) deduction += ((foreign - 1.0) / 0.5) * (0.0075 * baseMsp);
  if (damaged > 2.0) deduction += (damaged - 2.0) * 0.01 * baseMsp;

  deduction = Math.min(deduction, baseMsp);
  const payable = (baseMsp - deduction).toFixed(2);

  banner.style.background = deduction === 0 ? "#dcfce7" : "#fef9c3";
  banner.style.color = deduction === 0 ? "#15803d" : "#854d0e";
  banner.innerText = deduction === 0 ? "GRADE A: 100% MSP COMPLIANT" : "FAQ ACCEPTED: STANDARD DEDUCTIONS APPLIED";

  if (deductionSpan) deductionSpan.innerText = `₹${deduction.toFixed(2)}`;
  if (finalMspSpan) finalMspSpan.innerText = `₹${payable}`;
};

// ============================================================
// 3. NO-SHOW STANDBY & COUNTER LOAD BALANCING (Points 20 & 22)
// ============================================================
window.handleStandbyNoShow = function () {
  const tokenSelect = document.getElementById("wbTokenSelect");
  const token = tokenSelect?.value || "TOKEN-UNKNOWN";
  
  logTamperAuditAction("OPERATOR_01", "STANDBY_HOLD", token, "Driver not at vehicle; pushed back 2 turns.");
  alert(`⏱️ Token ${token} marked as STANDBY. Position shifted behind 2 arrivals in the queue.`);
};

window.handleScaleBreakdown = function (bayName) {
  logTamperAuditAction("SUPERINTENDENT", "SCALE_BREAKDOWN_REROUTE", bayName, "Scale calibration failure; queue redirected to Bay 02.");
  alert(`⚠️ Emergency Alert: ${bayName} marked OFFLINE. All 8 waiting haulage units re-balanced to Bay 02.`);
};

// ============================================================
// 4. FCI OUTWARD CHALLAN DISPATCH (Point 26)
// ============================================================
window.generateFCIChallan = function () {
  const challanId = "FCI-CH-" + Math.floor(100000 + Math.random() * 900000);
  logTamperAuditAction("ASSAYER_01", "FCI_DISPATCH_ISSUED", challanId, "Approved grain allocated to FCI Silo 4 Railhead.");
  alert(`🏢 Outward Delivery Challan ${challanId} Generated!\nRouted To: Food Corporation of India Central Buffer Silo.`);
};

// ============================================================
// 5. STATUTORY LEDGER EXPORT & TAMPER LOG (Points 24 & 25)
// ============================================================
window.logTamperAuditAction = function (operator, action, token, details) {
  const tbody = document.getElementById("auditTableBody");
  const timestamp = new Date().toISOString().substring(0, 19);
  const hash = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);

  if (tbody) {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>#${tbody.children.length + 1}</td>
      <td>${timestamp}</td>
      <td>${operator}</td>
      <td>${action}</td>
      <td>${token}</td>
      <td>${details}</td>
      <td><code style="font-size:0.75rem;">${hash}</code></td>
    `;
    tbody.prepend(row);
  }
};

window.exportAPMCStatutoryLedger = function () {
  const csvContent = "data:text/csv;charset=utf-8," 
    + "Token,Farmer Name,Crop,Net Weight (Qtl),Assayed MSP,Total Payable (INR),PFMS Status\n"
    + "KQ-DEL-001,Ramesh Kumar,Wheat,99.26,2226.80,221032.17,VERIFIED_PFMS_READY\n"
    + "KQ-PUN-004,Gurpreet Singh,Basmati,140.20,3800.00,532760.00,VERIFIED_PFMS_READY";

  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", `APMC_Statutory_Ledger_${new Date().toISOString().split("T")[0]}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

// ============================================================
// SIH 2026 JURY DEMO: 12-FARMER DYNAMIC QUEUE SIMULATOR
// ============================================================
const SIH_MOCK_FARMERS = [
  // 1 & 2: Active at Weighbridge Scales
  { seq: 1, token: "KQ-DEL-001", name: "Ramesh Kumar", state: "Delhi", crop: "Wheat", load: "142.80 Qtl", status: "AT_SCALE", vehicle: "DL-1A-9821", gross: 142.8, tare: 42.5, bags: 180, priority: false },
  { seq: 2, token: "EXP-PUN-002", name: "Gurpreet Singh", state: "Punjab", crop: "Tomato", load: "65.40 Qtl", status: "AT_SCALE", vehicle: "PB-02-B-1124", gross: 65.4, tare: 22.1, bags: 210, priority: true },

  // 3 & 4: In Quality Assaying Lab (Testing Moisture)
  { seq: 3, token: "KQ-WB-003", name: "Subhash Ghosh", state: "West Bengal", crop: "Paddy", load: "110.20 Qtl", status: "IN_LAB", vehicle: "WB-24-K-4401", moisture: 13.8, foreign: 0.8, broken: 1.2, priority: false },
  { seq: 4, token: "EXP-HAR-004", name: "Manjeet Hooda", state: "Haryana", crop: "Green Chilli", load: "48.00 Qtl", status: "IN_LAB", vehicle: "HR-10-F-3902", moisture: 16.4, foreign: 1.9, broken: 2.5, priority: true },

  // 5 to 10: In-Line Waiting Queue
  { seq: 5, token: "KQ-UP-005", name: "Brijesh Yadav", state: "Uttar Pradesh", crop: "Mustard", load: "85.00 Qtl", status: "IN_LINE", vehicle: "UP-32-Z-7711", priority: false },
  { seq: 6, token: "KQ-MP-006", name: "Devendra Patel", state: "Madhya Pradesh", crop: "Wheat", load: "130.50 Qtl", status: "IN_LINE", vehicle: "MP-04-A-6520", priority: false },
  { seq: 7, token: "EXP-MAH-007", name: "Sachin Shinde", state: "Maharashtra", crop: "Tomato", load: "72.30 Qtl", status: "IN_LINE", vehicle: "MH-12-P-9081", priority: true },
  { seq: 8, token: "KQ-RAJ-008", name: "Kailash Gurjar", state: "Rajasthan", crop: "Mustard", load: "94.20 Qtl", status: "IN_LINE", vehicle: "RJ-14-M-4322", priority: false },
  { seq: 9, token: "KQ-BIH-009", name: "Manoj Mahto", state: "Bihar", crop: "Paddy", load: "105.00 Qtl", status: "IN_LINE", vehicle: "BR-01-T-8829", priority: false },
  { seq: 10, token: "KQ-ODI-010", name: "Bijay Mohanty", state: "Odisha", crop: "Paddy", load: "88.60 Qtl", status: "IN_LINE", vehicle: "OD-02-C-1903", priority: false },

  // 11 & 12: Completed & DBT Disbursed
  { seq: 11, token: "KQ-DEL-098", name: "Satish Chand", state: "Delhi", crop: "Wheat", load: "120.00 Qtl", status: "DISBURSED", vehicle: "DL-1M-4011", priority: false },
  { seq: 12, token: "KQ-PUN-099", name: "Balwinder Brar", state: "Punjab", crop: "Wheat", load: "155.00 Qtl", status: "DISBURSED", vehicle: "PB-03-D-9988", priority: false }
];

window.launchSihJuryDemo = function () {
  // 1. Populate Officer Operator Queue Table
  const tbody = document.getElementById("operator-queue-tbody");
  if (tbody) {
    tbody.innerHTML = "";
    SIH_MOCK_FARMERS.forEach((farmer) => {
      let badgeStyle = "background:#f1f5f9; color:#475569;";
      let statusLabel = farmer.status;

      if (farmer.status === "AT_SCALE") {
        badgeStyle = "background:#dbeafe; color:#1d4ed8; font-weight:700;";
        statusLabel = "At Scale (Bay 01)";
      } else if (farmer.status === "IN_LAB") {
        badgeStyle = "background:#fef9c3; color:#854d0e; font-weight:700;";
        statusLabel = "In Assaying Lab";
      } else if (farmer.status === "IN_LINE") {
        badgeStyle = "background:#f8fafc; color:#334155;";
        statusLabel = "In Line (Gate Waiting)";
      } else if (farmer.status === "DISBURSED") {
        badgeStyle = "background:#dcfce7; color:#15803d; font-weight:700;";
        statusLabel = "✅ PFMS Disbursed";
      }

      const priorityTag = farmer.priority 
        ? `<span style="background:#fee2e2; color:#dc2626; font-size:0.68rem; padding:2px 6px; border-radius:4px; margin-left:6px; font-weight:800;">⚡ EXPRESS</span>` 
        : "";

      const row = document.createElement("tr");
      row.innerHTML = `
        <td><strong>#${farmer.seq}</strong></td>
        <td><strong style="color:#0f172a; font-family:monospace;">${farmer.token}</strong> ${priorityTag}</td>
        <td>${farmer.name} <small style="color:#64748b;">(${farmer.state})</small></td>
        <td>${farmer.load}</td>
        <td><span style="padding:4px 8px; border-radius:6px; font-size:0.75rem; display:inline-block; ${badgeStyle}">${statusLabel}</span></td>
      `;
      tbody.appendChild(row);
    });
  }

  // 2. Update Live Telemetry Metrics & Yard Utilization Bar
  const totalEl = document.getElementById("metric-total");
  const waitingEl = document.getElementById("metric-waiting");
  const procEl = document.getElementById("metric-processing");
  const doneEl = document.getElementById("metric-completed");
  const workloadEl = document.getElementById("workload-percent");
  const workloadBar = document.getElementById("workload-bar");

  if (totalEl) totalEl.innerText = "12";
  if (waitingEl) waitingEl.innerText = "6";
  if (procEl) procEl.innerText = "4"; // 2 at scale, 2 in lab
  if (doneEl) doneEl.innerText = "2";
  if (workloadEl) workloadEl.innerText = "78%";
  if (workloadBar) {
    workloadBar.style.width = "78%";
    workloadBar.style.background = "#f59e0b"; // Warning amber at 78% capacity
  }

  // 3. Populate Weighbridge Token Select Dropdown
  const wbSelect = document.getElementById("wbTokenSelect");
  if (wbSelect) {
    wbSelect.innerHTML = "";
    SIH_MOCK_FARMERS.filter(f => f.status === "AT_SCALE" || f.status === "IN_LINE").forEach(f => {
      const opt = document.createElement("option");
      opt.value = f.token;
      opt.innerText = `${f.token} (${f.name} - ${f.crop} - ${f.vehicle})`;
      wbSelect.appendChild(opt);
    });
    // Prime the first vehicle
    wbSelect.value = "KQ-DEL-001";
    simulateSerialCapture(142.80);
  }

  // 4. Update Big-Screen LED Yard Display (/display)
  const ledBay1 = document.getElementById("ledBay1Token");
  const ledBay2 = document.getElementById("ledBay2Token");
  if (ledBay1) ledBay1.innerText = "KQ-DEL-001";
  if (ledBay2) ledBay2.innerText = "EXP-PUN-002";

  // 5. Append Automated Action to Secretary Tamper Ledger
  if (window.logTamperAuditAction) {
    logTamperAuditAction("SYSTEM_INIT", "SIH_BATCH_SIMULATION", "12_ENTRIES", "Multi-state arrival batch auto-injected for jury demonstration.");
  }

  // 6. Native Audio Voice Announcement (First Token In Line)
  if (window.announceQueueStatus) {
    window.announceQueueStatus("KQ DEL 001", "Bay 01");
  }

  // 7. Interactive Toast Confirmation
  const existingToast = document.querySelector(".sih-demo-toast");
  if (existingToast) existingToast.remove();

  const toast = document.createElement("div");
  toast.className = "sih-demo-toast";
  toast.innerHTML = `
    <strong>⚡ SIH Demo Injected Successfully!</strong><br>
    • 12 Farmers Loaded across 8 Indian States<br>
    • Express Perishable Priority routed to Bay 02<br>
    • Yard Utilization calibrated to <strong>78%</strong><br>
    • Speech Engine triggered voice gate call
  `;
  document.body.appendChild(toast);
  setTimeout(() => toast.remove(), 6000);
};

// ============================================================
// FINANCIAL DATA RECORD STORE (POINTS 27 - 36)
// ============================================================
const LOT_FINANCIAL_DATABASE = {
  "KQ-DEL-001": {
    farmer_name: "Ramesh Kumar",
    reg_id: "KB-982145",
    crop: "Wheat (FAQ Grade A)",
    net_weight: 99.26,
    gross_weight: 142.80,
    tare_weight: 42.50,
    bag_tare: 1.04,
    unit_msp: 2226.80,
    account: "987654321012",
    ifsc: "SBIN0001234"
  },
  "KQ-PUN-004": {
    farmer_name: "Gurpreet Singh",
    reg_id: "PB-776102",
    crop: "Paddy (Grade A)",
    net_weight: 140.20,
    gross_weight: 185.20,
    tare_weight: 45.00,
    bag_tare: 1.20,
    unit_msp: 2320.00,
    account: "112233445566",
    ifsc: "PUNB0112200"
  }
};

// Point 27, 28, 29 & 34: Real-Time Financial Multiplier
window.runLiveFinancialEngine = function () {
  const token = document.getElementById("settleTokenSelect")?.value || "KQ-DEL-001";
  const lot = LOT_FINANCIAL_DATABASE[token];
  if (!lot) return;

  const netWeight = lot.net_weight;
  const unitMsp = lot.unit_msp;
  const cashAdvance = parseFloat(document.getElementById("settleCashAdvance")?.value || 0);

  // Math Calculations
  const grossVal = netWeight * unitMsp;
  const hamaliSubsidy = netWeight * 14.50; // ₹14.50/Qtl unloading credit
  const mandiCess = grossVal * 0.017;      // 1.7% Combined Mandi & Weigh cess
  const netPayable = (grossVal + hamaliSubsidy) - cashAdvance;

  // Render to DOM
  const elNet = document.getElementById("settleNetWeight");
  const elMsp = document.getElementById("settleUnitMsp");
  const elGross = document.getElementById("settleGrossVal");
  const elHamali = document.getElementById("settleHamaliSub");
  const elCess = document.getElementById("settleMandiCess");
  const elAdvance = document.getElementById("settleAdvanceVal");
  const elTotal = document.getElementById("settleNetPayable");

  if (elNet) elNet.innerText = netWeight.toFixed(2);
  if (elMsp) elMsp.innerText = unitMsp.toFixed(2);
  if (elGross) elGross.innerText = grossVal.toLocaleString("en-IN", { minimumFractionDigits: 2 });
  if (elHamali) elHamali.innerText = hamaliSubsidy.toLocaleString("en-IN", { minimumFractionDigits: 2 });
  if (elCess) elCess.innerText = mandiCess.toLocaleString("en-IN", { minimumFractionDigits: 2 });
  if (elAdvance) elAdvance.innerText = cashAdvance.toFixed(2);
  if (elTotal) elTotal.innerText = Math.max(0, netPayable).toLocaleString("en-IN", { minimumFractionDigits: 2 });
};

window.syncSettlementLot = function (tokenKey) {
  const lot = LOT_FINANCIAL_DATABASE[tokenKey];
  if (!lot) return;

  const bankAcc = document.getElementById("bankAccNumber");
  const bankIfsc = document.getElementById("bankIfsc");
  if (bankAcc) bankAcc.value = lot.account;
  if (bankIfsc) bankIfsc.value = lot.ifsc;

  runLiveFinancialEngine();
};

// Point 35: Penny-Drop Bank Account Verifier
window.triggerPennyDropTest = function () {
  const statusPill = document.getElementById("pennyDropStatus");
  if (!statusPill) return;

  statusPill.className = "status-pill status-connecting";
  statusPill.innerHTML = "🟡 Pinging NPCI Bank Switch...";

  setTimeout(() => {
    statusPill.className = "status-pill status-connected";
    statusPill.innerHTML = "🟢 Confirmed: Active Beneficiary Account";
    alert("✅ Penny-Drop Verified: NPCI / PFMS reports account ACTIVE with ₹1.00 credit test confirmed.");
  }, 900);
};

// Point 33: Split-Payment Percentage Controller
window.toggleSplitPaymentUI = function (isChecked) {
  const container = document.getElementById("splitAccountsContainer");
  if (!container) return;
  container.classList.toggle("hidden-inline", !isChecked);
};

window.recalcSplitPercentages = function () {
  const selfShare = parseInt(document.getElementById("splitShareSelf")?.value || 60);
  const coOwnerInput = document.getElementById("splitShareCoOwner");
  if (coOwnerInput) {
    const clampedSelf = Math.max(1, Math.min(99, selfShare));
    coOwnerInput.value = 100 - clampedSelf;
  }
};

// Point 36: Commercial Trader Invoicing Toggle
window.toggleCommercialGstUI = function (isChecked) {
  const box = document.getElementById("commercialGstBox");
  if (box) box.classList.toggle("hidden-inline", !isChecked);
};

// Points 31 & 32: Open Electronic Parcha (PDF-Ready Modal)
window.openEParchaModal = function () {
  const token = document.getElementById("settleTokenSelect")?.value || "KQ-DEL-001";
  const lot = LOT_FINANCIAL_DATABASE[token];
  if (!lot) return;

  const cashAdvance = parseFloat(document.getElementById("settleCashAdvance")?.value || 0);
  const grossVal = lot.net_weight * lot.unit_msp;
  const hamali = lot.net_weight * 14.50;
  const netDbt = (grossVal + hamali) - cashAdvance;

  const isSplit = document.getElementById("chkSplitPayment")?.checked;
  const selfSharePct = parseInt(document.getElementById("splitShareSelf")?.value || 60);

  // Populate Printable Slip Fields
  document.getElementById("slipParchaId").innerText = `KQ-EP-2026-${Math.floor(1000 + Math.random() * 9000)}`;
  document.getElementById("slipTokenNum").innerText = token;
  document.getElementById("slipFarmerName").innerText = lot.farmer_name;
  document.getElementById("sigFarmerName").innerText = lot.farmer_name;
  document.getElementById("slipDate").innerText = new Date().toLocaleDateString("en-IN", { day: '2-digit', month: 'short', year: 'numeric' });
  document.getElementById("slipCrop").innerText = lot.crop;
  document.getElementById("slipGross").innerText = lot.gross_weight.toFixed(2);
  document.getElementById("slipTare").innerText = lot.tare_weight.toFixed(2);
  document.getElementById("slipBagTare").innerText = lot.bag_tare.toFixed(2);
  document.getElementById("slipNet").innerText = lot.net_weight.toFixed(2);
  document.getElementById("slipRate").innerText = lot.unit_msp.toFixed(2);
  document.getElementById("slipGrossVal").innerText = grossVal.toLocaleString("en-IN", { minimumFractionDigits: 2 });
  document.getElementById("slipHamali").innerText = hamali.toLocaleString("en-IN", { minimumFractionDigits: 2 });
  document.getElementById("slipAdvance").innerText = cashAdvance.toFixed(2);
  document.getElementById("slipNetDbt").innerText = netDbt.toLocaleString("en-IN", { minimumFractionDigits: 2 });

  // Render Split Accounts on Parcha if applicable
  const splitWrapper = document.getElementById("slipSplitAllocationWrapper");
  if (splitWrapper) {
    if (isSplit) {
      const coOwnerPct = 100 - selfSharePct;
      const selfAmount = (selfSharePct / 100) * netDbt;
      const coOwnerAmount = (coOwnerPct / 100) * netDbt;
      splitWrapper.innerHTML = `
        <div style="background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 6px; padding: 8px; margin: 10px 0; font-size: 0.8rem;">
          <strong>Joint Landholding Split Payment Allocation:</strong><br>
          • ${lot.farmer_name} (Primary - ${selfSharePct}%): <strong>₹${selfAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</strong> [Ac: XXXXXX${lot.account.slice(-4)}]<br>
          • Suresh Kumar (Co-Owner - ${coOwnerPct}%): <strong>₹${coOwnerAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</strong> [Ac: XXXXXX9912]
        </div>
      `;
    } else {
      splitWrapper.innerHTML = `
        <div style="font-size: 0.78rem; color: #475569; margin: 6px 0;">
          <strong>DBT Routing Account:</strong> Certified NPCI Beneficiary [Ac: XXXXXX${lot.account.slice(-4)} | IFSC: ${lot.ifsc}]
        </div>
      `;
    }
  }

  const modal = document.getElementById("modal-eparcha-voucher");
  if (modal) modal.classList.remove("hidden-inline");
};

window.closeEParchaModal = function () {
  const modal = document.getElementById("modal-eparcha-voucher");
  if (modal) modal.classList.add("hidden-inline");
};

window.triggerVoiceDisputeDictation = function () {
  const modal = document.getElementById("ai-assistant-modal");
  if (modal) modal.classList.remove("ai-modal-hidden");
  
  // Switch to Chat Stream view in modal
  const modeSelector = document.getElementById("ai-mode-selector");
  const modalBody = document.getElementById("ai-modal-body");
  if (modeSelector) modeSelector.style.display = "none";
  if (modalBody) {
    modalBody.classList.remove("ai-modal-body-hidden");
    modalBody.style.display = "flex";
  }

  const micBtn = document.getElementById("ai-mic-btn");
  if (micBtn) micBtn.click();
};

window.submitVoiceDispute = function () {
  const reason = document.getElementById("disputeReasonBox")?.value.trim();
  if (!reason) {
    alert("Please dictate or type dispute reasons before submitting.");
    return;
  }
  if (window.logTamperAuditAction) {
    logTamperAuditAction("FARMER_VOICE", "ARBITRATION_LODGED", "BAY_01", reason);
  }
  alert(`⚖️ Spoken Grievance Dispatched to District Mandi Arbiter!\nRecorded Statement: "${reason}"`);
};