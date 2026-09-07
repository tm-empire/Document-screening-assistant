/**
 * SentinelID — Google Sheets Database Initializer
 * Run this function once in Google Apps Script Editor to set up the 10 sheets and headers.
 */

function setupDatabase() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  if (!ss) {
    Logger.log("Error: Must run inside an active Google Spreadsheet bound script.");
    return "Error: No active spreadsheet.";
  }

  // 10 Sheets definition with exact required columns
  var schemas = [
    {
      name: "USERS",
      headers: ["user_id", "name", "email", "role", "status", "created_at", "last_login"],
      initialData: [
        ["USR-ADMIN-01", "Chief Admin", "admin@sentinel.id", "ADMIN", "ACTIVE", new Date().toISOString(), new Date().toISOString()],
        ["USR-OFFICER-01", "Officer John Smith", "officer@sentinel.id", "OFFICER", "ACTIVE", new Date().toISOString(), new Date().toISOString()],
        ["USR-SUPER-01", "Supervisor Sarah Conner", "supervisor@sentinel.id", "SUPERVISOR", "ACTIVE", new Date().toISOString(), new Date().toISOString()]
      ]
    },
    {
      name: "VERIFICATION_CASES",
      headers: ["case_id", "subject_name", "created_by", "assigned_to", "status", "risk_level", "risk_score", "created_at", "updated_at"],
      initialData: [
        ["VRF-10001", "Eleanor Vance", "officer@sentinel.id", "officer@sentinel.id", "COMPLETED", "LOW", 12, new Date().toISOString(), new Date().toISOString()],
        ["VRF-10002", "Marcus Aurelius Brody", "officer@sentinel.id", "officer@sentinel.id", "MANUAL_REVIEW_REQUIRED", "MEDIUM", 48, new Date().toISOString(), new Date().toISOString()],
        ["VRF-10003", "David Chen", "officer@sentinel.id", "supervisor@sentinel.id", "REJECTED", "HIGH", 88, new Date().toISOString(), new Date().toISOString()]
      ]
    },
    {
      name: "DOCUMENTS",
      headers: ["document_id", "case_id", "document_type", "drive_file_id", "file_name", "mime_type", "uploaded_at"],
      initialData: []
    },
    {
      name: "OCR_RESULTS",
      headers: ["result_id", "case_id", "document_id", "extracted_name", "dob", "document_number", "issue_date", "expiry_date", "confidence", "status", "created_at"],
      initialData: []
    },
    {
      name: "FACE_RESULTS",
      headers: ["result_id", "case_id", "similarity_score", "face_match", "liveness_status", "confidence", "created_at"],
      initialData: []
    },
    {
      name: "FORENSIC_RESULTS",
      headers: ["result_id", "case_id", "tampering_score", "status", "explanation", "suspicious_regions", "created_at"],
      initialData: []
    },
    {
      name: "CONSISTENCY_RESULTS",
      headers: ["result_id", "case_id", "name_match", "dob_match", "document_number_match", "date_valid", "duplicate_detected", "consistency_status", "explanation", "created_at"],
      initialData: []
    },
    {
      name: "ISSUER_RESULTS",
      headers: ["result_id", "case_id", "issuer_found", "name_match", "dob_match", "document_status", "issuer_name", "created_at"],
      initialData: []
    },
    {
      name: "RISK_RESULTS",
      headers: ["result_id", "case_id", "risk_score", "risk_level", "decision", "reasons", "generated_at"],
      initialData: []
    },
    {
      name: "AUDIT_LOGS",
      headers: ["log_id", "user_id", "case_id", "action", "timestamp", "details"],
      initialData: [
        ["LOG-101", "USR-ADMIN-01", "SYSTEM", "DATABASE_INITIALIZED", new Date().toISOString(), "Database initialized with 10 tables."]
      ]
    }
  ];

  schemas.forEach(function(schema) {
    var sheet = ss.getSheetByName(schema.name);
    if (!sheet) {
      sheet = ss.insertSheet(schema.name);
    } else {
      sheet.clear(); // Clear existing formatting/content for clean setup
    }

    // Set headers
    sheet.getRange(1, 1, 1, schema.headers.length).setValues([schema.headers]);
    sheet.getRange(1, 1, 1, schema.headers.length).setFontWeight("bold").setBackground("#1e293b").setFontColor("#f8fafc");

    // Add initial data if present
    if (schema.initialData && schema.initialData.length > 0) {
      sheet.getRange(2, 1, schema.initialData.length, schema.headers.length).setValues(schema.initialData);
    }
  });

  Logger.log("SentinelID Google Sheets Database setup completed successfully.");
  return "Database Setup Completed Successfully!";
}
