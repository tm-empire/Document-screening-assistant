/**
 * GOVERNMENT SYNTHETIC IDENTITY API CLIENT (API 2)
 *
 * Talks ONLY to the government synthetic-data Apps Script endpoint. This is a
 * completely separate service from src/services/api.js (API 1 — the application
 * backend). Nothing in this file writes application data, sessions, or audit logs,
 * and no other service file should import from here except layer4_consistency.js.
 *
 * ASSUMPTION FLAG: I have not seen API 2's actual Apps Script source, so the
 * `action` names and response shapes below are assumptions based on the brief
 * (Phase 9/10). They're isolated to the three functions below
 * (lookupByDocumentNumber / searchCandidates / callGovernmentApi) specifically so
 * you can correct them in one place once you confirm the real contract — nothing
 * else in the codebase needs to change if the actual shape differs.
 */

import { getApi2Url } from '../config/apiConfig';

async function callGovernmentApi(action, payload = {}, method = 'GET') {
  const url = getApi2Url();
  if (!url) throw new Error('GOVERNMENT_API_URL_NOT_CONFIGURED');

  let requestUrl = url;
  const options = { method, headers: { 'Content-Type': 'text/plain;charset=utf-8' } };

  if (method === 'GET') {
    const params = new URLSearchParams({ action, ...payload });
    requestUrl += (requestUrl.includes('?') ? '&' : '?') + params.toString();
  } else {
    options.body = JSON.stringify({ action, ...payload });
  }

  const response = await fetch(requestUrl, options);
  if (!response.ok) throw new Error(`Government API responded with HTTP ${response.status}`);
  return response.json();
}

function normalizeIdentity(fields = {}) {
  return {
    name: String(fields.name || '').trim().toUpperCase(),
    dob: fields.dob || null,
    document_number: String(fields.document_number || '').trim().toUpperCase(),
    document_type: fields.document_type || null,
    issue_date: fields.issue_date || null,
    expiry_date: fields.expiry_date || null,
  };
}

/** 1) Exact document-number lookup. ASSUMED response: { success, data: record|null } */
async function lookupByDocumentNumber(documentNumber) {
  if (!documentNumber) return null;
  const res = await callGovernmentApi('lookupDocument', { document_number: documentNumber }, 'GET');
  if (!res || res.success === false) return null;
  return res.data || null;
}

/** 2) Fallback candidate search when the document number isn't found. ASSUMED response: { success, data: record[] } */
async function searchCandidates(identity) {
  const res = await callGovernmentApi('searchIdentity', { name: identity.name, dob: identity.dob }, 'GET');
  if (!res || res.success === false) return [];
  return Array.isArray(res.data) ? res.data : [];
}

function fieldMatch(a, b) {
  if (!a || !b) return false;
  return String(a).trim().toLowerCase() === String(b).trim().toLowerCase();
}

function compareAgainstRecord(identity, record) {
  return {
    document_number_match: fieldMatch(identity.document_number, record.document_number),
    name_match: fieldMatch(identity.name, record.name),
    dob_match: fieldMatch(identity.dob, record.dob),
    document_type_match: fieldMatch(identity.document_type, record.document_type),
    issue_date_match: fieldMatch(identity.issue_date, record.issue_date),
    expiry_date_match: fieldMatch(identity.expiry_date, record.expiry_date),
  };
}

function emptyMatchResult(overrides = {}) {
  return {
    government_record_found: false,
    person_id: null,
    document_id: null,
    document_number_match: false,
    name_match: false,
    dob_match: false,
    document_type_match: false,
    issue_date_match: false,
    expiry_date_match: false,
    document_status: 'UNKNOWN',
    issuer_status: 'UNKNOWN',
    duplicate_detected: false,
    confidence: 0,
    explanation: '',
    ...overrides,
  };
}

/**
 * Main entry point used by Layer 4. Implements the exact-match-then-candidate-search
 * flow from Phase 9 and always returns a stable internal object, whether or not a
 * record was found and whether or not the API could be reached.
 */
export async function matchGovernmentIdentity(ocrFields) {
  const identity = normalizeIdentity(ocrFields);

  if (!identity.document_number && !identity.name) {
    return emptyMatchResult({
      document_status: 'UNKNOWN',
      explanation: 'No document number or name available to query the government verification source.',
    });
  }

  try {
    let record = null;
    let matchMethod = null;
    let candidateCount = 0;

    if (identity.document_number) {
      record = await lookupByDocumentNumber(identity.document_number);
      if (record) matchMethod = 'document_number_exact';
    }

    if (!record) {
      const candidates = await searchCandidates(identity);
      candidateCount = candidates.length;
      record =
        candidates.find((c) => fieldMatch(c.name, identity.name) && fieldMatch(c.dob, identity.dob)) ||
        candidates[0] ||
        null;
      if (record) matchMethod = 'candidate_search';
    }

    if (!record) {
      return emptyMatchResult({
        document_status: 'NOT_FOUND',
        explanation:
          'No matching government record was found in the available verification source. This does not by itself indicate the document or person is fraudulent — Layer 5 weighs this alongside all other evidence.',
      });
    }

    const fieldMatches = compareAgainstRecord(identity, record);
    const matchedFieldCount = Object.values(fieldMatches).filter(Boolean).length;
    const confidence =
      matchMethod === 'document_number_exact'
        ? Number((0.6 + 0.4 * (matchedFieldCount / 6)).toFixed(2))
        : Number((0.3 + 0.3 * (matchedFieldCount / 6)).toFixed(2));

    return {
      government_record_found: true,
      person_id: record.person_id || null,
      document_id: record.document_id || null,
      ...fieldMatches,
      document_status: record.document_status || 'UNKNOWN',
      issuer_status: record.issuer_status || record.status || 'UNKNOWN',
      duplicate_detected: !!record.duplicate_detected,
      match_method: matchMethod,
      candidates_considered: candidateCount,
      confidence,
      explanation:
        matchMethod === 'document_number_exact'
          ? `Government record located by exact document number match (person_id ${record.person_id || 'unknown'}).`
          : `No document-number match; closest candidate found via name/DOB search among ${candidateCount} candidate(s) — treat with lower confidence than an exact match.`,
    };
  } catch (err) {
    return emptyMatchResult({
      document_status: 'LOOKUP_FAILED',
      explanation: `Government verification source could not be reached: ${err.message}. Treat as unverified, not as a negative result.`,
    });
  }
}
