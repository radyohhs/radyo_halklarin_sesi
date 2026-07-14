const state = {
  tracks: [],
  currentIndex: 0,
  isPlaying: false
};

const elements = {
  audio: document.getElementById("audioPlayer"),
  scheduleList: document.getElementById("scheduleList"),
  programCards: document.getElementById("programCards"),
  playButton: document.getElementById("playButton"),
  prevButton: document.getElementById("prevButton"),
  nextButton: document.getElementById("nextButton"),
  volumeControl: document.getElementById("volumeControl"),
  songTitle: document.getElementById("songTitle"),
  artistName: document.getElementById("artistName"),
  programCover: document.getElementById("programCover"),
  coverProgram: document.getElementById("coverProgram"),
  progressBar: document.getElementById("progressBar"),
  elapsedTime: document.getElementById("elapsedTime"),
  totalTime: document.getElementById("totalTime"),
  footerTrack: document.getElementById("footerTrack"),
  listenerCount: document.getElementById("listenerCount"),
  chatForm: document.getElementById("chatForm"),
  chatInput: document.getElementById("chatInput"),
  messages: document.getElementById("messages")
};

async function loadTracks() {
  try {
    const response = await fetch("songs.json", { cache: "no-store" });

    if (!response.ok) {
      throw new Error(`songs.json yüklenemedi: ${response.status}`);
    }

    const tracks = await response.json();

    if (!Array.isArray(tracks) || tracks.length === 0) {
      throw new Error("songs.json içinde geçerli yayın bulunamadı.");
    }

    state.tracks = tracks;
    renderAll();
    selectTrack(0, false);
  } catch (error) {
    console.error(error);
    showPlayerError("Şarkı listesi yüklenemedi. GitHub Pages üzerinden açtığınızdan emin olun.");
  }
}

function renderAll() {
  renderSchedule();
  renderProgramCards();
}

function renderSchedule() {
  elements.scheduleList.innerHTML = state.tracks.map((track, index) => `
    <button class="schedule-item ${index === state.currentIndex ? "active" : ""}" data-index="${index}" type="button">
      <span class="schedule-time">${escapeHtml(track.time || "--:--")}</span>
      <span class="schedule-name">${escapeHtml(track.program || "Program")}</span>
      ${track.live ? '<span class="live-pill">CANLI</span>' : ""}
    </button>
  `).join("");

  elements.scheduleList.querySelectorAll(".schedule-item").forEach(button => {
    button.addEventListener("click", () => selectTrack(Number(button.dataset.index), true));
  });
}

function renderProgramCards() {
  elements.programCards.innerHTML = state.tracks.slice(0, 3).map((track, index) => `
    <button class="program-card ${index === state.currentIndex ? "active" : ""}" data-index="${index}" type="button">
      <small>${escapeHtml(track.time || "--:--")}</small>
      <strong>${escapeHtml(track.program || "Program")}</strong>
    </button>
  `).join("");

  elements.programCards.querySelectorAll(".program-card").forEach(button => {
    button.addEventListener("click", () => selectTrack(Number(button.dataset.index), true));
  });
}

function selectTrack(index, autoplay) {
  if (!state.tracks[index]) return;

  state.currentIndex = index;
  const track = state.tracks[index];

  elements.songTitle.textContent = track.title || "Bilinmeyen Şarkı";
  elements.artistName.textContent = track.artist || "Bilinmeyen Sanatçı";
  elements.coverProgram.textContent = track.program || "Program";
  elements.programCover.src = track.cover || "assets/images/covers/default.svg";
  elements.programCover.alt = `${track.program || "Program"} kapağı`;
  elements.footerTrack.textContent = `${track.title || "Bilinmeyen Şarkı"} — ${track.artist || "Bilinmeyen Sanatçı"}`;

  elements.audio.src = track.url || "";
  elements.audio.load();

  renderAll();

  if (autoplay && track.url) {
    playAudio();
  } else {
    pauseAudio();
  }
}

async function playAudio() {
  if (!elements.audio.src) return;

  try {
    await elements.audio.play();
    state.isPlaying = true;
    elements.playButton.textContent = "❚❚";
  } catch (error) {
    console.error("Ses oynatılamadı:", error);
    state.isPlaying = false;
    elements.playButton.textContent = "▶";
  }
}

function pauseAudio() {
  elements.audio.pause();
  state.isPlaying = false;
  elements.playButton.textContent = "▶";
}

function togglePlay() {
  if (state.isPlaying) {
    pauseAudio();
  } else {
    playAudio();
  }
}

function goToTrack(offset) {
  if (state.tracks.length === 0) return;

  const nextIndex = (state.currentIndex + offset + state.tracks.length) % state.tracks.length;
  selectTrack(nextIndex, true);
}

function formatTime(seconds) {
  if (!Number.isFinite(seconds) || seconds < 0) return "00:00";

  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);

  return `${String(minutes).padStart(2, "0")}:${String(remainingSeconds).padStart(2, "0")}`;
}

function updateProgress() {
  const current = elements.audio.currentTime || 0;
  const duration = elements.audio.duration || 0;
  const percent = duration > 0 ? (current / duration) * 100 : 0;

  elements.progressBar.style.width = `${percent}%`;
  elements.elapsedTime.textContent = formatTime(current);
  elements.totalTime.textContent = formatTime(duration);
}

function showPlayerError(message) {
  elements.songTitle.textContent = "Yayın yüklenemedi";
  elements.artistName.textContent = message;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

elements.playButton.addEventListener("click", togglePlay);
elements.prevButton.addEventListener("click", () => goToTrack(-1));
elements.nextButton.addEventListener("click", () => goToTrack(1));
elements.volumeControl.addEventListener("input", event => {
  elements.audio.volume = Number(event.target.value);
});

elements.audio.addEventListener("timeupdate", updateProgress);
elements.audio.addEventListener("loadedmetadata", updateProgress);
elements.audio.addEventListener("ended", () => goToTrack(1));
elements.audio.addEventListener("play", () => {
  state.isPlaying = true;
  elements.playButton.textContent = "❚❚";
});
elements.audio.addEventListener("pause", () => {
  state.isPlaying = false;
  elements.playButton.textContent = "▶";
});

elements.chatForm.addEventListener("submit", event => {
  event.preventDefault();

  const text = elements.chatInput.value.trim();
  if (!text) return;

  const now = new Date().toLocaleTimeString("tr-TR", {
    hour: "2-digit",
    minute: "2-digit"
  });

  const article = document.createElement("article");
  article.className = "message";
  article.innerHTML = `
    <span class="avatar avatar-red">S</span>
    <div>
      <div class="message-meta">
        <strong>Sen</strong>
        <time>${now}</time>
      </div>
      <p></p>
    </div>
  `;

  article.querySelector("p").textContent = text;
  elements.messages.appendChild(article);
  elements.chatInput.value = "";
  elements.messages.scrollTop = elements.messages.scrollHeight;
});

setInterval(() => {
  const current = Number(elements.listenerCount.textContent.replaceAll(".", "")) || 1248;
  const change = Math.random() > 0.48 ? 1 : -1;
  elements.listenerCount.textContent = Math.max(1, current + change).toLocaleString("tr-TR");
}, 6000);

elements.audio.volume = Number(elements.volumeControl.value);
loadTracks();
