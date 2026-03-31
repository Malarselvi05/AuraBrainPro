# 🧠 AuraBrain Pro

<div align="center">

**A Local-First AI Mastery Engine for High-Performance Learning**

[![Next.js](https://img.shields.io/badge/Next.js-16-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![License](https://img.shields.io/badge/License-MIT-purple?style=for-the-badge)](LICENSE)

*Turn any curriculum into a constraint-aware, AI-generated learning roadmap — then execute it in a distraction-free deep work session.*

</div>

---

## ✨ What is AuraBrain Pro?

AuraBrain Pro is a **local-first productivity and learning system** that bridges the gap between having a syllabus and actually mastering it. Instead of a passive to-do list, it gives you:

- 🎯 **Mission Control** — organize your learning goals as missions with structured day-by-day vaults
- 🤖 **AI Architect** — paste any curriculum and get a realistic, time-budgeted 10-day roadmap
- ⏱️ **Deep Work Sessions** — a focused timer UI where you log time against specific days
- 📚 **Chrono-Vault** — track every day's topics, project milestones, and outcomes in one place
- 💰 **Aura Point Economy** — earn points for completing sessions and days, spend them on break extensions

---

## 🖼️ Screenshots

| Dashboard | Deep Work Session |
|---|---|
| Mission Control with expandable Day Vaults | Two-column focus: Chrono-Vault + Timer |

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn
- A Gemini API key (free) from [aistudio.google.com/app/apikey](https://aistudio.google.com/app/apikey)

### Installation

```bash
# Clone the repository
git clone https://github.com/Malarselvi05/AuraBrainPro.git
cd AuraBrainPro

# Install dependencies
npm install

# Start the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

> **No database setup required.** All data is stored locally in `database/mirror.json`.

---

## 🤖 AI Roadmap Generation

AuraBrain Pro supports two modes for generating learning roadmaps:

### Mode 1: In-App AI (API Key Required)
1. Click the **⚙️ Settings** icon (top right)
2. Paste your **Gemini API Key** (recommended — free tier available)
3. Open **New Mission** → click **✨ AI Mastery Architect**
4. Set your target days and hours per day
5. Paste your curriculum and click **GENERATE ROADMAP**

> The AI follows a strict **40/40/20 mastery rule** (40% learning, 40% hands-on coding, 20% debugging/revision) and builds one **incremental project** that grows across all days.

### Mode 2: Zero-Key Fallback (No API Key Needed)
1. Open **New Mission** → **AI Mastery Architect**
2. Paste your curriculum and click **🤖 Open in ChatGPT** or **✨ Open in Gemini**
3. Copy the AI output
4. Paste it into the **"Paste AI output here"** box
5. Click **⚡ Inject into Chrono-Vault**

The parser automatically groups content by `Day X` blocks — each day becomes one vault node.

---

## 📋 Core Features

### 🎯 Mission Control (Dashboard)
- Create missions with a title and auto-generated or manually added Day Vault nodes
- Expand any mission to see its full Chrono-Vault (All days, topics, project, and outcome)
- Edit or permanently delete any mission
- Real-time pulse sync every 10 seconds

### 📚 Chrono-Vault (Day Nodes)
Each AI-generated Day Vault shows:
- **Header** — Day number, hours, and topic group title
- **📚 Topics** — rendered as colored pills inside the Deep Work view
- **🏗️ Project Milestone** — the incremental feature to build that day
- **✅ Outcome** — what you should be able to do after this day

### ⏱️ Deep Work Sessions
Click **LOG IN** on any mission to enter a focused work session:
- **Chrono-Vault list** on the left — click a day to focus on it
- **Timer panel** on the right — countdown timer or stopwatch
- Mark days ✓ **complete** or click again to **undo**
- Progress bar showing X/N days done
- Automatic **5-minute Palette Cleanser break** after each session
- Spend **Aura Points** to extend your break

### 💰 Aura Point Economy
| Action | Points |
|---|---|
| Complete a focus session | +10 pts |
| Mark a day vault done | +20 pts |
| Undo a completed day | -20 pts |
| Extend a break by 5 minutes | -5 pts |

---

## 🏗️ Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router, Turbopack) |
| Language | TypeScript |
| Storage | `database/mirror.json` (local-first, zero DB setup) |
| AI — Option A | OpenAI GPT-4o (requires paid key) |
| AI — Option B | Google Gemini 1.5 Flash (free tier available) |
| Animations | Framer Motion |
| Icons | Lucide React |
| Styling | Vanilla CSS — Glassmorphism design system |

---

## 📁 Project Structure

```
AuraBrainPro/
├── database/
│   └── mirror.json          # Local-first data store (tasks + settings)
├── src/
│   └── app/
│       ├── page.tsx          # Main dashboard (Mission Control)
│       ├── api/
│       │   ├── tasks/        # CRUD API for missions + settings
│       │   │   └── [id]/     # PATCH + DELETE for individual missions
│       │   └── ai/
│       │       ├── planner/  # OpenAI GPT-4o bridge
│       │       └── gemini/   # Google Gemini auto-discovery bridge
│       └── deep-work/
│           └── [id]/         # Deep Work focus session page
├── scripts/
│   └── fix_vault_render.js   # Dev utility: vault card renderer patch
└── AuraBrain-Pro-Plan.md     # Living build log and roadmap
```

---

## ⚙️ Configuration

All settings are stored locally in `database/mirror.json` under the `settings` key:

```json
{
  "settings": {
    "aiApiKey": "sk-...",         // OpenAI key (optional)
    "geminiApiKey": "AIzaSy...",  // Gemini key (recommended)
    "preferredModel": "gemini",   // "gemini" | "openai"
    "agentEnabled": true
  }
}
```

> ⚠️ **Never commit your API keys.** The `database/` folder should be in your `.gitignore`.

---

## 🗺️ Roadmap

| Phase | Status |
|---|---|
| Phase 1 — Core Foundation & Storage | ✅ Complete |
| Phase 2 — AI Architect (Roadmap Generator) | ✅ Complete |
| Phase 3 — Chrono-Vault & Mission Lifecycle | ✅ Complete |
| Phase 4 — Deep Work Session UI | ✅ Complete |
| Phase 5 — Progress Visualization (Charts, Heatmap) | 🔲 Planned |
| Phase 6 — Story Weaver AI (Quote → Action) | 🔲 Planned |
| Phase 7 — Polish (Export, Mobile, History Tab) | 🔲 Planned |

See [AuraBrain-Pro-Plan.md](./AuraBrain-Pro-Plan.md) for the full detailed checklist.

---

## 📌 Known Issues

- **Gemini API Key**: Must be from [AI Studio](https://aistudio.google.com/app/apikey), not Google Cloud Console, to have free-tier quota
- **Database growth**: `mirror.json` grows unboundedly — log rotation is planned for Phase 7
- **Mobile**: UI is currently desktop-optimized only

---

## 🤝 Contributing

This is a personal productivity project, but PRs and issues are welcome! Please open an issue first to discuss what you'd like to change.

---

## 📄 License

MIT © [Malarselvi](https://github.com/Malarselvi05)
