'use client';

import React, { useState } from 'react';
import { Terminal, ChevronDown, ChevronRight, CheckCircle2, XCircle, Clock, Copy, Check, Wrench, Shield, RefreshCw } from 'lucide-react';
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
  const [showToolsPanel, setShowToolsPanel] = useState<boolean>(true);

  const toggleExpand = (id: string) => {
    setExpandedTraceId((prev) => (prev === id ? null : id));
  };

  const copyPayload = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <Card className="flex flex-col h-[740px] border-border bg-card/80 shadow-2xl overflow-hidden p-0 gap-0">
      {/* Header */}
      <div className="px-4 py-3 border-b border-border bg-card flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
            <Terminal className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
              MCP Protocol Execution Log
              <Badge variant="secondary" className="font-mono text-emerald-300 bg-emerald-950/80 border-emerald-800">
                {traces.length} calls
              </Badge>
            </h2>
            <span className="text-[11px] text-muted-foreground">Live Streamable HTTP JSON-RPC 2.0 traffic</span>
          </div>
        </div>

        {onRefreshTools && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onRefreshTools}
            disabled={isLoading}
            title="Refresh discovered tools"
            className="w-7 h-7 text-muted-foreground"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
        )}
      </div>

      {/* Discovered Tools Header Accordion */}
      <div className="border-b border-border bg-muted/20">
        <button
          onClick={() => setShowToolsPanel(!showToolsPanel)}
          className="w-full px-4 py-2.5 text-xs font-semibold text-muted-foreground hover:text-foreground flex items-center justify-between"
        >
          <div className="flex items-center space-x-2">
            <Wrench className="w-3.5 h-3.5 text-cyan-400" />
            <span>Discovered Tools ({discoveredTools.length})</span>
            <Badge variant="outline" className="text-[10px] py-0 px-1.5 font-mono text-cyan-300 border-cyan-800 bg-cyan-950/50">
              spec 2025-11-25
            </Badge>
          </div>
          {showToolsPanel ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
        </button>

        {showToolsPanel && (
          <div className="px-4 pb-3 space-y-2">
            {discoveredTools.map((tool) => (
              <div key={tool.name} className="p-2.5 rounded-lg bg-card/60 border border-border text-xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-1.5 font-mono font-bold text-cyan-300">
                    <span>{tool.name}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {tool.annotations?.readOnlyHint && (
                      <Badge variant="outline" className="text-[10px] py-0 px-1.5 bg-blue-950/80 text-blue-300 border-blue-800">
                        readOnly
                      </Badge>
                    )}
                    {tool.annotations?.idempotentHint && (
                      <Badge variant="outline" className="text-[10px] py-0 px-1.5 bg-purple-950/80 text-purple-300 border-purple-800">
                        idempotent
                      </Badge>
                    )}
                  </div>
                </div>
                <p className="text-[11px] text-muted-foreground mt-1">{tool.description}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Real-time Trace Stream */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2 font-mono text-xs">
        {traces.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 text-muted-foreground">
            <Terminal className="w-8 h-8 mb-2 stroke-[1.5]" />
            <p className="text-sm font-medium text-foreground">No protocol traffic recorded yet</p>
            <p className="text-xs text-muted-foreground mt-1">
              Initialize or send an utterance to inspect live JSON-RPC calls.
            </p>
          </div>
        ) : (
          traces.map((trace) => {
            const isExpanded = expandedTraceId === trace.id;
            return (
              <div
                key={trace.id}
                className={`rounded-xl border transition-all ${
                  trace.ok ? 'bg-muted/40 border-border' : 'bg-rose-950/20 border-rose-800/60'
                }`}
              >
                {/* Header row */}
                <div
                  onClick={() => toggleExpand(trace.id)}
                  className="p-2.5 flex items-center justify-between cursor-pointer hover:bg-muted/60 select-none"
                >
                  <div className="flex items-center space-x-2 min-w-0">
                    {trace.ok ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                    ) : (
                      <XCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
                    )}

                    <span className="font-semibold text-foreground truncate">{trace.step}</span>

                    <Badge variant="secondary" className="text-[10px] font-normal py-0 px-1.5">
                      {trace.method}
                    </Badge>
                  </div>

                  <div className="flex items-center space-x-2 text-[11px]">
                    <span className="flex items-center text-muted-foreground font-mono">
                      <Clock className="w-3 h-3 mr-1" />
                      {trace.ms}ms
                    </span>
                    <Badge variant="outline" className="text-[10px] font-mono text-cyan-400/80 border-cyan-900 bg-cyan-950/40 py-0 px-1.5">
                      {trace.protocolVersion}
                    </Badge>
                    {isExpanded ? (
                      <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
                    ) : (
                      <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />
                    )}
                  </div>
                </div>

                {/* Expanded Details */}
                {isExpanded && (
                  <div className="p-3 border-t border-border bg-card/90 space-y-2.5">
                    {/* Timestamp & Status */}
                    <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                      <span>Timestamp: {trace.timestamp}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          copyPayload(
                            trace.id,
                            JSON.stringify({ request: trace.request, response: trace.response }, null, 2)
                          )
                        }
                        className="h-6 px-2 text-cyan-400 hover:text-cyan-300 text-[10px]"
                      >
                        {copiedId === trace.id ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-400 mr-1" />
                            <span>Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3 mr-1" />
                            <span>Copy Payload</span>
                          </>
                        )}
                      </Button>
                    </div>

                    {/* Request JSON */}
                    <div>
                      <div className="text-[10px] uppercase font-bold text-muted-foreground mb-1">
                        JSON-RPC Request
                      </div>
                      <pre className="p-2 rounded bg-background text-cyan-200 text-[10px] overflow-x-auto max-h-36 border border-border">
                        {JSON.stringify(trace.request, null, 2)}
                      </pre>
                    </div>

                    {/* Response JSON */}
                    <div>
                      <div className="text-[10px] uppercase font-bold text-muted-foreground mb-1">
                        JSON-RPC Response
                      </div>
                      <pre className="p-2 rounded bg-background text-emerald-200 text-[10px] overflow-x-auto max-h-36 border border-border">
                        {JSON.stringify(trace.response, null, 2)}
                      </pre>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </Card>
  );
};
