/**
 * ISO 2859-1, General Inspection Level II
 * Map Batch Size -> Sample Size
 */
export function getCalculatedSampleSize(batchSize) {
  const size = Number(batchSize);
  if (isNaN(size) || size <= 0) return 0;
  
  if (size >= 1 && size <= 8) return Math.min(size, 2);
  if (size >= 9 && size <= 15) return 3;
  if (size >= 16 && size <= 25) return 5;
  if (size >= 26 && size <= 50) return 8;
  if (size >= 51 && size <= 90) return 13;
  if (size >= 91 && size <= 150) return 20;
  if (size >= 151 && size <= 280) return 32;
  if (size >= 281 && size <= 500) return 50;
  if (size >= 501 && size <= 1200) return 80;
  if (size >= 1201 && size <= 3200) return 125;
  if (size >= 3201 && size <= 10000) return 200;
  if (size >= 10001 && size <= 35000) return 315;
  if (size >= 35001 && size <= 150000) return 500;
  if (size >= 150001 && size <= 500000) return 800;
  return 1250; // 500001 and above
}

/**
 * Calculates defect percentages and makes inspection decision.
 * 
 * Rules:
 * 1. Critical AQL = 0%: If any Critical defect > 0 -> REJECT
 * 2. Major AQL = 1%: If Major % > 1% -> HOLD
 * 3. Minor AQL = 4%: If Minor % > 4% -> HOLD
 * 4. Otherwise -> ACCEPT
 */
export function calculateDecision({
  sampleSize,
  criticalDefectsList = [],
  majorDefectsList = [],
  minorDefectsList = []
}) {
  const size = Number(sampleSize);
  if (isNaN(size) || size <= 0) {
    return {
      defectPctCritical: 0,
      defectPctMajor: 0,
      defectPctMinor: 0,
      decision: 'HOLD',
      reason: 'Invalid or zero sample size'
    };
  }

  // Sum counts
  const totalCritical = criticalDefectsList.reduce((sum, d) => sum + (Number(d.count) || 0), 0);
  const totalMajor = majorDefectsList.reduce((sum, d) => sum + (Number(d.count) || 0), 0);
  const totalMinor = minorDefectsList.reduce((sum, d) => sum + (Number(d.count) || 0), 0);

  // Percentage Calculations
  const defectPctCritical = (totalCritical / size) * 100;
  const defectPctMajor = (totalMajor / size) * 100;
  const defectPctMinor = (totalMinor / size) * 100;

  let decision = 'ACCEPT';
  let reason = '';

  // Critical defects: Even 1 defect = REJECT
  if (totalCritical > 0) {
    decision = 'REJECT';
    reason = `Critical defect count (${totalCritical}) exceeds AQL limit (0% / 0 defects allowed).`;
  } 
  // Major defects: limit is 1%
  else if (defectPctMajor > 1) {
    decision = 'HOLD';
    reason = `Major defect percentage (${defectPctMajor.toFixed(2)}%) exceeds limit (1.00%).`;
  } 
  // Minor defects: limit is 4%
  else if (defectPctMinor > 4) {
    decision = 'HOLD';
    reason = `Minor defect percentage (${defectPctMinor.toFixed(2)}%) exceeds limit (4.00%).`;
  }

  return {
    totalCritical,
    totalMajor,
    totalMinor,
    defectPctCritical: Number(defectPctCritical.toFixed(2)),
    defectPctMajor: Number(defectPctMajor.toFixed(2)),
    defectPctMinor: Number(defectPctMinor.toFixed(2)),
    decision,
    reason
  };
}

// Master Defect Definitions
export const DEFECT_SECTIONS = {
  critical: [
    { id: 'c1', label: 'Print Defect in mandatory text', description: 'Mandatory text not legible' },
    { id: 'c2', label: 'Batch Coding / MRP / USP defect', description: 'Misprint, smudged, double coded' },
    { id: 'c3', label: 'Weight outside tolerance', description: 'Avg weight outside limits post stamping' },
    { id: 'c4', label: 'Foreign matter / Separation', description: 'Hair, thread, metal, sedimentation' },
    { id: 'c5', label: 'Color, shade, texture, fragrance mismatch', description: 'Not matching standard' }
  ],
  major: [
    { id: 'mj1', label: 'Fitment and functioning of component', description: 'Cap, seal, brush, pump, tightness' },
    { id: 'mj2', label: 'Locking, cutting, pasting defects', description: 'Wet/dirty cartons' },
    { id: 'mj3', label: 'Scratches, torn/off-center label', description: 'Visible from 1m, glue issues' },
    { id: 'mj4', label: 'Open pack, breakage, loose fitment', description: 'Compact powder, mono-carton, shipper' },
    { id: 'mj5', label: 'Finishing issues, pin holes, sweating', description: 'Lipstick bullets' },
    { id: 'mj6', label: 'Crushed tube, crimping, burning mark', description: 'Distorted pack from 1m' }
  ],
  minor: [
    { id: 'mn1', label: 'Poor BOPP tape application', description: 'Partially open flaps' },
    { id: 'mn2', label: 'Coding / Panel shifting', description: 'NMT 2mm allowed' },
    { id: 'mn3', label: 'Scuffed pack', description: 'Distinctly visible scuff marks' },
    { id: 'mn4', label: 'Outer box flap open without tear', description: 'Poor fibre tear' }
  ]
};
