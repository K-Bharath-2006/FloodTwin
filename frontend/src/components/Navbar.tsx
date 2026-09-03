import React from 'react';
import {
  Waves,
  Shield,
  Activity,
  Bell,
  Layers,
  Database,
  Satellite,
  User,
  ExternalLink,
  Cpu
} from 'lucide-react';
import { SystemHealth } from '../types';

interface NavbarProps {
  health: SystemHealth | null;
  onSelectView: (view: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ health, onSelectView }) => {
  const isHealthy = health?.status === 'HEALTHY' || health?.status === 'healthy';

  return (
    <header className="h-16 bg-[#0B1120]/90 border-b border-slate-800/80 backdrop-blur-xl px-6 flex items-center justify-between sticky top-0 z-50">
      {/* Brand & Platform Identity */}
      <div className="flex items-center space-x-3 cursor-pointer" onClick={() => onSelectView('overview')}>
        <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-600 via-blue-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-cyan-500/25 border border-cyan-400/30">
          <Waves className="w-6 h-6 text-white animate-pulse" />
        </div>
        <div>
          <div className="flex items-center space-x-2">
            <h1 className="text-base font-black tracking-tight text-white flex items-center gap-1.5">
              <span>HYDRO</span>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-400 font-extrabold">BREACH</span>
            </h1>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-cyan-500/10 text-cyan-300 border border-cyan-500/30 tracking-wider">
              SIH 2026
            </span>
          </div>
          <p className="text-[11px] text-slate-400 font-medium">
            Dam-Break Hydrodynamic Simulation &amp; Early Warning System
          </p>
        </div>
      </div>

      {/* Center Live Telemetry Status Pills */}
      <div className="hidden lg:flex items-center space-x-3 text-xs">
        {/* PostGIS Database Engine Pill */}
        <div className="flex items-center space-x-2 px-3 py-1.5 rounded-xl bg-slate-900/80 border border-slate-800">
          <Database className="w-3.5 h-3.5 text-cyan-400" />
          <span className="text-slate-400">PostGIS:</span>
          <span className="font-semibold text-emerald-400 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
            Active
          </span>
        </div>

        {/* Solver Pipeline Pill */}
        <div className="flex items-center space-x-2 px-3 py-1.5 rounded-xl bg-slate-900/80 border border-slate-800">
          <Cpu className="w-3.5 h-3.5 text-indigo-400" />
          <span className="text-slate-400">Solvers:</span>
          <span className="font-semibold text-slate-200">Delft3D-FM + SPH</span>
        </div>

        {/* GEE Satellite Connector Pill */}
        <div className="flex items-center space-x-2 px-3 py-1.5 rounded-xl bg-slate-900/80 border border-slate-800">
          <Satellite className="w-3.5 h-3.5 text-purple-400" />
          <span className="text-slate-400">GEE SAR:</span>
          <span className="font-semibold text-purple-300">Sentinel-1 GRD</span>
        </div>
      </div>

      {/* Right User & Quick Action Buttons */}
      <div className="flex items-center space-x-3">
        {/* Alerts Badge */}
        <button
          onClick={() => onSelectView('alerts')}
          className="p-2.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-800 transition relative"
          title="Emergency Alerts"
        >
          <Bell className="w-4 h-4" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-red-500 shadow-sm shadow-red-500/50" />
        </button>

        {/* System Health */}
        <button
          onClick={() => onSelectView('health')}
          className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-800 text-xs font-semibold text-slate-300 hover:text-white transition"
        >
          <Activity className="w-3.5 h-3.5 text-emerald-400" />
          <span>Health</span>
        </button>

        {/* User Account / Google Sign-in */}
        <div className="flex items-center space-x-2 pl-2 border-l border-slate-800">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 flex items-center justify-center text-cyan-400 font-bold text-xs shadow-inner">
            DM
          </div>
          <div className="hidden sm:block text-left">
            <div className="text-xs font-bold text-slate-200">Disaster Modeller</div>
            <div className="text-[10px] text-cyan-400 font-medium">NDMA / CWC Certified</div>
          </div>
        </div>
      </div>
    </header>
  );
};
