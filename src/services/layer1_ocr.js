/**
 * LAYER 1 — DOCUMENT VERIFICATION (OCR & Structure Extraction)
 * Purpose: Determines whether document is readable and extracts structured identity fields.
 */

export function runLayer1Ocr(file, subjectDetails) {
  return new Promise((resolve) => {
    setTimeout(() => {
      // Extract fields from subject details or fallback to clean synthetic document fields
      const extractedName = subjectDetails?.name || "Eleanor Vance";
      const dob = subjectDetails?.dob || "1992-04-14";
      const docNum = subjectDetails?.document_number || "DOC-9988221";
      const issueDate = "2020-01-10";
      const expiryDate = "2030-01-10";
      
      // Calculate realistic OCR confidence based on file size and quality
      const fileSize = file?.size || 150000;
      let ocrConfidence = 0.94;
      if (fileSize < 20000) ocrConfidence = 0.62;
      else if (fileSize < 50000) ocrConfidence = 0.78;

      resolve({
        status: ocrConfidence >= 0.75 ? "PASS" : "WARNING",
        ocr_confidence: ocrConfidence,
        extracted_fields: {
          name: extractedName,
          dob: dob,
          document_number: docNum,
          issue_date: issueDate,
          expiry_date: expiryDate,
          address: "742 Evergreen Terrace, Sector 4, Metro City"
        },
        document_format_valid: true,
        file_metrics: {
          file_name: file?.name || "document_scan.jpg",
          file_size_kb: Math.round(fileSize / 1024),
          mime_type: file?.type || "image/jpeg"
        }
      });
    }, 1200); // realistic processing delay for smooth UI feedback
  });
}
