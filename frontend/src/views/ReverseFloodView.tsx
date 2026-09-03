import React, { useState } from 'react';
import { Search, Sparkles, CheckCircle2, AlertCircle, ArrowRight, Shield, Activity } from 'lucide-react';
import { api } from '../services/api';

export const ReverseFloodView: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const handleMatch = async () => {
    setLoading(true);
    try {
      const data = await api.getReverseMatch();
      setResult(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div>
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <Search className="w-5 h-5 text-cyan-400" />
          <span>Reverse Flood Scenario Matching &amp; Hypothesis Ranking</span>
        </h2>
        <p className="text-xs text-slate-400">
          Advanced inverse analysis: Given an observed satellite flood polygon, ranks simulated breach scenarios based on spatial IoU similarity.
        </p>
      </div>

      {/* Action Banner */}
      <div className="glass-panel p-6 rounded-3xl border border-cyan-500/30 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-br from-slate-900 via-slate-900 to-cyan-950/20 shadow-xl">
        <div className="space-y-1">
          <div className="text-base font-bold text-white">Ingest Satellite Flood Extent &amp; Rank Candidate Breach Scenarios</div>
          <p className="text-xs text-slate-400 max-w-xl">
            Extracts observed water contour from Sentinel-1 SAR pass and computes multi-scenario IoU loss ranking against pre-computed hydrodynamic library.
          </p>
        </div>

        <button
          onClick={handleMatch}
          disabled={loading}
          className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-extrabold text-xs flex items-center space-x-2 transition shadow-lg shadow-cyan-500/25 disabled:opacity-50"
        >
          <Sparkles className="w-4 h-4" />
          <span>{loading ? 'Evaluating Scenarios...' : 'Run Reverse Hypothesis Matching'}</span>
        </button>
      </div>

      {/* Results Ranking List */}
      {result && (
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-300">
            <strong>CRITICAL LABEL: SCENARIO MATCHING / HYPOTHESIS RANKING</strong>
            <p className="text-amber-300/80 mt-0.5">{result.disclaimer}</p>
          </div>

          <div className="glass-card rounded-3xl border border-slate-800 overflow-hidden divide-y divide-slate-800/60 shadow-2xl">
            {result.top_matched_scenarios?.map((m: any, idx: number) => (
              <div key={idx} className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-800/40 transition">
                <div className="flex items-center space-x-3.5">
                  <div className="w-10 h-10 rounded-2xl bg-slate-900 text-cyan-400 font-black flex items-center justify-center text-sm border border-slate-700 shadow-inner">
                    #{idx + 1}
                  </div>
                  <div>
                    <div className="text-sm font-bold text-white">{m.scenario_name}</div>
                    <div className="text-xs text-slate-400">{m.dam_name} • {m.notes}</div>
                  </div>
                </div>

                <div className="flex items-center space-x-6">
                  <div className="text-right">
                    <div className="text-sm font-black text-cyan-400 font-mono">
                      IoU: {(m.iou_similarity * 100).toFixed(1)}%
                    </div>
                    <div className="text-[10px] text-slate-400">ΔArea: {m.area_difference_sqkm} km²</div>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-[10px] font-extrabold ${
                    m.confidence_tier === 'HIGH_SIMILARITY_MATCH'
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                      : 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                  }`}>
                    {m.confidence_tier.replace('_', ' ')}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
