/**
 * LAYER 2 — IDENTITY / FACE VERIFICATION
 * Purpose: Compare document photo with live captured face photo and compute similarity score.
 */

export function runLayer2Face(docPhotoFile, liveFaceFile, simulatedScenario = 'NORMAL') {
  return new Promise((resolve) => {
    setTimeout(() => {
      let similarityScore = 0.94;
      let faceDetected = true;
      let livenessStatus = "PASS";

      if (simulatedScenario === 'FACE_MISMATCH') {
        similarityScore = 0.38;
      } else if (simulatedScenario === 'LOW_SIMILARITY') {
        similarityScore = 0.64;
      } else if (simulatedScenario === 'SPOOF_SUSPECTED') {
        livenessStatus = "FLAGGED_SPOOF";
        similarityScore = 0.88;
      }

      const match = similarityScore >= 0.70 && livenessStatus === "PASS";

      resolve({
        face_detected: faceDetected,
        similarity_score: similarityScore,
        match: match,
        liveness: livenessStatus,
        confidence: 0.96,
        face_bounding_box: { x: 140, y: 60, width: 120, height: 140 },
        explanation: match
          ? "High facial feature correlation between ID document photo and live selfie capture."
          : `Facial similarity score (${Math.round(similarityScore * 100)}%) is below standard verification threshold (70%).`
      });
    }, 1400);
  });
}
