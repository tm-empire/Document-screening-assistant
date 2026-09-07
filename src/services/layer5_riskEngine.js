/**
 * LAYER 5 — RULE-BASED RISK & DECISION ENGINE
 * Purpose: Aggregates evidence from Layers 1-4 and computes transparent risk metrics.
 * 
 * IMPORTANT ARCHITECTURAL RULE:
 * This engine NEVER says "AI detected a fake person".
 * It states: "Automated analysis identified suspicious evidence. Manual review is recommended."
 * Human officer is ALWAYS the final decision maker.
 */

export function runLayer5RiskEngine(layer1, layer2, layer3, layer4) {
  let riskScore = 0;
  const reasons = [];
  const overrides = [];

  // 1. Layer 1 OCR Confidence Impact
  const ocrConf = layer1?.ocr_confidence || 0;
  if (ocrConf < 0.70) {
    riskScore += 25;
    reasons.push(`Low OCR confidence (${Math.round(ocrConf * 100)}%) — text fields difficult to extract.`);
  } else if (ocrConf < 0.85) {
    riskScore += 10;
    reasons.push(`Moderate OCR confidence (${Math.round(ocrConf * 100)}%).`);
  }

  // 2. Layer 2 Face Verification Impact
  if (layer2) {
    const similarity = layer2.similarity_score || 0;
    const isMatch = layer2.match === true;
    const liveness = layer2.liveness || "PASS";

    if (!isMatch || similarity < 0.60) {
      riskScore += 45;
      reasons.push(`Face mismatch detected: Similarity score (${Math.round(similarity * 100)}%) below required threshold.`);
      overrides.push("CRITICAL_FACE_MISMATCH");
    } else if (similarity < 0.75) {
      riskScore += 15;
      reasons.push(`Borderline face similarity score (${Math.round(similarity * 100)}%).`);
    }

    if (liveness !== "PASS") {
      riskScore += 20;
      reasons.push(`Liveness check flagged suspicious status (${liveness}).`);
      overrides.push("SUSPICIOUS_LIVENESS");
    }
  } else {
    riskScore += 20;
    reasons.push("Face verification evidence missing.");
  }

  // 3. Layer 3 Document Forensics & Tampering Impact
  if (layer3) {
    const tampScore = layer3.tampering_score || 0;
    if (tampScore > 0.60) {
      riskScore += 40;
      reasons.push(`High document tampering indicator (${Math.round(tampScore * 100)}%). Explanation: ${layer3.explanation}`);
      overrides.push("CRITICAL_TAMPERING_INDICATOR");
    } else if (tampScore > 0.35) {
      riskScore += 15;
      reasons.push(`Moderate image tampering indicator (${Math.round(tampScore * 100)}%).`);
    }
  }

  // 4. Layer 4 Data Consistency & Issuer Registry Impact
  if (layer4) {
    const consistency = layer4.data_consistency || {};
    const issuer = layer4.issuer_verification || {};

    if (consistency.name_match === false) {
      riskScore += 25;
      reasons.push("Subject name mismatch between extracted OCR and officer input.");
    }
    if (consistency.dob_match === false) {
      riskScore += 25;
      reasons.push("Date of birth mismatch detected.");
    }
    if (consistency.date_valid === false) {
      riskScore += 30;
      reasons.push("Document is expired or has an invalid date structure.");
      overrides.push("CRITICAL_EXPIRED_DOCUMENT");
    }
    if (consistency.duplicate_detected === true) {
      riskScore += 35;
      reasons.push("Duplicate document number detected in historical registry.");
      overrides.push("CRITICAL_DUPLICATE_DOCUMENT");
    }

    if (issuer.issuer_found === false) {
      riskScore += 20;
      reasons.push("Document number not located in Synthetic Issuer Registry (Demo Data).");
    } else if (issuer.document_status !== "VALID") {
      riskScore += 35;
      reasons.push(`Synthetic Issuer Registry indicates document status is ${issuer.document_status}.`);
      overrides.push(`CRITICAL_ISSUER_STATUS_${issuer.document_status}`);
    }
  }

  // Cap score range [0, 100]
  riskScore = Math.min(100, Math.max(0, riskScore));

  // Determine Risk Level (0-30 = LOW, 31-60 = MEDIUM, 61-100 = HIGH)
  let riskLevel = "LOW";
  if (riskScore > 60 || overrides.length > 0) {
    riskLevel = "HIGH";
  } else if (riskScore > 30) {
    riskLevel = "MEDIUM";
  }

  // Recommended Action
  let decision = "AUTO_APPROVE_RECOMMENDED";
  if (riskLevel === "HIGH") {
    decision = "MANUAL_REVIEW_REQUIRED";
  } else if (riskLevel === "MEDIUM") {
    decision = "SECONDARY_VERIFICATION_RECOMMENDED";
  }

  if (reasons.length === 0) {
    reasons.push("All 4 verification layers passed standard validation criteria with high confidence.");
  }

  return {
    risk_score: riskScore,
    risk_level: riskLevel,
    decision: decision,
    reasons: reasons,
    overrides: overrides,
    disclaimer: "Automated analysis identified evidence. Manual review is recommended before final determination.",
    generated_at: new Date().toISOString()
  };
}
