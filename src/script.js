// script.js — all interactive behavior (preloader, AOS, menu, back to top, audio + waveform)

/* ---------- Preloader + AOS init ---------- */
window.addEventListener("load", () => {
  const pre = document.getElementById("preloader");
  if (pre) pre.style.display = "none";
  if (window.AOS) AOS.init({ duration: 1000, once: true });
});

/* ---------- Welcome Prompt (gentle) ---------- */
setTimeout(() => {
  try {
    const name = prompt("Welcome! Please enter your name:");
    if (!name) {
      // gentle welcome if no name
      // (do not spam with many alerts)
      console.info("Guest visitor");
    } else {
      alert(`Welcome, ${name}! Enjoy Larry Precious Gospel Music 🎶`);
    }
  } catch (e) {
    // ignore if prompts blocked
    console.warn("Prompt blocked or not allowed.");
  }
}, 1500);

/* ---------- Mobile menu toggle ---------- */
const menuBtn = document.getElementById("menu-btn");
const mobileMenu = document.getElementById("mobile-menu");
if (menuBtn && mobileMenu) {
  menuBtn.addEventListener("click", () => {
    mobileMenu.classList.toggle("hidden");
    menuBtn.innerHTML = mobileMenu.classList.contains("hidden")
      ? '<i class="fa-solid fa-bars"></i>'
      : '<i class="fa-solid fa-xmark"></i>';
  });
}

/* ---------- Back to top button ---------- */
const backToTop = document.getElementById("backToTop");
if (backToTop) {
  window.addEventListener("scroll", () => {
    if (window.scrollY > 400) {
      backToTop.classList.remove("hidden");
    } else {
      backToTop.classList.add("hidden");
    }
  });
  backToTop.addEventListener("click", () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  });
}

/* ---------- Audio + Waveform controls (Holy Glow) ---------- */

/*
Behavior:
- There are two types of playable items:
  1) Embedded Audiomack (we cannot control playback via JS due to cross-origin), but Play Now button opens in a popup and toggles the local waveform.
  2) Local <audio> elements (grace-and-glory.mp3, heavens-light.mp3) — we control these, animate waveform bars while playing, and ensure only one local audio plays at a time.

Implementation approach:
- For local <audio> elements: animate their nearest .waveform .bar heights using requestAnimationFrame while playing.
- For Audiomack embed: we open the Audiomack link in a popup tab/window; we still animate the card's waveform to give feedback when user clicks Play Now.
*/

const musicCards = document.querySelectorAll(".music-card");

// utility: random in range
function rand(min, max) {
  return Math.random() * (max - min) + min;
}

// animate bars for a given wrapper (array of .bar elements). Returns the animator function to stop later.
function animateBars(bars, speed = 120) {
  let running = true;
  function step() {
    if (!running) return;
    bars.forEach((bar, i) => {
      // vary heights — base min/max depends on card state
      const h = Math.max(6, Math.round(rand(8, 46) * (0.5 + Math.random())));
      bar.style.height = h + "px";
    });
    // call again
    requestAnimationFrame(() => {
      setTimeout(step, speed / 2);
    });
  }
  step();
  return () => { running = false; };
}

// Stop all playing local audios when starting another
function stopAllLocalAudio() {
  document.querySelectorAll("audio.enhanced-audio").forEach(a => {
    try { a.pause(); } catch(e) {}
  });
  // remove playing class
  document.querySelectorAll(".music-card.playing").forEach(card => card.classList.remove("playing"));
}

// Handle local <audio> elements
document.querySelectorAll("audio.enhanced-audio").forEach(audio => {
  const card = audio.closest(".music-card");
  const bars = card ? card.querySelectorAll(".waveform .bar") : null;
  let stopFn = null;

  audio.addEventListener("play", () => {
    // ensure only one local audio plays
    stopAllLocalAudio();
    if (card) card.classList.add("playing");

    // start animating this card's bars
    if (bars && bars.length) {
      stopFn = animateBars(Array.from(bars), 90);
    }
  });

  audio.addEventListener("pause", () => {
    if (card) card.classList.remove("playing");
    // stop anim
    if (stopFn) { stopFn(); stopFn = null; }
    // reset bars to small height
    if (bars) bars.forEach(b => b.style.height = "8px");
  });

  audio.addEventListener("ended", () => {
    if (card) card.classList.remove("playing");
    if (stopFn) { stopFn(); stopFn = null; }
    if (bars) bars.forEach(b => b.style.height = "8px");
  });
});

// Handle Play Now button for Audiomack (Track 1)
// This opens Audiomack in a popup and animates the local waveform to provide feedback.
document.querySelectorAll(".play-now").forEach(btn => {
  btn.addEventListener("click", (e) => {
    const src = btn.getAttribute("data-src");
    if (!src) return;
    // Animate parent card waveform while popup open (limited control)
    const card = btn.closest(".music-card");
    const bars = card ? card.querySelectorAll(".waveform .bar") : null;

    // open popup
    const popup = window.open(src, "_blank", "width=480,height=680");
    // Start visual animation on card
    if (card) {
      card.classList.add("playing");
      // simple animation loop until popup closed
      const stop = animateBars(Array.from(bars || []), 80);
      // poll popup closed status
      const interval = setInterval(() => {
        if (!popup || popup.closed) {
          clearInterval(interval);
          if (card) card.classList.remove("playing");
          // reset bars
          if (bars) bars.forEach(b => b.style.height = "8px");
          // stop animateBars
          if (stop) stop();
        }
      }, 600);
    }
  });
});

/* ---------- Accessibility / keyboard improvements ---------- */
// Allow Enter key on 'Play Now' buttons
document.querySelectorAll(".play-now").forEach(btn=>{
  btn.setAttribute("tabindex","0");
  btn.addEventListener("keydown",(e)=>{
    if (e.key === "Enter" || e.key === " ") btn.click();
  });
});

/* ---------- Ensure only one local audio plays at a time ---------- */
document.querySelectorAll("audio.enhanced-audio").forEach(audio => {
  audio.addEventListener("play", () => {
    document.querySelectorAll("audio.enhanced-audio").forEach(a => {
      if (a !== audio) {
        try { a.pause(); a.currentTime = 0; } catch(e){}
      }
    });
  });
});

