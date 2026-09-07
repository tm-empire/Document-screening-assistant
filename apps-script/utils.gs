/**
 * SentinelID — Utility Functions for Google Apps Script
 */

/**
 * Hash a plaintext password using SHA-256 via Apps Script Utilities.
 * Returns lowercase hex string. Same algorithm used on the frontend.
 *
 * @param {string} password - Plaintext password
 * @returns {string} SHA-256 hex hash
 */
function hashPassword(password) {
  var digest = Utilities.computeDigest(
    Utilities.DigestAlgorithm.SHA_256,
    password,
    Utilities.Charset.UTF_8
  );
  return digest.map(function(b) {
    // Convert signed byte (-128..127) to unsigned (0..255), then to 2-char hex
    return (b < 0 ? b + 256 : b).toString(16).padStart(2, '0');
  }).join('');
}

/**
 * Standard Success Response JSON
 */
function createSuccessResponse(data, message) {
  var output = {
    success: true,
    data: data || {},
    message: message || "Operation completed successfully",
    timestamp: new Date().toISOString()
  };
  return ContentService.createTextOutput(JSON.stringify(output))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * Standard Error Response JSON
 */
function createErrorResponse(error, message, statusCode) {
  var output = {
    success: false,
    error: error || "UNKNOWN_ERROR",
    message: message || "An unexpected error occurred",
    statusCode: statusCode || 400,
    timestamp: new Date().toISOString()
  };
  return ContentService.createTextOutput(JSON.stringify(output))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * Helper to generate unique IDs with prefix
 */
function generateUniqueId(prefix) {
  var p = prefix || "ID";
  var timeStr = new Date().getTime().toString(36).toUpperCase();
  var randStr = Math.random().toString(36).substring(2, 6).toUpperCase();
  return p + "-" + timeStr + "-" + randStr;
}

/**
 * Get sheet by name from active spreadsheet or open by ID
 */
function getSheet(sheetName) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  if (!ss) {
    throw new Error("No active spreadsheet found. Make sure Apps Script is bound to a Google Sheet.");
  }
  var sheet = ss.getSheetByName(sheetName);
  if (!sheet) {
    throw new Error("Sheet '" + sheetName + "' not found. Run setupDatabase() first.");
  }
  return sheet;
}

/**
 * Convert sheet data to array of JSON objects based on headers
 */
function sheetToObjects(sheet) {
  var data = sheet.getDataRange().getValues();
  if (data.length < 2) return [];
  var headers = data[0];
  var rows = data.slice(1);
  
  return rows.map(function(row) {
    var obj = {};
    headers.forEach(function(header, idx) {
      obj[header] = row[idx];
    });
    return obj;
  });
}

/**
 * Append object to sheet based on header order
 */
function appendObjectToSheet(sheet, obj) {
  var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  var row = headers.map(function(header) {
    return obj[header] !== undefined ? obj[header] : "";
  });
  sheet.appendRow(row);
  return obj;
}

/**
 * Parse JSON safely
 */
function parseJson(str) {
  try {
    return JSON.parse(str);
  } catch (e) {
    return null;
  }
}
