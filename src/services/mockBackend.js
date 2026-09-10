/**
 * SentinelID — Client-Side Mock Database Engine
 * Simulates Google Apps Script + Google Sheets API actions in-memory & localStorage.
 * Enables instant standalone execution without requiring immediate Apps Script Web App deployment.
 *
 * CHANGED FROM THE ORIGINAL FILE:
 * - `getCase()` no longer falls back to a hardcoded fake verification bundle
 *   ("Eleanor Vance", "1992-04-14", "DOC-9988221", ocr_confidence 0.94, etc.) when
 *   no cached result exists. A case that hasn't been verified yet now genuinely
 *   reports `verification_available: false` and null layer objects — the UI should
 *   show "not yet verified", not fabricated evidence. This only affects what's
 *   returned when there IS no result; once `startVerification` (or
 *   `saveVerificationLayer`, called from api.js) has run, real results are returned
 *   exactly as computed.
 * - `startVerification()` no longer calls the layer functions with old
 *   (file, scenario) signatures — layer2_face.js / layer3_forensics.js no longer
 *   accept a `simulatedScenario` argument at all, since there's nothing left to
 *   fake. It now delegates to verificationOrchestrator.js, the same pipeline
 *   api.js uses, so there is exactly one place the 5-layer flow is wired up.
 * - New `saveVerificationLayer(caseId, layerName, data)` — this is what
 *   verificationOrchestrator.js's `persistLayerResult` callback writes to when
 *   API 1 isn't configured/reachable. It merges into the cached result bundle
 *   incrementally (Phase 11: never lose intermediate evidence) instead of only
 *   writing once at the very end.
 * - Removed the unused `MOCK_ISSUER_REGISTRY` import — government matching is
 *   now handled by governmentApi.js / layer4_consistency.js, not a local array.
 */

import { MOCK_INITIAL_CASES, MOCK_USERS } from '../data/mockData';
import { runVerificationPipeline } from './verificationOrchestrator';

const STORAGE_KEYS = {
  CASES: 'sentinel_cases',
  USERS: 'sentinel_users',
  AUDIT_LOGS: 'sentinel_audit_logs',
};

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
        log_id: 'LOG-101',
        user_id: 'USR-ADMIN-01',
        case_id: 'SYSTEM',
        action: 'SYSTEM_INITIALIZED',
        timestamp: new Date().toISOString(),
        details: 'SentinelID 5-Layer Verification Engine initialized.',
      },
    ];
    localStorage.setItem(STORAGE_KEYS.AUDIT_LOGS, JSON.stringify(initialLogs));
  }
}

initializeStorage();

function getCachedResults(caseId) {
  const stored = localStorage.getItem(`sentinel_results_${caseId}`);
  return stored ? JSON.parse(stored) : null;
}

export const mockBackend = {
  getCases: async () => {
    const cases = JSON.parse(localStorage.getItem(STORAGE_KEYS.CASES) || '[]');
    return { success: true, data: cases, message: 'Cases retrieved' };
  },

  getCase: async (caseId) => {
    const cases = JSON.parse(localStorage.getItem(STORAGE_KEYS.CASES) || '[]');
    const caseItem = cases.find((c) => c.case_id === caseId);
    if (!caseItem) {
      return { success: false, error: 'CASE_NOT_FOUND', message: 'Case not found' };
    }

    const results = getCachedResults(caseId);

    return {
      success: true,
      data: {
        case: caseItem,
        verification_available: !!results,
        layer1_ocr: results?.layer1_ocr || null,
        layer2_face: results?.layer2_face || null,
        layer3_forensics: results?.layer3_forensics || null,
        layer4_consistency: results?.layer4_consistency ?? results?.layer4_government?.data_consistency ?? null,
        layer4_issuer: results?.layer4_issuer ?? results?.layer4_government?.issuer_verification ?? null,
        layer5_risk: results?.layer5_risk || null,
      },
    };
  },

  createCase: async (data, userEmail) => {
    const cases = JSON.parse(localStorage.getItem(STORAGE_KEYS.CASES) || '[]');
    const newCaseId = `VRF-${Math.floor(10000 + Math.random() * 90000)}`;
    const now = new Date().toISOString();

    const newCase = {
      case_id: newCaseId,
      subject_name: data.subject_name || 'Unknown Subject',
      created_by: userEmail || 'officer@sentinel.id',
      assigned_to: data.assigned_to || userEmail || 'officer@sentinel.id',
      status: 'PROCESSING',
      risk_level: 'PENDING',
      risk_score: 0,
      created_at: now,
      updated_at: now,
    };

    cases.unshift(newCase);
    localStorage.setItem(STORAGE_KEYS.CASES, JSON.stringify(cases));
    mockBackend.addAuditLog(userEmail || 'OFFICER', newCaseId, 'CREATE_CASE', `Created verification case for ${newCase.subject_name}`);

    return { success: true, data: newCase, message: 'Case created successfully' };
  },

  /**
   * Merges one layer's real result into the cached bundle for a case, and — once
   * layer5_risk arrives — updates the case's risk_level/risk_score/status in the
   * case list too. Called incrementally by verificationOrchestrator.js via
   * api.js's or this file's own `persistLayerResult` callback, so evidence is never
   * lost even if a later layer fails.
   */
  saveVerificationLayer: (caseId, layerName, data) => {
    const existing = getCachedResults(caseId) || { case_id: caseId };
    existing[layerName] = data;
    localStorage.setItem(`sentinel_results_${caseId}`, JSON.stringify(existing));

    if (layerName === 'layer5_risk') {
      const cases = JSON.parse(localStorage.getItem(STORAGE_KEYS.CASES) || '[]');
      const idx = cases.findIndex((c) => c.case_id === caseId);
      if (idx !== -1) {
        cases[idx].risk_level = data.risk_level;
        cases[idx].risk_score = data.risk_score;
        cases[idx].status = data.decision;
        cases[idx].updated_at = new Date().toISOString();
        localStorage.setItem(STORAGE_KEYS.CASES, JSON.stringify(cases));
      }
      mockBackend.addAuditLog('SYSTEM', caseId, 'VERIFICATION_COMPLETE', `5-layer verification finished. Score: ${data.risk_score}, Level: ${data.risk_level}`);
    }
  },

  /**
   * Standalone entry point (used when nothing else drives the pipeline). Runs the
   * same real orchestrator api.js uses, persisting every layer locally as it goes.
   */
  startVerification: async (caseId, docFile, faceFile, subjectDetails, opts = {}) => {
    const cases = JSON.parse(localStorage.getItem(STORAGE_KEYS.CASES) || '[]');

    const finalResult = await runVerificationPipeline({
      caseId,
      docFile,
      liveFaceFile: faceFile,
      livenessFrames: opts.livenessFrames,
      subjectDetails,
      historicalCases: cases,
      onProgress: opts.onProgress,
      persistLayerResult: async (cid, layerName, data) => mockBackend.saveVerificationLayer(cid, layerName, data),
    });

    return { success: true, data: finalResult, message: 'Verification complete' };
  },

  updateStatus: async (caseId, status, notes, userEmail) => {
    const cases = JSON.parse(localStorage.getItem(STORAGE_KEYS.CASES) || '[]');
    const caseIndex = cases.findIndex((c) => c.case_id === caseId);
    if (caseIndex === -1) {
      return { success: false, error: 'NOT_FOUND', message: 'Case not found' };
    }

    cases[caseIndex].status = status;
    cases[caseIndex].updated_at = new Date().toISOString();
    localStorage.setItem(STORAGE_KEYS.CASES, JSON.stringify(cases));

    mockBackend.addAuditLog(userEmail || 'OFFICER', caseId, 'UPDATE_STATUS', `Officer updated case status to ${status}. Notes: ${notes || 'None'}`);

    return { success: true, data: cases[caseIndex], message: 'Status updated' };
  },

  getAuditLogs: async () => {
    const logs = JSON.parse(localStorage.getItem(STORAGE_KEYS.AUDIT_LOGS) || '[]');
    return { success: true, data: logs, message: 'Audit logs retrieved' };
  },

  addAuditLog: (userId, caseId, action, details) => {
    const logs = JSON.parse(localStorage.getItem(STORAGE_KEYS.AUDIT_LOGS) || '[]');
    const newLog = {
      log_id: `LOG-${Math.floor(1000 + Math.random() * 9000)}`,
      user_id: userId || 'SYSTEM',
      case_id: caseId || 'GENERAL',
      action: action,
      timestamp: new Date().toISOString(),
      details: typeof details === 'object' ? JSON.stringify(details) : String(details),
    };
    logs.unshift(newLog);
    localStorage.setItem(STORAGE_KEYS.AUDIT_LOGS, JSON.stringify(logs));
  },

  getUsers: async () => {
    const users = JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS) || '[]');
    return { success: true, data: users, message: 'Users list' };
  },

  getDashboardStats: async () => {
    const cases = JSON.parse(localStorage.getItem(STORAGE_KEYS.CASES) || '[]');
    const total = cases.length;
    const low = cases.filter((c) => c.risk_level === 'LOW').length;
    const medium = cases.filter((c) => c.risk_level === 'MEDIUM').length;
    const high = cases.filter((c) => c.risk_level === 'HIGH').length;
    const pendingReview = cases.filter((c) => c.status === 'MANUAL_REVIEW_REQUIRED' || c.status === 'PROCESSING').length;

    return {
      success: true,
      data: {
        total_cases: total,
        low_risk: low,
        medium_risk: medium,
        high_risk: high,
        pending_review: pendingReview,
        recent_cases: cases.slice(0, 5),
      },
    };
  },
};
