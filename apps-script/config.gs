/**
 * SentinelID — Apps Script Configuration
 * System-wide constants, sheet names, and synthetic/mock registry data.
 */

var CONFIG = {
  SYSTEM_NAME: "SentinelID 5-Layer Verification System",
  VERSION: "1.0.0-MVP",
  
  // Sheet Names in Google Spreadsheets
  SHEETS: {
    USERS: "USERS",
    VERIFICATION_CASES: "VERIFICATION_CASES",
    DOCUMENTS: "DOCUMENTS",
    OCR_RESULTS: "OCR_RESULTS",
    FACE_RESULTS: "FACE_RESULTS",
    FORENSIC_RESULTS: "FORENSIC_RESULTS",
    CONSISTENCY_RESULTS: "CONSISTENCY_RESULTS",
    ISSUER_RESULTS: "ISSUER_RESULTS",
    RISK_RESULTS: "RISK_RESULTS",
    AUDIT_LOGS: "AUDIT_LOGS"
  },
  
  // Synthetic / Mock Government Identity Registry (Demo Data)
  SYNTHETIC_ISSUER_DATABASE: [
    {
      document_number: "DOC-9988221",
      name: "Eleanor Vance",
      dob: "1992-04-14",
      issue_date: "2020-01-10",
      expiry_date: "2030-01-10",
      document_status: "VALID",
      issuer_name: "National Identity Authority (Synthetic Demo Registry)"
    },
    {
      document_number: "DOC-1029384",
      name: "Marcus Aurelius Brody",
      dob: "1985-11-23",
      issue_date: "2018-05-15",
      expiry_date: "2028-05-15",
      document_status: "VALID",
      issuer_name: "Department of Civil Registration (Synthetic Demo Registry)"
    },
    {
      document_number: "DOC-5544332",
      name: "Sarah Lin",
      dob: "1998-09-02",
      issue_date: "2015-08-01",
      expiry_date: "2023-08-01", // Expired
      document_status: "EXPIRED",
      issuer_name: "State Registry Office (Synthetic Demo Registry)"
    },
    {
      document_number: "DOC-7711223",
      name: "David Chen",
      dob: "1990-12-05",
      issue_date: "2021-03-20",
      expiry_date: "2031-03-20",
      document_status: "REVOKED",
      issuer_name: "National Identity Authority (Synthetic Demo Registry)"
    }
  ],

  // Default User Roles
  ROLES: {
    ADMIN: "ADMIN",
    OFFICER: "OFFICER",
    SUPERVISOR: "SUPERVISOR"
  }
};
