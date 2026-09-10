/**
 * VERIFICATION ORCHESTRATOR — runs the real 5-layer pipeline end to end, then
 * persists each layer's result (Phase 11: never lose intermediate evidence).
 *
 * This matches the target architecture: Layers 1-3 run locally in the browser
 * against actual pixels, Layer 4 calls out to API 2 (government synthetic source),
 * and Layer 5 is a local deterministic risk calculation. This file does not know
 * or care whether persistence goes to API 1 or to local storage — that decision
 * is injected via `persistLayerResult` by the caller (src/services/api.js or
 * src/services/mockBackend.js), which keeps this file free of any dependency on
 * how/where results are stored.
 *
 * Nothing here is simulated: every layer function is the real implementation.
 */

import { runLayer1Ocr } from './layer1_ocr';
import { runLayer2Face, runLivenessChallenge } from './layer2_face';
import { runLayer3Forensics } from './layer3_forensics';
import { runLayer4Consistency } from './layer4_consistency';
import { runLayer5RiskEngine } from './layer5_riskEngine';

/**
 * @param {object} params
 * @param {string} params.caseId
 * @param {File} params.docFile - the uploaded identity document image
 * @param {File} params.liveFaceFile - the live selfie capture
 * @param {Array} [params.livenessFrames] - optional landmark-snapshot sequence from a challenge-response UI
 * @param {object} params.subjectDetails - officer-entered identity fields (name/dob/document_number/etc.)
 * @param {Array} [params.historicalCases] - prior cases from API 1, used for local duplicate detection
 * @param {function} [params.onProgress] - ({ stage, percent }) => void
 * @param {function} [params.persistLayerResult] - async (caseId, layerName, result) => void
 */
export async function runVerificationPipeline({
  caseId,
  docFile,
  liveFaceFile,
  livenessFrames,
  subjectDetails,
  historicalCases = [],
  onProgress,
  persistLayerResult,
}) {
  const report = (stage, percent) => onProgress?.({ stage, percent });

  report('ocr', 0);
  const layer1 = await runLayer1Ocr(docFile, subjectDetails, (p) => report('ocr', p));
  await persistLayerResult?.(caseId, 'layer1_ocr', layer1);
  report('ocr', 100);

  report('face', 0);
  const faceResult = await runLayer2Face(docFile, liveFaceFile);
  const liveness =
    livenessFrames?.length > 0
      ? runLivenessChallenge(livenessFrames)
      : {
          liveness_status: 'NOT_ATTEMPTED',
          liveness_score: 0,
          challenges_completed: [],
          frames_analyzed: 0,
          explanation: 'No liveness challenge frames were captured for this verification.',
        };
  const layer2 = { ...faceResult, liveness };
  await persistLayerResult?.(caseId, 'layer2_face', layer2);
  report('face', 100);

  report('forensics', 0);
  const layer3 = await runLayer3Forensics(docFile, layer1);
  await persistLayerResult?.(caseId, 'layer3_forensics', layer3);
  report('forensics', 100);

  report('government', 0);
  const layer4 = await runLayer4Consistency(layer1, subjectDetails, historicalCases);
  await persistLayerResult?.(caseId, 'layer4_government', layer4);
  report('government', 100);

  report('risk', 0);
  const layer5 = runLayer5RiskEngine(layer1, layer2, layer3, layer4);
  await persistLayerResult?.(caseId, 'layer5_risk', layer5);
  report('risk', 100);

  return {
    case_id: caseId,
    document: {
      file_name: docFile?.name || null,
      document_type: subjectDetails?.document_type || null,
    },
    layer1_ocr: layer1,
    layer2_face: layer2,
    layer3_forensics: layer3,
    layer4_government: layer4,
    layer5_risk: layer5,
  };
}
