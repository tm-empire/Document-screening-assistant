/**
 * LAYER 5 — RULE-BASED RISK & DECISION ENGINE (updated for real evidence)
 *
 * This file's SCORING LOGIC did not need a ground-up rewrite — it was already
 * deterministic/rule-based, never simulated. What changed is what it reads:
 *   - Layer 2 liveness is now an object (see layer2_face.js: runLivenessChallenge),
 *     not a fixed "PASS" string, though a bare string is still handled for safety.
 *   - Layer 4 evidence comes from a real government match via API 2, including a
 *     genuine "NOT_FOUND" state, which is treated as moderate risk — NOT an
 *     automatic failure (per Phase 9/13: absence of a record is not proof of fraud).
 *
 * Decision values match Phase 13 exactly: LOW_RISK_PROCEED,
 * SECONDARY_VERIFICATION_RECOMMENDED, MANUAL_REVIEW_REQUIRED.
 *
 * A human officer is always the final decision maker — this engine's output is a
 * recommendation with reasons attached, never a verdict.
 */

export function runLayer5RiskEngine(layer1, layer2, layer3, layer4) {
  let riskScore = 0;
  const reasons = [];
  const overrides = [];

  // --- Layer 1: OCR --------------------------------------------------------------
  const ocrConf = layer1?.ocr_confidence || 0;
  if (ocrConf < 0.5) {
    riskScore += 25;
    reasons.push(`Low OCR confidence (${Math.round(ocrConf * 100)}%) — text fields were difficult to extract.`);
  } else if (ocrConf < 0.75) {
    riskScore += 10;
    reasons.push(`Moderate OCR confidence (${Math.round(ocrConf * 100)}%).`);
  }
  if (layer1?.fallback_fields_used?.length > 0) {
    riskScore += 8 * layer1.fallback_fields_used.length;
    reasons.push(
      `${layer1.fallback_fields_used.length} field(s) could not be read from the document and were taken from officer input instead: ${layer1.fallback_fields_used.join(', ')}.`
    );
  }
  if (layer1?.mrz_conflict) {
    riskScore += 20;
    reasons.push('MRZ fields conflict with the standard OCR-extracted fields.');
    overrides.push('MRZ_CONFLICT');
  }

  // --- Layer 2: Face + liveness ----------------------------------------------------
  if (layer2) {
    const similarity = layer2.similarity_score || 0;
    const isMatch = layer2.match === true;

    if (!layer2.face_detected_document || !layer2.face_detected_live) {
      riskScore += 30;
      reasons.push('Face could not be detected in the document photo and/or the live capture.');
      overrides.push('FACE_NOT_DETECTED');
    } else if (!isMatch || similarity < 0.5) {
      riskScore += 45;
      reasons.push(`Face mismatch: similarity score (${Math.round(similarity * 100)}%) is below the required threshold.`);
      overrides.push('CRITICAL_FACE_MISMATCH');
    } else if (similarity < 0.7) {
      riskScore += 15;
      reasons.push(`Borderline face similarity score (${Math.round(similarity * 100)}%).`);
    }

    const liveness = layer2.liveness;
    const livenessStatus = typeof liveness === 'string' ? liveness : liveness?.liveness_status;
    if (livenessStatus && livenessStatus !== 'PASS' && livenessStatus !== 'NOT_ATTEMPTED') {
      riskScore += livenessStatus === 'FAIL' ? 30 : 15;
      reasons.push(`Liveness check flagged status: ${livenessStatus}.`);
      overrides.push('SUSPICIOUS_LIVENESS');
    }
  } else {
    riskScore += 20;
    reasons.push('Face verification evidence is missing.');
  }

  // --- Layer 3: Forensics -----------------------------------------------------------
  if (layer3) {
    const tampScore = layer3.tampering_score || 0;
    if (layer3.status === 'HIGH_ANOMALY' || tampScore > 0.55) {
      riskScore += 40;
      reasons.push(`High document tampering indicator (${Math.round(tampScore * 100)}%).`);
      overrides.push('CRITICAL_TAMPERING_INDICATOR');
    } else if (layer3.status === 'SUSPICIOUS' || tampScore > 0.3) {
      riskScore += 15;
      reasons.push(`Moderate image tampering indicator (${Math.round(tampScore * 100)}%).`);
    }
  }

  // --- Layer 4: Government match + consistency --------------------------------------
  if (layer4) {
    const gov = layer4.government_match || {};
    const consistency = layer4.data_consistency || {};

    if (!gov.government_record_found) {
      riskScore += 20;
      reasons.push('No matching government record was found in the available verification source.');
    } else {
      if (gov.name_match === false) {
        riskScore += 25;
        reasons.push('Subject name does not match the government record.');
      }
      if (gov.dob_match === false) {
        riskScore += 25;
        reasons.push('Date of birth does not match the government record.');
      }
      if (gov.document_status === 'REVOKED' || gov.document_status === 'CANCELLED') {
        riskScore += 40;
        reasons.push(`Government record indicates document status: ${gov.document_status}.`);
        overrides.push(`CRITICAL_GOVERNMENT_STATUS_${gov.document_status}`);
      } else if (gov.document_status === 'EXPIRED') {
        riskScore += 30;
        reasons.push('Government record indicates the document is expired.');
        overrides.push('CRITICAL_EXPIRED_DOCUMENT');
      }
      if (gov.duplicate_detected) {
        riskScore += 35;
        reasons.push('Duplicate document number detected against the government record.');
        overrides.push('CRITICAL_DUPLICATE_DOCUMENT');
      }
    }

    if (consistency.date_valid === false) {
      riskScore += 20;
      reasons.push("Document expiry date (from OCR) has already passed.");
    }
    if (consistency.duplicate_detected && !overrides.includes('CRITICAL_DUPLICATE_DOCUMENT')) {
      riskScore += 25;
      reasons.push("Duplicate document number detected in this system's own case history.");
      overrides.push('CRITICAL_DUPLICATE_DOCUMENT');
    }
  }

  riskScore = Math.min(100, Math.max(0, riskScore));

  let riskLevel = 'LOW';
  if (riskScore > 60 || overrides.length > 0) riskLevel = 'HIGH';
  else if (riskScore > 30) riskLevel = 'MEDIUM';

  let decision = 'LOW_RISK_PROCEED';
  if (riskLevel === 'HIGH') decision = 'MANUAL_REVIEW_REQUIRED';
  else if (riskLevel === 'MEDIUM') decision = 'SECONDARY_VERIFICATION_RECOMMENDED';

  if (reasons.length === 0) {
    reasons.push('All verification layers passed standard validation criteria based on the available evidence.');
  }

  return {
    risk_score: riskScore,
    risk_level: riskLevel,
    decision,
    reasons,
    overrides,
    disclaimer:
      'Automated analysis based on available evidence. Manual review is recommended before any final determination — this is not a certified identity verification result.',
    generated_at: new Date().toISOString(),
  };
}
