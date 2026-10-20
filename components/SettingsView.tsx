'use client';

import React, { useState } from 'react';
import { Settings, ShieldCheck, Database, Radio, Cpu, RefreshCw, CheckCircle2, AlertCircle } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface SettingsViewProps {
  isMcpConnected: boolean;
  plannerType: 'rule-based' | 'bedrock';
  taskCount: number;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  isMcpConnected,
  plannerType,
  taskCount,
}) => {
  const [testingConnection, setTestingConnection] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const handleTestConnection = async () => {
    setTestingConnection(true);
    setStatusMessage(null);
    try {
      const res = await fetch('/api/health');
      const data = await res.json();
      if (res.ok && data.status === 'ok') {
        setStatusMessage(
          `Healthy! Server "${data.mcp?.serverInfo?.name || 'taskpilot-mcp-server'}" running on spec ${
            data.mcp?.protocolVersion || '2025-11-25'
          }.`
        );
      } else {
        setStatusMessage(`Degraded: ${data.details || 'Connection error'}`);
      }
    } catch (err: any) {
      setStatusMessage(`Error: ${err.message}`);
    } finally {
      setTestingConnection(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="border-b border-border pb-5">
        <h1 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
          <Settings className="w-5 h-5 text-cyan-400" />
          System Settings & MCP Architecture
        </h1>
        <p className="text-xs text-muted-foreground mt-1">
          Inspect protocol negotiation status, local storage configuration, and runtime environment.
        </p>
      </div>

      {/* Connectivity & Diagnostic Card */}
      <Card className="border-border bg-card shadow-sm">
        <CardHeader className="pb-3 border-b border-border bg-muted/20">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Radio className="w-4 h-4 text-cyan-400" />
              MCP Server Connection Status
            </CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={handleTestConnection}
              disabled={testingConnection}
              className="text-xs h-7 gap-1.5"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${testingConnection ? 'animate-spin' : ''}`} />
              Test MCP Health
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-4 space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
            <div className="p-3 rounded-lg bg-muted/40 border border-border space-y-1">
              <span className="text-muted-foreground block text-[11px]">Server Endpoint</span>
              <span className="font-mono font-semibold text-foreground">http://127.0.0.1:3333/mcp</span>
            </div>
            <div className="p-3 rounded-lg bg-muted/40 border border-border space-y-1">
              <span className="text-muted-foreground block text-[11px]">Protocol Specification</span>
              <span className="font-mono font-semibold text-cyan-400">2025-11-25 (Streamable HTTP)</span>
            </div>
            <div className="p-3 rounded-lg bg-muted/40 border border-border space-y-1">
              <span className="text-muted-foreground block text-[11px]">Database Engine</span>
              <span className="font-mono font-semibold text-amber-400">SQLite (WAL Journal Mode)</span>
            </div>
            <div className="p-3 rounded-lg bg-muted/40 border border-border space-y-1">
              <span className="text-muted-foreground block text-[11px]">Active Task Store</span>
              <span className="font-mono font-semibold text-foreground">{taskCount} tasks in database</span>
            </div>
          </div>

          {statusMessage && (
            <div className="p-3 rounded-lg bg-cyan-950/40 border border-cyan-800 text-xs text-cyan-200">
              {statusMessage}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Security & DNS Rebinding */}
      <Card className="border-border bg-card shadow-sm">
        <CardHeader className="pb-3 border-b border-border bg-muted/20">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            Security & Origin Enforcement
          </CardTitle>
          <CardDescription className="text-xs">
            Protection against DNS rebinding and unauthorized browser requests.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-4 space-y-2 text-xs text-muted-foreground">
          <p>
            • The self-hosted MCP server binds strictly to <code className="text-foreground">127.0.0.1:3333</code>.
          </p>
          <p>
            • Untrusted <code className="text-foreground">Origin</code> headers are rejected with <code className="text-rose-400">403 Forbidden</code>.
          </p>
          <p>
            • All SQL queries utilize prepared parameterized statements to eliminate SQL injection vectors.
          </p>
          <p>
            • Database files (<code className="text-foreground">data/*.db</code>) and <code className="text-foreground">.env.local</code> are excluded from source control.
          </p>
        </CardContent>
      </Card>

      {/* AI Planner Mode */}
      <Card className="border-border bg-card shadow-sm">
        <CardHeader className="pb-3 border-b border-border bg-muted/20">
          <CardTitle className="text-sm font-semibold flex items-center gap-2">
            <Cpu className="w-4 h-4 text-indigo-400" />
            Active AI Planner
          </CardTitle>
        </CardHeader>
        <CardContent className="p-4 space-y-2 text-xs">
          <div className="flex items-center space-x-2">
            <Badge variant="secondary" className="capitalize text-xs">
              {plannerType} Planner
            </Badge>
            <span className="text-muted-foreground">
              {plannerType === 'bedrock'
                ? 'Using AWS Bedrock Converse API with discovered tool schemas.'
                : '100% Offline deterministic NLP engine (zero API keys required, zero latency overhead).'}
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
