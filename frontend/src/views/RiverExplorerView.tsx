import React from 'react';
import { Layers, Activity, Compass, Info } from 'lucide-react';
import { River } from '../types';

interface RiverExplorerViewProps {
  rivers: River[];
}

export const RiverExplorerView: React.FC<RiverExplorerViewProps> = ({ rivers }) => {
  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div>
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <Layers className="w-5 h-5 text-cyan-400" />
          <span>River Reach &amp; Valley Hydrodynamics</span>
        </h2>
        <p className="text-xs text-slate-400">
          Downstream channel slope, Manning bed roughness parameters, and geometry network.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {rivers.map((river) => (
          <div key={river.id} className="glass-card p-6 rounded-2xl border border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white">{river.name}</h3>
              <span className="px-2.5 py-1 rounded-full bg-cyan-500/10 text-cyan-400 text-xs font-bold border border-cyan-500/30">
                {river.basin}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
                <div className="text-slate-400 text-[10px] uppercase font-bold">Channel Slope (S₀)</div>
                <div className="text-base font-black text-cyan-400 mt-1">{river.average_slope} m/m</div>
                <div className="text-[10px] text-slate-500 mt-0.5">Gentle valley gradient</div>
              </div>

              <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800">
                <div className="text-slate-400 text-[10px] uppercase font-bold">Manning Roughness (n)</div>
                <div className="text-base font-black text-amber-400 mt-1">{river.manning_n}</div>
                <div className="text-[10px] text-slate-500 mt-0.5">Natural bed with vegetation</div>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 text-xs text-slate-300 space-y-1">
              <div className="font-semibold text-slate-200">Downstream Flow Course:</div>
              <p className="text-[11px] text-slate-400">
                Originates from Jasdan Hills, flows through Morbi urban center, discharging into the Gulf / Little Rann of Kutch.
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
