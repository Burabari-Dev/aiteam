# AI Team — Project Plan v1

A desktop app that orchestrates panel meetings of AI specialist agents (powered by opencode) for collaborative project discussion and expert opinion.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Desktop framework | Wails v2 (Go backend + WebView frontend) |
| Frontend | React 18 + Vite |
| UI components | @astryxdesign/core (Meta's open-source design system) |
| Theme | @astryxdesign/theme-neutral (default) + runtime theme switcher |
| AI engine | opencode CLI spawned as managed subprocesses |
| LLM provider | Whatever user configures in opencode (Anthropic, OpenAI, etc.) |
| Data store | JSON files on disk — hybrid model (registry + in-project `.aiteam/`) |

---

## Data Storage — Hybrid Model

### Central Registry

```
~/.config/team-meeting-app/
└── projects.json              # [{ name, path, last_opened, project_name }]
```

### In-Project `.aiteam/` Folder

```
my-project/
└── .aiteam/
    ├── meta.json               # project metadata (name, description, created_at)
    ├── team/                   # per-role context + history
    │   ├── architect/
    │   │   ├── context.md      # role instructions, project-specific notes
    │   │   └── history.jsonl   # appended every meeting (full transcript)
    │   ├── frontend-dev/
    │   │   └── ...
    │   └── ...
    └── meetings/
        ├── 1712345678-initial-architecture-review.json
        └── 1712356789-sprint-planning.json
```

Meeting data travels with the project — clone, move, share, it's all there. The `.aiteam/` folder is added to `.gitignore` by default with an option to share meeting history.

---

## Screens

### A. Landing Page
- Grid of project cards (Astryx `Card`)
- "New Project" button — picks project folder from disk
- Each card: project name, description, last meeting date, team size
- Empty state: "Create your first project"

### B. Project Page
- Header: project name, description, edit, "Open Project Folder"
- **"Start New Meeting"** button (prominent, top)
- If active meeting exists → prompt to resume or end it
- Past meetings list: auto-title + date + participant count
- Select a past meeting → resumes with full transcript context
- Meetings reverse-chronological

### C. Meeting Setup (Dialog)
- Checkbox list of available team roles for this project
- Pre-select all by default
- Optional: meeting focus/goal
- Confirm → spawns agent sessions, enters meeting UI

### D. Meeting Chat (Main Screen)
- **Top bar**: meeting title (editable), timer, "End Meeting" button
- **Central chat area** — scrollable message list
  - User messages vs. agent messages (color-coded by role, avatar+name, timestamp)
- **Input box**: text with `@` autocomplete (fuzzy role search), file attachment, send
- **Right sidebar (required, resizable)**:
  - Grid of avatar cards with role name for each active participant
  - Subtle pulse animation on an agent's avatar when it is formulating a response

### E. Meeting End
- "End Meeting" → auto-generate title via opencode title agent
- Preview title, user can edit
- Save → transcript written, sessions closed, back to project page

---

## AI Agent Architecture

### Agent Configuration
- Each role is an opencode agent (`.md` config) with:
  - Custom system prompt defining the role
  - Restricted permissions: `read: allow`, `glob/grep: allow`, `edit: deny`, `bash: deny`
- Role templates shipped predefined (Architect, FE Dev, BE Dev, QA, DevOps, PM, UI/UX Designer)

### Meeting Chat Flow
```
User: "@architect and @qa, review this API design"

App parses @mentions → ["architect", "qa"]

For each mentioned agent (in parallel):
  → opencode run --session <id> --dir <project-root> --format json "<message>"
  → Wait for full response
  → Render in chat, stop avatar animation
```

### Session Management
- Each agent gets one opencode session per meeting
- Session IDs stored in meeting JSON
- `--session <id>` continues context across messages and app restarts
- Meeting resume: same flow, full transcript already in history

### 1-Active-Meeting Rule
- Enforced in Go backend — only one meeting active at a time
- Starting new while active: prompt to end current
- Crash recovery via `active_meeting.json` in registry

---

## Predefined Roles (shipped)

| Role | Focus |
|------|-------|
| Architect | System design, trade-offs, scalability, patterns |
| Frontend Developer | UI/UX, components, state, performance |
| Backend Developer | APIs, data models, services, auth, DB |
| QA Engineer | Test coverage, edge cases, bug prevention |
| DevOps | CI/CD, infra, deployment, security |
| Product Manager | Requirements, prioritization, roadmap |
| UI/UX Designer | Design review, accessibility, user flows |

---

## Implementation Phases

| Phase | What | Effort |
|-------|------|--------|
| **1** | Wails scaffold + Go backend + data model + project registry + `.aiteam/` manager | ~3 days |
| **2** | Astryx integration + landing page + project page | ~3 days |
| **3** | Meeting setup + opencode subprocess spawning + session management | ~3 days |
| **4** | Meeting chat UI (input, @autocomplete, message display, right sidebar) | ~3 days |
| **5** | @mention routing + opencode integration + streaming responses | ~2 days |
| **6** | Meeting end (auto-title, save, cleanup) + resume past meeting | ~2 days |
| **7** | Theme switcher, settings, role customization, polish | ~2 days |

---

## Git Workflow

- One commit per completed item within each phase
- Push to `https://github.com/Burabari-Dev/aiteam.git` (force-replace existing content)
- Commit messages: `phase-1: description`
