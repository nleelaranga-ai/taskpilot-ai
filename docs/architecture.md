# TaskPilot AI — Architecture & Protocol Specification

## 1. Executive Summary

TaskPilot AI is a voice-style task assistant designed for the **Amazon Build, Ship, Shape Hackathon (Alexa+ Track)**. It features an interactive Alexa+ conversational simulation backed by a **real, standalone Model Context Protocol (MCP) server** running over **Streamable HTTP** (protocol version `2025-11-25`) with a persistent **SQLite WAL** database.

Judges can inspect every raw JSON-RPC 2.0 message, protocol negotiation step, and tool execution in real-time on the live protocol execution log.

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
│   • Normalized task schema with priorities & due dates      │
└─────────────────────────────────────────────────────────────┘
```

## 2. Model Context Protocol (MCP) Compliance

- **Specification Target**: Protocol version `2025-11-25` (official SDK `1.32.1`).
- **Transport**: `StreamableHTTPServerTransport` operating in stateless mode (`sessionIdGenerator: undefined`, `enableJsonResponse: true`).
- **Endpoints**:
  - `POST /mcp`: Executes standard JSON-RPC 2.0 methods (`initialize`, `tools/list`, `tools/call`).
  - `GET /mcp`: Returns `405 Method Not Allowed`.
  - `GET /health`: Health-check reporting server uptime, server info, and `protocolVersion: 2025-11-25`.
- **Security & DNS Rebinding**: Validates `Origin` header; rejects untrusted third-party origins with `403 Forbidden`.

## 3. Discovered Tools

| Tool | Input Schema | Output Schema | Annotations |
| :--- | :--- | :--- | :--- |
| `list_tasks` | `status`: `open` \| `done` \| `all` (default: `open`) | `{ tasks: Task[], count: number }` | `readOnlyHint: true` |
| `create_task` | `title` (1-200 chars), `priority` (`low`\|`medium`\|`high`), `due` (`YYYY-MM-DD`, optional) | `{ task: Task }` | `idempotentHint: false` |
| `complete_task` | `id` (number, optional) or `title` (string, optional) | `{ task: Task }` or error result with disambiguation candidates | `idempotentHint: true` |

## 4. Multi-Step Agentic Flow ("Plan My Day")

TaskPilot AI goes beyond simple CRUD operations:
- When the user utters *"Plan my day"* or *"Plan my schedule"*, the planner triggers an autonomous multi-step workflow.
- It decomposes the day into structured, prioritized tasks (morning triage, core deep-work execution, and daily review).
- It executes 3 sequential `create_task` calls followed by `list_tasks` to fetch the updated state, explaining its prioritization decisions to the user.
