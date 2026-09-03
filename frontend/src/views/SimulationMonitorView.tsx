import React, { useEffect, useRef } from 'react';
import {
  PlayCircle,
  CheckCircle2,
  AlertCircle,
  Clock,
  Terminal,
  Activity,
  Layers,
  Map,
  Download,
  GitCompare,
  Cpu,
  RefreshCw
} from 'lucide-react';
import { Simulation } from '../types';

interface SimulationMonitorViewProps {
  simulation: Simulation | null;
  onSelectView: (view: string) => void;
}

export const SimulationMonitorView: React.FC<SimulationMonitorViewProps> = ({
  simulation,
  onSelectView,
}) => {
  const terminalRef = useRef<HTMLDivElement>(null);

  const stages = [
    { key: 'QUEUED', label: '1. Queued' },
    { key: 'VALIDATING', label: '2. Validating Parameters' },
    { key: 'PREPARING', label: '3. Mesh Workspace' },
    { key: 'RUNNING_DELFT3D', label: '4. Delft3D-FM 2D SWE' },
    { key: 'RUNNING_SPH', label: '5. DualSPHysics SPH' },
    { key: 'PROCESSING', label: '6. Result Normalization' },
    { key: 'GENERATING_FLOOD', label: '7. Flood Vectorization' },
    { key: 'GENERATING_GIS', label: '8. GIS Package Generation' },
    { key: 'RUNNING_IMPACT', label: '9. Exposure Analytics' },
    { key: 'COMPLETED', label: '10. Completed' },
  ];

  const currentStageIdx = stages.findIndex((s) => s.key === simulation?.status);
  const isComplete = simulation?.status === 'COMPLETED';
  const isRunning = simulation && !isComplete && simulation.status !== 'FAILED';

  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [simulation?.logs_json]);

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <PlayCircle className="w-5 h-5 text-cyan-400" />
            <span>Hydrodynamic Solver Execution Supervisor</span>
          </h2>
          <p className="text-xs text-slate-400">
            Real-time stage transitions, NetCDF result generation, and supervised STDOUT/STDERR log stream.
          </p>
        </div>

        {isComplete && (
          <div className="flex items-center space-x-2">
            <button
              onClick={() => onSelectView('floodmap')}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold text-xs flex items-center space-x-2 transition shadow-lg shadow-cyan-500/25"
            >
              <Map className="w-4 h-4" />
              <span>View Flood Map</span>
            </button>
            <button
              onClick={() => onSelectView('export')}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold text-xs flex items-center space-x-2 border border-slate-700 transition"
            >
              <Download className="w-4 h-4" />
              <span>Download GIS Shapefile</span>
            </button>
          </div>
        )}
      </div>

      {/* Progress & Real-Time Solver Stepper */}
      <div className="glass-card p-6 rounded-3xl border border-slate-800 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-4">
          <div className="space-y-0.5">
            <span className="text-[10px] uppercase font-bold text-slate-400">Active Simulation UUID</span>
            <div className="font-mono text-xs font-bold text-cyan-300">
              {simulation?.id || 'Simulation Standby Mode'}
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <div className="text-right">
              <span className="text-[10px] uppercase font-bold text-slate-400">Pipeline Status</span>
              <div className="text-sm font-black text-white flex items-center gap-1.5">
                {isRunning && <RefreshCw className="w-3.5 h-3.5 text-cyan-400 animate-spin" />}
                {isComplete && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />}
                <span>{simulation?.status || 'IDLE'}</span>
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 text-center min-w-[80px]">
              <span className="text-[10px] text-cyan-300 font-bold uppercase">Progress</span>
              <div className="text-lg font-black text-cyan-400 font-mono">
                {simulation?.progress_pct || 0}%
              </div>
            </div>
          </div>
        </div>

        {/* Linear Progress Bar */}
        <div className="w-full bg-slate-900 h-3 rounded-full overflow-hidden p-0.5 border border-slate-800">
          <div
            className="bg-gradient-to-r from-cyan-500 via-blue-500 to-emerald-400 h-full rounded-full transition-all duration-500 shadow-sm shadow-cyan-500/50"
            style={{ width: `${simulation?.progress_pct || 0}%` }}
          />
        </div>

        {/* 10-Stage Visual Node Timeline */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-[11px]">
          {stages.map((st, idx) => {
            const isPassed = isComplete || (currentStageIdx >= 0 && idx <= currentStageIdx);
            const isCurrent = simulation?.status === st.key;

            return (
              <div
                key={st.key}
                className={`p-2.5 rounded-xl border text-center font-semibold transition ${
                  isCurrent
                    ? 'bg-cyan-500/20 border-cyan-500 text-cyan-300 shadow-md shadow-cyan-500/20 animate-pulse'
                    : isPassed
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                    : 'bg-slate-900/60 border-slate-800 text-slate-600'
                }`}
              >
                {st.label}
              </div>
            );
          })}
        </div>
      </div>

      {/* Supervised Terminal Logs Console */}
      <div className="glass-card rounded-3xl border border-slate-800 overflow-hidden space-y-0 shadow-2xl">
        <div className="p-4 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-2 text-xs font-bold text-white">
            <Terminal className="w-4 h-4 text-cyan-400" />
            <span>Hydrodynamic Solver Execution Stream</span>
          </div>
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span className="text-[10px] font-mono text-slate-400">STDOUT / STDERR Supervised</span>
          </div>
        </div>

        <div
          ref={terminalRef}
          className="p-5 bg-[#050811] font-mono text-xs text-slate-300 space-y-2 h-72 overflow-y-auto"
        >
          {simulation?.logs_json && simulation.logs_json.length > 0 ? (
            simulation.logs_json.map((l, i) => (
              <div key={i} className="flex items-start space-x-3 hover:bg-slate-900/40 p-1 rounded transition">
                <span className="text-slate-600 text-[10px] min-w-[70px]">
                  [{l.time?.split('T')[1]?.slice(0, 8) || `00:00:${i + 1}`}]
                </span>
                <span
                  className={`font-bold px-1.5 py-0.2 rounded text-[10px] ${
                    l.stage?.includes('RUNNING')
                      ? 'bg-cyan-500/20 text-cyan-300'
                      : l.stage === 'COMPLETED'
                      ? 'bg-emerald-500/20 text-emerald-400'
                      : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {l.stage || 'INFO'}
                </span>
                <span className="text-slate-300 flex-1">{l.message}</span>
              </div>
            ))
          ) : (
            <div className="text-slate-600 italic">No solver logs received yet. Ready for simulation launch.</div>
          )}
        </div>
      </div>
    </div>
  );
};
