'use client';

import React from 'react';
import {
  LayoutDashboard,
  Target,
  CheckSquare,
  Terminal,
  Settings,
  Sparkles,
  Radio,
  Database,
  ChevronRight,
  ShieldCheck,
} from 'lucide-react';
import { NavTab } from '@/lib/types';
import { Badge } from '@/components/ui/badge';

interface SidebarProps {
  activeTab: NavTab;
  onTabChange: (tab: NavTab) => void;
  openTasksCount: number;
  totalTasksCount: number;
  isMcpConnected: boolean;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onTabChange,
  openTasksCount,
  totalTasksCount,
  isMcpConnected,
}) => {
  const navItems = [
    {
      id: 'workspace' as NavTab,
      label: 'Workspace',
      icon: LayoutDashboard,
      description: 'Overview & Quick Input',
    },
    {
      id: 'mission' as NavTab,
      label: 'Daily Mission',
      icon: Target,
      badge: 'Signature',
      description: 'AI Autonomous Planner',
    },
    {
      id: 'tasks' as NavTab,
      label: 'Task Board',
      icon: CheckSquare,
      badge: `${openTasksCount}`,
      description: 'Kanban & Priority Grid',
    },
    {
      id: 'inspector' as NavTab,
      label: 'MCP Inspector',
      icon: Terminal,
      description: 'JSON-RPC 2.0 Protocol Log',
    },
    {
      id: 'settings' as NavTab,
      label: 'Settings',
      icon: Settings,
      description: 'Diagnostics & Audio',
    },
  ];

  return (
    <aside className="w-64 border-r border-border bg-card/90 flex flex-col justify-between h-screen sticky top-0 select-none shadow-sm z-30">
      <div>
        {/* Brand Header */}
        <div className="p-4 border-b border-border flex items-center space-x-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center text-white shadow-md shadow-cyan-500/20">
            <Sparkles className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-1.5">
              <span className="font-bold text-sm tracking-tight text-foreground truncate">
                TaskPilot AI
              </span>
              <span
                className={`w-2 h-2 rounded-full ${
                  isMcpConnected ? 'bg-emerald-400' : 'bg-rose-400'
                }`}
                title={isMcpConnected ? 'MCP Server Connected' : 'MCP Disconnected'}
              />
            </div>
            <p className="text-[11px] text-muted-foreground truncate">
              Alexa+ Voice & MCP Workspace
            </p>
          </div>
        </div>

        {/* Navigation Section */}
        <div className="p-3 space-y-1">
          <p className="px-3 py-1.5 text-[10px] uppercase font-bold tracking-wider text-muted-foreground">
            Platform
          </p>

          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                }`}
              >
                <div className="flex items-center space-x-2.5 min-w-0">
                  <Icon
                    className={`w-4 h-4 shrink-0 ${
                      isActive ? 'text-primary-foreground' : 'text-muted-foreground'
                    }`}
                  />
                  <div className="text-left truncate">
                    <span className="block leading-tight">{item.label}</span>
                  </div>
                </div>

                {item.badge && (
                  <Badge
                    variant={isActive ? 'outline' : 'secondary'}
                    className={`text-[10px] px-1.5 py-0 h-4 ${
                      isActive
                        ? 'border-primary-foreground/40 text-primary-foreground bg-primary-foreground/10'
                        : ''
                    }`}
                  >
                    {item.badge}
                  </Badge>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Protocol Footprint Status Card */}
      <div className="p-3 border-t border-border bg-card">
        <div className="p-2.5 rounded-lg bg-muted/40 border border-border space-y-2 text-[11px]">
          <div className="flex items-center justify-between font-mono">
            <span className="text-muted-foreground flex items-center gap-1">
              <Radio className="w-3 h-3 text-cyan-400" />
              MCP Spec
            </span>
            <span className="font-semibold text-cyan-400">2025-11-25</span>
          </div>
          <div className="flex items-center justify-between font-mono">
            <span className="text-muted-foreground flex items-center gap-1">
              <ShieldCheck className="w-3 h-3 text-emerald-400" />
              Transport
            </span>
            <span className="font-semibold text-emerald-400">Streamable</span>
          </div>
          <div className="flex items-center justify-between font-mono">
            <span className="text-muted-foreground flex items-center gap-1">
              <Database className="w-3 h-3 text-amber-400" />
              SQLite WAL
            </span>
            <span className="font-semibold text-amber-400">{totalTasksCount} tasks</span>
          </div>
        </div>
      </div>
    </aside>
  );
};
