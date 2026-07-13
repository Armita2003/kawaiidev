import React from 'react';
import { LayoutGrid, PlusCircle, BarChart3, Settings, Shield, Activity, Bug } from 'lucide-react';

interface SidebarProps {
  activeTab: 'all_projects' | 'add_apk' | 'analytics' | 'settings' | 'bugs';
  onTabChange: (tab: 'all_projects' | 'add_apk' | 'analytics' | 'settings' | 'bugs') => void;
  systemHealth: number;
}

export default function Sidebar({ activeTab, onTabChange, systemHealth }: SidebarProps) {
  return (
    <aside className="w-full md:w-64 bg-surface-container border-b-2 md:border-b-0 md:border-r-2 border-on-background flex flex-col p-4 shrink-0 justify-between">
      <div className="space-y-6">
        {/* Mascot & Title */}
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-primary-container rounded-xl border-2 border-on-background squishy-shadow-sm flex items-center justify-center overflow-hidden">
            <img 
              className="w-full h-full object-cover" 
              src="/images/MainImage.jpg" 
              alt="Mascot Dino" 
            />
          </div>
          <div>
            <h2 className="font-display text-lg font-bold text-secondary leading-none flex items-center gap-1">
              Admin Panel
            </h2>
            <p className="text-[11px] font-sans font-medium text-on-surface-variant">Managing bugs...</p>
          </div>
        </div>

        {/* Navigation Items */}
        <nav className="flex flex-row md:flex-col gap-1 overflow-x-auto md:overflow-x-visible pb-2 md:pb-0 scrollbar-none">
          {/* All Projects */}
          <button
            onClick={() => onTabChange('all_projects')}
            className={`flex items-center gap-3 px-3 py-2 text-sm font-display font-bold rounded-xl border-2 transition-all active-squish whitespace-nowrap ${
              activeTab === 'all_projects'
                ? 'bg-secondary-container text-on-secondary-container border-on-background shadow-[2px_2px_0px_0px_rgba(22,29,31,1)]'
                : 'border-transparent hover:bg-secondary-fixed-dim/40 text-on-surface-variant hover:text-on-surface'
            }`}
          >
            <LayoutGrid className="w-4 h-4 shrink-0" />
            <span>All Projects</span>
          </button>

          {/* Add New APK */}
          <button
            onClick={() => onTabChange('add_apk')}
            className={`flex items-center gap-3 px-3 py-2 text-sm font-display font-bold rounded-xl border-2 transition-all active-squish whitespace-nowrap ${
              activeTab === 'add_apk'
                ? 'bg-secondary-container text-on-secondary-container border-on-background shadow-[2px_2px_0px_0px_rgba(22,29,31,1)]'
                : 'border-transparent hover:bg-secondary-fixed-dim/40 text-on-surface-variant hover:text-on-surface'
            }`}
          >
            <PlusCircle className="w-4 h-4 shrink-0" />
            <span>Add New APK</span>
          </button>

          {/* Analytics */}
          <button
            onClick={() => onTabChange('analytics')}
            className={`flex items-center gap-3 px-3 py-2 text-sm font-display font-bold rounded-xl border-2 transition-all active-squish whitespace-nowrap ${
              activeTab === 'analytics'
                ? 'bg-secondary-container text-on-secondary-container border-on-background shadow-[2px_2px_0px_0px_rgba(22,29,31,1)]'
                : 'border-transparent hover:bg-secondary-fixed-dim/40 text-on-surface-variant hover:text-on-surface'
            }`}
          >
            <BarChart3 className="w-4 h-4 shrink-0" />
            <span>Analytics</span>
          </button>

          {/* Bugs */}
          <button
            onClick={() => onTabChange('bugs')}
            className={`flex items-center gap-3 px-3 py-2 text-sm font-display font-bold rounded-xl border-2 transition-all active-squish whitespace-nowrap ${
              activeTab === 'bugs'
                ? 'bg-secondary-container text-on-secondary-container border-on-background shadow-[2px_2px_0px_0px_rgba(22,29,31,1)]'
                : 'border-transparent hover:bg-secondary-fixed-dim/40 text-on-surface-variant hover:text-on-surface'
            }`}
          >
            <Bug className="w-4 h-4 shrink-0" />
            <span>Bugs</span>
          </button>

          {/* Settings */}
          <button
            onClick={() => onTabChange('settings')}
            className={`flex items-center gap-3 px-3 py-2 text-sm font-display font-bold rounded-xl border-2 transition-all active-squish whitespace-nowrap ${
              activeTab === 'settings'
                ? 'bg-secondary-container text-on-secondary-container border-on-background shadow-[2px_2px_0px_0px_rgba(22,29,31,1)]'
                : 'border-transparent hover:bg-secondary-fixed-dim/40 text-on-surface-variant hover:text-on-surface'
            }`}
          >
            <Settings className="w-4 h-4 shrink-0" />
            <span>Settings</span>
          </button>
        </nav>
      </div>

      {/* Footer Side Card */}
      <div className="mt-4 md:mt-auto space-y-4">
        {/* System Health Block */}
        <div className="p-3 bg-surface-container-highest rounded-xl border-2 border-on-background hidden md:block">
          <div className="flex justify-between items-center mb-1 text-xs font-display font-bold">
            <span className="flex items-center gap-1 text-primary">
              <Activity className="w-3.5 h-3.5" />
              System Health
            </span>
            <span className="font-mono">{systemHealth}%</span>
          </div>
          <div className="w-full bg-surface-container border border-on-background rounded-full h-2.5 overflow-hidden">
            <div 
              className="bg-primary h-full transition-all duration-500" 
              style={{ width: `${systemHealth}%` }}
            ></div>
          </div>
          <p className="text-[10px] mt-2 text-on-surface-variant italic text-center leading-tight">
            "Everything is fine. Probably."
          </p>
        </div>

        {/* Mascot Metadata details */}
        <div className="flex items-center gap-2.5 pt-2 border-t border-on-background/10 md:border-t-0">
          <img 
            className="w-9 h-9 rounded-full border-2 border-on-background shrink-0"
            src="/images/MainImage.jpg" 
            alt="Mascot Avatar" 
          />
          <div>
            <div className="font-display font-bold text-xs">Mascot Avatar</div>
            <div className="text-[9px] text-primary uppercase font-mono font-bold tracking-wider">Super Admin</div>
          </div>
        </div>
      </div>
    </aside>
  );
}
