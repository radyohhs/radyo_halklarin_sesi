const CONFIG = {
  RADIO_START_EPOCH: 1721000000000,
  R2_BASE_URL: 'https://pub-YOUR_R2_HASH.r2.dev',
  LISTENER_COUNT_BASE: 42,
  LISTENER_COUNT_RANGE: 15,
};

const state = {
  currentPlaylist: 'pop',
  playlists: {},
  isPlaying: false,
  volume: 0.8,
  isMuted: false,
  shuffle: false,
  repeat: false,
};

const audio = document.getElementById('audioPlayer');

const elements = {
  songTitle: document.getElementById('songTitle'),
  songArtist: document.getElementById('songArtist'),
  songAlbum: document.getElementById('songAlbum'),
  albumArt: document.getElementById('albumArt'),
  vinylDisc: document.getElementById('vinylDisc'),
  playBtn: document.getElementById('playBtn'),
  prevBtn: document.getElementById('prevBtn'),
  nextBtn: document.getElementById('nextBtn'),
  shuffleBtn: document.getElementById('shuffleBtn'),
  repeatBtn: document.getElementById('repeatBtn'),
  muteBtn: document.getElementById('muteBtn'),
  volumeSlider: document.getElementById('volumeSlider'),
  progressFill: document.getElementById('progressFill'),
  progressGlow: document.getElementById('progressGlow'),
  progressBar: document.getElementById('progressBar'),
  currentTime: document.getElementById('currentTime'),
  totalTime: document.getElementById('totalTime'),
  playlistList: document.getElementById('playlistList'),
  playlistTabs: document.getElementById('playlistTabs'),
  songCount: document.getElementById('songCount'),
  totalDuration: document.getElementById('totalDuration'),
  showcaseNowTitle: document.getElementById('showcaseNowTitle'),
  showcaseNowArtist: document.getElementById('showcaseNowArtist'),
  showcaseNowArt: document.getElementById('showcaseNowArt'),
  listenerCount: document.getElementById('listenerCount'),
};

function formatTime(sec) {
  if (isNaN(sec) || sec < 0) return '0:00';
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function totalPlaylistDuration(songs) {
  return songs.reduce((sum, s) => sum + (s.duration || 0), 0);
}

function getRadioPosition(playlist) {
  const songs = playlist.songs;
  if (!songs.length) return { index: 0, position: 0 };

  const totalDur = totalPlaylistDuration(songs);
  if (totalDur === 0) return { index: 0, position: 0 };

  const elapsed = (Date.now() - CONFIG.RADIO_START_EPOCH) / 1000;
  const posInPlaylist = ((elapsed % totalDur) + totalDur) % totalDur;

  let acc = 0;
  for (let i = 0; i < songs.length; i++) {
    if (posInPlaylist < acc + (songs[i].duration || 0)) {
      return { index: i, position: posInPlaylist - acc };
    }
    acc += songs[i].duration || 0;
  }

  return { index: 0, position: 0 };
}

function getSongUrl(song) {
  if (song.url) return song.url;
  return `${CONFIG.R2_BASE_URL}/${encodeURIComponent(song.file)}`;
}

async function loadPlaylist(name) {
  if (state.playlists[name]) return state.playlists[name];

  try {
    const res = await fetch(`playlists/${name}.json`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    state.playlists[name] = data;
    return data;
  } catch (err) {
    console.error(`Playlist "${name}" yüklenemedi:`, err);
    return null;
  }
}

function renderPlaylist(playlist) {
  const container = elements.playlistList;
  container.innerHTML = '';

  playlist.songs.forEach((song, i) => {
    const item = document.createElement('div');
    item.className = 'playlist-item';
    item.dataset.index = i;

    const artContent = song.cover
      ? `<img src="${song.cover}" alt="" loading="lazy" onerror="this.parentElement.textContent='🎵'">`
      : '🎵';

    item.innerHTML = `
      <div class="playlist-item-number">
        <span class="num">${i + 1}</span>
        <span class="playing-icon">▶</span>
      </div>
      <div class="playlist-item-art">${artContent}</div>
      <div class="playlist-item-info">
        <div class="playlist-item-title">${song.title}</div>
        <div class="playlist-item-artist">${song.artist}</div>
      </div>
      <div class="playlist-item-duration">${formatTime(song.duration)}</div>
    `;

    container.appendChild(item);
  });

  elements.songCount.textContent = `${playlist.songs.length} şarkı`;
  elements.totalDuration.textContent = formatTime(totalPlaylistDuration(playlist.songs));
}

function highlightCurrentSong(index) {
  document.querySelectorAll('.playlist-item').forEach((item, i) => {
    item.classList.toggle('active', i === index);
    if (i === index) {
      item.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  });
}

function updateNowPlaying(song) {
  elements.songTitle.textContent = song.title;
  elements.songArtist.textContent = song.artist;
  elements.songAlbum.textContent = song.album || '';
  elements.showcaseNowTitle.textContent = song.title;
  elements.showcaseNowArtist.textContent = song.artist;

  if (song.cover) {
    elements.albumArt.innerHTML = `<img src="${song.cover}" alt="${song.title}" onerror="this.parentElement.innerHTML='<div class=album-art-placeholder><svg width=64 height=64 viewBox=&quot;0 0 24 24&quot; fill=none stroke=currentColor stroke-width=1.5><path d=&quot;M9 18V5l12-2v13&quot;/><circle cx=&quot;6&quot; cy=&quot;18&quot; r=&quot;3&quot;/><circle cx=&quot;18&quot; cy=&quot;16&quot; r=&quot;3&quot;/></svg></div>'">`;
    elements.showcaseNowArt.innerHTML = `<img src="${song.cover}" alt="" onerror="this.parentElement.textContent='🎵'">`;
  } else {
    elements.albumArt.innerHTML = `<div class="album-art-placeholder"><svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/></svg></div>`;
    elements.showcaseNowArt.textContent = '🎵';
  }
}

async function syncToRadio() {
  const playlist = state.playlists[state.currentPlaylist];
  if (!playlist) return;

  const { index, position } = getRadioPosition(playlist);
  const song = playlist.songs[index];

  if (!song) return;

  const url = getSongUrl(song);

  if (audio.currentSrc !== url || !state.isPlaying) {
    audio.src = url;
    audio.currentTime = position;
    audio.volume = state.isMuted ? 0 : state.volume;

    try {
      await audio.play();
      state.isPlaying = true;
      updatePlayButton();
      elements.vinylDisc.classList.add('spinning');
      document.querySelector('.showcase-eq').classList.remove('paused');
    } catch (err) {
      console.log('Otomatik oynatma engellendi, tıklama gerekli');
      state.isPlaying = false;
      updatePlayButton();
    }
  } else {
    const drift = Math.abs(audio.currentTime - position);
    if (drift > 2) {
      audio.currentTime = position;
    }
  }

  updateNowPlaying(song);
  highlightCurrentSong(index);
}

function updatePlayButton() {
  const playIcon = elements.playBtn.querySelector('.play-icon');
  const pauseIcon = elements.playBtn.querySelector('.pause-icon');

  if (state.isPlaying) {
    playIcon.style.display = 'none';
    pauseIcon.style.display = 'block';
    elements.vinylDisc.classList.add('spinning');
    document.querySelector('.showcase-eq').classList.remove('paused');
  } else {
    playIcon.style.display = 'block';
    pauseIcon.style.display = 'none';
    elements.vinylDisc.classList.remove('spinning');
    document.querySelector('.showcase-eq').classList.add('paused');
  }
}

function updateProgress() {
  if (!state.isPlaying) return;

  const playlist = state.playlists[state.currentPlaylist];
  if (!playlist) return;

  const { index, position } = getRadioPosition(playlist);
  const song = playlist.songs[index];
  if (!song) return;

  const pct = (position / song.duration) * 100;
  elements.progressFill.style.width = `${Math.min(pct, 100)}%`;
  elements.currentTime.textContent = formatTime(position);
  elements.totalTime.textContent = formatTime(song.duration);
}

function simulateListeners() {
  const count = CONFIG.LISTENER_COUNT_BASE + Math.floor(Math.random() * CONFIG.LISTENER_COUNT_RANGE);
  elements.listenerCount.textContent = count;
}

function showToast(message) {
  let toast = document.querySelector('.toast');
  if (!toast) {
    toast = document.createElement('div');
    toast.className = 'toast';
    document.body.appendChild(toast);
  }
  toast.textContent = message;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 2500);
}

// Event listeners
elements.playBtn.addEventListener('click', async () => {
  if (state.isPlaying) {
    audio.pause();
    state.isPlaying = false;
    elements.vinylDisc.classList.remove('spinning');
    document.querySelector('.showcase-eq').classList.add('paused');
  } else {
    const playlist = state.playlists[state.currentPlaylist];
    if (!playlist) return;

    const { index, position } = getRadioPosition(playlist);
    const song = playlist.songs[index];
    audio.src = getSongUrl(song);
    audio.currentTime = position;
    audio.volume = state.isMuted ? 0 : state.volume;

    try {
      await audio.play();
      state.isPlaying = true;
      elements.vinylDisc.classList.add('spinning');
      document.querySelector('.showcase-eq').classList.remove('paused');
      updateNowPlaying(song);
      highlightCurrentSong(index);
    } catch (err) {
      console.error('Oynatma hatası:', err);
    }
  }
  updatePlayButton();
});

elements.prevBtn.addEventListener('click', () => {
  showToast('Radyo modunda önceki şarkı mevcut değil');
});

elements.nextBtn.addEventListener('click', () => {
  showToast('Radyo modunda sonraki şarkı mevcut değil');
});

elements.shuffleBtn.addEventListener('click', () => {
  state.shuffle = !state.shuffle;
  elements.shuffleBtn.classList.toggle('active', state.shuffle);
  showToast(state.shuffle ? 'Karıştırma açıldı' : 'Karıştırma kapatıldı');
});

elements.repeatBtn.addEventListener('click', () => {
  state.repeat = !state.repeat;
  elements.repeatBtn.classList.toggle('active', state.repeat);
  showToast(state.repeat ? 'Tekrarlama açıldı' : 'Tekrarlama kapatıldı');
});

elements.muteBtn.addEventListener('click', () => {
  state.isMuted = !state.isMuted;
  audio.volume = state.isMuted ? 0 : state.volume;

  elements.muteBtn.querySelector('.vol-on').style.display = state.isMuted ? 'none' : 'block';
  elements.muteBtn.querySelector('.vol-off').style.display = state.isMuted ? 'block' : 'none';
});

elements.volumeSlider.addEventListener('input', (e) => {
  state.volume = e.target.value / 100;
  if (!state.isMuted) {
    audio.volume = state.volume;
  }
});

elements.progressBar.addEventListener('click', (e) => {
  showToast('Radyo modunda seeking mevcut değil');
});

elements.playlistTabs.addEventListener('click', async (e) => {
  const btn = e.target.closest('.tab-btn');
  if (!btn) return;

  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');

  const name = btn.dataset.playlist;
  state.currentPlaylist = name;

  const playlist = await loadPlaylist(name);
  if (playlist) {
    renderPlaylist(playlist);
    syncToRadio();
  }
});

elements.playlistList.addEventListener('click', (e) => {
  const item = e.target.closest('.playlist-item');
  if (item) {
    showToast('Radyo modunda şarkı seçimi mevcut değil');
  }
});

audio.addEventListener('ended', () => {
  syncToRadio();
});

audio.addEventListener('error', (e) => {
  console.error('Audio yükleme hatası:', e);
  showToast('Şarkı yüklenirken hata oluştu');
});

// Init
async function init() {
  simulateListeners();
  setInterval(simulateListeners, 30000);

  const playlist = await loadPlaylist(state.currentPlaylist);
  if (playlist) {
    renderPlaylist(playlist);
    await syncToRadio();
  }

  setInterval(updateProgress, 500);
  setInterval(() => syncToRadio(), 15000);

  document.querySelector('.showcase-eq').classList.add('paused');
}

init();
