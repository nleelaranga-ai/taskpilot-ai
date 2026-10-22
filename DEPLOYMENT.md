# TaskPilot AI — Production Deployment Guide (GitHub, Render & Vercel)

This guide walks through deploying the **TaskPilot AI** ecosystem into production:
1. **GitHub**: Source code repository & CI/CD trigger.
2. **Render**: Dedicated persistent Model Context Protocol (MCP) Streamable HTTP Server (`POST /mcp`, `GET /health`, SQLite WAL).
3. **Vercel**: High-performance Next.js 14 App Router frontend connected to the Render MCP server via `TASKPILOT_MCP_URL`.

---

## Architecture Overview

```
                                      ┌─────────────────────────────────────────┐
                                      │              VERCEL                     │
[ User Browser / Alexa+ Client ] ───► │  Next.js 14 App Router                  │
                                      │  (UI, Planner, StreamableHTTPClient)    │
                                      └──────────────────┬──────────────────────┘
                                                         │
                                                         │ HTTPS (Streamable HTTP JSON-RPC 2.0)
                                                         ▼
                                      ┌─────────────────────────────────────────┐
                                      │              RENDER                     │
                                      │  TaskPilot MCP Server (Node.js)         │
                                      │  • POST /mcp                            │
                                      │  • GET /health                          │
                                      │  • SQLite WAL Persistence               │
                                      └─────────────────────────────────────────┘
```

The Render Blueprint deploys the web app and MCP server as separate services. The web build uses `npm ci --include=dev`, and the repository `.npmrc` includes development dependencies during production-mode installs because Tailwind and PostCSS are needed at build time. It derives `TASKPILOT_MCP_URL` from the MCP service's Render hostname; the app appends `/mcp` when the value is a bare hostname. `localhost` would point back to the web service, not the MCP server. If you rename the MCP service, update the service reference in `render.yaml`.

For Vercel, set `TASKPILOT_MCP_URL` to the MCP service's public URL ending in `/mcp` (for example, `https://<your-mcp-service>.onrender.com/mcp`). Do not use the Vercel app URL. Verify the MCP service first by checking its `/health` endpoint for JSON containing `"status":"ok"`.

---

## Step 1: Push All Changes to GitHub

### 1.1 Create a New GitHub Repository
1. Log into your GitHub account: [https://github.com/new](https://github.com/new)
2. Name the repository: `taskpilot-ai`
3. Visibility: Choose **Public** (recommended for hackathon submissions) or **Private**.
4. Leave "Add README", ".gitignore", and "License" unchecked (we already have them configured).
5. Click **Create repository**.

### 1.2 Link and Push Your Local Repository
Run these commands from your local `taskpilot-ai` directory:

```bash
# Add your GitHub repository as the origin remote (replace with your GitHub username)
git remote add origin https://github.com/YOUR_GITHUB_USERNAME/taskpilot-ai.git

# Ensure default branch is master (or rename to main if preferred)
git branch -M master

# Push all commits to GitHub
git push -u origin master
```

---

## Step 2: Deploy MCP Server to Render

The MCP server handles persistent Streamable HTTP connections (`2025-11-25`) and SQLite database writes.

### Option A: 1-Click Render Blueprint (Recommended)
1. Go to [https://dashboard.render.com/blueprints](https://dashboard.render.com/blueprints).
2. Click **New Blueprint Instance**.
3. Connect your `taskpilot-ai` GitHub repository.
4. Render automatically reads `render.yaml` and sets up the `taskpilot-mcp-server` Web Service.
5. Click **Apply**.

## Production Deployment on Render (Unified Single Service)

TaskPilot AI includes a unified runner (`scripts/start-all.mjs`) that powers **both** the Next.js Web Frontend and the Streamable HTTP MCP Server within a single Render Web Service container.

```
┌─────────────────────────────────────────────────────────────┐
│                   RENDER WEB SERVICE                        │
│                                                             │
│  [ Next.js 14 Web Frontend ] (Listens on Render's $PORT)    │
│            │                                                │
│            ▼ (Internal Loopback JSON-RPC 2.0 over HTTP)     │
│  [ MCP Server (Streamable HTTP) ] (Listens on port 3333)    │
│            │                                                │
│            ▼                                                │
│  [ SQLite Database: data/taskpilot.db (WAL Mode) ]          │
└─────────────────────────────────────────────────────────────┘
```

### Setup Instructions on Render:
1. Go to your Render Web Service dashboard (e.g. `taskpilot-ai-geol` or new web service).
2. Under **Settings**:
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start` (or `node scripts/start-all.mjs`)
   - **Health Check Path**: `/api/health`
3. Under **Environment Variables**:
   - `NODE_ENV` = `production`
   - `TASKPILOT_MCP_URL` = `http://127.0.0.1:3333/mcp`
   - `TASKPILOT_DB` = `data/taskpilot.db`
   - `ALLOWED_ORIGINS` = `*`
4. Click **Manual Deploy** $\rightarrow$ **Deploy latest commit**.
5. Once deployed, open your live URL (e.g. `https://taskpilot-ai-geol.onrender.com`).
   - The top header will turn to **MCP 2025-11-25** (green pulsing dot).
   - The sidebar will show **MCP Online**.
   - The assistant greeting will confirm live connection to the Streamable HTTP MCP Server and SQLite WAL.

---

## Step 3: Deploy Frontend to Vercel

Vercel hosts the Next.js 14 user interface and server-side MCP client transport.

1. Go to [https://vercel.com/new](https://vercel.com/new).
2. Import your GitHub repository: `taskpilot-ai`.
3. In **Project Configuration**:
   - **Framework Preset**: `Next.js` (automatically detected).
   - **Root Directory**: `./`
   - **Build Command**: `npm run build`
   - **Output Directory**: `.next`
4. Expand **Environment Variables** and add:
   - `TASKPILOT_MCP_URL` = `https://<YOUR-RENDER-SERVICE-NAME>.onrender.com/mcp`
     *(e.g., `https://taskpilot-mcp-server.onrender.com/mcp`)*
   - `NEXT_PUBLIC_APP_URL` = `https://<YOUR-PROJECT-NAME>.vercel.app`
5. Click **Deploy**.
6. Vercel will build and deploy your application in ~45 seconds.

---

## Step 4: Verify the Live Production Flow

Once both services are deployed:
1. Open your Vercel URL: `https://taskpilot-ai.vercel.app`.
2. Check the green **MCP Server** indicator badge in the left sidebar.
3. Add a task: *"Submit Devpost project by midnight high priority"*.
4. Navigate to **Daily Mission** and execute a plan.
5. Check **MCP Inspector** in the sidebar to view live JSON-RPC round-trips communicating between Vercel and Render in milliseconds.
