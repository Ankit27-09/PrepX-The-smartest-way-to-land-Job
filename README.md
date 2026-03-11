<div align="center">

<img width="400" height="300" alt="image" src="https://github.com/user-attachments/assets/a9f918aa-d2bf-4b05-adee-def7eb776435" />


### Your Unfair Advantage in the Tech Job Market

Master live interviews, map complex career paths, and upskill faster with a real-time AI co-pilot.

</div>

---

<!-- SCREENSHOT: Landing page hero section -->
<img width="1900" height="862" alt="image" src="https://github.com/user-attachments/assets/953290a6-96a5-41c7-bc05-409fd5d38faf" />

PrepX is a full-stack, AI-powered career preparation platform that combines **real-time voice/video AI agents**, **multi-agent career intelligence**, and **adaptive learning** into a single unified experience. It goes beyond typical mock interview apps by integrating live AI tutoring with 3D avatars, multi-stage career simulations powered by LangGraph agent workflows, intelligent ATS-connected job discovery, and AI-generated personalized courses - all backed by Google Gemini, Groq LLMs, and LiveKit WebRTC.


## The Core Features

### 1. Real Time 3D AI Interview

Practice via live video with an intelligent AI interviewer that adapts to your skill level. Get real-time feedback, proctoring analytics, and detailed performance breakdowns.
<img width="1422" height="668" alt="image" src="https://github.com/user-attachments/assets/ffc64cb8-d433-4ef1-add0-443c57e1c035" />


**Interview Creation : 5-Step Wizard:**
1. **Job Description** - Upload PDF or paste JD text; AI extracts role, skills, requirements via Groq LLM
2. **Interview Context** - Resume upload, experience level, focus areas
3. **Settings** - Duration, difficulty, interview type (technical/behavioral/mixed)
4. **Review** - Preview all settings before publishing
5. **Publish** - Go live and enter the interview room

**Interview Room Features:**
- **Live Video** - WebRTC-powered face-to-face with AI interviewer
- **Code Editor** - Monaco Editor with syntax highlighting, multiple language support
- **Coding Questions** - Real problems from LeetCode GraphQL API and Codeforces API
- **Whiteboard** - Excalidraw integration for system design and diagramming
- **Timer** - Configurable countdown timer
- **Chat Panel** - Text-based communication alongside voice
- **Fullscreen Mode** - Immersive fullscreen interview environment

**Results & Analytics:**
- **Radar Chart** - Scores across Technical, Communication, Behavioral, Problem-Solving, and Confidence
- **Skill Assessments** - Per-skill feedback with detailed comments
- **Proctoring Metrics** - Eye contact, attention, posture, noise levels, and face visibility tracking
- **Malpractice Detection** - Flagged incidents with severity levels and timestamps
- **Performance Timeline** - Visual progression throughout the interview

<!-- SCREENSHOT: Interview results page with radar chart and analytics -->
> 📸 **Screenshot:** *Add a screenshot of the interview results analytics here*

---

### 2. Real Time AI Tutor Assistant

Connect with a real-time voice and video AI tutor powered by a 3D avatar. Share your screen, code along, and get instant multimodal educational assistance.

<img width="1391" height="735" alt="image" src="https://github.com/user-attachments/assets/7dd09836-73b2-410a-96de-125931eabc8e" />
<img width="989" height="611" alt="image" src="https://github.com/user-attachments/assets/783a7a7c-9ec1-4019-b752-483299d0cf83" />

- **3D Avatar** - Photorealistic avatar powered by Bey SDK with real-time lip sync
- **Voice Conversation** - Natural voice interaction via Google Gemini Realtime API with "Puck" voice synthesis
- **Screen Sharing** - Share your screen for the tutor to see and discuss your code or documents
- **Camera Support** - Enable your webcam for a face-to-face tutoring experience
- **Live Transcription** - Real-time speech-to-text transcription displayed as chat messages
- **Text Chat** - Type messages alongside voice for a mixed-mode interaction
- **Session Summaries** - AI generates detailed session summaries emailed as branded HTML with topics, concepts, and next steps
- **Adaptive Teaching** - Explanations adapt to your level; errors are guided through step-by-step
- **WebRTC** - Powered by LiveKit for low-latency real-time audio/video streaming


---

### 3. ATS Job Discovery

Prepx uses a **8-Agent Pipeline** to scour the web, aggregate listings, normalize and deduplicate jobs, and score them against your resume.
Get deep market analysis (salary trends, skill gaps) from Google Jobs, ATS Feeds and more.

<img width="1837" height="871" alt="image" src="https://github.com/user-attachments/assets/c7a97ee5-054e-45be-a8e8-82a3ae4836cf" />
<img width="1179" height="611" alt="image" src="https://github.com/user-attachments/assets/5226f3a6-42df-48b8-8c11-fbc322ba2689" />

**Multi-Agent Pipeline:**
```
ResumeParser → IntentParser → QueryGenerator → DiscoveryAgent → NormalizationAgent → ScoringAgent → InsightsAgent
```

- **Resume-Powered** — Upload resume or enter profile manually; AI extracts skills, experience, and domains
- **Multi-Source Discovery** — Aggregates jobs from SerpAPI, Greenhouse ATS, Lever ATS, and configurable job boards
- **Direct ATS Access** — Scrapes listings from 30+ companies including Airbnb, Stripe, Netflix, Coinbase, Databricks, Notion, Figma, Vercel, and more
- **AI Scoring** — Each job scored against your profile with match percentage, matching/missing skills breakdown
- **Chat Refinement** — Conversational interface to refine search results with natural language
- **Job Enrichment** — Detailed per-job breakdown with skill gap analysis
- **Search History** — Track past searches with per-user persistence
- **Location Filtering** — Onsite, remote, hybrid with salary range data

---

### 4. Smart PDF Chat

Transform static documents into interactive learning experiences. Upload PDFs and images, then chat directly with your documents using multi-modal RAG.

<img width="1392" height="742" alt="image" src="https://github.com/user-attachments/assets/9a7ed957-e101-49a6-929a-df71e20b1ea0" />
<img width="1298" height="739" alt="image" src="https://github.com/user-attachments/assets/63419665-1199-4ee6-80c0-9c57575595f6" />

- **Multi-Format Upload** - Drag-and-drop PDFs and images with real-time processing feedback
- **Text Extraction** - PyPDF + PyMuPDF for robust text and embedded image extraction
- **Image Intelligence** - Automatic image extraction from PDFs with page tracking; vision model analysis of images
- **Vector Search** - ChromaDB multi-vector retriever with Gemini embeddings (`gemini-embedding-001`)
- **Contextual Answers** - Markdown-formatted responses with relevant document references and image previews
- **Code Support** - Syntax-highlighted code blocks with copy-to-clipboard
  
---

### 🎓 AI Course Generation

Generate fully customized courses tailored to your goals — with interactive articles, flashcards, mind maps, and multi-format quizzes.

<!-- SCREENSHOT: Course generation page showing a generated course with sections -->
> 📸 **Screenshot:** *Add a screenshot of a generated course overview here*

- **Customizable** — Pick topic, difficulty level, learning goal, tone, and section count (up to 20)
- **Rich Content** — Each section includes multi-page articles with markdown rendering
- **Flashcards** — Spaced repetition flashcards with difficulty tracking and review scheduling
- **Mind Maps** — Hierarchical concept maps rendered as interactive node graphs (React Flow)
- **Quizzes** — Three formats per section: Multiple Choice, True/False, and Fill-in-the-Blanks
- **Eagle View** — Bird's-eye visualization of the entire course content as an interconnected node graph
- **Progress Tracking** — Per-section completion, article read status, quiz scores, and overall progress bars
- **Powered by** — Google Gemini with structured JSON output and retry logic for reliable generation

<!-- SCREENSHOT: Flashcard viewer or mind map view -->
> 📸 **Screenshot:** *Add a screenshot of the flashcard viewer or mind map here*

---

### 🗺️ Career Path Simulator

Visualize your future with a comprehensive multi-stage career simulation powered by a 9-node LangGraph agent workflow.

<!-- SCREENSHOT: Career path dashboard showing simulation results -->
> 📸 **Screenshot:** *Add a screenshot of the career simulation dashboard here*

**Two-Stage AI Pipeline:**

**Stage 1 — Career Matching:**
```
ProfileParser → CareerMatcher → 3 Best-Fit Career Paths (with scores & reasoning)
```

**Stage 2 — Full Simulation (per selected career):**
```
MarketScout → GapAnalyst → TimelineSimulator → FinancialAdvisor → RiskAssessor → DashboardFormatter
```

- **Profile Analysis** — Upload resume or fill detailed form (skills, education, aspirations, psychometrics)
- **3 Career Matches** — AI scores each fit across skills, interests, market demand, and personality
- **Market Research** — Real-time market demand, salary ranges, and growth outlook
- **Gap Analysis** — Missing skills identification with recommended certifications, courses, and projects
- **Timeline Simulation** — Realistic career progression milestones with timeframes
- **Financial Projection** — Salary progression, investment needed, and ROI analysis
- **Risk Assessment** — Market saturation, skills obsolescence, and mitigation strategies
- **Interactive Dashboard** — Financial charts, risk matrices, and actionable roadmaps
- **Resume Upload** — Auto-extract profile data from uploaded PDF resumes

<!-- SCREENSHOT: Career fits result page with 3 career matches -->
> 📸 **Screenshot:** *Add a screenshot of the career matches result here*

---


---

### 🎙️ Career Voice Counselor

Real-time voice-based career counseling agent with MongoDB-backed context awareness.

- **Voice Sessions** — 30-minute voice conversations powered by LiveKit + Gemini Realtime
- **Context-Aware** — Fetches your career roadmap from MongoDB for personalized advice
- **Career Guidance** — Path evaluation, skill gap analysis, market insights, goal setting
- **Multi-Channel** — Supports both web-based audio and SIP telephony

---

## 🏗️ Architecture

```
┌──────────────────────────────────────────────────────────────────────┐
│                          CLIENT (React 19)                          │
│                        localhost:5173 (Vite)                        │
│                                                                      │
│  ┌─────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌───────────┐  │
│  │ Courses │ │ PDF Chat │ │ Career   │ │ Jobs     │ │ Interviews│  │
│  │         │ │          │ │ Path     │ │ Discovery│ │ & Tutor   │  │
│  └────┬────┘ └────┬─────┘ └────┬─────┘ └────┬─────┘ └─────┬─────┘  │
│       │           │            │             │             │         │
│       │      Vite Proxy: /api → :5000  |  /api/ai-tutor,           │
│       │           /api/career, /api/jobs, /api/interviews → :8000   │
└───────┼───────────┼────────────┼─────────────┼─────────────┼────────┘
        │           │            │             │             │
   ┌────▼───────────▼────┐ ┌────▼─────────────▼─────────────▼────────┐
   │   NODE.JS SERVER    │ │         PYTHON SERVER (FastAPI)          │
   │   Express 5         │ │         localhost:8000                   │
   │   localhost:5000     │ │                                         │
   │                      │ │  ┌──────────┐  ┌───────────────────┐   │
   │  • Auth (JWT/OAuth)  │ │  │ PDF Chat │  │ Interview System  │   │
   │  • Course CRUD       │ │  │ (RAG)    │  │ (Groq + LiveKit)  │   │
   │  • Course Generation │ │  └──────────┘  └───────────────────┘   │
   │    (Gemini API)      │ │  ┌──────────┐  ┌───────────────────┐   │
   │  • Quiz & Flashcard  │ │  │ Career   │  │ Job Discovery     │   │
   │    Tracking          │ │  │ Simulator│  │ (7-Agent Graph)   │   │
   │                      │ │  │(LangGraph│  │                   │   │
   │                      │ │  │ 9 Agents)│  │                   │   │
   └──────────┬───────────┘ │  └──────────┘  └───────────────────┘   │
              │             └────────────┬───────────────────────────-┘
              │                          │
   ┌──────────▼──────────────────────────▼───────────────────────────┐
   │                        MONGODB ATLAS                            │
   │                                                                  │
   │  Collections: users, ai_courses, ai_course_sections,            │
   │  article_pages, flashcards, mcq_questions, true_false_questions,│
   │  fill_up_questions, mind_maps, interviews, job_searches,        │
   │  career_roadmaps                                                 │
   └──────────────────────────────────────────────────────────────────┘

   ┌──────────────────────────────────────────────────────────────────┐
   │                      LIVEKIT AGENTS                              │
   │                                                                  │
   │  ┌────────────────┐  ┌──────────────────┐  ┌────────────────┐   │
   │  │  AI Tutor      │  │  AI Interviewer  │  │  Career Voice  │   │
   │  │  Agent         │  │  Agent           │  │  Counselor     │   │
   │  │                │  │                  │  │                │   │
   │  │ • Gemini RT    │  │ • Live Video     │  │ • Gemini RT    │   │
   │  │ • Bey Avatar   │  │ • Code Eval      │  │ • MongoDB      │   │
   │  │ • Email Summary│  │ • Proctoring     │  │   Context      │   │
   │  └────────────────┘  └──────────────────┘  └────────────────┘   │
   └──────────────────────────────────────────────────────────────────┘

   ┌──────────────────────────────────────────────────────────────────┐
   │                    EXTERNAL SERVICES                             │
   │                                                                  │
   │  Google Gemini API  •  Groq API (Llama 3.3)  •  SerpAPI         │
   │  LiveKit Cloud  •  Bey Avatars  •  ChromaDB  •  Google OAuth    │
   │  LeetCode API  •  Codeforces API  •  Greenhouse/Lever ATS       │
   │  Gmail SMTP                                                      │
   └──────────────────────────────────────────────────────────────────┘
```

---

## 🛠️ Tech Stack

### Frontend

| Technology | Version | Purpose |
|-----------|---------|---------|
| React | 19.2 | UI framework |
| TypeScript | 5.9 | Type safety |
| Vite | 7.3 | Build tool & dev server |
| Tailwind CSS | 4.2 | Utility-first styling |
| Redux Toolkit | 2.11 | Global state (auth, courses) |
| Zustand | 5.0 | Lightweight state (career) |
| React Router | 7.13 | Client-side routing |
| Motion | 12.34 | Animations & transitions |
| shadcn/ui + Radix | — | 49 UI components |
| LiveKit Components | 2.9 | Real-time video/audio |
| Monaco Editor | 4.7 | Code editor (interviews) |
| Excalidraw | 0.18 | Whiteboard (interviews) |
| React Flow | 12.10 | Node graphs (mind maps, eagle view) |
| Recharts | 3.7 | Data visualization (results) |
| React Markdown | 10.1 | Markdown rendering |
| Zod | 3.25 | Schema validation |

### Node.js Backend

| Technology | Version | Purpose |
|-----------|---------|---------|
| Express | 5.2 | HTTP framework |
| Prisma | 6.19 | MongoDB ORM |
| Google Generative AI | 0.24 | Gemini API for course generation |
| JSON Web Token | 9.0 | Authentication |
| bcryptjs | 3.0 | Password hashing (12 rounds) |
| Zod | 4.3 | Request validation |
| cookie-parser | 1.4 | Cookie handling |

### Python Backend

| Technology | Version | Purpose |
|-----------|---------|---------|
| FastAPI | 0.115+ | Async HTTP framework |
| LangChain | 0.3+ | LLM orchestration |
| LangGraph | 0.2+ | Multi-agent workflows |
| ChromaDB | 0.6+ | Vector database |
| Google Generative AI | 0.8+ | Gemini models |
| Groq | 0.9+ | Fast LLM inference (Llama 3.3 70B) |
| Motor | 3.6+ | Async MongoDB driver |
| PyMuPDF | 1.25+ | PDF text & image extraction |
| LiveKit API | 1.0+ | Room tokens & agent dispatch |
| Pydantic | 2.0+ | Data validation |
| httpx | 0.27+ | Async HTTP client |

### AI Agents

| Technology | Purpose |
|-----------|---------|
| LiveKit Agents Framework | Real-time agent infrastructure |
| Google Gemini Realtime API | Voice synthesis & understanding |
| Bey Avatar SDK | 3D photorealistic avatar rendering |
| Gmail SMTP | Session summary email delivery |

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** ≥ 18
- **Python** ≥ 3.11
- **MongoDB Atlas** account (or local MongoDB)
- **Google Cloud** project with Gemini API enabled
- **LiveKit Cloud** account
- **Groq** API key
- **SerpAPI** API key (for job discovery)

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/prepx.git
cd prepx
```

### 2. Setup the Node.js Server

```bash
cd server
npm install
npx prisma generate
```

Create `server/.env`:
```env
PORT=5000
DATABASE_URL=mongodb+srv://<user>:<pass>@<cluster>.mongodb.net/<dbname>
JWT_SECRET=your-strong-random-secret-key
JWT_EXPIRES_IN=7d
CLIENT_URL=http://localhost:5173
GEMINI_API_KEY=your-gemini-api-key
NODE_ENV=development
```

Start the server:
```bash
npm run dev
```

### 3. Setup the Python Server

```bash
cd python-server
python -m venv .venv

# Windows
.venv\Scripts\Activate.ps1
# macOS/Linux
source .venv/bin/activate

pip install -r requirements.txt
```

Create `python-server/.env`:
```env
GOOGLE_API_KEY=your-gemini-api-key
GROQ_API_KEY=your-groq-api-key
SERPAPI_KEY=your-serpapi-key
MONGODB_URI=mongodb+srv://<user>:<pass>@<cluster>.mongodb.net/<dbname>
LIVEKIT_URL=wss://your-livekit-url
LIVEKIT_API_KEY=your-livekit-api-key
LIVEKIT_API_SECRET=your-livekit-api-secret
CHROMA_API_KEY=your-chroma-api-key
CHROMA_TENANT=your-chroma-tenant
CHROMA_DATABASE=your-chroma-database
JWT_SECRET=your-strong-random-secret-key
```

Start the server:
```bash
python main.py
```

### 4. Setup the Frontend

```bash
cd client
npm install
```

Create `client/.env.local`:
```env
VITE_GOOGLE_CLIENT_ID=your-google-oauth-client-id
```

Start the dev server:
```bash
npm run dev
```

### 5. Setup AI Agents (Optional)

```bash
cd agents/AITutor
pip install -r requirements.txt   # or install from the agent's dependencies
```

Create `agents/.env`:
```env
LIVEKIT_URL=wss://your-livekit-url
LIVEKIT_API_KEY=your-livekit-api-key
LIVEKIT_API_SECRET=your-livekit-api-secret
GOOGLE_API_KEY=your-gemini-api-key
MONGODB_URI=mongodb+srv://<user>:<pass>@<cluster>.mongodb.net/<dbname>
DATABASE_NAME=your-database-name
GMAIL_USER=your-email@gmail.com
GMAIL_APP_PASSWORD=your-gmail-app-password
BEY_AVATAR_ID=your-bey-avatar-id
BEY_API_KEY=your-bey-api-key
```

Start the AI Tutor agent:
```bash
cd agents/AITutor
python agent.py dev
```

### 6. Access the Application

| Service | URL |
|---------|-----|
| Frontend | http://localhost:5173 |
| Node.js API | http://localhost:5000 |
| Python API | http://localhost:8000 |
| API Docs (FastAPI) | http://localhost:8000/docs |

---

## 🔐 Environment Variables

### Required Variables Summary

| Variable | Used By | Source |
|----------|---------|--------|
| `DATABASE_URL` / `MONGODB_URI` | Node / Python | [MongoDB Atlas](https://www.mongodb.com/atlas) |
| `JWT_SECRET` | Node + Python | Self-generated |
| `GEMINI_API_KEY` / `GOOGLE_API_KEY` | Node + Python + Agents | [Google AI Studio](https://aistudio.google.com/) |
| `GROQ_API_KEY` | Python | [Groq Console](https://console.groq.com/) |
| `SERPAPI_KEY` | Python | [SerpAPI](https://serpapi.com/) |
| `LIVEKIT_URL` | Python + Agents | [LiveKit Cloud](https://cloud.livekit.io/) |
| `LIVEKIT_API_KEY` | Python + Agents | LiveKit Cloud |
| `LIVEKIT_API_SECRET` | Python + Agents | LiveKit Cloud |
| `CHROMA_API_KEY` | Python | [Chroma](https://www.trychroma.com/) |
| `VITE_GOOGLE_CLIENT_ID` | Client | [Google Cloud Console](https://console.cloud.google.com/) |
| `BEY_API_KEY` | Agents | [Bey](https://www.bey.dev/) |
| `GMAIL_APP_PASSWORD` | Agents | [Google App Passwords](https://myaccount.google.com/apppasswords) |

---

## 📡 API Reference

### Authentication — `Node :5000`

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/auth/signup` | Register with email & password |
| `POST` | `/api/auth/login` | Email/password login |
| `POST` | `/api/auth/google` | Google OAuth login |
| `GET` | `/api/auth/me` | Get current user session |
| `POST` | `/api/auth/logout` | Clear auth cookie |

### Courses — `Node :5000`

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/courses` | List all courses with progress |
| `POST` | `/api/courses` | Create course + generate first section |
| `GET` | `/api/courses/:id` | Course detail with stats |
| `DELETE` | `/api/courses/:id` | Delete course |
| `POST` | `/api/courses/:id/generate-section` | Generate next section |
| `GET` | `/api/courses/sections/:sectionId` | Full section content |
| `POST` | `/api/courses/sections/:sectionId/complete` | Mark section complete |
| `POST` | `/api/courses/articles/:id/read` | Mark article read |
| `POST` | `/api/courses/mcq/:id/answer` | Submit MCQ answer |
| `POST` | `/api/courses/truefalse/:id/answer` | Submit T/F answer |
| `POST` | `/api/courses/fillup/:id/answer` | Submit fill-up answer |
| `POST` | `/api/courses/flashcards/:id/review` | Review flashcard |

### PDF Chat — `Python :8000`

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/pdf-chat/upload` | Upload PDFs & images for RAG |
| `POST` | `/api/pdf-chat/query` | Query documents |
| `GET` | `/api/pdf-chat/images/:filename` | Serve extracted images |

### Career Path — `Python :8000`

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/career/analyze` | Stage 1: Profile analysis → 3 career fits |
| `POST` | `/api/career/simulate/selected` | Stage 2: Full simulation for chosen career |
| `POST` | `/api/career/upload-resume` | Upload resume for extraction |

### Job Discovery — `Python :8000`

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/jobs/upload-resume` | Parse resume to profile |
| `POST` | `/api/jobs/search` | Search & score jobs |
| `POST` | `/api/jobs/chat` | Refine results via chat |
| `GET` | `/api/jobs/history` | List past searches |
| `GET` | `/api/jobs/history/:searchId` | Get specific search results |
| `DELETE` | `/api/jobs/history/:searchId` | Delete search |

### Interviews — `Python :8000`

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/interviews` | List all interviews |
| `POST` | `/api/interviews/upload-jd` | Upload & parse job description |
| `POST` | `/api/interviews/manual-jd` | Parse manual JD text |
| `PATCH` | `/api/interviews/:id` | Update interview settings |
| `POST` | `/api/interviews/:id/connection-details` | Get LiveKit token |
| `GET` | `/api/interviews/:id/results` | Get interview results |

### AI Tutor — `Python :8000`

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/ai-tutor/connection-details` | Get LiveKit room token |

---

## 📂 Project Structure

```
prepx/
├── client/                          # React 19 Frontend
│   ├── src/
│   │   ├── Pages/
│   │   │   ├── Home/                # Landing page (Hero, Features, HowItWorks, CTA)
│   │   │   ├── Auth/                # Login & Signup
│   │   │   ├── Courses/             # Course list, detail, section viewer
│   │   │   ├── PdfChat/             # PDF upload & RAG chat
│   │   │   ├── Career/              # Career path simulator
│   │   │   ├── AITutor/             # AI Tutor page
│   │   │   └── ...
│   │   ├── components/
│   │   │   ├── AITutor/             # Tutor session, media tiles, controls
│   │   │   │   └── livekit/         # LiveKit components (avatar, video, chat)
│   │   │   ├── layout/              # Navbar, Footer, RootLayout
│   │   │   └── ui/                  # 49 shadcn/ui components + custom animations
│   │   ├── store/                   # Redux slices (auth, courses) + hooks
│   │   ├── lib/                     # API clients, utilities, career store (Zustand)
│   │   └── router.tsx               # Route definitions
│   └── vite.config.ts               # Vite config with API proxies
│
├── server/                          # Node.js/Express Backend
│   ├── prisma/
│   │   └── schema.prisma            # MongoDB schema (User, Course, Section, Quiz...)
│   └── src/
│       ├── controllers/             # Auth & Course controllers
│       ├── services/                # Course generator (Gemini), auth service
│       ├── middlewares/             # JWT auth guard, error handler
│       ├── routes/                  # Express route definitions
│       ├── validators/              # Zod schemas
│       └── utils/                   # JWT, cookie, sanitization helpers
│
├── python-server/                   # FastAPI Backend
│   ├── src/
│   │   ├── routers/                 # PDF chat, interviews, jobs, AI tutor, career voice
│   │   ├── services/
│   │   │   ├── pdf_chat/            # RAG pipeline (upload, query, embeddings)
│   │   │   ├── interview/           # JD parsing, coding questions, Groq LLM
│   │   │   └── jobs/                # Job discovery service, resume parsing
│   │   ├── config/                  # Settings, ATS company registry
│   │   └── models/                  # Pydantic models
│   └── app/
│       └── career/                  # Career simulator module
│           ├── graph.py             # LangGraph workflow (9 agent nodes)
│           ├── agents/              # ProfileParser, CareerMatcher, MarketScout...
│           └── models/              # Career profile Pydantic models
│
└── agents/                          # LiveKit AI Agents
    ├── AITutor/                     # Voice/video tutor (Gemini RT + Bey Avatar)
    ├── AIInterviewer/               # Live interview agent
    └── CareerCounselor/             # Voice career counselor
```

---

## 📊 Database Schema

PrepX uses **MongoDB** via Prisma ORM (Node server) and Motor async driver (Python server).

### Prisma Models (Node Server)

```
User
├── id, name, email, password?, provider (LOCAL|GOOGLE), avatar?
└── AiCourse[] (one-to-many)

AiCourse
├── id, userId, title, topic, description, level, goal, tone
├── sectionCount, completedSections, status (draft|generating|active|completed)
└── AiCourseSection[] (one-to-many)

AiCourseSection
├── id, courseId, sectionNumber, title, isCompleted
├── AiArticlePage[] ─── pageNumber, pageTitle, content (markdown), isRead
├── AiFlashcard[] ───── front, back, difficulty (0-5), nextReviewAt
├── AiMcqQuestion[] ─── question, options[], answer, isCorrect?
├── AiTrueFalseQuestion[] ── question, answer (bool), explanation
├── AiFillUpQuestion[] ──── sentence, missingWord, isCorrect?
└── AiMindMap[] ────── data (JSON tree)
```

### MongoDB Collections (Python Server)

| Collection | Purpose | Key Fields |
|-----------|---------|------------|
| `interviews` | Interview sessions | user_id, job_details, settings, status, results |
| `job_searches` | Job discovery history | user_id, profile, jobs[], scores, timestamps |
| `career_roadmaps` | Career simulation results | user_id, career_fits, simulation_data |

---

## 🔒 Authentication

PrepX uses **JWT-based authentication** with HTTP-only cookies:

- **Password Hashing** — bcryptjs with 12 salt rounds
- **Token Storage** — HTTP-only, secure, SameSite=Lax cookies (7-day expiry)
- **Token Fallback** — Also accepts `Authorization: Bearer <token>` header
- **OAuth** — Google OAuth 2.0 with server-side token verification
- **Protected Routes** — Frontend guards redirect unauthenticated users to `/login`
- **User Scoping** — All data (courses, interviews, jobs, career) is scoped to the authenticated user

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.

---

<div align="center">

**Built with ❤️ using AI-first architecture**

[⬆ Back to Top](#prepx)

</div>
