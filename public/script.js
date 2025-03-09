const voiceSelect = document.querySelector("#voiceSelect");
const playButton = document.querySelector("#playButton");
const textInput = document.querySelector("textarea");
const languageSelect = document.querySelector("#languageSelect");
const loadingIcon = document.createElement("svg");
const buttonText = document.createElement("span");

// Array of supported languages with their ISO codes
const languages = [
  { code: "en", name: "English" },
  { code: "es", name: "Spanish" },
  { code: "fr", name: "French" },
  { code: "de", name: "German" },
  { code: "it", name: "Italian" },
];

// Populate language select box
languages.forEach(({ code, name }) => {
  const option = document.createElement("option");
  option.value = code;
  option.textContent = name;
  languageSelect.appendChild(option);
});

// Load available voices
let voices = [];
function loadVoices() {
  voices = speechSynthesis.getVoices();
  voiceSelect.innerHTML = voices
    .map(
      (voice, index) =>
        `<option value="${index}">${voice.name} (${voice.lang})</option>`
    )
    .join("");
}

// Trigger loading voices when they become available
speechSynthesis.onvoiceschanged = loadVoices;
loadVoices();

// Create Loading Icon (Spinner)
loadingIcon.classList.add("hidden", "w-5", "h-5", "animate-spin", "text-white");
loadingIcon.setAttribute("fill", "none");
loadingIcon.setAttribute("stroke", "currentColor");
loadingIcon.setAttribute("stroke-width", "2");
loadingIcon.setAttribute("viewBox", "0 0 24 24");
loadingIcon.innerHTML = `
  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor"></circle>
  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4l3-3-3-3v4a8 8 0 11-8 8z"></path>
`;

// Wrap button text in a span for toggling visibility
buttonText.textContent = "Play Text";

// Clear existing button content and append loading & text elements
playButton.innerHTML = "";
playButton.appendChild(loadingIcon);
playButton.appendChild(buttonText);
playButton.classList.add("flex", "items-center", "justify-center", "gap-2");

// Function to toggle loading state
function toggleLoading(state) {
  if (state) {
    loadingIcon.classList.remove("hidden"); // Show spinner
    buttonText.classList.add("hidden"); // Hide text
    playButton.disabled = true; // Disable button
    playButton.classList.add("opacity-50", "cursor-not-allowed");
  } else {
    loadingIcon.classList.add("hidden"); // Hide spinner
    buttonText.classList.remove("hidden"); // Show text
    playButton.disabled = false; // Enable button
    playButton.classList.remove("opacity-50", "cursor-not-allowed");
  }
}

// Translate text with serverless function
async function translateText(text, targetLang) {
  try {
    toggleLoading(true); // Show loading effect
    const response = await fetch("/api/translate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        text,
        target: targetLang,
      }),
    });

    if (!response.ok) {
      throw new Error(`Error ${response.status}: ${await response.text()}`);
    }

    const data = await response.json();
    return data.data.translations[0].translatedText;
  } catch (error) {
    console.error("Translation Error: ", error);
    alert("Failed to translate text");
    return text;
  } finally {
    toggleLoading(false); // Hide loading effect
  }
}

// TTS Function
function playText(text, voiceIndex) {
  const utterance = new SpeechSynthesisUtterance(text);
  if (voices[voiceIndex]) {
    utterance.voice = voices[voiceIndex];
  }
  speechSynthesis.speak(utterance);
}

// Play TTS with Loading Effect
playButton.addEventListener("click", async () => {
  const text = textInput.value.trim();
  const targetLang = languageSelect.value;
  const selectedVoiceIndex = voiceSelect.value;

  if (!text) {
    alert("Please enter some text!");
    return;
  }

  try {
    toggleLoading(true); // Show loading effect
    const translatedText = await translateText(text, targetLang);
    playText(translatedText, selectedVoiceIndex);
  } catch (error) {
    console.error("Error during processing: ", error);
    alert("An error occurred");
  } finally {
    toggleLoading(false); // Hide loading effect
  }
});

// Select the TTS container
const ttsContainer = document.querySelector(".glowing-border");

// Mouse move event for depth effect
ttsContainer.addEventListener("mousemove", (e) => {
  const { left, top, width, height } = ttsContainer.getBoundingClientRect();
  const x = (e.clientX - left) / width - 0.5;
  const y = (e.clientY - top) / height - 0.5;

  ttsContainer.style.transform = `rotateX(${y * 10}deg) rotateY(${x * 10}deg) scale(1.03)`;
});

// Reset on mouse leave
ttsContainer.addEventListener("mouseleave", () => {
  ttsContainer.style.transform = "rotateX(0deg) rotateY(0deg) scale(1)";
});

// Apply blurred background effect
const blurredBg = document.createElement("div");
blurredBg.classList.add("blurred-bg");
document.body.appendChild(blurredBg);

// CSS for blurred background
const style = document.createElement("style");
style.innerHTML = `
  .blurred-bg {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      backdrop-filter: blur(20px);
      -webkit-backdrop-filter: blur(20px);
      filter: brightness(0.7);
      z-index: -1;
  }
`;
document.head.appendChild(style);
