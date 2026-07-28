const audio = document.getElementById('audio');
const player = document.getElementById('player');
const trackListEl = document.getElementById('trackList');
const emptyState = document.getElementById('emptyState');
const trackCount = document.getElementById('trackCount');
const progressWrap = document.getElementById('progressWrap');
const progressFill = document.getElementById('progressFill');
const btnPlay = document.getElementById('btnPlay');
const btnPrev = document.getElementById('btnPrev');
const btnNext = document.getElementById('btnNext');
const curTimeEl = document.getElementById('curTime');
const durTimeEl = document.getElementById('durTime');
const volumeEl = document.getElementById('volume');
const playerTitle = document.getElementById('playerTitle');
const playerArtist = document.getElementById('playerArtist');
const playerCover = document.getElementById('playerCover');

let tracks = [];
let currentIndex = -1;

function fmt(sec) {
  if (!isFinite(sec)) return '0:00';
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

async function loadTracks() {
  try {
    const res = await fetch('tracks.json?v=2', { cache: 'no-store' });
    const data = await res.json();
    tracks = data.tracks || [];
  } catch {
    tracks = [];
  }
  renderTracks();
}

function renderTracks() {
  trackListEl.querySelectorAll('.track').forEach(el => el.remove());
  if (tracks.length === 0) {
    emptyState.style.display = '';
    trackCount.textContent = '';
    return;
  }
  emptyState.style.display = 'none';
  trackCount.textContent = `${tracks.length} ${tracks.length === 1 ? 'faixa' : 'faixas'}`;

  tracks.forEach((track, i) => {
    const el = document.createElement('div');
    el.className = 'track';
    el.dataset.index = i;
    el.innerHTML = `
      <span class="track-num">${i + 1}</span>
      <div class="track-cover">${track.cover ? `<img src="${track.cover}" alt="" />` : '♪'}</div>
      <div class="track-info">
        <strong>${escapeHtml(track.title)}</strong>
        <span>${escapeHtml(track.artist)}</span>
      </div>
      <span class="track-duration" data-dur></span>
      <button class="track-btn" title="Tocar">▶</button>
    `;
    el.addEventListener('click', () => playTrack(i));
    trackListEl.appendChild(el);

    // duração via metadata sem tocar
    const probe = new Audio();
    probe.preload = 'metadata';
    probe.src = track.file;
    probe.addEventListener('loadedmetadata', () => {
      el.querySelector('[data-dur]').textContent = fmt(probe.duration);
      probe.src = '';
    });
  });
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str || '';
  return div.innerHTML;
}

function playTrack(i) {
  if (i === currentIndex) {
    togglePlay();
    return;
  }
  currentIndex = i;
  const track = tracks[i];
  audio.src = track.file;
  audio.play();
  player.hidden = false;
  playerTitle.textContent = track.title;
  playerArtist.textContent = track.artist;
  playerCover.innerHTML = track.cover ? `<img src="${track.cover}" alt="" />` : '♪';
  updatePlayingUI();
}

function togglePlay() {
  if (currentIndex === -1) {
    if (tracks.length) playTrack(0);
    return;
  }
  if (audio.paused) audio.play();
  else audio.pause();
}

function updatePlayingUI() {
  document.querySelectorAll('.track').forEach(el => {
    const i = Number(el.dataset.index);
    const btn = el.querySelector('.track-btn');
    const num = el.querySelector('.track-num');
    if (i === currentIndex && !audio.paused) {
      el.classList.add('playing');
      btn.textContent = '⏸';
      num.innerHTML = '<span class="eq"><span></span><span></span><span></span></span>';
    } else {
      el.classList.toggle('playing', i === currentIndex);
      btn.textContent = '▶';
      num.textContent = i + 1;
    }
  });
  btnPlay.textContent = audio.paused ? '▶' : '⏸';
}

btnPlay.addEventListener('click', togglePlay);
btnPrev.addEventListener('click', () => {
  if (!tracks.length) return;
  playTrack((currentIndex - 1 + tracks.length) % tracks.length);
});
btnNext.addEventListener('click', () => {
  if (!tracks.length) return;
  playTrack((currentIndex + 1) % tracks.length);
});

audio.addEventListener('play', updatePlayingUI);
audio.addEventListener('pause', updatePlayingUI);
audio.addEventListener('ended', () => {
  if (currentIndex < tracks.length - 1) playTrack(currentIndex + 1);
  else updatePlayingUI();
});

audio.addEventListener('timeupdate', () => {
  curTimeEl.textContent = fmt(audio.currentTime);
  durTimeEl.textContent = fmt(audio.duration);
  progressFill.style.width = audio.duration ? `${(audio.currentTime / audio.duration) * 100}%` : '0%';
});

progressWrap.addEventListener('click', e => {
  if (!audio.duration) return;
  const rect = progressWrap.getBoundingClientRect();
  audio.currentTime = ((e.clientX - rect.left) / rect.width) * audio.duration;
});

volumeEl.addEventListener('input', () => {
  audio.volume = Number(volumeEl.value);
});
audio.volume = 0.9;

document.addEventListener('keydown', e => {
  if (e.code === 'Space' && !['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName)) {
    e.preventDefault();
    togglePlay();
  }
});

loadTracks();
