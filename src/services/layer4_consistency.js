/**
 * LAYER 4 — DATA CONSISTENCY & ISSUER VERIFICATION
 * Purpose: Cross-references OCR extracted fields against officer-entered data,
 * checks validity/expiration, and queries the Synthetic/Mock Government Issuer Registry.
 */

import { MOCK_ISSUER_REGISTRY } from '../data/mockData';

export function runLayer4Consistency(ocrData, subjectDetails, historicalCases = []) {
  return new Promise((resolve) => {
    setTimeout(() => {
      const extracted = ocrData?.extracted_fields || {};
      const enteredName = (subjectDetails?.name || "").toLowerCase().trim();
      const extractedName = (extracted.name || "").toLowerCase().trim();

      const nameMatch = enteredName === extractedName || enteredName.includes(extractedName) || extractedName.includes(enteredName);
      const dobMatch = subjectDetails?.dob === extracted.dob;
      const docNumMatch = subjectDetails?.document_number === extracted.document_number;

      // Expiry Check
      let dateValid = true;
      if (extracted.expiry_date) {
        dateValid = new Date(extracted.expiry_date) > new Date();
      }

      // Duplicate Check in historical database
      const duplicateDetected = historicalCases.some(c => 
        c.subject_name.toLowerCase() === enteredName && c.status === "REJECTED"
      );

      const consistencyStatus = (nameMatch && dobMatch && docNumMatch && dateValid && !duplicateDetected) 
        ? "VERIFIED" 
        : "INCONSISTENT";

      const consistencyExplanation = consistencyStatus === "VERIFIED"
        ? "All extracted fields match officer-entered values seamlessly. Document date structure is valid."
        : "Field discrepancies or expiration issues identified during deterministic cross-validation.";

      // Issuer Registry Query (Synthetic Registry — Demo Data)
      const docNum = subjectDetails?.document_number || extracted.document_number || "";
      const registryRecord = MOCK_ISSUER_REGISTRY.find(r => 
        r.document_number.toLowerCase() === docNum.toLowerCase()
      );

      const issuerFound = !!registryRecord;
      const issuerNameMatch = registryRecord ? (registryRecord.name.toLowerCase() === extractedName) : false;
      const issuerDobMatch = registryRecord ? (registryRecord.dob === extracted.dob) : false;
      const documentStatus = registryRecord ? registryRecord.document_status : "NOT_FOUND";
      const issuerName = registryRecord ? registryRecord.issuer_name : "Synthetic Issuer Registry (Unlisted Record)";

      resolve({
        data_consistency: {
          name_match: nameMatch,
          dob_match: dobMatch,
          document_number_match: docNumMatch,
          date_valid: dateValid,
          duplicate_detected: duplicateDetected,
          status: consistencyStatus,
          explanation: consistencyExplanation
        },
        issuer_verification: {
          issuer_found: issuerFound,
          name_match: issuerNameMatch,
          dob_match: issuerDobMatch,
          document_status: documentStatus,
          issuer_name: issuerName,
          disclaimer: "Mock/Synthetic Registry — Demo Data"
        }
      });
    }, 1300);
  });
}
