import React, { useState } from 'react';
import {
  Sliders,
  Play,
  Info,
  Sparkles,
  Gauge,
  Activity,
  Cpu,
  Layers,
  Clock,
  TrendingUp,
  Droplets,
  ShieldAlert
} from 'lucide-react';
import { Dam, Scenario } from '../types';

interface ScenarioBuilderViewProps {
  dam: Dam | null;
  onRunScenario: (scenarioData: Partial<Scenario>) => void;
}

export const ScenarioBuilderView: React.FC<ScenarioBuilderViewProps> = ({ dam, onRunScenario }) => {
  const [scenarioType, setScenarioType] = useState<'DAM_BREAK' | 'RIVER_BLOCKAGE' | 'CONTROLLED_RELEASE' | 'OVERTOPPING'>('DAM_BREAK');
  const [failureMode, setFailureMode] = useState<'PIPING' | 'OVERTOPPING' | 'INSTANTANEOUS' | 'GRADUAL'>('PIPING');
  const [breachWidth, setBreachWidth] = useState<number>(75);
  const [breachDepth, setBreachDepth] = useState<number>(15);
  const [reservoirLevelPct, setReservoirLevelPct] = useState<number>(100);
  const [formationTime, setFormationTime] = useState<number>(1.2);
  const [duration, setDuration] = useState<number>(6.0);
  const [meshRes, setMeshRes] = useState<number>(30.0);
  const [solverType, setSolverType] = useState<'HYBRID_COMPARISON' | 'DELFT3D_FM' | 'DUALSPHYSICS'>('HYBRID_COMPARISON');

  // Real-time Peak Discharge Qp (Froehlich 1995 Formulation: Qp = 0.607 * Vw^0.295 * hw^1.24)
  const capacityMcm = dam?.capacity_mcm || 110.0;
  const vw = (capacityMcm * (reservoirLevelPct / 100)) * 1e6;
  const calculatedQp = Math.round(0.607 * Math.pow(vw, 0.295) * Math.pow(breachDepth, 1.24));

  // Generate dynamic SVG Hydrograph Curve coordinates:
  // Points: (0, 0) -> Rising to (formationTime, calculatedQp) -> Receding smoothly to (duration, 0.1 * Qp)
  const svgWidth = 320;
  const svgHeight = 120;
  const peakX = Math.min(280, Math.max(40, (formationTime / duration) * svgWidth));
  const peakY = 20; // Near top of SVG
  const baseY = 105;

  const hydrographPath = `M 15 ${baseY} Q ${peakX * 0.6} ${baseY - 10}, ${peakX} ${peakY} T ${svgWidth - 15} ${baseY - 5}`;

  const handleLaunch = () => {
    onRunScenario({
      dam_id: dam?.id,
      name: `${scenarioType.replace('_', ' ')} (${breachWidth}m Breach, ${reservoirLevelPct}% FRL)`,
      description: `What-If Hydrodynamic simulation with ${breachWidth}m breach width over ${formationTime}h formation time.`,
      scenario_type: scenarioType,
      failure_mode: failureMode,
      reservoir_water_level_m: (dam?.full_reservoir_level_m || 57.0) * (reservoirLevelPct / 100),
      reservoir_level_pct: reservoirLevelPct,
      breach_width_m: breachWidth,
      breach_depth_m: breachDepth,
      breach_formation_time_hr: formationTime,
      peak_discharge_cumec: calculatedQp,
      simulation_duration_hr: duration,
      grid_resolution_m: meshRes,
    });
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div>
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <Sliders className="w-5 h-5 text-cyan-400" />
          <span>Interactive Hydrodynamic Scenario Builder</span>
        </h2>
        <p className="text-xs text-slate-400">
          Configure physical dam breach dimensions, reservoir storage elevation, and hydraulic wave propagation solvers.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Parameter Sliders & Failure Configurations */}
        <div className="lg:col-span-2 glass-card p-6 rounded-3xl border border-slate-800 space-y-6">
          {/* Scenario Category */}
          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Scenario Failure Category
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { id: 'DAM_BREAK', label: 'Dam Break (Cat A)', desc: 'Full Structural Piping' },
                { id: 'OVERTOPPING', label: 'Overtopping (Cat B)', desc: 'Hydraulic Crest Surge' },
                { id: 'CONTROLLED_RELEASE', label: 'Spillway Release', desc: 'Emergency Gates' },
                { id: 'RIVER_BLOCKAGE', label: 'River Blockage', desc: 'Landslide Damming' },
              ].map((t) => (
                <button
                  key={t.id}
                  onClick={() => setScenarioType(t.id as any)}
                  className={`p-3 rounded-2xl text-xs font-semibold border text-left transition ${
                    scenarioType === t.id
                      ? 'bg-cyan-500/20 border-cyan-500 text-cyan-300 shadow-md shadow-cyan-500/20'
                      : 'bg-slate-900/80 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <div className="font-bold">{t.label}</div>
                  <div className="text-[10px] text-slate-500 mt-0.5">{t.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Breach Dimensions Sliders */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
            {/* Breach Width Slider */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-slate-300">Average Breach Width (B_avg)</span>
                <span className="font-mono font-bold text-cyan-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                  {breachWidth} meters
                </span>
              </div>
              <input
                type="range"
                min="10"
                max="200"
                step="5"
                value={breachWidth}
                onChange={(e) => setBreachWidth(parseInt(e.target.value))}
                className="w-full accent-cyan-400 h-2 bg-slate-800 rounded-lg cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-500">
                <span>10m (Localized)</span>
                <span>200m (Total Collapse)</span>
              </div>
            </div>

            {/* Breach Depth Slider */}
            <div className="space-y-2">
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-slate-300">Breach Depth (H_w)</span>
                <span className="font-mono font-bold text-cyan-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                  {breachDepth} meters
                </span>
              </div>
              <input
                type="range"
                min="5"
                max={dam?.height_m || 24}
                step="1"
                value={breachDepth}
                onChange={(e) => setBreachDepth(parseInt(e.target.value))}
                className="w-full accent-cyan-400 h-2 bg-slate-800 rounded-lg cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-500">
                <span>5m (Top Invert)</span>
                <span>{dam?.height_m || 24}m (Bed Level)</span>
              </div>
            </div>
          </div>

          {/* Reservoir Level Pct */}
          <div className="space-y-2">
            <div className="flex justify-between text-xs font-semibold">
              <span className="text-slate-300">Reservoir Water Elevation (% of FRL)</span>
              <span className="font-mono font-bold text-cyan-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                {reservoirLevelPct}% ({(dam?.full_reservoir_level_m || 57.0) * (reservoirLevelPct / 100)}m)
              </span>
            </div>
            <input
              type="range"
              min="50"
              max="115"
              step="1"
              value={reservoirLevelPct}
              onChange={(e) => setReservoirLevelPct(parseInt(e.target.value))}
              className="w-full accent-cyan-400 h-2 bg-slate-800 rounded-lg cursor-pointer"
            />
          </div>

          {/* Formation Time & Mesh Grid Resolution */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Formation Time (t_f)</label>
              <select
                value={formationTime}
                onChange={(e) => setFormationTime(parseFloat(e.target.value))}
                className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs font-semibold text-white focus:outline-none"
              >
                <option value={0.5}>0.5 Hours (Rapid Sudden Failure)</option>
                <option value={1.0}>1.0 Hours (Standard)</option>
                <option value={1.2}>1.2 Hours (Calibrated Baseline)</option>
                <option value={2.0}>2.0 Hours (Gradual Erosion)</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Simulation Reach Duration</label>
              <select
                value={duration}
                onChange={(e) => setDuration(parseFloat(e.target.value))}
                className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs font-semibold text-white focus:outline-none"
              >
                <option value={2.0}>2.0 Hours (Near-Dam Zone)</option>
                <option value={4.0}>4.0 Hours (Morbi City)</option>
                <option value={6.0}>6.0 Hours (Full Downstream Valley)</option>
                <option value={12.0}>12.0 Hours (Extended Basin Reach)</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Spatial Mesh Resolution</label>
              <select
                value={meshRes}
                onChange={(e) => setMeshRes(parseFloat(e.target.value))}
                className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs font-semibold text-white focus:outline-none"
              >
                <option value={15.0}>15m (Ultra-High Resolution)</option>
                <option value={30.0}>30m (Standard DEM Cartesian)</option>
                <option value={60.0}>60m (Fast Screening)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Right Col: Live Hydrograph Graph & Solver Launch Card */}
        <div className="glass-card p-6 rounded-3xl border border-cyan-500/30 space-y-6 flex flex-col justify-between bg-gradient-to-br from-slate-900 to-cyan-950/30">
          <div className="space-y-4">
            <div className="flex items-center space-x-2 text-cyan-400">
              <Gauge className="w-5 h-5" />
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                Real-Time Breach Hydrograph (Qp)
              </h3>
            </div>

            {/* Live Peak Discharge Display */}
            <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-1 text-center">
              <div className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                Computed Peak Outflow ($Q_p$)
              </div>
              <div className="text-3xl font-black text-cyan-400 tracking-tight font-mono">
                {calculatedQp.toLocaleString()} <span className="text-sm font-semibold text-slate-300">m³/s</span>
              </div>
              <div className="text-[10px] text-slate-500 font-medium">
                Empirical Formulation: Froehlich (1995b)
              </div>
            </div>

            {/* Dynamic SVG Hydrograph Curve */}
            <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 space-y-1">
              <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                <span>Discharge Q(t)</span>
                <span>Peak @ {formationTime}h</span>
              </div>
              <svg className="w-full h-28 overflow-visible" viewBox={`0 0 ${svgWidth} ${svgHeight}`}>
                {/* Gridlines */}
                <line x1="15" y1="105" x2={svgWidth - 15} y2="105" stroke="#1E293B" strokeWidth="1" />
                <line x1="15" y1="20" x2={svgWidth - 15} y2="20" stroke="#1E293B" strokeWidth="1" strokeDasharray="3 3" />
                
                {/* Dynamic Curve */}
                <path d={hydrographPath} fill="none" stroke="#06B6D4" strokeWidth="3" strokeLinecap="round" />
                
                {/* Peak Point Circle */}
                <circle cx={peakX} cy={peakY} r="4" fill="#06B6D4" stroke="#FFFFFF" strokeWidth="2" />
              </svg>
              <div className="flex justify-between text-[9px] text-slate-500 font-mono">
                <span>t=0h</span>
                <span>t={duration}h</span>
              </div>
            </div>

            {/* Solver Selector Pill */}
            <div className="space-y-1.5">
              <div className="text-[10px] uppercase font-bold text-slate-400">Solver Engine:</div>
              <div className="grid grid-cols-3 gap-1 text-[10px] font-bold">
                {[
                  { id: 'HYBRID_COMPARISON', label: 'Hybrid' },
                  { id: 'DELFT3D_FM', label: 'Delft3D' },
                  { id: 'DUALSPHYSICS', label: 'SPH' },
                ].map((s) => (
                  <button
                    key={s.id}
                    onClick={() => setSolverType(s.id as any)}
                    className={`py-1.5 rounded-lg border text-center transition ${
                      solverType === s.id
                        ? 'bg-cyan-500/20 border-cyan-500 text-cyan-300'
                        : 'bg-slate-900 border-slate-800 text-slate-400'
                    }`}
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <button
            onClick={handleLaunch}
            className="w-full py-4 rounded-2xl bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 hover:from-cyan-400 hover:to-blue-500 text-white font-black text-sm flex items-center justify-center space-x-2 shadow-xl shadow-cyan-500/25 transition transform hover:-translate-y-0.5"
          >
            <Play className="w-4 h-4 fill-white" />
            <span>Launch Hydrodynamic Simulation</span>
          </button>
        </div>
      </div>
    </div>
  );
};
