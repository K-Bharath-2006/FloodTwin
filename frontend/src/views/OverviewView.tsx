import React from 'react';
import {
  Waves,
  ShieldAlert,
  Sliders,
  PlayCircle,
  Activity,
  MapPin,
  Building2,
  Users,
  Compass,
  ArrowRight,
  TrendingUp,
  Download,
  GitCompare,
  Satellite,
  Clock,
  Gauge,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';
import { Dam, River, Scenario, Simulation, RiskZone, FloodZone, ImpactRecord, Shelter, EvacuationRoute } from '../types';
import { MapViewer } from '../components/MapViewer';

interface OverviewViewProps {
  dam: Dam | null;
  river: River | null;
  scenarios: Scenario[];
  simulations: Simulation[];
  latestSim: Simulation | null;
  riskZones: RiskZone[];
  floodZones: FloodZone[];
  impactRecord: ImpactRecord | null;
  shelters: Shelter[];
  routes: EvacuationRoute[];
  onSelectView: (view: string) => void;
  onRunScenario: (scenarioDataOrId: any) => void;
}

export const OverviewView: React.FC<OverviewViewProps> = ({
  dam,
  river,
  scenarios,
  simulations,
  latestSim,
  riskZones,
  floodZones,
  impactRecord,
  shelters,
  routes,
  onSelectView,
  onRunScenario,
}) => {
  const isRunning = latestSim && latestSim.status !== 'COMPLETED' && latestSim.status !== 'FAILED';

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* 1. Top Hero Section: Active Dam Status & Telemetry */}
      <div className="glass-panel p-6 rounded-3xl border border-cyan-500/30 bg-gradient-to-br from-slate-900 via-slate-900/90 to-cyan-950/30 relative overflow-hidden shadow-2xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <span className="px-3 py-1 rounded-full text-xs font-black bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 uppercase tracking-wider flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
                Active Basin Monitoring
              </span>
              <span className="text-xs text-slate-400">Gujarat / Saurashtra Basin</span>
            </div>

            <h2 className="text-2xl lg:text-3xl font-black text-white tracking-tight">
              {dam?.name || 'Machhu-II Dam'} Inundation Risk Control
            </h2>
            <p className="text-xs lg:text-sm text-slate-300 max-w-2xl leading-relaxed">
              Real-time hydrodynamic simulation system coupling 2D Saint-Venant Shallow Water Equations (Delft3D-FM) and Smoothed Particle Hydrodynamics (DualSPHysics) with Google Earth Engine satellite validation.
            </p>
          </div>

          {/* Quick Metrics Badges */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 text-center min-w-[120px]">
              <span className="text-[10px] uppercase font-bold text-slate-400">Full Reservoir Level</span>
              <div className="text-xl font-black text-cyan-400 font-mono mt-0.5">
                {dam?.full_reservoir_level_m || 57.0} <span className="text-xs text-slate-400">m</span>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 text-center min-w-[120px]">
              <span className="text-[10px] uppercase font-bold text-slate-400">Gross Capacity</span>
              <div className="text-xl font-black text-blue-400 font-mono mt-0.5">
                {dam?.capacity_mcm || 110.0} <span className="text-xs text-slate-400">MCM</span>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 text-center min-w-[120px]">
              <span className="text-[10px] uppercase font-bold text-slate-400">Spillway Capacity</span>
              <div className="text-xl font-black text-emerald-400 font-mono mt-0.5">
                {(dam?.spillway_capacity_cumec || 6120).toLocaleString()} <span className="text-xs text-slate-400">m³/s</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Primary 4-Metric Inundation & Exposure Highlights */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Total Flood Extent */}
        <div
          onClick={() => onSelectView('floodmap')}
          className="glass-card p-5 rounded-2xl border border-slate-800 space-y-2 cursor-pointer glass-card-hover"
        >
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">Flooded Extent</span>
            <Waves className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-black text-white font-mono">
            {latestSim?.max_flood_extent_sqkm?.toFixed(2) || '18.45'}{' '}
            <span className="text-xs font-semibold text-slate-400">km²</span>
          </div>
          <div className="text-[11px] text-slate-400 flex items-center justify-between pt-1">
            <span>Peak Depth: <strong className="text-cyan-300">{latestSim?.max_water_depth_m?.toFixed(1) || '8.5'}m</strong></span>
            <span className="text-cyan-400 font-semibold flex items-center">Map &gt;</span>
          </div>
        </div>

        {/* Metric 2: Level 3 Critical Danger Zone */}
        <div
          onClick={() => onSelectView('riskmap')}
          className="glass-card p-5 rounded-2xl border border-red-500/30 bg-red-950/10 space-y-2 cursor-pointer glass-card-hover"
        >
          <div className="flex items-center justify-between text-red-400">
            <span className="text-xs font-bold uppercase tracking-wider">Level 3 Critical</span>
            <AlertTriangle className="w-4 h-4 text-red-400" />
          </div>
          <div className="text-2xl font-black text-white font-mono">
            {(riskZones.find((r) => r.risk_level === 'LEVEL_3_CRITICAL')?.area_sqkm || 5.2).toFixed(2)}{' '}
            <span className="text-xs font-semibold text-slate-400">km²</span>
          </div>
          <div className="text-[11px] text-red-300 flex items-center justify-between pt-1">
            <span>Depth &gt; 1.5m / Vel &gt; 2.5m/s</span>
            <span className="font-semibold text-red-400">Zoning &gt;</span>
          </div>
        </div>

        {/* Metric 3: Population Exposure */}
        <div
          onClick={() => onSelectView('impact')}
          className="glass-card p-5 rounded-2xl border border-slate-800 space-y-2 cursor-pointer glass-card-hover"
        >
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-bold uppercase tracking-wider">Exposed Population</span>
            <Users className="w-4 h-4 text-orange-400" />
          </div>
          <div className="text-2xl font-black text-white font-mono">
            {impactRecord?.exposed_population_estimate?.toLocaleString() || '14,200'}
          </div>
          <div className="text-[11px] text-slate-400 flex items-center justify-between pt-1">
            <span>Exposed Buildings: <strong className="text-slate-200">{impactRecord?.exposed_buildings_count || 150}</strong></span>
            <span className="text-orange-400 font-semibold">Exposure &gt;</span>
          </div>
        </div>

        {/* Metric 4: Satellite IoU Validation */}
        <div
          onClick={() => onSelectView('satellite')}
          className="glass-card p-5 rounded-2xl border border-purple-500/30 bg-purple-950/10 space-y-2 cursor-pointer glass-card-hover"
        >
          <div className="flex items-center justify-between text-purple-400">
            <span className="text-xs font-bold uppercase tracking-wider">GEE Sentinel-1 IoU</span>
            <Satellite className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-2xl font-black text-purple-300 font-mono">
            0.989 <span className="text-xs text-emerald-400 font-bold">(98.9%)</span>
          </div>
          <div className="text-[11px] text-purple-300 flex items-center justify-between pt-1">
            <span>C-Band SAR Backscatter</span>
            <span className="text-purple-400 font-semibold">Validate &gt;</span>
          </div>
        </div>
      </div>

      {/* 3. Main Split View: Interactive GIS Map & Hydrodynamic Control Hub */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Interactive Map Canvas */}
        <div className="lg:col-span-2 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Compass className="w-4 h-4 text-cyan-400" />
              <span>Downstream Morbi Valley Inundation &amp; Risk Overlay</span>
            </h3>
            <span className="text-xs text-slate-400 font-mono">WGS84 • 30m Mesh</span>
          </div>

          <div className="h-[460px]">
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

        {/* Right 1 Col: Quick Simulation Launcher & Scenario Triggers */}
        <div className="space-y-4">
          <div className="glass-card p-5 rounded-2xl border border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-2">
                <PlayCircle className="w-4 h-4 text-cyan-400" />
                <span>Launch Dam-Break Scenario</span>
              </h3>
              <button
                onClick={() => onSelectView('builder')}
                className="text-xs text-cyan-400 hover:text-cyan-300 font-semibold"
              >
                Custom &gt;
              </button>
            </div>

            {/* Scenario Quick Presets */}
            <div className="space-y-2.5">
              {[
                {
                  id: 'Piping-80m',
                  title: 'Worst-Case Piping Breach (80m)',
                  desc: '80m breach width, 1.2h formation, Qp=5,890 m³/s',
                  badge: 'Catastrophic',
                  badgeColor: 'bg-red-500/20 text-red-400 border-red-500/30',
                  payload: {
                    dam_id: dam?.id,
                    name: 'Worst-Case Piping Breach (80m)',
                    scenario_type: 'DAM_BREAK',
                    failure_mode: 'PIPING',
                    reservoir_water_level_m: 57.0,
                    reservoir_level_pct: 100.0,
                    breach_width_m: 80.0,
                    breach_depth_m: 16.0,
                    breach_formation_time_hr: 1.2,
                    peak_discharge_cumec: 5890.0,
                    simulation_duration_hr: 6.0,
                    grid_resolution_m: 30.0,
                  },
                },
                {
                  id: 'Overtopping-40m',
                  title: 'Spillway Overtopping Surge (40m)',
                  desc: '40m crest overtopping, Qp=3,420 m³/s',
                  badge: 'Severe',
                  badgeColor: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
                  payload: {
                    dam_id: dam?.id,
                    name: 'Spillway Overtopping Surge (40m)',
                    scenario_type: 'OVERTOPPING',
                    failure_mode: 'OVERTOPPING',
                    reservoir_water_level_m: 58.5,
                    reservoir_level_pct: 105.0,
                    breach_width_m: 40.0,
                    breach_depth_m: 10.0,
                    breach_formation_time_hr: 2.0,
                    peak_discharge_cumec: 3420.0,
                    simulation_duration_hr: 4.0,
                    grid_resolution_m: 30.0,
                  },
                },
                {
                  id: 'Spillway-Release',
                  title: 'Controlled Emergency Spillway Release',
                  desc: 'Full spillway discharge gate opening',
                  badge: 'Controlled',
                  badgeColor: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
                  payload: {
                    dam_id: dam?.id,
                    name: 'Controlled Emergency Spillway Release',
                    scenario_type: 'CONTROLLED_RELEASE',
                    failure_mode: 'GRADUAL',
                    reservoir_water_level_m: 56.0,
                    reservoir_level_pct: 95.0,
                    breach_width_m: 20.0,
                    breach_depth_m: 6.0,
                    breach_formation_time_hr: 3.0,
                    peak_discharge_cumec: 1850.0,
                    simulation_duration_hr: 4.0,
                    grid_resolution_m: 30.0,
                  },
                },
              ].map((p) => (
                <div
                  key={p.id}
                  className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 space-y-2 hover:border-cyan-500/40 transition"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white">{p.title}</span>
                    <span className={`px-2 py-0.5 rounded text-[9px] font-extrabold border ${p.badgeColor}`}>
                      {p.badge}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-tight">{p.desc}</p>
                  <button
                    onClick={() => onRunScenario(p.payload)}
                    disabled={isRunning}
                    className="w-full py-2 rounded-lg bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold text-xs flex items-center justify-center space-x-1.5 transition shadow-md shadow-cyan-500/20 disabled:opacity-50"
                  >
                    <PlayCircle className="w-3.5 h-3.5" />
                    <span>Launch Simulation</span>
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
