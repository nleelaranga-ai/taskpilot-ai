'use client';

import React, { useState } from 'react';
import {
  CheckCircle2,
  Circle,
  Clock,
  AlertCircle,
  Calendar,
  CheckSquare,
  ArrowUp,
  Minus,
  ArrowDown,
  Filter,
  Check,
} from 'lucide-react';
import { Priority, Task } from '@/lib/types';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface TaskBoardProps {
  tasks: Task[];
  onCompleteTask: (taskId: number) => Promise<void>;
  isLoading: boolean;
}

export const TaskBoard: React.FC<TaskBoardProps> = ({ tasks, onCompleteTask, isLoading }) => {
  const [activeTab, setActiveTab] = useState<'open' | 'done'>('open');
  const [filterPriority, setFilterPriority] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'list' | 'kanban'>('list');

  const todayStr = new Date().toISOString().split('T')[0];

  const openTasks = tasks.filter((t) => t.status === 'open');
  const doneTasks = tasks.filter((t) => t.status === 'done');

  const displayedTasks = (activeTab === 'open' ? openTasks : doneTasks).filter((t) => {
    if (filterPriority === 'all') return true;
    return t.priority === filterPriority;
  });

  const renderPriorityBadge = (priority: Priority) => {
    switch (priority) {
      case 'high':
        return (
          <span className="inline-flex items-center gap-1 text-xs font-medium text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 px-2 py-0.5 rounded">
            <ArrowUp className="w-3 h-3 text-rose-600 dark:text-rose-400" aria-hidden="true" />
            <span>High Priority</span>
          </span>
        );
      case 'medium':
        return (
          <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-700 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 px-2 py-0.5 rounded">
            <Minus className="w-3 h-3 text-amber-600 dark:text-amber-400" aria-hidden="true" />
            <span>Medium Priority</span>
          </span>
        );
      case 'low':
        return (
          <span className="inline-flex items-center gap-1 text-xs font-medium text-stone-700 dark:text-stone-400 bg-stone-100 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 px-2 py-0.5 rounded">
            <ArrowDown className="w-3 h-3 text-stone-500" aria-hidden="true" />
            <span>Low Priority</span>
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border pb-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-foreground">
            Task Board
          </h2>
          <p className="text-sm text-muted-foreground">
            Real SQLite task state verified by Model Context Protocol tools.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Priority Filter */}
          <div className="flex items-center gap-1.5 text-xs">
            <Filter className="w-3.5 h-3.5 text-muted-foreground" />
            <select
              value={filterPriority}
              onChange={(e) => setFilterPriority(e.target.value)}
              className="bg-card border border-border rounded-md px-2.5 py-1 text-xs text-foreground focus:ring-2 focus:ring-blue-600 focus:outline-hidden"
              aria-label="Filter tasks by priority"
            >
              <option value="all">All Priorities</option>
              <option value="high">High Priority</option>
              <option value="medium">Medium Priority</option>
              <option value="low">Low Priority</option>
            </select>
          </div>

          {/* View Mode Switcher */}
          <div className="flex items-center bg-stone-100 dark:bg-stone-900 p-0.5 rounded-md border border-border text-xs">
            <button
              onClick={() => setViewMode('list')}
              className={`px-2.5 py-1 rounded transition-colors ${
                viewMode === 'list'
                  ? 'bg-card text-foreground font-semibold shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              List View
            </button>
            <button
              onClick={() => setViewMode('kanban')}
              className={`px-2.5 py-1 rounded transition-colors ${
                viewMode === 'kanban'
                  ? 'bg-card text-foreground font-semibold shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Kanban Board
            </button>
          </div>
        </div>
      </div>

      {viewMode === 'list' ? (
        /* Tabbed List View */
        <div className="space-y-4">
          <div className="flex items-center gap-2 border-b border-border pb-2">
            <button
              onClick={() => setActiveTab('open')}
              className={`text-sm font-medium pb-2 -mb-2 border-b-2 transition-all ${
                activeTab === 'open'
                  ? 'border-blue-600 text-blue-600 font-semibold'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              Active Tasks ({openTasks.length})
            </button>
            <span className="text-muted-foreground">•</span>
            <button
              onClick={() => setActiveTab('done')}
              className={`text-sm font-medium pb-2 -mb-2 border-b-2 transition-all ${
                activeTab === 'done'
                  ? 'border-blue-600 text-blue-600 font-semibold'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              Completed Tasks ({doneTasks.length})
            </button>
          </div>

          {displayedTasks.length === 0 ? (
            <div className="p-8 text-center bg-card rounded-md border border-dashed border-border space-y-2">
              <Clock className="w-8 h-8 text-muted-foreground mx-auto stroke-1" />
              <p className="text-sm font-medium text-foreground">
                No tasks match the selected filter.
              </p>
              <p className="text-xs text-muted-foreground">
                Change your priority filter or add new tasks via the workspace assistant.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {displayedTasks.map((task) => {
                const isOverdue = task.status === 'open' && task.due && task.due < todayStr;
                const isDone = task.status === 'done';

                return (
                  <div
                    key={task.id}
                    className={`flex items-start gap-3 p-3.5 rounded-md border transition-all ${
                      isDone
                        ? 'bg-stone-50/60 dark:bg-stone-900/40 border-border opacity-70'
                        : isOverdue
                        ? 'bg-rose-50/30 border-rose-200 dark:border-rose-900/60'
                        : 'bg-card border-border hover:border-stone-300 dark:hover:border-stone-700 shadow-2xs'
                    }`}
                  >
                    <button
                      type="button"
                      onClick={() => !isDone && onCompleteTask(task.id)}
                      disabled={isDone || isLoading}
                      aria-label={`Mark task "${task.title}" as complete`}
                      className={`mt-0.5 w-5 h-5 rounded border flex items-center justify-center transition-colors focus:ring-2 focus:ring-blue-600 focus:outline-hidden ${
                        isDone
                          ? 'bg-emerald-600 border-emerald-600 text-white cursor-default'
                          : 'border-stone-300 dark:border-stone-600 hover:border-blue-600 hover:bg-blue-50/50'
                      }`}
                    >
                      {isDone && <Check className="w-3.5 h-3.5 stroke-[2.5]" />}
                    </button>

                    <div className="flex-1 min-w-0">
                      <span
                        className={`text-sm font-medium ${
                          isDone ? 'line-through text-muted-foreground' : 'text-foreground'
                        }`}
                      >
                        {task.title}
                      </span>

                      <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                        {renderPriorityBadge(task.priority)}

                        {task.due && (
                          <span className="inline-flex items-center gap-1 text-xs text-muted-foreground bg-stone-100 dark:bg-stone-800 px-2 py-0.5 rounded border border-border">
                            <Calendar className="w-3 h-3" />
                            <span>Due: {task.due}</span>
                          </span>
                        )}

                        {isOverdue && (
                          <span className="inline-flex items-center gap-1 text-xs font-semibold text-rose-700 dark:text-rose-400 bg-rose-100/70 dark:bg-rose-950/60 px-2 py-0.5 rounded border border-rose-200">
                            <AlertCircle className="w-3 h-3 text-rose-600" />
                            <span>Overdue</span>
                          </span>
                        )}

                        {isDone && task.completed_at && (
                          <span className="text-[11px] text-muted-foreground font-mono">
                            Completed at: {task.completed_at}
                          </span>
                        )}
                      </div>
                    </div>

                    <span className="text-[11px] font-mono text-muted-foreground shrink-0">
                      ID #{task.id}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        /* Kanban Columns View */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
          {/* Column 1: To Do */}
          <div className="bg-stone-50/60 dark:bg-stone-900/60 p-4 rounded-md border border-border space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-border">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-600" />
                <h3 className="text-sm font-semibold text-foreground">
                  To Do
                </h3>
              </div>
              <span className="text-xs px-2 py-0.5 rounded-full bg-stone-200/80 text-stone-700 font-mono">
                {openTasks.length}
              </span>
            </div>

            <div className="space-y-2">
              {openTasks.length === 0 ? (
                <p className="text-xs text-muted-foreground p-4 text-center">
                  No active tasks.
                </p>
              ) : (
                openTasks.map((task) => (
                  <div
                    key={task.id}
                    className="p-3 bg-card rounded-md border border-border shadow-2xs space-y-2"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-sm font-medium text-foreground">
                        {task.title}
                      </span>
                      <button
                        onClick={() => onCompleteTask(task.id)}
                        disabled={isLoading}
                        className="text-xs px-2 py-0.5 rounded bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 shrink-0"
                      >
                        Complete
                      </button>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      {renderPriorityBadge(task.priority)}
                      {task.due && (
                        <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {task.due}
                        </span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Column 2: Done */}
          <div className="bg-stone-50/60 dark:bg-stone-900/60 p-4 rounded-md border border-border space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-border">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-600" />
                <h3 className="text-sm font-semibold text-foreground">
                  Completed
                </h3>
              </div>
              <span className="text-xs px-2 py-0.5 rounded-full bg-stone-200/80 text-stone-700 font-mono">
                {doneTasks.length}
              </span>
            </div>

            <div className="space-y-2">
              {doneTasks.length === 0 ? (
                <p className="text-xs text-muted-foreground p-4 text-center">
                  No completed tasks yet.
                </p>
              ) : (
                doneTasks.map((task) => (
                  <div
                    key={task.id}
                    className="p-3 bg-card/60 rounded-md border border-border opacity-75 space-y-1.5"
                  >
                    <span className="text-sm font-medium line-through text-muted-foreground block">
                      {task.title}
                    </span>
                    <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                      <span className="text-emerald-600 flex items-center gap-1 font-medium">
                        <Check className="w-3 h-3" /> Done
                      </span>
                      {task.completed_at && <span>• {task.completed_at}</span>}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
