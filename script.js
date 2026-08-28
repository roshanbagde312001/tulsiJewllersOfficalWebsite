/* ============================================================
   AURELIA — interactions · vanilla JS, no dependencies
   ============================================================ */
(() => {
  "use strict";

  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const isTouch = window.matchMedia("(hover: none), (pointer: coarse)").matches;
  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];

  document.documentElement.classList.remove("no-js");
  const yearEl = $("#year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* ---------------- Preloader ---------------- */
  const preloader = $("#preloader");
  const preBar = $("#preloaderBar");
  const preCount = $("#preloaderCount");
  let preloaderDone = false;

  function finishPreloader() {
    if (preloaderDone) return;
    preloaderDone = true;
    if (preBar) preBar.style.transform = "scaleX(1)";
    if (preCount) preCount.textContent = "100";
    setTimeout(() => {
      if (preloader) preloader.classList.add("is-done");
      document.body.classList.remove("is-loading");
      document.body.classList.add("is-loaded");
      setTimeout(() => preloader && preloader.remove(), 1400);
    }, 350);
  }

  if (reducedMotion || !preloader) {
    finishPreloader();
  } else {
    const start = performance.now();
    const DURATION = 1400;
    requestAnimationFrame(function tick(now) {
      const p = Math.min(1, (now - start) / DURATION);
      const eased = 1 - Math.pow(1 - p, 3);
      preBar.style.transform = `scaleX(${eased})`;
      preCount.textContent = String(Math.round(eased * 100)).padStart(2, "0");
      if (p < 1) requestAnimationFrame(tick);
      else finishPreloader();
    });
    setTimeout(finishPreloader, 4000); // safety: never trap the user
  }

  /* ---------------- Custom cursor ---------------- */
  const dot = $(".cursor-dot");
  const ring = $(".cursor-ring");
  const cursorLabel = $(".cursor-label");
  let mx = innerWidth / 2, my = innerHeight / 2, rx = mx, ry = my;

  if (!isTouch && !reducedMotion && dot && ring) {
    addEventListener("mousemove", (e) => {
      mx = e.clientX; my = e.clientY;
      document.body.classList.add("cursor-active");
      dot.style.transform = `translate(${mx}px, ${my}px) translate(-50%,-50%)`;
    }, { passive: true });
    document.addEventListener("mouseleave", () => document.body.classList.remove("cursor-active"));
    document.addEventListener("mouseover", (e) => {
      const t = e.target.closest("a, button, [data-cursor]");
      const lab = t && t.dataset.cursor ? t.dataset.cursor : "";
      ring.classList.toggle("is-hover", !!t && !lab);
      ring.classList.toggle("is-label", !!lab);
      if (cursorLabel) cursorLabel.textContent = lab;
    });
  }

  /* ---------------- Mobile menu ---------------- */
  const menuToggle = $("#menuToggle");
  function setMenu(open) {
    document.body.classList.toggle("menu-open", open);
    if (menuToggle) {
      menuToggle.setAttribute("aria-expanded", String(open));
      menuToggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
    }
  }
  if (menuToggle) menuToggle.addEventListener("click", () => setMenu(!document.body.classList.contains("menu-open")));
  $$(".mobile-menu a").forEach((a) => a.addEventListener("click", () => setMenu(false)));

  /* ---------------- Back to top ---------------- */
  const toTop = $("#toTop");
  if (toTop) toTop.addEventListener("click", () => scrollTo({ top: 0, behavior: reducedMotion ? "auto" : "smooth" }));

  /* ---------------- Single rAF loop ----------------
     cursor ring lerp · header state · scroll progress ·
     parallax · atelier step tracking                  */
  const header = $("#siteHeader");
  const progressBar = $("#scrollProgress");
  const parallaxEls = $$("[data-parallax]").map((el) => ({ el, speed: parseFloat(el.dataset.parallax) || 0.1 }));
  const steps = $$(".a-step");
  const panes = $$(".a-pane");
  let lastY = scrollY;

  function frame() {
    if (!isTouch && !reducedMotion && ring) {
      rx += (mx - rx) * 0.16;
      ry += (my - ry) * 0.16;
      ring.style.transform = `translate(${rx}px, ${ry}px) translate(-50%,-50%)`;
    }

    const y = scrollY;
    const vh = innerHeight;

    if (header) {
      header.classList.toggle("is-scrolled", y > 40);
      const menuOpen = document.body.classList.contains("menu-open");
      if (!menuOpen && y > 160 && y - lastY > 4) header.classList.add("is-hidden");
      else if (menuOpen || y - lastY < -4 || y < 160) header.classList.remove("is-hidden");
    }
    lastY = y;

    if (progressBar) {
      const max = document.documentElement.scrollHeight - vh;
      progressBar.style.transform = `scaleX(${max > 0 ? Math.min(1, y / max) : 0})`;
    }
    if (toTop) toTop.classList.toggle("is-visible", y > 700);

    if (!reducedMotion) {
      for (const { el, speed } of parallaxEls) {
        const r = el.getBoundingClientRect();
        if (r.bottom < -80 || r.top > vh + 80) continue;
        const offset = (r.top + r.height / 2 - vh / 2) * speed;
        el.style.setProperty("--py", `${offset.toFixed(1)}px`);
      }
      if (steps.length) {
        let active = 0;
        steps.forEach((s, i) => { if (s.getBoundingClientRect().top < vh * 0.58) active = i; });
        steps.forEach((s, i) => s.classList.toggle("is-active", i === active));
        panes.forEach((p, i) => p.classList.toggle("is-active", i === active));
      }
    }
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
/* ---------------- Split text into animated words ---------------- */
  function splitWords(el) {
    let wordIndex = 0;
    const walk = (node) => {
      [...node.childNodes].forEach((child) => {
        if (child.nodeType === 3) {
          const frag = document.createDocumentFragment();
          child.textContent.split(/(\s+)/).forEach((part) => {
            if (!part) return;
            if (/^\s+$/.test(part)) {
              frag.appendChild(document.createTextNode(" "));
            } else {
              const w = document.createElement("span");
              w.className = "w";
              const wi = document.createElement("span");
              wi.className = "wi";
              wi.textContent = part;
              wi.style.setProperty("--wi", wordIndex++);
              w.appendChild(wi);
              frag.appendChild(w);
            }
          });
          node.replaceChild(frag, child);
        } else if (child.nodeType === 1 && child.tagName !== "BR") {
          walk(child);
        }
      });
    };
    walk(el);
  }

  /* ---------------- Reveal on scroll ---------------- */
  const revealIO = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("in-view");
        revealIO.unobserve(entry.target);
      }
    });
  }, { threshold: 0.14, rootMargin: "0px 0px -6% 0px" });

  $$("[data-reveal], [data-split]").forEach((el) => {
    if (el.matches("[data-split]") && !reducedMotion) splitWords(el);
    revealIO.observe(el);
  });

  /* ---------------- Animated counters ---------------- */
  const countIO = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      countIO.unobserve(entry.target);
      const el = entry.target;
      const target = parseFloat(el.dataset.count);
      const suffix = el.dataset.suffix || "";
      if (reducedMotion) {
        el.textContent = target.toLocaleString("en-US") + suffix;
        return;
      }
      const t0 = performance.now();
      const DUR = 1800;
      requestAnimationFrame(function step(now) {
        const p = Math.min(1, (now - t0) / DUR);
        const eased = 1 - Math.pow(1 - p, 4);
        el.textContent = Math.round(target * eased).toLocaleString("en-US") + (p === 1 ? suffix : "");
        if (p < 1) requestAnimationFrame(step);
      });
    });
  }, { threshold: 0.5 });
  $$("[data-count]").forEach((el) => countIO.observe(el));

  /* ---------------- Collection filters ---------------- */
  const filterBtns = $$(".f-btn");
  const cCards = $$(".c-card");
  filterBtns.forEach((btn) => btn.addEventListener("click", () => {
    filterBtns.forEach((b) => b.classList.toggle("is-active", b === btn));
    const f = btn.dataset.filter;
    cCards.forEach((card) => {
      const show = f === "all" || card.dataset.cat === f;
      card.classList.remove("pop");
      if (show) {
        card.classList.remove("is-hidden");
        void card.offsetWidth; // restart pop animation
        card.classList.add("pop");
      } else {
        card.classList.add("is-hidden");
      }
    });
  }));
  /* ---------------- Ornament gallery pages: filters ---------------- */
  $$("[data-gallery]").forEach((wrap) => {
    const gCards = $$(".g-card", wrap);
    const gBtns = $$(".f-btn", wrap);
    gBtns.forEach((btn) => btn.addEventListener("click", () => {
      gBtns.forEach((b) => b.classList.toggle("is-active", b === btn));
      const f = btn.dataset.filter;
      gCards.forEach((card) => {
        const show = f === "all" || card.dataset.cat === f;
        card.classList.remove("pop");
        if (show) {
          card.classList.remove("is-hidden");
          void card.offsetWidth; // restart pop animation
          card.classList.add("pop");
        } else {
          card.classList.add("is-hidden");
          const v = card.querySelector("video");
          if (v) v.pause();
        }
      });
    }));
  });

  /* ---------------- Gallery film cards: play in view, pause away ---------------- */
  const gVideos = $$(".g-card[data-video] video");
  if ("IntersectionObserver" in window && gVideos.length) {
    const gVideoIO = new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        if (en.isIntersecting) en.target.play().catch(() => {});
        else en.target.pause();
      });
    }, { threshold: 0.3 });
    gVideos.forEach((v) => gVideoIO.observe(v));
  }

  /* ---------------- Film: chapters + play state ---------------- */
  const filmVideos = $$(".film-video");
  const filmChips = $$(".film-chip");
  const filmPlay = $("#filmPlay");
  let filmIndex = 0, filmPaused = false;

  function syncFilm() {
    filmVideos.forEach((v, k) => {
      if (k === filmIndex && !filmPaused) v.play().catch(() => {});
      else v.pause();
    });
    if (filmPlay) {
      filmPlay.textContent = filmPaused ? "▶" : "❚❚";
      filmPlay.setAttribute("aria-label", filmPaused ? "Play film" : "Pause film");
    }
  }
  filmChips.forEach((chip) => chip.addEventListener("click", () => {
    filmIndex = parseInt(chip.dataset.chapter, 10) || 0;
    filmChips.forEach((c, k) => c.classList.toggle("is-active", k === filmIndex));
    filmVideos.forEach((v, k) => v.classList.toggle("is-active", k === filmIndex));
    filmPaused = false;
    syncFilm();
  }));
  if (filmPlay) filmPlay.addEventListener("click", () => { filmPaused = !filmPaused; syncFilm(); });
  if (filmVideos.length) syncFilm();

  /* ---------------- Play videos only when visible ---------------- */
  const videoIO = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      const v = entry.target;
      if (entry.isIntersecting) {
        const isFilm = v.classList.contains("film-video");
        if (!isFilm || (v.classList.contains("is-active") && !filmPaused)) v.play().catch(() => {});
      } else {
        v.pause();
      }
    });
  }, { threshold: 0.2 });
  $$("video").forEach((v) => videoIO.observe(v));
  /* ---------------- Archive: drag to scroll + progress ---------------- */
  const track = $("#archiveTrack");
  const archiveBar = $("#archiveBar");
  if (track) {
    let down = false, startX = 0, startLeft = 0, moved = 0;
    track.addEventListener("pointerdown", (e) => {
      if (e.pointerType !== "mouse") return;
      down = true; moved = 0;
      startX = e.clientX; startLeft = track.scrollLeft;
      track.classList.add("is-dragging");
      track.setPointerCapture(e.pointerId);
    });
    track.addEventListener("pointermove", (e) => {
      if (!down) return;
      const dx = e.clientX - startX;
      moved = Math.max(moved, Math.abs(dx));
      track.scrollLeft = startLeft - dx;
    });
    const endDrag = () => { down = false; track.classList.remove("is-dragging"); };
    track.addEventListener("pointerup", endDrag);
    track.addEventListener("pointercancel", endDrag);
    track.addEventListener("click", (e) => {
      if (moved > 8) { e.preventDefault(); e.stopPropagation(); }
    }, true);
    const updateBar = () => {
      const max = track.scrollWidth - track.clientWidth;
      if (archiveBar) archiveBar.style.transform = `scaleX(${max > 0 ? track.scrollLeft / max : 1})`;
    };
    track.addEventListener("scroll", updateBar, { passive: true });
    addEventListener("resize", updateBar);
    updateBar();
  }

  /* ---------------- Testimonials rotator ---------------- */
  const tSlides = $$(".t-slide");
  const tDots = $$("#tDots button");
  let tIndex = 0, tTimer = null;
  function showVoice(i) {
    tIndex = (i + tSlides.length) % tSlides.length;
    tSlides.forEach((s, k) => s.classList.toggle("is-active", k === tIndex));
    tDots.forEach((d, k) => d.classList.toggle("is-active", k === tIndex));
  }
  function stopVoices() { if (tTimer) clearInterval(tTimer); tTimer = null; }
  function playVoices() {
    stopVoices();
    if (tSlides.length > 1) tTimer = setInterval(() => showVoice(tIndex + 1), 6000);
  }
  tDots.forEach((d, k) => d.addEventListener("click", () => { showVoice(k); playVoices(); }));
  const tStage = $("#tStage");
  if (tStage) {
    tStage.addEventListener("mouseenter", stopVoices);
    tStage.addEventListener("mouseleave", playVoices);
  }
  playVoices();
/* ---------------- Magnetic elements ---------------- */
  if (!isTouch && !reducedMotion) {
    $$("[data-magnetic]").forEach((el) => {
      el.addEventListener("mousemove", (e) => {
        const r = el.getBoundingClientRect();
        const dx = (e.clientX - (r.left + r.width / 2)) * 0.3;
        const dy = (e.clientY - (r.top + r.height / 2)) * 0.3;
        el.classList.add("is-magnetic");
        el.style.transform = `translate(${dx}px, ${dy}px)`;
      });
      el.addEventListener("mouseleave", () => {
        el.classList.remove("is-magnetic");
        el.style.transform = "";
      });
    });
  }

  /* ---------------- Lightbox — catalogue + films, prev/next ---------------- */
  const lightbox = $("#lightbox");
  const lbImg = $("#lightboxImg");
  const lbVideo = $("#lightboxVideo");
  const lbCap = $("#lightboxCap");
  const lbCount = $("#lightboxCount");
  const lbPrev = $(".lightbox-prev");
  const lbNext = $(".lightbox-next");
  let lbItems = [];
  let lbIndex = 0;

  function collectLightboxItems() {
    lbItems = $$("[data-lightbox], [data-video], [data-open-video]").map((el) => {
      if (el.dataset.video || el.dataset.openVideo) {
        const src = el.dataset.video || el.dataset.openVideo;
        const vid = el.querySelector("video");
        return { kind: "video", src, poster: el.dataset.poster || (vid && vid.getAttribute("poster")) || "", cap: el.dataset.cap || "Aurelia atelier film" };
      }
      const img = el.querySelector("img");
      if (!img) return null;
      const cap = el.dataset.cap || (el.querySelector("h3") ? el.querySelector("h3").textContent : "");
      return { kind: "image", src: img.currentSrc || img.src, cap };
    }).filter(Boolean);
  }

  function setLightboxMedia(item) {
    if (!lightbox || !item) return;
    if (lbCount) lbCount.textContent = lbItems.length ? `${String(lbIndex + 1).padStart(2, "0")} / ${String(lbItems.length).padStart(2, "0")}` : "";
    if (item.kind === "video") {
      lbImg.style.display = "none";
      lbVideo.style.display = "block";
      lbVideo.poster = item.poster || "";
      if (lbVideo.src !== item.src) lbVideo.src = item.src;
      lbVideo.load();
      lbVideo.play().catch(() => {});
      if (lbCap) lbCap.textContent = item.cap;
    } else {
      if (lbVideo) { lbVideo.pause(); lbVideo.removeAttribute("src"); }
      lbVideo.style.display = "none";
      lbImg.style.display = "";
      lbImg.src = item.src.replace(/w=\d+/, "w=1800");
      lbImg.alt = item.cap || "Aurelia fine jewellery";
      if (lbCap) lbCap.textContent = item.cap || "";
    }
  }

  function openLightboxAt(i) {
    if (!lbItems.length) return;
    lbIndex = (i + lbItems.length) % lbItems.length;
    setLightboxMedia(lbItems[lbIndex]);
    lightbox.classList.add("is-open");
    lightbox.setAttribute("aria-hidden", "false");
    document.body.classList.add("no-scroll");
  }

  function closeLightbox() {
    if (!lightbox) return;
    if (lbVideo) { lbVideo.pause(); lbVideo.removeAttribute("src"); }
    lightbox.classList.remove("is-open");
    lightbox.setAttribute("aria-hidden", "true");
    document.body.classList.remove("no-scroll");
  }

  collectLightboxItems();
  $$("[data-lightbox], [data-video]").forEach((el) => {
    el.addEventListener("click", () => {
      const key = el.dataset.video || (el.querySelector("img") ? (el.querySelector("img").currentSrc || el.querySelector("img").src) : "");
      const i = lbItems.findIndex((it) => it.src === key);
      openLightboxAt(i >= 0 ? i : 0);
    });
  });
  $$("[data-open-video]").forEach((el) => {
    el.addEventListener("click", (e) => {
      e.preventDefault();
      const i = lbItems.findIndex((it) => it.src === el.dataset.openVideo);
      openLightboxAt(i >= 0 ? i : lbIndex);
    });
  });
  if (lbNext) lbNext.addEventListener("click", () => openLightboxAt(lbIndex + 1));
  if (lbPrev) lbPrev.addEventListener("click", () => openLightboxAt(lbIndex - 1));
  if (lightbox) lightbox.addEventListener("click", (e) => {
    if (e.target === lightbox || e.target.closest(".lightbox-close")) closeLightbox();
  });
  addEventListener("keydown", (e) => {
    if (e.key === "Escape") { closeLightbox(); setMenu(false); }
    if (lightbox && lightbox.classList.contains("is-open")) {
      if (e.key === "ArrowRight") openLightboxAt(lbIndex + 1);
      if (e.key === "ArrowLeft") openLightboxAt(lbIndex - 1);
    }
  });

  /* ---------------- Contact form ---------------- */
  const form = $("#contactForm");
  if (form) form.addEventListener("submit", (e) => {
    e.preventDefault();
    form.classList.add("is-sent");
    const done = $("#formDone");
    if (done) done.focus({ preventScroll: true });
  });
})();
