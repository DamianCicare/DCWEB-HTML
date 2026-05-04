let tracks = Array.isArray(window.AUDIO_TRACKS) ? [...window.AUDIO_TRACKS] : [];

const audio = document.querySelector("#site-player");
const playButton = document.querySelector("#toggle-play");
const prevButton = document.querySelector("#prev-track");
const nextButton = document.querySelector("#next-track");
const volumeControl = document.querySelector("#volume-control");
const trackTitle = document.querySelector("#track-title");
const trackArtist = document.querySelector("#track-artist");
const playerEmpty = document.querySelector("#player-empty");
const trackList = document.querySelector("#track-list");

let currentTrackIndex = 0;
let lastManifestSignature = getManifestSignature(tracks);

function getManifestSignature(items) {
  return JSON.stringify(
    items.map((track) => ({
      title: track.title,
      artist: track.artist,
      src: track.src,
    })),
  );
}

function updatePlayButton() {
  playButton.textContent = audio.paused ? "Reproducir" : "Pausar";
}

function renderPlaylist() {
  trackList.innerHTML = "";

  if (!tracks.length) {
    playerEmpty.hidden = false;
    trackTitle.textContent = "Sin reproduccion";
    trackArtist.textContent = "Damian Cicare";
    playButton.disabled = true;
    prevButton.disabled = true;
    nextButton.disabled = true;
    return;
  }

  playerEmpty.hidden = true;
  playButton.disabled = false;
  prevButton.disabled = false;
  nextButton.disabled = false;

  tracks.forEach((track, index) => {
    const item = document.createElement("li");
    item.className = "track-item";

    const button = document.createElement("button");
    button.type = "button";
    button.className = "track-button";

    if (index === currentTrackIndex) {
      button.classList.add("is-active");
    }

    button.innerHTML =
      '<span class="track-meta"><strong>' +
      track.title +
      "</strong><span>" +
      track.artist +
      '</span></span><span class="track-state">' +
      (index === currentTrackIndex ? "Sonando" : "En lista") +
      "</span>";

    button.addEventListener("click", () => {
      loadTrack(index, true);
    });

    item.appendChild(button);
    trackList.appendChild(item);
  });
}

function loadTrack(index, shouldPlay) {
  const track = tracks[index];

  if (!track) {
    return;
  }

  currentTrackIndex = index;
  audio.src = track.src;
  trackTitle.textContent = track.title;
  trackArtist.textContent = track.artist;
  renderPlaylist();

  if (shouldPlay) {
    audio
      .play()
      .then(() => {
        updatePlayButton();
      })
      .catch(() => {
        updatePlayButton();
      });
  } else {
    updatePlayButton();
  }
}

function playNextTrack() {
  if (!tracks.length) {
    return;
  }

  const nextIndex = (currentTrackIndex + 1) % tracks.length;
  loadTrack(nextIndex, true);
}

function playPreviousTrack() {
  if (!tracks.length) {
    return;
  }

  const prevIndex = (currentTrackIndex - 1 + tracks.length) % tracks.length;
  loadTrack(prevIndex, true);
}

function applyManifestTracks(newTracks) {
  const safeTracks = Array.isArray(newTracks) ? newTracks : [];
  const currentSrc = tracks[currentTrackIndex] ? tracks[currentTrackIndex].src : "";
  const wasPlaying = !audio.paused;

  tracks = safeTracks;
  lastManifestSignature = getManifestSignature(tracks);

  if (!tracks.length) {
    currentTrackIndex = 0;
    audio.pause();
    audio.removeAttribute("src");
    renderPlaylist();
    updatePlayButton();
    return;
  }

  const sameTrackIndex = tracks.findIndex((track) => track.src === currentSrc);
  currentTrackIndex = sameTrackIndex >= 0 ? sameTrackIndex : 0;

  if (!currentSrc || sameTrackIndex === -1 || audio.getAttribute("src") !== tracks[currentTrackIndex].src) {
    loadTrack(currentTrackIndex, wasPlaying);
    return;
  }

  trackTitle.textContent = tracks[currentTrackIndex].title;
  trackArtist.textContent = tracks[currentTrackIndex].artist;
  renderPlaylist();
  updatePlayButton();
}

function refreshManifest() {
  const manifestScript = document.createElement("script");
  const cacheBuster = Date.now();

  manifestScript.src = "audio/manifest.js?v=" + cacheBuster;

  manifestScript.onload = () => {
    const incomingTracks = Array.isArray(window.AUDIO_TRACKS)
      ? [...window.AUDIO_TRACKS]
      : [];
    const incomingSignature = getManifestSignature(incomingTracks);

    if (incomingSignature !== lastManifestSignature) {
      applyManifestTracks(incomingTracks);
    }

    manifestScript.remove();
  };

  manifestScript.onerror = () => {
    manifestScript.remove();
  };

  document.body.appendChild(manifestScript);
}

playButton.addEventListener("click", () => {
  if (!tracks.length) {
    refreshManifest();
    return;
  }

  if (audio.paused) {
    audio
      .play()
      .then(() => {
        updatePlayButton();
      })
      .catch(() => {});
    return;
  }

  audio.pause();
  updatePlayButton();
});

prevButton.addEventListener("click", playPreviousTrack);
nextButton.addEventListener("click", playNextTrack);

volumeControl.addEventListener("input", () => {
  audio.volume = Number(volumeControl.value);
});

audio.addEventListener("play", updatePlayButton);
audio.addEventListener("pause", updatePlayButton);
audio.addEventListener("ended", playNextTrack);

audio.volume = Number(volumeControl.value);
renderPlaylist();

if (tracks.length) {
  loadTrack(currentTrackIndex, false);
}

setInterval(refreshManifest, 5000);
