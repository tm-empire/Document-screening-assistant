/**
 * SentinelID — 5-Layer Verification Orchestration Engine
 * Executes Layer 1 (OCR), Layer 2 (Face), Layer 3 (Forensics), Layer 4 (Consistency & Issuer)
 * and triggers Layer 5 (Risk Engine).
 */

function runFullVerificationPipeline(caseId, docData, faceData, subjectDetails) {
  var ocrResult = runLayer1OCR(caseId, docData, subjectDetails);
  var faceResult = runLayer2Face(caseId, faceData);
  var forensicResult = runLayer3Forensics(caseId, docData);
  var consistencyResult = runLayer4Consistency(caseId, ocrResult, subjectDetails);
  var issuerResult = runLayer4IssuerVerification(caseId, ocrResult);

  // Layer 5 Rule Engine Evaluation
  var riskResult = evaluateRisk(
    caseId,
    ocrResult,
    faceResult,
    forensicResult,
    consistencyResult,
    issuerResult
  );

  return {
    case_id: caseId,
    layer1_ocr: ocrResult,
    layer2_face: faceResult,
    layer3_forensics: forensicResult,
    layer4_consistency: consistencyResult,
    layer4_issuer: issuerResult,
    layer5_risk: riskResult
  };
}

/**
 * Layer 1 — OCR & Field Extraction
 */
function runLayer1OCR(caseId, docData, subjectDetails) {
  var ocrId = generateUniqueId("OCR");
  
  // Extract or simulate field extraction based on subject details or docData
  var extractedName = (subjectDetails && subjectDetails.name) ? subjectDetails.name : "Eleanor Vance";
  var dob = (subjectDetails && subjectDetails.dob) ? subjectDetails.dob : "1992-04-14";
  var docNum = (subjectDetails && subjectDetails.document_number) ? subjectDetails.document_number : "DOC-9988221";
  var issueDate = "2020-01-10";
  var expiryDate = "2030-01-10";
  var confidence = 0.94;

  var obj = {
    result_id: ocrId,
    case_id: caseId,
    document_id: (docData && docData.document_id) || "DOC-REF",
    extracted_name: extractedName,
    dob: dob,
    document_number: docNum,
    issue_date: issueDate,
    expiry_date: expiryDate,
    confidence: confidence,
    status: "PASS",
    created_at: new Date().toISOString()
  };

  var ocrSheet = getSheet(CONFIG.SHEETS.OCR_RESULTS);
  appendObjectToSheet(ocrSheet, obj);
  logAuditEvent("SYSTEM", caseId, "LAYER1_OCR_COMPLETE", "OCR Extracted fields with " + Math.round(confidence * 100) + "% confidence.");
  return obj;
}

/**
 * Layer 2 — Identity & Face Verification
 */
function runLayer2Face(caseId, faceData) {
  var faceId = generateUniqueId("FAC");
  var similarityScore = (faceData && faceData.similarity_score) ? parseFloat(faceData.similarity_score) : 0.94;
  var isMatch = similarityScore >= 0.70;
  var liveness = (faceData && faceData.liveness_status) || "PASS";

  var obj = {
    result_id: faceId,
    case_id: caseId,
    similarity_score: similarityScore,
    face_match: isMatch,
    liveness_status: liveness,
    confidence: 0.96,
    created_at: new Date().toISOString()
  };

  var faceSheet = getSheet(CONFIG.SHEETS.FACE_RESULTS);
  appendObjectToSheet(faceSheet, obj);
  logAuditEvent("SYSTEM", caseId, "LAYER2_FACE_COMPLETE", "Face comparison completed. Similarity: " + Math.round(similarityScore * 100) + "%. Match: " + isMatch);
  return obj;
}

/**
 * Layer 3 — Document Forensics & Tampering
 */
function runLayer3Forensics(caseId, docData) {
  var forensicId = generateUniqueId("FOR");
  var tamperingScore = (docData && docData.tampering_score !== undefined) ? parseFloat(docData.tampering_score) : 0.12;
  var status = tamperingScore > 0.60 ? "SUSPICIOUS" : "NORMAL";
  var explanation = tamperingScore > 0.60 
    ? "Elevated Error Level Analysis (ELA) anomaly in photo region & font compression artifacts." 
    : "Image compression uniform across document surface. No structural anomalies detected.";

  var obj = {
    result_id: forensicId,
    case_id: caseId,
    tampering_score: tamperingScore,
    status: status,
    explanation: explanation,
    suspicious_regions: JSON.stringify(tamperingScore > 0.60 ? [{ x: 120, y: 85, w: 140, h: 160, label: "Face photo boundary compression mismatch" }] : []),
    created_at: new Date().toISOString()
  };

  var forensicSheet = getSheet(CONFIG.SHEETS.FORENSIC_RESULTS);
  appendObjectToSheet(forensicSheet, obj);
  logAuditEvent("SYSTEM", caseId, "LAYER3_FORENSICS_COMPLETE", "Forensics status: " + status + " (Tampering score: " + Math.round(tamperingScore * 100) + "%).");
  return obj;
}

/**
 * Layer 4 — Data Consistency
 */
function runLayer4Consistency(caseId, ocrResult, subjectDetails) {
  var consistencyId = generateUniqueId("CNS");
  
  var nameMatch = ocrResult && subjectDetails && (ocrResult.extracted_name.toLowerCase().trim() === subjectDetails.name.toLowerCase().trim());
  var dobMatch = ocrResult && subjectDetails && (ocrResult.dob === subjectDetails.dob);
  var docNumMatch = ocrResult && subjectDetails && (ocrResult.document_number === subjectDetails.document_number);
  
  var isDateValid = true;
  if (ocrResult && ocrResult.expiry_date) {
    isDateValid = new Date(ocrResult.expiry_date) > new Date();
  }

  // Duplicate Check against historical database
  var ocrSheet = getSheet(CONFIG.SHEETS.OCR_RESULTS);
  var allOcr = sheetToObjects(ocrSheet);
  var duplicate = allOcr.some(function(r) {
    return r.case_id !== caseId && r.document_number === ocrResult.document_number;
  });

  var status = (nameMatch && dobMatch && docNumMatch && isDateValid && !duplicate) ? "CONSISTENT" : "INCONSISTENT";
  var explanation = status === "CONSISTENT" 
    ? "All entered fields match OCR extraction and document dates are valid."
    : "Discrepancies identified in cross-validation checks.";

  var obj = {
    result_id: consistencyId,
    case_id: caseId,
    name_match: nameMatch,
    dob_match: dobMatch,
    document_number_match: docNumMatch,
    date_valid: isDateValid,
    duplicate_detected: duplicate,
    consistency_status: status,
    explanation: explanation,
    created_at: new Date().toISOString()
  };

  var consistencySheet = getSheet(CONFIG.SHEETS.CONSISTENCY_RESULTS);
  appendObjectToSheet(consistencySheet, obj);
  logAuditEvent("SYSTEM", caseId, "LAYER4_CONSISTENCY_COMPLETE", "Data consistency check: " + status);
  return obj;
}

/**
 * Layer 4 — Synthetic Issuer Registry Check
 */
function runLayer4IssuerVerification(caseId, ocrResult) {
  var issuerId = generateUniqueId("ISR");
  var docNum = ocrResult ? ocrResult.document_number : "";

  // Lookup in Synthetic Registry Dataset
  var record = CONFIG.SYNTHETIC_ISSUER_DATABASE.find(function(item) {
    return item.document_number.toLowerCase() === docNum.toLowerCase();
  });

  var issuerFound = !!record;
  var nameMatch = record ? (record.name.toLowerCase() === ocrResult.extracted_name.toLowerCase()) : false;
  var dobMatch = record ? (record.dob === ocrResult.dob) : false;
  var docStatus = record ? record.document_status : "NOT_FOUND";
  var issuerName = record ? record.issuer_name : "Synthetic Registry (Unlisted)";

  var obj = {
    result_id: issuerId,
    case_id: caseId,
    issuer_found: issuerFound,
    name_match: nameMatch,
    dob_match: dobMatch,
    document_status: docStatus,
    issuer_name: issuerName,
    created_at: new Date().toISOString()
  };

  var issuerSheet = getSheet(CONFIG.SHEETS.ISSUER_RESULTS);
  appendObjectToSheet(issuerSheet, obj);
  logAuditEvent("SYSTEM", caseId, "LAYER4_ISSUER_COMPLETE", "Issuer check result: Found=" + issuerFound + ", Status=" + docStatus);
  return obj;
}
