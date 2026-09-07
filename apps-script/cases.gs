/**
 * SentinelID — Cases Management Module
 */

function createVerificationCase(data, currentUserEmail) {
  var casesSheet = getSheet(CONFIG.SHEETS.VERIFICATION_CASES);
  var caseId = generateUniqueId("VRF");
  var now = new Date().toISOString();
  
  var newCase = {
    case_id: caseId,
    subject_name: data.subject_name || "Unknown Subject",
    created_by: currentUserEmail || "officer@sentinel.id",
    assigned_to: data.assigned_to || currentUserEmail || "officer@sentinel.id",
    status: "PROCESSING",
    risk_level: "PENDING",
    risk_score: 0,
    created_at: now,
    updated_at: now
  };
  
  appendObjectToSheet(casesSheet, newCase);
  logAuditEvent(currentUserEmail || "SYSTEM", caseId, "CREATE_CASE", "Created verification case for " + newCase.subject_name);
  
  return newCase;
}

function getCaseDetails(caseId) {
  var casesSheet = getSheet(CONFIG.SHEETS.VERIFICATION_CASES);
  var cases = sheetToObjects(casesSheet);
  var caseItem = cases.find(function(c) { return c.case_id === caseId; });
  
  if (!caseItem) return null;

  // Retrieve layer outputs
  var docSheet = getSheet(CONFIG.SHEETS.DOCUMENTS);
  var ocrSheet = getSheet(CONFIG.SHEETS.OCR_RESULTS);
  var faceSheet = getSheet(CONFIG.SHEETS.FACE_RESULTS);
  var forensicSheet = getSheet(CONFIG.SHEETS.FORENSIC_RESULTS);
  var consistencySheet = getSheet(CONFIG.SHEETS.CONSISTENCY_RESULTS);
  var issuerSheet = getSheet(CONFIG.SHEETS.ISSUER_RESULTS);
  var riskSheet = getSheet(CONFIG.SHEETS.RISK_RESULTS);
  
  var documents = sheetToObjects(docSheet).filter(function(d) { return d.case_id === caseId; });
  var ocr = sheetToObjects(ocrSheet).find(function(r) { return r.case_id === caseId; });
  var face = sheetToObjects(faceSheet).find(function(r) { return r.case_id === caseId; });
  var forensics = sheetToObjects(forensicSheet).find(function(r) { return r.case_id === caseId; });
  var consistency = sheetToObjects(consistencySheet).find(function(r) { return r.case_id === caseId; });
  var issuer = sheetToObjects(issuerSheet).find(function(r) { return r.case_id === caseId; });
  var risk = sheetToObjects(riskSheet).find(function(r) { return r.case_id === caseId; });

  return {
    case: caseItem,
    documents: documents,
    layer1_ocr: ocr || null,
    layer2_face: face || null,
    layer3_forensics: forensics || null,
    layer4_consistency: consistency || null,
    layer4_issuer: issuer || null,
    layer5_risk: risk || null
  };
}

function getAllCases() {
  var casesSheet = getSheet(CONFIG.SHEETS.VERIFICATION_CASES);
  return sheetToObjects(casesSheet);
}

function updateCaseStatus(caseId, status, officerNotes, currentUserEmail) {
  var casesSheet = getSheet(CONFIG.SHEETS.VERIFICATION_CASES);
  var data = casesSheet.getDataRange().getValues();
  var headers = data[0];
  var caseIdIdx = headers.indexOf("case_id");
  var statusIdx = headers.indexOf("status");
  var updatedAtIdx = headers.indexOf("updated_at");

  for (var i = 1; i < data.length; i++) {
    if (data[i][caseIdIdx] === caseId) {
      casesSheet.getRange(i + 1, statusIdx + 1).setValue(status);
      casesSheet.getRange(i + 1, updatedAtIdx + 1).setValue(new Date().toISOString());
      logAuditEvent(currentUserEmail || "OFFICER", caseId, "UPDATE_STATUS", "Status updated to " + status + ". Notes: " + (officerNotes || "None"));
      return true;
    }
  }
  return false;
}
