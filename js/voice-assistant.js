class KishanVoiceAssistant {
  constructor() {
    this.selectedLang = "bn-IN"; // Default: Bengali ('bn-IN') or Hindi ('hi-IN')
    this.recognition = null;
    this.isListening = false;
    this.initSpeechEngine();
  }

  initSpeechEngine() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      console.warn("Speech Recognition not supported in this browser.");
      return;
    }

    this.recognition = new SpeechRecognition();
    this.recognition.continuous = false;
    this.recognition.interimResults = false;
    this.recognition.lang = this.selectedLang;

    this.recognition.onstart = () => {
      this.isListening = true;
      this.updateMicUI(true);
    };

    this.recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      console.log("Farmer said:", transcript);
      this.processVoiceCommand(transcript);
    };

    this.recognition.onerror = (event) => {
      console.error("Voice error:", event.error);
      this.updateMicUI(false);
    };

    this.recognition.onend = () => {
      this.isListening = false;
      this.updateMicUI(false);
    };
  }

  setLanguage(langCode) {
    this.selectedLang = langCode;
    if (this.recognition) {
      this.recognition.lang = langCode;
    }
  }

  toggleListening() {
    if (!this.recognition) return;
    if (this.isListening) {
      this.recognition.stop();
    } else {
      this.recognition.start();
    }
  }

  async processVoiceCommand(text) {
    // Send user voice transcript to backend AI intent extractor
    try {
      const response = await fetch(`${window.CONFIG.HTTP_BASE}/api/voice-assistant`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ speech_text: text, lang: this.selectedLang })
      });
      const data = await response.json();

      // If AI extracted pass details, auto-fill the form
      if (data.action === "BOOK_PASS") {
        document.getElementById("farmerName").value = data.farmer_name || "";
        document.getElementById("cropType").value = data.crop || "Wheat";
        document.getElementById("quintals").value = data.quantity || "";
        document.getElementById("btnGeneratePass").click();
      }

      // Speak response back to farmer
      this.speakOut(data.speech_reply);
    } catch (err) {
      this.speakOut(this.selectedLang === "bn-IN" 
        ? "সংযোগ সমস্যা হয়েছে, আবার বলুন।" 
        : "सर्वर से कनेक्ट नहीं हो सका, कृपया दोबारा बोलें।");
    }
  }

  speakOut(message) {
    if (!("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel(); // Stop any active speech

    const utterance = new SpeechSynthesisUtterance(message);
    utterance.lang = this.selectedLang;
    utterance.rate = 0.9; // Slightly slower tempo for rural clarity
    utterance.pitch = 1.0;

    // Pick best regional voice installed on user device
    const voices = window.speechSynthesis.getVoices();
    const regionalVoice = voices.find(v => v.lang.includes(this.selectedLang));
    if (regionalVoice) utterance.voice = regionalVoice;

    window.speechSynthesis.speak(utterance);
  }

  updateMicUI(active) {
    const micBtn = document.getElementById("voiceAssistantBtn");
    if (!micBtn) return;
    if (active) {
      micBtn.classList.add("listening-pulse");
      micBtn.innerHTML = "🎙️ শুনছি... (বলুন)";
    } else {
      micBtn.classList.remove("listening-pulse");
      micBtn.innerHTML = "🎤 কথা বলে পাস বানান (Voice Assistant)";
    }
  }
}

window.voiceAssistant = new KishanVoiceAssistant();