(function () {
  // ============================================
  // DOM ELEMENTS - Cache frequently used elements for performance
  // ============================================
  const presentationMode = document.getElementById("presentation-mode");      // Main presentation container
  const slides = Array.from(document.querySelectorAll(".slide"));            // All slide elements as array
  const progressBar = document.getElementById("progress-bar");               // Progress indicator
  const slideCounter = document.getElementById("slide-counter");             // Shows "X / Y" slide count
  const themeToggle = document.getElementById("theme-toggle");               // Light/dark theme switcher
  const prevBtn = document.getElementById("prev-btn");                       // Previous slide button
  const nextBtn = document.getElementById("next-btn");                       // Next slide button
  const fullscreenBtn = document.getElementById("fullscreen-btn");           // Toggle fullscreen mode
  const exitPresentationBtn = document.getElementById("exit-presentation");  // Exit presentation button
  const startPresentationBtn = document.getElementById("start-presentation"); // Start presentation button
  const startPresentationHeroBtn = document.getElementById("start-presentation-hero"); // Hero start button
  const viewOutlineBtn = document.getElementById("view-outline");            // Jump to outline button

  // ============================================
  // APPLICATION STATE - Track current presentation state
  // ============================================
  let currentSlideIndex = 0;        // Currently displayed slide (0-based index)
  let touchStartX = null;           // X coordinate where touch gesture started
  let touchStartY = null;           // Y coordinate where touch gesture started  
  let isPresentationMode = false;   // Whether we're currently in presentation mode

  // ============================================
  // UTILITY FUNCTIONS - Helper functions for common operations
  // ============================================
  
  /**
   * Ensures a number stays within valid slide index bounds
   * @param {number} n - The number to clamp
   * @returns {number} - Number clamped between 0 and slides.length - 1
   */
  const clamp = n => Math.max(0, Math.min(slides.length - 1, n));
  
  /**
   * Gets all fragment elements within a slide
   * @param {Element} s - The slide element
   * @returns {Array} - Array of fragment elements
   */
  const frags = (s) => Array.from(s.querySelectorAll(".fragment"));
  
  /**
   * Gets currently visible fragments in a slide
   * @param {Element} s - The slide element
   * @returns {Array} - Array of visible fragment elements
   */
  const visibleFrags = (s) => frags(s).filter(f => f.classList.contains("is-visible"));
  
  /**
   * Gets hidden fragments in a slide
   * @param {Element} s - The slide element
   * @returns {Array} - Array of hidden fragment elements
   */
  const hiddenFrags = (s) => frags(s).filter(f => !f.classList.contains("is-visible"));
  
  /**
   * Formats a number with leading zero (e.g., 5 -> "05")
   * @param {number} n - The number to format
   * @returns {string} - Formatted string with leading zero
   */
  const fmt2 = n => String(n).padStart(2, "0");

  // ============================================
  // PRESENTATION MODE CONTROL - Enter/exit presentation mode
  // ============================================
  
  /**
   * Enters presentation mode - hides UI, shows slides, prevents scrolling
   */
  function enterPresentationMode() {
    isPresentationMode = true;
    presentationMode.classList.add("active");        // Show presentation container
    document.body.style.overflow = "hidden";         // Prevent page scrolling
    setSlide(0);                                     // Start at first slide
  }

  /**
   * Exits presentation mode - restores normal page view
   */
  function exitPresentationMode() {
    isPresentationMode = false;
    presentationMode.classList.remove("active");     // Hide presentation container
    document.body.style.overflow = "";               // Restore page scrolling
  }

  /**
   * Updates the slide counter display in the presentation UI
   * Shows current slide number and total slides (e.g., "3 / 10")
   * Only updates if the slide counter element exists
   */
  function updateSlideCounter() {
    if (slideCounter) {
      // Display format: "current + 1 / total" (1-based for user display)
      slideCounter.textContent = `${currentSlideIndex + 1} / ${slides.length}`;
    }
  }

  /**
   * Sets the current slide and updates all related UI elements
   * @param {number} newIndex - The index of the slide to display (0-based)
   * @param {Object} options - Configuration options
   * @param {boolean} options.fromHash - Whether this was triggered by URL hash change
   */
  function setSlide(newIndex, { fromHash = false } = {}) {
    // Only allow slide changes when in presentation mode
    if (!isPresentationMode) return;
    
    // Clamp the index to valid range (0 to slides.length - 1)
    currentSlideIndex = clamp(newIndex);
    
    // Hide all slides first, then show only the current one
    slides.forEach((slide, idx) => {
      slide.classList.toggle("active", idx === currentSlideIndex);
    });
    
    // Update progress bar percentage based on current position
    if (progressBar) {
      const pct = ((currentSlideIndex + 1) / slides.length) * 100;
      progressBar.style.width = pct + "%";
    }
    
    updateSlideCounter();
    
    // Disable navigation buttons at the beginning/end of presentation
    if (prevBtn) prevBtn.disabled = currentSlideIndex === 0;
    if (nextBtn) nextBtn.disabled = currentSlideIndex === slides.length - 1;
  }

  /**
   * Advances to the next slide or reveals the next fragment
   * Handles fragment-based animations within slides
   */
  function advance() {
    if (!isPresentationMode) return;
    
    const currentSlide = slides[currentSlideIndex];
    const nextFrag = hiddenFrags(currentSlide)[0];  // Get first hidden fragment
    
    // If there are hidden fragments, reveal the next one
    if (nextFrag) {
      nextFrag.classList.add("is-visible");
      return;  // Stay on current slide, just reveal fragment
    }
    
    // No more fragments, move to next slide
    setSlide(currentSlideIndex + 1);
  }

  /**
   * Goes back to previous slide or hides the last visible fragment
   * Handles fragment-based animations within slides
   */
  function back() {
    if (!isPresentationMode) return;
    
    const currentSlide = slides[currentSlideIndex];
    const vis = visibleFrags(currentSlide);  // Get all visible fragments
    
    // If there are visible fragments, hide the last one
    if (vis.length > 0) {
      vis[vis.length - 1].classList.remove("is-visible");
      return;  // Stay on current slide, just hide fragment
    }
    
    // No more fragments to hide, move to previous slide
    setSlide(currentSlideIndex - 1);
  }

  /**
   * Allows user to jump to a specific slide by number
   * Uses browser prompt for input (1-based numbering for user)
   */
  function goToSlide() {
    if (!isPresentationMode) return;
    
    // Prompt user for slide number (1-based for user experience)
    const input = prompt(`Go to slide (1-${slides.length}):`);
    const slideNum = parseInt(input, 10);
    
    // Validate input and convert to 0-based index
    if (!isNaN(slideNum) && slideNum >= 1 && slideNum <= slides.length) {
      setSlide(slideNum - 1);  // Convert to 0-based index
    }
  }


  // ============================================
  // THEME MANAGEMENT - Light/dark mode switching
  // ============================================
  
  /**
   * Toggles between light and dark themes
   * Saves preference to localStorage for persistence across sessions
   */
  function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    
    // Update document root theme attribute
    document.documentElement.setAttribute('data-theme', newTheme);
    
    // Update theme toggle button state
    if (themeToggle) themeToggle.setAttribute('data-theme', newTheme);
    
    // Save preference for future visits
    localStorage.setItem('presentation-theme', newTheme);
  }

  // ============================================
  // TOUCH GESTURE HANDLING - Mobile swipe navigation
  // ============================================
  
  /**
   * Records touch start position for swipe gesture detection
   * @param {TouchEvent} e - Touch event
   */
  function onTouchStart(e) {
    if (!isPresentationMode) return;
    const t = e.changedTouches[0];
    touchStartX = t.clientX;  // Store X coordinate
    touchStartY = t.clientY;  // Store Y coordinate
  }

  /**
   * Handles touch end to detect swipe gestures
   * Only triggers navigation if horizontal swipe is significant
   * @param {TouchEvent} e - Touch event
   */
  function onTouchEnd(e) {
    if (!isPresentationMode) return;
    const t = e.changedTouches[0];
    const dx = t.clientX - touchStartX;  // Horizontal distance
    const dy = t.clientY - touchStartY;  // Vertical distance
    
    // Only trigger navigation if:
    // 1. Horizontal swipe is significant (> 40px)
    // 2. Horizontal movement is greater than vertical movement
    if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy)) {
      if (dx < 0) advance();  // Swipe left = next slide
      else back();            // Swipe right = previous slide
    }
  }

  // ============================================
  // KEYBOARD SHORTCUTS - Handle keyboard navigation
  // ============================================
  
  /**
   * Global keyboard event handler for presentation shortcuts
   * Ignores input when user is typing in form fields
   */
  window.addEventListener("keydown", (e) => {
    // Don't trigger shortcuts when user is typing in input fields
    if (["INPUT", "TEXTAREA"].includes(document.activeElement.tagName)) return;
    const k = e.key.toLowerCase();

    // Global shortcuts (work in both modes)
    if (k === "t") {
      e.preventDefault();
      toggleTheme();  // 'T' key toggles between light/dark theme
      return;
    }

    // Presentation mode shortcuts (only work during presentation)
    if (!isPresentationMode) return;

    switch (k) {
      case "arrowright":
      case "pagedown":
      case " ":  // Spacebar for next slide
        e.preventDefault();
        advance();
        break;
      case "arrowleft":
      case "pageup":
      case "backspace":  // Backspace for previous slide
        e.preventDefault();
        back();
        break;
      case "f":  // 'F' key for fullscreen toggle
        e.preventDefault();
        if (!document.fullscreenElement) {
          document.documentElement.requestFullscreen?.();
        } else {
          document.exitFullscreen?.();
        }
        break;
      case "g":  // 'G' key to jump to specific slide
        e.preventDefault();
        goToSlide();
        break;
      case "escape":  // ESC key to exit presentation
        e.preventDefault();
        exitPresentationMode();
        break;
    }
  });

  // ============================================
  // EVENT LISTENERS - Set up user interaction handlers
  // ============================================
  
  // Brand/Logo click to go back to main page
  const brandElements = document.querySelectorAll('.brand');
  brandElements.forEach(brand => {
    brand.addEventListener('click', (e) => {
      e.preventDefault();
      // Exit presentation mode if currently in it
      if (isPresentationMode) {
        exitPresentationMode();
      }
      // Scroll to top of main page with smooth animation
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  });

  // Presentation mode buttons - start presentation
  if (startPresentationBtn) {
    startPresentationBtn.addEventListener('click', enterPresentationMode);
  }
  
  if (startPresentationHeroBtn) {
    startPresentationHeroBtn.addEventListener('click', enterPresentationMode);
  }

  // Exit presentation button
  if (exitPresentationBtn) {
    exitPresentationBtn.addEventListener('click', exitPresentationMode);
  }

  // Navigation buttons - previous/next slide
  if (prevBtn) {
    prevBtn.addEventListener('click', back);
  }
  
  if (nextBtn) {
    nextBtn.addEventListener('click', advance);
  }

  // Theme toggle button
  if (themeToggle) {
    themeToggle.addEventListener('click', toggleTheme);
  }

  // Fullscreen toggle button
  if (fullscreenBtn) {
    fullscreenBtn.addEventListener('click', () => {
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen?.();
      } else {
        document.exitFullscreen?.();
      }
    });
  }

  // View outline button - scrolls to content section
  if (viewOutlineBtn) {
    viewOutlineBtn.addEventListener('click', () => {
      // Scroll to the "What You'll Learn" section
      const section = document.querySelector('.section');
      if (section) {
        section.scrollIntoView({ behavior: 'smooth' });
      }
    });
  }

  // ============================================
  // TOUCH EVENTS AND CURSOR MANAGEMENT
  // ============================================
  
  // Touch events for mobile navigation (only work in presentation mode)
  document.addEventListener("touchstart", onTouchStart, { passive: true });
  document.addEventListener("touchend", onTouchEnd, { passive: true });

  // Slide counter click to jump to specific slide
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

  // Auto-hide cursor during fullscreen presentation for cleaner look
  let cursorTimeout;
  
  /**
   * Hides the cursor when in presentation mode
   */
  function hideCursor() {
    if (isPresentationMode) {
      document.body.style.cursor = 'none';
    }
  }
  
  /**
   * Shows the cursor and sets timeout to hide it again
   */
  function showCursor() {
    document.body.style.cursor = '';
    clearTimeout(cursorTimeout);
    // Hide cursor again after 3 seconds of inactivity in fullscreen
    if (document.fullscreenElement && isPresentationMode) {
      cursorTimeout = setTimeout(hideCursor, 3000);
    }
  }

  // Show cursor on mouse movement
  document.addEventListener('mousemove', showCursor);
  
  // Handle fullscreen changes
  document.addEventListener('fullscreenchange', () => {
    if (document.fullscreenElement && isPresentationMode) {
      cursorTimeout = setTimeout(hideCursor, 3000);
    } else {
      showCursor();
      clearTimeout(cursorTimeout);
    }
  });

  // ============================================
  // INITIALIZATION - Set up initial state
  // ============================================
  
  // Initialize fragments - hide all fragments by default
  slides.forEach(slide => {
    frags(slide).forEach(fragment => {
      fragment.classList.remove("is-visible");
    });
  });
  
  // Load saved theme preference from localStorage
  const savedTheme = localStorage.getItem('presentation-theme') || 'dark';
  document.documentElement.setAttribute('data-theme', savedTheme);
  if (themeToggle) themeToggle.setAttribute('data-theme', savedTheme);
  
  // Initialize first slide as active (if slides exist)
  if (slides.length > 0) {
    slides[0].classList.add("active");
  }

  // ============================================
  // UI ENHANCEMENTS - Smooth scrolling and animations
  // ============================================
  
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
    threshold: 0.1,                    // Trigger when 10% of element is visible
    rootMargin: '0px 0px -50px 0px'    // Start animation 50px before element enters viewport
  };

  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        // Fade in and slide up animation
        entry.target.style.opacity = '1';
        entry.target.style.transform = 'translateY(0)';
      }
    });
  }, observerOptions);

  // Observe content items for scroll animations
  document.querySelectorAll('.content-item').forEach(item => {
    // Set initial state for animation
    item.style.opacity = '0';
    item.style.transform = 'translateY(20px)';
    item.style.transition = 'opacity 0.6s ease, transform 0.6s ease';
    observer.observe(item);
  });

  // Add hover effects for interactive elements
  document.querySelectorAll('.content-item, .btn').forEach(element => {
    element.addEventListener('mouseenter', function() {
      // Subtle lift effect on hover
      this.style.transform = 'translateY(-2px)';
    });
    
    element.addEventListener('mouseleave', function() {
      // Return to original position
      this.style.transform = 'translateY(0)';
    });
  });

})(); // End of IIFE (Immediately Invoked Function Expression)