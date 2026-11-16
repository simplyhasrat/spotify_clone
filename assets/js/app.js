/**
 * Spotify Web Player Replica - Interactive App Engine
 */

document.addEventListener('DOMContentLoaded', () => {

  // --- Track Database ---
  const songDatabase = [
    {
      id: 1,
      title: "Dilruba Dilnasheen",
      artist: "Rito Riba, Siddhant Kaushal",
      cover: "assets/images/song_dilruba_hd.jpg",
      duration: 198, // 3:18
      notes: [261.63, 329.63, 392.00, 523.25] // C Major chord
    },
    {
      id: 2,
      title: "Veezha Veera (From \"OM Chapter 1: Udhiram - The Blood Wood\")",
      artist: "Sai Abhyankkar, Tippu, Arun Srinivasan",
      cover: "assets/images/song_veezha_hd.jpg",
      duration: 224, // 3:44
      notes: [220.00, 261.63, 329.63, 440.00] // A Minor chord
    },
    {
      id: 3,
      title: "Kelwa Ke Paat Par",
      artist: "Sharda Sinha",
      cover: "assets/images/song_kelwa_hd.jpg",
      duration: 312, // 5:12
      notes: [293.66, 369.99, 440.00, 587.33] // D Major chord
    },
    {
      id: 4,
      title: "Uga Ho Surujdev Bhel Bhinsarva (From \"Chhath Pooja Ke Geet\")",
      artist: "Anuradha Paudwal",
      cover: "assets/images/song_ugaho_hd.jpg",
      duration: 275, // 4:35
      notes: [349.23, 440.00, 523.25, 698.46] // F Major chord
    },
    {
      id: 5,
      title: "Aeroplane",
      artist: "Sushin Shyam, Gana Bala, Rajpriyan",
      cover: "assets/images/song_aeroplane_hd.jpg",
      duration: 186, // 3:06
      notes: [196.00, 246.94, 293.66, 392.00] // G Major chord
    },
    {
      id: 6,
      title: "Never Left",
      artist: "Shubh",
      cover: "assets/images/song_neverleft_hd.jpg",
      duration: 165, // 2:45
      notes: [174.61, 220.00, 261.63, 349.23] // F Minor chord
    }
  ];

  const artistDatabase = [
    { name: "Pritam", role: "Artist", image: "assets/images/artist_pritam_2x.jpg", topSongId: 1 },
    { name: "A.R. Rahman", role: "Artist", image: "assets/images/artist_ar_rahman_2x.jpg", topSongId: 2 },
    { name: "Arijit Singh", role: "Artist", image: "assets/images/artist_arijit_2x.jpg", topSongId: 3 },
    { name: "Sachin-Jigar", role: "Artist", image: "assets/images/artist_sachin_jigar_2x.jpg", topSongId: 4 },
    { name: "Vishal-Shekhar", role: "Artist", image: "assets/images/artist_vishal_shekhar_2x.jpg", topSongId: 5 },
    { name: "Atif Aslam", role: "Artist", image: "assets/images/artist_atif_aslam_full.jpg", topSongId: 6 }
  ];

  // --- State ---
  let currentSongIndex = 0;
  let isPlaying = false;
  let currentTime = 24;
  let playbackTimer = null;
  let isMuted = false;
  let prevVolume = 75;
  let isShuffle = false;
  let isRepeat = false;

  // --- DOM Elements ---
  const musicPlayerBar = document.getElementById('musicPlayerBar');
  const previewBanner = document.getElementById('previewBanner');
  const playerThumb = document.getElementById('playerThumb');
  const playerTitle = document.getElementById('playerTitle');
  const playerArtist = document.getElementById('playerArtist');
  const playerLikeBtn = document.getElementById('playerLikeBtn');
  const ctrlPlayPauseBtn = document.getElementById('ctrlPlayPauseBtn');
  const ctrlPlayIcon = ctrlPlayPauseBtn.querySelector('.ctrl-icon-play');
  const ctrlPauseIcon = ctrlPlayPauseBtn.querySelector('.ctrl-icon-pause');
  const ctrlPrevBtn = document.getElementById('ctrlPrevBtn');
  const ctrlNextBtn = document.getElementById('ctrlNextBtn');
  const ctrlShuffleBtn = document.getElementById('ctrlShuffleBtn');
  const ctrlRepeatBtn = document.getElementById('ctrlRepeatBtn');
  const timelineBar = document.getElementById('timelineBar');
  const timelineProgress = document.getElementById('timelineProgress');
  const currentTimeLabel = document.getElementById('currentTimeLabel');
  const totalDurationLabel = document.getElementById('totalDurationLabel');
  const volumeSlider = document.getElementById('volumeSlider');
  const volumeMuteBtn = document.getElementById('volumeMuteBtn');
  const closePlayerBtn = document.getElementById('closePlayerBtn');

  // Nav & Modals
  const searchInput = document.getElementById('searchInput');
  const clearSearchBtn = document.getElementById('clearSearchBtn');
  const searchResultsSection = document.getElementById('searchResultsSection');
  const searchResultsGrid = document.getElementById('searchResultsGrid');
  const clearSearchResultsBtn = document.getElementById('clearSearchResultsBtn');

  const authModal = document.getElementById('authModal');
  const authModalTitle = document.getElementById('authModalTitle');
  const authSubmitBtn = document.getElementById('authSubmitBtn');
  const authToggleBtn = document.getElementById('authToggleBtn');
  const authTogglePrompt = document.getElementById('authTogglePrompt');
  const closeAuthModalBtn = document.getElementById('closeAuthModalBtn');
  const loginNavBtn = document.getElementById('loginNavBtn');
  const signupNavBtn = document.getElementById('signupNavBtn');
  const signupFreeBtn = document.getElementById('signupFreeBtn');

  const langModal = document.getElementById('langModal');
  const languageBtn = document.getElementById('languageBtn');
  const closeLangModalBtn = document.getElementById('closeLangModalBtn');

  const toastNotification = document.getElementById('toastNotification');
  const createPlaylistBtn = document.getElementById('createPlaylistBtn');
  const createPlaylistNavBtn = document.getElementById('createPlaylistNavBtn');
  const browsePodcastsBtn = document.getElementById('browsePodcastsBtn');
  const installAppBtn = document.getElementById('installAppBtn');

  // --- Web Audio Synthesizer (for interactive realistic audio playback) ---
  let audioCtx = null;
  let masterGain = null;
  let synthOscs = [];

  function initAudioContext() {
    if (!audioCtx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) {
        audioCtx = new AudioContext();
        masterGain = audioCtx.createGain();
        masterGain.gain.setValueAtTime((volumeSlider.value / 100) * 0.15, audioCtx.currentTime);
        masterGain.connect(audioCtx.destination);
      }
    }
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
  }

  function playSynthChord(song) {
    if (!audioCtx || !masterGain) return;
    stopSynth();

    const notes = song.notes || [261.63, 329.63, 392.00];
    synthOscs = notes.map((freq, idx) => {
      const osc = audioCtx.createOscillator();
      const noteGain = audioCtx.createGain();

      osc.type = idx % 2 === 0 ? 'sine' : 'triangle';
      osc.frequency.setValueAtTime(freq, audioCtx.currentTime);

      // Soft pulsating envelope
      noteGain.gain.setValueAtTime(0.001, audioCtx.currentTime);
      noteGain.gain.linearRampToValueAtTime(0.2 / (idx + 1), audioCtx.currentTime + 0.4);

      osc.connect(noteGain);
      noteGain.connect(masterGain);
      osc.start();
      return { osc, gain: noteGain };
    });
  }

  function stopSynth() {
    if (synthOscs.length) {
      synthOscs.forEach(o => {
        try {
          o.gain.gain.linearRampToValueAtTime(0.0001, audioCtx.currentTime + 0.2);
          setTimeout(() => o.osc.stop(), 250);
        } catch (e) {}
      });
      synthOscs = [];
    }
  }

  // --- Playback Engine ---
  function formatTime(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  }

  function loadSong(index, shouldPlay = true) {
    currentSongIndex = (index + songDatabase.length) % songDatabase.length;
    const song = songDatabase[currentSongIndex];

    playerTitle.textContent = song.title;
    playerArtist.textContent = song.artist;
    playerThumb.src = song.cover;
    currentTime = 0;
    currentTimeLabel.textContent = "0:00";
    totalDurationLabel.textContent = formatTime(song.duration);
    timelineProgress.style.width = '0%';

    // Reveal player bar, hide bottom preview
    musicPlayerBar.style.display = 'flex';
    previewBanner.style.display = 'none';

    if (shouldPlay) {
      playTrack();
    }
  }

  function playTrack() {
    initAudioContext();
    isPlaying = true;
    ctrlPlayIcon.style.display = 'none';
    ctrlPauseIcon.style.display = 'block';

    const song = songDatabase[currentSongIndex];
    playSynthChord(song);

    clearInterval(playbackTimer);
    playbackTimer = setInterval(() => {
      currentTime++;
      if (currentTime > song.duration) {
        if (isRepeat) {
          currentTime = 0;
        } else {
          nextTrack();
          return;
        }
      }
      currentTimeLabel.textContent = formatTime(currentTime);
      const percent = (currentTime / song.duration) * 100;
      timelineProgress.style.width = `${percent}%`;
    }, 1000);

    showToast(`Playing: ${song.title}`);
  }

  function pauseTrack() {
    isPlaying = false;
    ctrlPlayIcon.style.display = 'block';
    ctrlPauseIcon.style.display = 'none';
    clearInterval(playbackTimer);
    stopSynth();
  }

  function togglePlayPause() {
    if (isPlaying) {
      pauseTrack();
    } else {
      playTrack();
    }
  }

  function nextTrack() {
    let nextIndex;
    if (isShuffle) {
      nextIndex = Math.floor(Math.random() * songDatabase.length);
    } else {
      nextIndex = currentSongIndex + 1;
    }
    loadSong(nextIndex, true);
  }

  function prevTrack() {
    if (currentTime > 3) {
      currentTime = 0;
      currentTimeLabel.textContent = "0:00";
      timelineProgress.style.width = '0%';
    } else {
      loadSong(currentSongIndex - 1, true);
    }
  }

  // --- Attach Play Button Click Handlers ---
  document.querySelectorAll('.song-card').forEach((card, idx) => {
    card.addEventListener('click', (e) => {
      loadSong(idx, true);
    });
  });

  document.querySelectorAll('.artist-card').forEach((card, idx) => {
    card.addEventListener('click', () => {
      const artist = artistDatabase[idx];
      const songId = artist.topSongId - 1;
      loadSong(songId, true);
      showToast(`Playing top tracks from ${artist.name}`);
    });
  });

  document.querySelectorAll('.chart-card').forEach((card) => {
    card.addEventListener('click', () => {
      const randomSong = Math.floor(Math.random() * songDatabase.length);
      loadSong(randomSong, true);
      showToast(`Playing Chart Playlist`);
    });
  });

  // Player Bar Controls
  ctrlPlayPauseBtn.addEventListener('click', togglePlayPause);
  ctrlNextBtn.addEventListener('click', nextTrack);
  ctrlPrevBtn.addEventListener('click', prevTrack);

  ctrlShuffleBtn.addEventListener('click', () => {
    isShuffle = !isShuffle;
    ctrlShuffleBtn.style.color = isShuffle ? 'var(--spotify-green)' : 'var(--text-subdued)';
    showToast(isShuffle ? 'Shuffle turned on' : 'Shuffle turned off');
  });

  ctrlRepeatBtn.addEventListener('click', () => {
    isRepeat = !isRepeat;
    ctrlRepeatBtn.style.color = isRepeat ? 'var(--spotify-green)' : 'var(--text-subdued)';
    showToast(isRepeat ? 'Repeat track on' : 'Repeat track off');
  });

  // Timeline scrub
  timelineBar.addEventListener('click', (e) => {
    const rect = timelineBar.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const ratio = Math.max(0, Math.min(1, clickX / rect.width));
    const song = songDatabase[currentSongIndex];
    currentTime = Math.floor(ratio * song.duration);
    timelineProgress.style.width = `${ratio * 100}%`;
    currentTimeLabel.textContent = formatTime(currentTime);
  });

  // Volume
  volumeSlider.addEventListener('input', (e) => {
    const val = e.target.value;
    if (masterGain && audioCtx) {
      masterGain.gain.setValueAtTime((val / 100) * 0.15, audioCtx.currentTime);
    }
    if (val == 0) {
      isMuted = true;
    } else {
      isMuted = false;
      prevVolume = val;
    }
  });

  volumeMuteBtn.addEventListener('click', () => {
    if (isMuted) {
      isMuted = false;
      volumeSlider.value = prevVolume;
      if (masterGain && audioCtx) {
        masterGain.gain.setValueAtTime((prevVolume / 100) * 0.15, audioCtx.currentTime);
      }
    } else {
      isMuted = true;
      prevVolume = volumeSlider.value;
      volumeSlider.value = 0;
      if (masterGain && audioCtx) {
        masterGain.gain.setValueAtTime(0, audioCtx.currentTime);
      }
    }
  });

  // Heart / Like Button
  playerLikeBtn.addEventListener('click', () => {
    playerLikeBtn.classList.toggle('liked');
    const isLiked = playerLikeBtn.classList.contains('liked');
    showToast(isLiked ? 'Added to Liked Songs' : 'Removed from Liked Songs');
  });

  // Close Player to show Preview Banner
  closePlayerBtn.addEventListener('click', () => {
    pauseTrack();
    musicPlayerBar.style.display = 'none';
    previewBanner.style.display = 'flex';
  });

  // --- Real-time Search ---
  searchInput.addEventListener('input', (e) => {
    const q = e.target.value.trim().toLowerCase();
    if (q.length > 0) {
      clearSearchBtn.style.display = 'flex';
      performSearch(q);
    } else {
      clearSearchBtn.style.display = 'none';
      searchResultsSection.style.display = 'none';
    }
  });

  clearSearchBtn.addEventListener('click', () => {
    searchInput.value = '';
    clearSearchBtn.style.display = 'none';
    searchResultsSection.style.display = 'none';
    searchInput.focus();
  });

  clearSearchResultsBtn.addEventListener('click', () => {
    searchInput.value = '';
    clearSearchBtn.style.display = 'none';
    searchResultsSection.style.display = 'none';
  });

  function performSearch(query) {
    const matchedSongs = songDatabase.filter(s =>
      s.title.toLowerCase().includes(query) || s.artist.toLowerCase().includes(query)
    );

    const matchedArtists = artistDatabase.filter(a =>
      a.name.toLowerCase().includes(query)
    );

    searchResultsGrid.innerHTML = '';

    if (matchedSongs.length === 0 && matchedArtists.length === 0) {
      searchResultsGrid.innerHTML = `
        <div style="grid-column: 1 / -1; padding: 24px 0; color: #b3b3b3;">
          No results found for "${query}". Please check your spelling or try different keywords.
        </div>
      `;
    } else {
      // Render matched songs
      matchedSongs.forEach(song => {
        const card = document.createElement('div');
        card.className = 'music-card song-card';
        card.innerHTML = `
          <div class="card-image-box">
            <img src="${song.cover}" alt="${song.title}" class="card-img">
            <button class="card-play-btn" title="Play ${song.title}">
              <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
                <path d="m7.05 3.606 13.49 7.788a.7.7 0 0 1 0 1.212L7.05 20.394A.7.7 0 0 1 6 19.788V4.212a.7.7 0 0 1 1.05-.606z"/>
              </svg>
            </button>
          </div>
          <div class="card-info">
            <h3 class="card-title" title="${song.title}">${song.title}</h3>
            <p class="card-subtitle" title="${song.artist}">${song.artist}</p>
          </div>
        `;
        card.addEventListener('click', () => {
          loadSong(song.id - 1, true);
        });
        searchResultsGrid.appendChild(card);
      });

      // Render matched artists
      matchedArtists.forEach(artist => {
        const card = document.createElement('div');
        card.className = 'music-card artist-card';
        card.innerHTML = `
          <div class="card-image-box artist-avatar-box">
            <img src="${artist.image}" alt="${artist.name}" class="card-img artist-avatar">
            <button class="card-play-btn" title="Play ${artist.name}">
              <svg viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
                <path d="m7.05 3.606 13.49 7.788a.7.7 0 0 1 0 1.212L7.05 20.394A.7.7 0 0 1 6 19.788V4.212a.7.7 0 0 1 1.05-.606z"/>
              </svg>
            </button>
          </div>
          <div class="card-info">
            <h3 class="card-title">${artist.name}</h3>
            <p class="card-subtitle">Artist</p>
          </div>
        `;
        card.addEventListener('click', () => {
          loadSong(artist.topSongId - 1, true);
        });
        searchResultsGrid.appendChild(card);
      });
    }

    searchResultsSection.style.display = 'flex';
  }

  // --- Auth Modal (Log in / Sign up) ---
  let isSignupMode = false;

  function openAuthModal(signup = false) {
    isSignupMode = signup;
    updateAuthModalState();
    authModal.style.display = 'flex';
  }

  function closeAuthModal() {
    authModal.style.display = 'none';
  }

  function updateAuthModalState() {
    if (isSignupMode) {
      authModalTitle.textContent = "Sign up to start listening";
      authSubmitBtn.textContent = "Sign Up";
      authTogglePrompt.textContent = "Already have an account?";
      authToggleBtn.textContent = "Log in here";
    } else {
      authModalTitle.textContent = "Log in to Spotify";
      authSubmitBtn.textContent = "Log In";
      authTogglePrompt.textContent = "Don't have an account?";
      authToggleBtn.textContent = "Sign up for Spotify";
    }
  }

  authToggleBtn.addEventListener('click', () => {
    isSignupMode = !isSignupMode;
    updateAuthModalState();
  });

  loginNavBtn.addEventListener('click', () => openAuthModal(false));
  signupNavBtn.addEventListener('click', () => openAuthModal(true));
  signupFreeBtn.addEventListener('click', () => openAuthModal(true));
  closeAuthModalBtn.addEventListener('click', closeAuthModal);

  authModal.addEventListener('click', (e) => {
    if (e.target === authModal) closeAuthModal();
  });

  document.getElementById('authForm').addEventListener('submit', (e) => {
    e.preventDefault();
    closeAuthModal();
    showToast(isSignupMode ? 'Welcome to Spotify! Account created.' : 'Logged in successfully!');
  });

  // --- Language Modal ---
  languageBtn.addEventListener('click', () => {
    langModal.style.display = 'flex';
  });

  closeLangModalBtn.addEventListener('click', () => {
    langModal.style.display = 'none';
  });

  langModal.addEventListener('click', (e) => {
    if (e.target === langModal) langModal.style.display = 'none';
  });

  document.querySelectorAll('.lang-option-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.lang-option-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const langName = btn.getAttribute('data-lang');
      languageBtn.querySelector('span').textContent = langName;
      langModal.style.display = 'none';
      showToast(`Language changed to ${langName}`);
    });
  });

  // --- Actions & Toast Notifications ---
  let toastTimer = null;
  function showToast(message) {
    if (toastTimer) clearTimeout(toastTimer);
    toastNotification.textContent = message;
    toastNotification.classList.add('show');
    toastTimer = setTimeout(() => {
      toastNotification.classList.remove('show');
    }, 2800);
  }

  createPlaylistBtn.addEventListener('click', () => {
    openAuthModal(false);
    showToast('Log in to create and share your playlists');
  });

  createPlaylistNavBtn.addEventListener('click', () => {
    openAuthModal(false);
    showToast('Log in to create playlists');
  });

  browsePodcastsBtn.addEventListener('click', () => {
    searchInput.focus();
    searchInput.value = 'podcast';
    performSearch('podcast');
    showToast('Showing top podcasts');
  });

  installAppBtn.addEventListener('click', () => {
    showToast('Downloading Spotify Desktop application installer...');
  });

  // Mobile Bottom Nav actions
  document.getElementById('mobHomeBtn').addEventListener('click', () => {
    document.getElementById('mainContentScroll').scrollTo({ top: 0, behavior: 'smooth' });
    searchResultsSection.style.display = 'none';
    searchInput.value = '';
  });

  document.getElementById('mobSearchBtn').addEventListener('click', () => {
    searchInput.focus();
    showToast('Type what you want to play');
  });

  document.getElementById('mobLibraryBtn').addEventListener('click', () => {
    openAuthModal(false);
    showToast('Log in to view Your Library');
  });

  document.getElementById('mobPremiumBtn').addEventListener('click', () => {
    showToast('Explore Spotify Premium Individual, Duo & Family plans');
  });

  // Keyboard Shortcuts
  document.addEventListener('keydown', (e) => {
    // Avoid interfering with inputs
    if (['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName)) {
      if (e.key === 'Escape') {
        document.activeElement.blur();
        searchResultsSection.style.display = 'none';
      }
      return;
    }

    if (e.code === 'Space') {
      e.preventDefault();
      togglePlayPause();
    } else if (e.key === 'Escape') {
      closeAuthModal();
      langModal.style.display = 'none';
    } else if (e.key === 'm' || e.key === 'M') {
      volumeMuteBtn.click();
    }
  });

});

