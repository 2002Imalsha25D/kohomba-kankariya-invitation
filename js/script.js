
document.addEventListener('DOMContentLoaded', () => {
  const coverScreen = document.getElementById('coverScreen');
  const videoScreen = document.getElementById('videoScreen');
  const invitationScreen = document.getElementById('invitationScreen');

  const openButton = document.getElementById('openInvitation');
  const skipButton = document.getElementById('skipVideo');
  const closeButton = document.getElementById('closeInvitation');

  const video = document.getElementById('introVideo');
  const playVideoButton = document.getElementById('playVideoButton');

  const music = document.getElementById('backgroundMusic');
  const soundButtons = document.querySelectorAll('[data-sound-toggle]');

  const MEDIA = {
    landscape: 'videos/intro-landscape.mp4',
    portrait: 'videos/intro-portrait.mp4',
    music: 'audio/background-music.mp3'
  };

  let currentStage = 'cover';
  let soundEnabled = true;
  let audioUnlocked = false;
  let musicRequest = 0;

  // =========================================
  // BACKGROUND MUSIC
  // =========================================

  // Use the source already defined in index.html.
  // Do not assign music.src a second time.
  music.loop = true;
  music.volume = 0.65;
  music.muted = false;
  music.preload = 'auto';

  function updateSoundButtons() {
    const actuallyPlaying = !music.paused && !music.muted;

    soundButtons.forEach(button => {
      const label = button.querySelector('.sound-label');
      const icon = button.querySelector('.sound-icon');

      const on = soundEnabled &&
        (actuallyPlaying || currentStage === 'video');

      if (label) {
        label.textContent = on ? 'SOUND ON' : 'SOUND OFF';
      }

      if (icon) {
        icon.textContent = on ? '♫' : '♪';
      }

      button.setAttribute('aria-pressed', String(on));
    });
  }

  function pauseMusic() {
    musicRequest++;
    music.pause();
    updateSoundButtons();
  }

  function playMusic() {
    if (!soundEnabled || currentStage === 'video') {
      return Promise.resolve(false);
    }

    if (!music.paused) {
      updateSoundButtons();
      return Promise.resolve(true);
    }

    const request = ++musicRequest;

    music.muted = false;

    let attempt;

    try {
      attempt = music.play();
    } catch (error) {
      console.warn('Music playback error:', error);
      updateSoundButtons();
      return Promise.resolve(false);
    }

    return Promise.resolve(attempt)
      .then(() => {
        if (request !== musicRequest ||
            !soundEnabled ||
            currentStage === 'video') {
          music.pause();
          updateSoundButtons();
          return false;
        }

        audioUnlocked = true;
        updateSoundButtons();
        return true;
      })
      .catch(error => {
        console.warn('Music playback blocked:', error);
        updateSoundButtons();
        return false;
      });
  }

  // User interactions can unlock browser audio.
  function unlockAudio() {
    if (!soundEnabled || currentStage === 'video') return;

    if (music.paused) {
      playMusic();
    }
  }

  // Actual playback events keep the icon accurate.
  music.addEventListener('play', updateSoundButtons);
  music.addEventListener('pause', updateSoundButtons);
  music.addEventListener('playing', () => {
    audioUnlocked = true;
    updateSoundButtons();
  });

  music.addEventListener('error', () => {
    console.error('Unable to load background music:', music.error);
    updateSoundButtons();
  });

  // SOUND ON / OFF
  soundButtons.forEach(button => {
    button.addEventListener('click', () => {
      if (soundEnabled) {
        soundEnabled = false;
        pauseMusic();
      } else {
        soundEnabled = true;
        updateSoundButtons();
        playMusic();
      }
    });
  });

  // =========================================
  // SCREEN NAVIGATION
  // =========================================

  function showScreen(stage) {
    currentStage = stage;

    coverScreen.classList.toggle('active', stage === 'cover');
    videoScreen.classList.toggle('active', stage === 'video');
    invitationScreen.classList.toggle('active', stage === 'invitation');

    window.scrollTo(0, 0);
    updateSoundButtons();
  }

  // =========================================
  // MOBILE / DESKTOP VIDEO
  // =========================================

  function isMobile() {
    return window.matchMedia('(max-width: 768px)').matches;
  }

  function getVideoSource() {
    return isMobile() ? MEDIA.portrait : MEDIA.landscape;
  }

  function showPlayButton(message = '▶ PLAY VIDEO') {
    playVideoButton.textContent = message;
    playVideoButton.classList.remove('hidden');
  }

  function hidePlayButton() {
    playVideoButton.classList.add('hidden');
  }

  function loadVideo(source) {
    video.pause();
    video.src = source;
    video.preload = 'auto';
    video.playsInline = true;
    video.muted = false;
    video.volume = 1;
    video.load();
  }

  async function attemptVideoPlayback() {
    try {
      await video.play();
      hidePlayButton();
    } catch (error) {
      console.warn('Video playback blocked:', error);
      showPlayButton();
    }
  }

  // =========================================
  // OPEN INVITATION
  // =========================================

  openButton.addEventListener('click', () => {

    // Browser has received a genuine user gesture.
    // Do not start and immediately cancel music.play().
    // The intro video remains separate from background music.

    pauseMusic();

    showScreen('video');
    hidePlayButton();

    loadVideo(getVideoSource());
    attemptVideoPlayback();
  });

  // Manual video playback
  playVideoButton.addEventListener('click', () => {
    attemptVideoPlayback();
  });

  // Video error
  video.addEventListener('error', () => {
    console.error('Unable to load intro video:', video.currentSrc);
    showPlayButton('VIDEO UNAVAILABLE — SKIP INTRO');
  });

  // Retry video when ready
  video.addEventListener('canplay', () => {
    if (
      currentStage === 'video' &&
      video.paused &&
      playVideoButton.classList.contains('hidden')
    ) {
      attemptVideoPlayback();
    }
  });

  // =========================================
  // FINAL INVITATION
  // =========================================

  function openFinalInvitation() {
    video.pause();
    showScreen('invitation');

    if (soundEnabled) {
      playMusic();
    }
  }

  video.addEventListener('ended', openFinalInvitation);

  skipButton.addEventListener('click', openFinalInvitation);

  // =========================================
  // RETURN TO COVER
  // =========================================

  closeButton.addEventListener('click', () => {
    video.pause();

    try {
      video.currentTime = 0;
    } catch (error) {
      console.warn(error);
    }

    showScreen('cover');

    if (soundEnabled) {
      playMusic();
    }
  });

  // =========================================
  // MOBILE ORIENTATION
  // =========================================

  const mediaQuery = window.matchMedia('(max-width: 768px)');

  function handleScreenChange() {
    if (currentStage !== 'video') return;

    const newSource = getVideoSource();
    const currentSource = video.getAttribute('src');

    if (currentSource !== newSource) {
      hidePlayButton();
      loadVideo(newSource);
      attemptVideoPlayback();
    }
  }

  if (mediaQuery.addEventListener) {
    mediaQuery.addEventListener('change', handleScreenChange);
  } else {
    mediaQuery.addListener(handleScreenChange);
  }

  // =========================================
  // DANCER AND DRUMMER ANIMATIONS
  // =========================================

  function setupCharacter(id) {
    const character = document.getElementById(id);
    if (!character) return;

    character.addEventListener('click', () => {
      if (character.classList.contains('vanished')) return;

      character.classList.add('vanished');

      setTimeout(() => {
        character.classList.remove('vanished');
      }, 2000);
    });
  }

  setupCharacter('leftDancer');
  setupCharacter('rightDrummer');

  // =========================================
  // SPINNING FLOWERS
  // =========================================

  const flowerLayouts = {
    cover: [
      [4, 7, 76, 24, 'normal'],
      [88, 13, 48, 19, 'reverse'],
      [7, 57, 40, 32, 'reverse'],
      [91, 74, 86, 29, 'normal'],
      [78, 42, 32, 22, 'normal'],
      [14, 88, 53, 36, 'reverse']
    ],

    invitation: [
      [3, 5, 64, 28, 'normal'],
      [91, 17, 44, 21, 'reverse'],
      [5, 36, 35, 31, 'reverse'],
      [92, 55, 78, 25, 'normal'],
      [4, 79, 56, 33, 'normal'],
      [88, 91, 39, 20, 'reverse']
    ]
  };

  document.querySelectorAll('.flower-field').forEach(field => {
    const screen = field.closest('.cover-screen')
      ? 'cover'
      : 'invitation';

    flowerLayouts[screen].forEach(
      ([left, top, size, speed, direction]) => {
        const img = document.createElement('img');

        img.src = 'images/flower-icon.png';
        img.alt = '';
        img.className = 'spinning-flower';

        img.style.left = `${left}%`;
        img.style.top = `${top}%`;

        img.style.setProperty(
          '--flower-size',
          `clamp(25px, ${size / 12}vw, ${size}px)`
        );

        img.style.setProperty('--flower-speed', `${speed}s`);
        img.style.setProperty('--flower-direction', direction);

        field.appendChild(img);
      }
    );
  });

  // =========================================
  // GOLD PARTICLES
  // =========================================

  document.querySelectorAll('.particles').forEach(container => {
    for (let i = 0; i < 25; i++) {
      const particle = document.createElement('span');

      particle.className = 'particle';
      particle.style.left = `${Math.random() * 100}%`;
      particle.style.animationDelay = `${Math.random() * 12}s`;
      particle.style.animationDuration =
        `${7 + Math.random() * 8}s`;

      const size = 2 + Math.random() * 3;
      particle.style.width = `${size}px`;
      particle.style.height = `${size}px`;

      container.appendChild(particle);
    }
  });

  // =========================================
  // INITIALIZE AUDIO AND COVER
  // =========================================

  showScreen('cover');

  // Attempt autoplay. Browsers may block audible autoplay.
  playMusic();

  // First genuine interaction on the cover starts music.
  // Exclude sound button and OPEN INVITATION because
  // those controls already handle their own actions.
  document.addEventListener('pointerdown', event => {
    if (event.target.closest(
      '[data-sound-toggle], #openInvitation'
    )) return;

    unlockAudio();
  }, { passive: true });

  document.addEventListener('keydown', event => {
    if (event.target.closest(
      '[data-sound-toggle], #openInvitation'
    )) return;

    unlockAudio();
  });

  // When the visitor returns to the browser tab,
  // try resuming only if sound is enabled.
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden &&
        soundEnabled &&
        currentStage !== 'video' &&
        audioUnlocked &&
        music.paused) {
      playMusic();
    }
  });

});
