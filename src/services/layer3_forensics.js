/**
 * LAYER 3 — DOCUMENT FORENSICS / TAMPERING DETECTION
 * Purpose: Analyzes compression error levels, font anomalies, copy-paste artifacts, and metadata.
 */

export function runLayer3Forensics(docFile, simulatedScenario = 'NORMAL') {
  return new Promise((resolve) => {
    setTimeout(() => {
      let tamperingScore = 0.12;
      let suspiciousRegions = [];
      let explanation = "Image compression levels are uniform across all document quadrants. No copy-paste edge discontinuities detected.";

      if (simulatedScenario === 'TAMPERED') {
        tamperingScore = 0.78;
        suspiciousRegions = [
          { x: 120, y: 75, width: 130, height: 150, label: "Face photo boundary compression mismatch" },
          { x: 280, y: 190, width: 140, height: 40, label: "Font edge artifact (DOB field)" }
        ];
        explanation = "Error Level Analysis (ELA) identified high compression variance in photo sub-region and inconsistent noise floor near DOB text.";
      } else if (simulatedScenario === 'MODERATE_ANOMALY') {
        tamperingScore = 0.44;
        suspiciousRegions = [
          { x: 250, y: 240, width: 110, height: 35, label: "Slight metadata timestamp anomaly" }
        ];
        explanation = "Minor metadata timestamp deviation detected between EXIF tag and file modification date.";
      }

      const status = tamperingScore > 0.60 ? "SUSPICIOUS" : (tamperingScore > 0.35 ? "WARNING" : "NORMAL");

      resolve({
        status: status,
        tampering_score: tamperingScore,
        suspicious_regions: suspiciousRegions,
        explanation: explanation,
        ela_metrics: {
          error_level_variance: tamperingScore > 0.60 ? 0.84 : 0.18,
          metadata_exif_valid: tamperingScore < 0.60,
          compression_quality_estimate: "92%"
        }
      });
    }, 1500);
  });
}
