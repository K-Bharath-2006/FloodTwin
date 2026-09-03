import React, { useState, useEffect } from 'react';
import {
  Map,
  Droplets,
  Gauge,
  Compass,
  Layers,
  Play,
  Pause,
  RotateCcw,
  Clock,
  Sparkles,
  Maximize2
} from 'lucide-react';
import { Dam, River, FloodZone, RiskZone, Shelter, EvacuationRoute, Simulation } from '../types';
import { MapViewer } from '../components/MapViewer';

interface FloodMapViewProps {
  dam: Dam | null;
  river: River | null;
  floodZones: FloodZone[];
  riskZones: RiskZone[];
  shelters: Shelter[];
  routes: EvacuationRoute[];
  simulation: Simulation | null;
}

export const FloodMapView: React.FC<FloodMapViewProps> = ({
  dam,
  river,
  floodZones,
  riskZones,
  shelters,
  routes,
  simulation,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTimeStep, setCurrentTimeStep] = useState(0); // Index in floodZones

  // Temporal animation playback
  useEffect(() => {
    let timer: any;
    if (isPlaying && floodZones.length > 0) {
      timer = setInterval(() => {
        setCurrentTimeStep((prev) => (prev + 1) % floodZones.length);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isPlaying, floodZones]);

  const activeZone = floodZones[currentTimeStep] || floodZones[0];

  return (
    <div className="p-6 space-y-4 max-w-7xl mx-auto h-[calc(100vh-5rem)] flex flex-col">
      {/* Top Header Controls & Telemetry */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Map className="w-5 h-5 text-cyan-400" />
            <span>Hydrodynamic Inundation &amp; Wave Progression Map</span>
          </h2>
          <p className="text-xs text-slate-400">
            Temporal propagation of dam breach flood wave across downstream Morbi floodplain terrain.
          </p>
        </div>

        {/* Live Hydrodynamic Telemetry Badges */}
        <div className="flex flex-wrap items-center gap-2.5 text-xs font-semibold">
          <div className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300">
            Max Extent:{' '}
            <strong className="text-cyan-400 font-mono">
              {simulation?.max_flood_extent_sqkm?.toFixed(2) || '18.45'} km²
            </strong>
          </div>
          <div className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300">
            Peak Depth:{' '}
            <strong className="text-blue-400 font-mono">
              {simulation?.max_water_depth_m?.toFixed(1) || '8.5'} m
            </strong>
          </div>
          <div className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-300">
            Peak Velocity:{' '}
            <strong className="text-emerald-400 font-mono">
              {simulation?.max_flow_velocity_ms?.toFixed(1) || '5.2'} m/s
            </strong>
          </div>
        </div>
      </div>

      {/* Temporal Wave Progression Player Bar */}
      <div className="glass-card px-5 py-3 rounded-2xl border border-slate-800 flex items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className="w-9 h-9 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-white flex items-center justify-center transition shadow-md shadow-cyan-500/25"
          >
            {isPlaying ? <Pause className="w-4 h-4 fill-white" /> : <Play className="w-4 h-4 fill-white" />}
          </button>

          <button
            onClick={() => {
              setIsPlaying(false);
              setCurrentTimeStep(0);
            }}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
            title="Reset Animation"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>

          <div className="space-y-0.5">
            <span className="text-[10px] text-slate-400 uppercase font-bold">Wave Arrival Time</span>
            <div className="text-xs font-black text-cyan-300 font-mono">
              T + {(activeZone?.time_step_min || 0).toFixed(0)} min ({(activeZone?.time_step_min || 0) / 60}h)
            </div>
          </div>
        </div>

        {/* Timeline Slider */}
        <div className="flex-1 max-w-md hidden sm:flex items-center space-x-3">
          <span className="text-[10px] text-slate-500 font-mono">0h</span>
          <input
            type="range"
            min="0"
            max={Math.max(0, floodZones.length - 1)}
            value={currentTimeStep}
            onChange={(e) => {
              setIsPlaying(false);
              setCurrentTimeStep(parseInt(e.target.value));
            }}
            className="w-full accent-cyan-400 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
          />
          <span className="text-[10px] text-slate-500 font-mono">6h</span>
        </div>

        <div className="text-right">
          <span className="text-[10px] text-slate-400 uppercase font-bold">Instantaneous Extent</span>
          <div className="text-xs font-bold text-white font-mono">
            {(activeZone?.area_sqkm || 14.5).toFixed(2)} km²
          </div>
        </div>
      </div>

      {/* Full-Height Interactive GIS Canvas */}
      <div className="flex-1 w-full min-h-[440px]">
        <MapViewer
          dam={dam}
          river={river}
          floodZones={floodZones}
          riskZones={riskZones}
          shelters={shelters}
          routes={routes}
          showDepthContours={true}
          showRiskZones={true}
        />
      </div>
    </div>
  );
};
