'use client';

import React, { useState } from 'react';
import { CheckCircle2, Circle, Clock, AlertTriangle, Calendar, CheckSquare, Layers, Filter } from 'lucide-react';
import { Priority, Task } from '@/lib/types';

interface TaskBoardProps {
  tasks: Task[];
  onCompleteTask: (taskId: number) => Promise<void>;
  isLoading: boolean;
}

export const TaskBoard: React.FC<TaskBoardProps> = ({
  tasks,
  onCompleteTask,
  isLoading,
}) => {
  const [activeTab, setActiveTab] = useState<'open' | 'done'>('open');
  const [filterPriority, setFilterPriority] = useState<string>('all');

  const todayStr = new Date().toISOString().split('T')[0];

  const openTasks = tasks.filter((t) => t.status === 'open');
  const doneTasks = tasks.filter((t) => t.status === 'done');

  const displayedTasks = (activeTab === 'open' ? openTasks : doneTasks).filter((t) => {
    if (filterPriority === 'all') return true;
    return t.priority === filterPriority;
  });

  const getPriorityBadge = (priority: Priority) => {
    switch (priority) {
      case 'high':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-rose-950/80 text-rose-300 border border-rose-700/60">
            [HIGH]
          </span>
        );
      case 'medium':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-amber-950/80 text-amber-300 border border-amber-700/60">
            [MED]
          </span>
        );
      case 'low':
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold bg-emerald-950/80 text-emerald-300 border border-emerald-700/60">
            [LOW]
          </span>
        );
    }
  };

  const getDueBadge = (due: string | null, isDone: boolean) => {
    if (!due) return null;

    const isOverdue = !isDone && due < todayStr;
    const isToday = due === todayStr;

    if (isOverdue) {
      return (
        <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded bg-rose-950/90 text-rose-300 border border-rose-800 font-semibold animate-pulse">
          <AlertTriangle className="w-3 h-3 text-rose-400" />
          Overdue: {due}
        </span>
      );
    }

    if (isToday) {
      return (
        <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded bg-cyan-950/90 text-cyan-300 border border-cyan-800 font-medium">
          <Clock className="w-3 h-3 text-cyan-400" />
          Due Today
        </span>
      );
    }

    return (
      <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
        <Calendar className="w-3 h-3 text-slate-400" />
        {due}
      </span>
    );
  };

  return (
    <div className="flex flex-col h-[740px] bg-slate-900/90 rounded-2xl border border-slate-800 shadow-2xl overflow-hidden">
      {/* Board Top Header */}
      <div className="px-4 py-3 border-b border-slate-800 bg-slate-950/70 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 rounded-full bg-blue-500/20 border border-blue-500/40 flex items-center justify-center text-blue-400">
            <Layers className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-white flex items-center gap-2">
              Live Task Board
              <span className="text-xs px-2 py-0.5 rounded-full bg-blue-950 text-blue-300 border border-blue-800 font-mono">
                {openTasks.length} open / {tasks.length} total
              </span>
            </h2>
            <span className="text-[11px] text-slate-400">Synchronized directly via MCP list_tasks</span>
          </div>
        </div>

        {/* Priority Filter */}
        <div className="flex items-center space-x-1">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <select
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value)}
            className="bg-slate-800 border border-slate-700 text-xs text-slate-200 rounded-lg px-2 py-1 focus:outline-none focus:ring-1 focus:ring-cyan-500"
          >
            <option value="all">All Priorities</option>
            <option value="high">High Only</option>
            <option value="medium">Medium Only</option>
            <option value="low">Low Only</option>
          </select>
        </div>
      </div>

      {/* Column Tabs */}
      <div className="flex border-b border-slate-800 bg-slate-950/40">
        <button
          onClick={() => setActiveTab('open')}
          className={`flex-1 py-2.5 px-4 text-xs font-semibold flex items-center justify-center space-x-2 border-b-2 transition-all ${
            activeTab === 'open'
              ? 'border-cyan-400 text-cyan-300 bg-slate-800/40'
              : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'
          }`}
        >
          <Circle className="w-3.5 h-3.5 text-cyan-400" />
          <span>Open Tasks</span>
          <span className="ml-1 px-1.5 py-0.2 rounded-full bg-slate-800 text-[10px] text-slate-300">
            {openTasks.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('done')}
          className={`flex-1 py-2.5 px-4 text-xs font-semibold flex items-center justify-center space-x-2 border-b-2 transition-all ${
            activeTab === 'done'
              ? 'border-emerald-400 text-emerald-300 bg-slate-800/40'
              : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-900/50'
          }`}
        >
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
          <span>Completed</span>
          <span className="ml-1 px-1.5 py-0.2 rounded-full bg-slate-800 text-[10px] text-slate-300">
            {doneTasks.length}
          </span>
        </button>
      </div>

      {/* Task Cards Container */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
        {displayedTasks.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-500">
            <CheckSquare className="w-10 h-10 mb-2 text-slate-600 stroke-[1.5]" />
            <p className="text-sm font-medium text-slate-400">
              {activeTab === 'open' ? 'No open tasks found' : 'No completed tasks yet'}
            </p>
            <p className="text-xs text-slate-500 mt-1 max-w-xs">
              {activeTab === 'open'
                ? "Try saying 'Plan my day' or 'Remind me to submit Devpost tomorrow'"
                : "Complete a task by clicking its circle or saying 'Done with [task]'"}
            </p>
          </div>
        ) : (
          displayedTasks.map((task) => {
            const isDone = task.status === 'done';
            return (
              <div
                key={task.id}
                className={`group p-3.5 rounded-xl border transition-all duration-200 shadow-sm ${
                  isDone
                    ? 'bg-slate-950/40 border-slate-800/60 opacity-75'
                    : 'bg-slate-800/70 hover:bg-slate-800 border-slate-700/60 hover:border-slate-600'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start space-x-3 flex-1 min-w-0">
                    {/* Checkbox Trigger */}
                    <button
                      onClick={() => !isDone && onCompleteTask(task.id)}
                      disabled={isDone || isLoading}
                      title={isDone ? 'Completed' : 'Click to complete via MCP complete_task'}
                      className={`mt-0.5 flex-shrink-0 transition-colors ${
                        isDone
                          ? 'text-emerald-400 cursor-default'
                          : 'text-slate-400 hover:text-cyan-400'
                      }`}
                    >
                      {isDone ? (
                        <CheckCircle2 className="w-5 h-5 fill-emerald-950 text-emerald-400" />
                      ) : (
                        <Circle className="w-5 h-5 group-hover:scale-110 transition-transform" />
                      )}
                    </button>

                    {/* Task Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2">
                        <span className="text-[11px] font-mono text-slate-400">#{task.id}</span>
                        <h3
                          className={`text-sm font-medium leading-snug break-words ${
                            isDone ? 'line-through text-slate-400' : 'text-slate-100'
                          }`}
                        >
                          {task.title}
                        </h3>
                      </div>

                      {/* Metadata Chips */}
                      <div className="flex flex-wrap items-center gap-2 mt-2">
                        {getPriorityBadge(task.priority)}
                        {getDueBadge(task.due, isDone)}
                        {isDone && task.completed_at && (
                          <span className="text-[10px] text-emerald-400/80 font-mono">
                            Done: {task.completed_at.slice(0, 16)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
