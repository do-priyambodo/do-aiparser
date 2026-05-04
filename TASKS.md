# 📋 Project Implementation Task List: do-aiparser

This file acts as our live sprint backlog and implementation tracker. Use this to mark progress as we complete development phases.

---

## 📦 Phase 1: Scaffolding & Environment Setup
- [x] **Task 1.1**: Initialize the monorepo root structure and configure `.gitignore`.
- [x] **Task 1.2**: Scaffold the Next.js frontend using `npx` and custom flags into `apps/frontend/` following standard App Router conventions.
- [x] **Task 1.3**: Scaffold the FastAPI backend using `uv init` into `apps/backend/` with standalone virtual environment support.
- [x] **Task 1.4**: Create `.env.example` and `.env.local` with placeholders for `PROJECT_ID`, `GEMINI_API_KEY`, `GCP_REGION`, etc.
- [x] **Task 1.5**: Build orchestration scripts `start-frontend.sh`, `start-backend.sh`, and `test-frontend.sh` to automate running the servers locally.



---

## 🤖 Phase 2: Backend ADK Agent Development
- [x] **Task 2.1**: Read and integrate the `google-agents-cli-adk-code` best practice guide.
- [x] **Task 2.2**: Install ADK dependencies in `apps/backend/pyproject.toml`.
- [x] **Task 2.3**: Create `apps/backend/src/docompare/agent.py` to define the Gemini receipt understanding agent, system instructions, and structured schemas.
- [x] **Task 2.4**: Implement dynamic schema injection into the ADK agent prompt to enable user-defined custom extra fields.
- [x] **Task 2.5**: Write an isolated local python script to test the ADK agent with a static mock receipt image.

---

## 🔌 Phase 3: FastAPI Server & API Route Wiring
- [x] **Task 3.1**: Create main FastAPI entry point `apps/backend/src/docompare/main.py`.
- [x] **Task 3.2**: Implement `multipart/form-data` file upload handler to receive images/PDFs securely.
- [x] **Task 3.3**: Wire up the `/api/extract` route to invoke the ADK agent, pipe the uploaded file bytes/stream, and capture the structured JSON output.
- [x] **Task 3.4**: Add robust CORS middleware to allow seamless calls from `http://localhost:3000`.
- [x] **Task 3.5**: Implement logging for extraction token usage, latency, and confidence metrics in `apps/backend/extraction.log`.


---

## 🎨 Phase 4: Frontend Apple Minimalist Dashboard
- [x] **Task 4.1**: Configure `apps/frontend/tailwind.config.ts` / CSS with design tokens: `#F5F5F7` background, font stacks, and custom animation keys.
- [x] **Task 4.2**: Implement high-fidelity interactive elements via pure Tailwind v4 design primitives.
- [x] **Task 4.3**: Build a premium glassmorphism file dropzone with drag-and-drop support and active file thumbnail previewing.
- [x] **Task 4.4**: Create the "Dynamic Schema Editor" component allowing users to add extra text tags for user-defined fields.
- [x] **Task 4.5**: Implement a code-editor-style JSON viewer with syntax highlighting, copy-to-clipboard widget, and split-view layout.

---

## 🧪 Phase 5: Integration, Validation & Polish
- [x] **Task 5.1**: Wire up the frontend API client fetch hooks to stream binary files to `POST /api/extract`.
- [x] **Task 5.2**: Create sample mock receipt files (PNG and PDF format) under a new `test-data/` directory for validation.
- [x] **Task 5.3**: Write an automated backend test suite `test-backend.sh` to verify API reliability, testing both standard and custom extraction schema flows.
- [x] **Task 5.4**: Handle error states gracefully (e.g., blurry receipts, massive invoices, connection timeouts) on the UI with elegant alerts.
- [x] **Task 5.5**: Perform UI/UX review to ensure all micro-animations, smooth hover transitions, and monospace font styling are premium.

---

## 🚀 Phase 6: Google Cloud Run Production Deployment
- [x] **Task 6.1**: Run `agents-cli scaffold enhance . --deployment-target cloudrun` to inject custom `deployment/` Terraform configurations and Dockerfile manifests.
- [x] **Task 6.2**: Activate required Google Cloud APIs and create secure encrypted slots in Google Secret Manager for keys.
- [x] **Task 6.3**: Configure Workload Identity Federation (WIF) OIDC token pools between GitHub Actions and GCP IAM accounts.
- [ ] **Task 6.4**: Execute `agents-cli deploy` to perform automated Cloud Build containerization and spin up the services.
- [ ] **Task 6.5**: Run end-to-end live validation using `agents-cli run --url <service-url>` to verify 100% remote production runtime health.


