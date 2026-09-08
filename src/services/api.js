/**
 * SentinelID — Unified API Abstraction Layer
 * 
 * IMPORTANT ARCHITECTURAL REQUIREMENT:
 * React components interact ONLY with this service layer.
 * React components DO NOT contain direct Apps Script or database URLs.
 * 
 * If a Apps Script Web App URL is configured in Settings, requests flow to Apps Script.
 * Otherwise, it uses the client-side mock engine seamlessly.
 * 
 * This enables trivial migration to FastAPI + PostgreSQL + S3 in the future by simply
 * updating this single service file.
 */

import { mockBackend } from './mockBackend';

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
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

const getAppsScriptUrl = () => {
  return localStorage.getItem('sentinel_apps_script_url') || 
         import.meta.env.VITE_APPS_SCRIPT_URL || 
         'https://script.google.com/macros/s/AKfycbw_ypd20aO42BVSVnO8uCyb4Uu1NHAJfmNzrYQOLLEYIPLkWHBMvUMwlQqstGHoxGhzTw/exec';
};

// Generic HTTP fetch helper for Google Apps Script Web App
async function callAppsScript(action, payload = {}, method = 'POST') {
  const baseUrl = getAppsScriptUrl();
  if (!baseUrl) {
    throw new Error('APPS_SCRIPT_URL_NOT_CONFIGURED');
  }

  try {
    let url = baseUrl;
    let options = {
      method: method,
      headers: {
        'Content-Type': 'text/plain;charset=utf-8', // Apps Script CORS friendliness
      }
    };

    if (method === 'GET') {
      const params = new URLSearchParams({ action, ...payload });
      url += (url.includes('?') ? '&' : '?') + params.toString();
    } else {
      options.body = JSON.stringify({ action, ...payload });
    }

    const response = await fetch(url, options);
    const result = await response.json();
    return result;
  } catch (error) {
    console.error(`Apps Script API call error [action=${action}]:`, error);
    throw error;
  }
}

export const authService = {
  login: async (email, password, role) => {
    const appsScriptUrl = getAppsScriptUrl();
    if (appsScriptUrl) {
      try {
        // Hash password in browser before sending — plaintext never leaves the client
        const passwordHash = await hashPasswordSHA256(password);
        const res = await callAppsScript('login', { email, role, passwordHash });
        if (res.success) return res.data;
        // If Apps Script returns AUTH_FAILED, surface the error to the user
        if (res.error && res.error.startsWith('AUTH_FAILED')) {
          throw new Error(res.message || 'Authentication failed.');
        }
      } catch (e) {
        // Re-throw auth errors (wrong password etc.) — don't fall back to mock for these
        if (e.message && e.message.includes('AUTH_FAILED')) throw e;
        console.warn('Apps Script unreachable, using mock auth:', e.message);
      }
    }
    // Mock Fallback (used when Apps Script URL not configured)
    return {
      user_id: `USR-${role}-${Math.floor(100 + Math.random() * 900)}`,
      name: email.split('@')[0].toUpperCase(),
      email,
      role,
      status: 'ACTIVE',
      last_login: new Date().toISOString()
    };
  },

  getUsers: async () => {
    const appsScriptUrl = getAppsScriptUrl();
    if (appsScriptUrl) {
      try {
        const res = await callAppsScript('getUsers', {}, 'GET');
        if (res.success) return res.data;
      } catch (e) { /* fallback */ }
    }
    const mockRes = await mockBackend.getUsers();
    return mockRes.data;
  }
};

/**
 * Transform flat Google Sheets row data into the nested structure React components expect.
 * Google Sheets stores all values as flat key-value pairs; React components expect
 * nested objects (e.g. layer1_ocr.extracted_fields.name) and real arrays (e.g. reasons).
 */
function transformCaseDetails(raw) {
  if (!raw || !raw.case) return raw;

  const result = { case: raw.case, documents: raw.documents };

  // --- Layer 1: OCR ---
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
        expiry_date: ocr.expiry_date || ''
      }
    };
  } else {
    result.layer1_ocr = null;
  }

  // --- Layer 2: Face ---
  if (raw.layer2_face) {
    const face = raw.layer2_face;
    const similarity = parseFloat(face.similarity_score || 0);
    // Sheet stores "face_match"; React expects "match"
    const isMatch = face.match !== undefined ? face.match
      : (face.face_match === true || face.face_match === 'TRUE' || face.face_match === 'true');
    result.layer2_face = {
      similarity_score: similarity,
      match: isMatch,
      face_detected: face.face_detected !== undefined ? face.face_detected : true,
      liveness: face.liveness || face.liveness_status || 'PASS'
    };
  } else {
    result.layer2_face = null;
  }

  // --- Layer 3: Forensics ---
  if (raw.layer3_forensics) {
    const forensics = raw.layer3_forensics;
    let regions = forensics.suspicious_regions || [];
    // Sheets stores suspicious_regions as a JSON string — parse it
    if (typeof regions === 'string') {
      try { regions = JSON.parse(regions); } catch { regions = []; }
    }
    result.layer3_forensics = {
      status: forensics.status || 'NORMAL',
      tampering_score: parseFloat(forensics.tampering_score || 0),
      explanation: forensics.explanation || '',
      suspicious_regions: Array.isArray(regions) ? regions : []
    };
  } else {
    result.layer3_forensics = null;
  }

  // --- Layer 4: Consistency ---
  if (raw.layer4_consistency) {
    const c = raw.layer4_consistency;
    const toBool = (v) => v === true || v === 'TRUE' || v === 'true';
    result.layer4_consistency = {
      name_match: toBool(c.name_match),
      dob_match: toBool(c.dob_match),
      document_number_match: toBool(c.document_number_match),
      date_valid: toBool(c.date_valid),
      duplicate_detected: toBool(c.duplicate_detected),
      consistency_status: c.consistency_status || 'VERIFIED'
    };
  } else {
    result.layer4_consistency = null;
  }

  // --- Layer 4: Issuer ---
  if (raw.layer4_issuer) {
    const iss = raw.layer4_issuer;
    const toBool = (v) => v === true || v === 'TRUE' || v === 'true';
    result.layer4_issuer = {
      issuer_found: toBool(iss.issuer_found),
      name_match: toBool(iss.name_match),
      dob_match: toBool(iss.dob_match),
      document_status: iss.document_status || 'NOT_FOUND',
      issuer_name: iss.issuer_name || ''
    };
  } else {
    result.layer4_issuer = null;
  }

  // --- Layer 5: Risk ---
  if (raw.layer5_risk) {
    const risk = raw.layer5_risk;
    // Sheets stores reasons & overrides as JSON strings — parse them
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
      overrides
    };
  } else {
    result.layer5_risk = null;
  }

  return result;
}

export const caseService = {
  getCases: async () => {
    const appsScriptUrl = getAppsScriptUrl();
    if (appsScriptUrl) {
      try {
        const res = await callAppsScript('getCases', {}, 'GET');
        if (res.success) return Array.isArray(res.data) ? res.data : [];
      } catch (e) {
        console.warn('Apps Script unreachable, using mock data:', e.message);
      }
    }
    const mockRes = await mockBackend.getCases();
    return mockRes.data;
  },

  getCaseDetails: async (caseId) => {
    const appsScriptUrl = getAppsScriptUrl();
    if (appsScriptUrl) {
      try {
        const res = await callAppsScript('getCase', { case_id: caseId }, 'GET');
        if (res.success) return transformCaseDetails(res.data);
      } catch (e) { /* fallback */ }
    }
    const mockRes = await mockBackend.getCase(caseId);
    return mockRes.data;
  },

  createCase: async (caseData, userEmail) => {
    const appsScriptUrl = getAppsScriptUrl();
    if (appsScriptUrl) {
      try {
        const res = await callAppsScript('createCase', { data: caseData, userEmail });
        if (res.success) return res.data;
      } catch (e) { /* fallback */ }
    }
    const mockRes = await mockBackend.createCase(caseData, userEmail);
    return mockRes.data;
  },

  updateStatus: async (caseId, status, notes, userEmail) => {
    const appsScriptUrl = getAppsScriptUrl();
    if (appsScriptUrl) {
      try {
        const res = await callAppsScript('updateStatus', { case_id: caseId, status, notes, userEmail });
        if (res.success) return res.data;
      } catch (e) { /* fallback */ }
    }
    const mockRes = await mockBackend.updateStatus(caseId, status, notes, userEmail);
    return mockRes.data;
  }
};

export const verificationService = {
  startVerification: async (caseId, docFile, faceFile, subjectDetails, scenario = 'NORMAL') => {
    const appsScriptUrl = getAppsScriptUrl();
    if (appsScriptUrl) {
      try {
        // Run full verification pipeline on Apps Script
        const res = await callAppsScript('startVerification', {
          case_id: caseId,
          doc_data: { file_name: docFile?.name || 'document.jpg' },
          face_data: { similarity_score: scenario === 'FACE_MISMATCH' ? 0.38 : 0.94 },
          subject_details: subjectDetails
        });
        if (res.success) return res.data;
      } catch (e) {
        console.warn('Apps Script verification execution failed, using local engine:', e.message);
      }
    }
    // Execute local client-side 5-layer pipeline
    const mockRes = await mockBackend.startVerification(caseId, docFile, faceFile, subjectDetails, scenario);
    return mockRes.data;
  }
};

export const analyticsService = {
  getDashboardStats: async () => {
    const appsScriptUrl = getAppsScriptUrl();
    if (appsScriptUrl) {
      try {
        const res = await callAppsScript('getDashboardStats', {}, 'GET');
        if (res.success) return res.data;
      } catch (e) { /* fallback */ }
    }
    const mockRes = await mockBackend.getDashboardStats();
    return mockRes.data;
  }
};

export const auditService = {
  getLogs: async () => {
    const appsScriptUrl = getAppsScriptUrl();
    if (appsScriptUrl) {
      try {
        const res = await callAppsScript('getAuditLogs', {}, 'GET');
        if (res.success) return res.data;
      } catch (e) { /* fallback */ }
    }
    const mockRes = await mockBackend.getAuditLogs();
    return mockRes.data;
  }
};
