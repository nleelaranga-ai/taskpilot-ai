'use client';

import React from 'react';
import { Sparkles, Radio, Database, ShieldCheck, Cpu } from 'lucide-react';

interface HeaderProps {
  isMcpConnected: boolean;
  plannerType: 'rule-based' | 'bedrock';
  taskCount: number;
}

export const Header: React.FC<HeaderProps> = ({ isMcpConnected, plannerType, taskCount }) => {
  return (
    <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur-md sticky top-0 z-50 px-4 py-3">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        <div className="flex items-center space-x-3">
          <div className="relative">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <span className="absolute -bottom-1 -right-1 flex h-3 w-3">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${isMcpConnected ? 'bg-cyan-400' : 'bg-rose-400'}`}></span>
              <span className={`relative inline-flex rounded-full h-3 w-3 ${isMcpConnected ? 'bg-cyan-500' : 'bg-rose-500'}`}></span>
            </span>
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-lg font-bold tracking-tight text-white flex items-center gap-2">
                TaskPilot AI
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-cyan-950 text-cyan-300 border border-cyan-800/60">
                  Alexa+ Simulation
                </span>
              </h1>
            </div>
            <p className="text-xs text-slate-400">
              Voice-style task manager powered by Streamable HTTP Model Context Protocol (MCP) & SQLite
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* MCP Protocol Badge */}
          <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-300">
            <Radio className="w-3.5 h-3.5 text-cyan-400" />
            <span className="text-slate-400">MCP Protocol:</span>
            <span className="font-mono text-cyan-300 font-semibold">2025-11-25</span>
          </div>

          {/* Transport Badge */}
          <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-300">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-slate-400">Transport:</span>
            <span className="font-mono text-emerald-300 font-semibold">Streamable HTTP</span>
          </div>

          {/* SQLite WAL Badge */}
          <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-300">
            <Database className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-slate-400">Store:</span>
            <span className="font-mono text-amber-300 font-semibold">SQLite WAL</span>
          </div>

          {/* Active Planner */}
          <div className="flex items-center space-x-1.5 px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-xs text-slate-300">
            <Cpu className="w-3.5 h-3.5 text-indigo-400" />
            <span className="text-slate-400">Planner:</span>
            <span className="font-semibold text-indigo-300 capitalize">{plannerType}</span>
          </div>
        </div>
      </div>
    </header>
  );
};
