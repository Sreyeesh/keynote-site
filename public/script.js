(function () {
    // --- Elements
    const slides = Array.from(document.querySelectorAll(".slide"));
    const progressBar = document.getElementById("progress-bar");
    const counter = document.getElementById("slide-counter");
    const prevBtn = document.getElementById("prev");
    const nextBtn = document.getElementById("next");
    const themeToggle = document.getElementById("theme-toggle");
    const gridToggle = document.getElementById("grid-toggle");
    const notesToggle = document.getElementById("notes-toggle");
    const notesPanel = document.getElementById("notes-panel");
    const grid = document.getElementById("grid");
    const html = document.documentElement;
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
      counter.textContent = `${i + 1} / ${slides.length}`;
      notesPanel.textContent = slides[i].dataset.notes || "";
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
  
    function initTheme() {
      try {
        const saved = localStorage.getItem("keynote-theme");
        if (saved) {
          html.setAttribute("data-theme", saved);
          themeToggle.setAttribute("data-theme", saved);
        }
      } catch {}
    }
    function toggleTheme() {
      const cur = html.getAttribute("data-theme") || "dark";
      const next = cur === "dark" ? "light" : "dark";
      html.setAttribute("data-theme", next);
      themeToggle.setAttribute("data-theme", next);
      try { localStorage.setItem("keynote-theme", next); } catch {}
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
  
    // --- Grid overview
    function buildGrid() {
      grid.innerHTML = "";
      slides.forEach((s, idx) => {
        const t = document.createElement("div");
        t.className = "thumb";
        const title = s.querySelector("h1, h2, h3")?.textContent?.trim() || `Slide ${idx+1}`;
        const h = document.createElement("h3");
        h.textContent = `${idx+1}. ${title}`;
        const mini = document.createElement("div");
        mini.className = "mini";
        // lightweight preview: clone heading & first list/paragraph
        const clone = s.cloneNode(true);
        // strip heavy stuff
        clone.querySelectorAll("script, video, audio").forEach(el => el.remove());
        // keep only first 2 elements
        const keep = Array.from(clone.children).slice(0,2);
        mini.append(...keep);
        t.append(h, mini);
        t.addEventListener("click", () => {
          document.body.classList.remove("show-grid");
          setSlide(idx);
        });
        grid.appendChild(t);
      });
    }
  
    function toggleGrid() {
      const on = document.body.classList.toggle("show-grid");
      if (on) buildGrid();
    }
  
    function toggleNotes() {
      document.body.classList.toggle("show-notes");
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
    prevBtn.addEventListener("click", back);
    nextBtn.addEventListener("click", advance);
    themeToggle.addEventListener("click", toggleTheme);
    gridToggle.addEventListener("click", toggleGrid);
    notesToggle.addEventListener("click", toggleNotes);
  
    window.addEventListener("keydown", (e) => {
      if (["INPUT","TEXTAREA"].includes(document.activeElement.tagName)) return;
      const k = e.key.toLowerCase();
  
      if (["arrowright","pagedown"," "].includes(k)) { e.preventDefault(); advance(); }
      if (["arrowleft","pageup","backspace"].includes(k)) { e.preventDefault(); back(); }
      if (k === "f") {
        if (!document.fullscreenElement) document.documentElement.requestFullscreen?.();
        else document.exitFullscreen?.();
      }
      if (k === "t") toggleTheme();
      if (k === "g") toggleGrid();
      if (k === "n") toggleNotes();
      if (k === "escape" && document.body.classList.contains("show-grid")) toggleGrid();
    });
  
    document.addEventListener("touchstart", onTouchStart, { passive:true });
    document.addEventListener("touchend", onTouchEnd, { passive:true });
  
    // Init
    initTheme();
    slides.forEach(s => frags(s).forEach(f => f.classList.remove("is-visible")));
    const fromHash = parseInt(location.hash.replace("#",""), 10);
    if (!Number.isNaN(fromHash) && fromHash >= 1 && fromHash <= slides.length) {
      setSlide(fromHash - 1, { fromHash:true });
    } else {
      setSlide(0);
    }
  })();
  