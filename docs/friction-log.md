# TaskPilot AI — Product Feedback & Developer Friction Log

> **Hackathon Bonus Note**: This document details constructive product feedback, snags, workarounds, and DX recommendations for the tools, libraries, and SDKs utilized in building TaskPilot AI (worth up to 10% judging bonus).

---

### Friction Entry 1: Model Context Protocol (MCP) TypeScript SDK — Stateless Transport Handling

- **Component**: `@modelcontextprotocol/sdk` (v1.32.1) — `StreamableHTTPServerTransport`
- **Task Attempted**: Implementing a stateless Streamable HTTP server responding with standard JSON-RPC 2.0.
- **Expected Behavior**: A single persistent transport instance can process consecutive incoming HTTP POST requests statelessly when `sessionIdGenerator` is set to `undefined`.
- **Actual Behavior**: If the same `StreamableHTTPServerTransport` instance is reused across multiple POST requests, the underlying transport throws an error indicating the transport is already started or the stream is closed.
- **Severity**: Medium
- **Workaround**: Instantiate a fresh `McpServer` and `StreamableHTTPServerTransport` pair inside the request handler per incoming POST request:
  ```javascript
  const server = createServerInstance();
  const transport = new StreamableHTTPServerTransport({
    sessionIdGenerator: undefined,
    enableJsonResponse: true,
  });
  await server.connect(transport);
  await transport.handleRequest(req, res, parsedBody);
  ```
- **Product Suggestion**: Provide a built-in helper method (e.g. `McpServer.createHttpHandler({ stateless: true })`) or explicit documentation showing the per-request factory pattern for stateless HTTP handlers.

---

### Friction Entry 2: SQLite Column Identifier vs String Literal Resolution in better-sqlite3

- **Component**: `better-sqlite3` (v11.8.1)
- **Task Attempted**: Custom sorting priority via `CASE priority WHEN "high" THEN 1 ...`
- **Expected Behavior**: Case expression executes without error.
- **Actual Behavior**: SQLite treats double quotes (`"high"`) as column identifiers rather than string literals, throwing `SqliteError: no such column: high`.
- **Severity**: Low
- **Workaround**: Strictly enforce single quotes (`'high'`, `'medium'`, `'low'`) for SQL literals in prepared statements.
- **Product Suggestion**: A query linter or warning in better-sqlite3 when string literals look like column references.

---

### Friction Entry 3: Windows PowerShell Execution Policy Blocking npm.ps1

- **Component**: Windows PowerShell & Node.js npm installer
- **Task Attempted**: Running routine `npm run dev` or `npm test` commands.
- **Expected Behavior**: npm runs out of the box in Windows PowerShell.
- **Actual Behavior**: PowerShell execution policy disables running unsigned scripts (`npm.ps1 cannot be loaded because running scripts is disabled on this system`).
- **Severity**: High (common developer roadblock on Windows).
- **Workaround**: Invoke `npm.cmd` directly instead of `npm`, or execute via batch scripts.
- **Product Suggestion**: Node.js Windows installer should provide an option or clear guide on PowerShell script execution aliases.

---

### Friction Entry 4: MCP Tool Annotations Discoverability

- **Component**: `@modelcontextprotocol/sdk` tool definition API
- **Task Attempted**: Exposing hints like `readOnlyHint` and `idempotentHint` so client planners can optimize caching and confirmation prompts.
- **Expected Behavior**: `server.tool(...)` method signature has first-class typed parameter for annotations.
- **Actual Behavior**: Method overload resolution between `paramsSchemaOrAnnotations` can be ambiguous due to plain object shapes in TypeScript.
- **Severity**: Low
- **Workaround**: Use `server.registerTool(name, { inputSchema, outputSchema, annotations }, callback)` which cleanly separates annotations into a dedicated typed config block.
- **Product Suggestion**: Standardize on `registerTool` with structured configuration object in SDK documentation.

---

### Friction Entry 5: Web Speech API Browser Consistency

- **Component**: Browser Web Speech API (`SpeechRecognition` / `webkitSpeechRecognition`)
- **Task Attempted**: Hands-free voice input across modern web browsers.
- **Expected Behavior**: Uniform standard SpeechRecognition API across Chrome, Edge, Safari, and Firefox.
- **Actual Behavior**: Firefox requires manual flags or lacks full native support, and Safari uses `webkitSpeechRecognition` with intermittent microphone permission prompts.
- **Severity**: Medium
- **Workaround**: Implement robust feature-detection with immediate graceful fallback to text input and clear UI feedback when speech recognition is unavailable.
- **Product Suggestion**: Standardize Web Speech API support across all major browser engines.
