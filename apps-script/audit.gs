/**
 * SentinelID — Audit Logging Module
 */

function logAuditEvent(userId, caseId, action, details) {
  try {
    var auditSheet = getSheet(CONFIG.SHEETS.AUDIT_LOGS);
    var logObj = {
      log_id: generateUniqueId("LOG"),
      user_id: userId || "SYSTEM",
      case_id: caseId || "GENERAL",
      action: action,
      timestamp: new Date().toISOString(),
      details: typeof details === "object" ? JSON.stringify(details) : String(details)
    };
    appendObjectToSheet(auditSheet, logObj);
    return logObj;
  } catch (e) {
    Logger.log("Audit log failed: " + e.message);
  }
}

function getAuditLogsList() {
  var auditSheet = getSheet(CONFIG.SHEETS.AUDIT_LOGS);
  var logs = sheetToObjects(auditSheet);
  // Sort descending by timestamp
  return logs.sort(function(a, b) {
    return new Date(b.timestamp) - new Date(a.timestamp);
  });
}
