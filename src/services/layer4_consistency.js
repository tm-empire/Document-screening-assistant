/**
 * LAYER 4 — GOVERNMENT MATCHING & CONSISTENCY (real implementation)
 *
 * REPLACES the old local `MOCK_ISSUER_REGISTRY` array lookup (a JS array shipped to
 * the browser) with a real call to API 2 via governmentApi.js. Also compares
 * Layer 1's OCR-extracted fields against the returned government record.
 *
 * ADAPTER NOTE (Phase 18 — prefer an adapter over rewriting unrelated UI): the
 * existing result-page components likely expect a `data_consistency` object and an
 * `issuer_verification` object (the shapes the old mock produced). Rather than
 * rewrite those components sight-unseen, this function returns the new canonical
 * `government_match` object (Phase 9) AND both adapted legacy shapes, mapped from
 * the same real evidence — nothing is fabricated to fill either shape.
 */

import { matchGovernmentIdentity } from './governmentApi';

export async function runLayer4Consistency(ocrData, subjectDetails, historicalCases = []) {
  const extracted = ocrData?.extracted_fields || {};

  const govResult = await matchGovernmentIdentity(extracted);

  // Duplicate-in-this-system check stays local — it's about this application's own
  // case history in API 1, not something the government source would know about.
  const enteredName = String(subjectDetails?.name || extracted.name || '').toLowerCase().trim();
  const duplicateInHistory =
    !!enteredName &&
    historicalCases.some((c) => String(c.subject_name || '').toLowerCase().trim() === enteredName && c.status === 'REJECTED');

  let dateValid = true;
  if (extracted.expiry_date) {
    const parsed = new Date(extracted.expiry_date);
    if (!Number.isNaN(parsed.getTime())) dateValid = parsed > new Date();
  }

  const consistencyStatus =
    govResult.government_record_found &&
    govResult.name_match &&
    govResult.dob_match &&
    dateValid &&
    !duplicateInHistory &&
    !govResult.duplicate_detected
      ? 'VERIFIED'
      : 'INCONSISTENT';

  return {
    // Phase-9 canonical shape — this is what Layer 5 and any new UI should read from.
    government_match: govResult,

    // --- Legacy adapter shapes below, for the existing result-page UI -------------
    data_consistency: {
      name_match: govResult.name_match,
      dob_match: govResult.dob_match,
      document_number_match: govResult.document_number_match,
      date_valid: dateValid,
      duplicate_detected: duplicateInHistory || govResult.duplicate_detected,
      status: consistencyStatus,
      explanation: govResult.government_record_found
        ? `Compared OCR-extracted fields against the matched government record (${govResult.match_method || 'unknown method'}).`
        : govResult.explanation,
    },
    issuer_verification: {
      issuer_found: govResult.government_record_found,
      name_match: govResult.name_match,
      dob_match: govResult.dob_match,
      document_status: govResult.document_status,
      issuer_name: 'Synthetic Government Identity Source (API 2)',
      person_id: govResult.person_id,
      document_id: govResult.document_id,
      confidence: govResult.confidence,
      disclaimer: 'Synthetic/demo government data source — SIH MVP, not a live government database.',
    },
  };
}
