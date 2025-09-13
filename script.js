(function () {
  // --- Elements
  const slides = Array.from(document.querySelectorAll(".slide"));
  const progressBar = document.getElementById("progress-bar");
  const timerMM = document.getElementById("timer-mm");
  const timerSS = document.getElementById("timer-ss");
  const timerDot = document.getElementById("timer-dot");
  const slideCounter = document.getElementById("slide-counter");
  const themeToggle = document.getElementById("theme-toggle");
  const shortcutsOverlay = document.getElementById("shortcuts-overlay");
  const prevBtn = document.getElementById("prev-btn");
  const nextBtn = document.getElementById("next-btn");
  const fullscreenBtn = document.getElementById("fullscreen-btn");

  // --- Config
  const TALK_MINUTES = 30;

  // --- State
  let i = 0;
  let timerStart = null;
  let timerId = null;
  let touchStartX = null, touchStartY = null;
  let shortcutsVisible = false;

  // --- Helpers
  const clamp = n => Math.max(0, Math.min(slides.length - 1, n));
  const frags = (s) => Array.from(s.querySelectorAll(".fragment"));
  const visibleFrags = (s) => frags(s).filter(f => f.classList.contains("is-visible"));
  const hiddenFrags = (s) => frags(s).filter(f => !f.classList.contains("is-visible"));
  const fmt2 = n => String(n).padStart(2, "0");

  function updateSlideCounter() {
    slideCounter.textContent = `${i + 1} / ${slides.length}`;
  }

  function setSlide(newIndex, { fromHash = false } = {}) {
    i = clamp(newIndex);
    slides.forEach((s, idx) => {
      s.style.display = idx === i ? "block" : "none";
      if (idx === i) requestAnimationFrame(() => s.scrollTo({ top: 0, left: 0, behavior: "instant" }));
    });
    const pct = ((i + 1) / slides.length) * 100;
    progressBar.style.width = pct + "%";
    updateSlideCounter();
    
    // Update button states
    prevBtn.disabled = i === 0;
    nextBtn.disabled = i === slides.length - 1;
  }

  function advance() {
    if (!timerStart) startTimer();

    const s = slides[i];
    const nextFrag = hiddenFrags(s)[0];
    if (nextFrag) {
      nextFrag.classList.add("is-visible");
      return;
    }
    setSlide(i + 1);
  }

  function back() {
    const s = slides[i];
    const vis = visibleFrags(s);
    if (vis.length > 0) {
      vis[vis.length - 1].classList.remove("is-visible");
      return;
    }
    setSlide(i - 1);
  }

  function goToSlide() {
    const input = prompt(`Go to slide (1-${slides.length}):`);
    const slideNum = parseInt(input, 10);
    if (!isNaN(slideNum) && slideNum >= 1 && slideNum <= slides.length) {
      setSlide(slideNum - 1);
    }
  }

  function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', newTheme);
    themeToggle.setAttribute('data-theme', newTheme);
    localStorage.setItem('presentation-theme', newTheme);
  }

  function toggleShortcuts() {
    shortcutsVisible = !shortcutsVisible;
    shortcutsOverlay.classList.toggle('show', shortcutsVisible);
  }

  function startTimer() {
    timerStart = Date.now();
    timerId = setInterval(() => {
      const secs = Math.floor((Date.now() - timerStart) / 1000);
      timerMM.textContent = fmt2(Math.floor(secs / 60));
      timerSS.textContent = fmt2(secs % 60);
      timerDot.style.opacity = (secs % 2) ? "0.35" : "1";
    }, 500);
  }

  // --- Touch handlers
  function onTouchStart(e) {
    const t = e.changedTouches[0];
    touchStartX = t.clientX;
    touchStartY = t.clientY;
  }

  function onTouchEnd(e) {
    const t = e.changedTouches[0];
    const dx = t.clientX - touchStartX;
    const dy = t.clientY - touchStartY;
    if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy)) {
      if (dx < 0) advance();
      else back();
    }
  }

  // --- Event listeners
  window.addEventListener("keydown", (e) => {
    if (["INPUT", "TEXTAREA"].includes(document.activeElement.tagName)) return;
    const k = e.key.toLowerCase();

    if (shortcutsVisible && k !== "?" && k !== "escape") {
      toggleShortcuts();
    }

    switch (k) {
      case "arrowright":
      case "pagedown":
      case " ":
        e.preventDefault();
        advance();
        break;
      case "arrowleft":
      case "pageup":
      case "backspace":
        e.preventDefault();
        back();
        break;
      case "f":
        if (!document.fullscreenElement) document.documentElement.requestFullscreen?.();
        else document.exitFullscreen?.();
        break;
      case "t":
        toggleTheme();
        break;
      case "g":
        goToSlide();
        break;
      case "?":
        toggleShortcuts();
        break;
      case "escape":
        if (shortcutsVisible) toggleShortcuts();
        break;
    }
  });

  // Button event listeners
  prevBtn.addEventListener('click', back);
  nextBtn.addEventListener('click', advance);
  themeToggle.addEventListener('click', toggleTheme);
  fullscreenBtn.addEventListener('click', () => {
    if (!document.fullscreenElement) document.documentElement.requestFullscreen?.();
    else document.exitFullscreen?.();
  });

  // Touch events
  document.addEventListener("touchstart", onTouchStart, { passive: true });
  document.addEventListener("touchend", onTouchEnd, { passive: true });

  // Close shortcuts overlay when clicking outside
  document.addEventListener('click', (e) => {
    if (shortcutsVisible && !shortcutsOverlay.contains(e.target)) {
      toggleShortcuts();
    }
  });

  // --- Initialize
  slides.forEach(s => frags(s).forEach(f => f.classList.remove("is-visible")));
  
  // Load saved theme
  const savedTheme = localStorage.getItem('presentation-theme') || 'dark';
  document.documentElement.setAttribute('data-theme', savedTheme);
  themeToggle.setAttribute('data-theme', savedTheme);
  
  // Start with first slide
  setSlide(0);

  // Keyboard accessibility for slide counter
  slideCounter.addEventListener('click', goToSlide);
  slideCounter.style.cursor = 'pointer';
  slideCounter.title = 'Click to jump to slide';

  // Prevent context menu on navigation buttons during presentation
  [prevBtn, nextBtn, fullscreenBtn].forEach(btn => {
    btn.addEventListener('contextmenu', e => e.preventDefault());
  });

  // Auto-hide cursor during fullscreen presentation
  let cursorTimeout;
  function hideCursor() {
    document.body.style.cursor = 'none';
  }
  function showCursor() {
    document.body.style.cursor = '';
    clearTimeout(cursorTimeout);
    if (document.fullscreenElement) {
      cursorTimeout = setTimeout(hideCursor, 3000);
    }
  }

  document.addEventListener('mousemove', showCursor);
  document.addEventListener('fullscreenchange', () => {
    if (document.fullscreenElement) {
      cursorTimeout = setTimeout(hideCursor, 3000);
    } else {
      showCursor();
      clearTimeout(cursorTimeout);
    }
  });

})();