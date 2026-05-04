# 🔌 do-aiparser: Backend API Service

This directory houses the FastAPI and Google Agent Development Kit (ADK) application service responsible for multimodal document parsing and data extraction.

## 📂 Folder Architecture

* **`app/`**: Primary application directory.
  * `agent.py`: Programmatic definition of the Gemini ADK Agent, Pydantic schemas, and instructions.
  * `fast_api_app.py`: FastAPI route definition, CORS middleware, and telemetry-driven logs writing.
  * `app_utils/`: Utilities for telemetry and model type definitions.
* **`tests/`**: Complete test suite.
  * `test_agent_standalone.py`: Executable python test script for isolated prompt validation.
* `extraction.log`: Structured JSON Lines (JSONL) record logs capturing token use counts and request latency.

## 🛠️ Getting Started

For setup prerequisites, `agents-cli playground` capabilities, and step-by-step guides, please refer to the main monorepo root documentation:
👉 **[Master Project README.md](../../README.md)**
