/**
 * SentinelID — Document Storage Module (Google Drive for MVP)
 */

function storeDocumentInDrive(caseId, documentType, fileName, base64Data, mimeType) {
  var folderName = "SentinelID_Verification_Vault";
  var folders = DriveApp.getFoldersByName(folderName);
  var folder;
  
  if (folders.hasNext()) {
    folder = folders.next();
  } else {
    folder = DriveApp.createFolder(folderName);
  }
  
  // Convert base64 data to blob
  var decodedBytes = Utilities.base64Decode(base64Data.split(",")[1] || base64Data);
  var blob = Utilities.newBlob(decodedBytes, mimeType || "image/jpeg", fileName);
  var file = folder.createFile(blob);
  file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  
  var documentId = generateUniqueId("DOC");
  var docObj = {
    document_id: documentId,
    case_id: caseId,
    document_type: documentType || "ID_CARD",
    drive_file_id: file.getId(),
    file_name: fileName,
    mime_type: mimeType || "image/jpeg",
    uploaded_at: new Date().toISOString()
  };
  
  var docSheet = getSheet(CONFIG.SHEETS.DOCUMENTS);
  appendObjectToSheet(docSheet, docObj);
  
  logAuditEvent("SYSTEM", caseId, "DOCUMENT_UPLOAD", "Stored file " + fileName + " in Google Drive [ID: " + file.getId() + "]");
  
  return docObj;
}
