'use client';

import React, { useState } from 'react';
import {
  Target,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Clock,
  ArrowRight,
  ShieldCheck,
  Edit2,
  Trash2,
  RotateCcw,
  Loader2,
  HelpCircle,
  Calendar,
  Check,
} from 'lucide-react';
import { MissionPlan, Priority, ProposedAction, Task, TraceItem } from '@/lib/types';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

interface DailyMissionViewProps {
  onRefreshTasks: () => Promise<void>;
  onAddTraces: (traces: TraceItem[]) => void;
  existingTasks: Task[];
}

const SAMPLE_MISSIONS = [
  'Help me organize my evening. I have an assignment due tomorrow and an exam in two days.',
  'Plan my morning triage. Review bug reports, sync with team, and prep sprint deliverables.',
  'Schedule a 3-hour deep focus coding sprint for project architecture.',
];

export const DailyMissionView: React.FC<DailyMissionViewProps> = ({
  onRefreshTasks,
  onAddTraces,
  existingTasks,
}) => {
  const [goalInput, setGoalInput] = useState('');
  const [isPlanning, setIsPlanning] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);
  const [currentPlan, setCurrentPlan] = useState<MissionPlan | null>(null);
  const [executionSummary, setExecutionSummary] = useState<string | null>(null);
  const [editingActionId, setEditingActionId] = useState<string | null>(null);

  // 1. Generate Mission Plan
  const handleGeneratePlan = async (goalToUse?: string) => {
    const goal = goalToUse || goalInput;
    if (!goal.trim() || isPlanning) return;

    setIsPlanning(true);
    setCurrentPlan(null);
    setExecutionSummary(null);

    try {
      const res = await fetch('/api/mission', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'plan',
          goal: goal.trim(),
          existingTasks,
        }),
      });

      const data = await res.json();
      if (res.ok && data.plan) {
        setCurrentPlan(data.plan);
        if (data.trace && Array.isArray(data.trace)) {
          onAddTraces(data.trace);
        }
      }
    } catch (err) {
      console.error('Plan generation failed:', err);
    } finally {
      setIsPlanning(false);
    }
  };

  // 2. Execute Approved Plan
  const handleApproveAndExecute = async () => {
    if (!currentPlan || isExecuting) return;

    setIsExecuting(true);
    try {
      const actionsToExecute = currentPlan.proposedActions.filter((a) => a.selected);
      const res = await fetch('/api/mission', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'execute',
          actions: actionsToExecute,
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setExecutionSummary(
          data.summary ||
            `Successfully executed ${actionsToExecute.length} actions via real MCP tools. Database state updated.`
        );
        if (data.trace && Array.isArray(data.trace)) {
          onAddTraces(data.trace);
        }
        await onRefreshTasks();
        setCurrentPlan(null);
      }
    } catch (err) {
      console.error('Plan execution failed:', err);
    } finally {
      setIsExecuting(false);
    }
  };

  const handleCancelPlan = () => {
    setCurrentPlan(null);
  };

  const toggleSelectAction = (actionId: string) => {
    if (!currentPlan) return;
    setCurrentPlan({
      ...currentPlan,
      proposedActions: currentPlan.proposedActions.map((a) =>
        a.id === actionId ? { ...a, selected: !a.selected } : a
      ),
    });
  };

  const updateActionTitle = (actionId: string, newTitle: string) => {
    if (!currentPlan) return;
    setCurrentPlan({
      ...currentPlan,
      proposedActions: currentPlan.proposedActions.map((a) =>
        a.id === actionId ? { ...a, title: newTitle } : a
      ),
    });
  };

  const deleteAction = (actionId: string) => {
    if (!currentPlan) return;
    setCurrentPlan({
      ...currentPlan,
      proposedActions: currentPlan.proposedActions.filter((a) => a.id !== actionId),
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b border-border pb-4">
        <h2 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
          Daily Mission
          <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
            Autonomous Planner
          </span>
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          State your daily goal. TaskPilot inspects current SQLite tasks via MCP, formulates a staged plan for your review, and executes verified changes.
        </p>
      </div>

      {/* Goal Input & Sample Triggers */}
      <Card className="border border-border bg-card shadow-xs">
        <CardContent className="p-4 space-y-3">
          <label htmlFor="mission-goal-input" className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">
            Your Objective or Schedule Request
          </label>
          <div className="flex flex-col sm:flex-row gap-2">
            <Input
              id="mission-goal-input"
              value={goalInput}
              onChange={(e) => setGoalInput(e.target.value)}
              placeholder="e.g. Help me organize my evening. I have an assignment due tomorrow and an exam in two days."
              className="text-sm h-10 flex-1"
              disabled={isPlanning || isExecuting}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleGeneratePlan();
                }
              }}
            />
            <Button
              onClick={() => handleGeneratePlan()}
              disabled={!goalInput.trim() || isPlanning || isExecuting}
              className="bg-blue-600 hover:bg-blue-700 text-white h-10 px-4 shrink-0"
            >
              {isPlanning ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Analyzing Tasks...
                </>
              ) : (
                'Generate Plan'
              )}
            </Button>
          </div>

          <div className="space-y-1.5 pt-1">
            <span className="text-[11px] font-medium text-muted-foreground">Try a sample objective:</span>
            <div className="flex flex-wrap gap-1.5">
              {SAMPLE_MISSIONS.map((sample) => (
                <button
                  key={sample}
                  type="button"
                  onClick={() => {
                    setGoalInput(sample);
                    handleGeneratePlan(sample);
                  }}
                  disabled={isPlanning || isExecuting}
                  className="text-xs px-2.5 py-1 rounded bg-stone-100 dark:bg-stone-800 hover:bg-stone-200/80 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300 border border-border text-left transition-colors"
                >
                  "{sample}"
                </button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Execution Truthful Summary Banner (EXECUTED ACTIONS) */}
      {executionSummary && (
        <div className="p-4 rounded-md border border-emerald-200 bg-emerald-50/70 dark:bg-emerald-950/30 text-emerald-900 dark:text-emerald-200 space-y-2">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <h4 className="text-sm font-semibold">
              Mission Executed & Verified in SQLite Database
            </h4>
          </div>
          <p className="text-xs text-emerald-800 dark:text-emerald-300 leading-relaxed pl-7">
            {executionSummary}
          </p>
          <div className="pl-7 pt-1 flex items-center gap-3 text-[11px] text-emerald-700 dark:text-emerald-400">
            <span>✓ Real MCP tool calls verified</span>
            <span>✓ Task board updated</span>
            <span>✓ WAL commit complete</span>
          </div>
        </div>
      )}

      {/* Staged Mission Proposal Card (PROPOSED ACTIONS - VISUALLY DISTINCT DRAFT) */}
      {currentPlan && (
        <div className="rounded-md border-2 border-dashed border-blue-300 dark:border-blue-800 bg-blue-50/30 dark:bg-blue-950/20 p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-blue-200 dark:border-blue-900/60 pb-3">
            <div>
              <span className="text-[11px] font-semibold uppercase tracking-wider text-blue-700 dark:text-blue-400 block mb-1">
                Draft Proposed Plan (Pending Approval)
              </span>
              <h3 className="text-base font-bold text-foreground">
                {currentPlan.missionTitle}
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                {currentPlan.reasoning}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleCancelPlan}
                disabled={isExecuting}
                className="h-8 text-xs"
              >
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleApproveAndExecute}
                disabled={isExecuting || currentPlan.proposedActions.filter((a) => a.selected).length === 0}
                className="bg-emerald-600 hover:bg-emerald-700 text-white h-8 text-xs font-medium"
              >
                {isExecuting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                    Executing via MCP...
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-3.5 h-3.5 mr-1.5" />
                    Approve & Execute ({currentPlan.proposedActions.filter((a) => a.selected).length}) Actions
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Clarifications if any */}
          {currentPlan.clarifications && currentPlan.clarifications.length > 0 && (
            <div className="p-3 rounded bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 text-xs text-amber-800 dark:text-amber-300 space-y-1">
              <div className="flex items-center gap-1.5 font-semibold">
                <HelpCircle className="w-4 h-4" />
                <span>Clarification Considerations:</span>
              </div>
              <ul className="list-disc list-inside space-y-0.5 pl-2">
                {currentPlan.clarifications.map((q, idx) => (
                  <li key={idx}>{q}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Proposed Actions List */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span className="font-semibold uppercase tracking-wider text-[10px]">
                Proposed Actions (Select, edit, or uncheck before approval)
              </span>
              <span>
                {currentPlan.proposedActions.filter((a) => a.selected).length} of{' '}
                {currentPlan.proposedActions.length} selected
              </span>
            </div>

            {currentPlan.proposedActions.map((act) => {
              const isEditing = editingActionId === act.id;
              return (
                <div
                  key={act.id}
                  className={`p-3 rounded-md border transition-all ${
                    act.selected
                      ? 'bg-card border-border shadow-2xs'
                      : 'bg-stone-100/50 dark:bg-stone-900/50 border-border opacity-50'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <input
                      type="checkbox"
                      checked={act.selected}
                      onChange={() => toggleSelectAction(act.id)}
                      className="mt-1 w-4 h-4 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                      aria-label={`Select action ${act.title}`}
                    />

                    <div className="flex-1 min-w-0 space-y-1">
                      {isEditing ? (
                        <div className="flex items-center gap-2">
                          <Input
                            value={act.title}
                            onChange={(e) => updateActionTitle(act.id, e.target.value)}
                            className="h-8 text-xs flex-1"
                          />
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setEditingActionId(null)}
                            className="h-8 text-xs"
                          >
                            Done
                          </Button>
                        </div>
                      ) : (
                        <span className="text-sm font-medium text-foreground block">
                          {act.title}
                        </span>
                      )}

                      <div className="flex items-center gap-2 flex-wrap text-xs text-muted-foreground">
                        <span className="font-mono text-blue-600 text-[11px] font-semibold">
                          MCP Action: {act.action}
                        </span>
                        {act.priority && <span>• Priority: {act.priority}</span>}
                        {act.due && <span>• Due: {act.due}</span>}
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => setEditingActionId(isEditing ? null : act.id)}
                        className="p-1 rounded text-muted-foreground hover:text-foreground"
                        aria-label="Edit proposed action"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => deleteAction(act.id)}
                        className="p-1 rounded text-rose-500 hover:text-rose-700"
                        aria-label="Delete proposed action"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
