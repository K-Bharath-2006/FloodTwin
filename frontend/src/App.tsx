import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { OverviewView } from './views/OverviewView';
import { DamExplorerView } from './views/DamExplorerView';
import { RiverExplorerView } from './views/RiverExplorerView';
import { DatasetManagerView } from './views/DatasetManagerView';
import { ScenarioBuilderView } from './views/ScenarioBuilderView';
import { SimulationMonitorView } from './views/SimulationMonitorView';
import { FloodMapView } from './views/FloodMapView';
import { RiskMapView } from './views/RiskMapView';
import { ImpactAnalysisView } from './views/ImpactAnalysisView';
import { ScenarioComparisonView } from './views/ScenarioComparisonView';
import { SatelliteValidationView } from './views/SatelliteValidationView';
import { ReverseFloodView } from './views/ReverseFloodView';
import { SheltersView } from './views/SheltersView';
import { GISExportView } from './views/GISExportView';
import { AlertManagementView } from './views/AlertManagementView';
import { SystemHealthView } from './views/SystemHealthView';
import { api } from './services/api';
import {
  Dam,
  River,
  Scenario,
  Simulation,
  RiskZone,
  FloodZone,
  ImpactRecord,
  SolverComparison,
  SatelliteValidation,
  Shelter,
  EvacuationRoute,
  Alert,
  SystemHealth,
} from './types';

export const App: React.FC = () => {
  const [activeView, setActiveView] = useState<string>('overview');
  const [dams, setDams] = useState<Dam[]>([]);
  const [selectedDam, setSelectedDam] = useState<Dam | null>(null);
  const [rivers, setRivers] = useState<River[]>([]);
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [simulations, setSimulations] = useState<Simulation[]>([]);
  const [activeSimulation, setActiveSimulation] = useState<Simulation | null>(null);
  const [riskZones, setRiskZones] = useState<RiskZone[]>([]);
  const [floodZones, setFloodZones] = useState<FloodZone[]>([]);
  const [impactRecord, setImpactRecord] = useState<ImpactRecord | null>(null);
  const [comparison, setComparison] = useState<SolverComparison | null>(null);
  const [satelliteValidation, setSatelliteValidation] = useState<SatelliteValidation | null>(null);
  const [shelters, setShelters] = useState<Shelter[]>([]);
  const [routes, setRoutes] = useState<EvacuationRoute[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [health, setHealth] = useState<SystemHealth | null>(null);

  // Initial Data Fetch
  const loadInitialData = async () => {
    try {
      const [damsData, riversData, scenariosData, simsData, sheltersData, routesData, alertsData, healthData] =
        await Promise.all([
          api.getDams(),
          api.getRivers(),
          api.getScenarios(),
          api.getSimulations(),
          api.getShelters(),
          api.getSafeRoutes(),
          api.getAlerts(),
          api.getHealth(),
        ]);

      setDams(damsData);
      if (damsData.length > 0) setSelectedDam(damsData[0]);
      setRivers(riversData);
      setScenarios(scenariosData);
      setSimulations(simsData);
      setShelters(sheltersData);
      setRoutes(routesData);
      setAlerts(alertsData);
      setHealth(healthData);

      // Load results of latest completed simulation
      const completed = simsData.find((s) => s.status === 'COMPLETED') || simsData[0];
      if (completed) {
        setActiveSimulation(completed);
        loadSimulationOutputs(completed.id);
      }
    } catch (e) {
      console.error('Initial data load error:', e);
    }
  };

  const loadSimulationOutputs = async (simId: string) => {
    try {
      const [rzData, fzData, impactData, compData, satData] = await Promise.all([
        api.getRiskZones(simId).catch(() => []),
        api.getFloodZones(simId).catch(() => []),
        api.getImpactRecord(simId).catch(() => null),
        api.getSimulationComparison(simId).catch(() => null),
        api.getSatelliteValidation(simId).catch(() => null),
      ]);
      setRiskZones(rzData);
      setFloodZones(fzData);
      setImpactRecord(impactData);
      setComparison(compData);
      setSatelliteValidation(satData);
    } catch (e) {
      console.error('Error loading simulation outputs:', e);
    }
  };

  useEffect(() => {
    loadInitialData();
  }, []);

  // Poll active simulation if running
  useEffect(() => {
    let timer: any;
    if (activeSimulation && activeSimulation.status !== 'COMPLETED' && activeSimulation.status !== 'FAILED') {
      timer = setInterval(async () => {
        try {
          const statusRes = await api.getSimulationStatus(activeSimulation.id);
          setActiveSimulation(statusRes);
          if (statusRes.status === 'COMPLETED') {
            loadSimulationOutputs(statusRes.id);
            const allSims = await api.getSimulations();
            setSimulations(allSims);
          }
        } catch (e) {
          console.error(e);
        }
      }, 1500);
    }
    return () => clearInterval(timer);
  }, [activeSimulation]);

  const handleRunScenario = async (scenarioDataOrId: Partial<Scenario> | string) => {
    try {
      let scId = '';
      if (typeof scenarioDataOrId === 'string') {
        scId = scenarioDataOrId;
      } else {
        const newSc = await api.createScenario(scenarioDataOrId);
        setScenarios((prev) => [newSc, ...prev]);
        scId = newSc.id;
      }

      const sim = await api.queueSimulation({
        scenario_id: scId,
        solver_type: 'HYBRID_COMPARISON',
        execution_mode: 'DEMO_REFERENCE',
      });

      setActiveSimulation(sim);
      setSimulations((prev) => [sim, ...prev]);
      setActiveView('monitor');
    } catch (e) {
      console.error('Failed to launch simulation:', e);
    }
  };

  return (
    <div className="min-h-screen bg-background text-slate-100 flex flex-col">
      <Navbar health={health} onSelectView={setActiveView} />

      <div className="flex flex-1 overflow-hidden">
        <Sidebar activeView={activeView} onSelectView={setActiveView} />

        <main className="flex-1 overflow-y-auto bg-[#070B14]">
          {activeView === 'overview' && (
            <OverviewView
              dam={selectedDam}
              river={rivers[0] || null}
              scenarios={scenarios}
              simulations={simulations}
              latestSim={activeSimulation}
              riskZones={riskZones}
              floodZones={floodZones}
              impactRecord={impactRecord}
              shelters={shelters}
              routes={routes}
              onSelectView={setActiveView}
              onRunScenario={handleRunScenario}
            />
          )}

          {activeView === 'dams' && (
            <DamExplorerView
              dam={selectedDam}
              dams={dams}
              onSelectDam={(id) => setSelectedDam(dams.find((d) => d.id === id) || null)}
            />
          )}

          {activeView === 'rivers' && <RiverExplorerView rivers={rivers} />}

          {activeView === 'datasets' && <DatasetManagerView />}

          {activeView === 'builder' && (
            <ScenarioBuilderView dam={selectedDam} onRunScenario={handleRunScenario} />
          )}

          {activeView === 'monitor' && (
            <SimulationMonitorView simulation={activeSimulation} onSelectView={setActiveView} />
          )}

          {activeView === 'floodmap' && (
            <FloodMapView
              dam={selectedDam}
              river={rivers[0] || null}
              floodZones={floodZones}
              riskZones={riskZones}
              shelters={shelters}
              routes={routes}
              simulation={activeSimulation}
            />
          )}

          {activeView === 'riskmap' && (
            <RiskMapView
              dam={selectedDam}
              river={rivers[0] || null}
              riskZones={riskZones}
              shelters={shelters}
              routes={routes}
            />
          )}

          {activeView === 'impact' && <ImpactAnalysisView impact={impactRecord} />}

          {activeView === 'comparison' && (
            <ScenarioComparisonView comparison={comparison} scenarios={scenarios} />
          )}

          {activeView === 'satellite' && (
            <SatelliteValidationView validation={satelliteValidation} />
          )}

          {activeView === 'reverse' && <ReverseFloodView />}

          {activeView === 'shelters' && <SheltersView shelters={shelters} routes={routes} />}

          {activeView === 'export' && <GISExportView simulation={activeSimulation} />}

          {activeView === 'alerts' && (
            <AlertManagementView
              alerts={alerts}
              simulation={activeSimulation}
              onRefreshAlerts={async () => {
                const refreshed = await api.getAlerts();
                setAlerts(refreshed);
              }}
            />
          )}

          {activeView === 'health' && <SystemHealthView health={health} />}
        </main>
      </div>
    </div>
  );
};
