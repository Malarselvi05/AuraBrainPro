# AuraBrain-Pro Final Project Plan (Refined MVP)

AuraBrain-Pro is a **Local-First Growth Engine** for your laptop. It bridges the gap between your academic Python studies (takeuforward) and your philosophical inspirations, using a "Story Weaver" AI to give meaning to everything you learn and do.

---

## 🏁 Phase 1: The Core Foundation (Project Setup) [COMPLETED] ✅
Setting up the high-speed local engine.
- **Framework**: Next.js 14/16 (App Router) + TypeScript.
- **Database**: Prisma + SQLite (Local-First).
- **Integrity Rules & Schema**: 
  - **Task States**: `todo` | `in_progress` | `completed`.
  - **Timestamps**: Mandatory `createdAt` for all; `completedAt` for tasks.
  - **Deterministic Notes**: AI context uses the **last 2 notes** (ordered by `createdAt` DESC).
- **Aesthetics**: Premium Dark-Mode shell with Glassmorphism and Framer Motion transitions.

---

## 🧠 Phase 2: The "Story Weaver" (MVP Logic)
Turning passive quotes into active inspiration with a "Frictionless" UX.
- **Safety Mechanism**: `storyStatus` (`pending` | `ready`) to prevent duplicate AI calls.
- **Mandatory Editing**: Every AI-generated task **must** be editable before saving.
- **Convert to Action**: A dedicated "Convert to Task" button that turns a story into an executable Python or Academic task.
- **Forced Structure**: AI stories follow a strict **[Situation] → [Action] → [Outcome]** format.

---

## 📊 Phase 3: The Learning & Task Suite (Chrono-Vault) [MASTERED ⚡]
High-granularity growth tracking with integrated rewards.
- **Hierarchical Tasking**: Missions (Objectives) contain Daily Focus Sparks (Sub-tasks).
- **Chrono-Sync**: Every sub-task effort automatically fuels the parent mission's total time.
- **Aura Rewards**: Visual "Aura Point" pulse & Trophy mastery system (v9.0).
- **Registry Engine**: Mirror Hub (v9.0) handles all local-first tree persistence.

---

## 🌌 Phase 4: Visuals & Resonance (Simplified UX)
Visual clarity and daily overview.
- **2D Knowledge Graph**: Clean, interconnected web (Quote ↔ Task ↔ Curriculum).
- **Daily Dashboard**: "What you learned yesterday" (Data-backed by **timestamped** tasks/notes).
- **Performance**: UI actions <100ms. AI marked as background.

---

## 🛑 Critical Design Philosophies (Final Fixes)
- **Direct Conversion**: Turning thought into action (Story → Task) must be 1-click.
- **Data Integrity**: Every quote *must* have a home to appear in the graph.
- **Small wins**: Every task must be small enough to complete quickly.

> [!TIP]
> **Takeuforward Integration**: We will populate the tracker with the **A2Z Python Sheet** sections (Basics, Collections, OOP, DSA).
