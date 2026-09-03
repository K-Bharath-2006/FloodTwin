import React from 'react';
import { AlertTriangle, ShieldAlert, CheckCircle2, Info, Map, Layers, Navigation } from 'lucide-react';
import { Dam, River, RiskZone, Shelter, EvacuationRoute } from '../types';
import { MapViewer } from '../components/MapViewer';

interface RiskMapViewProps {
  dam: Dam | null;
  river: River | null;
  riskZones: RiskZone[];
  shelters: Shelter[];
  routes: EvacuationRoute[];
}

export const RiskMapView: React.FC<RiskMapViewProps> = ({
  dam,
  river,
  riskZones,
  shelters,
  routes,
}) => {
  const riskTiers = [
    {
      level: 'LEVEL 3: CRITICAL',
      color: 'border-red-500 bg-red-500/10 text-red-400',
      badge: 'bg-red-500 text-white',
      desc: 'Depth ≥ 1.5m or Velocity ≥ 2.5 m/s or arrival < 60m. Immediate life safety hazard — mandatory evacuation.',
      area: riskZones.find((r) => r.risk_level === 'LEVEL_3_CRITICAL')?.area_sqkm || 5.98,
      depth: riskZones.find((r) => r.risk_level === 'LEVEL_3_CRITICAL')?.max_depth_m || 13.44,
    },
    {
      level: 'LEVEL 2: HIGH RISK',
      color: 'border-orange-500 bg-orange-500/10 text-orange-400',
      badge: 'bg-orange-500 text-white',
      desc: 'Depth 0.5m - 1.5m or Velocity 1.0 - 2.5 m/s. Move assets to elevated floors and prepare for evacuation.',
      area: riskZones.find((r) => r.risk_level === 'LEVEL_2_HIGH_RISK')?.area_sqkm || 0.08,
      depth: riskZones.find((r) => r.risk_level === 'LEVEL_2_HIGH_RISK')?.max_depth_m || 1.45,
    },
    {
      level: 'LEVEL 1: WARNING',
      color: 'border-yellow-500 bg-yellow-500/10 text-yellow-400',
      badge: 'bg-yellow-500 text-black',
      desc: 'Depth 0.1m - 0.5m. Low-lying riverbank water presence. Monitor official broadcasts.',
      area: riskZones.find((r) => r.risk_level === 'LEVEL_1_WARNING')?.area_sqkm || 0.02,
      depth: riskZones.find((r) => r.risk_level === 'LEVEL_1_WARNING')?.max_depth_m || 0.45,
    },
    {
      level: 'LEVEL 0: SAFE ZONE',
      color: 'border-emerald-500 bg-emerald-500/10 text-emerald-400',
      badge: 'bg-emerald-500 text-white',
      desc: 'Elevated topography above peak hydrodynamic flood stage. Designated community assembly area.',
      area: 45.0,
      depth: 0.0,
    },
  ];

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div>
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <Layers className="w-5 h-5 text-amber-400" />
          <span>Hydrodynamic Hazard &amp; Risk Classification (Level 0 - Level 3)</span>
        </h2>
        <p className="text-xs text-slate-400">
          Standardized discrete risk polygon generation based on water depth, flow velocity, and arrival time criteria.
        </p>
      </div>

      {/* 4 Risk Level Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {riskTiers.map((tier) => (
          <div key={tier.level} className={`p-5 rounded-3xl border ${tier.color} space-y-3 shadow-lg`}>
            <div className="flex items-center justify-between">
              <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider ${tier.badge}`}>
                {tier.level.split(':')[0]}
              </span>
              <span className="text-xs font-mono font-bold">{tier.area.toFixed(2)} km²</span>
            </div>
            <div className="text-xs font-black text-white">{tier.level.split(':')[1]}</div>
            <p className="text-[11px] text-slate-300 leading-snug">{tier.desc}</p>
          </div>
        ))}
      </div>

      {/* Map with Risk Zones Display */}
      <div className="h-[480px]">
        <MapViewer
          dam={dam}
          river={river}
          riskZones={riskZones}
          shelters={shelters}
          routes={routes}
          showRiskZones={true}
          showDepthContours={false}
        />
      </div>
    </div>
  );
};
