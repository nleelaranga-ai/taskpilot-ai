'use client';

import React, { useState } from 'react';
import { CheckCircle2, Circle, Clock, AlertTriangle, Calendar, CheckSquare, Layers, Filter } from 'lucide-react';
import { Priority, Task } from '@/lib/types';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';

interface TaskBoardProps {
  tasks: Task[];
  onCompleteTask: (taskId: number) => Promise<void>;
  isLoading: boolean;
}

export const TaskBoard: React.FC<TaskBoardProps> = ({ tasks, onCompleteTask, isLoading }) => {
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
          <Badge variant="destructive" className="bg-rose-950 text-rose-300 border-rose-800 text-[11px] font-bold">
            [HIGH]
          </Badge>
        );
      case 'medium':
        return (
          <Badge variant="secondary" className="bg-amber-950/80 text-amber-300 border-amber-800 text-[11px] font-bold">
            [MED]
          </Badge>
        );
      case 'low':
        return (
          <Badge variant="outline" className="bg-emerald-950/80 text-emerald-300 border-emerald-800 text-[11px] font-bold">
            [LOW]
          </Badge>
        );
    }
  };

  const getDueBadge = (due: string | null, isDone: boolean) => {
    if (!due) return null;

    const isOverdue = !isDone && due < todayStr;
    const isToday = due === todayStr;

    if (isOverdue) {
      return (
        <Badge variant="destructive" className="gap-1 text-[11px] font-semibold animate-pulse">
          <AlertTriangle className="w-3 h-3" />
          Overdue: {due}
        </Badge>
      );
    }

    if (isToday) {
      return (
        <Badge variant="secondary" className="gap-1 text-[11px] bg-cyan-950 text-cyan-300 border-cyan-800">
          <Clock className="w-3 h-3 text-cyan-400" />
          Due Today
        </Badge>
      );
    }

    return (
      <Badge variant="outline" className="gap-1 text-[11px] text-muted-foreground">
        <Calendar className="w-3 h-3" />
        {due}
      </Badge>
    );
  };

  return (
    <Card className="flex flex-col h-[740px] border-border bg-card/80 shadow-2xl overflow-hidden p-0 gap-0">
      {/* Board Top Header */}
      <div className="px-4 py-3 border-b border-border bg-card flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 rounded-full bg-blue-500/20 border border-blue-500/40 flex items-center justify-center text-blue-400">
            <Layers className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
              Live Task Board
              <Badge variant="secondary" className="font-mono text-blue-300 bg-blue-950/80 border-blue-800">
                {openTasks.length} open / {tasks.length} total
              </Badge>
            </h2>
            <span className="text-[11px] text-muted-foreground">Synchronized directly via MCP list_tasks</span>
          </div>
        </div>

        {/* Priority Filter */}
        <div className="flex items-center space-x-1">
          <Filter className="w-3.5 h-3.5 text-muted-foreground" />
          <select
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value)}
            className="bg-background border border-border text-xs text-foreground rounded-lg px-2 py-1 focus:outline-none focus:ring-1 focus:ring-cyan-500"
          >
            <option value="all">All Priorities</option>
            <option value="high">High Only</option>
            <option value="medium">Medium Only</option>
            <option value="low">Low Only</option>
          </select>
        </div>
      </div>

      {/* Tabs navigation */}
      <Tabs value={activeTab} onValueChange={(val) => setActiveTab(val as 'open' | 'done')} className="w-full">
        <div className="px-4 pt-2 border-b border-border bg-muted/20">
          <TabsList className="grid grid-cols-2 w-full bg-muted/60">
            <TabsTrigger value="open" className="text-xs gap-1.5 data-[state=active]:text-cyan-300">
              <Circle className="w-3.5 h-3.5 text-cyan-400" />
              <span>Open Tasks</span>
              <Badge variant="secondary" className="ml-1 text-[10px] px-1.5 py-0">
                {openTasks.length}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="done" className="text-xs gap-1.5 data-[state=active]:text-emerald-300">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>Completed</span>
              <Badge variant="secondary" className="ml-1 text-[10px] px-1.5 py-0">
                {doneTasks.length}
              </Badge>
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Task Cards Container */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2.5 h-[585px]">
          {displayedTasks.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-6 text-muted-foreground">
              <CheckSquare className="w-10 h-10 mb-2 stroke-[1.5]" />
              <p className="text-sm font-medium text-foreground">
                {activeTab === 'open' ? 'No open tasks found' : 'No completed tasks yet'}
              </p>
              <p className="text-xs text-muted-foreground mt-1 max-w-xs">
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
                      ? 'bg-muted/30 border-border opacity-75'
                      : 'bg-muted/50 hover:bg-muted/80 border-border hover:border-slate-600'
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
                          isDone ? 'text-emerald-400 cursor-default' : 'text-muted-foreground hover:text-cyan-400'
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
                          <span className="text-[11px] font-mono text-muted-foreground">#{task.id}</span>
                          <h3
                            className={`text-sm font-medium leading-snug break-words ${
                              isDone ? 'line-through text-muted-foreground' : 'text-foreground'
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
      </Tabs>
    </Card>
  );
};
