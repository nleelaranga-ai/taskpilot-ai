'use client';

import React, { useState } from 'react';
import {
  Sparkles,
  Send,
  Mic,
  MicOff,
  CheckCircle2,
  Circle,
  AlertTriangle,
  Clock,
  Layers,
  ArrowUpRight,
  TrendingUp,
  Activity,
  CheckSquare,
  Bot,
  User,
  Volume2,
  VolumeX,
  Loader2,
} from 'lucide-react';
import { Priority, Task, TraceItem } from '@/lib/types';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

interface WorkspaceOverviewProps {
  tasks: Task[];
  traces: TraceItem[];
  onSendMessage: (utterance: string, context?: any) => Promise<void>;
  onCompleteTask: (taskId: number) => Promise<void>;
  onNavigateToTasks: () => void;
  isLoading: boolean;
  ambiguousCandidates?: Task[];
}

export const WorkspaceOverview: React.FC<WorkspaceOverviewProps> = ({
  tasks,
  traces,
  onSendMessage,
  onCompleteTask,
  onNavigateToTasks,
  isLoading,
  ambiguousCandidates,
}) => {
  const [input, setInput] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [messages, setMessages] = useState<Array<{ id: string; sender: 'user' | 'assistant'; text: string; time: string }>>([
    {
      id: 'welcome',
      sender: 'assistant',
      text: "TaskPilot AI is connected to your local MCP server. You can speak or type to add tasks with priorities and due dates, or say 'Plan my day'.",
      time: 'Just now',
    },
  ]);
  const [speechEnabled, setSpeechEnabled] = useState(true);

  const todayStr = new Date().toISOString().split('T')[0];

  // Real Computed Metrics
  const openTasks = tasks.filter((t) => t.status === 'open');
  const doneTasks = tasks.filter((t) => t.status === 'done');
  const highPriorityOpen = openTasks.filter((t) => t.priority === 'high').length;
  const overdueCount = openTasks.filter((t) => t.due && t.due < todayStr).length;
  const completionRate =
    tasks.length > 0 ? Math.round((doneTasks.length / tasks.length) * 100) : 0;

  // Speak assistant reply
  const speak = (text: string) => {
    if (!speechEnabled || typeof window === 'undefined' || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utt = new SpeechSynthesisUtterance(text);
    utt.rate = 1.05;
    window.speechSynthesis.speak(utt);
  };

  const handleSend = async (textToSend?: string) => {
    const text = textToSend || input;
    if (!text.trim() || isLoading) return;

    const userMsg = {
      id: `u-${Date.now()}`,
      sender: 'user' as const,
      text: text.trim(),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput('');

    try {
      await onSendMessage(text.trim());
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Heading & Prompt Overview */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-5">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Layers className="w-5 h-5 text-cyan-400" />
            AI Task Workspace
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Natural language task orchestration powered by real Model Context Protocol tool calls and SQLite.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onNavigateToTasks}
            className="text-xs gap-1.5"
          >
            <span>View Full Task Board</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>

      {/* Real Statistics Cards (SectionCards Design Pattern) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Open Tasks Card */}
        <Card className="border-border bg-card/70 shadow-xs">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs font-medium">Open Tasks</CardDescription>
            <CardTitle className="text-2xl font-bold tabular-nums text-foreground flex items-baseline justify-between">
              <span>{openTasks.length}</span>
              {highPriorityOpen > 0 && (
                <Badge variant="destructive" className="text-[10px] py-0 px-1.5">
                  {highPriorityOpen} High Priority
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardFooter className="pt-0 text-[11px] text-muted-foreground flex items-center gap-1">
            <span className="text-cyan-400 font-semibold">{openTasks.length}</span> active tasks in SQLite
          </CardFooter>
        </Card>

        {/* Completed Tasks Card */}
        <Card className="border-border bg-card/70 shadow-xs">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs font-medium">Completed Tasks</CardDescription>
            <CardTitle className="text-2xl font-bold tabular-nums text-foreground flex items-baseline justify-between">
              <span>{doneTasks.length}</span>
              <Badge variant="secondary" className="text-[10px] py-0 px-1.5 text-emerald-300 bg-emerald-950/60">
                {completionRate}% Rate
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardFooter className="pt-0 text-[11px] text-muted-foreground flex items-center gap-1">
            <TrendingUp className="w-3 h-3 text-emerald-400" />
            Verified via MCP completion
          </CardFooter>
        </Card>

        {/* Overdue Alerts Card */}
        <Card className="border-border bg-card/70 shadow-xs">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs font-medium">Overdue Deadlines</CardDescription>
            <CardTitle className="text-2xl font-bold tabular-nums text-foreground flex items-baseline justify-between">
              <span className={overdueCount > 0 ? 'text-rose-400 font-bold' : ''}>
                {overdueCount}
              </span>
              {overdueCount > 0 && (
                <Badge variant="destructive" className="text-[10px] py-0 px-1.5 animate-pulse">
                  Urgent
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardFooter className="pt-0 text-[11px] text-muted-foreground flex items-center gap-1">
            {overdueCount > 0 ? (
              <span className="text-rose-400 flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" />
                Due date has passed
              </span>
            ) : (
              <span className="text-muted-foreground">All deadlines on track</span>
            )}
          </CardFooter>
        </Card>

        {/* Real MCP Protocol Execution Counter */}
        <Card className="border-border bg-card/70 shadow-xs">
          <CardHeader className="pb-2">
            <CardDescription className="text-xs font-medium">MCP Protocol Calls</CardDescription>
            <CardTitle className="text-2xl font-bold tabular-nums text-foreground flex items-baseline justify-between">
              <span className="text-cyan-400 font-mono">{traces.length}</span>
              <Badge variant="outline" className="text-[10px] font-mono text-cyan-300 border-cyan-800 bg-cyan-950/40">
                2025-11-25
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardFooter className="pt-0 text-[11px] text-muted-foreground flex items-center gap-1">
            <Activity className="w-3 h-3 text-cyan-400" />
            Streamable HTTP JSON-RPC 2.0
          </CardFooter>
        </Card>
      </div>

      {/* Prominent Command Input Bar */}
      <Card className="border-border bg-card/90 shadow-lg">
        <CardContent className="p-4 space-y-3">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex items-center gap-2"
          >
            <div className="relative flex-1">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Type or speak a task... (e.g. 'Remind me to submit Devpost tomorrow high priority')"
                className="bg-background pr-10 text-sm h-11"
                disabled={isLoading}
              />
            </div>

            <Button
              type="submit"
              disabled={!input.trim() || isLoading}
              className="bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-semibold h-11 px-5 shadow-sm"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <Send className="w-4 h-4 mr-1.5" />
                  Execute
                </>
              )}
            </Button>
          </form>

          {/* Quick Suggested Commands */}
          <div className="flex flex-wrap items-center gap-1.5 pt-1">
            <span className="text-[11px] text-muted-foreground mr-1">Quick Suggestions:</span>
            {['Plan my day', 'Remind me to submit Devpost tomorrow high priority', "What's on my list?", 'Done with Devpost'].map(
              (prompt) => (
                <Badge
                  key={prompt}
                  variant="outline"
                  onClick={() => handleSend(prompt)}
                  className="cursor-pointer text-[11px] py-0.5 px-2 hover:bg-accent transition-all font-normal"
                >
                  {prompt}
                </Badge>
              )
            )}
          </div>
        </CardContent>
      </Card>

      {/* Two Column Grid: Active Tasks & AI Chat Stream */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Active Open Tasks List */}
        <Card className="border-border bg-card shadow-md flex flex-col h-[520px]">
          <CardHeader className="border-b border-border pb-3 bg-muted/20">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <CheckSquare className="w-4 h-4 text-cyan-400" />
                  Active Tasks ({openTasks.length})
                </CardTitle>
                <CardDescription className="text-[11px]">
                  Real-time synchronization with local SQLite database
                </CardDescription>
              </div>
              <Button variant="ghost" size="sm" onClick={onNavigateToTasks} className="text-xs h-7">
                See all
              </Button>
            </div>
          </CardHeader>

          <CardContent className="flex-1 overflow-y-auto p-3 space-y-2">
            {openTasks.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 text-muted-foreground">
                <CheckSquare className="w-8 h-8 mb-2 stroke-[1.5]" />
                <p className="text-sm font-medium text-foreground">No open tasks</p>
                <p className="text-xs mt-1">Try saying "Plan my day" or adding a task above.</p>
              </div>
            ) : (
              openTasks.slice(0, 8).map((task) => {
                const isOverdue = task.due && task.due < todayStr;
                return (
                  <div
                    key={task.id}
                    className="p-3 rounded-lg bg-muted/30 border border-border hover:bg-muted/60 transition-all flex items-start justify-between gap-3 group"
                  >
                    <div className="flex items-start space-x-2.5 flex-1 min-w-0">
                      <button
                        onClick={() => onCompleteTask(task.id)}
                        disabled={isLoading}
                        title="Complete task via MCP complete_task"
                        className="mt-0.5 text-muted-foreground hover:text-cyan-400 transition-colors"
                      >
                        <Circle className="w-4 h-4 group-hover:scale-110 transition-transform" />
                      </button>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-1.5">
                          <span className="text-[11px] font-mono text-muted-foreground">#{task.id}</span>
                          <span className="text-xs font-medium text-foreground truncate">{task.title}</span>
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge
                            variant={
                              task.priority === 'high'
                                ? 'destructive'
                                : task.priority === 'medium'
                                ? 'secondary'
                                : 'outline'
                            }
                            className="text-[9px] uppercase font-bold py-0 px-1"
                          >
                            [{task.priority}]
                          </Badge>
                          {task.due && (
                            <span
                              className={`text-[10px] flex items-center gap-1 ${
                                isOverdue ? 'text-rose-400 font-semibold' : 'text-muted-foreground'
                              }`}
                            >
                              <Clock className="w-3 h-3" />
                              {isOverdue ? `Overdue: ${task.due}` : task.due}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </CardContent>
        </Card>

        {/* Right: AI Assistant Conversational Log */}
        <Card className="border-border bg-card shadow-md flex flex-col h-[520px]">
          <CardHeader className="border-b border-border pb-3 bg-muted/20">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Avatar className="w-6 h-6 border border-cyan-500/40 bg-cyan-500/20 text-cyan-400">
                  <AvatarFallback className="bg-transparent text-cyan-400 text-xs font-bold">
                    A+
                  </AvatarFallback>
                </Avatar>
                <div>
                  <CardTitle className="text-sm font-semibold flex items-center gap-1.5">
                    Alexa+ Assistant
                    <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span>
                  </CardTitle>
                </div>
              </div>

              <Button
                variant={speechEnabled ? 'secondary' : 'ghost'}
                size="icon"
                onClick={() => setSpeechEnabled(!speechEnabled)}
                className="w-7 h-7 text-xs"
                title={speechEnabled ? 'Mute audio' : 'Enable voice'}
              >
                {speechEnabled ? <Volume2 className="w-3.5 h-3.5 text-cyan-400" /> : <VolumeX className="w-3.5 h-3.5 text-muted-foreground" />}
              </Button>
            </div>
          </CardHeader>

          <CardContent className="flex-1 overflow-y-auto p-3 space-y-3">
            {messages.map((m) => (
              <div
                key={m.id}
                className={`flex flex-col ${m.sender === 'user' ? 'items-end' : 'items-start'}`}
              >
                <div className="flex items-center space-x-1 mb-1 px-1 text-[10px] text-muted-foreground">
                  <span>{m.sender === 'user' ? 'You' : 'Alexa+'}</span>
                  <span>•</span>
                  <span>{m.time}</span>
                </div>
                <div
                  className={`max-w-[85%] rounded-xl px-3 py-2 text-xs leading-relaxed ${
                    m.sender === 'user'
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted/70 text-foreground border border-border'
                  }`}
                >
                  <p>{m.text}</p>
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex items-center space-x-2 text-xs text-muted-foreground p-2">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-cyan-400" />
                <span>Executing MCP tool calls...</span>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
