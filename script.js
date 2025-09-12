(function () {
    // --- Elements
    const slides = Array.from(document.querySelectorAll(".slide"));
    const progressBar = document.getElementById("progress-bar");
    const timerMM = document.getElementById("timer-mm");
    const timerSS = document.getElementById("timer-ss");
    const timerDot = document.getElementById("timer-dot");
  
    // --- Config
    const TALK_MINUTES = 30; // used for pacing UI if you want to expand later
  
    // --- State
    let i = 0;
    let timerStart = null;
    let timerId = null;
    let touchStartX = null, touchStartY = null;
  
    // --- Helpers
    const clamp = n => Math.max(0, Math.min(slides.length - 1, n));
    const frags = (s) => Array.from(s.querySelectorAll(".fragment"));
    const visibleFrags = (s) => frags(s).filter(f => f.classList.contains("is-visible"));
    const hiddenFrags = (s) => frags(s).filter(f => !f.classList.contains("is-visible"));
    const fmt2 = n => String(n).padStart(2, "0");
  
    function setSlide(newIndex, { fromHash=false } = {}) {
      i = clamp(newIndex);
      slides.forEach((s, idx) => {
        s.style.display = idx === i ? "block" : "none";
        if (idx === i) requestAnimationFrame(() => s.scrollTo({ top: 0, left: 0, behavior: "instant" }));
      });
      const pct = ((i + 1) / slides.length) * 100;
      progressBar.style.width = pct + "%";
      if (!fromHash) history.replaceState({}, "", `#${i + 1}`);
    }
  
    function advance() {
      // start timer on first movement forward
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
  
  
    // --- Timer
    function startTimer() {
      timerStart = Date.now();
      timerId = setInterval(() => {
        const secs = Math.floor((Date.now() - timerStart) / 1000);
        timerMM.textContent = fmt2(Math.floor(secs / 60));
        timerSS.textContent = fmt2(secs % 60);
        timerDot.style.opacity = (secs % 2) ? "0.35" : "1";
      }, 500);
    }
  
  
  
    // --- Touch (basic swipe)
    function onTouchStart(e) {
      const t = e.changedTouches[0];
      touchStartX = t.clientX; touchStartY = t.clientY;
    }
    function onTouchEnd(e) {
      const t = e.changedTouches[0];
      const dx = t.clientX - touchStartX;
      const dy = t.clientY - touchStartY;
      if (Math.abs(dx) > 40 && Math.abs(dx) > Math.abs(dy)) {
        if (dx < 0) advance(); else back();
      }
    }
  
    // --- Events
  
    window.addEventListener("keydown", (e) => {
      if (["INPUT","TEXTAREA"].includes(document.activeElement.tagName)) return;
      const k = e.key.toLowerCase();
  
      if (["arrowright","pagedown"," "].includes(k)) { e.preventDefault(); advance(); }
      if (["arrowleft","pageup","backspace"].includes(k)) { e.preventDefault(); back(); }
      if (k === "f") {
        if (!document.fullscreenElement) document.documentElement.requestFullscreen?.();
        else document.exitFullscreen?.();
      }
    });
  
    document.addEventListener("touchstart", onTouchStart, { passive:true });
    document.addEventListener("touchend", onTouchEnd, { passive:true });
  
    // Init
    slides.forEach(s => frags(s).forEach(f => f.classList.remove("is-visible")));
    const fromHash = parseInt(location.hash.replace("#",""), 10);
    if (!Number.isNaN(fromHash) && fromHash >= 1 && fromHash <= slides.length) {
      setSlide(fromHash - 1, { fromHash:true });
    } else {
      setSlide(0);
    }
  })();
  