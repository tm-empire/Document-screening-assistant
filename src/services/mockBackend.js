/**
 * SentinelID — Client-Side Mock Database Engine
 * Simulates Google Apps Script + Google Sheets API actions in-memory & localStorage.
 * Enables instant standalone execution without requiring immediate Apps Script Web App deployment.
 */

import { MOCK_INITIAL_CASES, MOCK_USERS, MOCK_ISSUER_REGISTRY } from '../data/mockData';
import { runLayer1Ocr } from './layer1_ocr';
import { runLayer2Face } from './layer2_face';
import { runLayer3Forensics } from './layer3_forensics';
import { runLayer4Consistency } from './layer4_consistency';
import { runLayer5RiskEngine } from './layer5_riskEngine';

const STORAGE_KEYS = {
  CASES: 'sentinel_cases',
  USERS: 'sentinel_users',
  AUDIT_LOGS: 'sentinel_audit_logs'
};

// Initialize Storage with default synthetic demo data if empty
function initializeStorage() {
  if (!localStorage.getItem(STORAGE_KEYS.CASES)) {
    localStorage.setItem(STORAGE_KEYS.CASES, JSON.stringify(MOCK_INITIAL_CASES));
  }
  if (!localStorage.getItem(STORAGE_KEYS.USERS)) {
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(MOCK_USERS));
  }
  if (!localStorage.getItem(STORAGE_KEYS.AUDIT_LOGS)) {
    const initialLogs = [
      {
        log_id: "LOG-101",
        user_id: "USR-ADMIN-01",
        case_id: "SYSTEM",
        action: "SYSTEM_INITIALIZED",
        timestamp: new Date().toISOString(),
        details: "SentinelID 5-Layer Verification Engine initialized."
      }
    ];
    localStorage.setItem(STORAGE_KEYS.AUDIT_LOGS, JSON.stringify(initialLogs));
  }
}

initializeStorage();

export const mockBackend = {
  // Cases
  getCases: async () => {
    const cases = JSON.parse(localStorage.getItem(STORAGE_KEYS.CASES) || '[]');
    return { success: true, data: cases, message: "Cases retrieved" };
  },

  getCase: async (caseId) => {
    const cases = JSON.parse(localStorage.getItem(STORAGE_KEYS.CASES) || '[]');
    const caseItem = cases.find(c => c.case_id === caseId);
    if (!caseItem) {
      return { success: false, error: "CASE_NOT_FOUND", message: "Case not found" };
    }

    // Retrieve cached verification results or build mock layer bundle
    const storedResults = localStorage.getItem(`sentinel_results_${caseId}`);
    const results = storedResults ? JSON.parse(storedResults) : null;

    return {
      success: true,
      data: {
        case: caseItem,
        layer1_ocr: results?.layer1_ocr || {
          status: "PASS",
          ocr_confidence: 0.94,
          extracted_fields: {
            name: caseItem.subject_name,
            dob: "1992-04-14",
            document_number: "DOC-9988221",
            issue_date: "2020-01-10",
            expiry_date: "2030-01-10"
          }
        },
        layer2_face: results?.layer2_face || {
          face_detected: true,
          similarity_score: caseItem.risk_level === "HIGH" ? 0.38 : 0.94,
          match: caseItem.risk_level !== "HIGH",
          liveness: "PASS"
        },
        layer3_forensics: results?.layer3_forensics || {
          status: caseItem.risk_level === "HIGH" ? "SUSPICIOUS" : "NORMAL",
          tampering_score: caseItem.risk_level === "HIGH" ? 0.78 : 0.12,
          explanation: caseItem.risk_level === "HIGH"
            ? "Error Level Analysis detected compression anomalies in face boundary."
            : "Uniform image compression across entire document surface.",
          suspicious_regions: caseItem.risk_level === "HIGH" ? [{ x: 120, y: 75, width: 130, height: 150, label: "Face boundary compression mismatch" }] : []
        },
        layer4_consistency: results?.layer4_consistency || {
          name_match: true,
          dob_match: true,
          document_number_match: true,
          date_valid: true,
          consistency_status: "VERIFIED"
        },
        layer4_issuer: results?.layer4_issuer || {
          issuer_found: true,
          name_match: true,
          dob_match: true,
          document_status: caseItem.risk_level === "HIGH" ? "REVOKED" : "VALID",
          issuer_name: "National Identity Authority (Synthetic Demo Registry)"
        },
        layer5_risk: results?.layer5_risk || {
          risk_score: caseItem.risk_score,
          risk_level: caseItem.risk_level,
          decision: caseItem.status,
          reasons: caseItem.risk_level === "HIGH"
            ? ["Face mismatch detected (38% similarity).", "Issuer registry status is REVOKED.", "High document tampering score (78%)."]
            : ["All layer verification checks passed standard validation thresholds."]
        }
      }
    };
  },

  createCase: async (data, userEmail) => {
    const cases = JSON.parse(localStorage.getItem(STORAGE_KEYS.CASES) || '[]');
    const newCaseId = `VRF-${Math.floor(10000 + Math.random() * 90000)}`;
    const now = new Date().toISOString();

    const newCase = {
      case_id: newCaseId,
      subject_name: data.subject_name || "Unknown Subject",
      created_by: userEmail || "officer@sentinel.id",
      assigned_to: data.assigned_to || userEmail || "officer@sentinel.id",
      status: "PROCESSING",
      risk_level: "PENDING",
      risk_score: 0,
      created_at: now,
      updated_at: now
    };

    cases.unshift(newCase);
    localStorage.setItem(STORAGE_KEYS.CASES, JSON.stringify(cases));
    mockBackend.addAuditLog(userEmail || "OFFICER", newCaseId, "CREATE_CASE", `Created verification case for ${newCase.subject_name}`);

    return { success: true, data: newCase, message: "Case created successfully" };
  },

  startVerification: async (caseId, docFile, faceFile, subjectDetails, scenario = 'NORMAL') => {
    const l1 = await runLayer1Ocr(docFile, subjectDetails);
    const l2 = await runLayer2Face(docFile, faceFile, scenario);
    const l3 = await runLayer3Forensics(docFile, scenario);
    const cases = JSON.parse(localStorage.getItem(STORAGE_KEYS.CASES) || '[]');
    const l4 = await runLayer4Consistency(l1, subjectDetails, cases);
    const l5 = runLayer5RiskEngine(l1, l2, l3, l4);

    const fullResult = {
      case_id: caseId,
      layer1_ocr: l1,
      layer2_face: l2,
      layer3_forensics: l3,
      layer4_consistency: l4.data_consistency,
      layer4_issuer: l4.issuer_verification,
      layer5_risk: l5
    };

    // Cache results
    localStorage.setItem(`sentinel_results_${caseId}`, JSON.stringify(fullResult));

    // Update case record in list
    const caseIndex = cases.findIndex(c => c.case_id === caseId);
    if (caseIndex !== -1) {
      cases[caseIndex].risk_level = l5.risk_level;
      cases[caseIndex].risk_score = l5.risk_score;
      cases[caseIndex].status = l5.decision;
      cases[caseIndex].updated_at = new Date().toISOString();
      localStorage.setItem(STORAGE_KEYS.CASES, JSON.stringify(cases));
    }

    mockBackend.addAuditLog("SYSTEM", caseId, "VERIFICATION_COMPLETE", `5-Layer verification finished. Score: ${l5.risk_score}, Level: ${l5.risk_level}`);

    return { success: true, data: fullResult, message: "Verification complete" };
  },

  updateStatus: async (caseId, status, notes, userEmail) => {
    const cases = JSON.parse(localStorage.getItem(STORAGE_KEYS.CASES) || '[]');
    const caseIndex = cases.findIndex(c => c.case_id === caseId);
    if (caseIndex === -1) {
      return { success: false, error: "NOT_FOUND", message: "Case not found" };
    }

    cases[caseIndex].status = status;
    cases[caseIndex].updated_at = new Date().toISOString();
    localStorage.setItem(STORAGE_KEYS.CASES, JSON.stringify(cases));

    mockBackend.addAuditLog(userEmail || "OFFICER", caseId, "UPDATE_STATUS", `Officer updated case status to ${status}. Notes: ${notes || "None"}`);

    return { success: true, data: cases[caseIndex], message: "Status updated" };
  },

  // Audit Logs
  getAuditLogs: async () => {
    const logs = JSON.parse(localStorage.getItem(STORAGE_KEYS.AUDIT_LOGS) || '[]');
    return { success: true, data: logs, message: "Audit logs retrieved" };
  },

  addAuditLog: (userId, caseId, action, details) => {
    const logs = JSON.parse(localStorage.getItem(STORAGE_KEYS.AUDIT_LOGS) || '[]');
    const newLog = {
      log_id: `LOG-${Math.floor(1000 + Math.random() * 9000)}`,
      user_id: userId || "SYSTEM",
      case_id: caseId || "GENERAL",
      action: action,
      timestamp: new Date().toISOString(),
      details: typeof details === 'object' ? JSON.stringify(details) : String(details)
    };
    logs.unshift(newLog);
    localStorage.setItem(STORAGE_KEYS.AUDIT_LOGS, JSON.stringify(logs));
  },

  // Users
  getUsers: async () => {
    const users = JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS) || '[]');
    return { success: true, data: users, message: "Users list" };
  },

  // Stats
  getDashboardStats: async () => {
    const cases = JSON.parse(localStorage.getItem(STORAGE_KEYS.CASES) || '[]');
    const total = cases.length;
    const low = cases.filter(c => c.risk_level === "LOW").length;
    const medium = cases.filter(c => c.risk_level === "MEDIUM").length;
    const high = cases.filter(c => c.risk_level === "HIGH").length;
    const pendingReview = cases.filter(c => c.status === "MANUAL_REVIEW_REQUIRED" || c.status === "PROCESSING").length;

    return {
      success: true,
      data: {
        total_cases: total,
        low_risk: low,
        medium_risk: medium,
        high_risk: high,
        pending_review: pendingReview,
        recent_cases: cases.slice(0, 5)
      }
    };
  }
};
