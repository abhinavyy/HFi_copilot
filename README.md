# HobbyFi CRM Copilot - Vendor Portal & AI-CRM
An enterprise-grade technical design and interactive sandbox demonstration for the **HobbyFi Copilot** hiring challenge. This project showcases a secure, vendor-centric AI copilot built on Mastra, combining separated Read/Write pathways, multi-tenant isolation, structured tool calling, three-layer temporal memory, and Human-in-the-Loop (HITL) gated mutations.

## 🚀 Repository Structure
*   📁 **[index.html](index.html) / [style.css](style.css) / [app.js](app.js)** — The high-fidelity interactive sandbox demo. It replicates the client-side database explorer, live execution diagnostics, Mastra DAG workflow canvas, and chat interface offline.
*   📄 **[report.md](report.md)** — The 3-4 page comprehensive Technical Design Report mapping out architecture, tools, memory, guardrails, and workflows.
*   📕 **[report.pdf](report.pdf)** — The high-fidelity printed PDF version of the Technical Design Report.
*   🖼️ **[architecture_diagram.png](architecture_diagram.png)** — System architecture schematic of the Gateway-Router-Worker flow.
*   🖼️ **[workflow_diagram.png](workflow_diagram.png)** — Graphical state machine of the Human-in-the-Loop (HITL) mutation workflow.
*   ⚙️ **[convert_pdf.py](convert_pdf.py)** — Python compilation script used to convert the markdown report to the final PDF layout using headless Edge/Chromium.

---

## 🏗️ Core Pillars of the HobbyFi Copilot Architecture

### 1. Gateway-Router-Worker Pattern
The system separates reasoning, security, and execution:
*   **API Gateway:** Attaches authentication and injects the request context (tenant isolation lock).
*   **Mastra Router Agent:** Reads user prompts and routes them to specialized workers.
*   **Read Worker (Read-Only Connection):** Translates read intents into parameterized SQL or semantic vector searches.
*   **Write Worker (Write Connection Gated):** Prepares mutation payload schemas (e.g., membership updates or trial extensions) but *cannot* commit directly. Instead, it registers a `PENDING` transaction in the state machine.

### 2. Human-in-the-Loop (HITL) Workflow
Mutative operations require explicit vendor authorization:
1.  **Suspend Step:** Mastra workflow suspends execution and outputs an approval schema.
2.  **UI Card Generation:** The chat interface displays an interactive approval card.
3.  **Secure POST & Resume:** Upon clicking "Approve", the client sends a signed HMAC POST request to the API, resuming the workflow and committing the update.

### 3. Three-Layer Temporal Memory
*   **Short-Term:** Fast Redis chat buffer tracking active conversation turns.
*   **Long-Term Semantic:** Async summarizing workflow storing summarized sessions as vector embeddings in `pgvector`.
*   **Structured Entity Inject:** Injects specific static metadata (e.g., active user stats, pricing tables) directly into the agent prompt context based on entity extraction.

### 4. Dual-Layer Guardrails
*   **Input Guardrails:** Scan for prompt injections (using Gemini 2.0 Flash), mask PII with regex, and hardcode tenant filters (`WHERE vendor_id = :current_vendor_id`).
*   **Output Guardrails:** Verify numerical consistency (e.g., checking calculated revenue claims against tool outputs) and filter out internal system information.

---

## 🛠️ Technological Stack
*   **Orchestration Engine:** Mastra (TypeScript native) — selected for sub-200ms cold-start execution times in serverless contexts.
*   **Reasoning Agent:** Claude 3.5 Sonnet — for tool parameter extraction and routing.
*   **Guardrail & Audit LLM:** Gemini 2.0 Flash — for low-latency parallel security checks and cost-effective auditing.
*   **Database Layers:** PostgreSQL (Core CRM & Vector Store), Redis (Active State & Pending Approvals).

---
