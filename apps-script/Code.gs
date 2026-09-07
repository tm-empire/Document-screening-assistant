/**
 * SentinelID — Google Apps Script Web App Entrypoint
 * Handles HTTP GET and POST requests, dispatches actions, and enforces JSON API responses.
 */

function doGet(e) {
  try {
    var params = e ? e.parameter : {};
    var action = params.action;

    if (!action) {
      return createSuccessResponse({
        system: CONFIG.SYSTEM_NAME,
        version: CONFIG.VERSION,
        status: "ONLINE",
        message: "SentinelID Apps Script Web API is operational."
      });
    }

    switch (action) {
      case "getCases":
        return createSuccessResponse(getAllCases(), "Verification cases retrieved.");
      
      case "getCase":
        var caseId = params.case_id;
        if (!caseId) return createErrorResponse("INVALID_PARAM", "Missing required 'case_id' parameter.");
        var details = getCaseDetails(caseId);
        if (!details) return createErrorResponse("CASE_NOT_FOUND", "Verification case not found.", 404);
        return createSuccessResponse(details, "Case details retrieved successfully.");

      case "getUsers":
        return createSuccessResponse(getUsersList(), "User list retrieved.");

      case "getAuditLogs":
        return createSuccessResponse(getAuditLogsList(), "Audit logs retrieved.");

      case "getDashboardStats":
        return createSuccessResponse(calculateDashboardStats(), "Dashboard statistics calculated.");

      case "setupDb":
        var msg = setupDatabase();
        return createSuccessResponse({ result: msg }, "Database setup complete.");

      default:
        return createErrorResponse("INVALID_ACTION", "Action '" + action + "' is not supported for GET.");
    }
  } catch (err) {
    return createErrorResponse("SERVER_ERROR", err.message, 500);
  }
}

function doPost(e) {
  try {
    var postData = {};
    if (e && e.postData && e.postData.contents) {
      postData = parseJson(e.postData.contents) || {};
    }

    var action = postData.action || (e ? e.parameter.action : null);

    if (!action) {
      return createErrorResponse("MISSING_ACTION", "No action specified in request body or query parameter.");
    }

    switch (action) {
      case "login":
        var loginResult = handleLogin(postData.email, postData.role);
        return createSuccessResponse(loginResult, "Authentication successful.");

      case "createCase":
        var newCase = createVerificationCase(postData.data || {}, postData.userEmail);
        return createSuccessResponse(newCase, "Verification case initialized successfully.");

      case "uploadDocument":
        var d = postData.data || {};
        var doc = storeDocumentInDrive(d.case_id, d.document_type, d.file_name, d.base64, d.mime_type);
        return createSuccessResponse(doc, "Document uploaded to Google Drive.");

      case "startVerification":
        var caseId = postData.case_id;
        var docData = postData.doc_data || {};
        var faceData = postData.face_data || {};
        var subjectDetails = postData.subject_details || {};
        var vResult = runFullVerificationPipeline(caseId, docData, faceData, subjectDetails);
        return createSuccessResponse(vResult, "5-Layer verification process completed.");

      case "updateStatus":
        var cId = postData.case_id;
        var status = postData.status;
        var notes = postData.notes;
        var userEmail = postData.userEmail;
        var updated = updateCaseStatus(cId, status, notes, userEmail);
        if (!updated) return createErrorResponse("UPDATE_FAILED", "Failed to update case status.", 404);
        return createSuccessResponse({ case_id: cId, status: status }, "Case status updated.");

      default:
        return createErrorResponse("INVALID_ACTION", "Action '" + action + "' is not supported for POST.");
    }
  } catch (err) {
    return createErrorResponse("SERVER_ERROR", err.message, 500);
  }
}

/**
 * Dashboard Statistics Calculator
 */
function calculateDashboardStats() {
  var cases = getAllCases();
  var total = cases.length;
  var low = cases.filter(function(c) { return c.risk_level === "LOW"; }).length;
  var medium = cases.filter(function(c) { return c.risk_level === "MEDIUM"; }).length;
  var high = cases.filter(function(c) { return c.risk_level === "HIGH"; }).length;
  var pendingReview = cases.filter(function(c) { return c.status === "MANUAL_REVIEW_REQUIRED" || c.status === "PROCESSING"; }).length;

  return {
    total_cases: total,
    low_risk: low,
    medium_risk: medium,
    high_risk: high,
    pending_review: pendingReview,
    recent_cases: cases.slice(-5).reverse()
  };
}
