/* ════════════════════════════════════════════════════════════════════════════
   Risky Manuel Tamba — Portfolio v2 scripts
   1. Ambient particle background (canvas)
   2. Hero terminal: tabs + whoami typewriter
   3. Navigation (burger, scroll state, scroll-spy)
   4. Reveal-on-scroll
   5. Scroll progress bar
   6. Chat AI widget (worker.js — Cloudflare Workers AI)
   ════════════════════════════════════════════════════════════════════════════ */
(function () {
  "use strict";

  var REDUCED_MOTION = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ── 1. Ambient particle background ─────────────────────────────────────── */
  var canvas = document.getElementById("bg");
  if (canvas) {
    var ctx = canvas.getContext("2d");
    var particles = [];
    var rafId = null;
    var LINK_DIST = 130;

    function resize() {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      var count = Math.min(90, Math.max(30, Math.floor((canvas.width * canvas.height) / 24000)));
      particles = [];
      for (var i = 0; i < count; i++) {
        particles.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          vx: (Math.random() - 0.5) * 0.35,
          vy: (Math.random() - 0.5) * 0.35,
          r: Math.random() * 1.5 + 0.6
        });
      }
    }

    function draw() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      var n = particles.length;
      for (var i = 0; i < n; i++) {
        var p = particles[i];
        for (var j = i + 1; j < n; j++) {
          var q = particles[j];
          var dx = p.x - q.x;
          var dy = p.y - q.y;
          var dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < LINK_DIST) {
            var a = (1 - dist / LINK_DIST) * 0.14;
            ctx.strokeStyle = "rgba(22, 163, 74, " + a.toFixed(3) + ")";
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(q.x, q.y);
            ctx.stroke();
          }
        }
      }

      for (var k = 0; k < n; k++) {
        var pt = particles[k];
        pt.x += pt.vx;
        pt.y += pt.vy;
        if (pt.x < 0 || pt.x > canvas.width) pt.vx *= -1;
        if (pt.y < 0 || pt.y > canvas.height) pt.vy *= -1;
        ctx.fillStyle = "rgba(22, 163, 74, 0.5)";
        ctx.beginPath();
        ctx.arc(pt.x, pt.y, pt.r, 0, Math.PI * 2);
        ctx.fill();
      }

      rafId = requestAnimationFrame(draw);
    }

    function stop() {
      if (rafId !== null) cancelAnimationFrame(rafId);
      rafId = null;
      if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
    }

    resize();
    if (REDUCED_MOTION) {
      draw(); // single static frame
      stop();
    } else {
      draw();
      window.addEventListener("resize", debounce(resize, 200));
    }

    function debounce(fn, ms) {
      var t = null;
      return function () {
        var args = arguments;
        clearTimeout(t);
        t = setTimeout(function () { fn.apply(null, args); }, ms);
      };
    }
  }

  /* ── 2. Hero terminal: tabs + whoami typewriter ─────────────────────────── */
  var termEl = document.getElementById("terminal");

  function buildWhoami() {
    var SCRIPT = [
      { prompt: "$", text: "whoami", cls: "t-cmd" },
      { prompt: "", text: "risky manuel tamba", cls: "t-res" },
      { prompt: "$", text: "cat /etc/passwd | grep risky", cls: "t-cmd" },
      { prompt: "", text: "→ bug-bounty-hunter", cls: "t-line" },
      { prompt: "", text: "→ security-researcher", cls: "t-line" },
      { prompt: "", text: "→ red-team-dev", cls: "t-line" },
      { prompt: "", text: "→ coffee-powered", cls: "t-line" }
    ];

    return SCRIPT.map(function (line) {
      var div = document.createElement("div");
      div.className = "t-line " + line.cls;
      if (line.prompt) {
        var p = document.createElement("span");
        p.className = "t-prompt";
        p.textContent = line.prompt + " ";
        div.appendChild(p);
      }
      var txt = document.createElement("span");
      txt.className = "t-text";
      div.appendChild(txt);
      termEl.appendChild(div);
      return { div: div, txt: txt, full: line.text };
    });
  }

  if (termEl) {
    var whoamiScript = null; // [{div, txt, full}] rendered lines
    var whoamiRan = false;

    function sleep(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }

    function typeTextInto(el, text, speed) {
      return new Promise(function (resolve) {
        var i = 0;
        (function tick() {
          el.textContent = text.slice(0, i + 1);
          i++;
          if (i < text.length) setTimeout(tick, speed);
          else resolve();
        })();
      });
    }

    function renderWhoamiInstant() {
      whoamiRan = true;
      termEl.innerHTML = "";
      whoamiScript = buildWhoami();
      whoamiScript.forEach(function (line) {
        line.txt.textContent = line.full;
      });
      appendCursor();
    }

    function appendCursor() {
      var cursor = document.createElement("span");
      cursor.className = "t-cursor";
      termEl.appendChild(cursor);
    }

    async function runTypewriter() {
      whoamiRan = true;
      termEl.innerHTML = "";
      whoamiScript = buildWhoami();

      for (var i = 0; i < whoamiScript.length; i++) {
        var line = whoamiScript[i];
        var isCmd = line.div.classList.contains("t-cmd");
        await typeTextInto(line.txt, line.full, isCmd ? 24 : 11);
        await sleep(isCmd ? 200 : 60);
      }

      appendCursor();
    }

    // Term tabs switching
    var tabsWrap = document.getElementById("term-tabs");
    if (tabsWrap) {
      tabsWrap.addEventListener("click", function (e) {
        var btn = e.target.closest(".term-tab");
        if (!btn) return;
        tabsWrap.querySelectorAll(".term-tab").forEach(function (b) {
          var on = b === btn;
          b.classList.toggle("active", on);
          b.setAttribute("aria-selected", on ? "true" : "false");
        });
        document.querySelectorAll(".tab-panel").forEach(function (panel) {
          panel.classList.toggle("active", panel.id === "tab-" + btn.dataset.tab);
        });

        if (btn.dataset.tab === "whoami" && !whoamiRan) {
          if (REDUCED_MOTION) {
            renderWhoamiInstant();
          } else {
            runTypewriter();
          }
        }
      });
    }
  }

  /* ── 3. Navigation ──────────────────────────────────────────────────────── */
  var nav = document.getElementById("nav");
  var burger = document.getElementById("nav-burger");
  var navLinks = document.getElementById("nav-links");

  if (nav) {
    window.addEventListener("scroll", function () {
      nav.classList.toggle("scrolled", window.scrollY > 10);
    }, { passive: true });
  }

  if (burger && navLinks) {
    burger.addEventListener("click", function () {
      var open = nav.classList.toggle("open");
      burger.classList.toggle("open", open);
      burger.setAttribute("aria-expanded", open ? "true" : "false");
    });
    navLinks.querySelectorAll("a").forEach(function (a) {
      a.addEventListener("click", function () {
        nav.classList.remove("open");
        burger.classList.remove("open");
        burger.setAttribute("aria-expanded", "false");
      });
    });
  }

  // Scroll-spy
  var sectionIds = ["about", "findings", "skills", "certifications", "projects", "contact"];
  var scrollSpy = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (!entry.isIntersecting) return;
      navLinks.querySelectorAll("a").forEach(function (a) {
        var on = a.getAttribute("href") === "#" + entry.target.id;
        a.classList.toggle("active", on);
      });
    });
  }, { rootMargin: "-40% 0px -55% 0px" });

  sectionIds.forEach(function (id) {
    var sec = document.getElementById(id);
    if (sec && navLinks) scrollSpy.observe(sec);
  });

  /* ── 4. Reveal on scroll ────────────────────────────────────────────────── */
  var revealObserver = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        entry.target.classList.add("visible");
        revealObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12 });

  document.querySelectorAll(".reveal").forEach(function (el) {
    revealObserver.observe(el);
  });

  /* ── 5. Scroll progress bar ─────────────────────────────────────────────── */
  var progressBar = document.getElementById("scroll-progress");
  if (progressBar) {
    function updateProgress() {
      var h = document.documentElement;
      var max = h.scrollHeight - h.clientHeight;
      var pct = max > 0 ? (h.scrollTop / max) * 100 : 0;
      progressBar.style.width = pct + "%";
    }
    window.addEventListener("scroll", updateProgress, { passive: true });
    updateProgress();
  }

  /* ── 6. Chat AI widget (backend: worker.js) ─────────────────────────────── */
  (function () {
    var WORKER_URL = "https://manuelky.rrsecbounty.workers.dev/";

    var toggleBtn = document.getElementById("rt-chat-toggle");
    var chatBox = document.getElementById("rt-chat-box");
    var messagesEl = document.getElementById("rt-chat-messages");
    var inputEl = document.getElementById("rt-chat-input");
    var sendBtn = document.getElementById("rt-chat-send");

    if (!toggleBtn || !chatBox || !messagesEl || !inputEl || !sendBtn) return;

    var history = [];

    toggleBtn.addEventListener("click", function () {
      chatBox.classList.toggle("open");
    });

    // clicking header closes the box
    var headerEl = document.getElementById("rt-chat-header");
    if (headerEl) {
      headerEl.addEventListener("click", function () {
        chatBox.classList.remove("open");
      });
    }

    function addMessage(role, text, isLoading) {
      var div = document.createElement("div");
      div.className = "rt-msg " + role + (isLoading ? " loading" : "");
      div.textContent = text;
      messagesEl.appendChild(div);
      messagesEl.scrollTop = messagesEl.scrollHeight;
      return div;
    }

    async function sendMessage() {
      var text = inputEl.value.trim();
      if (!text) return;

      addMessage("user", text);
      history.push({ role: "user", content: text });
      inputEl.value = "";
      inputEl.style.height = "auto";
      sendBtn.disabled = true;

      var loadingEl = addMessage("bot", "thinking…", true);

      try {
        var res = await fetch(WORKER_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ messages: history })
        });

        var data = await res.json();
        loadingEl.remove();

        if (!res.ok || data.error) {
          addMessage("bot", "⚠️ " + (data.error || "Terjadi kesalahan."));
          return;
        }

        addMessage("bot", data.reply);
        history.push({ role: "assistant", content: data.reply });
      } catch (err) {
        loadingEl.remove();
        addMessage("bot", "⚠️ Gagal terhubung ke server. Coba lagi.");
      } finally {
        sendBtn.disabled = false;
      }
    }

    sendBtn.addEventListener("click", sendMessage);
    inputEl.addEventListener("keydown", function (e) {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
      }
    });

    // Auto-grow textarea
    inputEl.addEventListener("input", function () {
      inputEl.style.height = "auto";
      inputEl.style.height = Math.min(inputEl.scrollHeight, 96) + "px";
    });
  })();
})();