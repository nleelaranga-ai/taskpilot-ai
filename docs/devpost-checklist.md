# TaskPilot AI — Devpost Hackathon Submission Checklist

Amazon Build, Ship, Shape Hackathon (Alexa+ Track)  
**Submission Deadline**: Friday Oct 23, 2026, 12:00 PM PT (Oct 24, 12:30 AM IST)

---

### Mandatory Requirements Checklist

- [x] **Track Selection**: Alexa+ Track.
- [x] **Self-Hosted MCP Server**: Built in `mcp-server/server.mjs`, negotiates MCP spec `2025-11-25`, uses Streamable HTTP.
- [x] **Real Runtime Tech Integration**: App calls MCP server over Streamable HTTP at runtime via `lib/mcp-client.ts`, verified by live JSON-RPC trace.
- [x] **Honest Labeling**: Described as *"Simulated Alexa+ experience backed by a real MCP server"*. Never claims direct hardware Alexa+ integration.
- [x] **Open-Source License**: Visible `LICENSE` file (MIT License) included at repo root.
- [x] **Zero Secrets in Repository**: `.env.example` provided with placeholder keys only. Database files `data/*.db` and local `.env` are git-ignored.
- [x] **Automated Tests**: 11 MCP E2E tests + 10 NLP Planner unit tests (100% pass rate).
- [x] **Persistence**: SQLite WAL database retains state across server restarts.

---

### Demo Video Requirements

- [ ] **Length**: Under 3 minutes (Target: 2:40, see `docs/demo-script.md`).
- [ ] **Hosting**: Public YouTube or Vimeo link.
- [ ] **Language**: English audio/narration.
- [ ] **Content**:
  1. Introduction & real MCP architecture.
  2. Cold-start showing `initialize` and `tools/list` negotiating protocol `2025-11-25`.
  3. Natural voice/text interaction (create, query, complete).
  4. Disambiguation scenario handling.
  5. Multi-step agentic day planning ("Plan my day").
  6. Server restart showing SQLite data persistence.
  7. Automated test run (`npm test`).

---

### Judging Criteria Alignment

| Criterion | Implementation in TaskPilot AI |
| :--- | :--- |
| **Technical Implementation** | Real Streamable HTTP MCP server (spec `2025-11-25`), SQLite WAL persistence, live JSON-RPC trace inspector, DNS rebinding protection. |
| **User Experience & Design** | 3-panel dashboard (Voice simulator, live Kanban task board, protocol execution stream), Web Speech API voice input, speechSynthesis audio replies. |
| **Innovation & Differentiation** | Multi-step agentic workflow ("Plan my day") that performs autonomous multi-tool planning; domain disambiguation prompts. |
| **Completeness & Quality** | 100% passing test coverage across protocol, discovery, persistence, and planning; zero external API keys required to run. |
| **Product Feedback & Friction Log** | Dedicated `docs/friction-log.md` detailing 5 real developer friction entries and SDK suggestions for up to 10% bonus. |
