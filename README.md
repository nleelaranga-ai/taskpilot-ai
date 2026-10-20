# TaskPilot AI 🚀

> **Amazon Build, Ship, Shape Hackathon — Alexa+ Track**  
> *A voice-style conversational task manager powered by a self-hosted Model Context Protocol (MCP) server over Streamable HTTP and SQLite.*

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![MCP Specification](https://img.shields.io/badge/MCP%20Spec-2025--11--25-00CAFF.svg)](https://modelcontextprotocol.io)
[![Transport](https://img.shields.io/badge/Transport-Streamable%20HTTP-emerald.svg)](https://modelcontextprotocol.io)
[![Node](https://img.shields.io/badge/Node.js-v22+-green.svg)](https://nodejs.org)
[![Storage](https://img.shields.io/badge/Storage-SQLite%20WAL-amber.svg)](https://www.sqlite.org)

---

## 🌟 Overview

**TaskPilot AI** combines an interactive Alexa+ conversational experience with a genuine, production-grade Model Context Protocol (MCP) server. 

Instead of hiding simulated actions behind mock UI state, **every voice or text utterance is dynamically parsed by an AI planner and executed as real JSON-RPC 2.0 tool calls over Streamable HTTP** against a standalone MCP server on port 3333.

The interface is transparently labeled as a simulation: it is the **Route B path** explicitly permitted by hackathon guidelines, built directly on top of a genuine **Route A self-hosted MCP server**.

```
┌─────────────────────────────────────────────────────────────┐
│                       Browser UI                            │
│  [Alexa+ Simulator]   [Live Task Board]   [MCP Trace Log]   │
└──────────────────────────────┬──────────────────────────────┘
                               │ HTTP / JSON
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                 Next.js App Router (Port 3000)              │
│   /api/chat          /api/tasks           /api/tools        │
│          ▲                    ▲                 ▲           │
│          └──────────────┬─────┴─────────────────┘           │
│                         │ Server-Side MCP Client            │
│                         │ (Streamable HTTP / JSON-RPC 2.0)  │
└─────────────────────────┼───────────────────────────────────┘
                          │ POST /mcp (stateless)
                          ▼
┌─────────────────────────────────────────────────────────────┐
│             TaskPilot MCP Server (Port 3333)                │
│   • Protocol: 2025-11-25                                    │
│   • Transport: Streamable HTTP (Stateless JSON responses)   │
│   • Tools: list_tasks, create_task, complete_task           │
│   • Annotations: readOnlyHint, idempotentHint               │
│   • DNS Rebinding & Origin Protection                       │
└─────────────────────────┬───────────────────────────────────┘
                          │ Prepared Statements
                          ▼
┌─────────────────────────────────────────────────────────────┐
│               SQLite Database (data/taskpilot.db)           │
│   • WAL Mode (Write-Ahead Logging)                          │
│   • Persistent local storage across server restarts         │
└─────────────────────────────────────────────────────────────┘
```

---

## ✨ Key Features

1. **Self-Hosted MCP Server (Spec 2025-11-25)**:
   - Built on Node 22 and official `@modelcontextprotocol/sdk` (v1.32.1).
   - Stateless Streamable HTTP transport returning clean JSON-RPC 2.0.
   - Discovers tools dynamically at runtime via `tools/list`: `list_tasks`, `create_task`, and `complete_task`.
   - Tool annotations (`readOnlyHint` for queries, `idempotentHint` for completion).
   - DNS rebinding & Origin validation protection.

2. **Alexa+ Conversational Simulation (Panel 1)**:
   - Voice input using the browser **Web Speech API** (`SpeechRecognition`) with an animated waveform visualizer.
   - Spoken audio confirmation using **Web SpeechSynthesis** (with mute/unmute toggle).
   - Instant suggested prompt pills for 1-click testing.
   - Keyboard accessible, ARIA live region (`aria-live="polite"`).

3. **Live Kanban Task Board (Panel 2)**:
   - Real-time synchronization directly from the MCP server.
   - Open and Completed task columns.
   - Accessible priority badges (`[HIGH]`, `[MED]`, `[LOW]`).
   - Smart due-date chips with visual warnings for **Overdue**, **Due Today**, and future dates.
   - Direct interactive checkoff routed through the MCP `complete_task` tool.

4. **Live MCP Protocol Execution History (Panel 3)**:
   - Displays real-time JSON-RPC 2.0 traffic for judges to inspect.
   - Shows latency in milliseconds, protocol version badge (`2025-11-25`), and OK/Error status.
   - Expandable rows to view the exact raw JSON request and response payloads with a 1-click copy button.
   - **Cold Start Beat**: On page load, immediately executes and displays `initialize`, `tools/list`, and `list_tasks`.

5. **Multi-Step Agentic Planning ("Plan My Day")**:
   - Beyond simple CRUD: Uttering *"Plan my day"* or *"Plan my schedule"* triggers autonomous multi-step execution.
   - The planner creates three structured priority tasks (triage, deep work, wrap-up) and immediately queries the refreshed board.

6. **Ambiguity Disambiguation**:
   - If multiple tasks match a completion request (e.g., *"I finished the report"* when multiple reports exist), the tool returns a domain disambiguation error with candidates.
   - The assistant asks which one you meant, and follow-up speech (e.g., *"the second one"*) resolves by ID.

7. **Zero-Key Deterministic Planner + Optional AWS Bedrock**:
   - Runs 100% offline with zero API keys required by default.
   - Includes optional AWS Bedrock Converse planner if `AWS_REGION` and AWS credentials are provided.

---

## 🛠️ Quickstart

### Prerequisites
- **Node.js**: v20 or v22+
- **npm**: v10+

### Installation & Setup

```bash
# 1. Clone the repository
git clone https://github.com/your-username/taskpilot-ai.git
cd taskpilot-ai

# 2. Install dependencies
npm install

# 3. Start both the MCP Server (port 3333) and Next.js Web App (port 3000)
npm run dev
```

Open **[http://localhost:3000](http://localhost:3000)** in your browser.

---

## 🧪 Testing

TaskPilot AI includes a comprehensive automated test suite verifying MCP protocol negotiation, tool discovery, input validation, execution, data persistence, and NLP planning.

```bash
# Run all tests (MCP E2E tests + Planner unit tests)
npm test

# Run MCP Server E2E tests only
npm run test:mcp

# Run Planner unit tests only
npm run test:planner
```

### Test Coverage Highlights
- ✅ **Protocol Negotiation**: Raw `initialize` negotiates spec `2025-11-25`.
- ✅ **Tool Discovery**: `tools/list` discovers `list_tasks`, `create_task`, and `complete_task`.
- ✅ **Tool Execution**: `create_task`, `list_tasks`, and `complete_task`.
- ✅ **Error Handling**: Double-complete rejections and Zod schema rejections.
- ✅ **Security**: Unauthorized `Origin` headers rejected with `403 Forbidden`.
- ✅ **Persistence**: SQLite WAL database retains state across server restarts.
- ✅ **Planner**: 10 table-driven utterance tests covering relative dates, priorities, multi-step agentic day planning, and disambiguation.

---

## 📂 Repository Structure

```
taskpilot-ai/
├── LICENSE                 # MIT License (visible open source)
├── README.md               # Architecture, setup, testing, and overview
├── .env.example            # Environment configuration template
├── package.json            # Project dependencies and test scripts
├── mcp-server/             # Standalone Model Context Protocol Server
│   ├── server.mjs          # Streamable HTTP MCP server (spec 2025-11-25)
│   ├── db.mjs              # SQLite database layer with WAL mode
│   └── test-e2e.mjs        # 11 end-to-end integration tests
├── app/                    # Next.js App Router (Port 3000)
│   ├── layout.tsx          # Root layout and metadata
│   ├── page.tsx            # 3-panel dashboard (Simulator, Board, Trace)
│   ├── globals.css         # Tailwind styles and theme
│   └── api/
│       ├── chat/route.ts   # Chat route invoking MCP client & planner
│       ├── tasks/route.ts  # Task board data fetched via MCP list_tasks
│       ├── tools/route.ts  # Discovered tools endpoint via tools/list
│       └── health/route.ts # Health check & MCP initialization probe
├── components/             # React UI components
│   ├── Header.tsx          # Status header with protocol & store badges
│   ├── AlexaSimulator.tsx  # Voice & text simulator with Web Speech API
│   ├── TaskBoard.tsx       # Live Kanban board with priority chips
│   └── ToolExecutionHistory.tsx # Live JSON-RPC 2.0 protocol trace log
├── lib/
│   ├── types.ts            # TypeScript definitions for MCP & Tasks
│   ├── mcp-client.ts       # Server-side Streamable HTTP MCP client
│   └── planner/
│       ├── rules.ts        # Deterministic offline NLP planner
│       ├── bedrock.ts      # Optional AWS Bedrock planner
│       └── index.ts        # Planner orchestrator and reply synthesizer
├── tests/
│   └── planner.test.ts     # 10 table-driven planner unit tests
├── docs/
│   ├── architecture.md     # Protocol architecture & system design
│   ├── demo-script.md      # 2:40 demo video script
│   ├── devpost-checklist.md# Hackathon rules compliance checklist
│   └── friction-log.md     # Product feedback log (for 10% judging bonus)
└── data/                   # SQLite database storage (.git-ignored)
```

---

## 🔒 Security & Privacy

- **No Secrets in Repo**: The repo contains no API keys or credentials.
- **Local Storage**: All task data is stored locally in SQLite (`data/taskpilot.db`), which is excluded from Git.
- **Network Isolation**: The MCP server binds to `127.0.0.1:3333` and verifies the `Origin` header to prevent DNS rebinding or unauthorized browser requests.
- **Server-Side Only Client**: Next.js interacts with the MCP server exclusively from server route handlers (`lib/mcp-client.ts`), ensuring zero client-side exposure.

---

## 📜 License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.
