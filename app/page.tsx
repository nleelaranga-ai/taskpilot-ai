'use client';

import React, { useState, useEffect } from 'react';
import { Sidebar } from '@/components/Sidebar';
import { Header } from '@/components/Header';
import { WorkspaceOverview } from '@/components/WorkspaceOverview';
import { DailyMissionView } from '@/components/DailyMissionView';
import { TaskBoard } from '@/components/TaskBoard';
import { ToolExecutionHistory } from '@/components/ToolExecutionHistory';
import { SettingsView } from '@/components/SettingsView';
import { McpToolSchema, NavTab, Task, TraceItem } from '@/lib/types';

export default function Home() {
  const [activeTab, setActiveTab] = useState<NavTab>('workspace');
  const [tasks, setTasks] = useState<Task[]>([]);
  const [traces, setTraces] = useState<TraceItem[]>([]);
  const [discoveredTools, setDiscoveredTools] = useState<McpToolSchema[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isMcpConnected, setIsMcpConnected] = useState<boolean>(false);
  const [plannerType, setPlannerType] = useState<'rule-based' | 'bedrock'>('rule-based');
  const [ambiguousCandidates, setAmbiguousCandidates] = useState<Task[] | undefined>(undefined);

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

      // 2. Discover MCP tools via tools/list
      const toolsRes = await fetch('/api/tools');
      if (toolsRes.ok) {
        const toolsData = await toolsRes.json();
        setDiscoveredTools(toolsData.tools || []);
        if (toolsData.trace) {
          initialTraces.push(toolsData.trace);
        }
      }

      // 3. Initial list of tasks from MCP server (always query 'all' for complete board state)
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

  // Fetch fresh tasks list directly from MCP server
  const refreshTasks = async () => {
    try {
      const tasksRes = await fetch('/api/tasks?status=all');
      if (tasksRes.ok) {
        const tasksData = await tasksRes.json();
        setTasks(tasksData.tasks || []);
        if (tasksData.trace) {
          setTraces((prev) => [tasksData.trace, ...prev]);
        }
      }
    } catch (err) {
      console.error('Refresh tasks error:', err);
    }
  };

  const addTraces = (newTraces: TraceItem[]) => {
    setTraces((prev) => [...newTraces, ...prev]);
  };

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
      }
    } catch (err: any) {
      console.error('Chat error:', err);
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

      await refreshTasks();
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
    <div className="min-h-screen flex bg-background text-foreground selection:bg-cyan-500 selection:text-slate-950">
      {/* Premium Sidebar Navigation */}
      <Sidebar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        openTasksCount={tasks.filter((t) => t.status === 'open').length}
        totalTasksCount={tasks.length}
        isMcpConnected={isMcpConnected}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <Header
          isMcpConnected={isMcpConnected}
          plannerType={plannerType}
          taskCount={tasks.length}
        />

        <main className="flex-1 max-w-6xl w-full mx-auto p-4 md:p-6 lg:p-8">
          {activeTab === 'workspace' && (
            <WorkspaceOverview
              tasks={tasks}
              traces={traces}
              onSendMessage={handleSendMessage}
              onCompleteTask={handleCompleteTask}
              onNavigateToTasks={() => setActiveTab('tasks')}
              isLoading={isLoading}
              ambiguousCandidates={ambiguousCandidates}
            />
          )}

          {activeTab === 'mission' && (
            <DailyMissionView
              onRefreshTasks={refreshTasks}
              onAddTraces={addTraces}
              existingTasks={tasks}
            />
          )}

          {activeTab === 'tasks' && (
            <TaskBoard
              tasks={tasks}
              onCompleteTask={handleCompleteTask}
              isLoading={isLoading}
            />
          )}

          {activeTab === 'inspector' && (
            <ToolExecutionHistory
              traces={traces}
              discoveredTools={discoveredTools}
              onRefreshTools={handleRefreshTools}
              isLoading={isLoading}
            />
          )}

          {activeTab === 'settings' && (
            <SettingsView
              isMcpConnected={isMcpConnected}
              plannerType={plannerType}
              taskCount={tasks.length}
            />
          )}
        </main>
      </div>
    </div>
  );
}
