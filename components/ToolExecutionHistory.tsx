'use client';

import React, { useState } from 'react';
import { Terminal, ChevronDown, ChevronRight, CheckCircle2, XCircle, Clock, Copy, Check, Wrench, Shield, RefreshCw } from 'lucide-react';
import { McpToolSchema, TraceItem } from '@/lib/types';

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
    <div className="flex flex-col h-[740px] bg-slate-900/90 rounded-2xl border border-slate-800 shadow-2xl overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-slate-800 bg-slate-950/70 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 rounded-full bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
            <Terminal className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-white flex items-center gap-2">
              MCP Protocol Execution Log
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800 font-mono">
                {traces.length} calls
              </span>
            </h2>
            <span className="text-[11px] text-slate-400">Live Streamable HTTP JSON-RPC 2.0 traffic</span>
          </div>
        </div>

        {onRefreshTools && (
          <button
            onClick={onRefreshTools}
            disabled={isLoading}
            title="Refresh discovered tools"
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        )}
      </div>

      {/* Discovered Tools Header Accordion */}
      <div className="border-b border-slate-800 bg-slate-950/50">
        <button
          onClick={() => setShowToolsPanel(!showToolsPanel)}
          className="w-full px-4 py-2.5 text-xs font-semibold text-slate-300 hover:text-white flex items-center justify-between"
        >
          <div className="flex items-center space-x-2">
            <Wrench className="w-3.5 h-3.5 text-cyan-400" />
            <span>Discovered Tools ({discoveredTools.length})</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded bg-cyan-950 text-cyan-300 border border-cyan-800 font-mono">
              spec 2025-11-25
            </span>
          </div>
          {showToolsPanel ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
        </button>

        {showToolsPanel && (
          <div className="px-4 pb-3 space-y-2">
            {discoveredTools.map((tool) => (
              <div
                key={tool.name}
                className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800 text-xs"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-1.5 font-mono font-bold text-cyan-300">
                    <span>{tool.name}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {tool.annotations?.readOnlyHint && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-950 text-blue-300 border border-blue-800">
                        readOnly
                      </span>
                    )}
                    {tool.annotations?.idempotentHint && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-950 text-purple-300 border border-purple-800">
                        idempotent
                      </span>
                    )}
                  </div>
                </div>
                <p className="text-[11px] text-slate-400 mt-1">{tool.description}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Real-time Trace Stream */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2 font-mono text-xs">
        {traces.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-500">
            <Terminal className="w-8 h-8 mb-2 text-slate-600 stroke-[1.5]" />
            <p className="text-sm font-medium text-slate-400">No protocol traffic recorded yet</p>
            <p className="text-xs text-slate-500 mt-1">
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
                  trace.ok
                    ? 'bg-slate-900/90 border-slate-800/80'
                    : 'bg-rose-950/20 border-rose-800/60'
                }`}
              >
                {/* Header row */}
                <div
                  onClick={() => toggleExpand(trace.id)}
                  className="p-2.5 flex items-center justify-between cursor-pointer hover:bg-slate-800/40 select-none"
                >
                  <div className="flex items-center space-x-2 min-w-0">
                    {trace.ok ? (
                      <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                    ) : (
                      <XCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
                    )}

                    <span className="font-semibold text-slate-200 truncate">
                      {trace.step}
                    </span>

                    <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-800 text-slate-400 border border-slate-700">
                      {trace.method}
                    </span>
                  </div>

                  <div className="flex items-center space-x-2 text-[11px]">
                    <span className="flex items-center text-slate-400 font-mono">
                      <Clock className="w-3 h-3 mr-1 text-slate-500" />
                      {trace.ms}ms
                    </span>
                    <span className="text-[10px] font-mono text-cyan-400/80 px-1.5 py-0.2 rounded bg-cyan-950/60 border border-cyan-900/60">
                      {trace.protocolVersion}
                    </span>
                    {isExpanded ? (
                      <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                    ) : (
                      <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                    )}
                  </div>
                </div>

                {/* Expanded Details */}
                {isExpanded && (
                  <div className="p-3 border-t border-slate-800 bg-slate-950/90 space-y-2.5">
                    {/* Timestamp & Status */}
                    <div className="flex items-center justify-between text-[11px] text-slate-400">
                      <span>Timestamp: {trace.timestamp}</span>
                      <button
                        onClick={() =>
                          copyPayload(
                            trace.id,
                            JSON.stringify({ request: trace.request, response: trace.response }, null, 2)
                          )
                        }
                        className="flex items-center space-x-1 text-cyan-400 hover:text-cyan-300 text-[10px]"
                      >
                        {copiedId === trace.id ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-400" />
                            <span>Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" />
                            <span>Copy Payload</span>
                          </>
                        )}
                      </button>
                    </div>

                    {/* Request JSON */}
                    <div>
                      <div className="text-[10px] uppercase font-bold text-slate-400 mb-1 flex items-center justify-between">
                        <span>JSON-RPC Request</span>
                      </div>
                      <pre className="p-2 rounded bg-slate-900 text-cyan-200 text-[10px] overflow-x-auto max-h-36">
                        {JSON.stringify(trace.request, null, 2)}
                      </pre>
                    </div>

                    {/* Response JSON */}
                    <div>
                      <div className="text-[10px] uppercase font-bold text-slate-400 mb-1 flex items-center justify-between">
                        <span>JSON-RPC Response</span>
                      </div>
                      <pre className="p-2 rounded bg-slate-900 text-emerald-200 text-[10px] overflow-x-auto max-h-36">
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
    </div>
  );
};
