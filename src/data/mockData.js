/**
 * Synthetic Demo Datasets & System Constants
 * Clearly labeled as Demo Data per requirement #2 & #14.
 */

export const MOCK_ISSUER_REGISTRY = [
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
];

export const MOCK_INITIAL_CASES = [
  {
    case_id: "VRF-10001",
    subject_name: "Eleanor Vance",
    created_by: "officer@sentinel.id",
    assigned_to: "officer@sentinel.id",
    status: "APPROVED",
    risk_level: "LOW",
    risk_score: 12,
    created_at: "2026-09-06T10:15:00.000Z",
    updated_at: "2026-09-06T10:20:00.000Z"
  },
  {
    case_id: "VRF-10002",
    subject_name: "Marcus Aurelius Brody",
    created_by: "officer@sentinel.id",
    assigned_to: "officer@sentinel.id",
    status: "MANUAL_REVIEW_REQUIRED",
    risk_level: "MEDIUM",
    risk_score: 48,
    created_at: "2026-09-07T08:30:00.000Z",
    updated_at: "2026-09-07T08:35:00.000Z"
  },
  {
    case_id: "VRF-10003",
    subject_name: "David Chen",
    created_by: "officer@sentinel.id",
    assigned_to: "supervisor@sentinel.id",
    status: "REJECTED",
    risk_level: "HIGH",
    risk_score: 88,
    created_at: "2026-09-07T14:10:00.000Z",
    updated_at: "2026-09-07T14:45:00.000Z"
  }
];

export const MOCK_USERS = [
  {
    user_id: "USR-ADMIN-01",
    name: "Chief Admin",
    email: "admin@sentinel.id",
    password_hash: "sentinel123",
    role: "ADMIN",
    status: "ACTIVE",
    created_at: "2026-01-01T00:00:00.000Z",
    last_login: "2026-09-07T22:00:00.000Z"
  },
  {
    user_id: "USR-OFFICER-01",
    name: "Officer John Smith",
    email: "officer@sentinel.id",
    password_hash: "sentinel123",
    role: "OFFICER",
    status: "ACTIVE",
    created_at: "2026-01-15T00:00:00.000Z",
    last_login: "2026-09-07T21:45:00.000Z"
  },
  {
    user_id: "USR-SUPER-01",
    name: "Supervisor Sarah Conner",
    email: "supervisor@sentinel.id",
    password_hash: "sentinel123",
    role: "SUPERVISOR",
    status: "ACTIVE",
    created_at: "2026-02-01T00:00:00.000Z",
    last_login: "2026-09-07T20:30:00.000Z"
  }
];
