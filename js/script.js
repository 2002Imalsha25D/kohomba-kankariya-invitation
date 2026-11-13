
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
    music: 'audio/background-music.MP3'
  };

  let currentStage = 'cover';
  let soundEnabled = true;
  let audioUnlocked = false;
  let musicRequest = 0;

  // =========================================
  // BACKGROUND MUSIC
  // =========================================

  // Audio source is already defined in index.html.
  music.loop = true;
  music.volume = 0.65;
  music.muted = false;
  music.preload = 'auto';

  // Speaker icons only — no visible words.
  const soundOnIcon = `
    <svg xmlns="http://www.w3.org/2000/svg"
         width="24" height="24"
         viewBox="0 0 24 24"
         fill="none"
         stroke="currentColor"
         stroke-width="1.8"
         stroke-linecap="round"
         stroke-linejoin="round"
         aria-hidden="true">
      <path d="M11 5 6 9H3v6h3l5 4V5Z"/>
      <path d="M15.5 8.5a5 5 0 0 1 0 7"/>
      <path d="M19 5a10 10 0 0 1 0 14"/>
    </svg>
  `;

  const soundOffIcon = `
    <svg xmlns="http://www.w3.org/2000/svg"
         width="24" height="24"
         viewBox="0 0 24 24"
         fill="none"
         stroke="currentColor"
         stroke-width="1.8"
         stroke-linecap="round"
         stroke-linejoin="round"
         aria-hidden="true">
      <path d="M11 5 6 9H3v6h3l5 4V5Z"/>
      <path d="m17 9 5 6"/>
      <path d="m22 9-5 6"/>
    </svg>
  `;

  function updateSoundButtons() {

    // The icon represents the selected sound setting.
    // Music is paused intentionally during the intro video.
    const isEnabled = soundEnabled;

    soundButtons.forEach(button => {

      const icon = button.querySelector('.sound-icon');

      if (icon) {
        icon.innerHTML = isEnabled
          ? soundOnIcon
          : soundOffIcon;
      }

      button.setAttribute(
        'aria-pressed',
        String(isEnabled)
      );

      button.setAttribute(
        'aria-label',
        isEnabled
          ? 'Mute background music'
          : 'Unmute background music'
      );

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

    music.muted = false;
    music.volume = 0.65;

    if (!music.paused) {
      updateSoundButtons();
      return Promise.resolve(true);
    }

    const request = ++musicRequest;

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

        if (
          request !== musicRequest ||
          !soundEnabled ||
          currentStage === 'video'
        ) {
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

  function unlockAudio() {

    if (!soundEnabled || currentStage === 'video') {
      return;
    }

    if (music.paused) {
      playMusic();
    }
  }

  // Synchronize buttons with playback.
  music.addEventListener('play', updateSoundButtons);
  music.addEventListener('pause', updateSoundButtons);

  music.addEventListener('playing', () => {
    audioUnlocked = true;
    updateSoundButtons();
  });

  music.addEventListener('error', () => {
    console.error(
      'Unable to load background music:',
      music.error
    );

    updateSoundButtons();
  });

  // =========================================
  // SOUND BUTTON — ICON ONLY
  // =========================================

  soundButtons.forEach(button => {

    button.addEventListener('click', () => {

      if (soundEnabled) {

        // Visitor chooses to mute.
        soundEnabled = false;
        pauseMusic();
        return;
      }

      // Visitor chooses to unmute.
      soundEnabled = true;

      music.muted = false;
      music.volume = 0.65;

      updateSoundButtons();
      playMusic();

    });

  });

  // =========================================
  // SCREEN NAVIGATION
  // =========================================

  function showScreen(stage) {

    currentStage = stage;

    coverScreen.classList.toggle(
      'active',
      stage === 'cover'
    );

    videoScreen.classList.toggle(
      'active',
      stage === 'video'
    );

    invitationScreen.classList.toggle(
      'active',
      stage === 'invitation'
    );

    window.scrollTo(0, 0);
    updateSoundButtons();
  }

  // =========================================
  // MOBILE / DESKTOP VIDEO
  // =========================================

  function isMobile() {
    return window.matchMedia(
      '(max-width: 768px)'
    ).matches;
  }

  function getVideoSource() {
    return isMobile()
      ? MEDIA.portrait
      : MEDIA.landscape;
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

    // Background music pauses during intro video.
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

  // Video error handling
  video.addEventListener('error', () => {

    console.error(
      'Unable to load intro video:',
      video.currentSrc
    );

    showPlayButton(
      'VIDEO UNAVAILABLE — SKIP INTRO'
    );
  });

  // Retry video playback when ready
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

  video.addEventListener(
    'ended',
    openFinalInvitation
  );

  skipButton.addEventListener(
    'click',
    openFinalInvitation
  );

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

  const mediaQuery = window.matchMedia(
    '(max-width: 768px)'
  );

  function handleScreenChange() {

    if (currentStage !== 'video') {
      return;
    }

    const newSource = getVideoSource();
    const currentSource = video.getAttribute('src');

    if (currentSource !== newSource) {

      hidePlayButton();
      loadVideo(newSource);
      attemptVideoPlayback();

    }
  }

  if (mediaQuery.addEventListener) {

    mediaQuery.addEventListener(
      'change',
      handleScreenChange
    );

  } else {

    mediaQuery.addListener(
      handleScreenChange
    );

  }

  // =========================================
  // DANCER AND DRUMMER ANIMATIONS
  // =========================================

  function setupCharacter(id) {

    const character = document.getElementById(id);

    if (!character) {
      return;
    }

    character.addEventListener('click', () => {

      if (character.classList.contains('vanished')) {
        return;
      }

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

  document.querySelectorAll(
    '.flower-field'
  ).forEach(field => {

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

        img.style.setProperty(
          '--flower-speed',
          `${speed}s`
        );

        img.style.setProperty(
          '--flower-direction',
          direction
        );

        field.appendChild(img);

      }
    );

  });

  // =========================================
  // GOLD PARTICLES
  // =========================================

  document.querySelectorAll(
    '.particles'
  ).forEach(container => {

    for (let i = 0; i < 25; i++) {

      const particle = document.createElement('span');

      particle.className = 'particle';

      particle.style.left =
        `${Math.random() * 100}%`;

      particle.style.animationDelay =
        `${Math.random() * 12}s`;

      particle.style.animationDuration =
        `${7 + Math.random() * 8}s`;

      const size = 2 + Math.random() * 3;

      particle.style.width = `${size}px`;
      particle.style.height = `${size}px`;

      container.appendChild(particle);

    }

  });

  // =========================================
  // INITIALIZE
  // =========================================

  showScreen('cover');

  // Attempt to start with music enabled.
  // Some browsers restrict automatic audio playback.
  playMusic();

  // First cover interaction can unlock audio.
  // The speaker button manages itself.
  document.addEventListener(
    'pointerdown',
    event => {

      if (event.target.closest(
        '[data-sound-toggle], #openInvitation'
      )) {
        return;
      }

      if (
        currentStage === 'cover' &&
        soundEnabled &&
        music.paused
      ) {
        unlockAudio();
      }

    },
    { passive: true }
  );

  // Keyboard interaction fallback
  document.addEventListener('keydown', event => {

    if (event.target.closest(
      '[data-sound-toggle], #openInvitation'
    )) {
      return;
    }

    if (
      currentStage === 'cover' &&
      soundEnabled &&
      music.paused
    ) {
      unlockAudio();
    }

  });

  // Resume music when returning to browser tab.
  document.addEventListener(
    'visibilitychange',
    () => {

      if (
        !document.hidden &&
        soundEnabled &&
        currentStage !== 'video' &&
        audioUnlocked &&
        music.paused
      ) {
        playMusic();
      }

    }
  );

});
