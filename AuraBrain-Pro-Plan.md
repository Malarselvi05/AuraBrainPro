# AuraBrain-Pro — Master Build Log & Roadmap

> **Local-First AI Mastery Engine** · Next.js 16 · TypeScript · `database/mirror.json`
> Last updated: 2026-03-31

---

## ✅ Phase 1 — Core Foundation [COMPLETE]

- [x] Next.js 16 (App Router) + TypeScript project scaffolded
- [x] Local-first storage engine — `database/mirror.json` (no external DB)
- [x] Mirror Hub API (`/api/tasks`) — full CRUD: GET / POST / PATCH / DELETE
- [x] Task schema with `subtasks[]`, `timeSpentSeconds`, `auraPoints`, `storyId`, `resources`
- [x] Settings object isolated in `mirror.json` (`aiApiKey`, `geminiApiKey`, `preferredModel`)
- [x] Master Sync Lock — settings updates never create phantom missions
- [x] Premium dark-mode shell — Glassmorphism, Framer Motion, Outfit/Inter fonts
- [x] Pulse-sync every 10s to keep dashboard in sync with `mirror.json`

---

## ✅ Phase 2 — AI Architect (Roadmap Generator) [COMPLETE]

- [x] Hybrid Mission Modal — Manual node creation + AI-powered roadmap generation
- [x] **OpenAI Bridge** (`/api/ai/planner`) — GPT-4o via server-side route
- [x] **Gemini Bridge** (`/api/ai/gemini`) — Auto-discovers available model via `ListModels` API (no hardcoded model names)
- [x] Dual-Engine Selector in Settings — switch between OpenAI / Gemini at runtime
- [x] **Zero-Key Fallback** — "Open in ChatGPT / Gemini / Copy Prompt" when no API key
- [x] Paste-back Inject — paste AI output → auto-parse into vault nodes
- [x] **Section-aware parser** — strips `Topics:`, `Structure:`, `Project Milestone:`, `Time Split:` noise
- [x] **Day-block grouping** — one vault node per Day, not one per line
- [x] Inline separator format (`·`) handled — separates topics from project milestone
- [x] Incremental project prompt — AI instructed to build ONE evolving project across days
- [x] Mastery Architect system prompt — enforces 40/40/20 rule, outcomes, day limits

---

## ✅ Phase 3 — Chrono-Vault & Mission Lifecycle [COMPLETE]

- [x] Subtask (Day Vault) CRUD — add, edit title, remove nodes in modal
- [x] Mission edit — full edit of title, description, and subtask list
- [x] Mission delete — permanent termination with confirmation (`DELETE /api/tasks/:id`)
- [x] Expandable vault view — click "CHRONO-VAULT DATA" on dashboard to reveal Day nodes
- [x] **Structured vault card renderer** — parses `\n`-separated sections from AI-injected nodes:
  - Day header (bold white)
  - 📚 Topics (purple pills — expanded on click in Deep Work)
  - 🏗️ Project Milestone (accent color)
  - ✅ Outcome (green)
- [x] Total mission time displayed on dashboard cards

---

## ✅ Phase 4 — Deep Work Session Page [COMPLETE]

- [x] `/deep-work/[id]` — full-screen focus session for any mission
- [x] **Two-column layout**: Chrono-Vault list (left) + Timer panel (right)
- [x] Chrono-Vault list shows all day nodes — click to focus, ✓ to complete/undo
- [x] **Expandable day detail on click** — topic pills, 🏗️ project, ✅ outcome
- [x] **Toggle complete/undo** — clicking ✓ again undoes completion, adjusts Aura pts
- [x] Progress bar — X/N days done + percentage
- [x] Focus Timer (countdown) + Stopwatch mode toggle
- [x] Custom duration input (disabled while running)
- [x] Palette Cleanser — automatic 5-min break after each focus session
- [x] Break extension — spend 5 Aura Points for +5 min recovery
- [x] Aura Point economy — +10 per session complete, +20 per day vault done, -20 on undo
- [x] Auto-save time to `mirror.json` on session complete + manual "Save Progress" button
- [x] "Now Focusing On" card shows active selected day
- [x] Motivation spark quote displayed from global quotes or fallback SPARKS[]
- [x] Reward toast animation (+10 pts popup)

---

## 🔲 Phase 5 — Progress Visualization [REMAINING]

- [ ] **Mission Progress Chart** — line/bar chart (Recharts) showing time logged per day over the week
- [ ] **Heatmap** — GitHub-style activity heatmap for focus streaks
- [ ] **Per-mission stats panel** — total time, days completed, avg session length
- [ ] **Aura Points history** — ledger of earned/spent points

---

## 🔲 Phase 6 — Story Weaver AI [REMAINING]

- [ ] Global Quotes tab — save quotes/inspirations to `mirror.json`
- [ ] "Story Weaver" — AI converts a quote into a [Situation → Action → Outcome] story
- [ ] Story → Task conversion (1-click: turn AI story into a Chrono-Vault mission node)
- [ ] `storyStatus`: `pending` | `ready` to prevent duplicate AI calls
- [ ] Story edit modal before saving (mandatory editing gate)

---

## 🔲 Phase 7 — Polish & Advanced Features [REMAINING]

- [ ] **API Key Validation** — client-side check before attempting roadmap generation (show friendly error if key is invalid before the API call)
- [ ] **History Tab** — browse past completed missions and their logged sessions
- [ ] **Log Rotation** — archive `mirror.json` if task history exceeds a size threshold
- [ ] **Mini-project boilerplate links** — link `[MINI-PROJECT]` nodes to starter code templates
- [ ] **Export Roadmap** — download the day vault as a `.md` or `.pdf` file
- [ ] **Responsive Mobile Layout** — current UI is desktop-optimized only

---

## 🏗️ Architecture Reference

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router, Turbopack) |
| Language | TypeScript |
| Storage | `database/mirror.json` (local-first, no DB) |
| AI Bridges | OpenAI GPT-4o · Google Gemini (auto-discovered) |
| Animations | Framer Motion |
| Icons | Lucide React |
| Styling | Vanilla CSS (glassmorphism design system) |

---

## 📌 Known Issues / Watch Items

- Gemini API key must be from **AI Studio** (`aistudio.google.com/app/apikey`), not Google Cloud Console, to have free-tier quota
- `mirror.json` grows unboundedly — implement log rotation in Phase 7
- The structured vault parser assumes `\n`-separated sections; plain-text pasted roadmaps fall back to line-by-line mode
