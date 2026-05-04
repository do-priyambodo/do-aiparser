# 🔮 do-aiparser: Premium Multimodal AI Document Parsing Monorepo

`do-aiparser` is a high-fidelity, Apple-style minimalist web application designed to ingest store invoices, bills, vouchers, forms, and receipts (in both PDF and Image formats) and automatically extract structured data via the **Google Agent Development Kit (ADK)** and `gemini-2.5-flash`.

---

## 🗺️ Architecture & Repository Layout

This repository is structured as an isolated monorepo dividing frontend client presentation from intelligent backend AI extraction:

```mermaid
graph TD
    UI[Frontend Next.js Client] -->|POST multipart/form-data| API[Backend FastAPI Server]
    API -->|Google ADK SDK Runner| Agent[Gemini ADK Ingestion Agent]
    Agent -->|Multimodal JSON Extraction| VertexAI[Vertex AI / Gemini API]
```

### Component Layout
* **`apps/frontend/`**: Next.js v15+ web app built via App Router, styled using vanilla Tailwind CSS v4, offering custom dropzones, interactive badges, and a code-editor-style JSON view canvas.
* **`apps/backend/`**: Python v3.11+ FastAPI server utilizing `uv` package orchestration, exposing endpoints powered by programmatic ADK Agents.
* **`test-data/`**: High-resolution sample mock receipt files used for integration checks and OCR data verification.

---

## 🛠️ Local Development & Command Reference

### 1. 🤖 Backend Development (`apps/backend/`)
Before launching, configure your GCP credentials and environment settings inside `.env.local`.

* **Interactive Agent Playground**:
  Test and play with your Gemini ADK extraction prompt and schemas in the interactive web playground:
  ```bash
  cd apps/backend
  agents-cli playground
  ```
* **Launch the Web Server App**:
  Start the production-ready FastAPI API backend:
  ```bash
  ./start-backend.sh
  ```
* **Run Standalone Script Validation**:
  Run a stateless, isolated execution of the receipt parser against test files:
  ```bash
  uv run python tests/test_agent_standalone.py
  ```

### 2. 🎨 Frontend Dashboard (`apps/frontend/`)
* **Start Next.js UI Client**:
  Launches the minimalist web dashboard on `http://localhost:3000`:
  ```bash
  ./start-frontend.sh
  ```

---

## 🧪 Test Suite & Quality Metrics

We maintain an automated testing pipeline to guarantee extraction latency, correct structured JSON boundaries, and support for user-defined **Custom dynamic tags**:

```bash
# From your monorepo root path
./test-backend.sh
```

This script automatically:
1. Assesses API server status.
2. Verifies standard schema extractions.
3. Injects dynamic extractions (e.g. `expense_category` classification or corporate eligibility flags).
4. Assures structured telemetry records are written smoothly into `apps/backend/extraction.log`.
