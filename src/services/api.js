/**
 * SentinelID — Unified API Abstraction Layer (API 1 client)
 *
 * IMPORTANT ARCHITECTURAL REQUIREMENT:
 * React components interact ONLY with this service layer.
 * React components DO NOT contain direct Apps Script or database URLs.
 *
 * If an Apps Script Web App URL is configured in Settings, requests flow to Apps
 * Script (API 1 — application backend: auth, sessions, cases, stored verification
 * results, audit). Otherwise, it uses the client-side mock engine (mockBackend.js)
 * so the app still works standalone.
 *
 * CHANGED FROM THE ORIGINAL FILE:
 * - `getAppsScriptUrl()` is now `getApi1Url()` from src/config/apiConfig.js — the
 *   URL is no longer defined in two different places (Phase 7/15).
 * - `verificationService.startVerification()` no longer sends a fabricated
 *   `face_data.similarity_score` (0.94 / 0.38) to the backend. It now always runs
 *   the real 5-layer pipeline in the browser first (src/services/
 *   verificationOrchestrator.js), then persists each layer's REAL result through
 *   API 1 — never the other way around. See the note above that function for the
 *   one assumption this requires about API 1's contract, since I have not seen the
 *   Apps Script source.
 * - transformCaseDetails() gained a small adapter so it also understands a case
 *   whose government-matching data is stored under a single `layer4_government`
 *   key (the new Phase-9 shape from layer4_consistency.js) in addition to the
 *   original separate `layer4_consistency` / `layer4_issuer` keys — whichever the
 *   sheet actually contains still renders correctly.
 * - Everything else (authService, analyticsService, auditService, caseService CRUD)
 *   is unchanged from the original file.
 */

import { mockBackend } from './mockBackend';
import { getApi1Url } from '../config/apiConfig';
import { runVerificationPipeline } from './verificationOrchestrator';

/**
 * Hash a password string using SHA-256 (Web Crypto API).
 * Result is lowercase hex, matching what hashPassword() in Apps Script produces.
 * The plaintext password NEVER leaves the browser.
 */
async function hashPasswordSHA256(password) {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

// Generic HTTP fetch helper for Google Apps Script Web App (API 1 only)
async function callAppsScript(action, payload = {}, method = 'POST') {
  const baseUrl = getApi1Url();
  if (!baseUrl) {
    throw new Error('API1_URL_NOT_CONFIGURED');
  }

  try {
    let url = baseUrl;
    const options = {
      method,
      headers: { 'Content-Type': 'text/plain;charset=utf-8' }, // Apps Script CORS friendliness
    };

    if (method === 'GET') {
      const params = new URLSearchParams({ action, ...payload });
      url += (url.includes('?') ? '&' : '?') + params.toString();
    } else {
      options.body = JSON.stringify({ action, ...payload });
    }

    const response = await fetch(url, options);
    return await response.json();
  } catch (error) {
    console.error(`API 1 call error [action=${action}]:`, error);
    throw error;
  }
}

export const authService = {
  login: async (email, password, role) => {
    const api1Url = getApi1Url();
    if (api1Url) {
      try {
        const passwordHash = await hashPasswordSHA256(password);
        const res = await callAppsScript('login', { email, role, passwordHash });
        if (res.success) return res.data;
        if (res.error && res.error.startsWith('AUTH_FAILED')) {
          throw new Error(res.message || 'Authentication failed.');
        }
      } catch (e) {
        if (e.message && e.message.includes('AUTH_FAILED')) throw e;
        console.warn('API 1 unreachable, using mock auth:', e.message);
      }
    }
    return {
      user_id: `USR-${role}-${Math.floor(100 + Math.random() * 900)}`,
      name: email.split('@')[0].toUpperCase(),
      email,
      role,
      status: 'ACTIVE',
      last_login: new Date().toISOString(),
    };
  },

  getUsers: async () => {
    const api1Url = getApi1Url();
    if (api1Url) {
      try {
        const res = await callAppsScript('getUsers', {}, 'GET');
        if (res.success) return res.data;
      } catch (e) {
        /* fallback */
      }
    }
    const mockRes = await mockBackend.getUsers();
    return mockRes.data;
  },
};

/**
 * Transform flat Google Sheets row data into the nested structure React components
 * expect. Unchanged from the original except for the Layer 4 section, which now
 * also understands `raw.layer4_government` (the new combined shape produced by
 * layer4_consistency.js) in addition to the original separate keys.
 */
function transformCaseDetails(raw) {
  if (!raw || !raw.case) return raw;

  const result = { case: raw.case, documents: raw.documents };

  if (raw.layer1_ocr) {
    const ocr = raw.layer1_ocr;
    result.layer1_ocr = {
      status: ocr.status || 'PASS',
      ocr_confidence: parseFloat(ocr.confidence || ocr.ocr_confidence || 0),
      extracted_fields: ocr.extracted_fields || {
        name: ocr.extracted_name || ocr.name || raw.case.subject_name || '',
        dob: ocr.dob || '',
        document_number: ocr.document_number || '',
        issue_date: ocr.issue_date || '',
        expiry_date: ocr.expiry_date || '',
      },
    };
  } else {
    result.layer1_ocr = null;
  }

  if (raw.layer2_face) {
    const face = raw.layer2_face;
    const similarity = parseFloat(face.similarity_score || 0);
    const isMatch =
      face.match !== undefined ? face.match : face.face_match === true || face.face_match === 'TRUE' || face.face_match === 'true';
    result.layer2_face = {
      similarity_score: similarity,
      match: isMatch,
      face_detected: face.face_detected_document !== undefined ? face.face_detected_document : face.face_detected !== undefined ? face.face_detected : true,
      liveness: face.liveness || face.liveness_status || 'PASS',
    };
  } else {
    result.layer2_face = null;
  }

  if (raw.layer3_forensics) {
    const forensics = raw.layer3_forensics;
    let regions = forensics.suspicious_regions || [];
    if (typeof regions === 'string') {
      try {
        regions = JSON.parse(regions);
      } catch {
        regions = [];
      }
    }
    result.layer3_forensics = {
      status: forensics.status || 'NORMAL',
      tampering_score: parseFloat(forensics.tampering_score || 0),
      explanation: forensics.explanation || '',
      suspicious_regions: Array.isArray(regions) ? regions : [],
    };
  } else {
    result.layer3_forensics = null;
  }

  // --- Layer 4: Government match / consistency ------------------------------------
  // Prefer the new combined shape if the sheet has it; otherwise fall back to the
  // two original separate keys exactly as before, so neither storage layout breaks.
  const toBool = (v) => v === true || v === 'TRUE' || v === 'true';
  if (raw.layer4_government) {
    const gov = raw.layer4_government;
    let consistency = gov.data_consistency || {};
    let issuer = gov.issuer_verification || {};
    if (typeof consistency === 'string') {
      try { consistency = JSON.parse(consistency); } catch { consistency = {}; }
    }
    if (typeof issuer === 'string') {
      try { issuer = JSON.parse(issuer); } catch { issuer = {}; }
    }
    result.layer4_consistency = {
      name_match: toBool(consistency.name_match),
      dob_match: toBool(consistency.dob_match),
      document_number_match: toBool(consistency.document_number_match),
      date_valid: toBool(consistency.date_valid),
      duplicate_detected: toBool(consistency.duplicate_detected),
      consistency_status: consistency.status || 'INCONSISTENT',
    };
    result.layer4_issuer = {
      issuer_found: toBool(issuer.issuer_found),
      name_match: toBool(issuer.name_match),
      dob_match: toBool(issuer.dob_match),
      document_status: issuer.document_status || 'NOT_FOUND',
      issuer_name: issuer.issuer_name || '',
    };
  } else {
    if (raw.layer4_consistency) {
      const c = raw.layer4_consistency;
      result.layer4_consistency = {
        name_match: toBool(c.name_match),
        dob_match: toBool(c.dob_match),
        document_number_match: toBool(c.document_number_match),
        date_valid: toBool(c.date_valid),
        duplicate_detected: toBool(c.duplicate_detected),
        consistency_status: c.consistency_status || 'VERIFIED',
      };
    } else {
      result.layer4_consistency = null;
    }
    if (raw.layer4_issuer) {
      const iss = raw.layer4_issuer;
      result.layer4_issuer = {
        issuer_found: toBool(iss.issuer_found),
        name_match: toBool(iss.name_match),
        dob_match: toBool(iss.dob_match),
        document_status: iss.document_status || 'NOT_FOUND',
        issuer_name: iss.issuer_name || '',
      };
    } else {
      result.layer4_issuer = null;
    }
  }

  if (raw.layer5_risk) {
    const risk = raw.layer5_risk;
    let reasons = risk.reasons || [];
    if (typeof reasons === 'string') {
      try { reasons = JSON.parse(reasons); } catch { reasons = [reasons]; }
    }
    if (!Array.isArray(reasons)) reasons = [String(reasons)];

    let overrides = risk.overrides || [];
    if (typeof overrides === 'string') {
      try { overrides = JSON.parse(overrides); } catch { overrides = []; }
    }
    if (!Array.isArray(overrides)) overrides = [];

    result.layer5_risk = {
      risk_score: parseInt(risk.risk_score, 10) || 0,
      risk_level: risk.risk_level || 'LOW',
      decision: risk.decision || raw.case.status || '',
      reasons,
      overrides,
    };
  } else {
    result.layer5_risk = null;
  }

  return result;
}

export const caseService = {
  getCases: async () => {
    const api1Url = getApi1Url();
    if (api1Url) {
      try {
        const res = await callAppsScript('getCases', {}, 'GET');
        if (res.success) return Array.isArray(res.data) ? res.data : [];
      } catch (e) {
        console.warn('API 1 unreachable, using mock data:', e.message);
      }
    }
    const mockRes = await mockBackend.getCases();
    return mockRes.data;
  },

  getCaseDetails: async (caseId) => {
    const api1Url = getApi1Url();
    if (api1Url) {
      try {
        const res = await callAppsScript('getCase', { case_id: caseId }, 'GET');
        if (res.success) return transformCaseDetails(res.data);
      } catch (e) {
        /* fallback */
      }
    }
    const mockRes = await mockBackend.getCase(caseId);
    return mockRes.data;
  },

  createCase: async (caseData, userEmail) => {
    const api1Url = getApi1Url();
    if (api1Url) {
      try {
        const res = await callAppsScript('createCase', { data: caseData, userEmail });
        if (res.success) return res.data;
      } catch (e) {
        /* fallback */
      }
    }
    const mockRes = await mockBackend.createCase(caseData, userEmail);
    return mockRes.data;
  },

  updateStatus: async (caseId, status, notes, userEmail) => {
    const api1Url = getApi1Url();
    if (api1Url) {
      try {
        const res = await callAppsScript('updateStatus', { case_id: caseId, status, notes, userEmail });
        if (res.success) return res.data;
      } catch (e) {
        /* fallback */
      }
    }
    const mockRes = await mockBackend.updateStatus(caseId, status, notes, userEmail);
    return mockRes.data;
  },
};

/**
 * ASSUMPTION FLAG: I have not seen API 1's Apps Script source, so I don't know its
 * real handler name/payload shape for storing a single layer's verification result.
 * `saveVerificationLayer` below is the one new action this rewrite introduces —
 * everything else reuses action names the original file already called. If your
 * Apps Script project uses a different action name or expects a different payload
 * shape, this is the one function to change; nothing else depends on the shape.
 */
async function persistLayerResultToApi1(caseId, layerName, data) {
  const res = await callAppsScript('saveVerificationLayer', { case_id: caseId, layer: layerName, data });
  if (!res || res.success === false) {
    throw new Error(res?.message || `API 1 rejected saving ${layerName}`);
  }
}

export const verificationService = {
  /**
   * Runs the real 5-layer pipeline in the browser (OCR/face/forensics need actual
   * pixels, which can't happen inside Apps Script), then persists each layer's
   * result through API 1. If API 1 isn't configured or isn't reachable, results
   * fall back to local storage (mockBackend) so the app still works standalone —
   * the EVIDENCE itself is always computed for real either way; only where it's
   * stored differs.
   *
   * `opts.livenessFrames` (optional): array of { landmarks } snapshots from a
   * challenge-response capture UI. `opts.onProgress`: ({ stage, percent }) => void.
   */
  startVerification: async (caseId, docFile, faceFile, subjectDetails, opts = {}) => {
    const api1Url = getApi1Url();
    let historicalCases = [];
    try {
      historicalCases = await caseService.getCases();
    } catch {
      historicalCases = [];
    }

    const persistLayerResult = async (cid, layerName, data) => {
      if (api1Url) {
        try {
          await persistLayerResultToApi1(cid, layerName, data);
          return;
        } catch (e) {
          console.warn(`API 1 unreachable while saving ${layerName}, falling back to local storage:`, e.message);
        }
      }
      mockBackend.saveVerificationLayer(cid, layerName, data);
    };

    const finalResult = await runVerificationPipeline({
      caseId,
      docFile,
      liveFaceFile: faceFile,
      livenessFrames: opts.livenessFrames,
      subjectDetails,
      historicalCases,
      onProgress: opts.onProgress,
      persistLayerResult,
    });

    try {
      const { decision, risk_level: riskLevel, risk_score: riskScore } = finalResult.layer5_risk;
      await caseService.updateStatus(caseId, decision, `Automated risk assessment: ${riskLevel} (${riskScore}/100).`, subjectDetails?.officer_email);
    } catch (e) {
      console.warn('Could not update case status after verification:', e.message);
    }

    return finalResult;
  },
};

export const analyticsService = {
  getDashboardStats: async () => {
    const api1Url = getApi1Url();
    if (api1Url) {
      try {
        const res = await callAppsScript('getDashboardStats', {}, 'GET');
        if (res.success) return res.data;
      } catch (e) {
        /* fallback */
      }
    }
    const mockRes = await mockBackend.getDashboardStats();
    return mockRes.data;
  },
};

export const auditService = {
  getLogs: async () => {
    const api1Url = getApi1Url();
    if (api1Url) {
      try {
        const res = await callAppsScript('getAuditLogs', {}, 'GET');
        if (res.success) return res.data;
      } catch (e) {
        /* fallback */
      }
    }
    const mockRes = await mockBackend.getAuditLogs();
    return mockRes.data;
  },
};
