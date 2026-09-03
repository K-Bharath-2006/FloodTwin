import React from 'react';
import { Droplets, MapPin, Gauge, Layers, ShieldCheck, Ruler } from 'lucide-react';
import { Dam } from '../types';

interface DamExplorerViewProps {
  dam: Dam | null;
  dams: Dam[];
  onSelectDam: (damId: string) => void;
}

export const DamExplorerView: React.FC<DamExplorerViewProps> = ({ dam, dams, onSelectDam }) => {
  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Droplets className="w-5 h-5 text-cyan-400" />
            <span>Dam Explorer &amp; Structural Registry</span>
          </h2>
          <p className="text-xs text-slate-400">
            Open hydrological and structural dam geometry attributes from CWC &amp; National Register of Large Dams.
          </p>
        </div>

        {/* Dam Selector */}
        <select
          value={dam?.id}
          onChange={(e) => onSelectDam(e.target.value)}
          className="px-4 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs font-semibold text-white focus:outline-none focus:border-cyan-500"
        >
          {dams.map((d) => (
            <option key={d.id} value={d.id}>
              {d.name} ({d.district}, {d.state})
            </option>
          ))}
        </select>
      </div>

      {/* Dam Detailed Specifications Grid */}
      {dam && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Structural Specs Card */}
          <div className="glass-card p-6 rounded-2xl border border-slate-800 space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Ruler className="w-4 h-4 text-cyan-400" />
              <span>Structural Dimensions</span>
            </h3>
            <div className="space-y-3 text-xs">
              <div className="flex justify-between py-1.5 border-b border-slate-800">
                <span className="text-slate-400">Dam Height</span>
                <span className="font-bold text-slate-200">{dam.height_m} meters</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-800">
                <span className="text-slate-400">Crest Length</span>
                <span className="font-bold text-slate-200">{dam.crest_length_m} meters</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-800">
                <span className="text-slate-400">Dam Type</span>
                <span className="font-bold text-slate-200">{dam.dam_type}</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-800">
                <span className="text-slate-400">Coordinates</span>
                <span className="font-mono text-cyan-400">
                  {dam.latitude.toFixed(4)}°N, {dam.longitude.toFixed(4)}°E
                </span>
              </div>
            </div>
          </div>

          {/* Hydrological Capacity Card */}
          <div className="glass-card p-6 rounded-2xl border border-slate-800 space-y-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Gauge className="w-4 h-4 text-blue-400" />
              <span>Hydrological Capacity</span>
            </h3>
            <div className="space-y-3 text-xs">
              <div className="flex justify-between py-1.5 border-b border-slate-800">
                <span className="text-slate-400">Gross Storage (FRL)</span>
                <span className="font-bold text-slate-200">{dam.capacity_mcm} MCM</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-800">
                <span className="text-slate-400">Full Reservoir Level (FRL)</span>
                <span className="font-bold text-slate-200">{dam.full_reservoir_level_m} m</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-800">
                <span className="text-slate-400">Current Water Level</span>
                <span className="font-bold text-blue-400">{dam.current_water_level_m} m</span>
              </div>
              <div className="flex justify-between py-1.5 border-b border-slate-800">
                <span className="text-slate-400">Design Spillway Capacity</span>
                <span className="font-bold text-slate-200">{dam.spillway_capacity_cumec} m³/s</span>
              </div>
            </div>
          </div>

          {/* Reservoir Visual Profile */}
          <div className="glass-card p-6 rounded-2xl border border-slate-800 space-y-4 flex flex-col justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Layers className="w-4 h-4 text-emerald-400" />
              <span>Reservoir Storage Barometer</span>
            </h3>
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-slate-400">Water Volume:</span>
                <span className="text-cyan-400">
                  {((dam.current_water_level_m / dam.full_reservoir_level_m) * 100).toFixed(1)}% Full
                </span>
              </div>
              <div className="w-full bg-slate-800 h-4 rounded-full overflow-hidden p-0.5 border border-slate-700">
                <div
                  className="bg-gradient-to-r from-blue-600 to-cyan-400 h-full rounded-full transition-all duration-1000"
                  style={{ width: `${(dam.current_water_level_m / dam.full_reservoir_level_m) * 100}%` }}
                ></div>
              </div>
            </div>
            <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 text-[11px] text-slate-400">
              <span className="font-bold text-slate-300">Operator:</span> {dam.properties?.operator || 'Water Resources Department, Gujarat'}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
