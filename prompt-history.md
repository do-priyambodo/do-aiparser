# 📜 Project Prompt & Vision History

This file maintains a chronological record of the prompts, vision statements, and core directions provided for the development of **do-aiparser**.

---

## 🗓️ Session: 2026-05-04 — Project Initiation

### 📥 Original User Request
> i would like to build an application consist of 2 servers = backend and frontend
> in the backend server, i will create ADK version using the guide of agents-cli.
> front end is to call that agent later on.
> the name of the app is = do-receipt
> goal is = to understand the customer receipt/invoice and extract this to JSON format for specific value and additional value that we want. 
> later on the app is web based and try to upload the receipt and get the values of the receipts.

---

### 🚀 Refined Engineering Prompt
**Project Name**: `do-aiparser`  
**System Architecture**: Monorepo with a dual-server layout:
- **Frontend**: Next.js (App Router) Web application styled with Tailwind CSS (v4) following pure Apple minimalist glassmorphism design specs.
- **Backend**: Python (FastAPI) backend integrating the **Google Agent Development Kit (ADK)** via `agents-cli` patterns to manage intelligent agent sessions.

**Core Capability**: An AI-powered, web-based document understanding pipeline designed to ingest customer receipts and invoices (images/PDFs). Using multimodal Gemini models through the ADK agent, it will accurately parse documents and extract high-fidelity structured JSON.

**Functional Requirements for Extraction**:
1. **Standard Fields (Default)**:
   - Merchant Details (Name, Address, Phone/Website)
   - Transaction Meta (Date, Time, Invoice/Receipt Number)
   - Line Items (Item description, quantity, unit price, total price)
   - Financial Summary (Subtotal, Tax Amount/VAT, Tip/Service charge, Total Amount)
   - Payment Meta (Payment Method, Card Last 4 Digits, Currency)
2. **Dynamic/Custom Fields (User-Defined)**:
   - Ability for the user to submit custom schema fields (e.g., "Is this a business expense?", "Project Code", "Category Tag") that the Gemini ADK agent should dynamically locate, extract, or deduce from the document context.

**User Workflow**:
1. User navigates to the Next.js clean web dashboard.
2. User drops a receipt image (PNG/JPEG) or PDF into a premium animated dropzone.
3. (Optional) User inputs extra fields they want to extract.
4. The file is uploaded to the backend, and the ADK agent processes the document.
5. The dashboard displays an Apple-style glass card comparing the original document preview alongside the pristine, formatted JSON extraction, complete with a copy-to-clipboard action.
