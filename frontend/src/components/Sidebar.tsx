import React from 'react';
import {
  LayoutDashboard,
  ShieldAlert,
  Map,
  Layers,
  Activity,
  Sliders,
  PlayCircle,
  Building2,
  GitCompare,
  Satellite,
  Search,
  HeartHandshake,
  Download,
  Bell,
  HardDrive,
  Cpu,
  Compass,
  FileSpreadsheet
} from 'lucide-react';

interface SidebarProps {
  activeView: string;
  onSelectView: (view: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeView, onSelectView }) => {
  const navSections = [
    {
      title: 'CORE PLATFORM',
      items: [
        { id: 'overview', label: 'Disaster Overview', icon: LayoutDashboard },
        { id: 'dams', label: 'Dam Infrastructure', icon: ShieldAlert },
        { id: 'rivers', label: 'River Basins & DEM', icon: Compass },
        { id: 'datasets', label: 'GIS & Bathymetry', icon: HardDrive },
      ],
    },
    {
      title: 'HYDRODYNAMIC SIMULATION',
      items: [
        { id: 'builder', label: 'Scenario Builder', icon: Sliders, badge: 'What-If' },
        { id: 'monitor', label: 'Solver Execution', icon: PlayCircle, badge: 'Live' },
        { id: 'comparison', label: 'Delft3D vs SPH', icon: GitCompare },
      ],
    },
    {
      title: 'HAZARDS, RISK & IMPACT',
      items: [
        { id: 'floodmap', label: 'Flood Inundation Map', icon: Map, color: 'text-cyan-400' },
        { id: 'riskmap', label: 'Risk Zoning (L0-L3)', icon: Layers, color: 'text-amber-400' },
        { id: 'impact', label: 'Exposure & Loss Analysis', icon: Building2, color: 'text-red-400' },
        { id: 'shelters', label: 'Shelters & Safe Routes', icon: HeartHandshake, color: 'text-emerald-400' },
      ],
    },
    {
      title: 'SATELLITE & DISASTER OPS',
      items: [
        { id: 'satellite', label: 'GEE Sentinel-1 SAR', icon: Satellite, color: 'text-purple-400' },
        { id: 'reverse', label: 'Reverse Flood Match', icon: Search, badge: 'AI' },
        { id: 'export', label: 'Automated GIS Exports', icon: Download },
        { id: 'alerts', label: 'Emergency Alerts (FCM)', icon: Bell, badge: 'Push' },
        { id: 'health', label: 'System Health & Logs', icon: Activity },
      ],
    },
  ];

  return (
    <aside className="w-64 bg-[#0B1120]/95 border-r border-slate-800/80 p-4 flex flex-col justify-between overflow-y-auto hidden md:flex">
      <div className="space-y-6">
        {navSections.map((sec, secIdx) => (
          <div key={secIdx} className="space-y-1">
            <div className="px-3 text-[10px] font-extrabold tracking-wider text-slate-500 uppercase">
              {sec.title}
            </div>
            <div className="space-y-0.5 pt-1">
              {sec.items.map((item) => {
                const Icon = item.icon;
                const isActive = activeView === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => onSelectView(item.id)}
                    className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all duration-200 group ${
                      isActive
                        ? 'bg-gradient-to-r from-cyan-500/20 to-blue-500/10 text-cyan-300 border border-cyan-500/40 shadow-sm shadow-cyan-500/10'
                        : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
                    }`}
                  >
                    <div className="flex items-center space-x-2.5">
                      <Icon
                        className={`w-4 h-4 transition-transform group-hover:scale-110 ${
                          isActive ? 'text-cyan-400' : item.color || 'text-slate-400'
                        }`}
                      />
                      <span>{item.label}</span>
                    </div>

                    {item.badge && (
                      <span
                        className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                          isActive
                            ? 'bg-cyan-400 text-slate-950'
                            : 'bg-slate-800 text-slate-400 border border-slate-700'
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Footer Info Box */}
      <div className="p-3.5 rounded-2xl bg-gradient-to-br from-slate-900/90 to-slate-950/80 border border-slate-800/80 space-y-1.5 mt-4">
        <div className="flex items-center space-x-2 text-[11px] font-bold text-slate-300">
          <ShieldAlert className="w-3.5 h-3.5 text-cyan-400" />
          <span>Active Basin: Morbi Valley</span>
        </div>
        <div className="text-[10px] text-slate-400 leading-tight">
          Machhu-II Dam • D-Flow FM 2D + SPH Particle Hybrid Mesh
        </div>
      </div>
    </aside>
  );
};
