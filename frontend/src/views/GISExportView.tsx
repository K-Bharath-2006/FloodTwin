import React from 'react';
import { Download, FileCode, Map, CheckCircle2, ShieldCheck, FolderArchive, Terminal, Copy } from 'lucide-react';
import { Simulation } from '../types';
import { api } from '../services/api';

interface GISExportViewProps {
  simulation: Simulation | null;
}

export const GISExportView: React.FC<GISExportViewProps> = ({ simulation }) => {
  const simId = simulation?.id || 'demo-sim';

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      <div>
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <Download className="w-5 h-5 text-cyan-400" />
          <span>Automated Multi-Format GIS Export Hub</span>
        </h2>
        <p className="text-xs text-slate-400">
          Instant zero-QGIS direct download of hydrodynamic flood hazard zones, risk polygons, and depth contours.
        </p>
      </div>

      {/* Export Format Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Format 1: ESRI Shapefile Bundle (.zip) */}
        <div className="glass-card p-6 rounded-3xl border border-slate-800 space-y-4 flex flex-col justify-between shadow-xl">
          <div className="space-y-3">
            <div className="p-3.5 rounded-2xl bg-blue-500/10 text-blue-400 w-fit border border-blue-500/20">
              <FolderArchive className="w-7 h-7" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">ESRI Shapefile Bundle</h3>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                Complete packaged ZIP archive containing pure binary <code className="text-cyan-400">.shp</code>, <code className="text-cyan-400">.shx</code>, <code className="text-cyan-400">.dbf</code>, and <code className="text-cyan-400">.prj</code> files.
              </p>
            </div>
            <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800 text-[11px] text-slate-300 space-y-1">
              <div><strong>CRS:</strong> EPSG:4326 (WGS84)</div>
              <div><strong>Compatible with:</strong> ArcGIS, QGIS, GDAL, GeoPandas</div>
            </div>
          </div>

          <a
            href={api.getShpExportUrl(simId)}
            download
            className="w-full py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-xs flex items-center justify-center space-x-2 transition shadow-lg shadow-blue-500/25"
          >
            <Download className="w-4 h-4" />
            <span>Download flood_zones.zip</span>
          </a>
        </div>

        {/* Format 2: Google Earth KML (.kml) */}
        <div className="glass-card p-6 rounded-3xl border border-slate-800 space-y-4 flex flex-col justify-between shadow-xl">
          <div className="space-y-3">
            <div className="p-3.5 rounded-2xl bg-emerald-500/10 text-emerald-400 w-fit border border-emerald-500/20">
              <Map className="w-7 h-7" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Google Earth KML</h3>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                OGC KML 2.2 vector file with stylized risk color tiers (Level 1 Yellow to Level 3 Red) and altitude extrusion.
              </p>
            </div>
            <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800 text-[11px] text-slate-300 space-y-1">
              <div><strong>Styling:</strong> Embedded Hex Color Palettes</div>
              <div><strong>Compatible with:</strong> Google Earth Pro, Web Earth</div>
            </div>
          </div>

          <a
            href={api.getKmlExportUrl(simId)}
            download
            className="w-full py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs flex items-center justify-center space-x-2 transition shadow-lg shadow-emerald-500/25"
          >
            <Download className="w-4 h-4" />
            <span>Download flood_zones.kml</span>
          </a>
        </div>

        {/* Format 3: GeoJSON Standard (.geojson) */}
        <div className="glass-card p-6 rounded-3xl border border-slate-800 space-y-4 flex flex-col justify-between shadow-xl">
          <div className="space-y-3">
            <div className="p-3.5 rounded-2xl bg-purple-500/10 text-purple-400 w-fit border border-purple-500/20">
              <FileCode className="w-7 h-7" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">GeoJSON FeatureCollection</h3>
              <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                RFC 7946 compliant GeoJSON text with full attribute properties (depth, velocity, arrival time).
              </p>
            </div>
            <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-slate-800 text-[11px] text-slate-300 space-y-1">
              <div><strong>Format:</strong> Structured JSON / WGS84</div>
              <div><strong>Compatible with:</strong> MapLibre, Leaflet, Mapbox, Web APIs</div>
            </div>
          </div>

          <a
            href={api.getGeoJsonExportUrl(simId)}
            download
            className="w-full py-3.5 rounded-2xl bg-purple-600 hover:bg-purple-500 text-white font-extrabold text-xs flex items-center justify-center space-x-2 transition shadow-lg shadow-purple-500/25"
          >
            <Download className="w-4 h-4" />
            <span>Download flood_zones.geojson</span>
          </a>
        </div>
      </div>
    </div>
  );
};
