# TaskPilot AI — 3-Minute Demo Video Script

**Target Duration**: 2 minutes 40 seconds (Strict Devpost limit: 3:00 max)  
**Tone**: Technical, clear, crisp, confident  
**Visual layout**: Screen recording showing browser window (Alexa+ simulator on left, Task Board in center, MCP Protocol Log on right).

---

### [0:00 – 0:15] The Hook & Overview
- **Visual**: Title slide / Browser window with TaskPilot AI.
- **Narration**:  
  > *"Current voice assistants often fail to manage actionable workflows reliably, and developers struggle to verify tool execution. Welcome to TaskPilot AI — a voice-style task manager built for the Amazon Build, Ship, Shape Hackathon, powered by a self-hosted Model Context Protocol server over Streamable HTTP."*

---

### [0:15 – 0:40] Cold Start & Live Protocol Negotiation
- **Visual**: Hit refresh on `http://localhost:3000`. Show the right-hand panel instantly populate with protocol traffic.
- **Narration**:  
  > *"When the app starts, notice the cold-start sequence in our protocol log: a raw JSON-RPC `initialize` handshake negotiating MCP specification version 2025-11-25, followed by dynamic runtime tool discovery via `tools/list` discovering `list_tasks`, `create_task`, and `complete_task`. There are no hard-coded mock tools here — this is genuine protocol negotiation."*

---

### [0:40 – 1:30] Natural Voice Utterances & Real-Time Sync
- **Visual**: Click mic button or type:  
  `"Remind me to submit the Devpost form tomorrow, high priority"`
- **Narration**:  
  > *"Let's speak or type our first command: 'Remind me to submit the Devpost form tomorrow, high priority'. The planner parses the intent, invokes `create_task` over Streamable HTTP, and Alexa+ replies with voice confirmation. Look at the center board: a new card appears with high-priority tagging and tomorrow's due date. In the right panel, you can inspect the exact request and response payloads, along with the latency in milliseconds."*

- **Visual**: Type: `"What's on my list?"`
- **Narration**:  
  > *"Now we ask: 'What's on my list?' The MCP `list_tasks` tool executes with `readOnlyHint: true`, returning our active tasks."*

---

### [1:30 – 1:55] Follow-Up Disambiguation & Agentic Flow
- **Visual**: Show completion ambiguity: create another report task, then say `"I finished the report"`.
- **Narration**:  
  > *"TaskPilot also handles real-world ambiguity cleanly. When I say 'I finished the report', the MCP server detects two matching candidates and returns a domain disambiguation error. The assistant asks: 'Which one did you mean?' When I respond 'the second one', it resolves the ID and marks it completed."*

- **Visual**: Type or say: `"Plan my day"`
- **Narration**:  
  > *"To push beyond basic CRUD, TaskPilot features an agentic workflow: saying 'Plan my day' autonomously decomposes the workday into prioritized triage, core execution, and daily review tasks across multiple tool calls."*

---

### [1:55 – 2:15] Data Persistence
- **Visual**: Terminal showing stopping the MCP server (`Ctrl+C`), restarting it (`npm run dev:mcp`), and refreshing the browser.
- **Narration**:  
  > *"All state is backed by local SQLite in WAL mode. If we stop the MCP server and restart it, our tasks, timestamps, and completed states persist seamlessly."*

---

### [2:15 – 2:35] Code Quality & Testing
- **Visual**: Terminal running `npm test`. Show all 11 MCP E2E tests and 10 planner unit tests passing.
- **Narration**:  
  > *"Our entire codebase is 100% open source under the MIT License. We built an automated test suite verifying protocol negotiation, schema validation, DNS rebinding origin protection, and planner cases with 100% pass rate."*

---

### [2:35 – 2:40] Conclusion
- **Visual**: Return to dashboard.
- **Narration**:  
  > *"TaskPilot AI proves that conversational voice agents and open standard MCP servers make task execution transparent, resilient, and verifiable. Thank you!"*
