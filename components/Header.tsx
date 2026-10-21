'use client';

import React from 'react';
import { Radio, Terminal, Sparkles, CheckCircle2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface HeaderProps {
  isMcpConnected: boolean;
  plannerType: 'rule-based' | 'bedrock';
  taskCount: number;
  openInspector?: () => void;
  openCount?: number;
}

export const Header: React.FC<HeaderProps> = ({
  isMcpConnected,
  plannerType,
  taskCount,
  openInspector,
  openCount = 0,
}) => {
  return (
    <header className="border-b border-border bg-card/90 backdrop-blur sticky top-0 z-40 px-4 md:px-6 py-3 transition-colors">
      <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
        {/* Brand & Context */}
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-md bg-stone-900 text-stone-50 flex items-center justify-center font-bold text-sm tracking-tight shadow-xs">
            TP
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-semibold text-foreground tracking-tight text-base">
                TaskPilot AI
              </span>
              <span className="text-xs px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground font-medium border border-border">
                Alexa+ Simulation
              </span>
            </div>
            <p className="text-xs text-muted-foreground hidden sm:block">
              Self-hosted Streamable HTTP MCP Server & SQLite WAL
            </p>
          </div>
        </div>

        {/* Right Status Badges & Quick Controls */}
        <div className="flex items-center space-x-3">
          {/* Connection Status Indicator */}
          <button
            type="button"
            onClick={openInspector}
            title={isMcpConnected ? "MCP Server Connected (2025-11-25) - Click to inspect" : "MCP Disconnected - Click to open Inspector & reconnect"}
            className="flex items-center space-x-2 text-xs text-muted-foreground bg-secondary/80 hover:bg-secondary px-2.5 py-1 rounded-md border border-border font-medium cursor-pointer transition-colors"
          >
            <span className="flex h-2 w-2 relative">
              {isMcpConnected && (
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              )}
              <span
                className={`relative inline-flex rounded-full h-2 w-2 ${
                  isMcpConnected ? 'bg-emerald-600' : 'bg-rose-500'
                }`}
              ></span>
            </span>
            <span className="text-foreground">
              {isMcpConnected ? 'MCP 2025-11-25' : 'MCP Disconnected'}
            </span>
          </button>

          {/* Quick Inspector Button if handler provided */}
          {openInspector && (
            <Button
              variant="outline"
              size="sm"
              onClick={openInspector}
              className="text-xs h-7 px-2.5 gap-1.5 font-mono text-muted-foreground hover:text-foreground"
            >
              <Terminal className="w-3.5 h-3.5 text-blue-600" />
              <span>Inspector</span>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
};
