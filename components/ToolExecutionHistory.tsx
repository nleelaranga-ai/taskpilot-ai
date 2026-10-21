'use client';

import React, { useState } from 'react';
import {
  Terminal,
  ChevronDown,
  ChevronRight,
  CheckCircle2,
  XCircle,
  Clock,
  Copy,
  Check,
  Wrench,
  RefreshCw,
} from 'lucide-react';
import { McpToolSchema, TraceItem } from '@/lib/types';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface ToolExecutionHistoryProps {
  traces: TraceItem[];
  discoveredTools: McpToolSchema[];
  onRefreshTools?: () => Promise<void>;
  isLoading: boolean;
}

export const ToolExecutionHistory: React.FC<ToolExecutionHistoryProps> = ({
  traces,
  discoveredTools,
  onRefreshTools,
  isLoading,
}) => {
  const [expandedTraceId, setExpandedTraceId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const toggleExpand = (id: string) => {
    setExpandedTraceId((prev) => (prev === id ? null : id));
  };

  const copyPayload = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-border pb-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
            Model Context Protocol Inspector
            <span className="text-xs font-mono font-medium px-2 py-0.5 rounded-full bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 border border-border">
              {traces.length} Events
            </span>
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Real-time JSON-RPC 2.0 protocol traces over Streamable HTTP (spec 2025-11-25).
          </p>
        </div>

        {onRefreshTools && (
          <Button
            variant="outline"
            size="sm"
            onClick={onRefreshTools}
            disabled={isLoading}
            className="text-xs h-8 gap-1.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Discover Tools</span>
          </Button>
        )}
      </div>

      {/* Discovered MCP Tools Schema Grid */}
      {discoveredTools.length > 0 ? (
        <div className="bg-stone-50/70 dark:bg-stone-900/40 p-4 rounded-md border border-border space-y-3">
          <div className="flex items-center gap-2">
            <Wrench className="w-4 h-4 text-blue-600" />
            <h3 className="text-xs font-semibold text-foreground uppercase tracking-wider">
              Discovered Server Tools ({discoveredTools.length})
            </h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {discoveredTools.map((tool) => (
              <div
                key={tool.name}
                className="p-3 bg-card rounded-md border border-border shadow-2xs space-y-1.5"
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-foreground">
                    {tool.name}
                  </span>
                  {tool.annotations?.readOnlyHint && (
                    <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-stone-100 text-stone-600 border border-border">
                      readOnly
                    </span>
                  )}
                  {tool.annotations?.idempotentHint && (
                    <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-stone-100 text-stone-600 border border-border">
                      idempotent
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground leading-normal line-clamp-2">
                  {tool.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200/80 dark:border-amber-900/40 p-4 rounded-md space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-amber-800 dark:text-amber-200 font-medium text-xs">
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
              <span>MCP Server Disconnected</span>
            </div>
            {onRefreshTools && (
              <Button
                variant="outline"
                size="sm"
                onClick={onRefreshTools}
                disabled={isLoading}
                className="text-xs h-7 gap-1 border-amber-300 dark:border-amber-800 hover:bg-amber-100/50"
              >
                <RefreshCw className={`w-3 h-3 ${isLoading ? 'animate-spin' : ''}`} />
                <span>Retry Connection</span>
              </Button>
            )}
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            The web client is attempting to reach the Streamable HTTP MCP server on port <code className="font-mono text-foreground font-semibold">3333</code>.
            Run <code className="font-mono text-foreground bg-stone-100 dark:bg-stone-800 px-1 py-0.5 rounded">npm run dev</code> to start both services together, or verify <code className="font-mono text-foreground">TASKPILOT_MCP_URL</code> if deployed on Render/Vercel.
          </p>
        </div>
      )}

      {/* Timeline of Protocol Events */}
      <div className="space-y-3">
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          Execution Timeline
        </h3>

        {traces.length === 0 ? (
          <div className="p-8 text-center bg-card rounded-md border border-dashed border-border space-y-2">
            <Terminal className="w-8 h-8 text-muted-foreground mx-auto stroke-1" />
            <p className="text-sm font-medium text-foreground">
              No protocol traces recorded yet.
            </p>
            <p className="text-xs text-muted-foreground">
              Execute a task action or ask the assistant to generate live MCP Streamable HTTP calls.
            </p>
          </div>
        ) : (
          <div className="space-y-2 font-mono text-xs">
            {traces.map((trace) => {
              const isExpanded = expandedTraceId === trace.id;
              const formattedPayload = JSON.stringify(
                {
                  method: trace.method,
                  step: trace.step,
                  protocolVersion: trace.protocolVersion,
                  latencyMs: trace.ms,
                  request: trace.request,
                  response: trace.response,
                },
                null,
                2
              );

              return (
                <div
                  key={trace.id}
                  className="bg-card rounded-md border border-border shadow-2xs overflow-hidden transition-all"
                >
                  {/* Event Summary Bar */}
                  <div
                    onClick={() => toggleExpand(trace.id)}
                    className="p-3 flex items-center justify-between cursor-pointer hover:bg-stone-50 dark:hover:bg-stone-900 transition-colors select-none"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      {isExpanded ? (
                        <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />
                      ) : (
                        <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
                      )}

                      {trace.ok ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 px-1.5 py-0.2 rounded">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          200 OK
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-700 bg-rose-50 border border-rose-200 px-1.5 py-0.2 rounded">
                          <XCircle className="w-3 h-3 text-rose-600" />
                          Error
                        </span>
                      )}

                      <span className="font-bold text-foreground truncate">
                        {trace.step}
                      </span>
                    </div>

                    <div className="flex items-center gap-3 shrink-0 text-muted-foreground text-[11px]">
                      <span className="flex items-center gap-1 font-mono">
                        <Clock className="w-3 h-3" />
                        {trace.ms}ms
                      </span>
                      <span className="hidden sm:inline font-mono">
                        {trace.protocolVersion}
                      </span>
                      <span className="text-[10px] text-muted-foreground">
                        {new Date(trace.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                  </div>

                  {/* Expandable JSON-RPC Details */}
                  {isExpanded && (
                    <div className="p-4 bg-stone-50 dark:bg-stone-900 border-t border-border space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                          Raw JSON-RPC 2.0 Frame
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            copyPayload(trace.id, formattedPayload);
                          }}
                          className="h-7 text-xs gap-1.5"
                        >
                          {copiedId === trace.id ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                              <span>Copied</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5" />
                              <span>Copy JSON</span>
                            </>
                          )}
                        </Button>
                      </div>

                      <pre className="p-3 rounded bg-stone-950 text-stone-100 text-xs overflow-x-auto leading-relaxed">
                        <code>{formattedPayload}</code>
                      </pre>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
