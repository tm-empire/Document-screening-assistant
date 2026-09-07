/**
 * SentinelID — Layer 5: Rule-Based Risk Engine
 * Deterministic evidence aggregator and explainable risk evaluator.
 * NEVER makes an autonomous final decision — produces evidence for human officer.
 */

function evaluateRisk(caseId, ocrResult, faceResult, forensicResult, consistencyResult, issuerResult) {
  var riskScore = 0;
  var reasons = [];
  var overrides = [];
  
  // 1. Layer 1 OCR Confidence Impact
  var ocrConf = ocrResult ? parseFloat(ocrResult.confidence || 0) : 0;
  if (ocrConf < 0.70) {
    riskScore += 25;
    reasons.push("Low OCR confidence (" + Math.round(ocrConf * 100) + "%) — document text difficult to extract.");
  } else if (ocrConf < 0.85) {
    riskScore += 10;
    reasons.push("Moderate OCR confidence (" + Math.round(ocrConf * 100) + "%).");
  }

  // 2. Layer 2 Face Verification Impact
  if (faceResult) {
    var similarity = parseFloat(faceResult.similarity_score || 0);
    var isMatch = faceResult.face_match === true || faceResult.face_match === "true";
    var liveness = faceResult.liveness_status || "PASS";
    
    if (!isMatch || similarity < 0.60) {
      riskScore += 45;
      reasons.push("Face mismatch detected: Similarity score (" + Math.round(similarity * 100) + "%) below threshold.");
      overrides.push("CRITICAL_FACE_MISMATCH");
    } else if (similarity < 0.75) {
      riskScore += 15;
      reasons.push("Borderline face similarity score (" + Math.round(similarity * 100) + "%).");
    }
    
    if (liveness !== "PASS") {
      riskScore += 20;
      reasons.push("Liveness check returned suspicious status (" + liveness + ").");
    }
  } else {
    riskScore += 20;
    reasons.push("Face verification evidence missing.");
  }

  // 3. Layer 3 Document Forensics & Tampering Impact
  if (forensicResult) {
    var tampScore = parseFloat(forensicResult.tampering_score || 0);
    if (tampScore > 0.70) {
      riskScore += 40;
      reasons.push("High document tampering indicator detected (" + Math.round(tampScore * 100) + "%). Explanation: " + (forensicResult.explanation || "Anomalies found."));
      overrides.push("CRITICAL_TAMPERING_INDICATOR");
    } else if (tampScore > 0.40) {
      riskScore += 15;
      reasons.push("Moderate image tampering score (" + Math.round(tampScore * 100) + "%).");
    }
  }

  // 4. Layer 4 Data Consistency & Issuer Verification Impact
  if (consistencyResult) {
    if (consistencyResult.name_match === false || consistencyResult.name_match === "false") {
      riskScore += 25;
      reasons.push("Subject name mismatch between extracted OCR and officer input.");
    }
    if (consistencyResult.dob_match === false || consistencyResult.dob_match === "false") {
      riskScore += 25;
      reasons.push("Date of birth mismatch detected.");
    }
    if (consistencyResult.date_valid === false || consistencyResult.date_valid === "false") {
      riskScore += 30;
      reasons.push("Document is expired or has an invalid date structure.");
      overrides.push("CRITICAL_EXPIRED_DOCUMENT");
    }
    if (consistencyResult.duplicate_detected === true || consistencyResult.duplicate_detected === "true") {
      riskScore += 35;
      reasons.push("Duplicate document number detected in historical registry.");
      overrides.push("CRITICAL_DUPLICATE_DOCUMENT");
    }
  }

  if (issuerResult) {
    if (issuerResult.issuer_found === false || issuerResult.issuer_found === "false") {
      riskScore += 20;
      reasons.push("Document number not located in Synthetic Issuer Registry (Demo Data).");
    } else if (issuerResult.document_status !== "VALID") {
      riskScore += 35;
      reasons.push("Issuer registry indicates document status is " + issuerResult.document_status + ".");
      overrides.push("CRITICAL_ISSUER_STATUS_" + issuerResult.document_status);
    }
  }

  // Cap risk score between 0 and 100
  riskScore = Math.min(100, Math.max(0, riskScore));

  // Determine Risk Level (0-30 = LOW, 31-60 = MEDIUM, 61-100 = HIGH)
  var riskLevel = "LOW";
  if (riskScore > 60 || overrides.length > 0) {
    riskLevel = "HIGH";
  } else if (riskScore > 30) {
    riskLevel = "MEDIUM";
  }

  // Recommended Decision
  var decision = "LOW_RISK_PROCEED";
  if (riskLevel === "HIGH") {
    decision = "MANUAL_REVIEW_REQUIRED";
  } else if (riskLevel === "MEDIUM") {
    decision = "SECONDARY_VERIFICATION_RECOMMENDED";
  }

  if (reasons.length === 0) {
    reasons.push("All 4 layer checks passed standard threshold criteria with high confidence.");
  }

  var resultObj = {
    result_id: generateUniqueId("RSK"),
    case_id: caseId,
    risk_score: riskScore,
    risk_level: riskLevel,
    decision: decision,
    reasons: JSON.stringify(reasons),
    generated_at: new Date().toISOString()
  };

  var riskSheet = getSheet(CONFIG.SHEETS.RISK_RESULTS);
  appendObjectToSheet(riskSheet, resultObj);

  // Update overall case record
  updateCaseStatusAndRisk(caseId, decision, riskLevel, riskScore);

  logAuditEvent("SYSTEM", caseId, "GENERATE_RISK", "Layer 5 Risk Engine calculated Score: " + riskScore + ", Level: " + riskLevel + ", Decision: " + decision);

  return {
    result_id: resultObj.result_id,
    case_id: caseId,
    risk_score: riskScore,
    risk_level: riskLevel,
    decision: decision,
    reasons: reasons,
    overrides: overrides,
    generated_at: resultObj.generated_at
  };
}

function updateCaseStatusAndRisk(caseId, status, riskLevel, riskScore) {
  var casesSheet = getSheet(CONFIG.SHEETS.VERIFICATION_CASES);
  var data = casesSheet.getDataRange().getValues();
  var headers = data[0];
  var caseIdIdx = headers.indexOf("case_id");
  var statusIdx = headers.indexOf("status");
  var levelIdx = headers.indexOf("risk_level");
  var scoreIdx = headers.indexOf("risk_score");
  var updatedAtIdx = headers.indexOf("updated_at");

  for (var i = 1; i < data.length; i++) {
    if (data[i][caseIdIdx] === caseId) {
      casesSheet.getRange(i + 1, statusIdx + 1).setValue(status);
      casesSheet.getRange(i + 1, levelIdx + 1).setValue(riskLevel);
      casesSheet.getRange(i + 1, scoreIdx + 1).setValue(riskScore);
      casesSheet.getRange(i + 1, updatedAtIdx + 1).setValue(new Date().toISOString());
      break;
    }
  }
}
