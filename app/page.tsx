'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Header } from '@/components/Header';
import { AlexaSimulator } from '@/components/AlexaSimulator';
import { TaskBoard } from '@/components/TaskBoard';
import { ToolExecutionHistory } from '@/components/ToolExecutionHistory';
import { McpToolSchema, Task, TraceItem } from '@/lib/types';

export default function Home() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [traces, setTraces] = useState<TraceItem[]>([]);
  const [discoveredTools, setDiscoveredTools] = useState<McpToolSchema[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isMcpConnected, setIsMcpConnected] = useState<boolean>(false);
  const [plannerType, setPlannerType] = useState<'rule-based' | 'bedrock'>('rule-based');
  const [ambiguousCandidates, setAmbiguousCandidates] = useState<Task[] | undefined>(undefined);
  const simulatorRef = useRef<any>(null);

  // Cold Start: initialize, tools/list, and list_tasks
  const runColdStart = async () => {
    setIsLoading(true);
    const initialTraces: TraceItem[] = [];

    try {
      // 1. Health check & MCP initialize
      const healthRes = await fetch('/api/health');
      if (healthRes.ok) {
        const healthData = await healthRes.json();
        setIsMcpConnected(true);
        if (healthData.trace) {
          initialTraces.push(healthData.trace);
        }
      }

      // 2. Discover MCP tools
      const toolsRes = await fetch('/api/tools');
      if (toolsRes.ok) {
        const toolsData = await toolsRes.json();
        setDiscoveredTools(toolsData.tools || []);
        if (toolsData.trace) {
          initialTraces.push(toolsData.trace);
        }
      }

      // 3. Initial list of tasks from MCP server
      const tasksRes = await fetch('/api/tasks?status=all');
      if (tasksRes.ok) {
        const tasksData = await tasksRes.json();
        setTasks(tasksData.tasks || []);
        if (tasksData.trace) {
          initialTraces.push(tasksData.trace);
        }
      }

      setTraces(initialTraces);
    } catch (err) {
      console.error('Cold start error:', err);
      setIsMcpConnected(false);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    runColdStart();
  }, []);

  // Handle user utterance
  const handleSendMessage = async (utterance: string, context?: any) => {
    setIsLoading(true);
    setAmbiguousCandidates(undefined);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ utterance, context }),
      });

      const data = await res.json();

      if (res.ok) {
        if (data.tasks) {
          setTasks(data.tasks);
        }
        if (data.trace && Array.isArray(data.trace)) {
          setTraces((prev) => [...data.trace, ...prev]);
        }
        if (data.planner) {
          setPlannerType(data.planner);
        }
        if (data.ambiguousCandidates) {
          setAmbiguousCandidates(data.ambiguousCandidates);
        }

        // Deliver assistant message to simulator
        if (typeof (AlexaSimulator as any).addAssistantMessage === 'function') {
          (AlexaSimulator as any).addAssistantMessage(data.reply, Boolean(data.ambiguousCandidates));
        }
      } else {
        if (typeof (AlexaSimulator as any).addAssistantMessage === 'function') {
          (AlexaSimulator as any).addAssistantMessage(
            `Sorry, I encountered an error: ${data.details || data.error || 'Unknown error'}`
          );
        }
      }
    } catch (err: any) {
      console.error('Chat error:', err);
      if (typeof (AlexaSimulator as any).addAssistantMessage === 'function') {
        (AlexaSimulator as any).addAssistantMessage(
          `Connection error: could not communicate with the TaskPilot backend.`
        );
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Direct board completion checkoff
  const handleCompleteTask = async (taskId: number) => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'complete', id: taskId }),
      });

      const data = await res.json();
      if (res.ok && data.trace) {
        setTraces((prev) => [data.trace, ...prev]);
      }

      // Refresh tasks
      const tasksRes = await fetch('/api/tasks?status=all');
      if (tasksRes.ok) {
        const tasksData = await tasksRes.json();
        setTasks(tasksData.tasks || []);
        if (tasksData.trace) {
          setTraces((prev) => [tasksData.trace, ...prev]);
        }
      }
    } catch (err) {
      console.error('Complete task error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefreshTools = async () => {
    setIsLoading(true);
    try {
      const toolsRes = await fetch('/api/tools');
      if (toolsRes.ok) {
        const toolsData = await toolsRes.json();
        setDiscoveredTools(toolsData.tools || []);
        if (toolsData.trace) {
          setTraces((prev) => [toolsData.trace, ...prev]);
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100 selection:bg-cyan-500 selection:text-slate-950">
      <Header
        isMcpConnected={isMcpConnected}
        plannerType={plannerType}
        taskCount={tasks.length}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6">
        {/* Hackathon Route & Tech Badge Banner */}
        <div className="mb-4 p-3 rounded-xl bg-slate-900/60 border border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex items-center space-x-2 text-slate-300">
            <span className="px-2 py-0.5 rounded font-mono font-bold bg-cyan-950 text-cyan-300 border border-cyan-800">
              Alexa+ Track
            </span>
            <span>
              Route B Simulation powered by real Route A self-hosted MCP Server over Streamable HTTP (spec 2025-11-25)
            </span>
          </div>
          <div className="flex items-center space-x-2 text-slate-400 font-mono text-[11px]">
            <span>Server: 127.0.0.1:3333/mcp</span>
            <span>•</span>
            <span>Web: localhost:3000</span>
          </div>
        </div>

        {/* 3-Panel Responsive Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Panel 1: Alexa+ Voice Simulator */}
          <section aria-label="Alexa+ Voice Simulator Panel">
            <AlexaSimulator
              onSendMessage={handleSendMessage}
              isLoading={isLoading}
              ambiguousCandidates={ambiguousCandidates}
            />
          </section>

          {/* Panel 2: Live Task Board */}
          <section aria-label="Live Task Board Panel">
            <TaskBoard
              tasks={tasks}
              onCompleteTask={handleCompleteTask}
              isLoading={isLoading}
            />
          </section>

          {/* Panel 3: Tool Execution Log & MCP Protocol Inspector */}
          <section aria-label="MCP Protocol Execution History Panel">
            <ToolExecutionHistory
              traces={traces}
              discoveredTools={discoveredTools}
              onRefreshTools={handleRefreshTools}
              isLoading={isLoading}
            />
          </section>
        </div>
      </main>

      <footer className="border-t border-slate-900 bg-slate-950/80 py-4 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>TaskPilot AI • Amazon Build, Ship, Shape Hackathon (Alexa+ Track)</span>
          <span className="font-mono text-slate-600">MIT Licensed • 100% Standalone MCP & Next.js</span>
        </div>
      </footer>
    </div>
  );
}
