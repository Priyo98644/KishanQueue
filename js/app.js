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
// 2. PAN-INDIA MULTILINGUAL TRANSLATION DICTIONARY
// ============================================================
const I18N_DICTIONARY = {
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
    login_note: "<strong>National APMC Advisory:</strong> Farmers can claim appointments, check status, and audit DBT bank transfers via <strong>ONLINE</strong> portal mode or <strong>OFFLINE</strong> Mandi Helpdesks."
  },
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
    login_note: "<strong>राष्ट्रीय परामर्श:</strong> किसान ऑनलाइन पोर्टल या मंडी हेल्पडेस्क से टोकन बुक कर सकते हैं।"
  },
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
    login_note: "<strong>পরামর্শ:</strong> কৃষক বন্ধু আইডি বা কেসিসি দিয়ে লগইন করে ঝামেলামুক্ত স্লট বুক করুন।"
  },
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
    login_note: "<strong>ସୂଚନା:</strong> କୃଷକମାନେ ଘରେ ବସି ନିଜ ଫସଲ ବିକ୍ରୟ ପାଇଁ ଡିଜିଟାଲ୍ ଟୋକନ୍ ବୁକ୍ କରିପାରିବେ।"
  },
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
    login_note: "<strong>পৰামৰ্শ:</strong> কৃষকে ঘৰতে বহি নিজৰ শস্য বিক্ৰীৰ বাবে ডিজিটেল টোকেন ল'ব পাৰে।"
  },
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
    login_note: "<strong>U·iatani:</strong> Game-ge·giparang online ba Mandi Helpdesk gita digital token man·gen."
  },
  sat: {
    tagline: "ᱫᱤᱥᱚᱢ ᱨᱮᱱᱟᱜ ᱢᱤᱫᱩᱱ APMC ᱪᱟᱥ ᱟᱨᱡᱟᱣ ᱯᱚᱨᱴᱟᱞ",
    btn_home: "ᱢᱩᱬᱩᱛ ᱥᱟᱦᱴᱟ",
    gov_badge: "ᱪᱟᱥ ᱟᱨ ᱪᱟᱹᱥᱤ ᱵᱷᱟᱹᱞᱟᱹᱭ ᱢᱚᱱᱛᱨᱟᱲᱚᱭ • ᱵᱷᱟᱨᱚᱛ ᱥᱚᱨᱠᱟᱨ",
    hero_title: "ᱡᱟᱹᱛᱤᱭᱟᱹᱨᱤ ᱪᱟᱥ ᱢᱟᱱᱰᱤ ᱜᱮᱴᱣᱮ ᱟᱨ ᱠᱚᱱᱴᱨᱚᱞ ᱴᱟᱨᱢᱤᱱᱟᱞ",
    hero_sub: "ᱪᱟᱹᱥᱤ ᱠᱚ ᱞᱟᱹᱜᱤᱫ ᱰᱤᱡᱤᱴᱟᱞ ᱠᱤᱨᱤᱧ-ᱟᱹᱠᱷᱨᱤᱧ, ᱛᱩᱞᱟᱹ ᱫᱷᱟᱹᱲ ᱟᱨ ᱵᱮᱸᱠ ᱨᱮ ᱥᱚᱡᱷᱮ MSP ᱴᱟᱠᱟ",
    pill_public: "ᱥᱟᱱᱟᱢ ᱦᱚᱲ ᱵᱚᱞᱚᱱ",
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
    login_note: "<strong>ᱩᱪᱷᱟᱹᱱ:</strong> ᱪᱟᱹᱥᱤ ᱠᱚ ᱚᱲᱟᱜ ᱨᱮ ᱫᱩᱲᱩᱵ ᱠᱟᱛᱮ ᱰᱤᱡᱤᱴᱟᱞ ᱴᱳᱠᱮᱱ ᱠᱚ ᱵᱮᱱᱟᱣ ᱫᱟᱲᱮᱭᱟᱜ-ᱟ।"
  },
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
    login_note: "<strong>फोसावनाय:</strong> आबादारिफोरा न'आव थानि थानिनो दिजितेल टोकन बुकिं खालामनो हागोन।"
  },
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
    form_sub: "डिजिटल कतार टोकन लेल फसfullक विवरण भरू।",
    kyc_step: "चरण १: किसान पहचान सत्यापन",
    kyc_desc: "सरकारी डेटाबेस सं विवरण भरय लेल किसान आईडी भरू।",
    btn_verify_id: "आईडी सत्यापित करू",
    lbl_name: "१. किसानक पूरा नाम",
    lbl_phone: "२. मोबाइल नंबर",
    lbl_village: "३. गाम / प्रखंड / ब्लॉक",
    lbl_centre: "४. खरीद केंद्र (मंडी)",
    lbl_crop: "५. फसfullक प्रकार",
    lbl_qty: "६. फसfullक मात्रा (क्विंटल)",
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
    login_note: "<strong>सूचना:</strong> किसान घर बैसि अपन फसfullक लेल डिजिटल टोकन बुक कऽ सकैत छथि।"
  },
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
    login_note: "<strong>ಸೂಚನೆ:</strong> ರೈತರು ಮನೆಯಿಂದಲೇ ಆನ್‌ಲೈನ್ ಮೂಲಕ ಡಿಜಿಟಲ್ ಟೋಕನ್ ಪಡೆಯಬಹುದು."
  },
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
    login_note: "<strong>അറിയിപ്പ്:</strong> കർഷകർക്ക് മുൻകൂട്ടി ഡിജിറ്റൽ ടോക്കൺ എടുത്ത് ഉൽപ്പന്നങ്ങൾ വിൽക്കാം."
  }
};

// Aliases for matching regional variants
I18N_DICTIONARY.pa = I18N_DICTIONARY.pa || I18N_DICTIONARY.hi;
I18N_DICTIONARY.mr = I18N_DICTIONARY.mr || I18N_DICTIONARY.hi;
I18N_DICTIONARY.te = I18N_DICTIONARY.te || I18N_DICTIONARY.en;
I18N_DICTIONARY.ta = I18N_DICTIONARY.ta || I18N_DICTIONARY.en;
I18N_DICTIONARY.gu = I18N_DICTIONARY.gu || I18N_DICTIONARY.hi;

// Web Speech Synthesis & Recognition standard regional tags
const SPEECH_LANG_MAP = {
  en: "en-IN",
  hi: "hi-IN",
  bn: "bn-IN",
  or: "or-IN",
  as: "as-IN",
  grt: "en-IN", // Fallback voice for Garo phonetics
  sat: "hi-IN", // Fallback regional voice for Santali
  brx: "as-IN", // Fallback regional voice for Bodo
  mai: "hi-IN", // Maithili phonetics
  kn: "kn-IN",
  ml: "ml-IN",
  pa: "pa-IN",
  mr: "mr-IN",
  te: "te-IN",
  ta: "ta-IN",
  gu: "gu-IN"
};

function applyLanguage(langCode) {
  const dict = I18N_DICTIONARY[langCode] || I18N_DICTIONARY.en;
  const enDict = I18N_DICTIONARY.en;
  state.currentLang = langCode;
  localStorage.setItem("kq_lang", langCode);

  // 1. Text elements with fallback to English
  document.querySelectorAll("[data-i18n]").forEach(el => {
    const key = el.getAttribute("data-i18n");
    el.innerHTML = dict[key] || enDict[key] || "";
  });

  // 2. Input placeholders localized
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

  // 3. Sync Web Speech Recognition & Synthesizer Language
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
    "panel-operator"
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

  const btnWeighbridge = document.getElementById("btn-enter-operator-weighbridge");
  if (btnWeighbridge) {
    btnWeighbridge.addEventListener("click", () => window.switchPanel("panel-operator", "OPERATOR"));
  }

  const btnAssayer = document.getElementById("btn-enter-operator-assayer");
  if (btnAssayer) {
    btnAssayer.addEventListener("click", () => window.switchPanel("panel-operator", "OPERATOR"));
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
// 7. WEBSOCKET REAL-TIME ENGINE
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
  // Start cleanly on the Gateway
  window.switchPanel("panel-gateway", "GATEWAY");

  initRouter();
  initPanIndiaApplicantLogin();
  initBookingModule();
  initWebSocket();

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