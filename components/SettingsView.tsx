'use client';

import React, { useState } from 'react';
import {
  Settings,
  ShieldCheck,
  Database,
  Radio,
  Cpu,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
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
      <div className="border-b border-border pb-4">
        <h2 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
          Settings & Diagnostics
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          Inspect protocol negotiation status, local storage configuration, and runtime environment.
        </p>
      </div>

      {/* Connectivity & Diagnostic Card */}
      <Card className="border border-border bg-card shadow-xs">
        <CardHeader className="pb-3 border-b border-border bg-stone-50/50 dark:bg-stone-900/50">
          <CardTitle className="text-sm font-semibold flex items-center justify-between">
            <span className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              MCP Server Health Check
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={handleTestConnection}
              disabled={testingConnection}
              className="h-8 text-xs gap-1.5"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${testingConnection ? 'animate-spin' : ''}`} />
              <span>Test Connection</span>
            </Button>
          </CardTitle>
          <CardDescription className="text-xs text-muted-foreground">
            Validates end-to-end Streamable HTTP handshake on POST /mcp and GET /health
          </CardDescription>
        </CardHeader>
        <CardContent className="p-4 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-3 bg-stone-50 dark:bg-stone-900 rounded-md border border-border">
              <span className="text-[11px] text-muted-foreground uppercase font-semibold tracking-wider block">
                Transport
              </span>
              <span className="text-sm font-bold text-foreground">
                Streamable HTTP
              </span>
              <span className="text-[11px] text-muted-foreground block mt-0.5">
                Stateless per-request JSON
              </span>
            </div>

            <div className="p-3 bg-stone-50 dark:bg-stone-900 rounded-md border border-border">
              <span className="text-[11px] text-muted-foreground uppercase font-semibold tracking-wider block">
                Protocol Version
              </span>
              <span className="text-sm font-bold text-blue-600 font-mono">
                2025-11-25
              </span>
              <span className="text-[11px] text-muted-foreground block mt-0.5">
                Model Context Protocol
              </span>
            </div>

            <div className="p-3 bg-stone-50 dark:bg-stone-900 rounded-md border border-border">
              <span className="text-[11px] text-muted-foreground uppercase font-semibold tracking-wider block">
                Database Store
              </span>
              <span className="text-sm font-bold text-foreground">
                SQLite 3 (WAL)
              </span>
              <span className="text-[11px] text-muted-foreground block mt-0.5">
                {taskCount} tasks recorded
              </span>
            </div>
          </div>

          {statusMessage && (
            <div className="p-3 bg-stone-100 dark:bg-stone-800 rounded-md text-xs font-mono text-foreground border border-border">
              {statusMessage}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
