import React, { useState } from 'react';
import { HardDrive, Upload, CheckCircle2, AlertCircle, FileText, Database, Shield } from 'lucide-react';

export const DatasetManagerView: React.FC = () => {
  const [datasets] = useState([
    {
      id: 'DS-001',
      name: 'SRTM 30m Digital Elevation Model (DEM)',
      type: 'DEM (Topobathymetry)',
      format: 'GeoTIFF (.tif)',
      crs: 'EPSG:4326',
      size: '14.2 MB',
      status: 'VALIDATED',
      source: 'USGS EarthExplorer / OpenTopography'
    },
    {
      id: 'DS-002',
      name: 'Morbi Downstream Building Footprints & Infrastructure',
      type: 'BUILDINGS',
      format: 'Shapefile (.shp)',
      crs: 'EPSG:4326',
      size: '3.8 MB',
      status: 'VALIDATED',
      source: 'OpenStreetMap / Survey of India'
    },
    {
      id: 'DS-003',
      name: 'Machhu River Hydrographic Cross-Sections',
      type: 'RIVER_GEOMETRY',
      format: 'GeoJSON (.json)',
      crs: 'EPSG:4326',
      size: '1.1 MB',
      status: 'VALIDATED',
      source: 'Central Water Commission (CWC)'
    }
  ]);

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <HardDrive className="w-5 h-5 text-cyan-400" />
            <span>GIS &amp; DEM Ingestion Pipeline</span>
          </h2>
          <p className="text-xs text-slate-400">
            Automated verification: Magic byte checking, CRS reprojection to WGS84, bounding box sanity, and topological validity.
          </p>
        </div>

        <button className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-white font-bold text-xs flex items-center space-x-2 transition shadow-lg shadow-cyan-500/20">
          <Upload className="w-4 h-4" />
          <span>Upload New GIS/DEM Layer</span>
        </button>
      </div>

      {/* Dataset Validation Table */}
      <div className="glass-card rounded-2xl border border-slate-800 overflow-hidden">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <h3 className="text-sm font-bold text-white">Ingested Geospatial Layers</h3>
          <span className="text-xs text-slate-400">{datasets.length} Active Layers</span>
        </div>

        <div className="divide-y divide-slate-800/60">
          {datasets.map((ds) => (
            <div key={ds.id} className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-800/40 transition">
              <div className="flex items-start space-x-3">
                <div className="p-2.5 rounded-xl bg-slate-800 text-cyan-400 border border-slate-700">
                  <Database className="w-5 h-5" />
                </div>
                <div className="space-y-1">
                  <div className="text-sm font-bold text-white">{ds.name}</div>
                  <div className="flex flex-wrap gap-2 text-[10px] text-slate-400">
                    <span className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700">{ds.type}</span>
                    <span className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700">{ds.format}</span>
                    <span className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700">{ds.crs}</span>
                    <span>Size: {ds.size}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-bold border border-emerald-500/30 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Validated (EPSG:4326)</span>
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
