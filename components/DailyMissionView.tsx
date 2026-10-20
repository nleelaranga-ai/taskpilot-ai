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
  Play,
  RotateCcw,
  Loader2,
  HelpCircle,
  Calendar,
} from 'lucide-react';
import { MissionPlan, Priority, ProposedAction, Task, TraceItem } from '@/lib/types';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
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
        body: JSON.stringify({ action: 'plan', goal: goal.trim() }),
      });

      const data = await res.json();
      if (res.ok && data.plan) {
        setCurrentPlan(data.plan);
        if (data.traces) {
          onAddTraces(data.traces);
        }
      } else {
        alert(data.error || 'Failed to generate mission plan');
      }
    } catch (err: any) {
      console.error(err);
      alert('Error contacting mission planner backend');
    } finally {
      setIsPlanning(false);
    }
  };

  // 2. Toggle selection of a proposed action
  const toggleSelectAction = (id: string) => {
    if (!currentPlan) return;
    setCurrentPlan({
      ...currentPlan,
      proposedActions: currentPlan.proposedActions.map((act) =>
        act.id === id ? { ...act, selected: !act.selected } : act
      ),
    });
  };

  // 3. Edit title of a proposed action
  const updateActionTitle = (id: string, newTitle: string) => {
    if (!currentPlan) return;
    setCurrentPlan({
      ...currentPlan,
      proposedActions: currentPlan.proposedActions.map((act) =>
        act.id === id ? { ...act, title: newTitle } : act
      ),
    });
  };

  // 4. Update priority of a proposed action
  const updateActionPriority = (id: string, priority: Priority) => {
    if (!currentPlan) return;
    setCurrentPlan({
      ...currentPlan,
      proposedActions: currentPlan.proposedActions.map((act) =>
        act.id === id ? { ...act, priority } : act
      ),
    });
  };

  // 5. Execute Approved Plan via Real MCP Tools
  const handleApproveAndExecute = async () => {
    if (!currentPlan || isExecuting) return;

    const approvedActions = currentPlan.proposedActions.filter((a) => a.selected);
    if (approvedActions.length === 0) {
      alert('Please select at least one action to execute.');
      return;
    }

    setIsExecuting(true);

    try {
      const res = await fetch('/api/mission', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'execute', actions: approvedActions }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setExecutionSummary(data.summary);
        if (data.traces) {
          onAddTraces(data.traces);
        }
        await onRefreshTasks();
      } else {
        alert(data.error || 'Execution failed');
      }
    } catch (err: any) {
      console.error(err);
      alert('Error executing mission actions');
    } finally {
      setIsExecuting(false);
    }
  };

  const handleCancelPlan = () => {
    setCurrentPlan(null);
    setExecutionSummary(null);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-5">
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
              <Target className="w-5 h-5 text-cyan-400" />
              Daily Mission Planner
            </h1>
            <Badge variant="outline" className="text-cyan-400 border-cyan-800 bg-cyan-950/40">
              Signature AI Flow
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Autonomous multi-step mission decomposition backed by real MCP tool validation and user approval.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <Badge variant="secondary" className="font-mono text-xs">
            {existingTasks.filter((t) => t.status === 'open').length} Open Tasks in SQLite
          </Badge>
        </div>
      </div>

      {/* Mission Intake Form */}
      <Card className="border-border bg-card/80 shadow-md">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-cyan-400" />
            What is your mission goal?
          </CardTitle>
          <CardDescription className="text-xs">
            Describe your situation, commitments, or deadlines in plain English.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-2">
            <Input
              value={goalInput}
              onChange={(e) => setGoalInput(e.target.value)}
              placeholder="e.g. Help me organize my evening. I have an assignment due tomorrow and an exam in two days."
              className="flex-1 bg-background"
              disabled={isPlanning || isExecuting}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleGeneratePlan();
              }}
            />
            <Button
              onClick={() => handleGeneratePlan()}
              disabled={!goalInput.trim() || isPlanning || isExecuting}
              className="bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold"
            >
              {isPlanning ? (
                <>
                  <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
                  Analyzing...
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 mr-1.5 fill-current" />
                  Decompose Mission
                </>
              )}
            </Button>
          </div>

          {/* Quick Sample Mission Pills */}
          <div className="space-y-1.5">
            <span className="text-[11px] font-medium text-muted-foreground">Try a sample goal:</span>
            <div className="flex flex-wrap gap-1.5">
              {SAMPLE_MISSIONS.map((sample) => (
                <button
                  key={sample}
                  onClick={() => {
                    setGoalInput(sample);
                    handleGeneratePlan(sample);
                  }}
                  disabled={isPlanning || isExecuting}
                  className="text-left text-xs px-2.5 py-1 rounded-md bg-muted hover:bg-accent text-muted-foreground hover:text-foreground border border-border transition-all"
                >
                  "{sample}"
                </button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Execution Truthful Summary Banner */}
      {executionSummary && (
        <Card className="border-emerald-700/60 bg-emerald-950/20 shadow-md">
          <CardContent className="p-4 flex items-start space-x-3">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h4 className="text-sm font-semibold text-emerald-300">
                Mission Committed to SQLite Database
              </h4>
              <p className="text-xs text-emerald-200/90 leading-relaxed">{executionSummary}</p>
              <div className="pt-1 flex items-center space-x-3 text-[11px] text-muted-foreground">
                <span>• Real MCP tools executed</span>
                <span>• Live board updated</span>
                <span>• Trace records verified</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Staged Mission Proposal Card */}
      {currentPlan && (
        <Card className="border-cyan-800/60 bg-card shadow-xl overflow-hidden">
          <CardHeader className="bg-muted/40 border-b border-border pb-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
              <div>
                <Badge variant="outline" className="text-cyan-400 border-cyan-800 bg-cyan-950/50 mb-1">
                  Proposed Staged Plan
                </Badge>
                <CardTitle className="text-base font-bold text-foreground">
                  {currentPlan.missionTitle}
                </CardTitle>
                <CardDescription className="text-xs text-muted-foreground mt-0.5">
                  {currentPlan.reasoning}
                </CardDescription>
              </div>

              <div className="flex items-center space-x-2">
                <Button variant="ghost" size="sm" onClick={handleCancelPlan} disabled={isExecuting}>
                  Cancel
                </Button>
                <Button
                  onClick={handleApproveAndExecute}
                  disabled={isExecuting || currentPlan.proposedActions.filter((a) => a.selected).length === 0}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold shadow-md"
                >
                  {isExecuting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
                      Executing via MCP...
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="w-4 h-4 mr-1.5" />
                      Approve & Execute (
                      {currentPlan.proposedActions.filter((a) => a.selected).length}) Actions
                    </>
                  )}
                </Button>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-4 space-y-4">
            {/* Clarification Prompts if missing info was detected */}
            {currentPlan.clarifications && currentPlan.clarifications.length > 0 && (
              <div className="p-3 rounded-lg bg-amber-950/30 border border-amber-700/50 space-y-1.5">
                <div className="flex items-center space-x-1.5 text-xs font-semibold text-amber-300">
                  <HelpCircle className="w-4 h-4" />
                  <span>Clarification Considerations:</span>
                </div>
                <ul className="list-disc list-inside text-xs text-amber-200/80 space-y-0.5 pl-1">
                  {currentPlan.clarifications.map((q, idx) => (
                    <li key={idx}>{q}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Proposed Actions List */}
            <div className="space-y-2.5">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span className="font-semibold uppercase tracking-wider text-[10px]">
                  Proposed Actions (Select, edit, or remove before approval)
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
                    className={`p-3.5 rounded-xl border transition-all ${
                      act.selected
                        ? 'bg-muted/40 border-cyan-800/60 shadow-sm'
                        : 'bg-muted/10 border-border opacity-50'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      {/* Checkbox */}
                      <input
                        type="checkbox"
                        checked={act.selected}
                        onChange={() => toggleSelectAction(act.id)}
                        className="mt-1 w-4 h-4 rounded text-cyan-600 focus:ring-cyan-500 cursor-pointer"
                      />

                      {/* Action Details */}
                      <div className="flex-1 min-w-0 space-y-1.5">
                        {isEditing ? (
                          <div className="flex items-center gap-2">
                            <Input
                              value={act.title}
                              onChange={(e) => updateActionTitle(act.id, e.target.value)}
                              className="h-8 text-xs bg-background"
                            />
                            <select
                              value={act.priority}
                              onChange={(e) => updateActionPriority(act.id, e.target.value as Priority)}
                              className="h-8 text-xs bg-background border border-border rounded px-2"
                            >
                              <option value="high">High</option>
                              <option value="medium">Medium</option>
                              <option value="low">Low</option>
                            </select>
                            <Button size="sm" variant="secondary" onClick={() => setEditingActionId(null)}>
                              Done
                            </Button>
                          </div>
                        ) : (
                          <div className="flex items-center justify-between">
                            <h4 className="text-sm font-semibold text-foreground break-words">
                              {act.title}
                            </h4>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setEditingActionId(act.id)}
                              className="w-6 h-6 text-muted-foreground hover:text-foreground"
                            >
                              <Edit2 className="w-3 h-3" />
                            </Button>
                          </div>
                        )}

                        <p className="text-xs text-muted-foreground leading-relaxed">
                          {act.rationale}
                        </p>

                        <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px]">
                          <Badge
                            variant={
                              act.priority === 'high'
                                ? 'destructive'
                                : act.priority === 'medium'
                                ? 'secondary'
                                : 'outline'
                            }
                            className="text-[10px] uppercase font-bold"
                          >
                            [{act.priority}]
                          </Badge>

                          {act.due && (
                            <span className="flex items-center text-muted-foreground gap-1">
                              <Calendar className="w-3 h-3" />
                              Due: {act.due}
                            </span>
                          )}

                          <span className="flex items-center text-muted-foreground gap-1">
                            <Clock className="w-3 h-3" />
                            Est: {act.timeEstimate}
                          </span>

                          <span className="text-[10px] text-cyan-400 font-mono">
                            Tool: {act.action === 'create' ? 'create_task' : 'complete_task'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>

          <CardFooter className="bg-muted/20 border-t border-border flex items-center justify-between p-4">
            <span className="text-xs text-muted-foreground">
              Once approved, TaskPilot executes real JSON-RPC tool calls against port 3333.
            </span>
            <Button
              onClick={handleApproveAndExecute}
              disabled={isExecuting || currentPlan.proposedActions.filter((a) => a.selected).length === 0}
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-semibold"
            >
              Confirm & Execute Plan
            </Button>
          </CardFooter>
        </Card>
      )}
    </div>
  );
};
