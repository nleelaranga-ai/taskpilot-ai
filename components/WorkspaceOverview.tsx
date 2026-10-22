'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  Send,
  Mic,
  MicOff,
  CheckCircle2,
  Circle,
  AlertCircle,
  Calendar,
  ArrowUp,
  Minus,
  ArrowDown,
  Volume2,
  VolumeX,
  Loader2,
  Sparkles,
  HelpCircle,
  Clock,
  Check,
} from 'lucide-react';
import { Priority, Task, TraceItem } from '@/lib/types';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface WorkspaceOverviewProps {
  tasks: Task[];
  traces: TraceItem[];
  onSendMessage: (utterance: string, context?: any) => Promise<void>;
  onCompleteTask: (taskId: number) => Promise<void>;
  onNavigateToTasks: () => void;
  isLoading: boolean;
  ambiguousCandidates?: Task[];
  isMcpConnected?: boolean;
}

export const WorkspaceOverview: React.FC<WorkspaceOverviewProps> = ({
  tasks,
  traces,
  onSendMessage,
  onCompleteTask,
  onNavigateToTasks,
  isLoading,
  ambiguousCandidates,
  isMcpConnected = false,
}) => {
  const [input, setInput] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [taskTab, setTaskTab] = useState<'open' | 'done'>('open');
  const [speechEnabled, setSpeechEnabled] = useState(false);
  const [messages, setMessages] = useState<
    Array<{ id: string; sender: 'user' | 'assistant'; text: string; time: string }>
  >([
    {
      id: 'welcome',
      sender: 'assistant',
      text: isMcpConnected
        ? "TaskPilot AI is connected and listening via Streamable HTTP (protocol 2025-11-25) & SQLite WAL. What would you like to plan today?"
        : "TaskPilot AI is connecting to the MCP Server... (Streamable HTTP 2025-11-25 & SQLite WAL). Once online, you can speak or type tasks.",
      time: isMcpConnected ? 'Online' : 'Initializing',
    },
  ]);

  // Sync welcome message dynamically when connection status changes
  useEffect(() => {
    setMessages((prev) =>
      prev.map((msg) => {
        if (msg.id === 'welcome') {
          return {
            ...msg,
            text: isMcpConnected
              ? "TaskPilot AI is connected and listening via Streamable HTTP (protocol 2025-11-25) & SQLite WAL. What would you like to plan today?"
              : "TaskPilot AI is connecting to the MCP Server... (Streamable HTTP 2025-11-25 & SQLite WAL). Once online, you can speak or type tasks.",
            time: isMcpConnected ? 'Online' : 'Initializing',
          };
        }
        return msg;
      })
    );
  }, [isMcpConnected]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  // Auto-scroll message list
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  // Web Speech API initialization
  useEffect(() => {
    if (typeof window !== 'undefined' && ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window)) {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = 'en-US';

      recognition.onstart = () => setIsListening(true);
      recognition.onend = () => setIsListening(false);
      recognition.onerror = () => setIsListening(false);

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        if (transcript) {
          setInput(transcript);
          handleSendWithUtterance(transcript);
        }
      };

      recognitionRef.current = recognition;
    }
  }, []);

  const toggleListening = () => {
    if (!recognitionRef.current) return;
    if (isListening) {
      recognitionRef.current.stop();
    } else {
      recognitionRef.current.start();
    }
  };

  const handleSendWithUtterance = async (text: string) => {
    if (!text.trim() || isLoading) return;

    const userMsg = {
      id: `user-${Date.now()}`,
      sender: 'user' as const,
      text: text.trim(),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');

    try {
      await onSendMessage(text.trim());
      const assistantReply = {
        id: `assistant-${Date.now()}`,
        sender: 'assistant' as const,
        text: `Executed via MCP tool call. Tasks updated in SQLite.`,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, assistantReply]);

      // If speech output enabled, speak response
      if (speechEnabled && typeof window !== 'undefined' && 'speechSynthesis' in window) {
        const utterance = new SpeechSynthesisUtterance(assistantReply.text);
        window.speechSynthesis.speak(utterance);
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          id: `assistant-err-${Date.now()}`,
          sender: 'assistant' as const,
          text: 'Error communicating with MCP server. Please check connection.',
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    }
  };

  const handleSend = () => {
    handleSendWithUtterance(input);
  };

  const todayStr = new Date().toISOString().split('T')[0];
  const openTasks = tasks.filter((t) => t.status === 'open');
  const doneTasks = tasks.filter((t) => t.status === 'done');
  const displayedTasks = taskTab === 'open' ? openTasks : doneTasks;

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
      {/* Top Workspace Page Title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-border pb-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-foreground">
            Workspace Overview
          </h2>
          <p className="text-sm text-muted-foreground">
            Organize tasks and execute daily plans with conversational MCP tools.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSpeechEnabled(!speechEnabled)}
            className="text-xs h-8 gap-1.5"
            aria-label={speechEnabled ? 'Mute speech output' : 'Enable speech output'}
          >
            {speechEnabled ? <Volume2 className="w-3.5 h-3.5 text-blue-600" /> : <VolumeX className="w-3.5 h-3.5 text-muted-foreground" />}
            <span>Voice Speech: {speechEnabled ? 'On' : 'Off'}</span>
          </Button>
        </div>
      </div>

      {/* Primary Grid: Tasks List (Left) + Alexa Assistant (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column (7 cols): Task Management */}
        <section className="lg:col-span-7 space-y-4" aria-label="Task Management Area">
          <div className="flex items-center justify-between">
            {/* Tabs for Open / Done */}
            <div className="flex items-center gap-1 bg-stone-100 dark:bg-stone-900 p-1 rounded-md border border-border">
              <button
                onClick={() => setTaskTab('open')}
                className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
                  taskTab === 'open'
                    ? 'bg-card text-foreground shadow-xs border border-border font-semibold'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Open ({openTasks.length})
              </button>
              <button
                onClick={() => setTaskTab('done')}
                className={`px-3 py-1 text-xs font-medium rounded transition-colors ${
                  taskTab === 'done'
                    ? 'bg-card text-foreground shadow-xs border border-border font-semibold'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Completed ({doneTasks.length})
              </button>
            </div>

            <Button
              variant="ghost"
              size="sm"
              onClick={onNavigateToTasks}
              className="text-xs text-blue-600 hover:text-blue-700 h-8"
            >
              View Board →
            </Button>
          </div>

          {/* Quick Task Input Field */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex items-center gap-2 bg-card p-1.5 rounded-md border border-border shadow-xs"
          >
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Add a task e.g. 'Finish report tomorrow high priority'..."
              className="border-0 shadow-none focus-visible:ring-0 text-sm h-9 bg-transparent"
              disabled={isLoading}
            />
            <Button
              type="submit"
              size="sm"
              disabled={!input.trim() || isLoading}
              className="bg-blue-600 hover:bg-blue-700 text-white h-8 px-3 shrink-0"
            >
              Add Task
            </Button>
          </form>

          {/* Ambiguous Candidates Disambiguation Callout */}
          {ambiguousCandidates && ambiguousCandidates.length > 0 && (
            <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 rounded-md space-y-2">
              <div className="flex items-center gap-2 text-xs font-semibold text-amber-800 dark:text-amber-300">
                <HelpCircle className="w-4 h-4" />
                <span>Multiple tasks matched. Please select which task you meant:</span>
              </div>
              <div className="space-y-1.5 pl-6">
                {ambiguousCandidates.map((candidate) => (
                  <button
                    key={candidate.id}
                    onClick={() => onCompleteTask(candidate.id)}
                    className="block w-full text-left text-xs p-1.5 rounded hover:bg-amber-100/70 dark:hover:bg-amber-900/50 text-foreground"
                  >
                    #{candidate.id}: <span className="font-medium">{candidate.title}</span> (Due: {candidate.due || 'None'})
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Task List Items */}
          <div className="space-y-2">
            {displayedTasks.length === 0 ? (
              <div className="p-8 text-center bg-card rounded-md border border-dashed border-border space-y-2">
                <Clock className="w-8 h-8 text-muted-foreground mx-auto stroke-1" />
                <p className="text-sm font-medium text-foreground">
                  {taskTab === 'open' ? 'No open tasks on the board' : 'No completed tasks yet'}
                </p>
                <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                  {taskTab === 'open'
                    ? 'Add a new task using the input bar above, or ask the Alexa+ assistant to plan your schedule.'
                    : 'Tasks completed through voice, the board, or the assistant will be archived here.'}
                </p>
              </div>
            ) : (
              displayedTasks.map((task) => {
                const isOverdue = task.status === 'open' && task.due && task.due < todayStr;
                const isDone = task.status === 'done';

                return (
                  <div
                    key={task.id}
                    className={`group flex items-start gap-3 p-3.5 rounded-md border transition-all ${
                      isDone
                        ? 'bg-stone-50/60 dark:bg-stone-900/40 border-border opacity-70'
                        : isOverdue
                        ? 'bg-rose-50/30 border-rose-200 dark:border-rose-900/60'
                        : 'bg-card border-border hover:border-stone-300 dark:hover:border-stone-700 shadow-2xs'
                    }`}
                  >
                    {/* Accessible Completion Checkbox */}
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

                    {/* Task Metadata */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          className={`text-sm font-medium ${
                            isDone ? 'line-through text-muted-foreground' : 'text-foreground'
                          }`}
                        >
                          {task.title}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                        {/* Priority with text label + icon */}
                        {renderPriorityBadge(task.priority)}

                        {/* Due Date Chip */}
                        {task.due && (
                          <span className="inline-flex items-center gap-1 text-xs text-muted-foreground bg-stone-100 dark:bg-stone-800 px-2 py-0.5 rounded border border-border">
                            <Calendar className="w-3 h-3 text-muted-foreground" aria-hidden="true" />
                            <span>Due: {task.due}</span>
                          </span>
                        )}

                        {/* Overdue Warning with icon + text */}
                        {isOverdue && (
                          <span className="inline-flex items-center gap-1 text-xs font-semibold text-rose-700 dark:text-rose-400 bg-rose-100/70 dark:bg-rose-950/60 px-2 py-0.5 rounded border border-rose-200">
                            <AlertCircle className="w-3 h-3 text-rose-600" aria-hidden="true" />
                            <span>Overdue</span>
                          </span>
                        )}
                      </div>
                    </div>

                    <span className="text-[11px] font-mono text-muted-foreground shrink-0">
                      #{task.id}
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </section>

        {/* Right Column (5 cols): Alexa+ Assistant Panel */}
        <section
          className="lg:col-span-5 bg-card rounded-md border border-border shadow-xs flex flex-col h-[580px]"
          aria-label="Alexa+ Assistant Conversation"
        >
          {/* Assistant Header */}
          <div className="p-3.5 border-b border-border flex items-center justify-between bg-stone-50/60 dark:bg-stone-900/60">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-blue-600" />
              <h3 className="text-sm font-semibold text-foreground">
                Alexa+ Assistant
              </h3>
            </div>
            <span className="text-[11px] text-muted-foreground font-mono">
              MCP Tools Active
            </span>
          </div>

          {/* Messages Thread (Accessible Live Region) */}
          <div
            className="flex-1 p-4 overflow-y-auto space-y-3"
            role="log"
            aria-live="polite"
            aria-atomic="false"
          >
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
              >
                <div
                  className={`max-w-[88%] rounded-md p-3 text-sm leading-relaxed ${
                    msg.sender === 'user'
                      ? 'bg-blue-600 text-white rounded-br-xs'
                      : 'bg-stone-100 dark:bg-stone-800 text-foreground border border-border/80 rounded-bl-xs'
                  }`}
                >
                  <p>{msg.text}</p>
                </div>
                <span className="text-[10px] text-muted-foreground px-1 mt-1">
                  {msg.time}
                </span>
              </div>
            ))}

            {isLoading && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground bg-stone-100 dark:bg-stone-800 p-2.5 rounded-md border border-border w-fit animate-pulse">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-600" />
                <span>Planning & executing MCP tool call...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Suggested Prompts */}
          <div className="px-3 py-2 border-t border-border bg-stone-50/30 dark:bg-stone-900/30 space-y-1.5">
            <span className="text-[11px] font-medium text-muted-foreground block">
              Suggested Prompts:
            </span>
            <div className="flex flex-wrap gap-1.5">
              {[
                'Plan my day',
                'Help me organize my evening',
                'Add: Submit assignment tomorrow high priority',
                'What tasks are open?',
              ].map((suggestion) => (
                <button
                  key={suggestion}
                  type="button"
                  onClick={() => handleSendWithUtterance(suggestion)}
                  disabled={isLoading}
                  className="text-xs px-2 py-1 rounded bg-stone-100 dark:bg-stone-800 hover:bg-stone-200/80 dark:hover:bg-stone-700 text-stone-700 dark:text-stone-300 border border-border text-left transition-colors"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>

          {/* Message Composer */}
          <div className="p-3 border-t border-border bg-card">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSend();
              }}
              className="flex items-center gap-2"
            >
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask Alexa+ or enter a task command..."
                className="text-sm h-9 flex-1"
                disabled={isLoading}
              />
              {/* Optional Voice Input Button */}
              {recognitionRef.current && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={toggleListening}
                  className={`h-9 px-2.5 ${isListening ? 'border-rose-500 text-rose-600 bg-rose-50' : ''}`}
                  aria-label={isListening ? 'Stop listening' : 'Start voice input'}
                >
                  {isListening ? <MicOff className="w-4 h-4 animate-pulse" /> : <Mic className="w-4 h-4" />}
                </Button>
              )}
              <Button
                type="submit"
                size="sm"
                disabled={!input.trim() || isLoading}
                className="bg-blue-600 hover:bg-blue-700 text-white h-9 px-3"
                aria-label="Send message"
              >
                <Send className="w-4 h-4" />
              </Button>
            </form>
          </div>
        </section>
      </div>
    </div>
  );
};
