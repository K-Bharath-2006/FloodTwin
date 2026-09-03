import React from 'react';
import { HeartHandshake, ShieldCheck, MapPin, Phone, Users, Navigation } from 'lucide-react';
import { Shelter, EvacuationRoute } from '../types';

interface SheltersViewProps {
  shelters: Shelter[];
  routes: EvacuationRoute[];
}

export const SheltersView: React.FC<SheltersViewProps> = ({ shelters, routes }) => {
  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div>
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <HeartHandshake className="w-5 h-5 text-emerald-400" />
          <span>Relief Shelters &amp; Safe Evacuation Corridors</span>
        </h2>
        <p className="text-xs text-slate-400">
          Designated disaster shelters and high-elevation routes avoiding predicted hydrodynamic risk polygons.
        </p>
      </div>

      {/* Shelters Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {shelters.map((s) => (
          <div key={s.id} className="glass-card p-6 rounded-2xl border border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-bold border border-emerald-500/30">
                {s.status}
              </span>
              <span className="text-xs text-slate-400 font-mono">Elev: {s.elevation_m}m</span>
            </div>

            <div className="space-y-1">
              <h3 className="text-sm font-bold text-white">{s.name}</h3>
              <p className="text-[11px] text-slate-400">{s.address}</p>
            </div>

            <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex justify-between items-center text-xs">
              <div className="flex items-center space-x-2 text-slate-300">
                <Users className="w-4 h-4 text-emerald-400" />
                <span>Capacity:</span>
              </div>
              <span className="font-bold text-white">{s.capacity} Persons</span>
            </div>

            <div className="space-y-1.5 text-xs text-slate-300">
              <div className="text-[10px] uppercase font-bold text-slate-500">Facilities:</div>
              <div className="flex flex-wrap gap-1.5">
                {s.facilities.map((f, i) => (
                  <span key={i} className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-[10px] text-slate-300">
                    {f}
                  </span>
                ))}
              </div>
            </div>

            {s.contact_phone && (
              <div className="flex items-center space-x-2 text-xs text-cyan-400 font-mono">
                <Phone className="w-3.5 h-3.5" />
                <span>{s.contact_phone}</span>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Evacuation Corridors Table */}
      <div className="glass-card rounded-2xl border border-slate-800 overflow-hidden">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Navigation className="w-4 h-4 text-cyan-400" />
            <span>Designated Safe Evacuation Corridors</span>
          </h3>
          <span className="text-xs text-slate-400">{routes.length} Corridors</span>
        </div>

        <div className="divide-y divide-slate-800/60 text-xs">
          {routes.map((rt) => (
            <div key={rt.id} className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 hover:bg-slate-800/40 transition">
              <div className="space-y-0.5">
                <div className="font-bold text-white">{rt.name}</div>
                <div className="text-slate-400 text-[11px]">{rt.status_note}</div>
              </div>
              <div className="flex items-center space-x-3 text-xs">
                <span className="text-slate-300 font-mono">{rt.length_km} km</span>
                <span className="px-2.5 py-1 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-semibold">
                  {rt.safe_risk_level_capacity}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
