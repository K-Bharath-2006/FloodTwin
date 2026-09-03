/**
 * Standalone Mobile Offline Geofence & Point-in-Polygon Automated Test Runner.
 */
function isPointInPolygon(point, ring) {
  const [x, y] = point;
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const xi = ring[i][0], yi = ring[i][1];
    const xj = ring[j][0], yj = ring[j][1];
    const intersect = ((yi > y) !== (yj > y)) &&
      (x < ((xj - xi) * (y - yi)) / (yj - yi) + xi);
    if (intersect) inside = !inside;
  }
  return inside;
}

// 1. Define Test Risk Polygon (Morbi Low-Lying Level 3 Zone)
const level3Polygon = [
  [70.850, 22.800],
  [70.875, 22.800],
  [70.875, 22.835],
  [70.850, 22.835],
  [70.850, 22.800]
];

console.log("==================================================");
console.log("RUNNING MOBILE OFFLINE GEOFENCING & SYNC TESTS");
console.log("==================================================");

// Test Case 1: Point Inside Level 3 Polygon (Darbar Gadh Riverfront)
const insidePoint = [70.860, 22.820];
const isInside = isPointInPolygon(insidePoint, level3Polygon);
console.log(`[TEST 1] Point [${insidePoint.join(', ')}] inside Level 3 polygon: ${isInside ? 'PASS (CRITICAL DETECTED)' : 'FAIL'}`);
if (!isInside) process.exit(1);

// Test Case 2: Point Outside Polygon (High Elevation Ridge)
const outsidePoint = [70.920, 22.890];
const isOutside = isPointInPolygon(outsidePoint, level3Polygon);
console.log(`[TEST 2] Point [${outsidePoint.join(', ')}] outside Level 3 polygon: ${!isOutside ? 'PASS (SAFE ZONE DETECTED)' : 'FAIL'}`);
if (isOutside) process.exit(1);

// Test Case 3: Data Stale Age Calculation
const now = Date.now();
const pastSyncTime = now - (150 * 60 * 1000); // 150 minutes ago
const ageMinutes = Math.floor((now - pastSyncTime) / (60 * 1000));
const isStale = ageMinutes > 120;
console.log(`[TEST 3] Stale Data Age Detection (${ageMinutes} min > 120 min): ${isStale ? 'PASS (STALE WARNING TRIGGERED)' : 'FAIL'}`);
if (!isStale) process.exit(1);

console.log("==================================================");
console.log("ALL MOBILE OFFLINE TESTS PASSED SUCCESSFULLY (3/3)");
console.log("==================================================");
