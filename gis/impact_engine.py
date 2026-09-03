from typing import Dict, Any, List, Optional
import numpy as np
from shapely.geometry import shape, Point, LineString, Polygon, MultiPolygon
from shapely.ops import unary_union
import logging

logger = logging.getLogger(__name__)

class ImpactAnalysisEngine:
    """
    Infrastructure Exposure and Population Impact Engine.
    
    CRITICAL PRINCIPLE:
    Overlays flood polygons with infrastructure layers and calculates strictly
    EXPOSURE metrics. Never claims exposed structures are physically destroyed.
    """

    def analyze_exposure(
        self,
        risk_zones: Dict[str, Any],
        infrastructure_data: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Calculates spatial intersections between risk polygons and infrastructure elements.
        """
        # Build Shapely union for all flooded zones (Level 1, 2, 3)
        risk_polys = {}
        all_flooded_geoms = []

        for level_key in ["LEVEL_3_CRITICAL", "LEVEL_2_HIGH_RISK", "LEVEL_1_WARNING"]:
            zone_info = risk_zones.get(level_key)
            if zone_info and zone_info.get("geometry"):
                poly_geom = shape(zone_info["geometry"])
                if not poly_geom.is_empty:
                    risk_polys[level_key] = poly_geom
                    all_flooded_geoms.append(poly_geom)

        total_flood_union = unary_union(all_flooded_geoms) if all_flooded_geoms else Polygon([])

        # Extract infrastructure layers
        buildings = infrastructure_data.get("buildings", [])
        roads = infrastructure_data.get("roads", [])
        bridges = infrastructure_data.get("bridges", [])
        schools = infrastructure_data.get("schools", [])
        hospitals = infrastructure_data.get("hospitals", [])
        agriculture_polys = infrastructure_data.get("agriculture", [])

        # 1. Buildings Exposure
        exposed_buildings = 0
        exposed_population = 0
        buildings_by_level = {"LEVEL_3": 0, "LEVEL_2": 0, "LEVEL_1": 0}

        for bldg in buildings:
            loc = bldg.get("location") or [bldg.get("lon"), bldg.get("lat")]
            pt = Point(loc[0], loc[1])
            if total_flood_union.contains(pt):
                exposed_buildings += 1
                occupants = bldg.get("estimated_occupants", 4.5)
                exposed_population += occupants

                if "LEVEL_3_CRITICAL" in risk_polys and risk_polys["LEVEL_3_CRITICAL"].contains(pt):
                    buildings_by_level["LEVEL_3"] += 1
                elif "LEVEL_2_HIGH_RISK" in risk_polys and risk_polys["LEVEL_2_HIGH_RISK"].contains(pt):
                    buildings_by_level["LEVEL_2"] += 1
                else:
                    buildings_by_level["LEVEL_1"] += 1

        # 2. Roads Exposure (Length in km)
        exposed_roads_km = 0.0
        for road in roads:
            geom_data = road.get("geometry")
            if geom_data:
                line = shape(geom_data)
                if line.intersects(total_flood_union):
                    intersected_seg = line.intersection(total_flood_union)
                    # Rough conversion of degrees to km (~111 km per deg)
                    exposed_roads_km += intersected_seg.length * 111.0

        # 3. Bridges Exposure
        exposed_bridges = 0
        for brg in bridges:
            loc = brg.get("location") or [brg.get("lon"), brg.get("lat")]
            pt = Point(loc[0], loc[1])
            if total_flood_union.contains(pt):
                exposed_bridges += 1

        # 4. Critical Facilities Exposure (Schools & Hospitals)
        critical_facilities_exposed = []
        for sch in schools:
            loc = sch.get("location") or [sch.get("lon"), sch.get("lat")]
            pt = Point(loc[0], loc[1])
            if total_flood_union.contains(pt):
                critical_facilities_exposed.append({
                    "name": sch.get("name", "Local School"),
                    "type": "School / Educational Facility",
                    "latitude": loc[1],
                    "longitude": loc[0],
                    "risk_tier": "LEVEL_3_CRITICAL" if ("LEVEL_3_CRITICAL" in risk_polys and risk_polys["LEVEL_3_CRITICAL"].contains(pt)) else "LEVEL_2_HIGH_RISK",
                    "status": "EXPOSED"
                })

        for hosp in hospitals:
            loc = hosp.get("location") or [hosp.get("lon"), hosp.get("lat")]
            pt = Point(loc[0], loc[1])
            if total_flood_union.contains(pt):
                critical_facilities_exposed.append({
                    "name": hosp.get("name", "District Hospital"),
                    "type": "Hospital / Healthcare Center",
                    "latitude": loc[1],
                    "longitude": loc[0],
                    "risk_tier": "LEVEL_3_CRITICAL" if ("LEVEL_3_CRITICAL" in risk_polys and risk_polys["LEVEL_3_CRITICAL"].contains(pt)) else "LEVEL_2_HIGH_RISK",
                    "status": "EXPOSED"
                })

        # 5. Agriculture Exposure
        exposed_agri_sqkm = 0.0
        for agri in agriculture_polys:
            geom_data = agri.get("geometry")
            if geom_data:
                ag_poly = shape(geom_data)
                if ag_poly.intersects(total_flood_union):
                    inter = ag_poly.intersection(total_flood_union)
                    # Convert deg^2 to km^2 (~111^2 = 12321)
                    exposed_agri_sqkm += inter.area * 12321.0

        return {
            "exposed_buildings_count": exposed_buildings,
            "exposed_roads_length_km": round(exposed_roads_km, 2),
            "exposed_bridges_count": exposed_bridges,
            "exposed_schools_count": len(schools),
            "exposed_hospitals_count": len(hospitals),
            "exposed_population_estimate": int(exposed_population),
            "exposed_agriculture_sqkm": round(exposed_agri_sqkm, 2),
            "critical_facilities_list": critical_facilities_exposed,
            "exposure_by_risk_level": {
                "level_3_critical_buildings": buildings_by_level["LEVEL_3"],
                "level_2_high_risk_buildings": buildings_by_level["LEVEL_2"],
                "level_1_warning_buildings": buildings_by_level["LEVEL_1"]
            },
            "summary_report": {
                "status": "ANALYZED",
                "methodology": "Vector Geometric Overlay Intersect (EPSG:4326)",
                "disclaimer": "Metrics represent spatial exposure within inundation zones. Physical structural damage requires separate structural vulnerability assessment."
            }
        }
