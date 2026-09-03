import React, { useEffect, useRef, useState } from 'react';
import maplibregl from 'maplibre-gl';
import {
  Layers,
  MapPin,
  Maximize2,
  Navigation,
  Shield,
  Eye,
  EyeOff,
  Compass,
  RotateCcw,
  Sparkles,
  HeartHandshake
} from 'lucide-react';
import { Dam, River, FloodZone, RiskZone, Shelter, EvacuationRoute } from '../types';

interface MapViewerProps {
  dam: Dam | null;
  river?: River | null;
  floodZones?: FloodZone[];
  riskZones?: RiskZone[];
  shelters?: Shelter[];
  routes?: EvacuationRoute[];
  showDepthContours?: boolean;
  showRiskZones?: boolean;
  showShelters?: boolean;
  showRoutes?: boolean;
  centerCoords?: [number, number];
  zoomLevel?: number;
  onSelectFeature?: (feature: any) => void;
}

export const MapViewer: React.FC<MapViewerProps> = ({
  dam,
  river,
  floodZones = [],
  riskZones = [],
  shelters = [],
  routes = [],
  showDepthContours = true,
  showRiskZones = true,
  showShelters = true,
  showRoutes = true,
  centerCoords,
  zoomLevel = 12,
  onSelectFeature,
}) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [basemap, setBasemap] = useState<'dark' | 'satellite' | 'terrain'>('dark');
  const [layerVisibility, setLayerVisibility] = useState({
    flood: true,
    risk: true,
    shelters: true,
    routes: true,
  });
  const [coordsReadout, setCoordsReadout] = useState({ lng: 70.850, lat: 22.820, zoom: 12 });

  const defaultCenter: [number, number] = centerCoords || [
    dam?.longitude || 70.850,
    dam?.latitude || 22.820,
  ];

  const getBasemapStyle = (type: string) => {
    switch (type) {
      case 'satellite':
        return 'https://api.maptiler.com/maps/hybrid/style.json?key=get_your_own_OpIi9ZULNHzrESv6T2vL';
      case 'terrain':
        return 'https://api.maptiler.com/maps/outdoor-v2/style.json?key=get_your_own_OpIi9ZULNHzrESv6T2vL';
      default:
        return 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json';
    }
  };

  // Initialize Map
  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    map.current = new maplibregl.Map({
      container: mapContainer.current,
      style: getBasemapStyle(basemap),
      center: defaultCenter,
      zoom: zoomLevel,
      attributionControl: false,
    });

    map.current.on('load', () => {
      setMapLoaded(true);
    });

    map.current.on('mousemove', (e) => {
      setCoordsReadout({
        lng: parseFloat(e.lngLat.lng.toFixed(4)),
        lat: parseFloat(e.lngLat.lat.toFixed(4)),
        zoom: parseFloat(map.current?.getZoom().toFixed(1) || '12'),
      });
    });

    return () => {
      map.current?.remove();
      map.current = null;
    };
  }, []);

  // Update Layers when map or data changes
  useEffect(() => {
    if (!map.current || !mapLoaded) return;
    const m = map.current;

    // 1. Add Dam Marker
    if (dam && dam.latitude && dam.longitude) {
      const el = document.createElement('div');
      el.className = 'dam-pin';
      el.innerHTML = `
        <div style="background: linear-gradient(135deg, #06b6d4, #2563eb); width: 34px; height: 34px; border-radius: 12px; display: flex; align-items: center; justify-content: center; box-shadow: 0 0 20px rgba(6,182,212,0.8); border: 2px solid #ffffff; cursor: pointer;">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
        </div>
      `;
      new maplibregl.Marker({ element: el })
        .setLngLat([dam.longitude, dam.latitude])
        .setPopup(
          new maplibregl.Popup({ offset: 25 }).setHTML(`
            <div style="color: #0F172A; padding: 6px; font-family: sans-serif;">
              <strong style="font-size: 13px;">${dam.name}</strong><br/>
              <span style="font-size: 11px; color: #475569;">FRL: ${dam.full_reservoir_level_m}m | Cap: ${dam.capacity_mcm} MCM</span>
            </div>
          `)
        )
        .addTo(m);
    }

    // 2. Add Shelter Markers
    shelters.forEach((s) => {
      const el = document.createElement('div');
      el.innerHTML = `
        <div style="background: #10B981; width: 28px; height: 28px; border-radius: 8px; display: flex; align-items: center; justify-content: center; box-shadow: 0 0 15px rgba(16,185,129,0.7); border: 2px solid #ffffff; cursor: pointer;">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#ffffff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg>
        </div>
      `;
      new maplibregl.Marker({ element: el })
        .setLngLat([s.longitude, s.latitude])
        .setPopup(
          new maplibregl.Popup({ offset: 20 }).setHTML(`
            <div style="color: #0F172A; padding: 6px; font-family: sans-serif;">
              <strong style="font-size: 12px; color: #059669;">${s.name}</strong><br/>
              <span style="font-size: 11px; color: #475569;">Capacity: ${s.capacity} Persons | Elev: ${s.elevation_m}m</span>
            </div>
          `)
        )
        .addTo(m);
    });

    // 3. Add Risk Zones GeoJSON Layer
    if (riskZones.length > 0) {
      const geojsonFeatureCollection: any = {
        type: 'FeatureCollection',
        features: riskZones.map((rz) => ({
          type: 'Feature',
          geometry: rz.geometry,
          properties: {
            risk_level: rz.risk_level,
            max_depth_m: rz.max_depth_m,
            area_sqkm: rz.area_sqkm,
            color:
              rz.risk_level === 'LEVEL_3_CRITICAL'
                ? '#EF4444'
                : rz.risk_level === 'LEVEL_2_HIGH_RISK'
                ? '#F97316'
                : rz.risk_level === 'LEVEL_1_WARNING'
                ? '#EAB308'
                : '#10B981',
          },
        })),
      };

      if (m.getSource('risk-zones-src')) {
        (m.getSource('risk-zones-src') as maplibregl.GeoJSONSource).setData(geojsonFeatureCollection);
      } else {
        m.addSource('risk-zones-src', {
          type: 'geojson',
          data: geojsonFeatureCollection,
        });

        m.addLayer({
          id: 'risk-zones-fill',
          type: 'fill',
          source: 'risk-zones-src',
          paint: {
            'fill-color': ['get', 'color'],
            'fill-opacity': 0.45,
          },
        });

        m.addLayer({
          id: 'risk-zones-line',
          type: 'line',
          source: 'risk-zones-src',
          paint: {
            'line-color': ['get', 'color'],
            'line-width': 2.5,
          },
        });
      }
    }
  }, [mapLoaded, dam, riskZones, shelters]);

  const handleResetCenter = () => {
    map.current?.flyTo({ center: defaultCenter, zoom: 12, speed: 1.2 });
  };

  return (
    <div className="relative w-full h-full min-h-[420px] rounded-2xl overflow-hidden border border-slate-800 shadow-2xl bg-[#070B14]">
      {/* MapLibre DOM Node */}
      <div ref={mapContainer} className="w-full h-full min-h-[420px]" />

      {/* Floating Top Left: Layer & Basemap Controller */}
      <div className="absolute top-4 left-4 z-10 glass-panel p-3 rounded-2xl space-y-3 shadow-xl max-w-xs">
        <div className="flex items-center justify-between border-b border-slate-800 pb-2">
          <div className="flex items-center space-x-1.5 text-xs font-bold text-white">
            <Layers className="w-4 h-4 text-cyan-400" />
            <span>GIS Map Layers</span>
          </div>
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-cyan-500/10 text-cyan-300">
            EPSG:4326
          </span>
        </div>

        {/* Basemap Switcher */}
        <div className="grid grid-cols-3 gap-1 text-[11px] font-semibold">
          {[
            { id: 'dark', label: 'Dark Carto' },
            { id: 'satellite', label: 'Satellite' },
            { id: 'terrain', label: 'Terrain' },
          ].map((b) => (
            <button
              key={b.id}
              onClick={() => setBasemap(b.id as any)}
              className={`py-1 rounded-lg border text-center transition ${
                basemap === b.id
                  ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-300'
                  : 'bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200'
              }`}
            >
              {b.label}
            </button>
          ))}
        </div>

        {/* Toggle Layers */}
        <div className="space-y-1.5 text-xs pt-1">
          <label className="flex items-center justify-between text-slate-300 cursor-pointer">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500"></span>
              Level 3 Hazard Zone (&gt;1.5m)
            </span>
            <input
              type="checkbox"
              checked={layerVisibility.risk}
              onChange={(e) => setLayerVisibility({ ...layerVisibility, risk: e.target.checked })}
              className="accent-cyan-400"
            />
          </label>

          <label className="flex items-center justify-between text-slate-300 cursor-pointer">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
              Relief Shelters &amp; Corridors
            </span>
            <input
              type="checkbox"
              checked={layerVisibility.shelters}
              onChange={(e) => setLayerVisibility({ ...layerVisibility, shelters: e.target.checked })}
              className="accent-emerald-400"
            />
          </label>
        </div>
      </div>

      {/* Floating Top Right: Quick Navigation Tools */}
      <div className="absolute top-4 right-4 z-10 flex flex-col space-y-2">
        <button
          onClick={handleResetCenter}
          className="p-2.5 rounded-xl glass-panel text-slate-300 hover:text-white hover:bg-slate-800 transition shadow-lg"
          title="Reset Camera to Dam Basin"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
        <button
          onClick={() => map.current?.zoomIn()}
          className="p-2.5 rounded-xl glass-panel text-slate-300 hover:text-white hover:bg-slate-800 transition shadow-lg font-bold text-xs"
          title="Zoom In"
        >
          +
        </button>
        <button
          onClick={() => map.current?.zoomOut()}
          className="p-2.5 rounded-xl glass-panel text-slate-300 hover:text-white hover:bg-slate-800 transition shadow-lg font-bold text-xs"
          title="Zoom Out"
        >
          -
        </button>
      </div>

      {/* Floating Bottom Left: Depth Legend Bar */}
      <div className="absolute bottom-4 left-4 z-10 glass-panel px-4 py-2.5 rounded-xl shadow-xl space-y-1.5">
        <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
          Predicted Inundation Depth (m)
        </div>
        <div className="flex items-center space-x-1 text-[10px] font-bold text-slate-300">
          <span className="w-6 h-3 rounded bg-emerald-500/80 text-center">0m</span>
          <span className="w-8 h-3 rounded bg-yellow-500/80 text-center">0.5</span>
          <span className="w-8 h-3 rounded bg-orange-500/80 text-center">1.5</span>
          <span className="w-8 h-3 rounded bg-red-600 text-center">&gt;3m</span>
          <span className="w-8 h-3 rounded bg-purple-700 text-center">&gt;8m</span>
        </div>
      </div>

      {/* Floating Bottom Right: Live GPS Coordinate HUD */}
      <div className="absolute bottom-4 right-4 z-10 glass-panel px-3 py-1.5 rounded-xl text-[10px] font-mono text-slate-400 shadow-xl flex items-center space-x-3">
        <span>LAT: <strong className="text-cyan-400">{coordsReadout.lat}°N</strong></span>
        <span>LON: <strong className="text-cyan-400">{coordsReadout.lng}°E</strong></span>
        <span>ZOOM: <strong className="text-slate-200">{coordsReadout.zoom}</strong></span>
      </div>
    </div>
  );
};
