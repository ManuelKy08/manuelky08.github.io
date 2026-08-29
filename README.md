<div align="center">

<!-- ════════ ANIMATED TYPING BANNER ════════ -->
<!-- Dynamically typing GIF (readme-typing-svg), no upload needed -->
<img src="https://readme-typing-svg.demolab.com?font=Fira+Code&weight=600&size=26&duration=2800&pause=900&color=4ADE80&center=true&vCenter=true&multiline=false&repeat=true&width=680&height=65&lines=~%2Fportfolio+%F0%9F%9A%80;Risky+Manuel+Tamba+%E2%80%94+Bug+Bounty+Hunter;Web+Security+%E2%80%A2+Recon+%E2%80%A2+OSINT+%E2%80%A2+CTF;Live+at+manuelky08.github.io" alt="Animated banner — portfolio live preview" />

<br/>

<a href="https://manuelky08.github.io/">
  <img src="https://img.shields.io/badge/🔗_Live_Demo-16a34a?style=for-the-badge&logo=githubpages&logoColor=white" alt="Live Demo"/>
</a>
<a href="https://github.com/ManuelKy08">
  <img src="https://img.shields.io/badge/GitHub-ManuelKy08-181717?style=for-the-badge&logo=github&logoColor=white" alt="GitHub"/>
</a>
<a href="https://hack.redlimit.id/profile/kikikokok09">
  <img src="https://img.shields.io/badge/CTF-Rank_%235-16a34a?style=for-the-badge&logo=counter-strike&logoColor=white" alt="RedLimit CTF"/>
</a>

</div>

---

## 🖥️ Portfolio — Risky Manuel Tamba

Personal portfolio & bug bounty hunter site, built with pure **HTML / CSS / JavaScript** (no frameworks, no build step). Features a live **AI chat assistant** powered by a [Cloudflare Worker](worker.js) using **Workers AI** on the free tier.

> 🌐 **Live:** [manuelky08.github.io](https://manuelky08.github.io/)

---

## ✨ Features

- 🎯 **Dark terminal aesthetic** — `rr-sec` cyberpunk vibe, green-on-black, animated particle background
- ⚡ **Animated hero** — ASCII cat art + interactive `~/whoami` typewriter terminal with tabs
- 📜 **Findings timeline** — XSS, IDOR, SQLi, with real acknowledgement history (CSIRT KAI, Siloam, Depok gov, etc.)
- 🏆 **CTF spotlight** — [Rank #5 on RedLimit](https://hack.redlimit.id/profile/kikikokok09) · 58 solves · 7,620 points
- 🛠️ **Skills & certifications** — web exploitation, tooling, scripting, networking
- 💬 **AI chat assistant** — free-tier Cloudflare Workers AI (Llama 4 Scout), no frontend API keys
- 📱 **Fully responsive** — mobile-first, mobile menu, reduced-motion support

---

## 🚀 Quick Start (local)

```bash
# 1. Clone
git clone https://github.com/ManuelKy08/manuelky08.github.io.git
cd manuelky08.github.io

# 2. Serve locally (any static server works)
python3 -m http.server 8899
# open http://127.0.0.1:8899/
```

Then push to the `main` branch → GitHub Pages serves it automatically.

---

## 🧩 Project Structure

```
├── index.html     # Single-page portfolio (hero, about, findings, skills, cert, projects, contact)
├── style.css      # Terminal aesthetic theme + responsive layout
├── script.js      # Canvas bg, tab typewriter, nav, reveal, chat widget
├── worker.js      # Cloudflare Worker — AI chat backend (Workers AI, free tier)
├── wrangler.toml  # Worker config (AI binding)
└── chat-widget.html  # Original widget source (reference)
```

---

## 💬 AI Chat Backend

The chat widget sends messages to a deployed Cloudflare Worker:

```
POST /  { "messages": [ { "role": "user", "content": "..." } ] }
→ 200   { "reply": "..." }
```

- **Model:** `@cf/meta/llama-4-scout-17b-16e-instruct`
- **Deploy the worker:**
  ```bash
  wrangler deploy
  ```
- Frontend never holds an API key — everything is server-side on the Worker. ✅

---

## 🗺️ Roadmap

- [x] Terminal hero + typewriter
- [x] Findings / achievements timeline
- [x] AI chat assistant (free tier)
- [x] Responsive + reduced-motion
- [ ] Dark/light theme toggle
- [ ] Blog / write-ups section

---

## 🌟 Show Your Support

If this portfolio helped you or you just like the vibe, give the repo a ⭐!

<p align="center">
  <a href="https://github.com/ManuelKy08/manuelky08.github.io"><img src="https://img.shields.io/github/stars/ManuelKy08/manuelky08.github.io?style=for-the-badge&color=16a34a" alt="GitHub stars"/></a>
</p>

---

<div align="center">
  <sub>© 2026 Risky Manuel Tamba — <code>rr-sec</code></sub>
</div>
