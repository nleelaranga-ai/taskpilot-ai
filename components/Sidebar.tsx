'use client';

import React from 'react';
import {
  LayoutDashboard,
  Target,
  CheckSquare,
  Terminal,
  Settings,
  ShieldCheck,
  ChevronRight,
} from 'lucide-react';
import { NavTab } from '@/lib/types';
import { cn } from '@/lib/utils';

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
      badge: openTasksCount > 0 ? `${openTasksCount}` : undefined,
    },
    {
      id: 'mission' as NavTab,
      label: 'Daily Mission',
      icon: Target,
      badge: 'AI Plan',
    },
    {
      id: 'tasks' as NavTab,
      label: 'Task Board',
      icon: CheckSquare,
      badge: `${totalTasksCount}`,
    },
    {
      id: 'inspector' as NavTab,
      label: 'MCP Inspector',
      icon: Terminal,
      badge: 'Live',
    },
    {
      id: 'settings' as NavTab,
      label: 'Settings',
      icon: Settings,
    },
  ];

  return (
    <aside className="w-56 border-r border-border bg-[#f8f8f6] dark:bg-stone-900 flex flex-col shrink-0 min-h-screen text-foreground select-none">
      {/* Top Brand Header */}
      <div className="p-4 border-b border-border flex items-center gap-2.5">
        <div className="w-7 h-7 rounded-md bg-stone-900 text-stone-50 flex items-center justify-center font-bold text-xs tracking-tight shadow-xs">
          TP
        </div>
        <div>
          <span className="font-semibold text-sm tracking-tight text-foreground block">
            TaskPilot AI
          </span>
          <span className="text-[11px] text-muted-foreground block -mt-0.5">
            Alexa+ Assistant
          </span>
        </div>
      </div>

      {/* Navigation List */}
      <div className="p-2 space-y-1 flex-1">
        <div className="px-2 pt-2 pb-1.5 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
          Views
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={cn(
                'w-full flex items-center justify-between px-2.5 py-2 rounded-md text-sm transition-all text-left outline-none',
                isActive
                  ? 'bg-card text-foreground font-medium shadow-xs border border-border/80'
                  : 'text-muted-foreground hover:text-foreground hover:bg-stone-200/50 dark:hover:bg-stone-800/50'
              )}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <Icon
                  className={cn(
                    'w-4 h-4 shrink-0',
                    isActive ? 'text-blue-600' : 'text-muted-foreground'
                  )}
                />
                <span className="truncate">{item.label}</span>
              </div>
              {item.badge && (
                <span
                  className={cn(
                    'text-[10px] px-1.5 py-0.2 rounded font-mono',
                    isActive
                      ? 'bg-blue-50 text-blue-700 border border-blue-200'
                      : 'bg-stone-200/70 text-stone-600'
                  )}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Persistent MCP & SQLite Status Footer */}
      <div className="p-3 border-t border-border mt-auto bg-stone-100/60 dark:bg-stone-900/60 text-xs space-y-2">
        <div className="flex items-center justify-between text-muted-foreground">
          <span className="text-[11px] flex items-center gap-1.5 font-medium">
            <span
              className={cn(
                'w-2 h-2 rounded-full inline-block',
                isMcpConnected ? 'bg-emerald-600' : 'bg-rose-500'
              )}
            />
            {isMcpConnected ? 'MCP Online' : 'MCP Offline'}
          </span>
          <span className="text-[10px] font-mono text-muted-foreground">2025-11-25</span>
        </div>
        <div className="text-[11px] text-muted-foreground/90 font-mono truncate">
          db: data/taskpilot.db (WAL)
        </div>
      </div>
    </aside>
  );
};
