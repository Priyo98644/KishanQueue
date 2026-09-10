// ==========================================================================
// KISANQUEUE - SMART AGRICULTURAL AI & MANDI HELPDESK CONTROLLER
// ==========================================================================

document.addEventListener("DOMContentLoaded", () => {
  const triggerBtn = document.getElementById("ai-trigger-btn");
  const modal = document.getElementById("ai-assistant-modal");
  const closeBtns = document.querySelectorAll(".ai-modal-close-btn");
  const langSelect = document.getElementById("ai-language-select");

  const iconCaller = document.getElementById("icon-caller");
  const iconAgroAi = document.getElementById("icon-agro-ai");
  const viewHelpline = document.getElementById("widget-view-helpline");
  const viewAi = document.getElementById("widget-view-ai");

  const agroAiTitle = document.getElementById("agro-ai-title");
  const agroAiSub = document.getElementById("agro-ai-sub");
  const btnModeTitle = document.getElementById("btn-mode-title");
  const btnModeDesc = document.getElementById("btn-mode-desc");

  const modeSelector = document.getElementById("ai-mode-selector");
  const modalBody = document.getElementById("ai-modal-body");
  const btnModeForm = document.getElementById("btn-mode-form");
  const btnModeQuery = document.getElementById("btn-mode-query");
  const btnBack = document.getElementById("ai-btn-back");

  const stepIndicator = document.getElementById("ai-step-indicator");
  const chatStream = document.getElementById("ai-chat-stream");
  const micBtn = document.getElementById("ai-mic-btn");
  const micLabel = document.getElementById("ai-mic-label");
  const micStatus = document.getElementById("ai-mic-status");

  // Portal Context: 'GATEWAY', 'FARMER', or 'OPERATOR'
  let currentContext = "GATEWAY";
  let currentMode = null; // 'FORM' or 'QUERY'
  let currentStep = 0;
  let isListening = false;

  // 7 Sequential Form Steps
  const FORM_STEPS = [
    {
      fieldId: "farmer_name",
      name: "Farmer Name",
      prompts: {
        "bn-IN": "আপনার নাম বলুন।",
        "hi-IN": "कृपया अपना नाम बताइए।",
        "en-IN": "Please speak your name."
      },
      process: (transcript) => transcript.trim()
    },
    {
      fieldId: "mobile",
      name: "Mobile Number",
      prompts: {
        "bn-IN": "আপনার ১০ সংখ্যার মোবাইল নম্বরটি বলুন।",
        "hi-IN": "अपना 10 अंकों का मोबाइल नंबर बोलिए।",
        "en-IN": "Please tell me your 10-digit mobile number."
      },
      process: (transcript) => {
        const digits = transcript.replace(/\D/g, "");
        return digits.length >= 10 ? digits.slice(-10) : digits;
      }
    },
    {
      fieldId: "village",
      name: "Village / Tehsil",
      prompts: {
        "bn-IN": "আপনার গ্রাম বা ব্লকের নাম বলুন।",
        "hi-IN": "अपने गाँव या तहसील का नाम बताइए।",
        "en-IN": "What is your village or tehsil name?"
      },
      process: (transcript) => transcript.trim()
    },
    {
      fieldId: "centre_id",
      name: "Procurement Centre",
      prompts: {
        "bn-IN": "কোন সেন্টারে যাবেন? সেন্টার এ, সেন্টার বি, নাকি সেন্টার সি?",
        "hi-IN": "किस सेंटर पर जाएंगे? सेंटर A, सेंटर B, या सेंटर C?",
        "en-IN": "Which centre would you like to register for? Centre A, B, or C?"
      },
      process: (transcript) => {
        const t = transcript.toLowerCase();
        if (t.includes("b") || t.includes("বি")) return "Centre B";
        if (t.includes("c") || t.includes("সি")) return "Centre C";
        return "Centre A";
      }
    },
    {
      fieldId: "crop",
      name: "Crop Type",
      prompts: {
        "bn-IN": "কোন ফসল বিক্রি করবেন? ধান, গম, নাকি সর্ষে?",
        "hi-IN": "कौन सी फसल बेचेंगे? धान, गेहूं, या सरसों?",
        "en-IN": "Which crop? Paddy, Wheat, or Mustard?"
      },
      process: (transcript) => {
        const t = transcript.toLowerCase();
        if (t.includes("ধান") || t.includes("चावल") || t.includes("paddy") || t.includes("rice")) return "Paddy";
        if (t.includes("সর্ষে") || t.includes("सरसों") || t.includes("mustard")) return "Mustard";
        return "Wheat";
      }
    },
    {
      fieldId: "quantity",
      name: "Quantity (Quintals)",
      prompts: {
        "bn-IN": "কত কুইন্টাল ফসল বিক্রি করবেন?",
        "hi-IN": "आपकी फसल कितने क्विंटल है?",
        "en-IN": "How many quintals do you have?"
      },
      process: (transcript) => {
        const numbers = transcript.match(/\d+(\.\d+)?/);
        return numbers ? parseFloat(numbers[0]) : 40;
      }
    },
    {
      fieldId: "slot_time",
      name: "Preferred Slot",
      prompts: {
        "bn-IN": "কোন সময় আসবেন? সকাল ৯টা, বেলা ১১টা, নাকি দুপুর ২টো?",
        "hi-IN": "किस समय आएंगे? सुबह 9 बजे, 11 बजे, या दोपहर 2 बजे?",
        "en-IN": "Preferred arrival slot? Morning, Mid-Day, or Afternoon?"
      },
      process: (transcript) => {
        const t = transcript.toLowerCase();
        if (t.includes("11") || t.includes("১১") || t.includes("mid") || t.includes("বেলা")) return "11:00 AM - 01:00 PM";
        if (t.includes("2") || t.includes("২") || t.includes("দুপুর") || t.includes("afternoon")) return "02:00 PM - 04:00 PM";
        return "09:00 AM - 11:00 AM";
      }
    }
  ];

  // Speech Recognition API
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  let recognition = null;

  if (SpeechRecognition) {
    recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onstart = () => {
      isListening = true;
      micBtn.classList.add("listening");
      micLabel.innerText = "Listening...";
      micStatus.innerText = "শুনছি... বলুন (Speak now)";
    };

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      appendChat("user", transcript);
      handleSpeechInput(transcript);
    };

    recognition.onerror = (e) => {
      console.warn("Speech error:", e.error);
      micStatus.innerText = "Could not catch that. Please tap and try again.";
      stopListeningUI();
    };

    recognition.onend = () => {
      stopListeningUI();
    };
  }

  function stopListeningUI() {
    isListening = false;
    micBtn.classList.remove("listening");
    micLabel.innerText = "Tap to Speak";
  }

  function speak(text) {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = langSelect.value;
    window.speechSynthesis.speak(utterance);
  }

  function appendChat(role, message) {
    const bubble = document.createElement("div");
    bubble.className = `chat-bubble ${role === "ai" ? "bubble-ai" : "bubble-user"}`;
    bubble.innerText = message;
    chatStream.appendChild(bubble);
    chatStream.scrollTop = chatStream.scrollHeight;
  }

  // Global Context Switcher (Called by app.js when views change)
  window.updateFloatingWidgetContext = function(context) {
    currentContext = context;
    modal.classList.add("ai-modal-hidden");
    if (window.speechSynthesis) window.speechSynthesis.cancel();

    if (context === "GATEWAY") {
      // 1. Gateway Mode: Phone Caller Icon & Pure Helpline Card
      triggerBtn.className = "mode-helpline";
      triggerBtn.title = "Mandi Helpdesk Phone";
      iconCaller.classList.add("active");
      iconAgroAi.classList.remove("active");

      viewHelpline.classList.add("active");
      viewAi.classList.remove("active");
    } else {
      // 2. Portal Mode: Smart Agricultural AI Sprout
      triggerBtn.className = "mode-agro-ai";
      triggerBtn.title = "Kisan Agro AI Copilot";
      iconCaller.classList.remove("active");
      iconAgroAi.classList.add("active");

      viewHelpline.classList.remove("active");
      viewAi.classList.add("active");

      // Tailor content for Farmer vs Officer
      if (context === "FARMER") {
        agroAiTitle.innerText = "Kisan Sahayak AI";
        agroAiSub.innerText = "Smart Farmer Voice Assistant";
        btnModeTitle.innerText = "ভয়েস দিয়ে ফর্ম পূরণ";
        btnModeDesc.innerText = "Voice Form Booking (Step-by-Step)";
      } else if (context === "OPERATOR") {
        agroAiTitle.innerText = "Mandi Yard AI Copilot";
        agroAiSub.innerText = "Weighbridge & Queue Operator Desk";
        btnModeTitle.innerText = "ভয়েস কিউ কন্ট্রোল";
        btnModeDesc.innerText = "Call Next / Query Queue Congestion";
      }

      // Reset internal AI menu
      modalBody.style.display = "none";
      modeSelector.style.display = "flex";
    }
  };

  // Toggle Popup
  triggerBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    modal.classList.toggle("ai-modal-hidden");
  });

  closeBtns.forEach(btn => {
    btn.addEventListener("click", () => {
      modal.classList.add("ai-modal-hidden");
      if (window.speechSynthesis) window.speechSynthesis.cancel();
    });
  });

  // Mode 1 Trigger
  btnModeForm.addEventListener("click", () => {
    modeSelector.style.display = "none";
    modalBody.style.display = "flex";
    chatStream.innerHTML = "";

    if (currentContext === "OPERATOR") {
      currentMode = "OPERATOR_VOICE";
      stepIndicator.innerText = "Operator Voice Action";
      const prompt = "আপনি বলতে পারেন 'Call next' অথবা 'Queue status' জানার জন্য।";
      appendChat("ai", prompt);
      speak(prompt);
    } else {
      currentMode = "FORM";
      currentStep = 0;
      askCurrentFormStep();
    }
  });

  // Mode 2 Trigger
  btnModeQuery.addEventListener("click", () => {
    currentMode = "QUERY";
    modeSelector.style.display = "none";
    modalBody.style.display = "flex";
    stepIndicator.innerText = "Agro & Mandi Help";
    chatStream.innerHTML = "";

    const intro = langSelect.value === "bn-IN"
      ? "নমস্কার! MSP রেট, আর্দ্রতার সীমা বা মান্ডি নিয়মাবলী সংক্রান্ত যেকোনো প্রশ্ন করুন।"
      : langSelect.value === "hi-IN"
      ? "नमस्ते! MSP दर, नमी या मंडी नियमों को लेकर कोई भी सवाल आप मुझसे पूछ सकते हैं।"
      : "Ask any question regarding Mandi rules, moisture tolerances, or MSP rates.";

    appendChat("ai", intro);
    speak(intro);
  });

  // Back to AI Menu
  btnBack.addEventListener("click", () => {
    modalBody.style.display = "none";
    modeSelector.style.display = "flex";
    if (window.speechSynthesis) window.speechSynthesis.cancel();
    if (recognition && isListening) recognition.stop();
  });

  // Mic Button Click
  micBtn.addEventListener("click", () => {
    if (!recognition) return alert("Speech recognition is only supported on Chrome / Edge browsers.");
    if (isListening) {
      recognition.stop();
    } else {
      recognition.lang = langSelect.value;
      try {
        recognition.start();
      } catch (err) {
        console.warn(err);
      }
    }
  });

  function askCurrentFormStep() {
    if (currentStep >= FORM_STEPS.length) {
      stepIndicator.innerText = "Completed";
      const finalMsg = langSelect.value === "bn-IN"
        ? "সব তথ্য পূরণ করা হয়েছে! এবার 'Generate Pass' বাটনে ক্লিক করুন।"
        : langSelect.value === "hi-IN"
        ? "सभी जानकारी भर दी गई है! अब 'Generate Pass' बटन दबाएं।"
        : "All fields filled! You can now click Generate Pass.";

      appendChat("ai", finalMsg);
      speak(finalMsg);
      micStatus.innerText = "Done! Form is populated.";

      const submitBtn = document.getElementById("generatePassSubmitBtn");
      if (submitBtn) {
        submitBtn.scrollIntoView({ behavior: "smooth", block: "center" });
        submitBtn.style.outline = "3px solid #10b981";
      }
      return;
    }

    const step = FORM_STEPS[currentStep];
    stepIndicator.innerText = `Step ${currentStep + 1} of ${FORM_STEPS.length}: ${step.name}`;
    const question = step.prompts[langSelect.value] || step.prompts["en-IN"];

    appendChat("ai", question);
    speak(question);
    micStatus.innerText = `Prompting: ${step.name}`;

    const targetInput = document.getElementById(step.fieldId);
    if (targetInput) {
      targetInput.focus();
      targetInput.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }

  function handleSpeechInput(transcript) {
    if (currentMode === "FORM") {
      const step = FORM_STEPS[currentStep];
      const parsedValue = step.process(transcript);

      const el = document.getElementById(step.fieldId);
      if (el) {
        el.value = parsedValue;
        el.dispatchEvent(new Event("change"));
      }

      currentStep++;
      setTimeout(() => {
        askCurrentFormStep();
      }, 700);
    } else if (currentMode === "OPERATOR_VOICE") {
      resolveOperatorVoiceCommand(transcript);
    } else if (currentMode === "QUERY") {
      resolveAgroQuery(transcript);
    }
  }

  function resolveOperatorVoiceCommand(transcript) {
    const t = transcript.toLowerCase();
    if (t.includes("call next") || t.includes("পরের") || t.includes("আগলা") || t.includes("next")) {
      appendChat("ai", "Calling next waiting farmer to Counter 1...");
      if (window.handleCallNext) window.handleCallNext(1);
    } else {
      appendChat("ai", `Command understood: "${transcript}". Active yard counters synchronized.`);
    }
  }

  function resolveAgroQuery(query) {
    const q = query.toLowerCase();
    let reply = "";

    if (q.includes("msp") || q.includes("দর") || q.includes("দাম") || q.includes("rate") || q.includes("भाव")) {
      reply = langSelect.value === "bn-IN"
        ? "সরকারি MSP দর: ধান প্রতি কুইন্টাল ₹২,৩০০, গম ₹২,২৭৫ এবং সর্ষে ₹৫,৬৫০।"
        : langSelect.value === "hi-IN"
        ? "सरकारी MSP दरें: धान ₹2,300 प्रति क्विंटल, गेहूं ₹2,275 और सरसों ₹5,650 है।"
        : "Official MSP rates: Paddy ₹2,300/Qtl, Wheat ₹2,275/Qtl, and Mustard ₹5,650/Qtl.";
    } else if (q.includes("কাগজ") || q.includes("নথি") || q.includes("document") || q.includes("id")) {
      reply = langSelect.value === "bn-IN"
        ? "মান্ডিতে আসার সময় কৃষক বন্ধু কার্ড বা KCC, আধার কার্ড এবং সক্রিয় ব্যাঙ্ক পাসবুক সাথে রাখুন।"
        : langSelect.value === "hi-IN"
        ? "मंडी आते समय किसान क्रेडिट कार्ड या आधार कार्ड और बैंक पासबुक साथ लाएं।"
        : "Please bring your Krishak Bandhu or KCC card, Aadhaar, and bank passbook.";
    } else if (q.includes("আর্দ্রতা") || q.includes("moisture") || q.includes("নমি")) {
      reply = langSelect.value === "bn-IN"
        ? "ICAR নিয়ম অনুযায়ী ধানে সর্বোচ্চ ১৭% এবং গমে ১২% আর্দ্রতা গ্রহণযোগ্য।"
        : langSelect.value === "hi-IN"
        ? "ICAR नियमों के अनुसार धान में अधिकतम 17% और गेहूं में 12% नमी स्वीकार्य है।"
        : "Maximum allowable moisture is 17% for Paddy and 12% for Wheat as per ICAR rules.";
    } else {
      reply = langSelect.value === "bn-IN"
        ? "আপনার প্রশ্নটি নথিভুক্ত করা হয়েছে। বিস্তারিত সহায়তার জন্য টোল-ফ্রি 1800-180-1551 এ যোগাযোগ করুন।"
        : langSelect.value === "hi-IN"
        ? "आपका सवाल दर्ज किया गया है। अधिक जानकारी के लिए टोल-फ्री 1800-180-1551 पर कॉल करें।"
        : "Your query is noted. For direct mandi assistance, call toll-free 1800-180-1551.";
    }

    appendChat("ai", reply);
    speak(reply);
  }
});