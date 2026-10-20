'use client';

import React from 'react';
import { Sparkles, Radio, Database, ShieldCheck, Cpu } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface HeaderProps {
  isMcpConnected: boolean;
  plannerType: 'rule-based' | 'bedrock';
  taskCount: number;
}

export const Header: React.FC<HeaderProps> = ({ isMcpConnected, plannerType, taskCount }) => {
  return (
    <header className="border-b border-border bg-card/60 backdrop-blur-md sticky top-0 z-50 px-4 py-3">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div className="flex items-center space-x-3">
          <div className="relative">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <span className="absolute -bottom-1 -right-1 flex h-3 w-3">
              <span
                className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                  isMcpConnected ? 'bg-cyan-400' : 'bg-rose-400'
                }`}
              ></span>
              <span
                className={`relative inline-flex rounded-full h-3 w-3 ${
                  isMcpConnected ? 'bg-cyan-500' : 'bg-rose-500'
                }`}
              ></span>
            </span>
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-lg font-bold tracking-tight text-foreground flex items-center gap-2">
                TaskPilot AI
                <Badge variant="outline" className="text-cyan-400 border-cyan-800 bg-cyan-950/50">
                  Alexa+ Simulation
                </Badge>
              </h1>
            </div>
            <p className="text-xs text-muted-foreground">
              Voice-style task manager powered by Streamable HTTP Model Context Protocol (MCP) & SQLite
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* MCP Protocol Badge */}
          <Badge variant="secondary" className="gap-1.5 py-1 px-2.5 font-mono">
            <Radio className="w-3.5 h-3.5 text-cyan-400" />
            <span className="text-muted-foreground">MCP Protocol:</span>
            <span className="text-cyan-300 font-bold">2025-11-25</span>
          </Badge>

          {/* Transport Badge */}
          <Badge variant="secondary" className="gap-1.5 py-1 px-2.5 font-mono">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-muted-foreground">Transport:</span>
            <span className="text-emerald-300 font-bold">Streamable HTTP</span>
          </Badge>

          {/* SQLite WAL Badge */}
          <Badge variant="secondary" className="gap-1.5 py-1 px-2.5 font-mono">
            <Database className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-muted-foreground">Store:</span>
            <span className="text-amber-300 font-bold">SQLite WAL</span>
          </Badge>

          {/* Active Planner */}
          <Badge variant="secondary" className="gap-1.5 py-1 px-2.5">
            <Cpu className="w-3.5 h-3.5 text-indigo-400" />
            <span className="text-muted-foreground">Planner:</span>
            <span className="capitalize text-indigo-300 font-semibold">{plannerType}</span>
          </Badge>
        </div>
      </div>
    </header>
  );
};
