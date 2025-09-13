(function () {
  // --- Elements
  const presentationMode = document.getElementById("presentation-mode");
  const slides = Array.from(document.querySelectorAll(".slide"));
  const progressBar = document.getElementById("progress-bar");
  const slideCounter = document.getElementById("slide-counter");
  const themeToggle = document.getElementById("theme-toggle");
  const prevBtn = document.getElementById("prev-btn");
  const nextBtn = document.getElementById("next-btn");
  const fullscreenBtn = document.getElementById("fullscreen-btn");
  const exitPresentationBtn = document.getElementById("exit-presentation");
  const startPresentationBtn = document.getElementById("start-presentation");
  const startPresentationHeroBtn = document.getElementById("start-presentation-hero");
  const viewOutlineBtn = document.getElementById("view-outline");

  // --- State
  let currentSlideIndex = 0;
  let touchStartX = null, touchStartY = null;
  let isPresentationMode = false;

  // --- Helpers
  const clamp = n => Math.max(0, Math.min(slides.length - 1, n));
  const frags = (s) => Array.from(s.querySelectorAll(".fragment"));
  const visibleFrags = (s) => frags(s).filter(f => f.classList.contains("is-visible"));
  const hiddenFrags = (s) => frags(s).filter(f => !f.classList.contains("is-visible"));
  const fmt2 = n => String(n).padStart(2, "0");

  // --- Presentation Mode Functions
  function enterPresentationMode() {
    isPresentationMode = true;
    presentationMode.classList.add("active");
    document.body.style.overflow = "hidden";
    setSlide(0);
  }

  function exitPresentationMode() {
    isPresentationMode = false;
    presentationMode.classList.remove("active");
    document.body.style.overflow = "";
  }

  function updateSlideCounter() {
    if (slideCounter) {
      slideCounter.textContent = `${currentSlideIndex + 1} / ${slides.length}`;
    }
  }

  function setSlide(newIndex, { fromHash = false } = {}) {
    if (!isPresentationMode) return;
    
    currentSlideIndex = clamp(newIndex);
    
    // Hide all slides
    slides.forEach((slide, idx) => {
      slide.classList.toggle("active", idx === currentSlideIndex);
    });
    
    // Update progress bar
    if (progressBar) {
      const pct = ((currentSlideIndex + 1) / slides.length) * 100;
      progressBar.style.width = pct + "%";
    }
    
    updateSlideCounter();
    
    // Update button states
    if (prevBtn) prevBtn.disabled = currentSlideIndex === 0;
    if (nextBtn) nextBtn.disabled = currentSlideIndex === slides.length - 1;
  }

  function advance() {
    if (!isPresentationMode) return;
    
    const currentSlide = slides[currentSlideIndex];
    const nextFrag = hiddenFrags(currentSlide)[0];
    if (nextFrag) {
      nextFrag.classList.add("is-visible");
      return;
    }
    setSlide(currentSlideIndex + 1);
  }

  function back() {
    if (!isPresentationMode) return;
    
    const currentSlide = slides[currentSlideIndex];
    const vis = visibleFrags(currentSlide);
    if (vis.length > 0) {
      vis[vis.length - 1].classList.remove("is-visible");
      return;
    }
    setSlide(currentSlideIndex - 1);
  }

  function goToSlide() {
    if (!isPresentationMode) return;
    
    const input = prompt(`Go to slide (1-${slides.length}):`);
    const slideNum = parseInt(input, 10);
    if (!isNaN(slideNum) && slideNum >= 1 && slideNum <= slides.length) {
      setSlide(slideNum - 1);
    }
  }


  // --- Theme Functions
  function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', newTheme);
    if (themeToggle) themeToggle.setAttribute('data-theme', newTheme);
    localStorage.setItem('presentation-theme', newTheme);
  }

  // --- Touch handlers
  function onTouchStart(e) {
    if (!isPresentationMode) return;
    const t = e.changedTouches[0];
    touchStartX = t.clientX;
    touchStartY = t.clientY;
  }

  function onTouchEnd(e) {
    if (!isPresentationMode) return;
    const t = e.changedTouches[0];
    const dx = t.clientX - touchStartX;
    const dy = t.clientY - touchStartY;
    if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy)) {
      if (dx < 0) advance();
      else back();
    }
  }

  // --- Keyboard Event Handler
  window.addEventListener("keydown", (e) => {
    if (["INPUT", "TEXTAREA"].includes(document.activeElement.tagName)) return;
    const k = e.key.toLowerCase();

    // Global shortcuts (work in both modes)
    if (k === "t") {
      e.preventDefault();
      toggleTheme();
      return;
    }

    // Presentation mode shortcuts
    if (!isPresentationMode) return;

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
        e.preventDefault();
        if (!document.fullscreenElement) {
          document.documentElement.requestFullscreen?.();
        } else {
          document.exitFullscreen?.();
        }
        break;
      case "g":
        e.preventDefault();
        goToSlide();
        break;
      case "escape":
        e.preventDefault();
        exitPresentationMode();
        break;
    }
  });

  // --- Event Listeners
  // Brand/Logo click to go back to main page
  const brandElements = document.querySelectorAll('.brand');
  brandElements.forEach(brand => {
    brand.addEventListener('click', (e) => {
      e.preventDefault();
      if (isPresentationMode) {
        exitPresentationMode();
      }
      // Scroll to top of main page
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  });

  // Presentation mode buttons
  if (startPresentationBtn) {
    startPresentationBtn.addEventListener('click', enterPresentationMode);
  }
  
  if (startPresentationHeroBtn) {
    startPresentationHeroBtn.addEventListener('click', enterPresentationMode);
  }

  if (exitPresentationBtn) {
    exitPresentationBtn.addEventListener('click', exitPresentationMode);
  }

  // Navigation buttons
  if (prevBtn) {
    prevBtn.addEventListener('click', back);
  }
  
  if (nextBtn) {
    nextBtn.addEventListener('click', advance);
  }

  // Theme toggle
  if (themeToggle) {
    themeToggle.addEventListener('click', toggleTheme);
  }

  // Fullscreen button
  if (fullscreenBtn) {
    fullscreenBtn.addEventListener('click', () => {
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen?.();
      } else {
        document.exitFullscreen?.();
      }
    });
  }

  // View outline button
  if (viewOutlineBtn) {
    viewOutlineBtn.addEventListener('click', () => {
      // Scroll to the "What You'll Learn" section
      const section = document.querySelector('.section');
      if (section) {
        section.scrollIntoView({ behavior: 'smooth' });
      }
    });
  }

  // Touch events (only in presentation mode)
  document.addEventListener("touchstart", onTouchStart, { passive: true });
  document.addEventListener("touchend", onTouchEnd, { passive: true });

  // Slide counter click to jump
  if (slideCounter) {
    slideCounter.addEventListener('click', goToSlide);
    slideCounter.style.cursor = 'pointer';
    slideCounter.title = 'Click to jump to slide';
  }

  // Prevent context menu on navigation buttons during presentation
  [prevBtn, nextBtn, fullscreenBtn].forEach(btn => {
    if (btn) {
      btn.addEventListener('contextmenu', e => e.preventDefault());
    }
  });

  // Auto-hide cursor during fullscreen presentation
  let cursorTimeout;
  function hideCursor() {
    if (isPresentationMode) {
      document.body.style.cursor = 'none';
    }
  }
  
  function showCursor() {
    document.body.style.cursor = '';
    clearTimeout(cursorTimeout);
    if (document.fullscreenElement && isPresentationMode) {
      cursorTimeout = setTimeout(hideCursor, 3000);
    }
  }

  document.addEventListener('mousemove', showCursor);
  document.addEventListener('fullscreenchange', () => {
    if (document.fullscreenElement && isPresentationMode) {
      cursorTimeout = setTimeout(hideCursor, 3000);
    } else {
      showCursor();
      clearTimeout(cursorTimeout);
    }
  });

  // --- Initialize
  // Initialize fragments
  slides.forEach(slide => {
    frags(slide).forEach(fragment => {
      fragment.classList.remove("is-visible");
    });
  });
  
  // Load saved theme
  const savedTheme = localStorage.getItem('presentation-theme') || 'dark';
  document.documentElement.setAttribute('data-theme', savedTheme);
  if (themeToggle) themeToggle.setAttribute('data-theme', savedTheme);
  
  // Initialize first slide as active
  if (slides.length > 0) {
    slides[0].classList.add("active");
  }

  // Add smooth scrolling for anchor links
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      e.preventDefault();
      const target = document.querySelector(this.getAttribute('href'));
      if (target) {
        target.scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        });
      }
    });
  });

  // Add intersection observer for scroll animations
  const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.style.opacity = '1';
        entry.target.style.transform = 'translateY(0)';
      }
    });
  }, observerOptions);

  // Observe content items for scroll animations
  document.querySelectorAll('.content-item').forEach(item => {
    item.style.opacity = '0';
    item.style.transform = 'translateY(20px)';
    item.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
    observer.observe(item);
  });

  // Add hover effects for interactive elements
  document.querySelectorAll('.content-item, .btn').forEach(element => {
    element.addEventListener('mouseenter', function() {
      this.style.transform = 'translateY(-2px)';
    });
    
    element.addEventListener('mouseleave', function() {
      this.style.transform = 'translateY(0)';
    });
  });

})();