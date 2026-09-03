import React, { useState } from 'react';
import {
  Bell,
  Send,
  CheckCircle2,
  AlertTriangle,
  ShieldCheck,
  Clock,
  Smartphone,
  Radio,
  Volume2,
  Vibrate,
  Navigation,
  Sparkles
} from 'lucide-react';
import { Alert, Simulation } from '../types';
import { api } from '../services/api';

interface AlertManagementViewProps {
  alerts: Alert[];
  simulation: Simulation | null;
  onRefreshAlerts: () => void;
}

export const AlertManagementView: React.FC<AlertManagementViewProps> = ({
  alerts,
  simulation,
  onRefreshAlerts,
}) => {
  const [dispatching, setDispatching] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleTestAlert = async () => {
    if (!simulation) return;
    setDispatching(true);
    setSuccessMsg(null);
    try {
      await api.dispatchTestAlert(simulation.id);
      setSuccessMsg('Emergency test alert broadcasted to citizen mobile devices via FCM & local geofence!');
      onRefreshAlerts();
    } catch (e: any) {
      console.error(e);
    } finally {
      setDispatching(false);
    }
  };

  const latestAlert = alerts[0];

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Bell className="w-5 h-5 text-red-400" />
            <span>Emergency Alert Dispatcher &amp; Citizen Push Feed</span>
          </h2>
          <p className="text-xs text-slate-400">
            FCM push broadcast and offline geofence alert synchronization for citizens in predicted flood zones.
          </p>
        </div>

        <button
          onClick={handleTestAlert}
          disabled={dispatching || !simulation}
          className="px-5 py-3 rounded-2xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-extrabold text-xs flex items-center space-x-2 transition shadow-lg shadow-red-500/25 disabled:opacity-50"
        >
          <Send className="w-4 h-4" />
          <span>{dispatching ? 'Broadcasting...' : 'Broadcast Emergency Test Push'}</span>
        </button>
      </div>

      {successMsg && (
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center space-x-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{successMsg}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Active Emergency Broadcasts Feed */}
        <div className="lg:col-span-2 glass-card rounded-3xl border border-slate-800 overflow-hidden shadow-2xl space-y-0">
          <div className="p-4 bg-slate-900/80 border-b border-slate-800 flex items-center justify-between">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Radio className="w-4 h-4 text-red-400 animate-pulse" />
              <span>Active Emergency Broadcasts Feed</span>
            </h3>
            <span className="text-xs text-slate-400 font-mono">{alerts.length} Total Alerts</span>
          </div>

          <div className="divide-y divide-slate-800/60 text-xs max-h-[520px] overflow-y-auto">
            {alerts.map((al) => (
              <div
                key={al.id}
                className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-800/40 transition"
              >
                <div className="space-y-1.5 flex-1">
                  <div className="flex items-center space-x-2">
                    <span
                      className={`px-2.5 py-0.5 rounded text-[10px] font-black uppercase tracking-wider ${
                        al.risk_level === 'LEVEL_3_CRITICAL'
                          ? 'bg-red-500 text-white'
                          : 'bg-orange-500 text-white'
                      }`}
                    >
                      {al.risk_level}
                    </span>
                    <span className="font-bold text-white text-sm">{al.title}</span>
                  </div>
                  <p className="text-slate-300 text-xs leading-relaxed">{al.message}</p>
                  <div className="flex flex-wrap items-center gap-4 text-[11px] text-slate-400 pt-1">
                    <span>
                      Nearest Shelter:{' '}
                      <strong className="text-emerald-400">
                        {al.nearest_shelter_name || 'Morbi Town Hall'}
                      </strong>
                    </span>
                    <span>
                      Est Arrival Time:{' '}
                      <strong className="text-amber-400 font-mono">
                        {al.expected_arrival_time_min || 15} min
                      </strong>
                    </span>
                  </div>
                </div>

                <div className="flex items-center space-x-2 text-[10px] text-slate-500 font-mono">
                  <Clock className="w-3.5 h-3.5" />
                  <span>{new Date(al.created_at).toLocaleTimeString()}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right 1 Col: Citizen Mobile Device Alert Mockup */}
        <div className="glass-card p-6 rounded-3xl border border-slate-800 space-y-4 flex flex-col items-center justify-between bg-gradient-to-br from-slate-900 to-slate-950 shadow-2xl">
          <div className="w-full flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center space-x-2 text-xs font-bold text-white">
              <Smartphone className="w-4 h-4 text-cyan-400" />
              <span>Citizen Mobile Push Preview</span>
            </div>
            <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-cyan-500/10 text-cyan-300">
              FCM / APNs
            </span>
          </div>

          {/* Smartphone Frame */}
          <div className="w-64 rounded-3xl border-4 border-slate-700 bg-slate-950 p-4 shadow-2xl space-y-4 relative">
            {/* Phone Speaker Notch */}
            <div className="w-16 h-3 bg-slate-800 rounded-full mx-auto" />

            {/* Notification Bubble */}
            <div className="p-3 rounded-2xl bg-red-950/80 border border-red-500/60 shadow-lg space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-1.5">
                  <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
                  <span className="text-[10px] font-black text-red-400 uppercase tracking-wider">
                    CRITICAL ALERT
                  </span>
                </div>
                <span className="text-[9px] text-slate-400 font-mono">Now</span>
              </div>

              <div className="text-xs font-bold text-white">
                {latestAlert?.title || 'DAM FLOOD EMERGENCY'}
              </div>
              <p className="text-[10px] text-slate-300 leading-tight">
                {latestAlert?.message || 'High flood inundation predicted nearby. Evacuate immediately.'}
              </p>

              <div className="p-2 rounded-xl bg-slate-900 border border-slate-800 space-y-1 text-[9px] text-slate-300">
                <div className="text-emerald-400 font-bold flex items-center gap-1">
                  <Navigation className="w-3 h-3" />
                  <span>Route: {latestAlert?.nearest_shelter_name || 'Morbi Town Hall'}</span>
                </div>
              </div>
            </div>

            {/* Phone Home Bar */}
            <div className="w-20 h-1 bg-slate-700 rounded-full mx-auto" />
          </div>

          <div className="text-center text-[10px] text-slate-400 space-y-1">
            <div className="flex items-center justify-center space-x-2 text-slate-300">
              <Volume2 className="w-3.5 h-3.5 text-cyan-400" />
              <span>Siren Sound Pattern</span>
              <Vibrate className="w-3.5 h-3.5 text-cyan-400 ml-2" />
              <span>High Vibration</span>
            </div>
            <p>Triggers even when citizen phone is in Silent Mode.</p>
          </div>
        </div>
      </div>
    </div>
  );
};
